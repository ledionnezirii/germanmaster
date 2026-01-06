const Dialogue = require("../models/Dialogue");
const User = require("../models/User");

// Get all dialogues with optional level filter
exports.getAllDialogues = async (req, res) => {
  try {
    const { level, category } = req.query;
    const filter = {};

    if (level) filter.level = level;
    if (category) filter.category = category;

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

// Create new dialogue
exports.createDialogue = async (req, res) => {
  try {
    const { title, level, xp, dialogue, questions, audioUrl, difficulty, category } = req.body;

    // Validate questions (minimum 5)
    if (!questions || questions.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Minimum 5 questions required",
      });
    }

    // Validate dialogue lines (minimum 3)
    if (!dialogue || dialogue.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 dialogue lines required",
      });
    }

    const newDialogue = await Dialogue.create({
      title,
      level,
      xp,
      dialogue,
      questions,
      audioUrl,
      difficulty,
      category,
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

// Submit dialogue quiz
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

    res.status(200).json({
      success: true,
      data: {
        total: totalDialogues,
        finished: finishedCount,
        percentage: totalDialogues > 0 ? Math.round((finishedCount / totalDialogues) * 100) : 0,
        byLevel: levelProgress,
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