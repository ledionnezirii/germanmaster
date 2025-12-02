const Practice = require("../models/Practice")
const User = require("../models/User")

// Get all practices with filters
exports.getAllPractices = async (req, res) => {
  try {
    const { level, category, type, page = 1, limit = 300 } = req.query

    const filter = { isActive: true }
    if (level) filter.level = level
    if (category) filter.category = category
    if (type) filter.type = type

    const practices = await Practice.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-questions.correctAnswer -questions.blanks.correctAnswer")

    const count = await Practice.countDocuments(filter)

    res.status(200).json({
      success: true,
      data: practices,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    })
  } catch (error) {
    console.error("Error fetching practices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching practices",
      error: error.message,
    })
  }
}

// Get practice by ID (without answers for users)
exports.getPracticeById = async (req, res) => {
  try {
    const { id } = req.params
    const practice = await Practice.findById(id).select("-questions.correctAnswer -questions.blanks.correctAnswer")

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Practice not found",
      })
    }

    res.status(200).json({
      success: true,
      data: practice,
    })
  } catch (error) {
    console.error("Error fetching practice:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching practice",
      error: error.message,
    })
  }
}

// Submit practice answers
exports.submitPractice = async (req, res) => {
  try {
    const { id } = req.params
    const { answers } = req.body // Array of user answers
    const userId = req.user.id

    const practice = await Practice.findById(id)
    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Practice not found",
      })
    }

    // Check if already completed
    const user = await User.findById(userId)
    const alreadyCompleted = user.practiceCompleted.some((p) => p.practiceId.toString() === id)

    // Grade the answers
    let correctCount = 0
    const gradedAnswers = []

    practice.questions.forEach((question, index) => {
      const userAnswer = answers[index]
      let isCorrect = false

      if (practice.type === "checkbox") {
        // For checkbox, compare arrays
        const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]

        isCorrect =
          correctAnswers.length === userAnswers.length && correctAnswers.every((ans) => userAnswers.includes(ans))
      } else if (practice.type === "fillin" && question.blanks && question.blanks.length > 0) {
        // For fill-in with multiple blanks
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
        isCorrect = question.blanks.every((blank, blankIndex) => {
          const userBlankAnswer = userAnswers[blankIndex]?.trim().toLowerCase()
          const correctAnswer = blank.correctAnswer.trim().toLowerCase()
          const acceptableAnswers = blank.acceptableAnswers?.map((a) => a.trim().toLowerCase()) || []

          return userBlankAnswer === correctAnswer || acceptableAnswers.includes(userBlankAnswer)
        })
      } else {
        // For dropdown, radio, and simple fill-in
        const correctAnswer =
          typeof question.correctAnswer === "string"
            ? question.correctAnswer.trim().toLowerCase()
            : question.correctAnswer
        const userAns = typeof userAnswer === "string" ? userAnswer.trim().toLowerCase() : userAnswer

        isCorrect = userAns === correctAnswer
      }

      if (isCorrect) correctCount++

      gradedAnswers.push({
        questionIndex: index,
        userAnswer,
        isCorrect,
      })
    })

    const score = Math.round((correctCount / practice.questions.length) * 100)
    const passed = score >= 70 // 70% to pass

    // Award XP only if not already completed
    let xpAwarded = 0
    if (!alreadyCompleted && passed) {
      xpAwarded = practice.xp
      user.xp += xpAwarded
    }

    // Add to completed practices
    user.practiceCompleted.push({
      practiceId: id,
      completedAt: new Date(),
      score,
      answers: gradedAnswers,
    })

    await user.save()

    res.status(200).json({
      success: true,
      data: {
        score,
        correctCount,
        totalQuestions: practice.questions.length,
        passed,
        xpAwarded,
        gradedAnswers,
      },
    })
  } catch (error) {
    console.error("Error submitting practice:", error)
    res.status(500).json({
      success: false,
      message: "Error submitting practice",
      error: error.message,
    })
  }
}

