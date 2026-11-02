import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware.js';
import { hashPassword } from '../security.js';
import { User, UserRole } from '../types.js';

const router = Router();

// GET /api/users (RBAC: ADMIN, MANAGER)
router.get('/', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const users = Array.from(db.users.values()).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    isActive: u.isActive,
  }));

  return res.json({ users });
});

// GET /api/users/audit-logs (RBAC: ADMIN, MANAGER)
router.get('/audit-logs', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  return res.json({
    logs: db.auditLogs.slice(0, limit),
    totalCount: db.auditLogs.length,
  });
});

// GET /api/users/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  return res.json({
    notifications: db.notifications,
  });
});

// PUT /api/users/notifications/:id/read
router.put('/notifications/:id/read', authMiddleware, (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  return res.json({ success: true });
});

// GET /api/users/:id
router.get('/:id', authMiddleware, (req, res) => {
  const u = db.users.get(req.params.id);
  if (!u) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'USER_NOT_FOUND',
      message: `User ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  return res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    isActive: u.isActive,
  });
});

// PUT /api/users/:id (RBAC: ADMIN only to update role or status)
router.put('/:id', authMiddleware, requireRole(['ADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'USER_NOT_FOUND',
      message: `User ${req.params.id} not found`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const { role, department, isActive } = req.body;

  const oldRole = user.role;
  if (role && ['ADMIN', 'MANAGER', 'EDITOR', 'VIEWER'].includes(role)) {
    user.role = role as UserRole;
  }
  if (department !== undefined) user.department = department;
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  user.updatedAt = new Date().toISOString();

  db.users.set(user.id, user);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'USER_ROLE_UPDATED',
    'USER',
    user.id,
    `Role changed from ${oldRole} to ${user.role}`,
    req.correlationId
  );

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
  });
});

// POST /api/users (Invite team member - RBAC: ADMIN, MANAGER)
router.post('/', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const { name, email, role = 'EDITOR', department = 'Marketing' } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'VALIDATION_FAILED',
      message: 'Name and email are required',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      timestamp: new Date().toISOString(),
      status: 409,
      error: 'DUPLICATE_RESOURCE',
      message: `User with email '${email}' already exists`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    email: email.toLowerCase(),
    role: role as UserRole,
    passwordHash: hashPassword('Pulse123!'),
    department,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  db.users.set(newUser.id, newUser);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'TEAM_MEMBER_INVITED',
    'USER',
    newUser.id,
    `Invited ${newUser.email} with role ${newUser.role}`,
    req.correlationId
  );

  return res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    department: newUser.department,
    createdAt: newUser.createdAt,
    isActive: newUser.isActive,
  });
});

export default router;
