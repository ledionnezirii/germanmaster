const Path = require("../models/Path")
const User = require("../models/User")
const Listen = require("../models/Listen")
const { Translate } = require("../models/Translate")
const Phrase = require("../models/Phrase")
const WordAudio = require("../models/WordAudio")
const Sentence = require("../models/Sentence")
const CreateWord = require("../models/CreateWord")
const Dictionary = require("../models/Dictionary")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const { addUserXp } = require("./xpController")

// Helper: shuffle an array in place (Fisher-Yates)
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Helper: language query (matches existing listenController pattern)
const langQuery = (language) => {
  if (!language || language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}

// Model map for dynamic population of exercise content
const getContentModel = (modelName) => {
  const map = {
    Listen: () => require("../models/Listen"),
    Translate: () => require("../models/Translate").Translate,
    Dictionary: () => require("../models/Dictionary"),
    WordAudioSet: () => require("../models/WordAudio"),
    Phrase: () => require("../models/Phrase"),
    Sentence: () => require("../models/Sentence"),
    CreateWord: () => require("../models/CreateWord"),
  }
  return map[modelName] ? map[modelName]() : null
}

// Helper: populate exercises with their referenced content
const populateExercises = async (exercises) => {
  const populated = await Promise.all(
    exercises.map(async (ex) => {
      const exercise = ex.toObject ? ex.toObject() : { ...ex }
      if (exercise.contentId && exercise.contentModel) {
        const Model = getContentModel(exercise.contentModel)
        if (Model) {
          try {
            const content = await Model.findById(exercise.contentId).lean()
            exercise.content = content
          } catch {
            exercise.content = null
          }
        }
      }
      return exercise
    })
  )
  return populated
}

// Helper: get user's path progress entry
const getUserPathProgress = (user, pathId) => {
  if (!user.pathProgress) return null
  return user.pathProgress.find((p) => p.pathId && p.pathId.toString() === pathId.toString())
}

// Helper: calculate XP for a round based on score
const calculateRoundXp = (baseXp, correctCount, totalCount) => {
  if (totalCount === 0) return 0
  const ratio = correctCount / totalCount
  const earned = Math.round(baseXp * ratio)
  // Bonus for perfect round
  const bonus = correctCount === totalCount ? Math.round(baseXp * 0.2) : 0
  return earned + bonus
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / USER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get all paths filtered by level/language, with user progress overlay
// @route   GET /api/path
// @access  Private
const getAllPaths = asyncHandler(async (req, res) => {
  const { level, language } = req.query

  const query = { isActive: true }
  if (level) query.level = level
  if (language) {
    if (language === "de") {
      query.$or = [
        { language: "de" },
        { language: { $exists: false } },
        { language: null },
      ]
    } else {
      query.language = language
    }
  }

  const paths = await Path.find(query)
    .select("-rounds.exercises.answer") // hide answers in list view
    .sort({ order: 1, createdAt: 1 })
    .lean()

  const user = await User.findById(req.user.id).select("pathProgress isPaid xp").lean()

  const pathsWithProgress = paths.map((path) => {
    const progress = (user.pathProgress || []).find(
      (p) => p.pathId && p.pathId.toString() === path._id.toString()
    )

    const completedRoundIndexes = progress ? progress.completedRounds.map((r) => r.roundIndex) : []
    const currentRoundIndex = progress ? progress.currentRoundIndex : 0
    const totalRounds = path.rounds ? path.rounds.length : 0
    const completedCount = completedRoundIndexes.length

    return {
      ...path,
      userProgress: {
        completedRounds: completedRoundIndexes,
        currentRoundIndex,
        totalRounds,
        completedCount,
        percentComplete: totalRounds > 0 ? Math.round((completedCount / totalRounds) * 100) : 0,
        totalXpEarned: progress ? progress.completedRounds.reduce((sum, r) => sum + (r.xpAwarded || 0), 0) : 0,
        startedAt: progress ? progress.startedAt : null,
        lastActivityAt: progress ? progress.lastActivityAt : null,
      },
    }
  })

  res.json(new ApiResponse(200, { paths: pathsWithProgress, total: pathsWithProgress.length }))
})

// @desc    Get a single path with user progress
// @route   GET /api/path/:id
// @access  Private
const getPathById = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id).lean()

  if (!path || !path.isActive) {
    throw new ApiError(404, "Path not found")
  }

  const user = await User.findById(req.user.id).select("pathProgress isPaid xp").lean()
  const progress = getUserPathProgress(user, path._id)

  const completedRoundIndexes = progress ? progress.completedRounds.map((r) => r.roundIndex) : []
  const currentRoundIndex = progress ? progress.currentRoundIndex : 0

  // Attach round-level progress info (no answers exposed)
  const rounds = path.rounds.map((round, idx) => {
    const roundProgress = progress
      ? progress.completedRounds.find((r) => r.roundIndex === idx)
      : null
    return {
      _id: round._id,
      order: round.order,
      title: round.title,
      description: round.description,
      icon: round.icon,
      xpReward: round.xpReward,
      isPremium: round.isPremium,
      exerciseCount: round.exercises ? round.exercises.length : 0,
      isCompleted: completedRoundIndexes.includes(idx),
      isActive: idx === currentRoundIndex,
      isLocked: idx > currentRoundIndex,
      roundProgress: roundProgress || null,
    }
  })

  res.json(
    new ApiResponse(200, {
      path: { ...path, rounds },
      userProgress: {
        completedRounds: completedRoundIndexes,
        currentRoundIndex,
        totalRounds: path.rounds.length,
        completedCount: completedRoundIndexes.length,
        percentComplete:
          path.rounds.length > 0
            ? Math.round((completedRoundIndexes.length / path.rounds.length) * 100)
            : 0,
        totalXpEarned: progress
          ? progress.completedRounds.reduce((sum, r) => sum + (r.xpAwarded || 0), 0)
          : 0,
      },
    })
  )
})

