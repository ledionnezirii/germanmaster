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
    // NEW: Dialogue type
    dialogueType: {
      type: String,
      enum: ["regular", "sentence_builder", "free_write"],
      default: "regular",
      required: true,
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
        // NEW: For sentence_builder and free_write types
        isUserTurn: {
          type: Boolean,
          default: false,
        },
        // NEW: For sentence_builder - words to choose from (shuffled)
        wordOptions: [{
          type: String,
        }],
        // NEW: For free_write - the correct answer to compare against
        correctAnswer: {
          type: String,
        },
        // NEW: Hint for the user
        hint: {
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