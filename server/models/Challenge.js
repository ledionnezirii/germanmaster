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
      score: {
        type: Number,
        default: 0
      },
      xp: {
        type: Number,
        default: 0
      },
      answers: [
        {
          questionId: Number,
          answer: String,
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
  questions: [
    {
      id: Number,
      question: String,
      options: [String],
      correctAnswer: String,
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
  gameType: {
    type: String,
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
