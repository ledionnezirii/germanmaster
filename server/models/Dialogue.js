const mongoose = require("mongoose");

const dialogueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: [true, "Level is required"],
    },
    xp: {
      type: Number,
      default: 50,
      required: [true, "XP is required"],
    },
    dialogue: [
      {
        speaker: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        translation: {
          type: String,
        },
      },
    ],
    questions: [
      {
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
      },
    ],
    audioUrl: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    category: {
      type: String,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dialogue", dialogueSchema);