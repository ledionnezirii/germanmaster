const mongoose = require("mongoose")

const dictionarySchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: [true, "Word is required"],
      trim: true,
      maxlength: [100, "Word cannot exceed 100 characters"],
    },
    translation: {
      type: String,
      required: [true, "Translation is required"],
      trim: true,
      maxlength: [200, "Translation cannot exceed 200 characters"],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: {
        values: ["A1", "A2", "B1", "B2", "C1", "C2"],
        message: "Level must be one of: A1, A2, B1, B2, C1, C2",
      },
    },
    pronunciation: {
      type: String,
      trim: true,
    },
    partOfSpeech: {
      type: String,
      enum: [
        // English terms
        "noun", "verb", "adjective", "adverb", "preposition", 
        "conjunction", "interjection", "article","pronoun",
        // Albanian terms
        "emër", "folje", "mbiemër", "ndajfolje", "parafjalë", 
        "lidhëz", "thirrje", "nyjë","përemër",
      ],
      lowercase: true,
    },
    examples: [
      {
        german: {
          type: String,
          required: true,
          trim: true,
        },
        albanian: {  // Changed from 'english' to 'albanian'
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
dictionarySchema.index({ word: 1 })
dictionarySchema.index({ level: 1 })
dictionarySchema.index({ word: "text", translation: "text" })

module.exports = mongoose.model("Dictionary", dictionarySchema)
