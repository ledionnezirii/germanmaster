const mongoose = require("mongoose");

const pronunciationPackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" },
  words: [{ 
    word: String, 
    pronunciation: String, 
    translation: String, 
    xp: Number, 
    notes: String 
  }],
  isDefault: { type: Boolean, default: true } // fjalët për të gjithë
}, { timestamps: true });

module.exports = mongoose.model("PronunciationPackage", pronunciationPackageSchema);
