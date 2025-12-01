const Plan = require("../models/Plan")
const User = require("../models/User")

exports.createOrUpdatePlan = async (req, res) => {
  const { level, topics } = req.body
  const adminId = req.user._id

  try {
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: "Topics array is required and cannot be empty." })
    }

    const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid level. Must be A1, A2, B1, B2, C1, or C2." })
    }

    // <CHANGE> Find by BOTH userId and level, not just level
    let plan = await Plan.findOne({ userId: adminId, level })

    if (plan) {
      // Update existing plan
      plan.topics = topics
      await plan.save()
      res.status(200).json({
        success: true,
        data: plan,
        message: `Plan for level ${level} updated successfully.`,
      })
    } else {
      // Create new plan
      plan = await Plan.create({
        level,
        topics,
        userId: adminId,
      })
      res.status(201).json({
        success: true,
        data: plan,
        message: `Plan for level ${level} created successfully.`,
      })
    }
  } catch (error) {
    console.error("Error creating/updating plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.getPlanByLevel = async (req, res) => {
  const { level } = req.params
  const userId = req.user._id

  try {
    // <CHANGE> Find by level only (this gets the admin's plan template for this level)
    // If you want user-specific plans, change this to: { userId, level }
    const plan = await Plan.findOne({ level })

    if (!plan) {
      return res.status(404).json({ message: `No plan found for level ${level}.` })
    }

    // Get user with their plan progress
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Find user's progress for this level
    let userLevelProgress = user.planProgress.find((p) => p.level === level)

    // If no progress exists for this level, initialize it
    if (!userLevelProgress) {
      userLevelProgress = {
        level: level,
        completedTopics: [],
      }
    }

    // Map topics with completion status
    const topicsWithProgress = plan.topics.map((topic) => {
      const completed = userLevelProgress.completedTopics.find((ct) => ct.topicId.toString() === topic._id.toString())

      return {
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        xpReward: topic.xpReward || 100,
        isCompleted: !!completed,
        completedAt: completed ? completed.completedAt : null,
        xpAwarded: completed ? completed.xpAwarded : 0,
      }
    })

    res.status(200).json({
      success: true,
      data: {
        _id: plan._id,
        level: plan.level,
        topics: topicsWithProgress,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
      message: "Plan retrieved successfully.",
    })
  } catch (error) {
    console.error("Error getting plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// ... existing code ...

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().populate("userId", "emri mbiemri email").sort({ level: 1 })

    res.status(200).json({
      success: true,
      data: plans,
      message: "All plans retrieved successfully.",
    })
  } catch (error) {
    console.error("Error getting all plans:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.deletePlan = async (req, res) => {
  const { level } = req.params
  const adminId = req.user._id  // <CHANGE> Get admin ID

  try {
    // <CHANGE> Delete by userId AND level
    const plan = await Plan.findOneAndDelete({ userId: adminId, level })

    if (!plan) {
      return res.status(404).json({ message: `Plan for level ${level} not found.` })
    }

    res.status(200).json({
      success: true,
      message: `Plan for level ${level} deleted successfully.`,
    })
  } catch (error) {
    console.error("Error deleting plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.markTopicAsCompleted = async (req, res) => {
  const { planId, topicId } = req.params
  const userId = req.user._id

  try {
    const plan = await Plan.findById(planId)
    if (!plan) {
      return res.status(404).json({ message: "Plan not found." })
    }

    const topic = plan.topics.id(topicId)
    if (!topic) {
      return res.status(404).json({ message: "Topic not found in this plan." })
    }

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Find or create progress for this level
    let levelProgressIndex = user.planProgress.findIndex((p) => p.level === plan.level)
    if (levelProgressIndex === -1) {
      // Create new progress for this level
      user.planProgress.push({
        level: plan.level,
        completedTopics: [],
      })
      levelProgressIndex = user.planProgress.length - 1
    }

    // Check if already completed
    const alreadyCompleted = user.planProgress[levelProgressIndex].completedTopics.some(
      (ct) => ct.topicId.toString() === topicId,
    )

    if (alreadyCompleted) {
      return res.status(400).json({ message: "Topic is already completed." })
    }

    // Add to completed topics
    const xpReward = topic.xpReward || 100  // <CHANGE> Use topic.xpReward with fallback
    user.planProgress[levelProgressIndex].completedTopics.push({
      topicId: topic._id,
      completedAt: new Date(),
      xpAwarded: xpReward,
    })

    // Update user XP
    user.xp = (user.xp || 0) + xpReward
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        userXp: user.xp,
      },
      message: `Topic marked as completed. ${xpReward} XP awarded!`,
    })
  } catch (error) {
    console.error("Error marking topic as completed:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}