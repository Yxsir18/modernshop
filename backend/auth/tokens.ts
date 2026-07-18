import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import crypto from 'crypto';

export type UserRole = 'customer' | 'admin' | 'super-admin' | 'guest';

export interface AccessTokenPayload {
  sub: string; // userId
  role: UserRole;
  email: string;
  typ: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // refresh token id (for rotation/invalidation)
  typ: 'refresh';
}

function getAccessSecret(): string {
  const configured = process.env.JWT_ACCESS_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  // Dev fallback (ephemeral)
  if (!(globalThis as any).__ms_access_secret) {
    (globalThis as any).__ms_access_secret = crypto.randomBytes(48).toString('hex');
  }
  return (globalThis as any).__ms_access_secret as string;
}

function getRefreshSecret(): string {
  const configured = process.env.JWT_REFRESH_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  // Dev fallback (ephemeral)
  if (!(globalThis as any).__ms_refresh_secret) {
    (globalThis as any).__ms_refresh_secret = crypto.randomBytes(48).toString('hex');
  }
  return (globalThis as any).__ms_refresh_secret as string;
}

export function createAccessToken(input: { userId: string; role: UserRole; email: string }): string {
  const expiresIn = (process.env.JWT_ACCESS_TTL || '15m') as SignOptions['expiresIn'];
  const payload: AccessTokenPayload = {
    sub: input.userId,
    role: input.role,
    email: input.email,
    typ: 'access'
  };
  return jwt.sign(payload, getAccessSecret() as Secret, { expiresIn });
}

export function createRefreshToken(input: { userId: string; tokenId: string }): string {
  const expiresIn = (process.env.JWT_REFRESH_TTL || '30d') as SignOptions['expiresIn'];
  const payload: RefreshTokenPayload = {
    sub: input.userId,
    jti: input.tokenId,
    typ: 'refresh'
  };
  return jwt.sign(payload, getRefreshSecret() as Secret, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret()) as any;
  if (!decoded || decoded.typ !== 'access') {
    throw new Error('Invalid access token type');
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, getRefreshSecret()) as any;
  if (!decoded || decoded.typ !== 'refresh' || !decoded.jti) {
    throw new Error('Invalid refresh token type');
  }
  return decoded as RefreshTokenPayload;
}

export function generateTokenId(): string {
  // Node 22 supports randomUUID
  return crypto.randomUUID();
}

export function sha256Base64Url(value: string): string {
  const h = crypto.createHash('sha256').update(value).digest('base64');
  // base64url
  return h.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
