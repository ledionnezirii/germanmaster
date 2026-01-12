const User = require("../models/User");
const moment = require("moment");

// Add learning time (called periodically from frontend - every minute or when user does an activity)
exports.addLearningTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { minutes = 1 } = req.body;
    const today = moment().startOf("day").toDate();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find if there's already an entry for today
    const todayActivity = user.learningActivity.find(
      (activity) => moment(activity.date).isSame(today, "day")
    );

    if (todayActivity) {
      // Add minutes to existing entry
      todayActivity.minutes += minutes;
      
      // Convert minutes to hours if >= 60
      if (todayActivity.minutes >= 60) {
        const additionalHours = Math.floor(todayActivity.minutes / 60);
        todayActivity.hours += additionalHours;
        todayActivity.minutes = todayActivity.minutes % 60;
      }
    } else {
      // Create new entry for today
      user.learningActivity.push({
        date: today,
        hours: 0,
        minutes: minutes,
      });
    }

    await user.save();

    // Calculate total time for today
    const updatedActivity = user.learningActivity.find(
      (activity) => moment(activity.date).isSame(today, "day")
    );

    res.status(200).json({
      success: true,
      todayHours: updatedActivity.hours,
      todayMinutes: updatedActivity.minutes,
      totalMinutes: updatedActivity.hours * 60 + updatedActivity.minutes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding learning time",
      error: error.message,
    });
  }
};

// Get activity heatmap (for the last 12 months)
exports.getActivityHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const startDate = moment().subtract(months, "months").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    // Filter activities within date range
    const relevantActivities = user.learningActivity.filter((activity) => {
      const activityDate = moment(activity.date);
      return activityDate.isSameOrAfter(startDate) && activityDate.isSameOrBefore(endDate);
    });

    // Create a map of date -> hours (as decimal)
    const activityMap = {};
    relevantActivities.forEach((activity) => {
      const dateKey = moment(activity.date).format("YYYY-MM-DD");
      const totalHours = activity.hours + activity.minutes / 60;
      activityMap[dateKey] = parseFloat(totalHours.toFixed(2));
    });

    res.status(200).json({
      success: true,
      data: activityMap,
      totalDays: relevantActivities.length,
      totalHours: relevantActivities.reduce((sum, a) => sum + a.hours + a.minutes / 60, 0).toFixed(2),
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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const todayActivity = user.learningActivity.find(
      (activity) => moment(activity.date).isSame(today, "day")
    );

    res.status(200).json({
      success: true,
      data: todayActivity || { hours: 0, minutes: 0 },
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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const activities = user.learningActivity;

    const totalHours = activities.reduce((sum, a) => sum + a.hours + a.minutes / 60, 0);
    const totalDays = activities.filter((a) => a.hours > 0 || a.minutes > 0).length;
    const averagePerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0;

    // Current streak
    let streak = 0;
    let currentDate = moment().startOf("day");

    while (true) {
      const activity = activities.find(
        (a) => moment(a.date).isSame(currentDate, "day") && (a.hours > 0 || a.minutes > 0)
      );

      if (activity) {
        streak++;
        currentDate.subtract(1, "day");
      } else {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedActivities = activities
      .filter((a) => a.hours > 0 || a.minutes > 0)
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
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalDays,
        averagePerDay: parseFloat(averagePerDay),
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
}