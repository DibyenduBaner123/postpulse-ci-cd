import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import { app } from '../../src/server/app.ts';
import {
  HealthResponseSchema,
  LoginResponseSchema,
  RegisterResponseSchema,
  PostListResponseSchema,
  PostItemSchema,
  CanaryStatusResponseSchema,
} from '../../src/contracts/schemas.ts';

describe('Contract: API Schema & Contract Testing', () => {
  it('GET /api/health satisfies HealthResponseSchema contract', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    // Validate against contract schema
    const parsed = HealthResponseSchema.safeParse(res.body);
    if (!parsed.success) {
      console.error('Contract Violation in /api/health:', parsed.error);
    }
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(['healthy', 'ok', 'degraded']).toContain(parsed.data.status);
      expect(typeof parsed.data.uptime).toBe('number');
      expect(typeof parsed.data.version).toBe('string');
      expect(new Date(parsed.data.timestamp).getTime()).not.toBeNaN();
    }
  });

  it('POST /api/auth/login satisfies LoginResponseSchema contract on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'demo@postcomposer.io',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);

    const parsed = LoginResponseSchema.safeParse(res.body);
    if (!parsed.success) {
      console.error('Contract Violation in /api/auth/login:', parsed.error);
    }
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.token.length).toBeGreaterThan(10);
      expect(parsed.data.user.email).toBe('demo@postcomposer.io');
    }
  });

  it('POST /api/auth/register satisfies RegisterResponseSchema contract', async () => {
    const uniqueEmail = `test-contract-${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Contract User',
      email: uniqueEmail,
      password: 'Password123!',
    });

    expect(res.status).toBe(201);

    const parsed = RegisterResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.user.email).toBe(uniqueEmail);
      expect(parsed.data.user.name).toBe('Contract User');
    }
  });

  it('GET /api/posts satisfies PostListResponseSchema contract', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);

    const parsed = PostListResponseSchema.safeParse(res.body);
    if (!parsed.success) {
      console.error('Contract Violation in /api/posts:', parsed.error);
    }
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Array.isArray(parsed.data.posts)).toBe(true);
      expect(parsed.data.total).toBe(parsed.data.posts.length);
    }
  });

  it('POST /api/posts satisfies PostItemSchema contract upon creation', async () => {
    const res = await request(app).post('/api/posts').send({
      text: 'Contract verified post content for multi-platform delivery! #testing',
      platforms: ['twitter', 'facebook'],
      mediaUrls: ['https://example.com/mock.jpg'],
    });

    expect(res.status).toBe(201);

    const parsed = PostItemSchema.safeParse(res.body);
    if (!parsed.success) {
      console.error('Contract Violation in POST /api/posts:', parsed.error);
    }
    expect(parsed.success).toBe(true);
  });

  it('GET /api/canary/status satisfies CanaryStatusResponseSchema contract', async () => {
    const res = await request(app).get('/api/canary/status');

    expect(res.status).toBe(200);

    const parsed = CanaryStatusResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });

  /* -------------------------------------------------------------------------
     NEGATIVE CONTRACT BREAKING SIMULATION:
     Ensures that if an API payload violates the agreed schema, the test FAILS!
  ------------------------------------------------------------------------- */
  it('detects contract violations when backend payload violates schema', () => {
    // 1. Missing required 'version' and invalid status type in HealthResponse
    const brokenHealthPayload = {
      status: 'super-awesome-unknown-status', // Not in ['healthy', 'ok', 'degraded']
      uptime: 'not-a-number', // string instead of number
      // missing timestamp
      environment: 'prod',
    };

    const healthCheck = HealthResponseSchema.safeParse(brokenHealthPayload);
    expect(healthCheck.success).toBe(false);
    if (!healthCheck.success) {
      expect(healthCheck.error.issues.some((e: any) => e.path.includes('status'))).toBe(true);
      expect(healthCheck.error.issues.some((e: any) => e.path.includes('uptime'))).toBe(true);
    }

    // 2. Breaking Post item contract (missing id, invalid platform name)
    const brokenPostPayload = {
      text: 'Missing fields post',
      platforms: ['myspace'], // Unsupported platform
    };

    const postCheck = PostItemSchema.safeParse(brokenPostPayload);
    expect(postCheck.success).toBe(false);
  });
});
