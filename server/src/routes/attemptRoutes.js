const express = require('express');
const attemptController = require('../controllers/attemptController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/attempts/:testId/submit - Submit a test attempt
router.post('/:testId/submit', auth, attemptController.submitAttempt);

// GET /api/attempts/analytics - Get analytics (put before :attemptId to avoid conflict)
router.get('/analytics', auth, attemptController.getAnalytics);

// GET /api/attempts/my - Get all my attempts
router.get('/my', auth, attemptController.getMyAttempts);

// GET /api/attempts/test/:testId - Get attempts for a specific test
router.get('/test/:testId', auth, attemptController.getAttemptsByTest);

// GET /api/attempts/:attemptId - Get specific attempt details
router.get('/:attemptId', auth, attemptController.getAttemptById);

module.exports = router;
