const { Test, UserTestHistory, User } = require("../models/Test")
const Joi = require("joi")

const questionSchema = Joi.object({
  questionNumber: Joi.number().required(),
  questionText: Joi.string().required().trim(),
  questionType: Joi.string().valid("multiple-choice", "fill-in-blank", "true-false").default("multiple-choice"),
  options: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        text: Joi.string().required(),
      }),
    )
    .min(2)
    .max(6),
  correctAnswer: Joi.string().required(),
  timeLimit: Joi.number().min(10).max(600).default(60),
  points: Joi.number().min(1).default(1),
  explanation: Joi.string().allow("").default(""),
})

const testSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().allow("").trim(),
  level: Joi.string().valid("A1", "A2", "B1", "B2", "C1", "C2").required(),
  language: Joi.string().valid("de", "en", "fr", "tr", "it").default("de"),
  xp: Joi.number().min(0).required(),
  totalTime: Joi.number().min(1).required(),
  questions: Joi.array().items(questionSchema).min(1).required(),
  category: Joi.string().default("general"),
  tags: Joi.array().items(Joi.string()),
  difficulty: Joi.number().min(1).max(10).default(5),
})

const TWO_WEEKS_MS = 5 * 24 * 60 * 60 * 1000
const PASSING_PERCENTAGE = 85

