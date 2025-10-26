const Phrase = require("../models/Phrase")
const User = require("../models/User")

// Get all phrases with optional filters
exports.getAllPhrases = async (req, res) => {
  try {
    const { level, category, page = 1, limit = 20 } = req.query

    const query = { isActive: true }
    if (level) query.level = level
    if (category) query.category = category

    const phrases = await Phrase.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Phrase.countDocuments(query)

    res.status(200).json({
      success: true,
      data: phrases,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching phrases",
      error: error.message,
    })
  }
}

// Get phrases by level
exports.getPhrasesByLevel = async (req, res) => {
  try {
    const { level } = req.params
    const { page = 1, limit = 20 } = req.query

    const phrases = await Phrase.find({ level, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Phrase.countDocuments({ level, isActive: true })

    res.status(200).json({
      success: true,
      data: phrases,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching phrases by level",
      error: error.message,
    })
  }
}

// Get single phrase by ID
exports.getPhraseById = async (req, res) => {
  try {
    const phrase = await Phrase.findById(req.params.id)

    if (!phrase) {
      return res.status(404).json({
        success: false,
        message: "Phrase not found",
      })
    }

    res.status(200).json({
      success: true,
      data: phrase,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching phrase",
      error: error.message,
    })
  }
}

// Create new phrase (Admin only)
exports.createPhrase = async (req, res) => {
  try {
    const { german, albanian, xp, level, category, difficulty, usageExample } = req.body

    const phrase = await Phrase.create({
      german,
      albanian,
      xp,
      level,
      category,
      difficulty,
      usageExample,
    })

    res.status(201).json({
      success: true,
      data: phrase,
      message: "Phrase created successfully",
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating phrase",
      error: error.message,
    })
  }
}

// Create multiple phrases (Admin only)
exports.createBulkPhrases = async (req, res) => {
  try {
    const { phrases } = req.body

    if (!Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Phrases array is required",
      })
    }

    const createdPhrases = await Phrase.insertMany(phrases)

    res.status(201).json({
      success: true,
      data: createdPhrases,
      message: `${createdPhrases.length} phrases created successfully`,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating phrases",
      error: error.message,
    })
  }
}

// Update phrase (Admin only)
exports.updatePhrase = async (req, res) => {
  try {
    const phrase = await Phrase.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!phrase) {
      return res.status(404).json({
        success: false,
        message: "Phrase not found",
      })
    }

    res.status(200).json({
      success: true,
      data: phrase,
      message: "Phrase updated successfully",
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating phrase",
      error: error.message,
    })
  }
}

// Delete phrase (Admin only)
exports.deletePhrase = async (req, res) => {
  try {
    const phrase = await Phrase.findByIdAndDelete(req.params.id)

    if (!phrase) {
      return res.status(404).json({
        success: false,
        message: "Phrase not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Phrase deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting phrase",
      error: error.message,
    })
  }
}

// Mark phrase as finished for user
exports.markPhraseAsFinished = async (req, res) => {
  try {
    const { phraseId } = req.params
    const userId = req.user.id // Assuming auth middleware sets req.user

    // Find the phrase to get XP value
    const phrase = await Phrase.findById(phraseId)
    if (!phrase) {
      return res.status(404).json({
        success: false,
        message: "Phrase not found",
      })
    }

    // Update user's phrasesFinished array and add XP
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if phrase is already finished
    if (user.phrasesFinished.includes(phraseId)) {
      return res.status(400).json({
        success: false,
        message: "Phrase already marked as finished",
      })
    }

    // Add phrase to finished list and update XP
    user.phrasesFinished.push(phraseId)
    user.xp += phrase.xp
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        phraseId,
        xpGained: phrase.xp,
        totalXp: user.xp,
      },
      message: "Phrase marked as finished",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking phrase as finished",
      error: error.message,
    })
  }
}

// Unmark phrase as finished for user
exports.unmarkPhraseAsFinished = async (req, res) => {
  try {
    const { phraseId } = req.params
    const userId = req.user.id

    const phrase = await Phrase.findById(phraseId)
    if (!phrase) {
      return res.status(404).json({
        success: false,
        message: "Phrase not found",
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Remove phrase from finished list and subtract XP
    const index = user.phrasesFinished.indexOf(phraseId)
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: "Phrase is not marked as finished",
      })
    }

    user.phrasesFinished.splice(index, 1)
    user.xp = Math.max(0, user.xp - phrase.xp) // Ensure XP doesn't go negative
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        phraseId,
        xpLost: phrase.xp,
        totalXp: user.xp,
      },
      message: "Phrase unmarked as finished",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unmarking phrase",
      error: error.message,
    })
  }
}

// Get user's finished phrases
exports.getFinishedPhrases = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).populate("phrasesFinished")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      data: user.phrasesFinished,
      total: user.phrasesFinished.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching finished phrases",
      error: error.message,
    })
  }
}

// Get user's phrase progress
exports.getUserPhraseProgress = async (req, res) => {
  try {
    const userId = req.user.id
    const { level } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const query = { isActive: true }
    if (level) query.level = level

    const totalPhrases = await Phrase.countDocuments(query)
    const finishedPhrases = user.phrasesFinished.length

    res.status(200).json({
      success: true,
      data: {
        totalPhrases,
        finishedPhrases,
        percentage: totalPhrases > 0 ? ((finishedPhrases / totalPhrases) * 100).toFixed(2) : 0,
        phrasesFinished: user.phrasesFinished,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching phrase progress",
      error: error.message,
    })
  }
}
