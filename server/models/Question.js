const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: [200, "Answer cannot exceed 200 characters"],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: {
        values: ["A1", "A2", "B1", "B2", "C1", "C2"],
        message: "Level must be one of: A1, A2, B1, B2, C1, C2",
      },
    },
    category: {
      type: String,
      enum: ["grammar", "vocabulary", "pronunciation", "culture","articles","translation","Begginers","Präpositionen","Adjectives","Perfekt"],
      default: "grammar",
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    hints: [
      {
        type: String,
        trim: true,
      },
    ],
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, "Explanation cannot exceed 1000 characters"],
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    xpReward: {
      type: Number,
      default: 5,
      min: [1, "XP reward must be at least 1"],
    },
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

// Index for better performance
questionSchema.index({ level: 1, category: 1, isActive: 1 })
questionSchema.index({ question: "text" })

module.exports = mongoose.model("Question", questionSchema)
