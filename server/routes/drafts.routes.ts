import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware.js';
import { Draft, SocialPlatformId } from '../types.js';

const router = Router();

// GET /api/drafts
router.get('/', authMiddleware, (req, res) => {
  const search = (req.query.search as string)?.toLowerCase();
  const platform = req.query.platform as SocialPlatformId | undefined;
  const sort = (req.query.sort as string) || 'updatedAt,desc';

  let drafts = Array.from(db.drafts.values());

  if (platform) {
    drafts = drafts.filter((d) => d.platforms.includes(platform));
  }

  if (search) {
    drafts = drafts.filter(
      (d) =>
        d.content.toLowerCase().includes(search) ||
        d.hashtags.some((h) => h.toLowerCase().includes(search)) ||
        d.tags?.some((t) => t.toLowerCase().includes(search))
    );
  }

  const [sortField, sortDir] = sort.split(',');
  drafts.sort((a: any, b: any) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (sortDir === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  return res.json({
    drafts,
    totalCount: drafts.length,
  });
});

// GET /api/drafts/:id
router.get('/:id', authMiddleware, (req, res) => {
  const draft = db.drafts.get(req.params.id);
  if (!draft) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Draft ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }
  return res.json(draft);
});

// POST /api/drafts (Create/Autosave draft)
router.post('/', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), (req, res) => {
  const { content = '', platforms = [], media = [], hashtags = [], links = [], tags = [] } = req.body;

  const draftId = `drf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  const draft: Draft = {
    id: draftId,
    content,
    platforms,
    media,
    hashtags,
    links,
    tags,
    authorId: req.user!.sub,
    authorName: req.user!.name,
    createdAt: now,
    updatedAt: now,
  };

  db.drafts.set(draftId, draft);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'DRAFT_CREATED',
    'DRAFT',
    draftId,
    `Draft created with ${platforms.length} platforms`,
    req.correlationId
  );

  return res.status(201).json(draft);
});

// PUT /api/drafts/:id
router.put('/:id', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), (req, res) => {
  const draft = db.drafts.get(req.params.id);
  if (!draft) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Draft ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const { content, platforms, media, hashtags, links, tags } = req.body;

  if (content !== undefined) draft.content = content;
  if (platforms !== undefined) draft.platforms = platforms;
  if (media !== undefined) draft.media = media;
  if (hashtags !== undefined) draft.hashtags = hashtags;
  if (links !== undefined) draft.links = links;
  if (tags !== undefined) draft.tags = tags;

  draft.updatedAt = new Date().toISOString();
  db.drafts.set(draft.id, draft);

  return res.json(draft);
});

// DELETE /api/drafts/:id
router.delete('/:id', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), (req, res) => {
  const draft = db.drafts.get(req.params.id);
  if (!draft) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Draft ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  db.drafts.delete(req.params.id);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'DRAFT_DELETED',
    'DRAFT',
    req.params.id,
    `Draft deleted`,
    req.correlationId
  );

  return res.json({ message: 'Draft deleted', id: req.params.id });
});

// POST /api/drafts/:id/duplicate
router.post('/:id/duplicate', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'EDITOR']), (req, res) => {
  const original = db.drafts.get(req.params.id);
  if (!original) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Draft ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const newDraftId = `drf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  const duplicate: Draft = {
    ...original,
    id: newDraftId,
    content: `${original.content} (Copy)`,
    authorId: req.user!.sub,
    authorName: req.user!.name,
    createdAt: now,
    updatedAt: now,
  };

  db.drafts.set(newDraftId, duplicate);

  return res.status(201).json(duplicate);
});

export default router;
