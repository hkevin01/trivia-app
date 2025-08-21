import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validateInputs } from '../middleware/validation.js';
import {
  createCategory,
  getCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../services/category.js';

const router = express.Router();

// Category validation schemas
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('iconUrl')
    .optional()
    .isURL()
    .withMessage('Icon URL must be a valid URL'),
];

const categoryUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('iconUrl')
    .optional()
    .isURL()
    .withMessage('Icon URL must be a valid URL'),
];

// Routes
// GET /api/categories - Get all categories
router.get('/', getCategories);

// GET /api/categories/:categoryId - Get specific category
router.get('/:categoryId', getCategory);

// POST /api/categories - Create new category (Host only)
router.post(
  '/',
  authenticateToken,
  categoryValidation,
  validateInputs,
  createCategory
);

// PUT /api/categories/:categoryId - Update category (Host only)
router.put(
  '/:categoryId',
  authenticateToken,
  categoryUpdateValidation,
  validateInputs,
  updateCategory
);

// DELETE /api/categories/:categoryId - Delete category (Host only)
router.delete('/:categoryId', authenticateToken, deleteCategory);

export default router;
