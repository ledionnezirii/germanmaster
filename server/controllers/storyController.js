const Story = require("../models/Story");
const User = require("../models/User");

const FREE_STORY_LIMIT = 3;

// GET all stories (optionally filter by level and scenario)
exports.getAllStories = async (req, res) => {
  const { level, scenario } = req.query;
  const filter = { isActive: true };
  if (level) filter.level = level;
  if (scenario) filter.scenario = scenario;

  const stories = await Story.find(filter).select("-steps");
  res.json({ success: true, data: stories });
};

// GET single story by ID (with steps)
exports.getStoryById = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });
  res.json({ success: true, data: story });
};

// POST check a single answer for a step
exports.checkStepAnswer = async (req, res) => {
  const { storyId, stepIndex, userAnswer } = req.body;

  const story = await Story.findById(storyId);
  if (!story) return res.status(404).json({ message: "Story not found" });

  const step = story.steps[stepIndex];
  if (!step || step.type !== "question") {
    return res.status(400).json({ message: "Invalid step" });
  }

  const correct =
    userAnswer?.trim().toLowerCase() === step.correctAnswer?.trim().toLowerCase();

  res.json({
    success: true,
    data: {
      correct,
      correctAnswer: step.correctAnswer,
      userAnswer,
    },
  });
};

// POST submit story result (check score, award XP)
exports.submitStory = async (req, res) => {
  const { storyId, answers, totalQuestions } = req.body;

  const story = await Story.findById(storyId);
  if (!story) return res.status(404).json({ message: "Story not found" });

  let correct = 0;
  answers.forEach((a) => {
    if (
      a.userAnswer?.trim().toLowerCase() ===
      a.correctAnswer?.trim().toLowerCase()
    ) {
      correct++;
    }
  });

  const total = totalQuestions || answers.length;
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = scorePercent >= 70;

  let xpAwarded = 0;
  let alreadyFinished = false;

  if (passed) {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already finished
    if (user.finishedStories && user.finishedStories.map(id => id.toString()).includes(storyId.toString())) {
      alreadyFinished = true;
    } else {
      // Check free user story limit
      const finishedCount = user.finishedStories ? user.finishedStories.length : 0;
      if (!user.isPaid && finishedCount >= FREE_STORY_LIMIT) {
        // Free user has reached their limit — do not record finish or award XP
        return res.json({
          success: true,
          data: {
            score: scorePercent,
            correct,
            total,
            passed,
            xpAwarded: 0,
            alreadyFinished: false,
            limitReached: true,
          },
        });
      }

      xpAwarded = story.xpReward || 10;
      user.xp = (user.xp || 0) + xpAwarded;
      user.weeklyXp = (user.weeklyXp || 0) + xpAwarded;
      user.monthlyXp = (user.monthlyXp || 0) + xpAwarded;

      if (!user.finishedStories) user.finishedStories = [];
      user.finishedStories.push(storyId);
      await user.save();
    }
  }

  res.json({
    success: true,
    data: {
      score: scorePercent,
      correct,
      total,
      passed,
      xpAwarded,
      alreadyFinished,
    },
  });
};

// GET finished stories for current user
exports.getFinishedStories = async (req, res) => {
  const user = await User.findById(req.user.id).populate("finishedStories");
  res.json({ success: true, data: user.finishedStories || [] });
};

// ─── ADMIN ───────────────────────────────────────────────

exports.createStory = async (req, res) => {
  const story = await Story.create(req.body);
  res.status(201).json({ success: true, data: story });
};

exports.updateStory = async (req, res) => {
  const story = await Story.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!story) return res.status(404).json({ message: "Story not found" });
  res.json({ success: true, data: story });
};

exports.deleteStory = async (req, res) => {
  await Story.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Story deleted" });
};