export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  charLimit: number;
  maxMedia: number;
  maxHashtags: number;
  requiresMedia: boolean;
  color: string;
  bgLight: string;
  badgeClass: string;
  tagline: string;
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    charLimit: 280,
    maxMedia: 4,
    maxHashtags: 10,
    requiresMedia: false,
    color: '#000000',
    bgLight: 'bg-zinc-100 dark:bg-zinc-800',
    badgeClass: 'bg-black text-white dark:bg-white dark:text-black',
    tagline: 'Concise thoughts, breaking news & quick takes',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    charLimit: 3000,
    maxMedia: 9,
    maxHashtags: 15,
    requiresMedia: false,
    color: '#0A66C2',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    badgeClass: 'bg-blue-600 text-white',
    tagline: 'Professional insights, leadership & business updates',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    charLimit: 5000,
    maxMedia: 10,
    maxHashtags: 20,
    requiresMedia: false,
    color: '#1877F2',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    badgeClass: 'bg-indigo-600 text-white',
    tagline: 'Community stories, announcements & group engagement',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    charLimit: 2200,
    maxMedia: 10,
    maxHashtags: 30,
    requiresMedia: true,
    color: '#E4405F',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    badgeClass: 'bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white',
    tagline: 'Visual storytelling, aesthetic photos & reels',
  },
};

export interface Post {
  id: string;
  userId: string;
  text: string;
  platforms: SocialPlatform[];
  mediaUrls: string[];
  platformCustomizations?: Partial<Record<SocialPlatform, { text?: string }>>;
  status: PostStatus;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ValidationIssue {
  platform?: SocialPlatform;
  field: string;
  message: string;
}

export interface PostValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
}

export interface CanaryStatus {
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
}
