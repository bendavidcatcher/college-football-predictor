import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/**
 * Requires a valid `Authorization: Bearer <jwt>` header and attaches the
 * authenticated user's id to the request.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }
  try {
    const { userId } = verifyToken(header.slice('Bearer '.length));
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
}

/** Returns the authenticated user id; only call behind requireAuth. */
export function getUserId(req: AuthenticatedRequest): number {
  if (typeof req.userId !== 'number') {
    throw ApiError.unauthorized();
  }
  return req.userId;
}
