const Dialogue = require("../models/Dialogue");
const User = require("../models/User");

// Get all dialogues with optional level filter
exports.getAllDialogues = async (req, res) => {
  try {
    const { level, category, dialogueType } = req.query;
    const filter = {};

    if (level) filter.level = level;
    if (category) filter.category = category;
    if (dialogueType) filter.dialogueType = dialogueType;

    const dialogues = await Dialogue.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: dialogues.length,
      data: dialogues,
    });
  } catch (error) {
    console.error("Error fetching dialogues:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dialogues",
      error: error.message,
    });
  }
};

// Get single dialogue by ID
exports.getDialogueById = async (req, res) => {
  try {
    const dialogue = await Dialogue.findById(req.params.id);

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dialogue,
    });
  } catch (error) {
    console.error("Error fetching dialogue:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dialogue",
      error: error.message,
    });
  }
};

exports.createDialogue = async (req, res) => {
  try {
    const { title, level, xp, dialogue, questions, audioUrl, difficulty, category, dialogueType } = req.body;

    // Validate questions (minimum 5) - ONLY for regular type
    if ((!dialogueType || dialogueType === "regular") && (!questions || questions.length < 5)) {
      return res.status(400).json({
        success: false,
        message: "Minimum 5 questions required for regular dialogues",
      });
    }

    // Validate dialogue lines (minimum 3)
    if (!dialogue || dialogue.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 dialogue lines required",
      });
    }

    // Validate sentence_builder type has wordOptions for user turns
    if (dialogueType === "sentence_builder") {
      const userTurns = dialogue.filter(d => d.isUserTurn);
      if (userTurns.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Sentence builder dialogues must have at least one user turn",
        });
      }
      for (const turn of userTurns) {
        if (!turn.wordOptions || turn.wordOptions.length < 2) {
          return res.status(400).json({
            success: false,
            message: "User turns in sentence builder must have at least 2 word options",
          });
        }
      }
    }

    // Validate free_write type has correctAnswer for user turns
    if (dialogueType === "free_write") {
      const userTurns = dialogue.filter(d => d.isUserTurn);
      if (userTurns.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Free write dialogues must have at least one user turn",
        });
      }
      for (const turn of userTurns) {
        if (!turn.correctAnswer) {
          return res.status(400).json({
            success: false,
            message: "User turns in free write must have a correctAnswer",
          });
        }
      }
    }

    const newDialogue = await Dialogue.create({
      title,
      level,
      xp,
      dialogue,
      questions: questions || [],
      audioUrl,
      difficulty,
      category,
      dialogueType: dialogueType || "regular",
    });

    res.status(201).json({
      success: true,
      data: newDialogue,
    });
  } catch (error) {
    console.error("Error creating dialogue:", error);
    res.status(500).json({
      success: false,
      message: "Error creating dialogue",
      error: error.message,
    });
  }
};
// Update dialogue
exports.updateDialogue = async (req, res) => {
  try {
    const dialogue = await Dialogue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dialogue,
    });
  } catch (error) {
    console.error("Error updating dialogue:", error);
    res.status(500).json({
      success: false,
      message: "Error updating dialogue",
      error: error.message,
    });
  }
};

// Delete dialogue
exports.deleteDialogue = async (req, res) => {
  try {
    const dialogue = await Dialogue.findByIdAndDelete(req.params.id);

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Dialogue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dialogue:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting dialogue",
      error: error.message,
    });
  }
};

// Submit dialogue quiz (for regular type)
exports.submitDialogueQuiz = async (req, res) => {
  try {
    const { dialogueId, answers } = req.body;
    const userId = req.user.id;

    const dialogue = await Dialogue.findById(dialogueId);

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    // Check if already completed
    const user = await User.findById(userId);
    if (user.finishedDialogues && user.finishedDialogues.includes(dialogueId)) {
      return res.status(400).json({
        success: false,
        message: "Dialogue already completed",
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = dialogue.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: index,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
    });

    const totalQuestions = dialogue.questions.length;
    const percentage = (correctAnswers / totalQuestions) * 100;
    const passed = percentage >= 80;

    // If passed, update user
    if (passed) {
      user.finishedDialogues = user.finishedDialogues || [];
      user.finishedDialogues.push(dialogueId);
      user.xp += dialogue.xp;
      await user.save();
    }

    res.status(200).json({
      success: true,
      passed,
      score: {
        correct: correctAnswers,
        total: totalQuestions,
        percentage: Math.round(percentage),
      },
      xpAwarded: passed ? dialogue.xp : 0,
      results,
    });
  } catch (error) {
    console.error("Error submitting dialogue quiz:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting quiz",
      error: error.message,
    });
  }
};

