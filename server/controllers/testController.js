const { Test, UserTestHistory, User } = require("../models/Test")
const Joi = require("joi")

// Validation schemas
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
  xp: Joi.number().min(0).required(),
  totalTime: Joi.number().min(1).required(),
  questions: Joi.array().items(questionSchema).min(1).required(),
  category: Joi.string().default("general"),
  tags: Joi.array().items(Joi.string()),
  difficulty: Joi.number().min(1).max(10).default(5),
})

// Constants
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000 // 2 weeks in milliseconds
const PASSING_PERCENTAGE = 85

class TestController {
  // Create a new test
  async createTest(req, res) {
    try {
      const { error, value } = testSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        })
      }

      const test = new Test(value)
      await test.save()

      res.status(201).json({
        success: true,
        message: "Test created successfully",
        data: test,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating test",
        error: error.message,
      })
    }
  }

  // Get all tests
  async getAllTests(req, res) {
    try {
      console.log("[v0] getAllTests called with query:", req.query)

      const { page = 1, limit = 10, level, category, isActive } = req.query

      const filter = {}
      if (level) filter.level = level
      if (category) filter.category = category
      if (isActive !== undefined) filter.isActive = isActive === "true"

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
      console.log("[v0] Error in getAllTests:", error.message)
      res.status(500).json({
        success: false,
        message: "Error fetching tests",
        error: error.message,
      })
    }
  }

  // Get test by ID
  async getTestById(req, res) {
    try {
      const test = await Test.findById(req.params.id)

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      res.json({
        success: true,
        data: test,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching test",
        error: error.message,
      })
    }
  }

  // Get test questions only (for taking the test)
  async getTestQuestions(req, res) {
    try {
      const test = await Test.findById(req.params.id).select(
        "title level totalTime questions.questionNumber questions.questionText questions.questionType questions.options questions.timeLimit questions.points -questions.correctAnswer -questions.explanation",
      )

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      res.json({
        success: true,
        data: test,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching test questions",
        error: error.message,
      })
    }
  }

  // Update test
  async updateTest(req, res) {
    try {
      const { error, value } = testSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        })
      }

      const test = await Test.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true })

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      res.json({
        success: true,
        message: "Test updated successfully",
        data: test,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating test",
        error: error.message,
      })
    }
  }

  // Delete test
  async deleteTest(req, res) {
    try {
      const test = await Test.findByIdAndDelete(req.params.id)

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      res.json({
        success: true,
        message: "Test deleted successfully",
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting test",
        error: error.message,
      })
    }
  }

  // Submit test with security violation (forced failure)
  submitTestViolation = async (req, res) => {
    try {
      console.log("[Security] Test violation submission received")
      const { answers, userId, violationType, forceFailure } = req.body

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      const test = await Test.findById(req.params.id)
      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      // Calculate next available date (2 weeks from now)
      const nextAvailableAt = new Date(Date.now() + TWO_WEEKS_MS)

      // Create failed test history record with violation
      const testHistory = new UserTestHistory({
        userId,
        testId: test._id,
        level: test.level,
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
        nextAvailableAt: nextAvailableAt,
      })

      await testHistory.save()

      console.log("[Security] Violation recorded:", {
        userId,
        level: test.level,
        violationType,
        nextAvailableAt,
      })

      res.json({
        success: true,
        data: {
          testId: test._id,
          level: test.level,
          passed: false,
          percentage: 0,
          xpEarned: 0,
          violationType,
          message: `Test failed due to security violation: ${violationType}. You are locked out for 2 weeks.`,
          nextAvailableAt,
        },
      })
    } catch (error) {
      console.error("[Security] Error processing violation:", error)
      res.status(500).json({
        success: false,
        message: "Error processing test violation",
        error: error.message,
      })
    }
  }

  // Submit test answers and get results
  submitTest = async (req, res) => {
    let responseSent = false

    try {
      console.log("[v0] submitTest called with body:", req.body)
      console.log("[v0] Test ID from params:", req.params.id)

      const { answers, userId } = req.body

      if (!answers || !Array.isArray(answers)) {
        console.log("[v0] Invalid answers array:", answers)
        return res.status(400).json({
          success: false,
          message: "Answers array is required",
        })
      }

      if (!userId) {
        console.log("[v0] Missing userId")
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      let test
      try {
        test = await Test.findById(req.params.id)
      } catch (dbError) {
        console.log("[v0] Database error finding test:", dbError.message)
        return res.status(500).json({
          success: false,
          message: "Database error finding test",
          error: dbError.message,
        })
      }

      if (!test) {
        console.log("[v0] Test not found")
        return res.status(404).json({
          success: false,
          message: "Test not found",
        })
      }

      console.log("[v0] Test found:", test.title)

      // Check for existing attempts and cooldowns
      let lastAttempt
      try {
        lastAttempt = await UserTestHistory.findOne({
          userId,
          level: test.level,
        }).sort({ completedAt: -1 })
      } catch (dbError) {
        console.log("[v0] Database error checking user history:", dbError.message)
        return res.status(500).json({
          success: false,
          message: "Database error checking user history",
          error: dbError.message,
        })
      }

      if (lastAttempt) {
        // Check if already passed
        if (lastAttempt.passed) {
          return res.status(403).json({
            success: false,
            message: "You have already passed this test level",
          })
        }

        // Check for 2-week cooldown (for both failures and violations)
        const twoWeeksAgo = new Date(Date.now() - TWO_WEEKS_MS)

        if (lastAttempt.completedAt > twoWeeksAgo) {
          const nextAvailable = lastAttempt.nextAvailableAt || new Date(lastAttempt.completedAt.getTime() + TWO_WEEKS_MS)

          if (new Date() < nextAvailable) {
            return res.status(403).json({
              success: false,
              message: lastAttempt.isViolation 
                ? "You are locked out due to a security violation. Please wait 2 weeks."
                : "You must wait 2 weeks before retaking this test.",
              nextAvailableAt: nextAvailable,
              reason: lastAttempt.isViolation ? "violation_cooldown" : "cooldown",
            })
          }
        }
      }

      // Calculate score
      let score = 0
      let totalPoints = 0
      const results = []

      test.questions.forEach((question, index) => {
        const userAnswer = answers.find((a) => {
          const answerQuestionId = String(a.questionId)
          const testQuestionId = String(question._id)
          return answerQuestionId === testQuestionId
        })

        let isCorrect = false
        let userAnswerValue = null

        if (userAnswer) {
          userAnswerValue = userAnswer.selectedAnswer || userAnswer.answer
          const userAnswerStr = String(userAnswerValue || "").trim()
          const correctAnswerStr = String(question.correctAnswer || "").trim()
          isCorrect = userAnswerStr === correctAnswerStr
        }

        totalPoints += question.points
        if (isCorrect) {
          score += question.points
        }

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

      // Calculate next available date for failed attempts
      const nextAvailableAt = passed ? null : new Date(Date.now() + TWO_WEEKS_MS)

      // Save test history
      let testHistory
      try {
        testHistory = new UserTestHistory({
          userId,
          testId: test._id,
          level: test.level,
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
          nextAvailableAt: nextAvailableAt,
        })
        await testHistory.save()
        console.log("[v0] Test history saved successfully")
      } catch (saveError) {
        console.log("[v0] Error saving test history:", saveError.message)
        return res.status(500).json({
          success: false,
          message: "Error saving test history",
          error: saveError.message,
        })
      }

      const responseData = {
        success: true,
        data: {
          testId: test._id,
          testTitle: test.title,
          level: test.level,
          score,
          totalPoints,
          percentage,
          passed,
          xpEarned,
          results,
          nextLevel: passed ? this.getNextLevel(test.level) : null,
          nextAvailableAt: nextAvailableAt,
          message: passed
            ? `Congratulations! You earned ${test.xp} XP and advanced to ${test.level} level!`
            : `You need ${PASSING_PERCENTAGE}% to pass. You scored ${percentage}%. Try again in 2 weeks.`,
          userUpdateSuccess: false,
        },
      }

      // Update user if passed
      if (passed) {
        try {
          const user = await User.findById(userId)
          if (user) {
            user.xp = (user.xp || 0) + xpEarned
            user.level = test.level
            user.completedTests = (user.completedTests || 0) + 1
            await user.save()
            responseData.data.userUpdateSuccess = true
            console.log("[v0] User updated successfully")
          }
        } catch (userUpdateError) {
          console.log("[v0] Error updating user:", userUpdateError.message)
          responseData.data.userUpdateSuccess = false
        }
      }

      responseSent = true
      res.json(responseData)
    } catch (error) {
      console.log("[v0] Error in submitTest:", error.message)
      if (!responseSent) {
        res.status(500).json({
          success: false,
          message: "Error submitting test",
          error: error.message,
        })
      }
    }
  }

  // Get test statistics
  async getTestStats(req, res) {
    try {
      const stats = await Test.aggregate([
        {
          $group: {
            _id: null,
            totalTests: { $sum: 1 },
            activeTests: { $sum: { $cond: ["$isActive", 1, 0] } },
            totalQuestions: {
              $sum: {
                $cond: [{ $isArray: "$questions" }, { $size: "$questions" }, 0],
              },
            },
            avgDifficulty: { $avg: "$difficulty" },
            levelDistribution: {
              $push: "$level",
            },
          },
        },
      ])

      const levelCounts = {}
      if (stats[0]) {
        stats[0].levelDistribution.forEach((level) => {
          levelCounts[level] = (levelCounts[level] || 0) + 1
        })
      }

      res.json({
        success: true,
        data: {
          ...stats[0],
          levelDistribution: levelCounts,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching test statistics",
        error: error.message,
      })
    }
  }

  async getTestAvailability(req, res) {
    try {
      const { userId } = req.query

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
      const availability = {}

      const allAttempts = await UserTestHistory.find({ userId }).sort({ completedAt: -1 })

      const latestAttempts = {}
      allAttempts.forEach((attempt) => {
        if (!latestAttempts[attempt.level]) {
          latestAttempts[attempt.level] = attempt
        }
      })

      // Find highest passed level
      let highestPassedLevel = -1
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const attempt = latestAttempts[level]
        if (attempt && attempt.passed) {
          highestPassedLevel = i
        } else {
          break
        }
      }

      // Check for any level in cooldown (2 weeks)
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

      // Build availability for each level
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const attempt = latestAttempts[level]

        if (!attempt) {
          // Never taken
          if (i === 0) {
            availability[level] = {
              available: !levelInCooldown,
              reason: levelInCooldown ? "blocked_by_cooldown" : "not_taken",
              locked: !!levelInCooldown,
              blockedBy: levelInCooldown,
            }
          } else if (i === highestPassedLevel + 1) {
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
          // Failed or violation
          const nextAvailable = attempt.nextAvailableAt || new Date(attempt.completedAt.getTime() + TWO_WEEKS_MS)
          
          if (now < nextAvailable) {
            // Still in cooldown
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
            // Cooldown expired
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
      res.status(500).json({
        success: false,
        message: "Error checking test availability",
        error: error.message,
      })
    }
  }

  getNextLevel(currentLevel) {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    const currentIndex = levels.indexOf(currentLevel)
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
  }
}

module.exports = new TestController()