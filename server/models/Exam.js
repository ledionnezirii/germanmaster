const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
    question: { type: String },
  options: [String],
  correctAnswer: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['listening', 'writing', 'reading'], 
    required: true 
  }
});

const examSchema = new mongoose.Schema({
  level: { 
    type: String, 
    required: true,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  },
  subLevel: { 
    type: String, 
    required: true 
  },
  
  listeningQuestions: [questionSchema],
  writingQuestions: [questionSchema],
  readingQuestions: [questionSchema],
  
  totalXp: { type: Number, default: 100 },
  passingScore: { type: Number, default: 75 },
  
  createdAt: { type: Date, default: Date.now }
});

const userExamAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  
  listeningScore: { type: Number, default: 0 },
  writingScore: { type: Number, default: 0 },
  readingScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  
  listeningAnswers: [mongoose.Schema.Types.Mixed],
  writingAnswers: [String],
  readingAnswers: [String],
  
  passed: { type: Boolean, default: false },
  xpEarned: { type: Number, default: 0 },
  
  completedAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', examSchema);
const UserExamAttempt = mongoose.model('UserExamAttempt', userExamAttemptSchema);

module.exports = { Exam, UserExamAttempt };