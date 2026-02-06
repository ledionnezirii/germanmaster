const mongoose = require('mongoose');

const flashCardSchema = new mongoose.Schema({
  german_word: {
    type: String,
    required: true
  },
  translation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  xp_value: {
    type: Number,
    default: 10
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FlashCard', flashCardSchema);