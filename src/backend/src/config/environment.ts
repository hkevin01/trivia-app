import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.API_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://quizrally:dev_password@localhost:5432/quizrally_dev',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'quizrally',
    password: process.env.POSTGRES_PASSWORD || 'dev_password',
    database: process.env.POSTGRES_DB || 'quizrally_dev',
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRY || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10
    ),
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    ),
  },

  // Game configuration
  game: {
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '50', 10),
    maxRoomsPerHost: parseInt(process.env.MAX_ROOMS_PER_HOST || '3', 10),
    questionTimeLimit: parseInt(process.env.QUESTION_TIME_LIMIT || '30', 10),
    roundCountDefault: parseInt(process.env.ROUND_COUNT_DEFAULT || '10', 10),
  },

  // Anti-cheat configuration
  antiCheat: {
    humanCheckInterval: parseInt(process.env.HUMAN_CHECK_INTERVAL || '5', 10),
    suspiciousActivityThreshold: parseInt(
      process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '3',
      10
    ),
    deviceFingerprintEnabled: process.env.DEVICE_FINGERPRINT_ENABLED === 'true',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}
