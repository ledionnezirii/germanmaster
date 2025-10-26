const Puzzle = require("../models/Puzzle")
const User = require("../models/User")

// Get today's puzzle (for users)
exports.getTodaysPuzzle = async (req, res) => {
  try {
    const userId = req.user.id
    const puzzle = await Puzzle.getTodaysPuzzle()

    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "No puzzle available for today",
      })
    }

    // Check if user already completed today's puzzle
    const hasCompleted = puzzle.completedBy.some((completion) => completion.userId.toString() === userId)

    const puzzleData = {
      _id: puzzle._id,
      xpReward: puzzle.xpReward,
      difficulty: puzzle.difficulty,
      hints: puzzle.hints,
      category: puzzle.category,
      hasCompleted,
      wordLength: puzzle.word.length,
      word: hasCompleted ? puzzle.word : undefined, // Send word if already completed
    }

    res.json(puzzleData)
  } catch (error) {
    console.error("Error fetching today's puzzle:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Submit puzzle answer
exports.submitAnswer = async (req, res) => {
  try {
    const { puzzleId } = req.params
    const { guess, attemptsUsed } = req.body
    const userId = req.user.id

    if (!guess || guess.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "Word must be exactly 5 letters",
      })
    }

    const puzzle = await Puzzle.findById(puzzleId)
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Puzzle not found",
      })
    }

    // Check if puzzle is for today
    if (!puzzle.isToday()) {
      return res.status(400).json({
        success: false,
        message: "This puzzle is no longer active",
      })
    }

    // Check if user already completed this puzzle
    const hasCompleted = puzzle.completedBy.some((completion) => completion.userId.toString() === userId)

    if (hasCompleted) {
      return res.status(400).json({
        success: false,
        message: "You have already completed today's puzzle",
      })
    }

    const userWord = guess.toLowerCase().trim()
    const correctWord = puzzle.word.toLowerCase()

    // Check if the word is correct
    if (userWord === correctWord) {
      // Mark as completed
      puzzle.completedBy.push({
        userId,
        attempts: attemptsUsed || 1,
        completedAt: new Date(),
      })
      await puzzle.save()

      // Award XP to user
      const user = await User.findById(userId)
      if (user) {
        user.xp = (user.xp || 0) + puzzle.xpReward

        if (!user.puzzleCompleted) {
          user.puzzleCompleted = []
        }
        // Only push the ObjectId, as defined in the User schema
        user.puzzleCompleted.push(puzzle._id)

        await user.save()

        return res.json({
          correct: true,
          message: `Congratulations! You earned ${puzzle.xpReward} XP!`,
          xpEarned: puzzle.xpReward,
          user: {
            xp: user.xp,
            level: user.level,
          },
        })
      }
    } else {
      // Generate feedback for incorrect answer
      const feedback = generateFeedback(userWord, correctWord)

      const isFinalAttempt = attemptsUsed >= 5

      return res.json({
        correct: false,
        feedback,
        message: isFinalAttempt ? "Game Over! Better luck tomorrow!" : "Try again!",
        correctWord: isFinalAttempt ? correctWord : null, // Reveal word on final attempt
      })
    }
  } catch (error) {
    console.error("Error submitting puzzle answer:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Helper function to generate Wordle-style feedback
function generateFeedback(userWord, correctWord) {
  const feedback = []
  const correctLetters = correctWord.split("")
  const userLetters = userWord.split("")

  // Track which letters in correct word have been matched
  const matched = new Array(5).fill(false)

  // First pass: mark correct positions (green)
  for (let i = 0; i < 5; i++) {
    if (userLetters[i] === correctLetters[i]) {
      feedback[i] = "correct" // green
      matched[i] = true
    }
  }

  // Second pass: mark present but wrong position (yellow)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === "correct") continue

    let found = false
    for (let j = 0; j < 5; j++) {
      if (!matched[j] && userLetters[i] === correctLetters[j]) {
        feedback[i] = "present" // yellow
        matched[j] = true
        found = true
        break
      }
    }

    if (!found) {
      feedback[i] = "absent" // gray
    }
  }

  return feedback
}

// ADMIN: Get all puzzles
exports.getAllPuzzles = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = "activeDate", order = "asc" } = req.query

    const puzzles = await Puzzle.find()
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-completedBy")

    const count = await Puzzle.countDocuments()

    res.json({
      success: true,
      data: puzzles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    })
  } catch (error) {
    console.error("Error fetching puzzles:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// ADMIN: Create a new puzzle
exports.createPuzzle = async (req, res) => {
  try {
    const { word, xpReward, difficulty, activeDate, hints, category } = req.body

    if (!word || word.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "Word must be exactly 5 letters",
      })
    }

    if (!activeDate) {
      return res.status(400).json({
        success: false,
        message: "Active date is required",
      })
    }

    // Check if puzzle already exists for this date
    const existingPuzzle = await Puzzle.findOne({ activeDate: new Date(activeDate) })
    if (existingPuzzle) {
      return res.status(400).json({
        success: false,
        message: "A puzzle already exists for this date",
      })
    }

    const puzzle = new Puzzle({
      word: word.toLowerCase().trim(),
      xpReward: xpReward || 50,
      difficulty: difficulty || "medium",
      activeDate: new Date(activeDate),
      hints: hints || "",
      category: category || "general",
    })

    await puzzle.save()

    res.status(201).json({
      success: true,
      data: puzzle,
      message: "Puzzle created successfully",
    })
  } catch (error) {
    console.error("Error creating puzzle:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// ADMIN: Create multiple puzzles at once
exports.createBulkPuzzles = async (req, res) => {
  try {
    const { puzzles } = req.body

    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Puzzles array is required",
      })
    }

    // Validate all puzzles
    for (const puzzle of puzzles) {
      if (!puzzle.word || puzzle.word.length !== 5) {
        return res.status(400).json({
          success: false,
          message: "All words must be exactly 5 letters",
        })
      }
      if (!puzzle.activeDate) {
        return res.status(400).json({
          success: false,
          message: "All puzzles must have an active date",
        })
      }
    }

    const createdPuzzles = await Puzzle.insertMany(
      puzzles.map((p) => ({
        word: p.word.toLowerCase().trim(),
        xpReward: p.xpReward || 50,
        difficulty: p.difficulty || "medium",
        activeDate: new Date(p.activeDate),
        hints: p.hints || "",
        category: p.category || "general",
      })),
    )

    res.status(201).json({
      success: true,
      data: createdPuzzles,
      message: `${createdPuzzles.length} puzzles created successfully`,
    })
  } catch (error) {
    console.error("Error creating bulk puzzles:", error)
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? "Duplicate puzzle date found" : "Server error",
    })
  }
}

