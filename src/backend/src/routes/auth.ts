import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  logout,
} from '../services/user.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Refresh token route
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    handleValidationErrors,
  ],
  refreshToken
);

// Protected routes
router.use(authenticate);

router.get('/profile', getProfile);
router.patch(
  '/profile',
  [
    body('displayName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Display name must be 1-100 characters'),

    body('avatarUrl')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL'),

    handleValidationErrors,
  ],
  updateProfile
);

router.post('/logout', logout);

export default router;
