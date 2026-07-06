import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import { AuthUserDto } from '../types/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthResult {
  token: string;
  user: AuthUserDto;
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  if (!EMAIL_REGEX.test(email)) throw ApiError.badRequest('A valid email is required');
  if (!password || password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }
  if (!name || !name.trim()) throw ApiError.badRequest('Name is required');

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash, name: name.trim() },
  });

  return { token: signToken(user.id), user: toAuthUser(user) };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  return { token: signToken(user.id), user: toAuthUser(user) };
}

export async function getMe(userId: number): Promise<AuthUserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  return toAuthUser(user);
}

function toAuthUser(user: { id: number; email: string; name: string }): AuthUserDto {
  return { id: user.id, email: user.email, name: user.name };
}
