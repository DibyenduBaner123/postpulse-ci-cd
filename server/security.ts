import crypto from 'crypto';
import { User, UserRole } from './types.js';

// Secret keys for JWT and AES-256-GCM
const JWT_SECRET = process.env.JWT_SECRET;
const AES_ENCRYPTION_KEY = process.env.AES_SECRET_KEY;
if (!JWT_SECRET || !AES_ENCRYPTION_KEY) {
  throw new Error('JWT_SECRET and AES_SECRET_KEY must be set in the environment');
}
if (Buffer.byteLength(AES_ENCRYPTION_KEY, 'utf8') !== 32) {
  throw new Error('AES_SECRET_KEY must be exactly 32 bytes');
}
const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory store for active refresh tokens
const activeRefreshTokens = new Map<string, { userId: string; expiresAt: number }>();

// Simple PBKDF2 Password Hashing (Cryptographically robust standard in Node)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const calculatedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(calculatedHash));
}

// AES-256-GCM Encryption / Decryption for Third-Party Social API Credentials
export function encryptCredentials(plainText: string): string {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(AES_ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:cipherHex
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptCredentials(encryptedBlob: string): string {
  try {
    const parts = encryptedBlob.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted credential blob format');
    const [ivHex, authTagHex, cipherHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(AES_ENCRYPTION_KEY), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return '[ENCRYPTED_CREDENTIAL_ERROR]';
  }
}

// Lightweight standard HMAC-SHA256 JWT implementation
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function generateAccessToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

export function generateRefreshToken(user: User): string {
  const token = crypto.randomBytes(40).toString('hex');
  activeRefreshTokens.set(token, {
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRY_MS,
  });
  return token;
}

export function verifyRefreshToken(token: string): string | null {
  const session = activeRefreshTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeRefreshTokens.delete(token);
    return null;
  }
  return session.userId;
}

export function revokeRefreshToken(token: string): void {
  activeRefreshTokens.delete(token);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [base64Header, base64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload: JwtPayload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}
