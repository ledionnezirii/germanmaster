const mongoose = require("mongoose");

const pronunciationSchema = new mongoose.Schema({
  word: { type: String, required: true, trim: true },
  pronunciation: { type: String, trim: true },
  translation: { type: String, trim: true },
  level: { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" },
  xp: { type: Number, default: 5 },
  notes: { type: String, trim: true },
  isDefault: { type: Boolean, default: true } // all words are default
}, { timestamps: true });

module.exports = mongoose.model("Pronunciation", pronunciationSchema);
