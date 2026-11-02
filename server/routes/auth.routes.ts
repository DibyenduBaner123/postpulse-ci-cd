import { Router } from 'express';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../security.js';
import { authMiddleware } from '../middleware.js';
import { User } from '../types.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, department = 'General' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'VALIDATION_FAILED',
      message: 'Name, email, and password are required',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  // Check if user already exists
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
    role: 'EDITOR', // Default registration role
    passwordHash: hashPassword(password),
    department,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  db.users.set(newUser.id, newUser);

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  db.recordAuditLog(
    newUser.id,
    newUser.email,
    'USER_REGISTERED',
    'USER',
    newUser.id,
    `New user registered with role ${newUser.role}`,
    req.correlationId
  );

  return res.status(201).json({
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    },
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'BAD_CREDENTIALS',
      message: 'Email and password must be provided',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'AUTHENTICATION_FAILED',
      message: 'Invalid email or password combination',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  db.recordAuditLog(
    user.id,
    user.email,
    'USER_LOGIN',
    'USER',
    user.id,
    `User logged in successfully (role: ${user.role})`,
    req.correlationId
  );

  return res.json({
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'MISSING_REFRESH_TOKEN',
      message: 'Refresh token must be provided',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const userId = verifyRefreshToken(refreshToken);
  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'INVALID_REFRESH_TOKEN',
      message: 'Refresh token is expired or revoked',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const user = db.users.get(userId);
  if (!user) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'USER_NOT_FOUND',
      message: 'User associated with refresh token does not exist',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const newAccessToken = generateAccessToken(user);
  return res.json({
    accessToken: newAccessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }
  return res.json({
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.get(req.user!.sub);
  if (!user) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'USER_NOT_FOUND',
      message: 'Current session user not found',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatarUrl: user.avatarUrl,
  });
});

export default router;
