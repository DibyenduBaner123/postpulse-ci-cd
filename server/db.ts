import {
  User,
  UserRole,
  SocialPlatformConfig,
  ConnectedAccount,
  Post,
  Draft,
  AuditLog,
  NotificationItem,
} from './types.js';
import { hashPassword, encryptCredentials } from './security.js';

// Social Platforms Configuration according to strict platform limits
export const PLATFORM_CONFIGS: Record<string, SocialPlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: '#0f1419',
    characterLimit: 280,
    maxMediaCount: 4,
    mediaRequired: false,
    maxHashtags: 5,
    supportsLinks: true,
    linkCountsAgainstLength: true,
    allowedMediaTypes: ['image', 'video', 'gif'],
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E1306C',
    characterLimit: 2200,
    maxMediaCount: 10,
    mediaRequired: true, // Instagram requires at least one image or video
    maxHashtags: 30,
    supportsLinks: false, // Regular feed captions do not render clickable links
    linkCountsAgainstLength: true,
    allowedMediaTypes: ['image', 'video'],
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    characterLimit: 63206,
    maxMediaCount: 10,
    mediaRequired: false,
    maxHashtags: 15,
    supportsLinks: true,
    linkCountsAgainstLength: true,
    allowedMediaTypes: ['image', 'video', 'gif'],
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    characterLimit: 3000,
    maxMediaCount: 9,
    mediaRequired: false,
    maxHashtags: 10,
    supportsLinks: true,
    linkCountsAgainstLength: true,
    allowedMediaTypes: ['image', 'video'],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    color: '#FF0000',
    characterLimit: 5000,
    maxMediaCount: 5,
    mediaRequired: false,
    maxHashtags: 15,
    supportsLinks: true,
    linkCountsAgainstLength: true,
    allowedMediaTypes: ['image', 'video', 'gif'],
  },
};

