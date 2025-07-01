const mongoose = require("mongoose")

const listenSchema = new mongoose.Schema(
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
      maxlength: [2000, "Text cannot exceed 2000 characters"],
    },
    correctText: {
      type: String,
      required: [true, "Correct text is required"],
      trim: true,
    },
    audioUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in seconds
      min: [1, "Duration must be at least 1 second"],
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    xpReward: {
      type: Number,
      default: 10,
      min: [1, "XP reward must be at least 1"],
    },
    listenTestsPassed: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
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

// Index for better performance
listenSchema.index({ level: 1, isActive: 1 })
listenSchema.index({ title: "text", text: "text" })

module.exports = mongoose.model("Listen", listenSchema)