// ADMIN: Update a puzzle
exports.updatePuzzle = async (req, res) => {
  try {
    const { id } = req.params
    const { word, xpReward, difficulty, activeDate, hints, category, isActive } = req.body

    const puzzle = await Puzzle.findById(id)
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Puzzle not found",
      })
    }

    if (word) {
      if (word.length !== 5) {
        return res.status(400).json({
          success: false,
          message: "Word must be exactly 5 letters",
        })
      }
      puzzle.word = word.toLowerCase().trim()
    }

    if (xpReward !== undefined) puzzle.xpReward = xpReward
    if (difficulty) puzzle.difficulty = difficulty
    if (activeDate) puzzle.activeDate = new Date(activeDate)
    if (hints !== undefined) puzzle.hints = hints
    if (category) puzzle.category = category
    if (isActive !== undefined) puzzle.isActive = isActive

    await puzzle.save()

    res.json({
      success: true,
      data: puzzle,
      message: "Puzzle updated successfully",
    })
  } catch (error) {
    console.error("Error updating puzzle:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// ADMIN: Delete a puzzle
exports.deletePuzzle = async (req, res) => {
  try {
    const { id } = req.params

    const puzzle = await Puzzle.findByIdAndDelete(id)
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Puzzle not found",
      })
    }

    res.json({
      success: true,
      message: "Puzzle deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting puzzle:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// Get puzzle statistics
exports.getPuzzleStats = async (req, res) => {
  try {
    const userId = req.user.id

    const totalPuzzles = await Puzzle.countDocuments()
    const completedPuzzles = await Puzzle.countDocuments({
      "completedBy.userId": userId,
    })

    const todaysPuzzle = await Puzzle.getTodaysPuzzle()
    const hasCompletedToday = todaysPuzzle
      ? todaysPuzzle.completedBy.some((c) => c.userId.toString() === userId)
      : false

    res.json({
      completedPuzzles,
      totalPuzzles,
      hasCompletedToday,
      completionRate: totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0,
    })
  } catch (error) {
    console.error("Error fetching puzzle stats:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

exports.getCompletedPuzzles = async (req, res) => {
  try {
    const userId = req.user.id

    const completedPuzzles = await Puzzle.find({
      "completedBy.userId": userId,
    }).select("word xpReward difficulty activeDate completedBy")

    const userCompletions = completedPuzzles.map((puzzle) => {
      const completion = puzzle.completedBy.find((c) => c.userId.toString() === userId)
      return {
        puzzleId: puzzle._id,
        word: puzzle.word,
        xpReward: puzzle.xpReward,
        difficulty: puzzle.difficulty,
        activeDate: puzzle.activeDate,
        completedAt: completion.completedAt,
        attempts: completion.attempts,
      }
    })

    res.json(userCompletions)
  } catch (error) {
    console.error("Error fetching completed puzzles:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

exports.getPuzzleById = async (req, res) => {
  try {
    const { id } = req.params

    const puzzle = await Puzzle.findById(id)
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: "Puzzle not found",
      })
    }

    res.json({
      success: true,
      data: puzzle,
    })
  } catch (error) {
    console.error("Error fetching puzzle:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