// @desc    Get a specific round with fully populated exercises (no answers)
// @route   GET /api/path/:id/round/:roundIndex
// @access  Private
const getRound = asyncHandler(async (req, res) => {
  const { id, roundIndex } = req.params
  const idx = parseInt(roundIndex, 10)

  const path = await Path.findById(id)
  if (!path || !path.isActive) {
    throw new ApiError(404, "Path not found")
  }

  if (isNaN(idx) || idx < 0 || idx >= path.rounds.length) {
    throw new ApiError(400, "Invalid round index")
  }

  // Check that this round is unlocked for the user
  const user = await User.findById(req.user.id).select("pathProgress isPaid").lean()
  const progress = getUserPathProgress(user, path._id)
  const currentRoundIndex = progress ? progress.currentRoundIndex : 0

  if (idx > currentRoundIndex) {
    throw new ApiError(403, "This round is locked. Complete previous rounds first.")
  }

  const round = path.rounds[idx]

  // Populate exercises with their referenced content
  const populatedExercises = await populateExercises(round.exercises)

  // Strip answers from populated exercises for security
  const safeExercises = populatedExercises.map((ex) => {
    const safe = { ...ex }
    // Only strip answer from inline exercises; content documents have their own answer fields
    // We keep answer for content documents since frontend needs them for some types
    // But hide correctText from listen content (matches existing listen controller pattern)
    if (safe.content && safe.contentModel === "Listen") {
      delete safe.content.correctText
    }
    return safe
  })

  const isCompleted = progress
    ? progress.completedRounds.some((r) => r.roundIndex === idx)
    : false

  res.json(
    new ApiResponse(200, {
      round: {
        _id: round._id,
        order: round.order,
        title: round.title,
        description: round.description,
        icon: round.icon,
        xpReward: round.xpReward,
        isPremium: round.isPremium,
        exercises: safeExercises,
      },
      roundIndex: idx,
      isCompleted,
      totalRounds: path.rounds.length,
    })
  )
})

