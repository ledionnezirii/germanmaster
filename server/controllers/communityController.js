const CommunityMessage = require('../models/Community');

// Get all messages (questions only, no replies)
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await CommunityMessage.find({ parentId: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'emri mbiemri avatarStyle')
      .lean();

    const total = await CommunityMessage.countDocuments({ parentId: null });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get replies for a message
exports.getReplies = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const replies = await CommunityMessage.find({ parentId: messageId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'emri mbiemri avatarStyle')
      .lean();

    res.json({
      success: true,
      data: replies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Post a new message or reply
exports.postMessage = async (req, res) => {
  try {
    const { content, parentId, mentions } = req.body;
    const userId = req.user._id;
    const username = `${req.user.emri} ${req.user.mbiemri}`;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const message = await CommunityMessage.create({
      content: content.trim(),
      userId,
      username,
      parentId: parentId || null,
      mentions: mentions || [],
      expiresAt
    });

    // Update reply count if this is a reply
    if (parentId) {
      await CommunityMessage.findByIdAndUpdate(parentId, {
        $inc: { replyCount: 1 }
      });
    }

    const populatedMessage = await CommunityMessage.findById(message._id)
      .populate('userId', 'emri mbiemri avatarStyle')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Like/Unlike a message
exports.toggleLike = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const likeIndex = message.likes.indexOf(userId);
    if (likeIndex > -1) {
      message.likes.splice(likeIndex, 1);
    } else {
      message.likes.push(userId);
    }

    await message.save();

    res.json({
      success: true,
      data: {
        likes: message.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a message (only owner)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete all replies if this is a parent message
    if (!message.parentId) {
      await CommunityMessage.deleteMany({ parentId: messageId });
    } else {
      // Decrease reply count
      await CommunityMessage.findByIdAndUpdate(message.parentId, {
        $inc: { replyCount: -1 }
      });
    }

    await message.deleteOne();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};