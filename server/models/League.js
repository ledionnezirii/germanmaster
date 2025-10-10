const mongoose = require('mongoose');
const { Schema } = mongoose;

const leagueSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // assuming you have a User model
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    default: 'Bronze'
  },
  rank: {
    type: Number,
    default: null 
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const League = mongoose.model('League', leagueSchema);

module.exports = League;
