const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require auth + admin
router.use(auth, admin);

// GET /api/admin/stats
router.get('/stats', adminController.getDashboardStats);

// GET /api/admin/users
router.get('/users', adminController.getUsers);

// GET /api/admin/users/:id/report
router.get('/users/:id/report', adminController.getUserReport);

// GET /api/admin/tests
router.get('/tests', adminController.getAdminTests);

// POST /api/admin/tests/generate
router.post('/tests/generate', upload.single('document'), adminController.generateAdminTest);

// PUT /api/admin/tests/:id/assign
router.put('/tests/:id/assign', adminController.assignTest);

module.exports = router;
