const mongoose = require("mongoose")

const raceQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: Number,
    required: true,
  },
  level: {
    type: String,
    enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    required: true,
  },
  category: {
    type: String,
  },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false"],
    default: "multiple-choice",
  },
}, { timestamps: true })

// Model name is "RaceQuestion" to avoid conflict with existing Question model
module.exports = mongoose.models.RaceQuestion || mongoose.model("RaceQuestion", raceQuestionSchema)