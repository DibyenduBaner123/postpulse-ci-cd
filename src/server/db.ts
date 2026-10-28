import { Post, User, SocialPlatform, CanaryStatus } from '../types/index.ts';
import bcrypt from 'bcryptjs';

// Pre-seeded hashed password for 'Password123!'
const DEMO_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

export interface DatabaseState {
  users: Map<string, User & { passwordHash: string }>;
  posts: Map<string, Post>;
  canaryMetrics: {
    version: string;
    activeReleaseTrack: 'stable' | 'canary';
    trafficSplitPercent: number;
    environment: string;
    totalRequests: number;
    canaryRequests: number;
    stableRequests: number;
    errorCount: number;
    errorRate: number;
    health: 'healthy' | 'degraded' | 'unhealthy';
    rollbackTriggered: boolean;
  };
}

const DEFAULT_STATE = (): DatabaseState => {
  const users = new Map<string, User & { passwordHash: string }>();
  const posts = new Map<string, Post>();

  const demoUser: User & { passwordHash: string } = {
    id: 'user-demo-1',
    name: 'DevOps Engineer',
    email: 'demo@postcomposer.io',
    role: 'user',
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  };
  users.set(demoUser.email.toLowerCase(), demoUser);

  const initialPosts: Post[] = [
    {
      id: 'post-1',
      userId: demoUser.id,
      text: 'Deploying our new multi-stage Docker container with automated Canary release! #devops #cicd #docker',
      platforms: ['twitter', 'linkedin'],
      mediaUrls: ['https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80'],
      status: 'published',
      createdAt: new Date('2026-10-25T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-25T10:00:00.000Z').toISOString(),
    },
    {
      id: 'post-2',
      userId: demoUser.id,
      text: 'Continuous Integration with Contract Testing ensures our Vite frontend and Express microservices never drift out of sync. #testing #vitest #contracttesting',
      platforms: ['linkedin', 'facebook', 'instagram'],
      mediaUrls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'],
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date('2026-10-26T14:30:00.000Z').toISOString(),
      updatedAt: new Date('2026-10-26T14:30:00.000Z').toISOString(),
    },
  ];

  initialPosts.forEach((p) => posts.set(p.id, p));

  return {
    users,
    posts,
    canaryMetrics: {
      version: process.env.APP_VERSION || '1.1.0-canary',
      activeReleaseTrack: (process.env.RELEASE_TRACK as 'stable' | 'canary') || 'canary',
      trafficSplitPercent: parseInt(process.env.CANARY_TRAFFIC_SPLIT || '10', 10),
      environment: process.env.NODE_ENV || 'development',
      totalRequests: 1420,
      canaryRequests: 142,
      stableRequests: 1278,
      errorCount: 2,
      errorRate: 0.0014,
      health: 'healthy',
      rollbackTriggered: false,
    },
  };
};

let dbState = DEFAULT_STATE();

export const db = {
  resetForTesting() {
    dbState = DEFAULT_STATE();
  },

  async findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    return dbState.users.get(email.toLowerCase()) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    for (const user of dbState.users.values()) {
      if (user.id === id) {
        const { passwordHash: _, ...rest } = user;
        return rest;
      }
    }
    return null;
  },

  async createUser(userData: { name: string; email: string; passwordHash: string; role?: 'user' | 'admin' }): Promise<User> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User & { passwordHash: string } = {
      id,
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role || 'user',
      passwordHash: userData.passwordHash,
      createdAt: now,
    };
    dbState.users.set(newUser.email, newUser);
    const { passwordHash: _, ...user } = newUser;
    return user;
  },

  async getPosts(userId?: string): Promise<Post[]> {
    const list = Array.from(dbState.posts.values());
    if (userId) {
      return list.filter((p) => p.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPostById(id: string): Promise<Post | null> {
    return dbState.posts.get(id) || null;
  },

  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newPost: Post = {
      ...postData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    dbState.posts.set(id, newPost);
    return newPost;
  },

  async deletePost(id: string, userId: string): Promise<boolean> {
    const post = dbState.posts.get(id);
    if (!post || post.userId !== userId) {
      return false;
    }
    return dbState.posts.delete(id);
  },

  getCanaryStatus(): CanaryStatus {
    return { ...dbState.canaryMetrics };
  },

  recordCanaryRequest(isTrackCanary: boolean, isError = false) {
    dbState.canaryMetrics.totalRequests += 1;
    if (isTrackCanary) {
      dbState.canaryMetrics.canaryRequests += 1;
    } else {
      dbState.canaryMetrics.stableRequests += 1;
    }

    if (isError) {
      dbState.canaryMetrics.errorCount += 1;
    }

    dbState.canaryMetrics.errorRate =
      dbState.canaryMetrics.totalRequests > 0
        ? parseFloat((dbState.canaryMetrics.errorCount / dbState.canaryMetrics.totalRequests).toFixed(4))
        : 0;

    // Automatic health evaluation
    if (dbState.canaryMetrics.errorRate > 0.05) {
      dbState.canaryMetrics.health = 'unhealthy';
    } else if (dbState.canaryMetrics.errorRate > 0.02) {
      dbState.canaryMetrics.health = 'degraded';
    } else {
      dbState.canaryMetrics.health = 'healthy';
    }
  },

  setCanaryTrafficSplit(percent: number) {
    dbState.canaryMetrics.trafficSplitPercent = Math.max(0, Math.min(100, percent));
    dbState.canaryMetrics.rollbackTriggered = false;
  },

  triggerCanaryRollback(reason = 'Error rate threshold exceeded (> 5%)') {
    dbState.canaryMetrics.trafficSplitPercent = 0;
    dbState.canaryMetrics.rollbackTriggered = true;
    dbState.canaryMetrics.activeReleaseTrack = 'stable';
    dbState.canaryMetrics.health = 'healthy';
    return {
      success: true,
      message: `Canary rolled back successfully to stable track. Reason: ${reason}`,
      activeTrafficSplitPercent: 0,
    };
  },
};
