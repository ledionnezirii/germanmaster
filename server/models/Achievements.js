const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true // Unique identifier like 'xp_100', 'test_master', 'streak_7days'
  },
  title: {
    type: String,
    required: true // e.g. "100 XP Milestone"
  },
  description: {
    type: String // e.g. "Earn 100 XP points"
  },
  xpThreshold: {
    type: Number, // XP needed to unlock this achievement
    required: true
  },
  iconUrl: {
    type: String // Optional URL for an achievement icon
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Achievement", achievementSchema);
