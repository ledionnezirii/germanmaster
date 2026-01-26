const Sentence = require("../models/Sentence");
const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { addUserXp } = require("./xpController");

// Get all sentence quizzes
const getAllSentences = asyncHandler(async (req, res) => {
  const { level, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (level) query.level = level;

  const sentences = await Sentence.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: 1 });

  const total = await Sentence.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      sentences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get sentence quiz by ID
const getSentenceById = asyncHandler(async (req, res) => {
  const sentence = await Sentence.findById(req.params.id);

  if (!sentence) {
    throw new ApiError(404, "Sentence quiz not found");
  }

  res.json(new ApiResponse(200, sentence));
});

// Get sentences by level
const getSentencesByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params;
  const userId = req.user.id;

  const sentences = await Sentence.find({ level });

  // Add completion status for each sentence
  const sentencesWithStatus = sentences.map((sentence) => ({
    ...sentence.toObject(),
    isCompleted: sentence.completedBy.includes(userId),
  }));

  res.json(new ApiResponse(200, sentencesWithStatus));
});

// Create a new sentence quiz (single)
const createSentence = asyncHandler(async (req, res) => {
  const { title, level, xp, questions } = req.body;

  if (!title || !level || !questions || questions.length === 0) {
    throw new ApiError(400, "Title, level, and at least one question are required");
  }

  // Validate each question has required fields
  for (const q of questions) {
    if (!q.question || !q.correctSentence || !q.options || q.options.length < 2) {
      throw new ApiError(400, "Each question must have question, correctSentence, and at least 2 options");
    }
  }

  const sentence = await Sentence.create({
    title,
    level,
    xp: xp || 10,
    questions,
  });

  res.status(201).json(new ApiResponse(201, sentence, "Sentence quiz created successfully"));
});

// Create multiple sentence quizzes (bulk)
const createBulkSentences = asyncHandler(async (req, res) => {
  const { sentences } = req.body;

  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    throw new ApiError(400, "An array of sentences is required");
  }

  // Validate each sentence
  for (const s of sentences) {
    if (!s.title || !s.level || !s.questions || s.questions.length === 0) {
      throw new ApiError(400, "Each sentence must have title, level, and at least one question");
    }
    for (const q of s.questions) {
      if (!q.question || !q.correctSentence || !q.options || q.options.length < 2) {
        throw new ApiError(400, "Each question must have question, correctSentence, and at least 2 options");
      }
    }
  }

  const createdSentences = await Sentence.insertMany(sentences);

  res.status(201).json(
    new ApiResponse(201, createdSentences, `${createdSentences.length} sentence quizzes created successfully`)
  );
});

// Update a sentence quiz
const updateSentence = asyncHandler(async (req, res) => {
  const { title, level, xp, questions } = req.body;

  const sentence = await Sentence.findById(req.params.id);

  if (!sentence) {
    throw new ApiError(404, "Sentence quiz not found");
  }

  if (title) sentence.title = title;
  if (level) sentence.level = level;
  if (xp) sentence.xp = xp;
  if (questions) sentence.questions = questions;

  await sentence.save();

  res.json(new ApiResponse(200, sentence, "Sentence quiz updated successfully"));
});

// Delete a sentence quiz
const deleteSentence = asyncHandler(async (req, res) => {
  const sentence = await Sentence.findById(req.params.id);

  if (!sentence) {
    throw new ApiError(404, "Sentence quiz not found");
  }

  await sentence.deleteOne();

  res.json(new ApiResponse(200, null, "Sentence quiz deleted successfully"));
});

// Submit sentence quiz answers
const submitSentence = asyncHandler(async (req, res) => {
  const { answers } = req.body; // Array of user's answers: ["Ich bin Ledio", "Du gehst zur Schule", ...]
  const userId = req.user.id;

  const sentence = await Sentence.findById(req.params.id);

  if (!sentence) {
    throw new ApiError(404, "Sentence quiz not found");
  }

  if (!answers || !Array.isArray(answers)) {
    throw new ApiError(400, "Answers array is required");
  }

  // Calculate score
  let correctCount = 0;
  const results = sentence.questions.map((question, index) => {
    const userAnswer = answers[index] || "";
    const isCorrect = userAnswer.trim().toLowerCase() === question.correctSentence.trim().toLowerCase();
    if (isCorrect) correctCount++;
    
    return {
      question: question.question,
      userAnswer,
      correctAnswer: question.correctSentence,
      isCorrect,
    };
  });

  const totalQuestions = sentence.questions.length;
  const accuracy = (correctCount / totalQuestions) * 100;
  const passed = accuracy >= 70;

  let xpAwarded = 0;
  let alreadyCompleted = sentence.completedBy.includes(userId);

  // Award XP if passed and not already completed
  if (passed && !alreadyCompleted) {
    xpAwarded = sentence.xp;
    
    // Add XP to user
    await addUserXp(userId, xpAwarded);
    
    // Mark quiz as completed in Sentence model
    sentence.completedBy.push(userId);
    await sentence.save();

    // Save finished sentence to User model
    await User.findByIdAndUpdate(userId, {
      $addToSet: { finishedSentences: sentence._id }
    });
  }

  res.json(
    new ApiResponse(200, {
      results,
      correctCount,
      totalQuestions,
      accuracy: Math.round(accuracy),
      passed,
      xpAwarded,
      alreadyCompleted,
      message: passed 
        ? alreadyCompleted 
          ? "Kuizi u kalua! (Tashmë i përfunduar - nuk fitohet XP)" 
          : `Urime! Fitove ${xpAwarded} XP!`
        : "Vazhdo të praktikosh! Duhet 70% për të kaluar.",
    })
  );
});

// Get user's completed sentence quizzes
const getCompletedSentences = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const completedSentences = await Sentence.find({
    completedBy: userId,
  }).select("title level xp");

  res.json(new ApiResponse(200, completedSentences));
});

// Get user's finished sentences from User model
const getFinishedSentences = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .populate({
      path: "finishedSentences",
      select: "title level xp questions",
    });

  if (!user) {
    throw new ApiError(404, "Përdoruesi nuk u gjet");
  }

  res.json(new ApiResponse(200, user.finishedSentences || []));
});

module.exports = {
  getAllSentences,
  getSentenceById,
  getSentencesByLevel,
  createSentence,
  createBulkSentences,
  updateSentence,
  deleteSentence,
  submitSentence,
  getCompletedSentences,
  getFinishedSentences,
};
