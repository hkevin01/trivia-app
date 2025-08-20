import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  query,
  validationResult,
  ValidationChain,
} from 'express-validator';
import { logger } from '../utils/logger.js';

// Common validation patterns
export const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  roomCode: /^[A-Z0-9]{6,8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Middleware to handle validation results
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.warn('Validation errors:', formattedErrors);

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  next();
};

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('username')
    .matches(patterns.username)
    .withMessage(
      'Username must be 3-20 characters, alphanumeric and underscores only'
    ),

  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),

  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Display name must be 1-100 characters'),

  handleValidationErrors,
];

export const validateUserLogin = [
  body('identifier').notEmpty().withMessage('Email or username is required'),

  body('password').notEmpty().withMessage('Password is required'),

  body('deviceFingerprint')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Device fingerprint must be a string under 1000 characters'),

  handleValidationErrors,
];

// Room validation rules
export const validateRoomCreation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Room name must be 1-100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be under 500 characters'),

  body('mode')
    .isIn(['LAN', 'PUBLIC', 'PRIVATE'])
    .withMessage('Mode must be LAN, PUBLIC, or PRIVATE'),

  body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max players must be between 2 and 100'),

  body('maxTeams')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max teams must be between 1 and 50'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  handleValidationErrors,
];

export const validateRoomJoin = [
  body('roomCode')
    .matches(patterns.roomCode)
    .withMessage('Invalid room code format'),

  body('teamName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Team name must be 1-50 characters'),

  handleValidationErrors,
];

// Question validation rules
export const validateQuestionCreation = [
  body('type')
    .isIn(['MCQ', 'TEXT', 'NUMERIC', 'TRUE_FALSE'])
    .withMessage('Question type must be MCQ, TEXT, NUMERIC, or TRUE_FALSE'),

  body('questionText')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Question text must be 1-1000 characters'),

  body('choices')
    .if(body('type').isIn(['MCQ', 'TRUE_FALSE']))
    .isArray({ min: 2, max: 10 })
    .withMessage('MCQ and TRUE_FALSE questions must have 2-10 choices'),

  body('choices.*')
    .if(body('type').isIn(['MCQ', 'TRUE_FALSE']))
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each choice must be 1-200 characters'),

  body('correctAnswer').notEmpty().withMessage('Correct answer is required'),

  body('explanation')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Explanation must be under 500 characters'),

  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  body('timeLimit')
    .optional()
    .isInt({ min: 5, max: 300 })
    .withMessage('Time limit must be between 5 and 300 seconds'),

  body('points')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('Points must be between 10 and 1000'),

  body('tags').optional().isArray().withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be 1-50 characters'),

  handleValidationErrors,
];

// Game validation rules
export const validateGameStart = [
  body('roomId')
    .matches(patterns.uuid)
    .withMessage('Valid room ID is required'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.roundCount')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Round count must be between 1 and 50'),

  body('settings.questionTimeLimit')
    .optional()
    .isInt({ min: 5, max: 300 })
    .withMessage('Question time limit must be between 5 and 300 seconds'),

  handleValidationErrors,
];

export const validateAnswerSubmission = [
  body('questionId')
    .matches(patterns.uuid)
    .withMessage('Valid question ID is required'),

  body('answer').notEmpty().withMessage('Answer is required'),

  body('timeTaken')
    .optional()
    .isInt({ min: 0, max: 300000 })
    .withMessage('Time taken must be between 0 and 300000 milliseconds'),

  handleValidationErrors,
];

// Parameter validation
export const validateUUID = (paramName: string): ValidationChain[] => [
  param(paramName)
    .matches(patterns.uuid)
    .withMessage(`Valid ${paramName} is required`),
];

export const validateRoomCode = [
  param('roomCode')
    .matches(patterns.roomCode)
    .withMessage('Valid room code is required'),
];

// Query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be 1-50 characters'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  handleValidationErrors,
];

export const validateSearchQuery = [
  query('q')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Search query must be 1-200 characters'),

  query('category')
    .optional()
    .matches(patterns.uuid)
    .withMessage('Category must be a valid UUID'),

  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  handleValidationErrors,
];

// Rate limiting validation
export const validateRateLimit = (windowMs: number, maxRequests: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for client: ${clientId}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return;
    }

    clientData.count++;
    next();
  };
};
