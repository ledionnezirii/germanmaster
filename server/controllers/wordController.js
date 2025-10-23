const Word = require("../models/Word")
const User = require("../models/User")

// Get all learned words for the authenticated user
exports.getLearnedWords = async (req, res) => {
  try {
    const words = await Word.find({ userId: req.user.id }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: words,
    })
  } catch (error) {
    console.error("Error fetching learned words:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch learned words",
      error: error.message,
    })
  }
}

// Add a new learned word
exports.addLearnedWord = async (req, res) => {
  try {
    const { word, translation, notes } = req.body

    if (!word || word.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Word is required",
      })
    }

    // Check if word already exists for this user
    const existingWord = await Word.findOne({
      userId: req.user.id,
      word: word.trim(),
    })

    if (existingWord) {
      return res.status(400).json({
        success: false,
        message: "This word is already in your learned words",
      })
    }

    const newWord = await Word.create({
      word: word.trim(),
      translation: translation?.trim() || "",
      notes: notes?.trim() || "",
      userId: req.user.id,
    })

    // Update user's learnedWords array
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { learnedWords: newWord._id },
    })

    res.status(201).json({
      success: true,
      data: newWord,
      message: "Word added successfully",
    })
  } catch (error) {
    console.error("Error adding learned word:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add learned word",
      error: error.message,
    })
  }
}

// Update a learned word
exports.updateLearnedWord = async (req, res) => {
  try {
    const { id } = req.params
    const { word, translation, notes } = req.body

    const existingWord = await Word.findOne({
      _id: id,
      userId: req.user.id,
    })

    if (!existingWord) {
      return res.status(404).json({
        success: false,
        message: "Word not found",
      })
    }

    const updatedWord = await Word.findByIdAndUpdate(
      id,
      {
        word: word?.trim() || existingWord.word,
        translation: translation?.trim() || existingWord.translation,
        notes: notes?.trim() || existingWord.notes,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      data: updatedWord,
      message: "Word updated successfully",
    })
  } catch (error) {
    console.error("Error updating learned word:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update learned word",
      error: error.message,
    })
  }
}

// Remove a learned word
exports.removeLearnedWord = async (req, res) => {
  try {
    const { id } = req.params

    const word = await Word.findOne({
      _id: id,
      userId: req.user.id,
    })

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found",
      })
    }

    await Word.findByIdAndDelete(id)

    // Remove from user's learnedWords array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { learnedWords: id },
    })

    res.status(200).json({
      success: true,
      message: "Word removed successfully",
    })
  } catch (error) {
    console.error("Error removing learned word:", error)
    res.status(500).json({
      success: false,
      message: "Failed to remove learned word",
      error: error.message,
    })
  }
}

// Get word statistics
exports.getWordStats = async (req, res) => {
  try {
    const totalWords = await Word.countDocuments({ userId: req.user.id })

    const wordsThisWeek = await Word.countDocuments({
      userId: req.user.id,
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })

    const wordsThisMonth = await Word.countDocuments({
      userId: req.user.id,
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    })

    res.status(200).json({
      success: true,
      data: {
        totalWords,
        wordsThisWeek,
        wordsThisMonth,
      },
    })
  } catch (error) {
    console.error("Error fetching word stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch word statistics",
      error: error.message,
    })
  }
}

exports.addQuizXp = async (req, res) => {
  try {
    const { xp } = req.body

    if (!xp || xp <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid XP amount",
      })
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    user.xp = (user.xp || 0) + xp
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        xp: user.xp,
        xpGained: xp,
      },
      message: `You earned ${xp} XP!`,
    })
  } catch (error) {
    console.error("Error adding XP:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add XP",
      error: error.message,
    })
  }
}

exports.getQuizWord = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get all user's words
    const allWords = await Word.find({ userId }).lean()

    if (allWords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No words available for quiz",
      })
    }

    // Initialize or get current quiz cycle
    if (!user.quizCycle || user.quizCycle.length === 0) {
      // Create a new shuffled cycle with all word IDs
      const shuffledIds = allWords.map((w) => w._id.toString())
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]]
      }
      user.quizCycle = shuffledIds
      user.quizCycleIndex = 0
      await user.save()
    }

    // Get current word from cycle
    const currentWordId = user.quizCycle[user.quizCycleIndex]
    const currentWord = allWords.find((w) => w._id.toString() === currentWordId)

    // Move to next word in cycle
    user.quizCycleIndex += 1

    // If we've reached the end of the cycle, reset for next round
    if (user.quizCycleIndex >= user.quizCycle.length) {
      // Reshuffle for next cycle
      const shuffledIds = allWords.map((w) => w._id.toString())
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]]
      }
      user.quizCycle = shuffledIds
      user.quizCycleIndex = 0
    }

    await user.save()

    res.status(200).json({
      success: true,
      data: currentWord,
      cycleProgress: {
        current: user.quizCycleIndex,
        total: user.quizCycle.length,
        isNewCycle: user.quizCycleIndex === 0,
      },
    })
  } catch (error) {
    console.error("Error getting quiz word:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get quiz word",
      error: error.message,
    })
  }
}

exports.resetQuizCycle = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    user.quizCycle = []
    user.quizCycleIndex = 0
    await user.save()

    res.status(200).json({
      success: true,
      message: "Quiz cycle reset successfully",
    })
  } catch (error) {
    console.error("Error resetting quiz cycle:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reset quiz cycle",
      error: error.message,
    })
  }
}
