const Pronunciation = require("../models/Pronunciation");
const User = require("../models/User");

// Merr të gjitha fjalët për user-in (default + user-specific)
exports.getWords = async (req, res) => {
  try {
    const words = await Pronunciation.find({ isDefault: true }); // everyone sees same words
    res.status(200).json({ success: true, data: words });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shto një fjalë të re
exports.addWord = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can add words" });
    }

    const { word, pronunciation, translation, level, xp, notes } = req.body;

    const newWord = await Pronunciation.create({
      word,
      pronunciation,
      translation,
      level,
      xp,
      notes,
      isDefault: true
    });

    res.status(201).json({
      success: true,
      message: "Fjala u shtua",
      data: newWord
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Kontrollon shqiptimin e user-it dhe i jep XP nëse është i saktë
exports.checkPronunciation = async (req, res) => {
  try {
    const { wordId, spokenWord } = req.body;
    const userId = req.user.id;

    const word = await Pronunciation.findById(wordId);
    if (!word) return res.status(404).json({ success: false, message: "Fjala nuk u gjet" });

    const correct = word.word.toLowerCase() === spokenWord.toLowerCase();
    let xpAdded = 0;

    if (correct) {
      xpAdded = word.xp || 5; // merr XP nga fjalë
      const user = await User.findById(userId);
      user.xp += xpAdded;
      await user.save();
    }

    res.status(200).json({
      success: true,
      correct,
      xpAdded,
      userXp: correct ? (await User.findById(userId)).xp : undefined
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Shto shumë fjalë njëherësh (vetëm admin)
exports.addMultipleWords = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can add words" });
    }

    const { words } = req.body; // presim një array me fjalë

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ success: false, message: "Words array is required" });
    }

    const insertedWords = await Pronunciation.insertMany(
      words.map((w) => ({
        word: w.word,
        pronunciation: w.pronunciation,
        translation: w.translation,
        level: w.level || "A1",
        xp: w.xp || 5,
        notes: w.notes || "",
        isDefault: true
      }))
    );

    res.status(201).json({
      success: true,
      message: `${insertedWords.length} words were added successfully`,
      data: insertedWords
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

