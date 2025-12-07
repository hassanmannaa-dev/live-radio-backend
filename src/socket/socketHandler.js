function createSocketHandler(io, services) {
  const { userService, radioService, queueService, chatService } = services;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Send initial state to new connection
    socket.emit('radioUpdate', radioService.getStatus());
    socket.emit('playlistUpdate', { playlist: queueService.getPlaylist() });
    socket.emit('usersUpdate', { users: userService.getOnlineUsers() });
    socket.emit('chatHistory', { messages: chatService.getHistory(50) });

    // User authentication
    socket.on('authenticateUser', ({ userId }) => {
      const user = userService.connectUser(userId, socket.id);

      if (!user) {
        socket.emit('authError', { message: 'User not found. Please register first.' });
        return;
      }

      radioService.addListener(socket.id);

      socket.emit('authSuccess', {
        user: user.getPublicInfo(),
        message: 'Authentication successful'
      });

      io.emit('usersUpdate', { users: userService.getOnlineUsers() });
      io.emit('userOnline', user.getPublicInfo());
      io.emit('listenerUpdate', { count: radioService.getListenerCount() });
    });

    // Typing indicator
    socket.on('typing', ({ isTyping }) => {
      const user = userService.getUserBySocketId(socket.id);

      if (!user) {
        return;
      }

      socket.broadcast.emit('userTyping', {
        userId: user.id,
        username: user.name,
        isTyping: isTyping
      });
    });

    // Chat message
    socket.on('sendMessage', ({ message }) => {
      const user = userService.getUserBySocketId(socket.id);

      if (!user) {
        socket.emit('messageError', { message: 'You must be authenticated to send messages' });
        return;
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        socket.emit('messageError', { message: 'Message cannot be empty' });
        return;
      }

      const chatMessage = chatService.addMessage(
        user.id,
        user.name,
        user.avatarId,
        message.trim()
      );

      userService.updateActivity(socket.id);

      io.emit('newMessage', chatMessage);
    });

    // Request handlers
    socket.on('requestRadioState', () => {
      socket.emit('radioUpdate', radioService.getStatus());
    });

    socket.on('requestPlaylist', () => {
      socket.emit('playlistUpdate', { playlist: queueService.getPlaylist() });
    });

    socket.on('requestListenerCount', () => {
      socket.emit('listenerUpdate', { count: radioService.getListenerCount() });
    });

    socket.on('requestOnlineUsers', () => {
      socket.emit('usersUpdate', { users: userService.getOnlineUsers() });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const user = userService.getUserBySocketId(socket.id);

      if (user) {
        socket.broadcast.emit('userTyping', {
          userId: user.id,
          username: user.name,
          isTyping: false
        });
      }

      const disconnectedUser = userService.disconnectUser(socket.id);
      radioService.removeListener(socket.id);

      if (disconnectedUser) {
        io.emit('userOffline', disconnectedUser.getPublicInfo());
        io.emit('usersUpdate', { users: userService.getOnlineUsers() });
      }

      io.emit('listenerUpdate', { count: radioService.getListenerCount() });
    });
  });

  // Set up radio service callback for song end events
  radioService.setOnSongEnd(() => {
    io.emit('radioUpdate', radioService.getStatus());
    io.emit('playlistUpdate', { playlist: queueService.getPlaylist() });
  });
}

module.exports = createSocketHandler;
