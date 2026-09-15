import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthPayload } from '../auth/jwt';
import { db } from '../database/db';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
  organizationId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      const customOrg = req.headers['x-organization-id'] as string;
      if (customOrg && (payload.role === 'Super Admin' || payload.role === 'Security Admin')) {
        req.organizationId = customOrg;
      } else {
        req.organizationId = payload.organizationId;
      }
    }
  }

  // Fallback organizationId if unauthenticated (defaults to primary tenant in DB)
  if (!req.organizationId) {
    const org = req.headers['x-organization-id'] as string;
    req.organizationId = org || 'org_mandiri_01';
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'Super Admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: role '${req.user.role}' lacks required authorization` });
  };
}