// NEW: Submit sentence builder dialogue
exports.submitSentenceBuilder = async (req, res) => {
  try {
    const { dialogueId, userAnswers } = req.body;
    // userAnswers is an array of { turnIndex: number, selectedWords: string[] }
    const userId = req.user.id;

    const dialogue = await Dialogue.findById(dialogueId);

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    if (dialogue.dialogueType !== "sentence_builder") {
      return res.status(400).json({
        success: false,
        message: "This is not a sentence builder dialogue",
      });
    }

    const user = await User.findById(userId);
    if (user.finishedDialogues && user.finishedDialogues.includes(dialogueId)) {
      return res.status(400).json({
        success: false,
        message: "Dialogue already completed",
      });
    }

    // Get user turns from dialogue
    const userTurns = dialogue.dialogue
      .map((line, index) => ({ ...line.toObject(), index }))
      .filter(line => line.isUserTurn);

    let correctCount = 0;
    const results = userTurns.map((turn) => {
      const userAnswer = userAnswers.find(a => a.turnIndex === turn.index);
      const userSentence = userAnswer ? userAnswer.selectedWords.join(" ") : "";
      const correctSentence = turn.text;
      const isCorrect = userSentence.toLowerCase().trim() === correctSentence.toLowerCase().trim();
      
      if (isCorrect) correctCount++;

      return {
        turnIndex: turn.index,
        userSentence,
        correctSentence,
        isCorrect,
      };
    });

    const totalTurns = userTurns.length;
    const percentage = totalTurns > 0 ? (correctCount / totalTurns) * 100 : 0;
    const passed = percentage >= 80;

    if (passed) {
      user.finishedDialogues = user.finishedDialogues || [];
      user.finishedDialogues.push(dialogueId);
      user.xp += dialogue.xp;
      await user.save();
    }

    res.status(200).json({
      success: true,
      passed,
      score: {
        correct: correctCount,
        total: totalTurns,
        percentage: Math.round(percentage),
      },
      xpAwarded: passed ? dialogue.xp : 0,
      results,
    });
  } catch (error) {
    console.error("Error submitting sentence builder:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting sentence builder",
      error: error.message,
    });
  }
};

// NEW: Submit free write dialogue
exports.submitFreeWrite = async (req, res) => {
  try {
    const { dialogueId, userAnswers } = req.body;
    // userAnswers is an array of { turnIndex: number, userText: string }
    const userId = req.user.id;

    const dialogue = await Dialogue.findById(dialogueId);

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: "Dialogue not found",
      });
    }

    if (dialogue.dialogueType !== "free_write") {
      return res.status(400).json({
        success: false,
        message: "This is not a free write dialogue",
      });
    }

    const user = await User.findById(userId);
    if (user.finishedDialogues && user.finishedDialogues.includes(dialogueId)) {
      return res.status(400).json({
        success: false,
        message: "Dialogue already completed",
      });
    }

    // Get user turns from dialogue
    const userTurns = dialogue.dialogue
      .map((line, index) => ({ ...line.toObject(), index }))
      .filter(line => line.isUserTurn);

    let totalScore = 0;
    const results = userTurns.map((turn) => {
      const userAnswer = userAnswers.find(a => a.turnIndex === turn.index);
      const userText = userAnswer ? userAnswer.userText : "";
      const correctText = turn.correctAnswer || turn.text;
      
      // Calculate similarity score (simple word matching)
      const similarity = calculateSimilarity(userText, correctText);
      totalScore += similarity;

      return {
        turnIndex: turn.index,
        userText,
        correctText,
        similarityScore: Math.round(similarity),
        feedback: getSimilarityFeedback(similarity),
      };
    });

    const totalTurns = userTurns.length;
    const averageScore = totalTurns > 0 ? totalScore / totalTurns : 0;
    const passed = averageScore >= 70;

    if (passed) {
      user.finishedDialogues = user.finishedDialogues || [];
      user.finishedDialogues.push(dialogueId);
      user.xp += dialogue.xp;
      await user.save();
    }

    res.status(200).json({
      success: true,
      passed,
      score: {
        averageScore: Math.round(averageScore),
        total: totalTurns,
      },
      xpAwarded: passed ? dialogue.xp : 0,
      results,
    });
  } catch (error) {
    console.error("Error submitting free write:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting free write",
      error: error.message,
    });
  }
};

