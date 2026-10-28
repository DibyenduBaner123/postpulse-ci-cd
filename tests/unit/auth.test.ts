import { describe, it, expect } from 'vitest';
import {
  generateToken,
  verifyToken,
  extractBearerToken,
  hashPassword,
  comparePassword,
} from '../../src/utils/auth.ts';

describe('Unit: Authentication & Authorization helpers', () => {
  const mockUser = {
    id: 'user-unit-123',
    name: 'Alice DevOps',
    email: 'alice@example.com',
    role: 'user' as const,
  };

  it('generates a valid JWT token that can be decoded', () => {
    const token = generateToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.name).toBe(mockUser.name);
    expect(decoded.role).toBe('user');
  });

  it('throws an error when verifying an invalid or tampered token', () => {
    const token = generateToken(mockUser);
    const tamperedToken = token + 'tampered';
    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it('extracts Bearer token from authorization header correctly', () => {
    expect(extractBearerToken('Bearer my-valid-token-123')).toBe('my-valid-token-123');
    expect(extractBearerToken('bearer lower-case-bearer')).toBe('lower-case-bearer');
    expect(extractBearerToken('BEARER upper-case-bearer')).toBe('upper-case-bearer');
  });

  it('returns null for malformed or missing authorization headers', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerToken('BearerOnlyWithoutToken')).toBeNull();
  });

  it('hashes passwords securely and verifies them with bcrypt', async () => {
    const plain = 'SecretPassword2026!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(plain, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });
});
