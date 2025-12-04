const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');
const  protect  = require('../middleware/auth'); // adjust path as needed

// Listen tests audio
router.post('/audio/:testId', protect, ttsController.getAudio);

// Dictionary words audio
router.post('/dictionary/:wordId', protect, ttsController.getDictionaryAudio);

// Phrases audio
router.post('/phrase/:phraseId', protect, ttsController.getPhraseAudio);

// Check if audio exists (generic)
router.get('/check/:id', protect, ttsController.checkAudio);

// Pre-generate audio (admin)
router.post('/pre-generate', protect, ttsController.preGenerateAudio);

module.exports = router;