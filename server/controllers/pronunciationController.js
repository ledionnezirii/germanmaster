const PronunciationPackage = require("../models/Pronunciation");
const User = require("../models/User");
const { addUserXp } = require("./xpController");

const FREE_PRONUNCIATION_LIMIT = 5;

const buildLanguageQuery = (language) => {
  if (!language) return {}
  if (language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}

const OpenAI = require("openai");
const { Readable } = require("stream");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Merr të gjitha paketat/fjalët default
exports.getWords = async (req, res) => {
  try {
    const { language } = req.query
    const langQuery = buildLanguageQuery(language)
    const packages = await PronunciationPackage.find({ isDefault: true, ...langQuery });
    res.status(200).json({ success: true, data: packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shto një paketë fjalësh (vetëm admin)
exports.addWord = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only admin can add packages" });
    }

    const { title, level, words, language = "de" } = req.body;

    if (!title || !Array.isArray(words) || words.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title and words array are required",
        });
    }

    const newPackage = await PronunciationPackage.create({
      title,
      level: level || "A1",
      language,
      words: words.map((w) => ({
        word: w.word,
        pronunciation: w.pronunciation,
        translation: w.translation,
        xp: w.xp || 5,
        notes: w.notes || "",
      })),
      isDefault: true,
    });

    res.status(201).json({
      success: true,
      message: "Package added successfully",
      data: newPackage,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Normalize German umlauts and ß so "u" ≈ "ü", "a" ≈ "ä" etc.
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s]/g, ""); // strip punctuation
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  // Exact match after normalization
  if (s1 === s2) return 1.0;

  // Strip German articles from both sides
  const strip = (s) => s.replace(/^(der|die|das|ein|eine|einen)\s+/i, "").trim();
  const c1 = strip(s1);
  const c2 = strip(s2);

  if (c1 === c2) return 0.95;

  // If one contains the other (compound words, extra words spoken)
  if (c1.includes(c2) || c2.includes(c1)) return 0.9;

  // Levenshtein on normalized strings — use the best of raw vs stripped
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  const rawScore = (maxLen - levenshtein(s1, s2)) / maxLen;

  const maxClean = Math.max(c1.length, c2.length);
  const cleanScore = maxClean === 0 ? 1 : (maxClean - levenshtein(c1, c2)) / maxClean;

  return Math.max(rawScore, cleanScore);
}

exports.checkPronunciation = async (req, res) => {
  try {
    const { packageId, wordIndex, spokenWord } = req.body;
    const userId = req.user.id;

    const pkg = await PronunciationPackage.findById(packageId);
    if (!pkg)
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });

    const wordObj = pkg.words[wordIndex];
    if (!wordObj)
      return res
        .status(404)
        .json({ success: false, message: "Word not found in package" });

    const user = await User.findById(userId);

    const wordKey = `${packageId}_${wordIndex}`;
    const alreadyCompleted =
      user.completedWords && user.completedWords.includes(wordKey);

    const similarity = calculateSimilarity(wordObj.word, spokenWord);
    // Duolingo-style tiers:
    //   >= 0.85  → perfect  (full XP)
    //   >= 0.60  → good     (80% XP, still marked correct)
    //   <  0.60  → wrong    (try again)
    const correct = similarity >= 0.60;

    let xpAdded = 0;

    if (correct) {
      const baseXp = wordObj.xp || 5;
      xpAdded = similarity >= 0.85 ? baseXp : Math.ceil(baseXp * 0.8);

      if (!user.completedWords) user.completedWords = [];
      if (!user.completedWords.includes(wordKey)) {
        user.completedWords.push(wordKey);
        await user.save();
        await addUserXp(userId, xpAdded); // only award XP once per word
      } else {
        xpAdded = 0; // already completed, no XP
        await user.save();
      }
    }

    const completedWordsInPackage = user.completedWords
      ? user.completedWords.filter((w) => w.startsWith(packageId)).length
      : 0;
    const passThreshold = Math.ceil(pkg.words.length * 0.7);
    const packageCompleted = completedWordsInPackage >= passThreshold;

    if (
      packageCompleted &&
      !user.completedPronunciationPackages.includes(pkg._id)
    ) {
      user.completedPronunciationPackages.push(pkg._id);
      await user.save();
    }

    res.status(200).json({
      success: true,
      correct,
      xpAdded,
      alreadyCompleted: alreadyCompleted,
      completed: packageCompleted,
      userXp: user.xp,
      completedWordsCount: completedWordsInPackage,
      passThreshold,
      similarity: Math.round(similarity * 100),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserCompletedPackages = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("completedPronunciationPackages isPaid")
      .populate({
        path: "completedPronunciationPackages",
        select: "_id title level",
      });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const completedPackages = (user.completedPronunciationPackages || []).map(
      (pkg) => ({
        _id: pkg._id.toString(),
        title: pkg.title,
        level: pkg.level,
      }),
    );

    console.log("[v0] Backend - Found completed packages:", completedPackages);

    res.status(200).json({
      success: true,
      data: {
        completedPronunciationPackages: completedPackages,
        isPaid: user.isPaid || false,
        freeLimit: FREE_PRONUNCIATION_LIMIT,
      },
    });
  } catch (err) {
    console.error("[v0] Backend - Error in getUserCompletedPackages:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No audio file" });
    }

    // Convert buffer to a readable stream the OpenAI SDK expects
    const stream = Readable.from(req.file.buffer);
    stream.path = "audio.webm"; // SDK uses this to determine file type

    const lang = req.body?.language || req.query?.language || "de"
    const transcription = await openai.audio.transcriptions.create({
      file: stream,
      model: "whisper-1",
      language: lang,
    });

    res.status(200).json({
      success: true,
      transcript: transcription.text?.toLowerCase().trim(),
    });
  } catch (err) {
    console.error("[transcribeAudio] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
