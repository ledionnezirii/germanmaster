const mongoose = require("mongoose");


const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" },
  xp: { type: Number, default: 0 }, // <-- XP for this quiz
 questions: [
  {
    type: {
      type: String,
      enum: ["multiple-choice", "fill-in", "drop-down"], // <-- add drop-down here
      required: true
    },
    questionText: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true }
  }
]

}, { timestamps: true });


module.exports = mongoose.model("Quiz", quizSchema);
