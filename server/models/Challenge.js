const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  users: [
    {
      username: {
        type: String,
        required: true
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      socketId: String,
      score: { // For quiz
        type: Number,
        default: 0
      },
      wordsTyped: { // For wordRace
        type: Number,
        default: 0
      },
      correctWords: { // For wordRace
        type: Number,
        default: 0
      },
      xp: {
        type: Number,
        default: 0
      },
      answers: [
        {
          questionId: Number, // For quiz
          answer: String, // For quiz
          typedWord: String, // For wordRace
          isCorrect: Boolean,
          timeSpent: Number,
          timestamp: Date
        }
      ],
      finished: {
        type: Boolean,
        default: false
      },
      finishTime: Date,
      isWinner: {
        type: Boolean,
        default: false
      }
    }
  ],
  questions: [ // This will now hold either quiz questions or words for typing
    {
      id: Number,
      question: String, // For quiz
      options: [String], // For quiz
      correctAnswer: String, // For quiz
      word: String, // For wordRace
      translation: String, // For wordRace
      category: String
    }
  ],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: String,
    default: null
  },
  gameType: { // NEW: To differentiate between quiz and word race
    type: String,
    enum: ["quiz", "wordRace"],
    default: "quiz"
  },
  timeLimit: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better performance
challengeSchema.index({ status: 1, createdAt: -1 });
challengeSchema.index({ 'users.userId': 1 });
challengeSchema.index({ gameType: 1 });

module.exports = mongoose.model("Challenge", challengeSchema);
