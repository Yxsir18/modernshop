import { Request, Response, NextFunction } from 'express';
import { dbConnection } from '../config/db';
import { sendError } from '../utils/response';
import { verifyAccessToken, UserRole } from '../auth/tokens';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies && (req as any).cookies.ms_access) {
    token = (req as any).cookies.ms_access;
  }

  if (!token) {
    return sendError(res, 401, 'Clearance denied. Secure session token not discovered.');
  }

  let payload: { sub: string; role: UserRole; email: string };
  try {
    const decoded = verifyAccessToken(token);
    payload = { sub: decoded.sub, role: decoded.role, email: decoded.email };
  } catch (e) {
    return sendError(res, 401, 'Mismatched or stale session token.');
  }

  // Cross-reference user inside dbConnection
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === payload.sub);

  if (!user) {
    return sendError(res, 401, 'Owner profile has been deleted or deactivated.');
  }

  req.user = {
    id: user.id,
    role: (user.role as UserRole) || payload.role,
    email: user.email
  };

  next();
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication is required first.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Sovereign profile privileges insufficient. Roles allowed: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies && (req as any).cookies.ms_access) {
    token = (req as any).cookies.ms_access;
  }

  // If no token, proceed without user (guest mode)
  if (!token) {
    req.user = { id: 'guest', role: 'guest' as UserRole, email: '' };
    return next();
  }

  // If token exists, try to validate it
  let payload: { sub: string; role: UserRole; email: string };
  try {
    const decoded = verifyAccessToken(token);
    payload = { sub: decoded.sub, role: decoded.role, email: decoded.email };
  } catch (e) {
    // Invalid token, proceed as guest
    req.user = { id: 'guest', role: 'guest' as UserRole, email: '' };
    return next();
  }

  // Cross-reference user inside dbConnection
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === payload.sub);

  if (!user) {
    // User not found, proceed as guest
    req.user = { id: 'guest', role: 'guest' as UserRole, email: '' };
    return next();
  }

  req.user = {
    id: user.id,
    role: (user.role as UserRole) || payload.role,
    email: user.email
  };

  next();
};
