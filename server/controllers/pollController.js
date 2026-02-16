const Poll = require("../models/Poll");

// GET /api/polls/active
// Returns the currently active poll
// Checks both visitorId AND authenticated userId
const getActivePoll = async (req, res) => {
  try {
    const visitorId = req.query.visitorId || "";
    const userId = req.user ? req.user._id.toString() : null;

    const poll = await Poll.findOne({ active: true }).lean();

    if (!poll) {
      return res.status(404).json({ message: "No active poll found" });
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    // Check if this visitor OR this user already voted
    let existingVote = null;
    if (userId) {
      existingVote = poll.voters.find(
        (v) => v.userId && v.userId.toString() === userId
      );
    }
    if (!existingVote && visitorId) {
      existingVote = poll.voters.find((v) => v.visitorId === visitorId);
    }

    const hasVoted = Boolean(existingVote);
    const votedOptionIndex = hasVoted ? existingVote.optionIndex : null;

    return res.status(200).json({
      _id: poll._id,
      question: poll.question,
      description: poll.description,
      options: poll.options.map((opt) => ({
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
        _id: opt._id,
      })),
      totalVotes,
      hasVoted,
      votedOptionIndex,
      active: poll.active,
    });
  } catch (error) {
    console.error("Error fetching active poll:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/polls/vote
// Body: { pollId, optionIndex, visitorId }
// Also reads req.user if authenticated
const vote = async (req, res) => {
  try {
    const { pollId, optionIndex, visitorId } = req.body;
    const userId = req.user ? req.user._id.toString() : null;
    const userEmail = req.user ? req.user.email : null;
    const userName = req.user
      ? `${req.user.emri || ""} ${req.user.mbiemri || ""}`.trim()
      : null;

    if (!pollId || optionIndex === undefined || (!visitorId && !userId)) {
      return res.status(400).json({
        message: "pollId, optionIndex, and visitorId (or authenticated user) are required",
      });
    }

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.active) {
      return res.status(400).json({ message: "This poll is no longer active" });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Check if user already voted (by userId OR visitorId)
    let alreadyVoted = false;
    if (userId) {
      alreadyVoted = poll.voters.some(
        (v) => v.userId && v.userId.toString() === userId
      );
    }
    if (!alreadyVoted && visitorId) {
      alreadyVoted = poll.voters.some((v) => v.visitorId === visitorId);
    }

    if (alreadyVoted) {
      return res.status(409).json({ message: "You have already voted on this poll" });
    }

    // Record the vote with user info
    poll.options[optionIndex].votes += 1;
    poll.voters.push({
      visitorId: visitorId || "",
      userId: userId || null,
      userEmail: userEmail || null,
      userName: userName || null,
      optionIndex,
    });

    await poll.save();

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    return res.status(200).json({
      message: "Vote recorded successfully",
      options: poll.options.map((opt) => ({
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
        _id: opt._id,
      })),
      totalVotes,
      votedOptionIndex: optionIndex,
    });
  } catch (error) {
    console.error("Error recording vote:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/polls/create
const createPoll = async (req, res) => {
  try {
    const { question, description, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res
        .status(400)
        .json({ message: "question and at least 2 options are required" });
    }

    // Deactivate any currently active poll
    await Poll.updateMany({ active: true }, { active: false });

    const poll = await Poll.create({
      question,
      description: description || "",
      options: options.map((text) => ({ text, votes: 0 })),
      voters: [],
      active: true,
    });

    return res.status(201).json(poll);
  } catch (error) {
    console.error("Error creating poll:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/polls/:pollId/voters (admin only - see who voted)
const getPollVoters = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId).lean();

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const voterDetails = poll.voters.map((v) => ({
      userName: v.userName || "Anonymous",
      userEmail: v.userEmail || null,
      visitorId: v.visitorId,
      optionIndex: v.optionIndex,
      optionText: poll.options[v.optionIndex]?.text || "Unknown",
      votedAt: v.votedAt,
    }));

    return res.status(200).json({
      pollId: poll._id,
      question: poll.question,
      totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes, 0),
      voters: voterDetails,
    });
  } catch (error) {
    console.error("Error fetching voters:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getActivePoll, vote, createPoll, getPollVoters };