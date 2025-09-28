const PronunciationPackage = require("../models/Pronunciation")
const User = require("../models/User")

// Merr të gjitha paketat/fjalët default
exports.getWords = async (req, res) => {
  try {
    const packages = await PronunciationPackage.find({ isDefault: true })
    res.status(200).json({ success: true, data: packages })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Shto një paketë fjalësh (vetëm admin)
exports.addWord = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can add packages" })
    }

    const { title, level, words } = req.body

    if (!title || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ success: false, message: "Title and words array are required" })
    }

    const newPackage = await PronunciationPackage.create({
      title,
      level: level || "A1",
      words: words.map((w) => ({
        word: w.word,
        pronunciation: w.pronunciation,
        translation: w.translation,
        xp: w.xp || 5,
        notes: w.notes || "",
      })),
      isDefault: true,
    })

    res.status(201).json({
      success: true,
      message: "Package added successfully",
      data: newPackage,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 1.0

  // Remove common German articles and particles that might be missed
  const cleanS1 = s1.replace(/^(der|die|das|ein|eine|einen)\s+/i, "").trim()
  const cleanS2 = s2.replace(/^(der|die|das|ein|eine|einen)\s+/i, "").trim()

  if (cleanS1 === cleanS2) return 0.95

  // Check if one contains the other (for compound words)
  if (s1.includes(s2) || s2.includes(s1)) return 0.9

  // Levenshtein distance for similarity
  const matrix = []
  const len1 = s1.length
  const len2 = s2.length

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  const maxLen = Math.max(len1, len2)
  return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen
}

exports.checkPronunciation = async (req, res) => {
  try {
    const { packageId, wordIndex, spokenWord } = req.body
    const userId = req.user.id

    const pkg = await PronunciationPackage.findById(packageId)
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" })

    const wordObj = pkg.words[wordIndex]
    if (!wordObj) return res.status(404).json({ success: false, message: "Word not found in package" })

    const user = await User.findById(userId)

    const wordKey = `${packageId}_${wordIndex}`
    const alreadyCompleted = user.completedWords && user.completedWords.includes(wordKey)

    const similarity = calculateSimilarity(wordObj.word, spokenWord)
    const correct = similarity >= 0.6 // Much more forgiving like Duolingo

    let xpAdded = 0

    if (correct) {
      const baseXp = wordObj.xp || 5
      xpAdded = similarity >= 0.95 ? baseXp : Math.ceil(baseXp * 0.8)
      user.xp += xpAdded

      if (!user.completedWords) user.completedWords = []
      if (!user.completedWords.includes(wordKey)) {
        user.completedWords.push(wordKey)
      }

      await user.save()
    }

    const completedWordsInPackage = user.completedWords
      ? user.completedWords.filter((w) => w.startsWith(packageId)).length
      : 0
    const passThreshold = Math.ceil(pkg.words.length * 0.7)
    const packageCompleted = completedWordsInPackage >= passThreshold

    if (packageCompleted && !user.completedPronunciationPackages.includes(pkg._id)) {
      user.completedPronunciationPackages.push(pkg._id)
      await user.save()
    }

    res.status(200).json({
      success: true,
      correct,
      xpAdded,
      alreadyCompleted: false, // Always return false so users always get XP
      completed: packageCompleted,
      userXp: user.xp,
      completedWordsCount: completedWordsInPackage,
      passThreshold,
      similarity: Math.round(similarity * 100),
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getUserCompletedPackages = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select("completedPronunciationPackages").populate({
      path: "completedPronunciationPackages",
      select: "_id title level",
    })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const completedPackages = (user.completedPronunciationPackages || []).map((pkg) => ({
      _id: pkg._id.toString(),
      title: pkg.title,
      level: pkg.level,
    }))

    console.log("[v0] Backend - Found completed packages:", completedPackages)

    res.status(200).json({
      success: true,
      data: {
        completedPronunciationPackages: completedPackages,
      },
    })
  } catch (err) {
    console.error("[v0] Backend - Error in getUserCompletedPackages:", err)
    res.status(500).json({ success: false, message: err.message })
  }
}
