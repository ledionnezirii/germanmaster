const mongoose = require("mongoose")

const phraseSchema = new mongoose.Schema(
  {
    german: {
      type: String,
      required: [true, "German phrase is required"],
      trim: true,
    },
    albanian: {
      type: String,
      required: [true, "Albanian translation is required"],
      trim: true,
    },
    xp: {
      type: Number,
      default: 10,
      min: [0, "XP cannot be negative"],
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: [true, "Level is required"],
    },
    category: {
      type: String,
      default: "General",
    },
    difficulty: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    usageExample: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
phraseSchema.index({ level: 1, isActive: 1 })
phraseSchema.index({ german: "text", albanian: "text" })

module.exports = mongoose.model("Phrase", phraseSchema)
