import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.ts';
import { db } from '../../src/server/db.ts';

describe('Integration: Express API & Auth Endpoints', () => {
  beforeEach(() => {
    // Reset database to initial state before each test for determinism
    db.resetForTesting();
  });

  describe('GET /api/health', () => {
    it('returns 200 and healthy status response with version headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.headers['x-app-version']).toBeDefined();
      expect(response.headers['x-release-track']).toBeDefined();
    });
  });

  describe('Auth Endpoints (/api/auth)', () => {
    it('registers a new user and returns 201 with auth token', async () => {
      const newUser = {
        name: 'Bob Builder',
        email: 'bob@example.com',
        password: 'SecurePassword123!',
      };

      const res = await request(app).post('/api/auth/register').send(newUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(newUser.email);
      expect(res.body.user.name).toBe(newUser.name);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('rejects registration with invalid email or short password (400 Bad Request)', async () => {
      const invalidData = {
        name: 'A',
        email: 'not-an-email',
        password: '123',
      };

      const res = await request(app).post('/api/auth/register').send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('rejects duplicate registration with 409 Conflict', async () => {
      // demo@postcomposer.io is already seeded in the default state
      const duplicateUser = {
        name: 'DevOps Duplicate',
        email: 'demo@postcomposer.io',
        password: 'Password123!',
      };

      const res = await request(app).post('/api/auth/register').send(duplicateUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('logs in successfully with valid credentials (200 OK)', async () => {
      const credentials = {
        email: 'demo@postcomposer.io',
        password: 'Password123!',
      };

      const res = await request(app).post('/api/auth/login').send(credentials);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(credentials.email);
    });

    it('rejects login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'demo@postcomposer.io',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('protects /api/auth/me requiring valid Bearer token', async () => {
      // 1. Without token: 401
      const unauthRes = await request(app).get('/api/auth/me');
      expect(unauthRes.status).toBe(401);

      // 2. With valid login token: 200
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'demo@postcomposer.io',
        password: 'Password123!',
      });

      const token = loginRes.body.token;
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('demo@postcomposer.io');
    });
  });

  describe('Post Endpoints (/api/posts)', () => {
    it('fetches existing posts list (200 OK)', async () => {
      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });

    it('creates a new post when input is valid', async () => {
      const newPost = {
        text: 'Integration testing with Supertest and Vitest! #cicd',
        platforms: ['twitter', 'linkedin'],
        mediaUrls: ['https://example.com/test.png'],
      };

      const res = await request(app).post('/api/posts').send(newPost);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe(newPost.text);
      expect(res.body.platforms).toEqual(newPost.platforms);
      expect(res.body.status).toBe('published');
    });

    it('rejects post creation if Twitter character limit is exceeded', async () => {
      const longPost = {
        text: 'x'.repeat(300),
        platforms: ['twitter'],
      };

      const res = await request(app).post('/api/posts').send(longPost);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Post validation failed');
    });

    it('rejects post creation if Instagram is selected without media', async () => {
      const igPostWithoutMedia = {
        text: 'A post intended for Instagram with no photos attached',
        platforms: ['instagram'],
        mediaUrls: [],
      };

      const res = await request(app).post('/api/posts').send(igPostWithoutMedia);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Post validation failed');
      expect(res.body.details.some((d: any) => d.platform === 'instagram')).toBe(true);
    });

    it('deletes an existing post successfully', async () => {
      // Create first
      const createRes = await request(app).post('/api/posts').send({
        text: 'Post to delete',
        platforms: ['twitter'],
      });
      const postId = createRes.body.id;

      // Delete
      const deleteRes = await request(app).delete(`/api/posts/${postId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify deletion
      const deleteAgainRes = await request(app).delete(`/api/posts/${postId}`);
      expect(deleteAgainRes.status).toBe(404);
    });
  });

  describe('Canary Simulation Endpoints (/api/canary)', () => {
    it('returns canary deployment status and metrics', async () => {
      const res = await request(app).get('/api/canary/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('trafficSplitPercent');
      expect(res.body).toHaveProperty('errorRate');
      expect(res.body).toHaveProperty('health');
    });

    it('allows updating the traffic split percentage', async () => {
      const res = await request(app).post('/api/canary/traffic-split').send({ percentage: 25 });

      expect(res.status).toBe(200);
      expect(res.body.status.trafficSplitPercent).toBe(25);
    });

    it('triggers manual canary rollback successfully', async () => {
      const res = await request(app).post('/api/canary/rollback').send({ reason: 'Manual drill test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.activeTrafficSplitPercent).toBe(0);
      expect(res.body.status.rollbackTriggered).toBe(true);
    });
  });
});
