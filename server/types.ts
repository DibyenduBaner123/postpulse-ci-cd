export type UserRole = 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  department: string;
  isActive: boolean;
}

export type SocialPlatformId = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'youtube';

export interface SocialPlatformConfig {
  id: SocialPlatformId;
  name: string;
  icon: string;
  color: string;
  characterLimit: number;
  maxMediaCount: number;
  mediaRequired: boolean;
  maxHashtags: number;
  supportsLinks: boolean;
  linkCountsAgainstLength: boolean;
  allowedMediaTypes: ('image' | 'video' | 'gif')[];
}

export interface ConnectedAccount {
  id: string;
  platformId: SocialPlatformId;
  accountName: string;
  handle: string;
  avatarUrl: string;
  connectedAt: string;
  encryptedCredentialBlob: string; // AES-GCM encrypted
  authStatus: 'CONNECTED' | 'EXPIRING_SOON' | 'ERROR';
  followersCount: number;
}

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  name: string;
  sizeBytes: number;
  dimensions?: { width: number; height: number };
}

export interface Post {
  id: string;
  content: string;
  platforms: SocialPlatformId[];
  media: MediaAsset[];
  hashtags: string[];
  links: string[];
  status: PostStatus;
  scheduledTime?: string; // ISO 8601
  publishedTime?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishResult?: {
    platformResults: Record<SocialPlatformId, { success: boolean; externalPostId?: string; error?: string }>;
  };
  analytics?: {
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    impressions: number;
  };
}

export interface Draft {
  id: string;
  content: string;
  platforms: SocialPlatformId[];
  media: MediaAsset[];
  hashtags: string[];
  links: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ScheduledPostEvent {
  id: string;
  postId: string;
  scheduledTime: string;
  platforms: SocialPlatformId[];
  authorId: string;
  correlationId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  targetEntity: string;
  entityId: string;
  details: string;
  correlationId: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface KafkaMessage {
  eventId: string;
  topic: 'post-scheduled' | 'post-published' | 'post-failed' | 'post-notifications' | 'post-dlq';
  partition: number;
  offset: number;
  timestamp: string;
  key: string;
  payload: Record<string, any>;
  correlationId: string;
  attempts: number;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'ROUTED_TO_DLQ';
}
