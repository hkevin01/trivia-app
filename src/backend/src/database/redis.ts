import { createClient, RedisClientType } from 'redis';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        password: config.redis.password,
        database: config.redis.db,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 50, 500);
          },
        },
      });

      this.client.on('error', (err: any) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Session management methods
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 3600
  ): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const key = `session:${sessionId}`;
    await this.client!.setEx(key, ttl, JSON.stringify(data));
  }

  async getSession(sessionId: string): Promise<any | null> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const key = `session:${sessionId}`;
    const data = await this.client!.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const key = `session:${sessionId}`;
    await this.client!.del(key);
  }

  // Cache methods
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client!.setEx(key, ttl, serializedValue);
    } else {
      await this.client!.set(key, serializedValue);
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const value = await this.client!.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    await this.client!.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const result = await this.client!.exists(key);
    return result === 1;
  }

  // Rate limiting methods
  async incrementCounter(key: string, ttl: number = 60): Promise<number> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const multi = this.client!.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();
    return (results?.[0] as number) || 0;
  }

  async getCounter(key: string): Promise<number> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const value = await this.client!.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  // Game room methods
  async setRoomData(
    roomId: string,
    data: any,
    ttl: number = 3600
  ): Promise<void> {
    const key = `room:${roomId}`;
    await this.set(key, data, ttl);
  }

  async getRoomData(roomId: string): Promise<any | null> {
    const key = `room:${roomId}`;
    return await this.get(key);
  }

  async deleteRoomData(roomId: string): Promise<void> {
    const key = `room:${roomId}`;
    await this.del(key);
  }

  // Pub/Sub methods
  async publish(channel: string, message: any): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    await this.client!.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    if (!this.isReady()) throw new Error('Redis not connected');

    const subscriber = this.client!.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(channel, (message: string) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (error) {
        logger.error(
          `Error parsing Redis message for channel ${channel}:`,
          error
        );
      }
    });
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }
}

export const redisManager = new RedisManager();
