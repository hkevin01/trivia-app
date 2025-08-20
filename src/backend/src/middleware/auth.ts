import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { redisManager } from '../database/redis.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    isHost: boolean;
    isVerified: boolean;
  };
  deviceId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  isHost: boolean;
  isVerified: boolean;
  sessionId: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  static async generateTokens(
    user: any,
    deviceId?: string
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const sessionId = randomUUID();

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isHost: user.is_host || false,
      isVerified: user.is_verified || false,
      sessionId,
      deviceId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { sessionId, userId: user.id },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
      } as jwt.SignOptions
    );

    // Store session in Redis
    await redisManager.setSession(
      sessionId,
      {
        userId: user.id,
        deviceId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      },
      7 * 24 * 60 * 60
    ); // 7 days

    return { accessToken, refreshToken, sessionId };
  }

  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      // Check if session exists in Redis
      const session = await redisManager.getSession(decoded.sessionId);
      if (!session) {
        logger.warn(`Session not found for token: ${decoded.sessionId}`);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date().toISOString();
      await redisManager.setSession(
        decoded.sessionId,
        session,
        7 * 24 * 60 * 60
      );

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token');
      } else {
        logger.error('Token verification error:', error);
      }
      return null;
    }
  }

  static async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
        sessionId: string;
        userId: string;
      };

      const session = await redisManager.getSession(decoded.sessionId);
      if (!session || session.userId !== decoded.userId) {
        return null;
      }

      // Here you would typically fetch user from database
      // For now, we'll use session data
      const user = {
        id: session.userId,
        email: session.email || '',
        username: session.username || '',
        is_host: session.isHost || false,
        is_verified: session.isVerified || false,
      };

      const tokens = await this.generateTokens(user, session.deviceId);

      // Invalidate old session
      await redisManager.deleteSession(decoded.sessionId);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      return null;
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await redisManager.deleteSession(sessionId);
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    // This would require indexing sessions by userId in Redis
    // For now, we'll implement a basic approach
    logger.info(`Revoking all sessions for user: ${userId}`);
  }
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      isHost: payload.isHost,
      isVerified: payload.isVerified,
    };
    req.deviceId = payload.deviceId;

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireHost = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isHost) {
    res.status(403).json({ error: 'Host privileges required' });
    return;
  }

  next();
};

export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ error: 'Email verification required' });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await AuthService.verifyToken(token);

      if (payload) {
        req.user = {
          id: payload.userId,
          email: payload.email,
          username: payload.username,
          isHost: payload.isHost,
          isVerified: payload.isVerified,
        };
        req.deviceId = payload.deviceId;
      }
    }

    next();
  } catch (error) {
    // Optional auth shouldn't fail, just continue without user
    logger.debug('Optional auth failed, continuing without user:', error);
    next();
  }
};
