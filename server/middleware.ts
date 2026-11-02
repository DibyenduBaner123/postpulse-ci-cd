import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyAccessToken, JwtPayload } from './security.js';
import { UserRole } from './types.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      user?: JwtPayload;
    }
  }
}

// Correlation ID Middleware: Attaches or propagates UUID
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingCorrelationId = req.headers['x-correlation-id'] as string;
  const correlationId = existingCorrelationId || `corr-${crypto.randomUUID()}`;
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

// Authentication Middleware: Checks Bearer JWT
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'UNAUTHORIZED',
      message: 'Full authentication is required to access this resource',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'INVALID_TOKEN',
      message: 'JWT token has expired or signature verification failed',
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
  }

  req.user = payload;
  next();
}

// Role-Based Access Control Middleware (RBAC)
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        path: req.originalUrl,
        correlationId: req.correlationId,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'ACCESS_DENIED',
        message: `Forbidden: User role '${req.user.role}' lacks required permissions [${allowedRoles.join(', ')}]`,
        path: req.originalUrl,
        correlationId: req.correlationId,
      });
    }

    next();
  };
}

// Global Standard Error Formatter matching Spring Boot @ControllerAdvice
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  console.error(`[Error] [Correlation: ${req.correlationId}]`, err);

  res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred',
    path: req.originalUrl,
    correlationId: req.correlationId,
  });
}
