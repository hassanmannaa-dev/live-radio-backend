function setupSocketHandlers(io, radioController) {
  const radio = radioController.getRadio();

  io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Send current radio state to new user
    socket.emit("radioUpdate", radio.getState());
    socket.emit("listenerUpdate", radio.getListenerCount());
    socket.emit(
      "playlistUpdate",
      radio.playlist.map((song) => song.getInfo())
    );

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

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`👤 User disconnected: ${socket.id}`);
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