// @desc    Submit completed round results and award XP
// @route   POST /api/path/:id/round/:roundIndex/complete
// @access  Private
const completeRound = asyncHandler(async (req, res) => {
  const { id, roundIndex } = req.params
  const idx = parseInt(roundIndex, 10)
  const { results } = req.body // [{ exerciseIndex, correct, score }]

  if (!Array.isArray(results) || results.length === 0) {
    throw new ApiError(400, "Exercise results are required")
  }

  const path = await Path.findById(id)
  if (!path || !path.isActive) {
    throw new ApiError(404, "Path not found")
  }

  if (isNaN(idx) || idx < 0 || idx >= path.rounds.length) {
    throw new ApiError(400, "Invalid round index")
  }

  const round = path.rounds[idx]

  // Get user and current progress
  const user = await User.findById(req.user.id)
  if (!user) throw new ApiError(404, "User not found")

  // Initialise pathProgress if needed
  if (!user.pathProgress) user.pathProgress = []

  let progress = user.pathProgress.find(
    (p) => p.pathId && p.pathId.toString() === path._id.toString()
  )

  if (!progress) {
    user.pathProgress.push({
      pathId: path._id,
      language: path.language,
      level: path.level,
      completedRounds: [],
      currentRoundIndex: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    })
    progress = user.pathProgress[user.pathProgress.length - 1]
  }

  // Verify this round is accessible
  if (idx > progress.currentRoundIndex) {
    throw new ApiError(403, "This round is locked. Complete previous rounds first.")
  }

  // Calculate score
  const correctCount = results.filter((r) => r.correct).length
  const totalCount = round.exercises.length || results.length
  const scorePercent = Math.round((correctCount / totalCount) * 100)

  // Pass threshold: user must get at least 4 correct to pass
  const PASS_THRESHOLD = 4
  const passed = correctCount >= PASS_THRESHOLD

  // Calculate XP
  const xpAwarded = passed ? calculateRoundXp(round.xpReward, correctCount, totalCount) : 0

  // Check if already completed (allow replay but don't advance currentRoundIndex again)
  const alreadyCompleted = progress.completedRounds.some((r) => r.roundIndex === idx)

  if (alreadyCompleted) {
    // Update existing record if score improved
    const existing = progress.completedRounds.find((r) => r.roundIndex === idx)
    const improved = scorePercent > existing.score
    if (improved) {
      existing.score = scorePercent
      existing.completedAt = new Date()
      const replayXp = 2
      await addUserXp(user._id, replayXp)
      progress.lastActivityAt = new Date()
      await user.save()
      return res.json(
        new ApiResponse(200, {
          passed: true,
          xpAwarded: replayXp,
          score: scorePercent,
          correctCount,
          totalCount,
          alreadyCompleted: true,
          improved: true,
          currentRoundIndex: progress.currentRoundIndex,
        }, "Round replayed with improved score!")
      )
    }
    return res.json(
      new ApiResponse(200, {
        passed: true,
        xpAwarded: 0,
        score: scorePercent,
        correctCount,
        totalCount,
        alreadyCompleted: true,
        improved: false,
        currentRoundIndex: progress.currentRoundIndex,
      }, "Round already completed")
    )
  }

  // First attempt — only save progress if passed
  if (!passed) {
    return res.json(
      new ApiResponse(200, {
        passed: false,
        score: scorePercent,
        correctCount,
        totalCount,
        xpAwarded: 0,
        passThreshold: PASS_THRESHOLD,
        currentRoundIndex: progress.currentRoundIndex,
      }, `Duhen ${PASS_THRESHOLD} përgjigje të sakta. Ke marrë ${correctCount}/${totalCount}.`)
    )
  }

  // Passed — save completion and award XP
  progress.completedRounds.push({
    roundIndex: idx,
    completedAt: new Date(),
    xpAwarded,
    score: scorePercent,
  })

  // Advance currentRoundIndex
  if (idx === progress.currentRoundIndex && idx + 1 < path.rounds.length) {
    progress.currentRoundIndex = idx + 1
  }

  progress.lastActivityAt = new Date()

  if (xpAwarded > 0) {
    await addUserXp(user._id, xpAwarded)
  }

  await user.save()

  const pathCompleted = progress.completedRounds.length === path.rounds.length

  res.json(
    new ApiResponse(200, {
      passed: true,
      xpAwarded,
      score: scorePercent,
      correctCount,
      totalCount,
      perfectRound: correctCount === totalCount,
      pathCompleted,
      currentRoundIndex: progress.currentRoundIndex,
      completedRoundsCount: progress.completedRounds.length,
      totalRounds: path.rounds.length,
    }, pathCompleted ? "Rruga u Perfundua!" : "Raundi u kalua!")
  )
})

