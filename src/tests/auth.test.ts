import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateAccessToken, verifyAccessToken, encryptCredentials, decryptCredentials } from '../../server/security';
import { User } from '../../server/types';

describe('Security & Cryptography Module', () => {
  it('should hash and verify passwords using PBKDF2/BCrypt equivalence', () => {
    const password = 'Pulse123!';
    const hash = hashPassword(password);
    expect(hash).toContain(':');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPass', hash)).toBe(false);
  });

  it('should encrypt and decrypt sensitive social credentials with AES-256-GCM', () => {
    const rawToken = 'twitter_oauth_secret_access_token_991823';
    const encrypted = encryptCredentials(rawToken);

    // Format must be IV:Tag:Cipher
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);

    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it('should sign and verify stateless JWT tokens with role claims', () => {
    const mockUser: User = {
      id: 'usr_test_101',
      name: 'Test Administrator',
      email: 'admin@postpulse.io',
      role: 'ADMIN',
      passwordHash: 'dummy',
      department: 'Engineering',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const token = generateAccessToken(mockUser);
    expect(token.split('.').length).toBe(3);

    const payload = verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(mockUser.id);
    expect(payload?.role).toBe('ADMIN');
    expect(payload?.email).toBe('admin@postpulse.io');
  });
});
