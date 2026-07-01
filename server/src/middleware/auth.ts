import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  username: string;
  characterId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET must be set in production!');
  }
  return secret || 'dev-secret-key';
};

export const JWT_SECRET = getJwtSecret();

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    (req as AuthenticatedRequest).user = decoded as JwtPayload;
    next();
  });
};
