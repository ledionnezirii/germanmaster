const express = require('express');
const router = express.Router();
const { updateAdminStatus } = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');  // Middleware për autentifikim
const isAdmin = require('../middleware/isAdmin');      // Middleware për kontrollin e adminit

// Rruga për përditësimin e statusit të adminit
router.put('/updateAdmin/:userId', authMiddleware, isAdmin, updateAdminStatus);

module.exports = router;
