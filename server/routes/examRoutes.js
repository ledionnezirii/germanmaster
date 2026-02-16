const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const  protect  = require('../middleware/auth'); // Your auth middleware

// Public/authenticated routes
router.get('/levels', protect, examController.getAllExamLevels);
router.get('/level/:level', protect, examController.getExamsByLevel);
router.get('/:id', protect, examController.getExamById);

// Submit sections
router.post('/submit/listening', protect, examController.submitListening);
router.post('/submit/writing', protect, examController.submitWriting);
router.post('/submit/reading', protect, examController.submitReading);
router.post('/submit/complete', protect, examController.submitCompleteExam);

// User history
router.get('/user/history', protect, examController.getUserExamHistory);

// Admin routes
router.post('/', protect, examController.createExam);

module.exports = router;
