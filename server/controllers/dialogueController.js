const Story = require('../models/Dialogue');

// GET all stories (for browse/home screen)
const getStories = async (req, res) => {
  try {
    const { level, category } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (category) filter.category = category;

    const stories = await Story.find(filter).select('-dialogues');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stories', error: error.message });
  }
};

// GET single story with all dialogues
const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching story', error: error.message });
  }
};

// POST create a new story
const createStory = async (req, res) => {
  try {
    const story = new Story(req.body);
    const saved = await story.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating story', error: error.message });
  }
};

// POST generate audio for a dialogue step via ElevenLabs
const generateAudio = async (req, res) => {
  try {
    const { text, voice_id } = req.body;

    if (!text || !voice_id) {
      return res.status(400).json({ message: 'text and voice_id are required' });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ message: 'ElevenLabs error', detail: err });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating audio', error: error.message });
  }
};

// POST check user answer for a dialogue step
const checkAnswer = async (req, res) => {
  try {
    const { story_id, step_index, answer } = req.body;

    const story = await Story.findById(story_id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const step = story.dialogues[step_index];
    if (!step) return res.status(404).json({ message: 'Step not found' });

    let is_correct = false;

    if (step.response_type === 'multiple_choice') {
      const selected = step.options.find(o => o.text === answer);
      is_correct = selected ? selected.is_correct : false;
    } else if (step.response_type === 'word_boxes') {
      const userSentence = answer.trim().toLowerCase();
      const correct = step.word_boxes.correct_sentence.trim().toLowerCase();
      is_correct = userSentence === correct;
    }

    res.json({ is_correct });
  } catch (error) {
    res.status(500).json({ message: 'Error checking answer', error: error.message });
  }
};

module.exports = { getStories, getStoryById, createStory, generateAudio, checkAnswer };