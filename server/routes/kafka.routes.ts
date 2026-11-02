import { Router } from 'express';
import { kafkaSimulator } from '../kafkaSimulator.js';
import { redisCache } from '../cache.js';
import { authMiddleware, requireRole } from '../middleware.js';

const router = Router();

// GET /api/kafka/events
router.get('/events', authMiddleware, (req, res) => {
  const topic = req.query.topic as any;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const messages = kafkaSimulator.getMessages(topic, limit);

  return res.json({
    messages,
    totalReturned: messages.length,
  });
});

// GET /api/kafka/topics
router.get('/topics', authMiddleware, (req, res) => {
  const stats = kafkaSimulator.getTopicStats();
  return res.json({
    topics: [
      { name: 'post-scheduled', count: stats['post-scheduled'], partitions: 3, retentionHours: 168 },
      { name: 'post-published', count: stats['post-published'], partitions: 3, retentionHours: 168 },
      { name: 'post-failed', count: stats['post-failed'], partitions: 3, retentionHours: 168 },
      { name: 'post-notifications', count: stats['post-notifications'], partitions: 1, retentionHours: 72 },
      { name: 'post-dlq', count: stats['post-dlq'], partitions: 1, retentionHours: 720 },
    ],
  });
});

// POST /api/kafka/replay/:eventId (Replay DLQ message)
router.post('/replay/:eventId', authMiddleware, requireRole(['ADMIN']), (req, res) => {
  const replayed = kafkaSimulator.replayDlqMessage(req.params.eventId);
  if (!replayed) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `DLQ message ${req.params.eventId} not found or could not be replayed`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  return res.json({
    message: `Message ${req.params.eventId} re-enqueued for consumer processing`,
    replayed: true,
  });
});

// GET /api/cache/stats
router.get('/cache/stats', authMiddleware, (req, res) => {
  const stats = redisCache.getStats();
  return res.json(stats);
});

// POST /api/cache/clear
router.post('/cache/clear', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  redisCache.clear();
  return res.json({ message: 'Redis cache cleared successfully' });
});

export default router;
