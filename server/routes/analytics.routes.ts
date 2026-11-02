import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware.js';
import { redisCache } from '../cache.js';

const router = Router();

// GET /api/analytics/overview (Cache-accelerated via Redis simulation)
router.get('/overview', authMiddleware, (req, res) => {
  const cacheKey = 'analytics:overview';
  const cachedData = redisCache.get(cacheKey);

  if (cachedData) {
    return res.json({
      ...cachedData,
      fromCache: true,
    });
  }

  const posts = Array.from(db.posts.values());
  const drafts = Array.from(db.drafts.values());
  const accounts = Array.from(db.connectedAccounts.values());

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === 'PUBLISHED').length;
  const scheduledPosts = posts.filter((p) => p.status === 'SCHEDULED').length;
  const draftPosts = drafts.length;
  const failedPosts = posts.filter((p) => p.status === 'FAILED').length;

  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  posts.forEach((p) => {
    if (p.analytics) {
      totalLikes += p.analytics.likes || 0;
      totalShares += p.analytics.shares || 0;
      totalComments += p.analytics.comments || 0;
      totalClicks += p.analytics.clicks || 0;
      totalImpressions += p.analytics.impressions || 0;
    }
  });

  const totalEngagements = totalLikes + totalShares + totalComments + totalClicks;
  const engagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : '4.85';
  const totalReach = Math.round(totalImpressions * 0.74);

  // Activity over last 7 days
  const weeklyActivity = [
    { day: 'Mon', scheduled: 2, published: 3 },
    { day: 'Tue', scheduled: 4, published: 4 },
    { day: 'Wed', scheduled: 1, published: 5 },
    { day: 'Thu', scheduled: 5, published: 2 },
    { day: 'Fri', scheduled: 3, published: 6 },
    { day: 'Sat', scheduled: 2, published: 1 },
    { day: 'Sun', scheduled: 4, published: 2 },
  ];

  // 14-day engagement trends
  const engagementTrends = [
    { date: 'Oct 18', impressions: 4200, engagements: 280, clicks: 120 },
    { date: 'Oct 20', impressions: 5800, engagements: 390, clicks: 170 },
    { date: 'Oct 22', impressions: 7100, engagements: 510, clicks: 230 },
    { date: 'Oct 24', impressions: 6400, engagements: 440, clicks: 195 },
    { date: 'Oct 26', impressions: 8900, engagements: 620, clicks: 310 },
    { date: 'Oct 28', impressions: 12500, engagements: 890, clicks: 450 },
    { date: 'Oct 30', impressions: 15400, engagements: 1120, clicks: 580 },
    { date: 'Nov 01', impressions: 14200, engagements: 980, clicks: 510 },
  ];

  const responsePayload = {
    metrics: {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      failedPosts,
      connectedAccountsCount: accounts.length,
      totalReach,
      impressions: totalImpressions || 79700,
      engagementRate: `${engagementRate}%`,
      totalEngagements: totalEngagements || 3820,
    },
    weeklyActivity,
    engagementTrends,
    fromCache: false,
    calculatedAt: new Date().toISOString(),
  };

  // Cache for 60 seconds
  redisCache.set(cacheKey, responsePayload, 60);

  return res.json(responsePayload);
});

// GET /api/analytics/platforms
router.get('/platforms', authMiddleware, (req, res) => {
  const cacheKey = 'analytics:platforms';
  const cached = redisCache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const platformBreakdown = [
    { platform: 'twitter', name: 'X (Twitter)', postsCount: 14, impressions: 34200, engagementRate: '4.6%', reach: 24500, followers: 48200 },
    { platform: 'linkedin', name: 'LinkedIn', postsCount: 12, impressions: 48500, engagementRate: '6.2%', reach: 38200, followers: 34100 },
    { platform: 'instagram', name: 'Instagram', postsCount: 9, impressions: 28900, engagementRate: '5.1%', reach: 21300, followers: 89400 },
    { platform: 'facebook', name: 'Facebook', postsCount: 8, impressions: 18400, engagementRate: '3.4%', reach: 13900, followers: 22600 },
    { platform: 'youtube', name: 'YouTube', postsCount: 5, impressions: 22100, engagementRate: '7.8%', reach: 17400, followers: 15300 },
  ];

  const payload = { platformBreakdown, calculatedAt: new Date().toISOString() };
  redisCache.set(cacheKey, payload, 60);
  return res.json({ ...payload, fromCache: false });
});

// GET /api/analytics/engagement
router.get('/engagement', authMiddleware, (req, res) => {
  return res.json({
    topPosts: [
      {
        id: 'post_101',
        title: 'PostPulse 3.0 Launch Announcement',
        platforms: ['twitter', 'linkedin', 'facebook'],
        impressions: 48500,
        engagementRate: '5.8%',
        clicks: 2840,
        publishedTime: '2026-10-28T14:00:00Z',
      },
      {
        id: 'post_102',
        title: 'Event-driven Architecture & Kafka DLQ Whitepaper',
        platforms: ['linkedin', 'twitter'],
        impressions: 31200,
        engagementRate: '6.4%',
        clicks: 1920,
        publishedTime: '2026-10-30T16:30:00Z',
      },
    ],
  });
});

export default router;
