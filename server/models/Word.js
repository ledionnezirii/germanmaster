const mongoose = require("mongoose")

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: [true, "Word is required"],
      trim: true,
    },
    translation: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
wordSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model("Word", wordSchema)
