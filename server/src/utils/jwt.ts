import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError';

interface TokenPayload {
  userId: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to server/.env');
  }
  return secret;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId } satisfies TokenPayload, getSecret(), {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === 'object' && typeof decoded.userId === 'number') {
      return { userId: decoded.userId };
    }
    throw ApiError.unauthorized('Invalid token');
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid or expired token');
  }
}
