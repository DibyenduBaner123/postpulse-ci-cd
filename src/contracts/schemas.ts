import { z } from 'zod';

// Platform enum schema
export const SocialPlatformEnum = z.enum(['twitter', 'linkedin', 'facebook', 'instagram']);

// Health check schema
export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'ok', 'degraded']),
  version: z.string(),
  uptime: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  environment: z.string(),
  database: z.enum(['connected', 'in-memory', 'disconnected']),
  activeReleaseTrack: z.enum(['stable', 'canary']).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string().datetime(),
});

// Auth register schemas
export const RegisterRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterResponseSchema = z.object({
  token: z.string().min(10),
  user: UserSchema,
});

// Auth login schemas
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginResponseSchema = z.object({
  token: z.string().min(10),
  user: UserSchema,
});

// Post creation schema
export const PostCreateSchema = z.object({
  text: z.string(),
  platforms: z.array(SocialPlatformEnum).min(1, 'At least one platform is required'),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  platformCustomizations: z
    .record(
      SocialPlatformEnum,
      z.object({
        text: z.string().optional(),
      })
    )
    .optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

// Post item schema
export const PostItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  text: z.string(),
  platforms: z.array(SocialPlatformEnum),
  mediaUrls: z.array(z.string()),
  platformCustomizations: z
    .record(
      z.string(),
      z.object({
        text: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(['draft', 'scheduled', 'published']),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PostListResponseSchema = z.object({
  posts: z.array(PostItemSchema),
  total: z.number().nonnegative(),
});

// Generic API Error Schema
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.any()).optional(),
  code: z.string().optional(),
});

// Canary Status Schema
export const CanaryStatusResponseSchema = z.object({
  version: z.string(),
  activeReleaseTrack: z.enum(['stable', 'canary']),
  trafficSplitPercent: z.number().min(0).max(100),
  environment: z.string(),
  totalRequests: z.number().nonnegative(),
  canaryRequests: z.number().nonnegative(),
  stableRequests: z.number().nonnegative(),
  errorCount: z.number().nonnegative(),
  errorRate: z.number().min(0).max(1),
  health: z.enum(['healthy', 'degraded', 'unhealthy']),
  rollbackTriggered: z.boolean(),
});
