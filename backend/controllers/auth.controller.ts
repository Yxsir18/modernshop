import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';
import { User } from '../../src/types';
import { validateUserSchema } from '../models/user.model';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createAccessToken, createRefreshToken, generateTokenId, verifyRefreshToken, UserRole } from '../auth/tokens';
import { getRefreshSessionByJti, initRefreshTokenIndexes, revokeAllUserRefreshSessions, revokeRefreshSession, storeRefreshSession } from '../auth/refreshTokenStore';
import { sendPasswordResetEmail, initEmailTransport } from '../utils/email';

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('ms_refresh', refreshToken, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('ms_refresh', { path: '/api/auth' });
  res.clearCookie('ms_access', { path: '/' });
}

async function verifyPasswordWithLegacyUpgrade(args: { user: any; password: string }): Promise<boolean> {
  const stored = String(args.user.passwordHash || '');
  const plain = args.password;

  // Proper bcrypt
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }

  // Legacy "hash_" format: allow ONLY in non-production, then upgrade
  if (!isProd() && stored.startsWith('hash_')) {
    const ok = stored === `hash_${plain}`;
    if (ok) {
      const nextHash = await bcrypt.hash(plain, 12);
      args.user.passwordHash = nextHash;
    }
    return ok;
  }

  return false;
}

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, phone, password, referralCode, role } = req.body;

  if (!name || !email || !phone || !password) {
    return sendError(res, 400, 'Name, email, phone, and password properties are required.');
  }

  const users = dbConnection.getCollection('users');
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return sendError(res, 400, 'A profile is already configured with this email address.');
  }
  if (users.some(u => u.phone === phone)) {
    return sendError(res, 400, 'A profile is already configured with this phone number.');
  }

  // Handle referrals
  let referredBy: string | undefined;
  if (referralCode) {
    const referrer = users.find(u => u.referralCode.toUpperCase() === referralCode.toUpperCase());
    if (referrer) {
      referredBy = referrer.id;
      // Multi-tier reward: Referrer earns 50 loyalty points (1:1 ratio)
      const oldPoints = referrer.loyaltyPoints;
      referrer.loyaltyPoints += 50;
      console.log(`[LOYALTY POINTS] Registration referral bonus - referrerId: ${referrer.id}, oldPoints: ${oldPoints}, newPoints: ${referrer.loyaltyPoints}, bonus: 50`);
    }
  }

  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  const referralSeed = `MS${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newUser: User = {
    id: newId,
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash: await bcrypt.hash(password, 12),
    role: role || 'customer',
    loyaltyPoints: referredBy ? 10 : 5, // Welcome bonus: 5 points, referral bonus: 10 points (1:1 ratio)
    referralCode: referralSeed,
    referredBy,
    addresses: []
  };
  console.log(`[LOYALTY POINTS] Registration welcome bonus - userId: ${newId}, loyaltyPoints: ${newUser.loyaltyPoints}, referredBy: ${referredBy}`);

  validateUserSchema(newUser);

  users.push(newUser);
  dbConnection.updateCollection('users', users);

  // Trigger automated notification (Welcome message)
  const notifs = dbConnection.getCollection('notifications');
  notifs.push({
    id: `not_${Date.now()}`,
    userId: newId,
    title: 'Sovereign Clearance Established',
    message: `Greetings ${name}! Your account has been initialized. Take advantage of ${referredBy ? 10 : 5} Loyalty Points already present in your wallet! (1 point = ₹1 discount)`,
    type: 'promotion',
    date: new Date().toISOString(),
    read: false
  });
  dbConnection.updateCollection('notifications', notifs);

  // Ensure refresh token indexes exist
  await initRefreshTokenIndexes();
  const refreshId = generateTokenId();
  const refreshToken = createRefreshToken({ userId: newUser.id, tokenId: refreshId });
  await storeRefreshSession({
    userId: newUser.id,
    jti: refreshId,
    userAgent: req.headers['user-agent'] as string | undefined,
    ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
  });

  const accessToken = createAccessToken({ userId: newUser.id, role: newUser.role as UserRole, email: newUser.email });
  setRefreshCookie(res, refreshToken);

  return sendResponse(res, 201, true, 'Profile registered successfully.', {
    token: accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      loyaltyPoints: newUser.loyaltyPoints,
      referralCode: newUser.referralCode,
      addresses: newUser.addresses
    }
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, phone, password, rememberMe } = req.body;

  if ((!email && !phone) || !password) {
    return sendError(res, 400, 'Email or phone along with password are required.');
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => 
    (email && u.email.toLowerCase() === email.toLowerCase()) || 
    (phone && u.phone === phone)
  );

  if (!user) {
    return sendError(res, 401, 'No profile registered with these credentials.');
  }

  const ok = await verifyPasswordWithLegacyUpgrade({ user, password: String(password) });
  if (!ok) {
    return sendError(res, 401, 'Credentials authentication denied.');
  }

  // Persist any legacy upgrade
  dbConnection.updateCollection('users', users);

  await initRefreshTokenIndexes();
  const refreshId = generateTokenId();
  const refreshToken = createRefreshToken({ userId: user.id, tokenId: refreshId });
  await storeRefreshSession({
    userId: user.id,
    jti: refreshId,
    userAgent: req.headers['user-agent'] as string | undefined,
    ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
  });

  const accessToken = createAccessToken({ userId: user.id, role: user.role as UserRole, email: user.email });

  // Refresh cookie: extend maxAge if rememberMe
  if (rememberMe) {
    res.cookie('ms_refresh', refreshToken, {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
  } else {
    setRefreshCookie(res, refreshToken);
  }

  return sendResponse(res, 200, true, 'Cleared for security passage.', {
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      referralCode: user.referralCode,
      addresses: user.addresses,
      avatar: user.avatar
    }
  });
};

export const logoutUser = async (req: Request, res: Response) => {
  const rt = (req as any).cookies?.ms_refresh;
  if (rt) {
    try {
      const decoded = verifyRefreshToken(rt);
      await revokeRefreshSession({ jti: decoded.jti });
    } catch {
      // ignore
    }
  }
  clearAuthCookies(res);
  return sendResponse(res, 200, true, 'Cleared from current session successfully.');
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, 400, 'Valid email required.');
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Always respond 200 to avoid account enumeration
  if (user) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    (user as any).resetPasswordOtp = otpHash;
    (user as any).resetPasswordExpiry = expiry.toISOString();
    dbConnection.updateCollection('users', users);

    // Try to send email
    const emailSent = await sendPasswordResetEmail(email, otp);

    // In dev mode, if email fails or not configured, return OTP for testing
    if (!isProd() && !emailSent) {
      return sendResponse(res, 200, true, 'OTP generated (dev-only return).', {
        otp: otp
      });
    }

    if (emailSent) {
      return sendResponse(res, 200, true, 'OTP has been sent to your email.');
    }
  }

  return sendResponse(res, 200, true, 'If the account exists, OTP has been sent.');
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return sendError(res, 400, 'Email, OTP, and new password are required elements.');
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return sendError(res, 404, 'User profile is absent from our directories.');
  }

  const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  const storedHash = (user as any).resetPasswordOtp;
  const storedExpiry = (user as any).resetPasswordExpiry;
  if (!storedHash || storedHash !== otpHash) {
    return sendError(res, 400, 'Invalid or expired OTP');
  }
  if (storedExpiry && new Date(storedExpiry).getTime() < Date.now()) {
    return sendError(res, 400, 'OTP has expired');
  }

  user.passwordHash = await bcrypt.hash(String(password), 12);
  (user as any).resetPasswordOtp = undefined;
  (user as any).resetPasswordExpiry = undefined;
  dbConnection.updateCollection('users', users);

  // Invalidate all refresh sessions for this user
  await revokeAllUserRefreshSessions(user.id);
  clearAuthCookies(res);

  return sendResponse(res, 200, true, 'User password reset successfully.');
};

export const changePassword = async (req: any, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return sendError(res, 400, 'Current and new passwords must be provided.');
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return sendError(res, 404, 'Account context not recognized.');
  }

  const ok = await verifyPasswordWithLegacyUpgrade({ user, password: String(oldPassword) });
  if (!ok) {
    return sendError(res, 400, 'The existing password you entered is incorrect.');
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  dbConnection.updateCollection('users', users);

  await revokeAllUserRefreshSessions(user.id);
  clearAuthCookies(res);

  return sendResponse(res, 200, true, 'Sovereign password updated successfully.');
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const rt = (req as any).cookies?.ms_refresh;
  if (!rt) return sendError(res, 401, 'Refresh token not found.');

  try {
    await initRefreshTokenIndexes();
    const decoded = verifyRefreshToken(rt);
    const existing = await getRefreshSessionByJti(decoded.jti);
    if (!existing || existing.revokedAt) {
      clearAuthCookies(res);
      return sendError(res, 401, 'Refresh token has been revoked.');
    }

    // Rotate
    const nextId = generateTokenId();
    const nextRefreshToken = createRefreshToken({ userId: decoded.sub, tokenId: nextId });
    await storeRefreshSession({
      userId: decoded.sub,
      jti: nextId,
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
    });
    await revokeRefreshSession({ jti: decoded.jti, replacedByJti: nextId });
    setRefreshCookie(res, nextRefreshToken);

    const users = dbConnection.getCollection('users');
    const user = users.find(u => u.id === decoded.sub);
    if (!user) return sendError(res, 401, 'Owner profile has been deleted or deactivated.');

    const accessToken = createAccessToken({ userId: user.id, role: user.role as UserRole, email: user.email });
    return sendResponse(res, 200, true, 'Access token refreshed.', {
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
        addresses: user.addresses,
        avatar: user.avatar
      }
    });
  } catch (e: any) {
    clearAuthCookies(res);
    return sendError(res, 401, 'Refresh token is invalid or expired.');
  }
};
