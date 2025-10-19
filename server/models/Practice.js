const mongoose = require("mongoose")

const practiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Verben",
        "Artikel",
        "Präpositionen",
        "Adjektive",
        "Pronomen",
        "Konjugation",
        "Deklination",
        "Satzbau",
        "Wortschatz",
      ],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    xp: {
      type: Number,
      required: [true, "XP is required"],
      default: 10,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["dropdown", "fillin", "checkbox", "radio"],
    },
    description: {
      type: String,
      trim: true,
    },
    // For all types: array of questions
    questions: [
      {
        // Question text (e.g., "Wer ist ___, die mit ___ spazieren geht.")
        questionText: {
          type: String,
          required: true,
        },
        // For dropdown/radio: array of options
        options: [
          {
            type: String,
          },
        ],
        // Correct answer(s)
        // For dropdown/radio/fillin: single string
        // For checkbox: array of strings
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        // Optional: hints or context
        hint: {
          type: String,
        },
        // For fill-in with multiple blanks
        blanks: [
          {
            correctAnswer: String,
            acceptableAnswers: [String], // Alternative correct answers
          },
        ],
      },
    ],
    // Example sentence to show pattern
    exampleSentence: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
practiceSchema.index({ level: 1, category: 1, isActive: 1 })

module.exports = mongoose.model("Practice", practiceSchema)
