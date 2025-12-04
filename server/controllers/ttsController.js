const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // German voice - "Daniel"

// Base path for audio files
const AUDIO_BASE_PATH = path.join(__dirname, '..', 'audios');

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Get audio file path based on type (listenTexts, dictionary, phrases)
const getAudioFilePath = (id, level, type = 'listenTexts') => {
  const typeFolder = path.join(AUDIO_BASE_PATH, type, level || 'A1');
  ensureDirectoryExists(typeFolder);
  return path.join(typeFolder, `${id}.mp3`);
};

// Check if audio exists
const audioExists = (id, level, type = 'listenTexts') => {
  const filePath = getAudioFilePath(id, level, type);
  return fs.existsSync(filePath);
};

// Generate audio with ElevenLabs
const generateAudio = async (text, id, level, type = 'listenTexts') => {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      data: {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    const filePath = getAudioFilePath(id, level, type);
    fs.writeFileSync(filePath, response.data);
    
    console.log(`[TTS] Audio saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('[TTS] ElevenLabs error:', error.response?.data || error.message);
    throw error;
  }
};

// Controller: Get or generate audio for listen tests
exports.getAudio = async (req, res) => {
  try {
    const { testId } = req.params;
    const { text, level } = req.body;

    if (!testId) {
      return res.status(400).json({ error: 'Test ID is required' });
    }

    const filePath = getAudioFilePath(testId, level, 'listenTexts');

    // Check if audio already exists
    if (audioExists(testId, level, 'listenTexts')) {
      console.log(`[TTS] Serving cached audio: ${filePath}`);
      return res.sendFile(filePath);
    }

    // Generate new audio if text is provided
    if (!text) {
      return res.status(404).json({ error: 'Audio not found and no text provided to generate' });
    }

    console.log(`[TTS] Generating new audio for test: ${testId}`);
    await generateAudio(text, testId, level, 'listenTexts');
    
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[TTS] Controller error:', error);
    return res.status(500).json({ error: 'Failed to get/generate audio' });
  }
};

// Controller: Get or generate audio for dictionary words
exports.getDictionaryAudio = async (req, res) => {
  try {
    const { wordId } = req.params;
    const { text, level } = req.body;

    if (!wordId) {
      return res.status(400).json({ error: 'Word ID is required' });
    }

    const filePath = getAudioFilePath(wordId, level, 'dictionary');

    // Check if audio already exists
    if (audioExists(wordId, level, 'dictionary')) {
      console.log(`[TTS] Serving cached dictionary audio: ${filePath}`);
      return res.sendFile(filePath);
    }

    // Generate new audio if text is provided
    if (!text) {
      return res.status(404).json({ error: 'Audio not found and no text provided to generate' });
    }

    console.log(`[TTS] Generating new dictionary audio for word: ${wordId}`);
    await generateAudio(text, wordId, level, 'dictionary');
    
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[TTS] Dictionary controller error:', error);
    return res.status(500).json({ error: 'Failed to get/generate dictionary audio' });
  }
};

// Controller: Get or generate audio for phrases
exports.getPhraseAudio = async (req, res) => {
  try {
    const { phraseId } = req.params;
    const { text, level } = req.body;

    if (!phraseId) {
      return res.status(400).json({ error: 'Phrase ID is required' });
    }

    const filePath = getAudioFilePath(phraseId, level, 'phrases');

    // Check if audio already exists
    if (audioExists(phraseId, level, 'phrases')) {
      console.log(`[TTS] Serving cached phrase audio: ${filePath}`);
      return res.sendFile(filePath);
    }

    // Generate new audio if text is provided
    if (!text) {
      return res.status(404).json({ error: 'Audio not found and no text provided to generate' });
    }

    console.log(`[TTS] Generating new phrase audio for: ${phraseId}`);
    await generateAudio(text, phraseId, level, 'phrases');
    
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[TTS] Phrase controller error:', error);
    return res.status(500).json({ error: 'Failed to get/generate phrase audio' });
  }
};

// Controller: Check if audio exists (generic)
exports.checkAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, type } = req.query;

    const exists = audioExists(id, level || 'A1', type || 'listenTexts');
    return res.json({ exists, id, level, type });
  } catch (error) {
    console.error('[TTS] Check error:', error);
    return res.status(500).json({ error: 'Failed to check audio' });
  }
};

// Controller: Pre-generate audio (for admin/batch use)
exports.preGenerateAudio = async (req, res) => {
  try {
    const { id, text, level, type } = req.body;

    if (!id || !text) {
      return res.status(400).json({ error: 'ID and text are required' });
    }

    const audioType = type || 'listenTexts';

    if (audioExists(id, level, audioType)) {
      return res.json({ message: 'Audio already exists', id, level, type: audioType });
    }

    await generateAudio(text, id, level, audioType);
    return res.json({ message: 'Audio generated successfully', id, level, type: audioType });
  } catch (error) {
    console.error('[TTS] Pre-generate error:', error);
    return res.status(500).json({ error: 'Failed to pre-generate audio' });
  }
};