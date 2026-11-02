import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware.js';
import { Post, SocialPlatformId, PostStatus } from '../types.js';
import { kafkaSimulator } from '../kafkaSimulator.js';

const router = Router();

// GET /api/calendar
router.get('/', authMiddleware, (req, res) => {
  const { startDate, endDate, platform, status } = req.query;

  let calendarPosts = Array.from(db.posts.values()).filter(
    (p) => p.status === 'SCHEDULED' || p.status === 'PUBLISHED' || p.status === 'FAILED'
  );

  if (platform) {
    calendarPosts = calendarPosts.filter((p) => p.platforms.includes(platform as SocialPlatformId));
  }

  if (status) {
    calendarPosts = calendarPosts.filter((p) => p.status === (status as PostStatus));
  }

  if (startDate) {
    const start = new Date(startDate as string).getTime();
    calendarPosts = calendarPosts.filter((p) => {
      const time = new Date(p.scheduledTime || p.publishedTime || p.createdAt).getTime();
      return time >= start;
    });
  }

  if (endDate) {
    const end = new Date(endDate as string).getTime();
    calendarPosts = calendarPosts.filter((p) => {
      const time = new Date(p.scheduledTime || p.publishedTime || p.createdAt).getTime();
      return time <= end;
    });
  }

  // Format into calendar event entities
  const events = calendarPosts.map((p) => ({
    id: p.id,
    title: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
    content: p.content,
    start: p.scheduledTime || p.publishedTime || p.createdAt,
    end: p.scheduledTime || p.publishedTime || p.createdAt,
    platforms: p.platforms,
    status: p.status,
    authorName: p.authorName,
    mediaCount: p.media.length,
    hashtags: p.hashtags,
  }));

  return res.json({
    events,
    totalCount: events.length,
  });
});

// POST /api/calendar/schedule
router.post('/schedule', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), async (req, res) => {
  const { content, platforms, scheduledTime, media = [], hashtags = [], links = [] } = req.body;

  if (!content || !platforms || !platforms.length || !scheduledTime) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'VALIDATION_FAILED',
      message: 'Content, platforms, and scheduledTime are required',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  const newPost: Post = {
    id: postId,
    content,
    platforms,
    media,
    hashtags,
    links,
    status: 'SCHEDULED',
    scheduledTime,
    authorId: req.user!.sub,
    authorName: req.user!.name,
    createdAt: now,
    updatedAt: now,
  };

  db.posts.set(postId, newPost);

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

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'CALENDAR_EVENT_SCHEDULED',
    'POST',
    postId,
    `Post scheduled via Calendar for ${scheduledTime}`,
    req.correlationId
  );

  return res.status(201).json(newPost);
});

// PUT /api/calendar/:id - Reschedule (e.g. Drag-and-Drop or Edit)
router.put('/:id', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), async (req, res) => {
  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Scheduled post ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const { scheduledTime, content, platforms } = req.body;

  if (scheduledTime) {
    post.scheduledTime = scheduledTime;
    post.status = 'SCHEDULED';
  }
  if (content) post.content = content;
  if (platforms) post.platforms = platforms;
  post.updatedAt = new Date().toISOString();

  db.posts.set(post.id, post);

  await kafkaSimulator.publish(
    'post-scheduled',
    post.id,
    {
      postId: post.id,
      rescheduledTime: scheduledTime,
      platforms: post.platforms,
      rescheduledBy: req.user!.sub,
    },
    req.correlationId
  );

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'CALENDAR_EVENT_RESCHEDULED',
    'POST',
    post.id,
    `Rescheduled to ${scheduledTime}`,
    req.correlationId
  );

  return res.json(post);
});

// DELETE /api/calendar/:id - Cancel schedule
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

  post.status = 'CANCELLED';
  post.updatedAt = new Date().toISOString();
  db.posts.set(post.id, post);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'CALENDAR_EVENT_CANCELLED',
    'POST',
    post.id,
    `Post schedule cancelled`,
    req.correlationId
  );

  return res.json({ message: 'Scheduled event cancelled', id: post.id });
});

export default router;
