const mongoose = require("mongoose")

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dictionary",
      required: [true, "Word ID is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicates and improve performance
favoriteSchema.index({ userId: 1, wordId: 1 }, { unique: true })

module.exports = mongoose.model("Favorite", favoriteSchema)
