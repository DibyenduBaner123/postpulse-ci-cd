import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../types/index.ts';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-post-composer-ci-cd-2026-key';
export const TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export function generateToken(user: Pick<User, 'id' | 'email' | 'name'> & { role?: 'user' | 'admin' }): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
