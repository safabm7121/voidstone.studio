import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 Auth Header:', authHeader);
  console.log('🔍 Token extracted:', token ? token.substring(0, 20) + '...' : 'MISSING');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };
    console.log(' Token verified successfully:', { userId: decoded.userId, role: decoded.role });
    req.user = decoded;
    next();
  } catch (error) {
    // Type guard to handle unknown error type
    if (error instanceof Error) {
      console.error('❌ JWT Verification Error:', {
        name: error.name,
        message: error.message,
        token: token.substring(0, 20) + '...'
      });
    } else {
      console.error('❌ Unknown JWT Verification Error:', error);
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};