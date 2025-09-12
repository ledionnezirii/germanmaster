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
      console.log("[v0] Test model available:", !!Test)

      const { page = 1, limit = 10, level, category, isActive } = req.query

      const filter = {}
      if (level) filter.level = level
      if (category) filter.category = category
      if (isActive !== undefined) filter.isActive = isActive === "true"

      console.log("[v0] Filter applied:", filter)
      console.log("[v0] About to query database...")

      const tests = await Test.find(filter)
        .select("-questions") // Exclude questions for list view
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .lean() // Convert to plain objects to avoid JSON serialization issues

      console.log("[v0] Tests found:", tests.length)
      console.log("[v0] Sample test:", tests[0] ? tests[0].title : "No tests")

      const total = await Test.countDocuments(filter)

      console.log("[v0] Total count:", total)

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
      console.log("[v0] Error stack:", error.stack)
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

  // Submit test answers and get results
  async submitTest(req, res) {
    let responseSent = false // Track if response has been sent to prevent multiple responses

    try {
      console.log("[v0] submitTest called with body:", req.body)
      console.log("[v0] Test ID from params:", req.params.id)

      const { answers, userId } = req.body // Array of { questionId, answer } and userId

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

      console.log("[v0] Looking for test with ID:", req.params.id)

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
      console.log("[v0] Test has", test.questions.length, "questions")

      let lastAttempt
      try {
        console.log("[v0] Checking user test history for userId:", userId, "level:", test.level)
        console.log("[v0] UserTestHistory model available:", !!UserTestHistory)

        lastAttempt = await UserTestHistory.findOne({
          userId,
          level: test.level,
        }).sort({ completedAt: -1 })

        console.log("[v0] Last attempt query completed successfully")
      } catch (dbError) {
        console.log("[v0] Database error checking user history:", dbError.message)
        console.log("[v0] UserTestHistory error stack:", dbError.stack)
        return res.status(500).json({
          success: false,
          message: "Database error checking user history",
          error: dbError.message,
        })
      }

      console.log("[v0] Last attempt:", lastAttempt)

      if (lastAttempt) {
        if (lastAttempt.passed) {
          return res.status(403).json({
            success: false,
            message: "You have already passed this test level",
          })
        }

        // Check cooldown for failed attempts
        const oneMinuteAgo = new Date()
        oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

        if (lastAttempt.completedAt > oneMinuteAgo) {
          const nextAvailable = new Date(lastAttempt.completedAt)
          nextAvailable.setMinutes(nextAvailable.getMinutes() + 1)

          return res.status(403).json({
            success: false,
            message: "You must wait before retaking this test",
            nextAvailableAt: nextAvailable,
          })
        }
      }

      let score = 0
      let totalPoints = 0
      const results = []

      console.log("[v0] Processing answers...")
      console.log("[v0] Received answers:", answers)

      try {
        test.questions.forEach((question, index) => {
          console.log(`[v0] Processing question ${index + 1}:`, {
            questionId: question._id.toString(),
            questionNumber: question.questionNumber,
          })

          const userAnswer = answers.find((a) => {
            // Convert both IDs to strings for comparison
            const answerQuestionId = String(a.questionId)
            const testQuestionId = String(question._id)

            console.log(`[v0] Comparing IDs: ${answerQuestionId} === ${testQuestionId}`)

            return answerQuestionId === testQuestionId
          })

          console.log(`[v0] User answer for question ${index + 1}:`, userAnswer)

          let isCorrect = false
          let userAnswerValue = null

          if (userAnswer) {
            userAnswerValue = userAnswer.selectedAnswer || userAnswer.answer

            const userAnswerStr = String(userAnswerValue || "").trim()
            const correctAnswerStr = String(question.correctAnswer || "").trim()

            isCorrect = userAnswerStr === correctAnswerStr

            console.log(`[v0] Answer comparison:`, {
              userAnswerStr,
              correctAnswerStr,
              isCorrect,
            })
          }

          console.log(`[v0] Question ${index + 1} final result:`, {
            userAnswerValue: userAnswerValue,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect,
          })

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
      } catch (processingError) {
        console.log("[v0] Error processing answers:", processingError.message)
        return res.status(500).json({
          success: false,
          message: "Error processing answers",
          error: processingError.message,
        })
      }

      console.log("[v0] Final score:", score, "out of", totalPoints)

      const percentage = Math.round((score / totalPoints) * 100)
      const passed = percentage >= 85 // 85% passing grade required
      const xpEarned = passed ? test.xp : 0 // No XP if failed

      console.log("[v0] Percentage:", percentage, "Passed:", passed)

      let testHistory
      try {
        console.log("[v0] Saving test history...")
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
        })
        await testHistory.save()
        console.log("[v0] Test history saved successfully")
      } catch (saveError) {
        console.log("[v0] Error saving test history:", saveError.message)
        console.log("[v0] Save error stack:", saveError.stack)
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
          message: passed
            ? `Congratulations! You earned ${test.xp} XP and advanced to ${test.level} level! You can now take ${this.getNextLevel(test.level) || "advanced"} tests.`
            : `You need 85% to pass. You scored ${percentage}%. Try again in one minute.`,
          userUpdateSuccess: false, // Will be updated if user update succeeds
        },
      }

      if (passed) {
        try {
          console.log("[v0] User passed! Updating XP and level...")
          console.log("[v0] User model available:", !!User)
          console.log("[v0] Looking for user with ID:", userId)

          const user = await User.findById(userId)
          console.log("[v0] User found:", !!user)

          if (user) {
            const oldXp = user.xp || 0
            const oldLevel = user.level || "undefined"

            console.log("[v0] Current user data:", { xp: oldXp, level: oldLevel })

            // Add XP to user's total
            user.xp = (user.xp || 0) + xpEarned

            // Update user's level to the test level they just passed
            user.level = test.level

            // Increment completed tests counter
            user.completedTests = (user.completedTests || 0) + 1

            console.log("[v0] About to save user with new data:", {
              xp: user.xp,
              level: user.level,
              completedTests: user.completedTests,
            })

            await user.save()
            responseData.data.userUpdateSuccess = true // Update success flag

            console.log("[v0] User updated successfully:")
            console.log("[v0] XP:", oldXp, "->", user.xp)
            console.log("[v0] Level:", oldLevel, "->", user.level)
            console.log("[v0] Completed tests:", user.completedTests)
          } else {
            console.log("[v0] Warning: User not found for XP/level update")
          }
        } catch (userUpdateError) {
          console.log("[v0] Error updating user XP/level:", userUpdateError.message)
          console.log("[v0] User update error stack:", userUpdateError.stack)
          responseData.data.userUpdateSuccess = false
        }
      }

      console.log("[v0] Sending final response:", responseData.success)
      responseSent = true
      res.json(responseData)
    } catch (error) {
      console.log("[v0] Error in submitTest:", error.message)
      console.log("[v0] Error stack:", error.stack)

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

      let highestPassedLevel = -1
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const attempt = latestAttempts[level]

        if (attempt && attempt.passed) {
          highestPassedLevel = i
        } else {
          break // Stop at first non-passed level
        }
      }

      let levelInCooldown = null
      const oneMinuteAgo = new Date()
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

      for (const level of levels) {
        const attempt = latestAttempts[level]
        if (attempt && !attempt.passed && attempt.completedAt > oneMinuteAgo) {
          levelInCooldown = level
          break
        }
      }

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const attempt = latestAttempts[level]

        if (!attempt) {
          // Never taken this test
          if (i === 0) {
            // A1 is always available if never taken
            availability[level] = {
              available: true,
              reason: "not_taken",
              locked: false,
            }
          } else if (i === highestPassedLevel + 1) {
            // Next level after highest passed - available if no cooldown
            availability[level] = {
              available: !levelInCooldown,
              reason: levelInCooldown ? "blocked_by_cooldown" : "not_taken",
              locked: !!levelInCooldown,
              blockedBy: levelInCooldown,
            }
          } else {
            // Higher level - locked until progression
            availability[level] = {
              available: false,
              reason: "progression_locked",
              locked: true,
              requiresLevel: levels[i - 1],
            }
          }
        } else if (attempt.passed) {
          // Passed - can't retake
          availability[level] = {
            available: false,
            reason: "passed",
            locked: false,
            lastScore: attempt.percentage,
            completedAt: attempt.completedAt,
          }
        } else {
          // Failed - check cooldown
          if (attempt.completedAt > oneMinuteAgo) {
            // Still in cooldown - this level and all higher levels are locked
            const nextAvailable = new Date(attempt.completedAt)
            nextAvailable.setMinutes(nextAvailable.getMinutes() + 1)

            availability[level] = {
              available: false,
              reason: "cooldown",
              locked: true,
              lastScore: attempt.percentage,
              nextAvailableAt: nextAvailable,
              completedAt: attempt.completedAt,
            }
          } else {
            // Cooldown expired - can retake if it's the next level to unlock
            if (i === highestPassedLevel + 1) {
              availability[level] = {
                available: true,
                reason: "cooldown_expired",
                locked: false,
                lastScore: attempt.percentage,
                completedAt: attempt.completedAt,
              }
            } else {
              // Higher level - still locked by progression
              availability[level] = {
                available: false,
                reason: "progression_locked",
                locked: true,
                requiresLevel: levels[i - 1],
                lastScore: attempt.percentage,
                completedAt: attempt.completedAt,
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