// @desc    Get the current user's overall path progress
// @route   GET /api/path/user/progress
// @access  Private
const getUserProgress = asyncHandler(async (req, res) => {
  const { language } = req.query

  const user = await User.findById(req.user.id).select("pathProgress xp isPaid").lean()

  if (!user.pathProgress || user.pathProgress.length === 0) {
    return res.json(new ApiResponse(200, { pathProgress: [], totalXpEarned: 0, totalPaths: 0 }))
  }

  // Build a query to find the paths this user has progress on
  const pathIds = user.pathProgress.map((p) => p.pathId).filter(Boolean)
  const pathQuery = { _id: { $in: pathIds }, isActive: true }
  if (language) pathQuery.language = language

  const paths = await Path.find(pathQuery).select("title level language order rounds totalXp").lean()

  const summary = user.pathProgress
    .filter((p) => paths.some((path) => path._id.toString() === p.pathId?.toString()))
    .map((p) => {
      const pathDoc = paths.find((path) => path._id.toString() === p.pathId?.toString())
      const totalXpEarned = p.completedRounds.reduce((sum, r) => sum + (r.xpAwarded || 0), 0)
      const totalRounds = pathDoc ? pathDoc.rounds.length : 0
      return {
        pathId: p.pathId,
        pathTitle: pathDoc ? pathDoc.title : "Unknown",
        level: p.level,
        language: p.language,
        completedRounds: p.completedRounds.length,
        totalRounds,
        currentRoundIndex: p.currentRoundIndex,
        percentComplete: totalRounds > 0 ? Math.round((p.completedRounds.length / totalRounds) * 100) : 0,
        totalXpEarned,
        startedAt: p.startedAt,
        lastActivityAt: p.lastActivityAt,
        isCompleted: pathDoc ? p.completedRounds.length === pathDoc.rounds.length : false,
      }
    })

  const totalXpEarned = summary.reduce((sum, s) => sum + s.totalXpEarned, 0)

  res.json(new ApiResponse(200, { pathProgress: summary, totalXpEarned, totalPaths: summary.length }))
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-GENERATE PATH FROM EXISTING CONTENT
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Auto-generate a learning path from existing content (phrases, listen, etc.)
// @route   POST /api/path/generate
// @access  Private
const generatePath = asyncHandler(async (req, res) => {
  const { level, language, forceRegenerate } = req.body
  const lvl = level || "A1"
  const lang = language || "de"

  // Check if a generated path already exists and return it (unless forceRegenerate)
  if (!forceRegenerate) {
    const existing = await Path.findOne({
      level: lvl,
      language: lang,
      isActive: true,
      title: { $regex: /^🗺️/ },
    })
    if (existing) {
      return res.json(new ApiResponse(200, existing, "Existing path returned"))
    }
  }

  const lq = langQuery(lang)
  const baseQuery = (extra = {}) => ({ level: lvl, isActive: true, ...lq, ...extra })

  // Fetch content from all collections
  const [listens, phrases, sentences, wordAudioSets, createWords, dictWords] = await Promise.all([
    Listen.find(baseQuery()).select("_id title text level language").limit(80).lean(),
    Phrase.find(baseQuery()).select("_id german albanian level language category").limit(120).lean(),
    Sentence.find({ level: lvl, ...lq }).select("_id title questions level language").limit(80).lean(),
    WordAudio.find({ level: lvl, ...lq }).select("_id title words level language").limit(30).lean(),
    CreateWord.find({ level: lvl, ...lq }).select("_id title words level language").limit(80).lean(),
    Dictionary.find(baseQuery()).select("_id word translation level language").limit(150).lean(),
  ])

  // Expand word audio sets into individual words with 4-option MCQ
  const wordItems = []
  for (const set of wordAudioSets) {
    const allWords = (set.words || []).map((w) => w.germanWord)
    for (const word of set.words || []) {
      const wrongPool = shuffle(allWords.filter((w) => w !== word.germanWord))
      const options = shuffle([word.germanWord, ...wrongPool.slice(0, 3)])
      wordItems.push({
        germanWord: word.germanWord,
        albanianWord: word.albanianWord,
        options,
        setId: set._id,
        level: set.level,
      })
    }
  }

  // Shuffle all sources
  const sListens = shuffle(listens)
  const sPhrases = shuffle(phrases)
  const sSentences = shuffle(sentences)
  const sWords = shuffle(wordItems)
  const sCreateWords = shuffle(createWords)
  const sDictWords = shuffle(dictWords)

  // Round icons
  const ICONS = ["🎯", "⭐", "🔥", "💎", "🏆", "🌟", "✨", "🎪", "🎨", "🎭",
                 "🚀", "🦋", "🌈", "🎵", "🏄", "🎃", "🌺", "🦊", "🎲", "💡"]

  let li = 0, pi = 0, si = 0, wi = 0, ci = 0, di = 0
  const rounds = []

  // Keep building rounds until we run out of content
  while (true) {
    const exercises = []

    // 1. Dictionary word (show word → MCQ translation)
    if (di < sDictWords.length) {
      const item = sDictWords[di++]
      const correct = item.translation || ""
      const wrongPool = shuffle(sDictWords.filter((d) => d._id.toString() !== item._id.toString()).map((d) => d.translation || "").filter(Boolean))
      const options = shuffle([correct, ...wrongPool.slice(0, 3)])
      exercises.push({
        type: "dictionaryWord",
        contentId: item._id,
        contentModel: "Dictionary",
        question: item.word,
        answer: correct,
        audioText: item.word,
        options,
        xpReward: 5,
      })
    }

    // 2. Phrase (show German phrase + audio → user types translation)
    if (pi < sPhrases.length) {
      const item = sPhrases[pi++]
      exercises.push({
        type: "phrase",
        contentId: item._id,
        contentModel: "Phrase",
        question: item.german,
        answer: item.albanian,
        audioText: item.german,
        translation: item.albanian,
        xpReward: 5,
      })
    }

    // 3. Sentence (scrambled word ordering)
    if (si < sSentences.length) {
      const item = sSentences[si++]
      const q = item.questions?.[0]
      if (q && q.correctSentence) {
        const wordsList = q.correctSentence.split(/\s+/).filter(Boolean)
        exercises.push({
          type: "sentence",
          contentId: item._id,
          contentModel: "Sentence",
          question: q.question || item.title || "Arrange the words",
          answer: q.correctSentence,
          words: wordsList,
          xpReward: 5,
        })
      }
    }

    // 4. CreateWord (show Albanian hint → user types German word)
    if (ci < sCreateWords.length) {
      const item = sCreateWords[ci++]
      const w = item.words?.[0]
      if (w) {
        exercises.push({
          type: "createWord",
          contentId: item._id,
          contentModel: "CreateWord",
          question: w.albanian,
          answer: w.german,
          translation: w.albanian,
          audioText: w.german,
          xpReward: 5,
        })
      }
    }

    // 5. Listen test (play audio → type what you hear)
    if (li < sListens.length) {
      const item = sListens[li++]
      exercises.push({
        type: "listenTest",
        contentId: item._id,
        contentModel: "Listen",
        audioText: item.text,
        question: item.title || item.text,
        xpReward: 5,
      })
    }

    // 6. Translate (second phrase shown → type translation)
    if (pi < sPhrases.length) {
      const item = sPhrases[pi++]
      exercises.push({
        type: "translate",
        contentId: item._id,
        contentModel: "Phrase",
        question: item.german,
        answer: item.albanian,
        audioText: item.german,
        translation: item.albanian,
        xpReward: 5,
      })
    } else if (wi < sWords.length) {
      // Fallback: word audio if no more phrases
      const item = sWords[wi++]
      exercises.push({
        type: "wordAudio",
        audioText: item.germanWord,
        question: item.albanianWord,
        answer: item.germanWord,
        options: item.options,
        translation: item.albanianWord,
        xpReward: 5,
      })
    }

    // Stop if this round has fewer than 3 exercises (ran out of content)
    if (exercises.length < 3) break

    const roundIdx = rounds.length
    rounds.push({
      order: roundIdx,
      title: `Round ${roundIdx + 1}`,
      icon: ICONS[roundIdx % ICONS.length],
      exercises,
      xpReward: exercises.length * 5,
    })

    // Safety cap
    if (rounds.length >= 50) break
  }

  if (rounds.length === 0) {
    throw new ApiError(400, `Not enough content for level ${lvl}. Please add phrases, listen tests, sentences, or dictionary words first.`)
  }

  // Deactivate any old generated path for this level/language
  await Path.updateMany(
    { level: lvl, language: lang, title: { $regex: /^🗺️/ } },
    { isActive: false }
  )

  const path = await Path.create({
    title: `🗺️ ${lvl} Learning Path`,
    description: `Auto-generated from ${lvl} content — ${rounds.length} rounds`,
    level: lvl,
    language: lang,
    order: 0,
    rounds,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, path, `Generated ${rounds.length} rounds from existing content`))
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Create a new path
// @route   POST /api/path
// @access  Private (Admin)
const createPath = asyncHandler(async (req, res) => {
  const { title, description, level, language, order, rounds } = req.body

  if (!title || !level) {
    throw new ApiError(400, "Title and level are required")
  }

  const path = await Path.create({
    title,
    description,
    level,
    language: language || "de",
    order: order || 0,
    rounds: rounds || [],
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, path, "Path created successfully"))
})

// @desc    Update a path
// @route   PUT /api/path/:id
// @access  Private (Admin)
const updatePath = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id)
  if (!path) throw new ApiError(404, "Path not found")

  const updated = await Path.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updated, "Path updated successfully"))
})