// Helper function to calculate text similarity
function calculateSimilarity(userText, correctText) {
  if (!userText || !correctText) return 0;
  
  const userWords = userText.toLowerCase().trim().split(/\s+/);
  const correctWords = correctText.toLowerCase().trim().split(/\s+/);
  
  let matchCount = 0;
  
  // Check how many words from correct text appear in user text
  for (const word of correctWords) {
    if (userWords.includes(word)) {
      matchCount++;
    }
  }
  
  // Calculate percentage based on correct text length
  const wordMatchScore = (matchCount / correctWords.length) * 100;
  
  // Also consider word order using Levenshtein-like approach
  const orderScore = calculateOrderScore(userWords, correctWords);
  
  // Combine scores (70% word match, 30% order)
  return (wordMatchScore * 0.7) + (orderScore * 0.3);
}

// Helper function to calculate word order score
function calculateOrderScore(userWords, correctWords) {
  if (userWords.length === 0 || correctWords.length === 0) return 0;
  
  let inOrderCount = 0;
  let lastFoundIndex = -1;
  
  for (const word of correctWords) {
    const userIndex = userWords.indexOf(word);
    if (userIndex > lastFoundIndex) {
      inOrderCount++;
      lastFoundIndex = userIndex;
    }
  }
  
  return (inOrderCount / correctWords.length) * 100;
}

// Helper function to provide feedback based on similarity
function getSimilarityFeedback(score) {
  if (score >= 90) return "Excellent! Almost perfect!";
  if (score >= 80) return "Great job! Very close!";
  if (score >= 70) return "Good! Keep practicing!";
  if (score >= 50) return "Not bad, but needs improvement.";
  return "Keep trying! Practice makes perfect.";
}

// Get user's finished dialogues
exports.getFinishedDialogues = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("finishedDialogues");

    res.status(200).json({
      success: true,
      data: user.finishedDialogues || [],
    });
  } catch (error) {
    console.error("Error fetching finished dialogues:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching finished dialogues",
      error: error.message,
    });
  }
};

// Get user progress
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const totalDialogues = await Dialogue.countDocuments();
    const finishedCount = user.finishedDialogues ? user.finishedDialogues.length : 0;

    // Count by level
    const levelProgress = {};
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    for (const level of levels) {
      const totalByLevel = await Dialogue.countDocuments({ level });
      const finishedByLevel = user.finishedDialogues
        ? await Dialogue.countDocuments({
            _id: { $in: user.finishedDialogues },
            level,
          })
        : 0;

      levelProgress[level] = {
        total: totalByLevel,
        finished: finishedByLevel,
        percentage: totalByLevel > 0 ? Math.round((finishedByLevel / totalByLevel) * 100) : 0,
      };
    }

    // NEW: Count by dialogue type
    const typeProgress = {};
    const types = ["regular", "sentence_builder", "free_write"];

    for (const type of types) {
      const totalByType = await Dialogue.countDocuments({ dialogueType: type });
      const finishedByType = user.finishedDialogues
        ? await Dialogue.countDocuments({
            _id: { $in: user.finishedDialogues },
            dialogueType: type,
          })
        : 0;

      typeProgress[type] = {
        total: totalByType,
        finished: finishedByType,
        percentage: totalByType > 0 ? Math.round((finishedByType / totalByType) * 100) : 0,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        total: totalDialogues,
        finished: finishedCount,
        percentage: totalDialogues > 0 ? Math.round((finishedCount / totalDialogues) * 100) : 0,
        byLevel: levelProgress,
        byType: typeProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress",
      error: error.message,
    });
  }
};