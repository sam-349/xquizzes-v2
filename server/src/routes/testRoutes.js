const express = require('express');
const testController = require('../controllers/testController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/tests/generate - Generate a new test
router.post('/generate', auth, upload.single('document'), testController.generateTest);

// GET /api/tests - Get all my tests
router.get('/', auth, testController.getMyTests);

// GET /api/tests/:id - Get single test (full, with answers - for review)
router.get('/:id', auth, testController.getTestById);

// GET /api/tests/:id/take - Get test for taking (no answers)
router.get('/:id/take', auth, testController.getTestForTaking);

// DELETE /api/tests/:id
router.delete('/:id', auth, testController.deleteTest);

module.exports = router;
