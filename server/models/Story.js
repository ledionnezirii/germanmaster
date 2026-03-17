const mongoose = require("mongoose");

const storyStepSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["narration", "dialogue", "question"],
    required: true,
  },
  speaker: {
    type: String, // e.g. "Kellner", "Verkäufer", "Lehrer", "Erzähler"
    default: null,
  },
  germanText: {
    type: String,
    required: true,
  },
  albanianText: {
    type: String,
    default: "",
  },
  // Only for question steps
  questionType: {
    type: String,
    enum: ["word_order", null],
    default: null,
  },
  correctAnswer: {
    type: String, // The correct full sentence
    default: null,
  },
  wordChoices: {
    type: [String], // Shuffled word options user clicks
    default: [],
  },
  // Voice settings for TTS
  voiceGender: {
    type: String,
    enum: ["male", "female", null],
    default: null,
  },
});

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    albanianTitle: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    // Scenario type for the dialogue setting
    scenario: {
      type: String,
      enum: ["restaurant", "store", "school", "doctor", "hotel", "bakery", "airport", "train_station", "bank", "pharmacy", "custom"],
      default: "restaurant",
    },
    // Description of the scenario setting
    scenarioDescription: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "general",
    },
    coverImage: {
      type: String,
      default: null,
    },
    steps: [storyStepSchema],
    xpReward: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Story || mongoose.model("Story", storySchema);
