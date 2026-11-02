import { Router } from 'express';
import { db, PLATFORM_CONFIGS } from '../db.js';
import { authMiddleware, requireRole } from '../middleware.js';
import { Post, PostStatus, SocialPlatformId } from '../types.js';
import { kafkaSimulator } from '../kafkaSimulator.js';
import { redisCache } from '../cache.js';

const router = Router();

// GET /api/posts - Paginated with Spring Data Pageable response format
router.get('/', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 0;
  const size = parseInt(req.query.size as string, 10) || 10;
  const sort = (req.query.sort as string) || 'createdAt,desc';
  const status = req.query.status as PostStatus | undefined;
  const platform = req.query.platform as SocialPlatformId | undefined;
  const search = (req.query.search as string)?.toLowerCase();

  let allPosts = Array.from(db.posts.values());

  // Filter by status
  if (status) {
    allPosts = allPosts.filter((p) => p.status === status);
  }

  // Filter by platform
  if (platform) {
    allPosts = allPosts.filter((p) => p.platforms.includes(platform));
  }

  // Search filter
  if (search) {
    allPosts = allPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(search) ||
        p.hashtags.some((h) => h.toLowerCase().includes(search)) ||
        p.authorName.toLowerCase().includes(search)
    );
  }

  // Sorting
  const [sortField, sortDirection] = sort.split(',');
  allPosts.sort((a: any, b: any) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });

  const totalElements = allPosts.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const content = allPosts.slice(start, start + size);

  return res.json({
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: { sorted: true, empty: false },
      offset: start,
    },
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
    numberOfElements: content.length,
    size,
    number: page,
    empty: content.length === 0,
  });
});

// GET /api/posts/:id
router.get('/:id', authMiddleware, (req, res) => {
  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Post with ID '${req.params.id}' was not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }
  return res.json(post);
});

// Helper for simulated platform publishing
function simulatePlatformPublish(platforms: SocialPlatformId[], content: string, mediaCount: number) {
  const platformResults: Record<string, { success: boolean; externalPostId?: string; error?: string }> = {};

  platforms.forEach((platform) => {
    const config = PLATFORM_CONFIGS[platform];
    if (config.mediaRequired && mediaCount === 0) {
      platformResults[platform] = {
        success: false,
        error: `${config.name} requires at least one media asset to publish.`,
      };
      return;
    }

    if (content.length > config.characterLimit) {
      platformResults[platform] = {
        success: false,
        error: `Content length (${content.length}) exceeds ${config.name} limit of ${config.characterLimit} chars.`,
      };
      return;
    }

    // Success simulation
    platformResults[platform] = {
      success: true,
      externalPostId: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
  });

  return platformResults;
}

// POST /api/posts - Create Post (RBAC: ADMIN, MANAGER, EDITOR)
router.post('/', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), async (req, res) => {
  const { content, platforms, media = [], hashtags = [], links = [], status = 'PUBLISHED', scheduledTime } = req.body;

  if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'VALIDATION_FAILED',
      message: 'Post content and at least one destination platform are required',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  // Validate per-platform rules
  for (const plat of platforms) {
    const cfg = PLATFORM_CONFIGS[plat as SocialPlatformId];
    if (cfg) {
      if (cfg.mediaRequired && media.length === 0 && status !== 'DRAFT') {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'PLATFORM_VALIDATION_ERROR',
          message: `${cfg.name} requires media attachments for publishing`,
          path: req.originalUrl,
          correlationId: req.correlationId,
        });
      }
      if (content.length > cfg.characterLimit) {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'PLATFORM_VALIDATION_ERROR',
          message: `Content exceeds ${cfg.name} character limit (${content.length}/${cfg.characterLimit})`,
          path: req.originalUrl,
          correlationId: req.correlationId,
        });
      }
    }
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  let finalStatus: PostStatus = status;
  let publishResult: any = undefined;

  if (status === 'PUBLISHED') {
    const simResults = simulatePlatformPublish(platforms, content, media.length);
    publishResult = { platformResults: simResults };
    const hasFailures = Object.values(simResults).some((r) => !r.success);
    if (hasFailures) {
      finalStatus = 'FAILED';
    }
  }

  const newPost: Post = {
    id: postId,
    content,
    platforms,
    media,
    hashtags,
    links,
    status: finalStatus,
    scheduledTime: status === 'SCHEDULED' ? scheduledTime : undefined,
    publishedTime: finalStatus === 'PUBLISHED' ? now : undefined,
    authorId: req.user!.sub,
    authorName: req.user!.name,
    createdAt: now,
    updatedAt: now,
    publishResult,
    analytics:
      finalStatus === 'PUBLISHED'
        ? {
            likes: Math.floor(Math.random() * 45) + 5,
            shares: Math.floor(Math.random() * 15) + 1,
            comments: Math.floor(Math.random() * 10) + 1,
            clicks: Math.floor(Math.random() * 120) + 10,
            impressions: Math.floor(Math.random() * 1500) + 200,
          }
        : undefined,
  };

  db.posts.set(postId, newPost);

  // Evict cached analytics data
  redisCache.evict('analytics');

  // Trigger Kafka event
  if (finalStatus === 'SCHEDULED') {
    await kafkaSimulator.publish(
      'post-scheduled',
      postId,
      {
        postId,
        scheduledTime,
        platforms,
        authorId: req.user!.sub,
      },
      req.correlationId
    );
  } else if (finalStatus === 'PUBLISHED') {
    await kafkaSimulator.publish(
      'post-published',
      postId,
      {
        postId,
        platforms,
        publishedTime: now,
        authorId: req.user!.sub,
      },
      req.correlationId
    );
  }

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    finalStatus === 'SCHEDULED' ? 'POST_SCHEDULED' : 'POST_PUBLISHED',
    'POST',
    postId,
    `Post ${finalStatus.toLowerCase()} across ${platforms.join(', ')}`,
    req.correlationId
  );

  return res.status(201).json(newPost);
});

