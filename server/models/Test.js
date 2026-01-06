const mongoose = require("mongoose")
const User = require("./User")

const questionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["multiple-choice", "fill-in-blank", "true-false"],
      default: "multiple-choice",
    },
    options: [
      {
        label: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
      },
    ],
    correctAnswer: {
      type: String,
      required: true,
    },
    timeLimit: {
      type: Number,
      default: 60,
    },
    points: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  },
)

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    xp: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTime: {
      type: Number,
      required: true,
    },
    questions: [questionSchema],
    category: {
      type: String,
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "admin",
    },
    tags: [String],
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
)

testSchema.virtual("totalQuestions").get(function () {
  return this.questions.length
})

testSchema.virtual("totalPoints").get(function () {
  return this.questions.reduce((total, question) => total + question.points, 0)
})

testSchema.set("toJSON", { virtuals: true })
testSchema.set("toObject", { virtuals: true })

const userTestHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        selectedAnswer: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        points: {
          type: Number,
          default: 0,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    // NEW FIELDS FOR SECURITY
    isViolation: {
      type: Boolean,
      default: false,
    },
    violationType: {
      type: String,
      enum: ["tab_switch", "window_blur", "test_abandoned", "test_cancelled", null],
      default: null,
    },
    nextAvailableAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

userTestHistorySchema.index({ userId: 1, testId: 1 })
userTestHistorySchema.index({ userId: 1, completedAt: -1 })
userTestHistorySchema.index({ userId: 1, level: 1, completedAt: -1 })

const UserTestHistory = mongoose.model("UserTestHistory", userTestHistorySchema)

module.exports = { Test: mongoose.model("Test", testSchema), UserTestHistory, User }