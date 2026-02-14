const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityMessage',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentions: [{
    type: String
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

messageSchema.index({ createdAt: -1 });
messageSchema.index({ parentId: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CommunityMessage = mongoose.model('CommunityMessage', messageSchema);

module.exports = CommunityMessage;
