const mongoose = require("mongoose")

const planTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  xpReward: {  // <CHANGE> Added xpReward field that was missing
    type: Number,
    default: 100,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  xpAwarded: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
  },
})

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      default: "A1",
      required: true,
    },
    topics: [planTopicSchema],
  },
  {
    timestamps: true,
  },
)

// <CHANGE> Add compound unique index on userId + level
// This allows each user to have one plan per level
planSchema.index({ userId: 1, level: 1 }, { unique: true })

module.exports = mongoose.model("Plan", planSchema)