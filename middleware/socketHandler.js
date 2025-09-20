function setupSocketHandlers(io, radioController, userController) {
  const radio = radioController.getRadio();

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Send current radio state to new connection
    socket.emit("radioUpdate", radio.getState());
    socket.emit("listenerUpdate", radio.getListenerCount());
    socket.emit(
      "playlistUpdate",
      radio.playlist.map((song) => song.getInfo())
    );

    // Send current online users
    socket.emit("usersUpdate", userController.getOnlineUsers());

    // Send chat history to new connection
    socket.emit("chatHistory", userController.getChatHistory());

    // Handle user authentication/connection
    socket.on("authenticateUser", (data) => {
      const { userId } = data;

      if (!userId) {
        socket.emit("authError", { message: "User ID is required" });
        return;
      }

      const user = userController.connectUser(userId, socket.id);
      if (user) {
        // Add user as radio listener
        radio.addListener(socket.id);

        socket.emit("authSuccess", {
          user: user.getInfo(),
          message: "Successfully connected to chat",
        });

        // Update listener count for all clients
        io.emit("listenerUpdate", radio.getListenerCount());

        console.log(`👤 User authenticated: ${user.name} (${socket.id})`);
      } else {
        socket.emit("authError", { message: "User not found or invalid" });
      }
    });

    // Handle chat messages
    socket.on("sendMessage", (data) => {
      const user = userController.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit("messageError", { message: "User not authenticated" });
        return;
      }

      const { message } = data;
      if (!message || !message.trim()) {
        socket.emit("messageError", { message: "Message cannot be empty" });
        return;
      }

      // Update user activity
      userController.updateUserActivity(socket.id);

      // Create message object
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        username: user.name,
        avatarId: user.avatarId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      // Save message to chat history
      userController.addChatMessage(chatMessage);

      // Broadcast message to all connected clients
      io.emit("newMessage", chatMessage);

      console.log(`💬 Message from ${user.name}: ${message.trim()}`);
    });

    // Handle client events
    socket.on("requestRadioState", () => {
      socket.emit("radioUpdate", radio.getState());
    });

    socket.on("requestPlaylist", () => {
      socket.emit(
        "playlistUpdate",
        radio.playlist.map((song) => song.getInfo())
      );
    });

    socket.on("requestListenerCount", () => {
      socket.emit("listenerUpdate", radio.getListenerCount());
    });

    socket.on("requestOnlineUsers", () => {
      socket.emit("usersUpdate", userController.getOnlineUsers());
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Remove user from radio listeners
      radio.removeListener(socket.id);

      // Disconnect user if authenticated
      const user = userController.disconnectUser(socket.id);

      // Update listener count for all clients
      io.emit("listenerUpdate", radio.getListenerCount());
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Handle Socket.IO server errors
  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  console.log("🔌 Socket.IO handlers configured");
}

module.exports = setupSocketHandlers;
