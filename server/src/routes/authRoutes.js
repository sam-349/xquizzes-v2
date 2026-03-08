const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 12 })
      .withMessage('Password must be 8-12 characters')
      .custom((value) => {
        // Require at least one letter, one number and one special character
  const strongPass = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
        if (!strongPass.test(value)) {
          throw new Error('Password must include uppercase, lowercase, numbers and special characters');
        }
        return true;
      }),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

// POST /api/auth/admin/login
router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.adminLogin
);

// POST /api/auth/admin/register
router.post(
  '/admin/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 12 })
      .withMessage('Password must be 8-12 characters')
      .custom((value) => {
  const strongPass = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
        if (!strongPass.test(value)) {
          throw new Error('Password must include uppercase, lowercase, numbers and special characters');
        }
        return true;
      }),
    body('adminSecretKey').notEmpty().withMessage('Admin secret key is required'),
  ],
  authController.adminRegister
);

// GET /api/auth/me
router.get('/me', auth, authController.getMe);

// PUT /api/auth/profile
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
