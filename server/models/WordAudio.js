const mongoose = require("mongoose");

const wordPairSchema = new mongoose.Schema({
  germanWord: { type: String, required: true, trim: true },
  albanianWord: { type: String, required: true, trim: true },
});

const wordAudioSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    xp: { type: Number, required: true, default: 20 },
    words: [wordPairSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WordAudioSet", wordAudioSetSchema);