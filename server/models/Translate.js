const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"],
    trim: true,
  },
  options: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
  correctAnswer: {
    type: String,
    required: [true, "Correct answer is required"],
    trim: true,
  },
  explanation: {
    type: String,
    trim: true,
  },
})

const translateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: {
        values: ["A1", "A2", "B1", "B2", "C1", "C2"],
        message: "Level must be one of: A1, A2, B1, B2, C1, C2",
      },
    },
    text: {
      type: String,
      required: [true, "Text is required"],
      trim: true,
      maxlength: [5000, "Text cannot exceed 5000 characters"],
    },
    questions: [questionSchema],
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    estimatedTime: {
      type: Number, // in minutes
      min: [1, "Estimated time must be at least 1 minute"],
    },
    xpReward: {
      type: Number,
      default: 20,
      min: [1, "XP reward must be at least 1"],
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

const translateProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    textId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Translate",
    },
    questionsAnswered: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for user progress - prevent duplicates
translateProgressSchema.index({ userId: 1, textId: 1 }, { unique: true })

// Index for better performance
translateSchema.index({ level: 1, isActive: 1 })
translateSchema.index({ title: "text", text: "text" })
translateProgressSchema.index({ userId: 1, completed: 1 })
translateProgressSchema.index({ textId: 1 })

const Translate = mongoose.model("Translate", translateSchema)
const TranslateProgress = mongoose.model("TranslateProgress", translateProgressSchema)

module.exports = { Translate, TranslateProgress }
