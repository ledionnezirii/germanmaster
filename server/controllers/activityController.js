const Activity = require("../models/Activity");
const moment = require("moment");

// Start a new session
exports.startSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf("day").toDate();

    let activity = await Activity.findOne({ userId, date: today });

    if (!activity) {
      activity = new Activity({
        userId,
        date: today,
        timeSpent: 0,
        sessions: [],
      });
    }

    activity.sessions.push({
      startTime: new Date(),
    });

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Session started",
      sessionId: activity.sessions[activity.sessions.length - 1]._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting session",
      error: error.message,
    });
  }
};

// End a session
exports.endSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body;
    const today = moment().startOf("day").toDate();

    const activity = await Activity.findOne({ userId, date: today });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "No activity found for today",
      });
    }

    const session = activity.sessions.id(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    session.endTime = new Date();
    session.duration = Math.round(
      (session.endTime - session.startTime) / (1000 * 60)
    );

    // Update total time spent
    activity.timeSpent = activity.sessions.reduce(
      (total, s) => total + (s.duration || 0),
      0
    );

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Session ended",
      duration: session.duration,
      totalTimeSpent: activity.timeSpent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error ending session",
      error: error.message,
    });
  }
};

// Add time manually (heartbeat/ping approach)
exports.addTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { minutes = 1 } = req.body;
    const today = moment().startOf("day").toDate();

    let activity = await Activity.findOne({ userId, date: today });

    if (!activity) {
      activity = new Activity({
        userId,
        date: today,
        timeSpent: 0,
        sessions: [],
      });
    }

    activity.timeSpent += minutes;
    await activity.save();

    res.status(200).json({
      success: true,
      totalTimeSpent: activity.timeSpent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding time",
      error: error.message,
    });
  }
};

// Get activity for a date range (for heatmap)
exports.getActivityHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    const startDate = moment()
      .subtract(months, "months")
      .startOf("day")
      .toDate();
    const endDate = moment().endOf("day").toDate();

    const activities = await Activity.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Create a map of date -> timeSpent
    const activityMap = {};
    activities.forEach((activity) => {
      const dateKey = moment(activity.date).format("YYYY-MM-DD");
      activityMap[dateKey] = activity.timeSpent;
    });

    res.status(200).json({
      success: true,
      data: activityMap,
      totalDays: activities.length,
      totalMinutes: activities.reduce((sum, a) => sum + a.timeSpent, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching activity heatmap",
      error: error.message,
    });
  }
};

// Get today's activity
exports.getTodayActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf("day").toDate();

    const activity = await Activity.findOne({ userId, date: today });

    res.status(200).json({
      success: true,
      data: activity || { timeSpent: 0, sessions: [] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching today's activity",
      error: error.message,
    });
  }
};

// Get activity stats
exports.getActivityStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const allActivities = await Activity.find({ userId });

    const totalMinutes = allActivities.reduce((sum, a) => sum + a.timeSpent, 0);
    const totalDays = allActivities.length;
    const averagePerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    // Current streak
    let streak = 0;
    let currentDate = moment().startOf("day");

    while (true) {
      const dateKey = currentDate.format("YYYY-MM-DD");
      const activity = allActivities.find(
        (a) => moment(a.date).format("YYYY-MM-DD") === dateKey
      );

      if (activity && activity.timeSpent > 0) {
        streak++;
        currentDate.subtract(1, "day");
      } else {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedActivities = allActivities
      .filter((a) => a.timeSpent > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < sortedActivities.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = moment(sortedActivities[i - 1].date);
        const currDate = moment(sortedActivities[i].date);
        const diff = currDate.diff(prevDate, "days");

        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    res.status(200).json({
      success: true,
      data: {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60),
        totalDays,
        averagePerDay,
        currentStreak: streak,
        longestStreak,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching activity stats",
      error: error.message,
    });
  }
};
