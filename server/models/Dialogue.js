const mongoose = require('mongoose');

const WordBoxSchema = new mongoose.Schema({
  correct_sentence: String,
  words: [String]
});

const OptionSchema = new mongoose.Schema({
  text: String,
  is_correct: Boolean
});

const DialogueStepSchema = new mongoose.Schema({
  speaker: String,
  text: String,
  voice_id: String,
  response_type: {
    type: String,
    enum: ['none', 'multiple_choice', 'word_boxes'],
    default: 'none'
  },
  options: [OptionSchema],
  word_boxes: WordBoxSchema
});

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  category: {
    type: String,
    enum: ['shopping', 'travel', 'restaurant', 'work', 'daily_life', 'social']
  },
  xp_reward: { type: Number, default: 50 },
  thumbnail_url: String,
  dialogues: [DialogueStepSchema]
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);