const CommunityMessage = require('../models/Community');

const initCommunitySocket = (io) => {
  const communityNamespace = io.of('/community');

  communityNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  communityNamespace.on('connection', (socket) => {
    console.log(`Community: User ${socket.userId} connected`);

    socket.on('joinCommunity', () => {
      socket.join('community-room');
      console.log(`User ${socket.userId} joined community`);
    });

    socket.on('newMessage', async (data) => {
      try {
        communityNamespace.to('community-room').emit('messagePosted', data);
      } catch (error) {
        console.error('Socket new message error:', error);
      }
    });

    socket.on('messageLiked', async (data) => {
      try {
        communityNamespace.to('community-room').emit('likeUpdate', data);
      } catch (error) {
        console.error('Socket like error:', error);
      }
    });

    socket.on('messageDeleted', async (data) => {
      try {
        communityNamespace.to('community-room').emit('messageRemoved', data);
      } catch (error) {
        console.error('Socket delete error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Community: User ${socket.userId} disconnected`);
    });
  });
};

module.exports = { initCommunitySocket };