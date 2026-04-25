const mongoose = require("mongoose")

const exerciseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["listenTest", "translate", "dictionaryWord", "wordAudio", "phrase", "sentence", "createWord"],
    required: true,
  },
  // Reference to existing content document
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  contentModel: {
    type: String,
    enum: ["Listen", "Translate", "Dictionary", "WordAudioSet", "Phrase", "Sentence", "CreateWord", null],
    default: null,
  },
  // Inline content (used when no contentId, or to override)
  question: { type: String, trim: true },       // text to display / prompt
  answer: { type: String, trim: true },          // correct answer
  translation: { type: String, trim: true },     // hint / translation shown to user
  audioText: { type: String, trim: true },       // text to convert to TTS audio
  audioUrl: { type: String, trim: true },        // pre-generated audio URL
  options: [{ type: String, trim: true }],       // MCQ options
  words: [{ type: String, trim: true }],         // for sentence ordering exercises
  xpReward: { type: Number, default: 5 },
})

const roundSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String, default: "⭐" },
  exercises: [exerciseSchema],
  xpReward: { type: Number, default: 20 },
  isPremium: { type: Boolean, default: false },
})

const pathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    language: {
      type: String,
      enum: ["de", "en", "fr", "tr", "it"],
      default: "de",
      index: true,
    },
    order: { type: Number, default: 0 },
    rounds: [roundSchema],
    totalXp: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
)

// Auto-calculate totalXp before save
pathSchema.pre("save", function (next) {
  if (this.rounds && this.rounds.length > 0) {
    this.totalXp = this.rounds.reduce((sum, r) => sum + (r.xpReward || 0), 0)
  }
  next()
})

pathSchema.index({ level: 1, language: 1, isActive: 1 })
pathSchema.index({ order: 1, level: 1 })

module.exports = mongoose.model("Path", pathSchema)