// @desc    Delete (deactivate) a path
// @route   DELETE /api/path/:id
// @access  Private (Admin)
const deletePath = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id)
  if (!path) throw new ApiError(404, "Path not found")

  path.isActive = false
  await path.save()

  res.json(new ApiResponse(200, null, "Path deactivated successfully"))
})

// @desc    Get all paths for admin (including inactive)
// @route   GET /api/path/admin/all
// @access  Private (Admin)
const getAllPathsAdmin = asyncHandler(async (req, res) => {
  const { level, language } = req.query
  const query = {}
  if (level) query.level = level
  if (language) query.language = language

  const paths = await Path.find(query).sort({ level: 1, order: 1, createdAt: -1 })
  res.json(new ApiResponse(200, { paths, total: paths.length }))
})

// @desc    Add a round to a path
// @route   POST /api/path/:id/round
// @access  Private (Admin)
const addRound = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id)
  if (!path) throw new ApiError(404, "Path not found")

  const { title, description, icon, exercises, xpReward, isPremium } = req.body
  if (!title) throw new ApiError(400, "Round title is required")

  const order = path.rounds.length
  path.rounds.push({ order, title, description, icon, exercises: exercises || [], xpReward: xpReward || 20, isPremium: isPremium || false })
  await path.save()

  res.status(201).json(new ApiResponse(201, path, "Round added successfully"))
})

