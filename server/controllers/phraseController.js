const Phrase = require("../models/Phrase")
const User = require("../models/User")
const { notifyPhraseLimitReached } = require("./notificationController")
const { addUserXp } = require("./xpController")


const FREE_DAILY_LIMIT = 2
const PAID_DAILY_LIMIT = 10

const buildLanguageQuery = (language) => {
  if (!language) return {}
  if (language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}

// Helper: get the correct daily limit for a user
const getDailyLimit = (user) => {
  return user.isPaid ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT
}

// Helper: check if it's a new day (resets at 00:01)
const isNewDay = (lastDate) => {
  if (!lastDate) return true

  const now = new Date()
  const last = new Date(lastDate)

  const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0)
  const lastReset = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 0, 1, 0, 0)

  if (now.getHours() === 0 && now.getMinutes() < 1) {
    todayReset.setDate(todayReset.getDate() - 1)
  }

  return todayReset > lastReset
}

// Get all phrases with optional filters
exports.getAllPhrases = async (req, res) => {
  try {
    const { level, category, page = 1, limit = 20, language } = req.query

    const langQuery = buildLanguageQuery(language)
    const query = { isActive: true, ...langQuery }
    if (level) query.level = level
    if (category) query.category = category

    const phrases = await Phrase.find(query)
      .sort({ createdAt: 1 })
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
    const { page = 1, limit = 20, language } = req.query

    const langQuery = buildLanguageQuery(language)
    const query = { level, isActive: true, ...langQuery }

    const phrases = await Phrase.find(query)
      .sort({ createdAt: 1 })
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
    const { german, albanian, xp, level, category, difficulty, usageExample, language = "de" } = req.body

    const phrase = await Phrase.create({
      german,
      albanian,
      xp,
      level,
      category,
      difficulty,
      usageExample,
      language,
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
    const phrase = await Phrase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

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

// Mark phrase as finished — FREE=4/day, PAID=10/day
exports.markPhraseAsFinished = async (req, res) => {
  try {
    const { phraseId } = req.params
    const userId = req.user.id

    const phrase = await Phrase.findById(phraseId)
    if (!phrase) {
      return res.status(404).json({ success: false, message: "Phrase not found" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Already finished — no-op
    if (user.phrasesFinished.includes(phraseId)) {
      return res.status(400).json({ success: false, message: "Phrase already marked as finished" })
    }

    // Reset daily count if it's a new day
    const newDay = isNewDay(user.lastPhraseUnlockDate)
    if (newDay) {
      user.dailyPhraseUnlocks = 0
      user.lastPhraseUnlockDate = new Date()
    }

    // Get the correct limit for this user (paid vs free)
    const dailyLimit = getDailyLimit(user)

    // Check daily limit
    if (user.dailyPhraseUnlocks >= dailyLimit) {
      await notifyPhraseLimitReached(userId)

      const now = new Date()
      const nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0, 0)
      const timeUntilReset = nextReset - now
      const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60))
      const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))

      return res.status(429).json({
        success: false,
        message: `Keni arritur limitin ditor të ${dailyLimit} frazave. Provoni përsëri pas ${hoursUntilReset} orësh dhe ${minutesUntilReset} minutash.`,
        dailyLimitReached: true,
        remainingUnlocks: 0,
        resetTime: nextReset.toISOString(),
        hoursUntilReset,
        minutesUntilReset,
        isPaid: user.isPaid,
        dailyLimit,
      })
    }

 user.phrasesFinished.push(phraseId)
user.dailyPhraseUnlocks += 1
user.lastPhraseUnlockDate = new Date()

if (user.dailyPhraseUnlocks === dailyLimit) {
  await notifyPhraseLimitReached(userId)
}

await user.save()
await addUserXp(userId, phrase.xp)

    res.status(200).json({
      success: true,
      data: {
        phraseId,
        xpGained: phrase.xp,
        totalXp: user.xp,
        dailyUnlocksUsed: user.dailyPhraseUnlocks,
        remainingUnlocks: dailyLimit - user.dailyPhraseUnlocks,
        dailyLimit,
        isPaid: user.isPaid,
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

// Unmark phrase as finished
exports.unmarkPhraseAsFinished = async (req, res) => {
  try {
    const { phraseId } = req.params
    const userId = req.user.id

    const phrase = await Phrase.findById(phraseId)
    if (!phrase) {
      return res.status(404).json({ success: false, message: "Phrase not found" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const index = user.phrasesFinished.indexOf(phraseId)
    if (index === -1) {
      return res.status(400).json({ success: false, message: "Phrase is not marked as finished" })
    }

    user.phrasesFinished.splice(index, 1)
    user.xp = Math.max(0, user.xp - phrase.xp)
    await user.save()

    res.status(200).json({
      success: true,
      data: { phraseId, xpLost: phrase.xp, totalXp: user.xp },
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
      return res.status(404).json({ success: false, message: "User not found" })
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

// Get user's phrase progress — includes daily limit info based on isPaid
exports.getUserPhraseProgress = async (req, res) => {
  try {
    const userId = req.user.id
    const { level } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const query = { isActive: true }
    if (level) query.level = level

    const totalPhrases = await Phrase.countDocuments(query)
    const finishedPhrases = user.phrasesFinished.length

    // Daily limit based on plan
    const dailyLimit = getDailyLimit(user)
    const newDay = isNewDay(user.lastPhraseUnlockDate)
    const dailyUnlocksUsed = newDay ? 0 : (user.dailyPhraseUnlocks || 0)
    const remainingUnlocks = dailyLimit - dailyUnlocksUsed

    // Time until next reset
    const now = new Date()
    let nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0)
    if (now >= nextReset) nextReset.setDate(nextReset.getDate() + 1)
    const timeUntilReset = nextReset - now
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60))
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))

    res.status(200).json({
      success: true,
      data: {
        totalPhrases,
        finishedPhrases,
        percentage: totalPhrases > 0 ? ((finishedPhrases / totalPhrases) * 100).toFixed(2) : 0,
        phrasesFinished: user.phrasesFinished,
        // Daily limit info
        dailyLimit,
        dailyUnlocksUsed,
        remainingUnlocks,
        dailyLimitReached: remainingUnlocks <= 0,
        resetTime: nextReset.toISOString(),
        hoursUntilReset,
        minutesUntilReset,
        isPaid: user.isPaid,
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

// Get daily limit status
exports.getDailyLimitStatus = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const dailyLimit = getDailyLimit(user)
    const newDay = isNewDay(user.lastPhraseUnlockDate)
    const dailyUnlocksUsed = newDay ? 0 : (user.dailyPhraseUnlocks || 0)
    const remainingUnlocks = dailyLimit - dailyUnlocksUsed

    const now = new Date()
    let nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0)
    if (now >= nextReset) nextReset.setDate(nextReset.getDate() + 1)
    const timeUntilReset = nextReset - now
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60))
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))

    res.status(200).json({
      success: true,
      data: {
        dailyLimit,
        dailyUnlocksUsed,
        remainingUnlocks,
        dailyLimitReached: remainingUnlocks <= 0,
        resetTime: nextReset.toISOString(),
        hoursUntilReset,
        minutesUntilReset,
        isPaid: user.isPaid,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching daily limit status",
      error: error.message,
    })
  }
}

// Add XP from quiz completion
exports.addQuizXp = async (req, res) => {
  try {
    const userId = req.user.id
    const { xp } = req.body

    if (!xp || xp <= 0) {
      return res.status(400).json({ success: false, message: "Valid XP amount is required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    await addUserXp(userId, xp)

    res.status(200).json({
      success: true,
      data: { xpGained: xp, totalXp: user.xp },
      message: "Quiz XP added successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding quiz XP",
      error: error.message,
    })
  }
}