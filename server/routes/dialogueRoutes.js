const express = require('express');
const router = express.Router();
const {
  getStories,
  getStoryById,
  createStory,
  generateAudio,
  checkAnswer
} = require('../controllers/dialogueController');

// Stories
router.get('/stories', getStories);
router.get('/stories/:id', getStoryById);
router.post('/stories', createStory);

// Audio generation (ElevenLabs proxy)
router.post('/audio/generate', generateAudio);

// Answer checking
router.post('/answer/check', checkAnswer);

module.exports = router;