// @desc    Update a specific round
// @route   PUT /api/path/:id/round/:roundIndex
// @access  Private (Admin)
const updateRound = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id)
  if (!path) throw new ApiError(404, "Path not found")

  const idx = parseInt(req.params.roundIndex, 10)
  if (isNaN(idx) || idx < 0 || idx >= path.rounds.length) {
    throw new ApiError(400, "Invalid round index")
  }

  const { title, description, icon, exercises, xpReward, isPremium } = req.body
  const round = path.rounds[idx]

  if (title !== undefined) round.title = title
  if (description !== undefined) round.description = description
  if (icon !== undefined) round.icon = icon
  if (exercises !== undefined) round.exercises = exercises
  if (xpReward !== undefined) round.xpReward = xpReward
  if (isPremium !== undefined) round.isPremium = isPremium

  await path.save()

  res.json(new ApiResponse(200, path, "Round updated successfully"))
})

// @desc    Delete a round from a path
// @route   DELETE /api/path/:id/round/:roundIndex
// @access  Private (Admin)
const deleteRound = asyncHandler(async (req, res) => {
  const path = await Path.findById(req.params.id)
  if (!path) throw new ApiError(404, "Path not found")

  const idx = parseInt(req.params.roundIndex, 10)
  if (isNaN(idx) || idx < 0 || idx >= path.rounds.length) {
    throw new ApiError(400, "Invalid round index")
  }

  path.rounds.splice(idx, 1)
  // Re-order remaining rounds
  path.rounds.forEach((r, i) => { r.order = i })
  await path.save()

  res.json(new ApiResponse(200, path, "Round deleted successfully"))
})

module.exports = {
  getAllPaths,
  getPathById,
  getRound,
  completeRound,
  getUserProgress,
  generatePath,
  createPath,
  updatePath,
  deletePath,
  getAllPathsAdmin,
  addRound,
  updateRound,
  deleteRound,
}
