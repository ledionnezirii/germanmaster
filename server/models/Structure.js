const mongoose = require('mongoose');

const structureItemSchema = new mongoose.Schema({
  german: {
    type: String,
    required: true
  },
  albanian: {
    type: String,
    required: true
  },
  example: {
    type: String,
    default: ''
  }
});

const structureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  level: {
    type: String,
    required: true,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  },
  type: {
    type: String,
    required: true,
    enum: ['verbs', 'sentences', 'nouns', 'adjectives', 'phrases', 'grammar']
  },
  xp: {
    type: Number,
    required: true,
    default: 10
  },
  items: [structureItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Structure', structureSchema);