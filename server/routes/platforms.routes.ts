import { Router } from 'express';
import { db, PLATFORM_CONFIGS } from '../db.js';
import { authMiddleware, requireRole } from '../middleware.js';
import { ConnectedAccount, SocialPlatformId } from '../types.js';
import { encryptCredentials } from '../security.js';

const router = Router();

// GET /api/platforms
router.get('/', authMiddleware, (req, res) => {
  const configs = Object.values(PLATFORM_CONFIGS);
  const accounts = Array.from(db.connectedAccounts.values()).map((acc) => ({
    id: acc.id,
    platformId: acc.platformId,
    accountName: acc.accountName,
    handle: acc.handle,
    avatarUrl: acc.avatarUrl,
    connectedAt: acc.connectedAt,
    authStatus: acc.authStatus,
    followersCount: acc.followersCount,
    isEncryptedWithAesGcm: true,
    // Sensitive credential blob is NEVER exposed to frontend
  }));

  return res.json({
    platforms: configs,
    connectedAccounts: accounts,
  });
});

// GET /api/platforms/:id
router.get('/:id', authMiddleware, (req, res) => {
  const config = PLATFORM_CONFIGS[req.params.id];
  if (!config) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `Platform '${req.params.id}' not supported`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const account = Array.from(db.connectedAccounts.values()).find((a) => a.platformId === req.params.id);

  return res.json({
    config,
    account: account
      ? {
          id: account.id,
          platformId: account.platformId,
          accountName: account.accountName,
          handle: account.handle,
          avatarUrl: account.avatarUrl,
          connectedAt: account.connectedAt,
          authStatus: account.authStatus,
          followersCount: account.followersCount,
          isEncryptedWithAesGcm: true,
        }
      : null,
  });
});

// POST /api/platforms/:id/connect (RBAC: ADMIN, MANAGER)
router.post('/:id/connect', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const platformId = req.params.id as SocialPlatformId;
  const config = PLATFORM_CONFIGS[platformId];

  if (!config) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: 'INVALID_PLATFORM',
      message: `Platform '${platformId}' is invalid`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const { accountName, handle } = req.body;
  const mockToken = `oauth_token_${platformId}_${Date.now()}`;
  const encryptedBlob = encryptCredentials(mockToken);

  const newAccount: ConnectedAccount = {
    id: `acc_${platformId}_${Date.now()}`,
    platformId,
    accountName: accountName || `PostPulse ${config.name}`,
    handle: handle || `@postpulse_${platformId}`,
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80',
    connectedAt: new Date().toISOString(),
    encryptedCredentialBlob: encryptedBlob,
    authStatus: 'CONNECTED',
    followersCount: Math.floor(Math.random() * 25000) + 5000,
  };

  db.connectedAccounts.set(newAccount.id, newAccount);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'PLATFORM_CONNECTED',
    'CONNECTED_ACCOUNT',
    newAccount.id,
    `Connected ${config.name} account with AES-256-GCM encrypted token`,
    req.correlationId
  );

  return res.status(201).json({
    id: newAccount.id,
    platformId: newAccount.platformId,
    accountName: newAccount.accountName,
    handle: newAccount.handle,
    avatarUrl: newAccount.avatarUrl,
    connectedAt: newAccount.connectedAt,
    authStatus: newAccount.authStatus,
    followersCount: newAccount.followersCount,
    isEncryptedWithAesGcm: true,
  });
});

// POST /api/platforms/:id/disconnect (RBAC: ADMIN, MANAGER)
router.post('/:id/disconnect', authMiddleware, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
  const account = Array.from(db.connectedAccounts.values()).find((a) => a.platformId === req.params.id);
  if (!account) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      error: 'RESOURCE_NOT_FOUND',
      message: `No active connection found for platform '${req.params.id}'`,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  db.connectedAccounts.delete(account.id);

  db.recordAuditLog(
    req.user!.sub,
    req.user!.email,
    'PLATFORM_DISCONNECTED',
    'CONNECTED_ACCOUNT',
    account.id,
    `Disconnected ${account.platformId} account`,
    req.correlationId
  );

  return res.json({ message: 'Platform disconnected successfully' });
});

export default router;
