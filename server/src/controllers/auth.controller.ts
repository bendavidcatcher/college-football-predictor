import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest, getUserId } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
    throw ApiError.badRequest('email, password and name are required');
  }
  const result = await authService.register(email, password, name);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw ApiError.badRequest('email and password are required');
  }
  const result = await authService.login(email, password);
  res.json(result);
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const user = await authService.getMe(getUserId(req));
  res.json({ user });
}