// PUT /api/posts/:id (RBAC: ADMIN, MANAGER, EDITOR)
router.put('/:id', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), (req, res) => {
  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Post ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const { content, platforms, media, hashtags, links, status, scheduledTime } = req.body;

  if (content !== undefined) post.content = content;
  if (platforms !== undefined) post.platforms = platforms;
  if (media !== undefined) post.media = media;
  if (hashtags !== undefined) post.hashtags = hashtags;
  if (links !== undefined) post.links = links;
  if (status !== undefined) post.status = status;
  if (scheduledTime !== undefined) post.scheduledTime = scheduledTime;

  post.updatedAt = new Date().toISOString();
  db.posts.set(post.id, post);

  redisCache.evict('analytics');

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'POST_UPDATED',
    'POST',
    post.id,
    `Post updated`,
    req.correlationId
  );

  return res.json(post);
});

// DELETE /api/posts/:id (RBAC: ADMIN, MANAGER)
router.delete('/:id', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Post ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  db.posts.delete(req.params.id);
  redisCache.evict('analytics');

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'POST_DELETED',
    'POST',
    req.params.id,
    `Post permanently deleted`,
    req.correlationId
  );

  return res.json({ message: 'Post deleted successfully', id: req.params.id });
});

// POST /api/posts/:id/publish (Simulate instant publishing)
router.post('/:id/publish', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), async (req, res) => {
  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Post ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const simResults = simulatePlatformPublish(post.platforms, post.content, post.media.length);
  const hasFailures = Object.values(simResults).some((r) => !r.success);

  post.status = hasFailures ? 'FAILED' : 'PUBLISHED';
  post.publishedTime = new Date().toISOString();
  post.publishResult = { platformResults: simResults };
  post.updatedAt = new Date().toISOString();

  if (!post.analytics) {
    post.analytics = {
      likes: Math.floor(Math.random() * 50) + 10,
      shares: Math.floor(Math.random() * 20) + 2,
      comments: Math.floor(Math.random() * 15) + 1,
      clicks: Math.floor(Math.random() * 100) + 20,
      impressions: Math.floor(Math.random() * 1200) + 300,
    };
  }

  db.posts.set(post.id, post);
  redisCache.evict('analytics');

  await kafkaSimulator.publish(
    hasFailures ? 'post-failed' : 'post-published',
    post.id,
    { postId: post.id, platforms: post.platforms, results: simResults },
    req.correlationId
  );

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'POST_PUBLISH_TRIGGERED',
    'POST',
    post.id,
    `Instant publishing executed (${post.status})`,
    req.correlationId
  );

  return res.json(post);
});

export default router;