class TestController {
  async createTest(req, res) {
    try {
      const { error, value } = testSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        })
      }
      const test = new Test(value)
      await test.save()
      res.status(201).json({ success: true, message: "Test created successfully", data: test })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error creating test", error: error.message })
    }
  }

  async getAllTests(req, res) {
    try {
      const { page = 1, limit = 10, level, category, isActive, language } = req.query

      const filter = {}
      if (level) filter.level = level
      if (category) filter.category = category
      if (isActive !== undefined) filter.isActive = isActive === "true"

      // Language filter — default to "de" if not provided
      // Also match documents that have no language field (legacy tests created before multi-language support)
      const lang = language || "de"
      if (lang === "de") {
        filter.$or = [{ language: "de" }, { language: { $exists: false } }, { language: null }]
      } else {
        filter.language = lang
      }

      const tests = await Test.find(filter)
        .select("-questions")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .lean()

      const total = await Test.countDocuments(filter)

      res.json({
        success: true,
        data: tests,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching tests", error: error.message })
    }
  }

  async getTestById(req, res) {
    try {
      const test = await Test.findById(req.params.id)
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })
      res.json({ success: true, data: test })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching test", error: error.message })
    }
  }

  async getTestQuestions(req, res) {
    try {
      const test = await Test.findById(req.params.id).select(
        "title level language totalTime questions.questionNumber questions.questionText questions.questionType questions.options questions.timeLimit questions.points -questions.correctAnswer -questions.explanation",
      )
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })
      res.json({ success: true, data: test })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching test questions", error: error.message })
    }
  }

  async updateTest(req, res) {
    try {
      const { error, value } = testSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        })
      }
      const test = await Test.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true })
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })
      res.json({ success: true, message: "Test updated successfully", data: test })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error updating test", error: error.message })
    }
  }

  async deleteTest(req, res) {
    try {
      const test = await Test.findByIdAndDelete(req.params.id)
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })
      res.json({ success: true, message: "Test deleted successfully" })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error deleting test", error: error.message })
    }
  }

  async getTestStats(req, res) {
    try {
      const stats = await Test.aggregate([
        {
          $group: {
            _id: null,
            totalTests: { $sum: 1 },
            activeTests: { $sum: { $cond: ["$isActive", 1, 0] } },
            totalQuestions: {
              $sum: { $cond: [{ $isArray: "$questions" }, { $size: "$questions" }, 0] },
            },
            avgDifficulty: { $avg: "$difficulty" },
            levelDistribution: { $push: "$level" },
          },
        },
      ])

      const levelCounts = {}
      if (stats[0]) {
        stats[0].levelDistribution.forEach((level) => {
          levelCounts[level] = (levelCounts[level] || 0) + 1
        })
      }

      res.json({ success: true, data: { ...stats[0], levelDistribution: levelCounts } })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching test statistics", error: error.message })
    }
  }

  // ─── SECURITY VIOLATION ────────────────────────────────────────────────────

  submitTestViolation = async (req, res) => {
    try {
      const { answers, userId, violationType, forceFailure } = req.body

      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" })
      }

      const test = await Test.findById(req.params.id)
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })

      const nextAvailableAt = new Date(Date.now() + TWO_WEEKS_MS)

      const testHistory = new UserTestHistory({
        userId,
        testId: test._id,
        level: test.level,
        language: test.language || "de",
        answers: (answers || []).map((a) => ({
          questionId: a.questionId,
          selectedAnswer: a.answer || "",
          isCorrect: false,
          points: 0,
        })),
        score: 0,
        totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
        percentage: 0,
        passed: false,
        xpEarned: 0,
        violationType: violationType || "unknown",
        isViolation: true,
        nextAvailableAt,
      })

      await testHistory.save()

      res.json({
        success: true,
        data: {
          testId: test._id,
          level: test.level,
          language: test.language || "de",
          passed: false,
          percentage: 0,
          xpEarned: 0,
          violationType,
          message: `Test failed due to security violation: ${violationType}. You are locked out for 2 weeks.`,
          nextAvailableAt,
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error processing test violation", error: error.message })
    }
  }

  // ─── SUBMIT TEST ───────────────────────────────────────────────────────────

  submitTest = async (req, res) => {
    let responseSent = false

    try {
      const { answers, userId } = req.body

      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: "Answers array is required" })
      }
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" })
      }

      const test = await Test.findById(req.params.id)
      if (!test) return res.status(404).json({ success: false, message: "Test not found" })

      const testLanguage = test.language || "de"

      // Check for existing attempts — scoped to this language
      const lastAttempt = await UserTestHistory.findOne({
        userId,
        level: test.level,
        language: testLanguage,
      }).sort({ completedAt: -1 })

      if (lastAttempt) {
        if (lastAttempt.passed) {
          return res.status(403).json({ success: false, message: "You have already passed this test level" })
        }

        const nextAvailable = lastAttempt.nextAvailableAt || new Date(lastAttempt.completedAt.getTime() + TWO_WEEKS_MS)
        if (new Date() < nextAvailable) {
          return res.status(403).json({
            success: false,
            message: lastAttempt.isViolation
              ? "You are locked out due to a security violation. Please wait 2 weeks."
              : "You must wait 5 days before retaking this test.",
            nextAvailableAt: nextAvailable,
            reason: lastAttempt.isViolation ? "violation_cooldown" : "cooldown",
          })
        }
      }

      // Calculate score
      let score = 0
      let totalPoints = 0
      const results = []

      test.questions.forEach((question) => {
        const userAnswer = answers.find((a) => String(a.questionId) === String(question._id))

        let isCorrect = false
        let userAnswerValue = null

        if (userAnswer) {
          userAnswerValue = userAnswer.selectedAnswer || userAnswer.answer
          isCorrect = String(userAnswerValue || "").trim() === String(question.correctAnswer || "").trim()
        }

        totalPoints += question.points
        if (isCorrect) score += question.points

        results.push({
          questionId: question._id,
          questionNumber: question.questionNumber,
          userAnswer: userAnswerValue,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: isCorrect ? question.points : 0,
          explanation: question.explanation,
        })
      })

      const percentage = Math.round((score / totalPoints) * 100)
      const passed = percentage >= PASSING_PERCENTAGE
      const xpEarned = passed ? test.xp : 0
      const nextAvailableAt = passed ? null : new Date(Date.now() + TWO_WEEKS_MS)

      // Save history
      const testHistory = new UserTestHistory({
        userId,
        testId: test._id,
        level: test.level,
        language: testLanguage,
        answers: results.map((r) => ({
          questionId: r.questionId,
          selectedAnswer: r.userAnswer,
          isCorrect: r.isCorrect,
          points: r.points,
        })),
        score,
        totalPoints,
        percentage,
        passed,
        xpEarned,
        isViolation: false,
        nextAvailableAt,
      })

      await testHistory.save()

      const responseData = {
        success: true,
        data: {
          testId: test._id,
          testTitle: test.title,
          level: test.level,
          language: testLanguage,
          score,
          totalPoints,
          percentage,
          passed,
          xpEarned,
          results,
          nextLevel: passed ? this.getNextLevel(test.level) : null,
          nextAvailableAt,
          message: passed
            ? `Congratulations! You earned ${test.xp} XP and advanced to ${test.level} level!`
            : `You need ${PASSING_PERCENTAGE}% to pass. You scored ${percentage}%. Try again in 5 days.`,
          userUpdateSuccess: false,
        },
      }

      if (passed) {
        try {
          const user = await User.findById(userId)
          if (user) {
            user.xp = (user.xp || 0) + xpEarned
            user.completedTests = (user.completedTests || 0) + 1
            // Update level for this specific language only
            const langEntry = user.languageProgress.find(p => p.language === testLanguage)
            if (langEntry) {
              langEntry.level = test.level
            } else {
              user.languageProgress.push({ language: testLanguage, level: test.level })
            }
            await user.save()
            responseData.data.userUpdateSuccess = true
          }
        } catch (userUpdateError) {
          responseData.data.userUpdateSuccess = false
        }
      }

      responseSent = true
      res.json(responseData)
    } catch (error) {
      if (!responseSent) {
        res.status(500).json({ success: false, message: "Error submitting test", error: error.message })
      }
    }
  }

  // ─── AVAILABILITY (language-scoped) ────────────────────────────────────────

  async getTestAvailability(req, res) {
    try {
      const { userId, language = "de" } = req.query

      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" })
      }

      const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
      const availability = {}

      // IMPORTANT: filter by language so EN history doesn't block DE tests
      const allAttempts = await UserTestHistory.find({ userId, language }).sort({ completedAt: -1 })

      const latestAttempts = {}
      allAttempts.forEach((attempt) => {
        if (!latestAttempts[attempt.level]) {
          latestAttempts[attempt.level] = attempt
        }
      })

      // Find highest passed level for this language
      let highestPassedLevel = -1
      for (let i = 0; i < levels.length; i++) {
        const attempt = latestAttempts[levels[i]]
        if (attempt && attempt.passed) {
          highestPassedLevel = i
        } else {
          break
        }
      }

      // Check for any level in cooldown for this language
      let levelInCooldown = null
      const now = new Date()

      for (const level of levels) {
        const attempt = latestAttempts[level]
        if (attempt && !attempt.passed) {
          const nextAvailable = attempt.nextAvailableAt || new Date(attempt.completedAt.getTime() + TWO_WEEKS_MS)
          if (now < nextAvailable) {
            levelInCooldown = level
            break
          }
        }
      }

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const attempt = latestAttempts[level]

        if (!attempt) {
          if (i === 0 || i === highestPassedLevel + 1) {
            availability[level] = {
              available: !levelInCooldown,
              reason: levelInCooldown ? "blocked_by_cooldown" : "not_taken",
              locked: !!levelInCooldown,
              blockedBy: levelInCooldown,
            }
          } else {
            availability[level] = {
              available: false,
              reason: "progression_locked",
              locked: true,
              requiresLevel: levels[i - 1],
            }
          }
        } else if (attempt.passed) {
          availability[level] = {
            available: false,
            reason: "passed",
            locked: false,
            lastScore: attempt.percentage,
            lastAttemptDate: attempt.completedAt,
          }
        } else {
          const nextAvailable = attempt.nextAvailableAt || new Date(attempt.completedAt.getTime() + TWO_WEEKS_MS)

          if (now < nextAvailable) {
            availability[level] = {
              available: false,
              reason: attempt.isViolation ? "violation_cooldown" : "cooldown",
              locked: true,
              lastScore: attempt.percentage,
              nextAvailableAt: nextAvailable,
              lastAttemptDate: attempt.completedAt,
              violationType: attempt.violationType,
            }
          } else {
            if (i === highestPassedLevel + 1 || i === 0) {
              availability[level] = {
                available: true,
                reason: "cooldown_expired",
                locked: false,
                lastScore: attempt.percentage,
                lastAttemptDate: attempt.completedAt,
              }
            } else {
              availability[level] = {
                available: false,
                reason: "progression_locked",
                locked: true,
                requiresLevel: levels[i - 1],
                lastScore: attempt.percentage,
                lastAttemptDate: attempt.completedAt,
              }
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          availability,
          language,
          highestPassedLevel: highestPassedLevel >= 0 ? levels[highestPassedLevel] : null,
          levelInCooldown,
          progression: {
            currentLevel: highestPassedLevel >= 0 ? levels[highestPassedLevel] : null,
            nextAvailable: highestPassedLevel + 1 < levels.length ? levels[highestPassedLevel + 1] : null,
            blocked: !!levelInCooldown,
          },
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: "Error checking test availability", error: error.message })
    }
  }

  getNextLevel(currentLevel) {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    const currentIndex = levels.indexOf(currentLevel)
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
  }
}

module.exports = new TestController()