// Get user's completed practices
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)
      .populate("practiceCompleted.practiceId", "title category level xp type")
      .select("practiceCompleted xp level")

    res.status(200).json({
      success: true,
      data: {
        completedPractices: user.practiceCompleted,
        totalXp: user.xp,
        currentLevel: user.level,
      },
    })
  } catch (error) {
    console.error("Error fetching user progress:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching user progress",
      error: error.message,
    })
  }
}

// Admin: Create practice
exports.createPractice = async (req, res) => {
  try {
    const practiceData = {
      ...req.body,
      createdBy: req.user.id,
    }

    const practice = await Practice.create(practiceData)

    res.status(201).json({
      success: true,
      data: practice,
    })
  } catch (error) {
    console.error("Error creating practice:", error)
    res.status(500).json({
      success: false,
      message: "Error creating practice",
      error: error.message,
    })
  }
}

// Admin: Create multiple practices
exports.createBulkPractices = async (req, res) => {
  try {
    const { practices } = req.body

    if (!Array.isArray(practices) || practices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Practices array is required",
      })
    }

    const practicesWithCreator = practices.map((p) => ({
      ...p,
      createdBy: req.user.id,
    }))

    const createdPractices = await Practice.insertMany(practicesWithCreator)

    res.status(201).json({
      success: true,
      data: createdPractices,
      count: createdPractices.length,
    })
  } catch (error) {
    console.error("Error creating bulk practices:", error)
    res.status(500).json({
      success: false,
      message: "Error creating bulk practices",
      error: error.message,
    })
  }
}

// Admin: Update practice
exports.updatePractice = async (req, res) => {
  try {
    const { id } = req.params
    const practice = await Practice.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Practice not found",
      })
    }

    res.status(200).json({
      success: true,
      data: practice,
    })
  } catch (error) {
    console.error("Error updating practice:", error)
    res.status(500).json({
      success: false,
      message: "Error updating practice",
      error: error.message,
    })
  }
}

// Admin: Delete practice
exports.deletePractice = async (req, res) => {
  try {
    const { id } = req.params
    const practice = await Practice.findByIdAndDelete(id)

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: "Practice not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Practice deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting practice:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting practice",
      error: error.message,
    })
  }
}

// Get practice statistics
exports.getPracticeStats = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select("practiceCompleted")

    const stats = {
      totalCompleted: user.practiceCompleted.length,
      averageScore: 0,
      byLevel: {},
      byCategory: {},
      byType: {},
    }

    if (user.practiceCompleted.length > 0) {
      const totalScore = user.practiceCompleted.reduce((sum, p) => sum + p.score, 0)
      stats.averageScore = Math.round(totalScore / user.practiceCompleted.length)

      // Populate to get details
      await user.populate("practiceCompleted.practiceId", "level category type")

      user.practiceCompleted.forEach((completed) => {
        if (completed.practiceId) {
          const { level, category, type } = completed.practiceId

          stats.byLevel[level] = (stats.byLevel[level] || 0) + 1
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
          stats.byType[type] = (stats.byType[type] || 0) + 1
        }
      })
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error fetching practice stats:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching practice stats",
      error: error.message,
    })
  }
}

// Get finished practices
exports.getFinishedPractices = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)
      .populate("practiceCompleted.practiceId", "title category level xp type description")
      .select("practiceCompleted")

    // Filter only completed practices with passing scores
    const finishedPractices = user.practiceCompleted
      .filter((p) => p.score >= 70 && p.practiceId)
      .map((p) => ({
        practice: p.practiceId,
        completedAt: p.completedAt,
        score: p.score,
      }))

    res.status(200).json({
      success: true,
      data: finishedPractices,
      count: finishedPractices.length,
    })
  } catch (error) {
    console.error("Error fetching finished practices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching finished practices",
      error: error.message,
    })
  }
}
