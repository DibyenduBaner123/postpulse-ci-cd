import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from './db.ts';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  PostCreateSchema,
  HealthResponseSchema,
  CanaryStatusResponseSchema,
} from '../contracts/schemas.ts';
import { hashPassword, comparePassword, generateToken, extractBearerToken, verifyToken } from '../utils/auth.ts';
import { validatePost } from '../utils/postValidator.ts';
import { SocialPlatform } from '../types/index.ts';

export const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Track release version header
const APP_VERSION = process.env.APP_VERSION || '1.1.0-canary';
const RELEASE_TRACK = (process.env.RELEASE_TRACK as 'stable' | 'canary') || 'canary';

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-App-Version', APP_VERSION);
  res.setHeader('X-Release-Track', RELEASE_TRACK);
  next();
});

// Authentication middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
    return;
  }
};

// Optional auth helper (uses demo user if guest or demo token provided)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

/* ----------------------------------------------------
   API ROUTES
---------------------------------------------------- */

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy' as const,
    version: APP_VERSION,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'in-memory' as const,
    activeReleaseTrack: RELEASE_TRACK,
  };

  // Validate output against contract
  const validated = HealthResponseSchema.parse(healthData);
  res.status(200).json(validated);
});

// 2. Auth: Register
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  const parseResult = RegisterRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.issues,
    });
    return;
  }

  const { name, email, password } = parseResult.data;
  const existingUser = await db.findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ error: 'A user with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await db.createUser({ name, email, passwordHash, role: 'user' });
  const token = generateToken(user);

  res.status(201).json({
    token,
    user,
  });
});

// 3. Auth: Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const parseResult = LoginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.issues,
    });
    return;
  }

  const { email, password } = parseResult.data;
  const userWithHash = await db.findUserByEmail(email);
  if (!userWithHash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isMatch = await comparePassword(password, userWithHash.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { passwordHash: _, ...user } = userWithHash;
  const token = generateToken(user);

  res.status(200).json({
    token,
    user,
  });
});

// 4. Auth: Me
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.status(200).json({ user });
});

// 5. Posts: List
app.get('/api/posts', optionalAuth, async (req: AuthRequest, res: Response) => {
  // If user is authenticated, return user's posts, else return public/demo posts
  const posts = await db.getPosts(req.user?.id);
  res.status(200).json({
    posts,
    total: posts.length,
  });
});

// 6. Posts: Create
app.post('/api/posts', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parseResult = PostCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Schema validation failed',
      details: parseResult.error.issues,
    });
    return;
  }

  const { text, platforms, mediaUrls, platformCustomizations, scheduledAt } = parseResult.data;

  // Run business logic post validation (character limits, media requirements, hashtags)
  const validationResult = validatePost({
    text,
    platforms: platforms as SocialPlatform[],
    mediaUrls: mediaUrls || [],
    platformCustomizations,
    scheduledAt: scheduledAt || null,
  });

  if (!validationResult.isValid) {
    res.status(400).json({
      error: 'Post validation failed for one or more target platforms.',
      details: validationResult.errors,
    });
    return;
  }

  const userId = req.user?.id || 'user-demo-1';
  const status = scheduledAt ? 'scheduled' : 'published';

  const newPost = await db.createPost({
    userId,
    text,
    platforms: platforms as SocialPlatform[],
    mediaUrls: mediaUrls || [],
    platformCustomizations,
    status,
    scheduledAt: scheduledAt || null,
  });

  res.status(201).json(newPost);
});

// 7. Posts: Delete
app.delete('/api/posts/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id || 'user-demo-1';
  const success = await db.deletePost(id, userId);

  if (!success) {
    res.status(404).json({ error: 'Post not found or unauthorized to delete.' });
    return;
  }

  res.status(200).json({ success: true, message: 'Post deleted successfully.' });
});

// 8. Canary Status & Metrics
app.get('/api/canary/status', (req: Request, res: Response) => {
  const status = db.getCanaryStatus();
  const validated = CanaryStatusResponseSchema.parse(status);
  res.status(200).json(validated);
});

// 9. Canary Traffic Split Configuration
app.post('/api/canary/traffic-split', (req: Request, res: Response): void => {
  const { percentage } = req.body;
  if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
    res.status(400).json({ error: 'Percentage must be a number between 0 and 100.' });
    return;
  }

  db.setCanaryTrafficSplit(percentage);
  res.status(200).json({
    success: true,
    message: `Canary traffic split updated to ${percentage}%`,
    status: db.getCanaryStatus(),
  });
});

// 10. Canary Manual or Automated Rollback
app.post('/api/canary/rollback', (req: Request, res: Response) => {
  const { reason } = req.body || {};
  const result = db.triggerCanaryRollback(reason);
  res.status(200).json({
    ...result,
    status: db.getCanaryStatus(),
  });
});

// 11. Canary Traffic Simulation
app.post('/api/canary/simulate-traffic', (req: Request, res: Response): void => {
  const { requestCount = 50, errorSpike = false } = req.body || {};
  const currentSplit = db.getCanaryStatus().trafficSplitPercent;

  for (let i = 0; i < requestCount; i++) {
    // Determine whether this simulated request hit canary based on split
    const hitCanary = Math.random() * 100 < currentSplit;
    // Simulate error rate: normal is 0.5%, error spike on canary is 25%
    const isError = hitCanary && errorSpike ? Math.random() < 0.25 : Math.random() < 0.005;
    db.recordCanaryRequest(hitCanary, isError);
  }

  const updatedStatus = db.getCanaryStatus();

  // If error rate exceeded 5% during simulation, auto trigger rollback
  let autoRollback = false;
  if (updatedStatus.errorRate > 0.05 && !updatedStatus.rollbackTriggered) {
    db.triggerCanaryRollback(`Simulated error rate spike (${(updatedStatus.errorRate * 100).toFixed(1)}%) exceeded 5% threshold.`);
    autoRollback = true;
  }

  res.status(200).json({
    success: true,
    simulatedRequests: requestCount,
    autoRollbackTriggered: autoRollback,
    status: db.getCanaryStatus(),
  });
});
