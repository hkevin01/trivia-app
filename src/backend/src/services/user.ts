import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbManager } from '../database/connection.js';
import { AuthService, AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';
import { randomUUID } from 'crypto';

interface CreateUserData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  deviceFingerprint?: string;
}

interface LoginData {
  identifier: string; // email or username
  password: string;
  deviceFingerprint?: string;
}

export class UserService {
  static async createUser(userData: CreateUserData): Promise<any> {
    const { email, username, password, displayName, deviceFingerprint } =
      userData;

    // Check if user already exists
    const existingUser = await dbManager.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email or username');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      config.security.bcryptRounds
    );

    // Create user
    const userId = randomUUID();
    const result = await dbManager.query(
      `
      INSERT INTO users (id, email, username, password_hash, display_name, is_verified, is_host)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, username, display_name, is_verified, is_host, created_at
    `,
      [
        userId,
        email.toLowerCase(),
        username,
        passwordHash,
        displayName || username,
        false, // Email verification required
        false, // Not a host by default
      ]
    );

    const user = result.rows[0];

    // Create device record if fingerprint provided
    if (deviceFingerprint) {
      await dbManager.query(
        `
        INSERT INTO devices (user_id, device_fingerprint, device_info, is_trusted)
        VALUES ($1, $2, $3, $4)
      `,
        [userId, deviceFingerprint, {}, false]
      );
    }

    logger.info(`User created: ${user.email} (${user.id})`);
    return user;
  }

  static async authenticateUser(loginData: LoginData): Promise<any> {
    const { identifier, password, deviceFingerprint } = loginData;

    // Find user by email or username
    const result = await dbManager.query(
      `
      SELECT id, email, username, password_hash, display_name, is_verified, is_host
      FROM users
      WHERE email = $1 OR username = $1
    `,
      [identifier.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await dbManager.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Handle device tracking
    let deviceId: string | undefined;
    if (deviceFingerprint) {
      const deviceResult = await dbManager.query(
        `
        SELECT id FROM devices
        WHERE user_id = $1 AND device_fingerprint = $2
      `,
        [user.id, deviceFingerprint]
      );

      if (deviceResult.rows.length > 0) {
        deviceId = deviceResult.rows[0].id;
        // Update last seen
        await dbManager.query(
          `
          UPDATE devices SET last_seen_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
          [deviceId]
        );
      } else {
        // Create new device record
        const newDeviceResult = await dbManager.query(
          `
          INSERT INTO devices (user_id, device_fingerprint, device_info, is_trusted)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
          [user.id, deviceFingerprint, {}, false]
        );
        deviceId = newDeviceResult.rows[0].id;
      }
    }

    logger.info(`User authenticated: ${user.email} (${user.id})`);
    return { user, deviceId };
  }

  static async getUserProfile(userId: string): Promise<any> {
    const result = await dbManager.query(
      `
      SELECT id, email, username, display_name, avatar_url, is_verified, is_host, created_at, last_login_at
      FROM users
      WHERE id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  static async updateUserProfile(userId: string, updates: any): Promise<any> {
    const allowedFields = ['display_name', 'avatar_url'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userId);

    const result = await dbManager.query(
      `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, display_name, avatar_url, is_verified, is_host, updated_at
    `,
      updateValues
    );

    return result.rows[0];
  }
}

// Auth Controllers
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body as CreateUserData;
    const user = await UserService.createUser(userData);

    // Generate tokens
    const tokens = await AuthService.generateTokens(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        isVerified: user.is_verified,
        isHost: user.is_host,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({
      error: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData = req.body as LoginData;
    const { user, deviceId } = await UserService.authenticateUser(loginData);

    // Generate tokens
    const tokens = await AuthService.generateTokens(user, deviceId);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        isVerified: user.is_verified,
        isHost: user.is_host,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      error: error.message || 'Authentication failed',
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    if (!tokens) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    res.json({
      message: 'Tokens refreshed successfully',
      tokens,
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
    });
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const profile = await UserService.getUserProfile(req.user.id);

    res.json({
      user: profile,
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(404).json({
      error: error.message || 'User not found',
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const updates = req.body;
    const updatedUser = await UserService.updateUserProfile(
      req.user.id,
      updates
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      error: error.message || 'Profile update failed',
    });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // In a more complete implementation, we would:
    // 1. Get the session ID from the token
    // 2. Revoke the session in Redis
    // For now, we'll just return success

    res.json({
      message: 'Logout successful',
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
    });
  }
};