class Database {
  public users: Map<string, User> = new Map();
  public posts: Map<string, Post> = new Map();
  public drafts: Map<string, Draft> = new Map();
  public connectedAccounts: Map<string, ConnectedAccount> = new Map();
  public auditLogs: AuditLog[] = [];
  public notifications: NotificationItem[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Seed Users for each RBAC Role (Password: "Pulse123!")
    const defaultPasswordHash = hashPassword('Pulse123!');

    const seedUsers: User[] = [
      {
        id: 'usr_admin',
        name: 'Alex Rivera',
        email: 'admin@postpulse.io',
        role: 'ADMIN',
        passwordHash: defaultPasswordHash,
        department: 'Executive Operations',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
        isActive: true,
      },
      {
        id: 'usr_manager',
        name: 'Sarah Chen',
        email: 'manager@postpulse.io',
        role: 'MANAGER',
        passwordHash: defaultPasswordHash,
        department: 'Brand Marketing',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        createdAt: '2026-01-12T09:30:00Z',
        updatedAt: '2026-01-12T09:30:00Z',
        isActive: true,
      },
      {
        id: 'usr_editor',
        name: 'Marcus Vance',
        email: 'editor@postpulse.io',
        role: 'EDITOR',
        passwordHash: defaultPasswordHash,
        department: 'Content Creation',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        createdAt: '2026-01-15T11:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
        isActive: true,
      },
      {
        id: 'usr_viewer',
        name: 'Elena Rostova',
        email: 'viewer@postpulse.io',
        role: 'VIEWER',
        passwordHash: defaultPasswordHash,
        department: 'Client Relations',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
        createdAt: '2026-01-20T14:15:00Z',
        updatedAt: '2026-01-20T14:15:00Z',
        isActive: true,
      },
    ];

    seedUsers.forEach((u) => this.users.set(u.id, u));

    // 2. Seed Connected Accounts with encrypted credentials
    const seedAccounts: ConnectedAccount[] = [
      {
        id: 'acc_x',
        platformId: 'twitter',
        accountName: 'PostPulse Official',
        handle: '@postpulse_hq',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80',
        connectedAt: '2026-02-01T10:00:00Z',
        encryptedCredentialBlob: encryptCredentials('x_oauth2_token_secret_99812'),
        authStatus: 'CONNECTED',
        followersCount: 48200,
      },
      {
        id: 'acc_ig',
        platformId: 'instagram',
        accountName: 'PostPulse App',
        handle: '@postpulse.app',
        avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=100&h=100&q=80',
        connectedAt: '2026-02-02T12:00:00Z',
        encryptedCredentialBlob: encryptCredentials('ig_graph_api_longlived_token_8821'),
        authStatus: 'CONNECTED',
        followersCount: 89400,
      },
      {
        id: 'acc_li',
        platformId: 'linkedin',
        accountName: 'PostPulse Technologies',
        handle: 'company/postpulse',
        avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=100&h=100&q=80',
        connectedAt: '2026-02-03T14:00:00Z',
        encryptedCredentialBlob: encryptCredentials('li_oauth2_bearer_key_77123'),
        authStatus: 'CONNECTED',
        followersCount: 34100,
      },
      {
        id: 'acc_fb',
        platformId: 'facebook',
        accountName: 'PostPulse Systems',
        handle: 'postpulse.systems',
        avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=100&h=100&q=80',
        connectedAt: '2026-02-04T16:00:00Z',
        encryptedCredentialBlob: encryptCredentials('fb_page_access_token_11234'),
        authStatus: 'CONNECTED',
        followersCount: 22600,
      },
      {
        id: 'acc_yt',
        platformId: 'youtube',
        accountName: 'PostPulse Engineering',
        handle: '@PostPulseTech',
        avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&h=100&q=80',
        connectedAt: '2026-02-05T09:00:00Z',
        encryptedCredentialBlob: encryptCredentials('yt_data_v3_refresh_token_6654'),
        authStatus: 'CONNECTED',
        followersCount: 15300,
      },
    ];

    seedAccounts.forEach((acc) => this.connectedAccounts.set(acc.id, acc));

    // 3. Seed Posts (Published, Scheduled, Draft, Failed)
    const seedPosts: Post[] = [
      {
        id: 'post_101',
        content: 'We are thrilled to unveil PostPulse 3.0! Effortless multi-channel orchestration with automated scheduling, real-time analytics, and enterprise RBAC.',
        platforms: ['twitter', 'linkedin', 'facebook'],
        media: [
          {
            id: 'med_1',
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'dashboard-preview.png',
            sizeBytes: 420000,
          },
        ],
        hashtags: ['#SaaS', '#SocialMedia', '#TechLaunch'],
        links: ['https://postpulse.io/launch'],
        status: 'PUBLISHED',
        publishedTime: '2026-10-28T14:00:00Z',
        authorId: 'usr_manager',
        authorName: 'Sarah Chen',
        createdAt: '2026-10-27T10:00:00Z',
        updatedAt: '2026-10-28T14:00:00Z',
        analytics: {
          likes: 1420,
          shares: 312,
          comments: 89,
          clicks: 2840,
          impressions: 48500,
        },
      },
      {
        id: 'post_102',
        content: 'Deep dive: How event-driven architecture with Apache Kafka and Dead Letter Queues prevents social publishing failures during peak traffic windows. Read our engineering whitepaper.',
        platforms: ['linkedin', 'twitter'],
        media: [
          {
            id: 'med_2',
            url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'kafka-architecture.png',
            sizeBytes: 680000,
          },
        ],
        hashtags: ['#Kafka', '#SoftwareArchitecture', '#CloudNative'],
        links: ['https://postpulse.io/eng/kafka'],
        status: 'PUBLISHED',
        publishedTime: '2026-10-30T16:30:00Z',
        authorId: 'usr_admin',
        authorName: 'Alex Rivera',
        createdAt: '2026-10-29T11:20:00Z',
        updatedAt: '2026-10-30T16:30:00Z',
        analytics: {
          likes: 890,
          shares: 215,
          comments: 64,
          clicks: 1920,
          impressions: 31200,
        },
      },
      {
        id: 'post_103',
        content: 'Productivity tip of the week: Always review your cross-platform content preview before hitting schedule. What looks great on LinkedIn may exceed character counts on X!',
        platforms: ['twitter', 'instagram', 'linkedin'],
        media: [
          {
            id: 'med_3',
            url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'team-collaboration.jpg',
            sizeBytes: 520000,
          },
        ],
        hashtags: ['#Productivity', '#ContentStrategy', '#Marketing'],
        links: [],
        status: 'SCHEDULED',
        scheduledTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        authorId: 'usr_editor',
        authorName: 'Marcus Vance',
        createdAt: '2026-10-31T09:00:00Z',
        updatedAt: '2026-10-31T09:00:00Z',
      },
      {
        id: 'post_104',
        content: 'Join us live this Thursday for our monthly Product Q&A! We will demo our upcoming Canary deployment pipeline, RBAC security filters, and Redis caching layers.',
        platforms: ['youtube', 'linkedin', 'facebook'],
        media: [
          {
            id: 'med_4',
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'webinar-banner.jpg',
            sizeBytes: 610000,
          },
        ],
        hashtags: ['#Webinar', '#DevOps', '#LiveStream'],
        links: ['https://postpulse.io/webinar'],
        status: 'SCHEDULED',
        scheduledTime: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
        authorId: 'usr_manager',
        authorName: 'Sarah Chen',
        createdAt: '2026-11-01T08:00:00Z',
        updatedAt: '2026-11-01T08:00:00Z',
      },
      {
        id: 'post_105',
        content: 'Weekend read: 5 mistakes growth teams make when scaling multi-account social media distribution. Swipe through for key insights.',
        platforms: ['instagram', 'facebook'],
        media: [
          {
            id: 'med_5',
            url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'growth-carousel.jpg',
            sizeBytes: 490000,
          },
        ],
        hashtags: ['#GrowthMarketing', '#SocialStrategy', '#ScaleUp'],
        links: [],
        status: 'SCHEDULED',
        scheduledTime: new Date(Date.now() + 86400000 * 5).toISOString(),
        authorId: 'usr_editor',
        authorName: 'Marcus Vance',
        createdAt: '2026-11-01T08:30:00Z',
        updatedAt: '2026-11-01T08:30:00Z',
      },
      {
        id: 'post_106',
        content: 'Temporary connection timeout during graph API webhook validation. Rate limit quota exceeded on legacy endpoint.',
        platforms: ['instagram'],
        media: [
          {
            id: 'med_6',
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'analytics-chart.png',
            sizeBytes: 310000,
          },
        ],
        hashtags: ['#Update'],
        links: [],
        status: 'FAILED',
        authorId: 'usr_editor',
        authorName: 'Marcus Vance',
        createdAt: '2026-10-26T14:00:00Z',
        updatedAt: '2026-10-26T14:05:00Z',
        publishResult: {
          platformResults: {
            instagram: {
              success: false,
              error: 'Rate limit error: 429 Too Many Requests (Token renewed)',
            },
            twitter: { success: false, error: 'Cancelled' },
            facebook: { success: false, error: 'Cancelled' },
            linkedin: { success: false, error: 'Cancelled' },
            youtube: { success: false, error: 'Cancelled' },
          },
        },
      },
    ];

    seedPosts.forEach((p) => this.posts.set(p.id, p));

    // 4. Seed Drafts
    const seedDrafts: Draft[] = [
      {
        id: 'drf_201',
        content: 'Announcing our new Q4 roadmap features: AI content suggestions, automated best-time-to-post detection, and direct TikTok integration!',
        platforms: ['twitter', 'linkedin'],
        media: [],
        hashtags: ['#ProductRoadmap', '#SocialMediaTech'],
        links: ['https://postpulse.io/roadmap'],
        authorId: 'usr_manager',
        authorName: 'Sarah Chen',
        createdAt: '2026-10-29T15:20:00Z',
        updatedAt: '2026-10-31T17:45:00Z',
        tags: ['Roadmap', 'Important'],
      },
      {
        id: 'drf_202',
        content: 'Customer spotlight: How Acme Corp doubled their inbound engagement by centralizing 12 social brand handles into PostPulse.',
        platforms: ['linkedin', 'twitter', 'facebook'],
        media: [
          {
            id: 'med_case',
            url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'case-study.jpg',
            sizeBytes: 520000,
          },
        ],
        hashtags: ['#CaseStudy', '#CustomerSuccess'],
        links: ['https://postpulse.io/customers/acme'],
        authorId: 'usr_editor',
        authorName: 'Marcus Vance',
        createdAt: '2026-10-30T10:10:00Z',
        updatedAt: '2026-11-01T07:15:00Z',
        tags: ['CaseStudy'],
      },
      {
        id: 'drf_203',
        content: 'Behind the scenes at our London engineering offsite. Great whiteboard sessions on distributed transactions and idempotency.',
        platforms: ['instagram'],
        media: [
          {
            id: 'med_offsite',
            url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
            type: 'image',
            name: 'offsite-photo.jpg',
            sizeBytes: 410000,
          },
        ],
        hashtags: ['#CompanyCulture', '#TechLife', '#EngineeringTeam'],
        links: [],
        authorId: 'usr_admin',
        authorName: 'Alex Rivera',
        createdAt: '2026-10-28T18:00:00Z',
        updatedAt: '2026-10-28T18:30:00Z',
        tags: ['Culture'],
      },
    ];

    seedDrafts.forEach((d) => this.drafts.set(d.id, d));

    // 5. Seed Notifications
    this.notifications = [
      {
        id: 'notif_1',
        title: 'Kafka Event Processed',
        message: 'Post #post_102 was published synchronously via Kafka post-published topic.',
        type: 'SUCCESS',
        read: false,
        createdAt: '2026-10-30T16:31:00Z',
      },
      {
        id: 'notif_2',
        title: 'Publishing Alert Resolved',
        message: 'Instagram token refresh successfully authenticated. Account ready for scheduling.',
        type: 'INFO',
        read: false,
        createdAt: '2026-10-28T12:00:00Z',
      },
      {
        id: 'notif_3',
        title: 'Upcoming Post Scheduled',
        message: 'Post #post_103 scheduled to publish across 3 platforms in 48 hours.',
        type: 'INFO',
        read: true,
        createdAt: '2026-10-31T09:01:00Z',
      },
    ];

    // 6. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'aud_1',
        timestamp: '2026-10-30T16:30:00Z',
        userId: 'usr_admin',
        userEmail: 'admin@postpulse.io',
        action: 'POST_PUBLISHED',
        targetEntity: 'POST',
        entityId: 'post_102',
        details: 'Published cross-platform to LinkedIn and X',
        correlationId: 'corr-init-399120',
        ipAddress: '192.168.1.101',
      },
      {
        id: 'aud_2',
        timestamp: '2026-10-31T09:00:00Z',
        userId: 'usr_editor',
        userEmail: 'editor@postpulse.io',
        action: 'POST_SCHEDULED',
        targetEntity: 'SCHEDULED_POST',
        entityId: 'post_103',
        details: 'Scheduled for 2026-11-03T09:00:00Z',
        correlationId: 'corr-init-481902',
        ipAddress: '192.168.1.105',
      },
      {
        id: 'aud_3',
        timestamp: '2026-11-01T08:00:00Z',
        userId: 'usr_manager',
        userEmail: 'manager@postpulse.io',
        action: 'DRAFT_UPDATED',
        targetEntity: 'DRAFT',
        entityId: 'drf_201',
        details: 'Updated roadmap announcement copy and platform targets',
        correlationId: 'corr-init-592817',
        ipAddress: '192.168.1.102',
      },
    ];
  }

  public recordAuditLog(
    userId: string,
    userEmail: string,
    action: string,
    targetEntity: string,
    entityId: string,
    details: string,
    correlationId: string,
    ipAddress = '127.0.0.1'
  ) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      action,
      targetEntity,
      entityId,
      details,
      correlationId,
      ipAddress,
    };
    this.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }
}

export const db = new Database();
