const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');
const protect = require('../middleware/auth');

// Listen tests audio
router.post('/audio/:testId', protect, ttsController.getAudio);

// Dictionary words audio
router.post('/dictionary/:wordId', protect, ttsController.getDictionaryAudio);

// Phrases audio
router.post('/phrase/:phraseId', protect, ttsController.getPhraseAudio);


// Check if audio exists (generic)
router.get('/check/:id', protect, ttsController.checkAudio);
router.post('/category/:categoryId/:wordIndex', ttsController.getCategoryAudio);
// Pre-generate audio (admin)
router.post('/pre-generate', protect, ttsController.preGenerateAudio);
router.post('/category/pre-generate', ttsController.preGenerateCategoryAudio);
router.post('/pronunciation/:wordId', protect, ttsController.getPronunciationAudio);

// Structure audio - NEW
router.post('/structure/:structureId/:itemIndex', protect, ttsController.getStructureAudio);
router.post('/structure/pre-generate', protect, ttsController.preGenerateStructureAudio);

// Check if audio exists (generic)
router.get('/check/:id', protect, ttsController.checkAudio);

// Pre-generate audio (admin)
router.post('/pre-generate', protect, ttsController.preGenerateAudio);


router.post('/exam/:examId/:questionIndex', protect, ttsController.getExamAudio);


router.post('/story/:storyId/:stepIndex', protect, ttsController.getStoryAudio);

router.post('/wordaudio/:setId/:wordIndex', protect, ttsController.getWordAudioAudio);
router.post('/wordaudio/pre-generate', protect, ttsController.preGenerateWordAudioAudio);


// Path exercise audio
router.post('/path/:exerciseId', protect, ttsController.getPathAudio);

module.exports = router;