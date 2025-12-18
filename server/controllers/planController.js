const Plan = require("../models/Plan")
const User = require("../models/User")

exports.createOrUpdatePlan = async (req, res) => {
  const { level, weeks } = req.body
  const adminId = req.user._id

  try {
    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) {
      return res.status(400).json({ message: "Weeks array is required and cannot be empty." })
    }

    const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid level. Must be A1, A2, B1, B2, C1, or C2." })
    }

    // Validate weeks structure
    for (const week of weeks) {
      if (!week.weekNumber || !week.title || !week.topics || !Array.isArray(week.topics)) {
        return res.status(400).json({
          message: "Each week must have weekNumber, title, and topics array.",
        })
      }
    }

    let plan = await Plan.findOne({ userId: adminId, level })

    if (plan) {
      plan.weeks = weeks
      await plan.save()
      res.status(200).json({
        success: true,
        data: plan,
        message: `Plan for level ${level} updated successfully.`,
      })
    } else {
      plan = await Plan.create({
        level,
        weeks,
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

const areOtherWeeksLocked = (userLevelProgress) => {
  if (!userLevelProgress || !userLevelProgress.activeWeek) {
    return null
  }

  const lockedUntil = userLevelProgress.activeWeek.lockedUntil
  if (!lockedUntil) {
    return null
  }

  const now = new Date()
  if (now < new Date(lockedUntil)) {
    return {
      isLocked: true,
      lockedUntil: lockedUntil,
      activeWeekNumber: userLevelProgress.activeWeek.weekNumber,
    }
  }

  return null
}

exports.getPlanByLevel = async (req, res) => {
  const { level } = req.params
  const userId = req.user._id

  try {
    const plan = await Plan.findOne({ level })

    if (!plan) {
      return res.status(404).json({ message: `No plan found for level ${level}.` })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    let userLevelProgress = user.planProgress.find((p) => p.level === level)

    if (!userLevelProgress) {
      userLevelProgress = {
        level: level,
        completedTopics: [],
        completedWeeks: [],
      }
    }

    const lockStatus = areOtherWeeksLocked(userLevelProgress)

    const weeksWithProgress = plan.weeks.map((week, weekIndex) => {
      const topicsWithProgress = week.topics.map((topic) => {
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

      const completedTopicsCount = topicsWithProgress.filter((t) => t.isCompleted).length
      const totalTopicsCount = topicsWithProgress.length
      const isWeekCompleted = completedTopicsCount === totalTopicsCount && totalTopicsCount > 0

      let isLocked = false
      let isUnlocked = false

      if (lockStatus && lockStatus.isLocked) {
        // If there's an active week, only that week is unlocked
        if (week.weekNumber === lockStatus.activeWeekNumber) {
          isUnlocked = true
          isLocked = false
        } else {
          isLocked = true
          isUnlocked = false
        }
      } else {
        // Normal progression logic: week is locked if previous weeks aren't completed
        isLocked =
          weekIndex > 0 &&
          !plan.weeks.slice(0, weekIndex).every((prevWeek) => {
            const prevWeekTopics = prevWeek.topics.map((topic) => {
              const completed = userLevelProgress.completedTopics.find(
                (ct) => ct.topicId.toString() === topic._id.toString(),
              )
              return !!completed
            })
            return prevWeekTopics.every((completed) => completed) && prevWeekTopics.length > 0
          })
        isUnlocked = !isLocked
      }

      return {
        _id: week._id,
        weekNumber: week.weekNumber,
        title: week.title,
        description: week.description,
        topics: topicsWithProgress,
        isCompleted: isWeekCompleted,
        isLocked: isLocked,
        isUnlocked: isUnlocked,
        progress: {
          completed: completedTopicsCount,
          total: totalTopicsCount,
          percentage: totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0,
        },
      }
    })

    res.status(200).json({
      success: true,
      data: {
        _id: plan._id,
        level: plan.level,
        weeks: weeksWithProgress,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        lockStatus: lockStatus,
      },
      message: "Plan retrieved successfully.",
    })
  } catch (error) {
    console.error("Error getting plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.startWeek = async (req, res) => {
  const { level, weekNumber } = req.params
  const userId = req.user._id

  try {
    const plan = await Plan.findOne({ level })

    if (!plan) {
      return res.status(404).json({ message: `No plan found for level ${level}.` })
    }

    const week = plan.weeks.find((w) => w.weekNumber === Number.parseInt(weekNumber))

    if (!week) {
      return res.status(404).json({ message: `Week ${weekNumber} not found in this plan.` })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    let userLevelProgress = user.planProgress.find((p) => p.level === level)

    if (!userLevelProgress) {
      userLevelProgress = {
        level: level,
        completedTopics: [],
        completedWeeks: [],
        activeWeek: null,
      }
      user.planProgress.push(userLevelProgress)
    } else {
      // Check if there's already an active week
      const lockStatus = areOtherWeeksLocked(userLevelProgress)
      if (lockStatus && lockStatus.isLocked && lockStatus.activeWeekNumber !== Number.parseInt(weekNumber)) {
        return res.status(400).json({
          message: `You already have an active week (Week ${lockStatus.activeWeekNumber}). Please complete it before starting another week. It will unlock on ${new Date(lockStatus.lockedUntil).toLocaleDateString()}.`,
          lockStatus: lockStatus,
        })
      }
    }

    // Set this week as active and lock others for 7 days
    const lockedUntil = new Date()
    lockedUntil.setDate(lockedUntil.getDate() + 7)

    const levelProgressIndex = user.planProgress.findIndex((p) => p.level === level)
    user.planProgress[levelProgressIndex].activeWeek = {
      weekNumber: Number.parseInt(weekNumber),
      startedAt: new Date(),
      lockedUntil: lockedUntil,
    }

    await user.save()

    res.status(200).json({
      success: true,
      data: {
        weekNumber: Number.parseInt(weekNumber),
        lockedUntil: lockedUntil,
        message: `Week ${weekNumber} started! Other weeks are now locked for 7 days.`,
      },
      message: `Week ${weekNumber} started successfully.`,
    })
  } catch (error) {
    console.error("Error starting week:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.getWeekByNumber = async (req, res) => {
  const { level, weekNumber } = req.params
  const userId = req.user._id

  try {
    const plan = await Plan.findOne({ level })

    if (!plan) {
      return res.status(404).json({ message: `No plan found for level ${level}.` })
    }

    const week = plan.weeks.find((w) => w.weekNumber === Number.parseInt(weekNumber))

    if (!week) {
      return res.status(404).json({ message: `Week ${weekNumber} not found in this plan.` })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    let userLevelProgress = user.planProgress.find((p) => p.level === level)

    if (!userLevelProgress) {
      userLevelProgress = {
        level: level,
        completedTopics: [],
      }
    }

    const topicsWithProgress = week.topics.map((topic) => {
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
        _id: week._id,
        weekNumber: week.weekNumber,
        title: week.title,
        description: week.description,
        topics: topicsWithProgress,
      },
      message: "Week retrieved successfully.",
    })
  } catch (error) {
    console.error("Error getting week:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

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
  const adminId = req.user._id

  try {
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

    let foundTopic = null
    let foundWeek = null
    for (const week of plan.weeks) {
      const topic = week.topics.id(topicId)
      if (topic) {
        foundTopic = topic
        foundWeek = week
        break
      }
    }

    if (!foundTopic || !foundWeek) {
      return res.status(404).json({ message: "Topic not found in this plan." })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    let levelProgressIndex = user.planProgress.findIndex((p) => p.level === plan.level)
    if (levelProgressIndex === -1) {
      user.planProgress.push({
        level: plan.level,
        completedTopics: [],
        completedWeeks: [],
      })
      levelProgressIndex = user.planProgress.length - 1
    }

    const alreadyCompleted = user.planProgress[levelProgressIndex].completedTopics.some(
      (ct) => ct.topicId.toString() === topicId,
    )

    if (alreadyCompleted) {
      return res.status(400).json({ message: "Topic is already completed." })
    }

    const xpReward = foundTopic.xpReward || 100
    user.planProgress[levelProgressIndex].completedTopics.push({
      topicId: foundTopic._id,
      completedAt: new Date(),
      xpAwarded: xpReward,
    })

    user.xp = (user.xp || 0) + xpReward

    // ✅ CHECK IF ALL TOPICS IN THIS WEEK ARE NOW COMPLETED
    const allTopicsInWeek = foundWeek.topics
    const completedTopicsInWeek = user.planProgress[levelProgressIndex].completedTopics.filter((ct) =>
      allTopicsInWeek.some((topic) => topic._id.toString() === ct.topicId.toString()),
    )

    const isWeekFullyCompleted = completedTopicsInWeek.length === allTopicsInWeek.length

    let weekFinishedMessage = ""

    if (isWeekFullyCompleted) {
      // Check if week is already marked as completed
      const weekAlreadyCompleted = user.planProgress[levelProgressIndex].completedWeeks.some(
        (cw) => cw.weekNumber === foundWeek.weekNumber,
      )

      if (!weekAlreadyCompleted) {
        // Mark week as completed
        user.planProgress[levelProgressIndex].completedWeeks.push({
          weekNumber: foundWeek.weekNumber,
          completedAt: new Date(),
        })

        // Clear active week lock if this was the active week
        if (
          user.planProgress[levelProgressIndex].activeWeek &&
          user.planProgress[levelProgressIndex].activeWeek.weekNumber === foundWeek.weekNumber
        ) {
          user.planProgress[levelProgressIndex].activeWeek = null
        }

        weekFinishedMessage = ` 🎉 Java ${foundWeek.weekNumber} u përfundua me sukses!`
      }
    }

    await user.save()

    res.status(200).json({
      success: true,
      data: {
        userXp: user.xp,
        weekCompleted: isWeekFullyCompleted,
        weekNumber: foundWeek.weekNumber,
      },
      message: `Tema u shënua si e përfunduar. ${xpReward} XP u shtuan!${weekFinishedMessage}`,
    })
  } catch (error) {
    console.error("Error marking topic as completed:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}