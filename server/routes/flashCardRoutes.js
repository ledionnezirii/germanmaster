// routes/flashCardRoutes.js
const express = require('express');
const router = express.Router();
const flashCardController = require('../controllers/flashCardController');
const protect = require("../middleware/auth");

// Public routes - Get flashcards (no auth required)
router.get('/', flashCardController.getAllFlashCards);
router.get('/:id', flashCardController.getFlashCardById);

// Protected routes - Require authentication
router.post('/', protect, flashCardController.createFlashCard);
router.put('/:id', protect, flashCardController.updateFlashCard);
router.delete('/:id', protect, flashCardController.deleteFlashCard);

// Add XP to user (protected - requires auth)
router.post('/xp/add', protect, flashCardController.addXP);

module.exports = router;