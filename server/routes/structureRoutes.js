const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const  protect  = require('../middleware/auth'); // Your auth middleware

// Public routes
router.get('/', structureController.getAllStructures);
router.get('/:id', structureController.getStructureById);

// Protected routes (require authentication)
router.post('/', protect, structureController.createStructure);
router.put('/:id', protect, structureController.updateStructure);
router.delete('/:id', protect, structureController.deleteStructure);

// Quiz and progress routes
router.post('/quiz/submit', protect, structureController.submitQuiz);
router.get('/progress/me', protect, structureController.getUserProgress);

module.exports = router;