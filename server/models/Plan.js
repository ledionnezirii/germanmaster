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
      unique: true, // Unique per user, per level (implicitly handled by findOne in controller)
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

module.exports = mongoose.model("Plan", planSchema)
