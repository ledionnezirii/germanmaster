const mongoose = require("mongoose")

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  xpReward: {
    type: Number,
    default: 100,
  },
})

const weekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  topics: [topicSchema],
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
      required: true,
    },
    weeks: [weekSchema],
  },
  {
    timestamps: true,
  },
)

planSchema.index({ userId: 1, level: 1 })

module.exports = mongoose.model("Plan", planSchema)
