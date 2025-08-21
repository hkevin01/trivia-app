import { Router } from 'express';
import {
  createQuestion,
  getQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getRandomQuestions,
} from '../services/question.js';
import { authenticate, requireHost } from '../middleware/auth.js';
import {
  validateQuestionCreation,
  validateUUID,
  validatePagination,
  validateSearchQuery,
  handleValidationErrors,
} from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = Router();

// Public routes
router.get('/', validatePagination, validateSearchQuery, getQuestions);

router.get(
  '/random',
  [
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),

    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),

    query('count')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Count must be between 1 and 50'),

    handleValidationErrors,
  ],
  getRandomQuestions
);

router.get(
  '/:questionId',
  [...validateUUID('questionId'), handleValidationErrors],
  getQuestion
);

// Protected routes - require authentication
router.use(authenticate);

// Create question (any authenticated user can create questions)
router.post('/', validateQuestionCreation, createQuestion);

// Update/Delete question (only question author)
router.put(
  '/:questionId',
  [
    ...validateUUID('questionId'),
    body('type')
      .optional()
      .isIn(['MCQ', 'TEXT', 'NUMERIC', 'TRUE_FALSE'])
      .withMessage('Question type must be MCQ, TEXT, NUMERIC, or TRUE_FALSE'),

    body('questionText')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .trim()
      .withMessage('Question text must be 10-1000 characters'),

    body('choices')
      .optional()
      .isArray({ min: 2, max: 10 })
      .withMessage('Choices must be an array with 2-10 items'),

    body('choices.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each choice must be 1-200 characters'),

    body('correctAnswer')
      .optional()
      .notEmpty()
      .withMessage('Correct answer is required'),

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
  ],
  updateQuestion
);

router.delete(
  '/:questionId',
  [...validateUUID('questionId'), handleValidationErrors],
  deleteQuestion
);

export default router;
