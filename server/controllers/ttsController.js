const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = 't6LrOJGOwJlvBxDA0qqG'; // German voice - "Daniel"

// Base path for audio files
const AUDIO_BASE_PATH = path.join(__dirname, '..', 'audios');

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Get audio file path based on type (listenTexts, dictionary, phrases, dialogues)
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
const generateAudio = async (text, id, level, type = 'listenTexts', voiceId = ELEVENLABS_VOICE_ID) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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

// Controller: Get or generate audio for dialogue lines
exports.getDialogueAudio = async (req, res) => {
  try {
    const { dialogueId, lineIndex } = req.params;
    const { text, level } = req.body;

    if (!dialogueId) {
      return res.status(400).json({ error: 'Dialogue ID is required' });
    }

    // Create unique ID for dialogue line: dialogueId_lineIndex
    const audioId = `${dialogueId}_${lineIndex}`;
    const filePath = getAudioFilePath(audioId, level, 'dialogues');

    // Check if audio already exists
    if (audioExists(audioId, level, 'dialogues')) {
      console.log(`[TTS] Serving cached dialogue audio: ${filePath}`);
      return res.sendFile(filePath);
    }

    // Generate new audio if text is provided
    if (!text) {
      return res.status(404).json({ error: 'Audio not found and no text provided to generate' });
    }

    console.log(`[TTS] Generating new dialogue audio for: ${audioId}`);
    await generateAudio(text, audioId, level, 'dialogues');
    
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[TTS] Dialogue controller error:', error);
    return res.status(500).json({ error: 'Failed to get/generate dialogue audio' });
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

// Controller: Pre-generate all dialogue audio lines
exports.preGenerateDialogueAudio = async (req, res) => {
  try {
    const { dialogueId, dialogueLines, level } = req.body;

    if (!dialogueId || !dialogueLines || !Array.isArray(dialogueLines)) {
      return res.status(400).json({ error: 'Dialogue ID and lines array are required' });
    }

    const results = [];

    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i];
      const audioId = `${dialogueId}_${i}`;

      if (audioExists(audioId, level, 'dialogues')) {
        results.push({ index: i, status: 'exists', audioId });
      } else {
        try {
          await generateAudio(line.text, audioId, level, 'dialogues');
          results.push({ index: i, status: 'generated', audioId });
        } catch (error) {
          results.push({ index: i, status: 'error', audioId, error: error.message });
        }
      }
    }

    return res.json({ 
      message: 'Dialogue audio processing complete', 
      dialogueId, 
      level,
      results 
    });
  } catch (error) {
    console.error('[TTS] Pre-generate dialogue error:', error);
    return res.status(500).json({ error: 'Failed to pre-generate dialogue audio' });
  }
}