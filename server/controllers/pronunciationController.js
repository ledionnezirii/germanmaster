const PronunciationPackage = require("../models/Pronunciation");
const User = require("../models/User");

// Merr të gjitha paketat/fjalët default
exports.getWords = async (req, res) => {
  try {
    const packages = await PronunciationPackage.find({ isDefault: true });
    res.status(200).json({ success: true, data: packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shto një paketë fjalësh (vetëm admin)
exports.addWord = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can add packages" });
    }

    const { title, level, words } = req.body;

    if (!title || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ success: false, message: "Title and words array are required" });
    }

    const newPackage = await PronunciationPackage.create({
      title,
      level: level || "A1",
      words: words.map(w => ({
        word: w.word,
        pronunciation: w.pronunciation,
        translation: w.translation,
        xp: w.xp || 5,
        notes: w.notes || ""
      })),
      isDefault: true
    });

    res.status(201).json({
      success: true,
      message: "Package added successfully",
      data: newPackage
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.checkPronunciation = async (req, res) => {
  try {
    const { packageId, wordIndex, spokenWord } = req.body;
    const userId = req.user.id;

    const pkg = await PronunciationPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    const wordObj = pkg.words[wordIndex];
    if (!wordObj) return res.status(404).json({ success: false, message: "Word not found in package" });

    const correct = wordObj.word.toLowerCase() === spokenWord.toLowerCase();
    let xpAdded = 0;

    const user = await User.findById(userId);

    if (correct) {
      xpAdded = wordObj.xp || 5;
      user.xp += xpAdded;
      await user.save();
    }

    // Kontrollo nëse ishte fjala e fundit e paketës
    if (wordIndex + 1 === pkg.words.length) {
      if (!user.completedPronunciationPackages.includes(pkg._id)) {
        user.completedPronunciationPackages.push(pkg._id);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      correct,
      xpAdded,
      completed: user.completedPronunciationPackages.includes(pkg._id),
      userXp: user.xp,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};