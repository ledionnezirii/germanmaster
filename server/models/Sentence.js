const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  correctSentence: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
});

const sentenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    xp: {
      type: Number,
      required: true,
      default: 10,
    },
    questions: [questionSchema],
    completedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sentence", sentenceSchema);
