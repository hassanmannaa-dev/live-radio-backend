const SongService = require("../services/SongService");
const Radio = require("../models/Radio");

// State management functions
function createQueueControllerState(io) {
  const radio = Radio.createRadio();
  return {
    radio,
    io,
  };
}

// Add song to radio queue
function addToQueue(state) {
  return async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Song ID is required" });
      }

      // Get song info from YouTube
      const songInfo = await SongService.getSongInfo(id);

      if (!songInfo.isValid()) {
        return res.status(400).json({ error: "Invalid song data" });
      }

      // Add to playlist
      Radio.addToPlaylist(state.radio, songInfo);

      // If nothing is playing, start this song
      if (!state.radio.isPlaying) {
        playNextSong(state);
      }

      // Notify all clients about playlist update
      state.io.emit("playlistUpdate", state.radio.playlist);

      res.json({
        message: "Song added to queue",
        song: songInfo.getInfo(),
        position: state.radio.playlist.length + 1,
      });
    } catch (error) {
      console.error("Queue error:", error);
      res.status(500).json({
        error: "Failed to add song to queue",
        message: error.message,
      });
    }
  };
}

// Remove song from queue
function removeFromQueue(state) {
  return (req, res) => {
    try {
      const { index } = req.params;
      const queueIndex = parseInt(index);

      if (
        isNaN(queueIndex) ||
        queueIndex < 0 ||
        queueIndex >= state.radio.playlist.length
      ) {
        return res.status(400).json({ error: "Invalid queue index" });
      }

      const removedSong = state.radio.playlist.splice(queueIndex, 1)[0];

      // Notify all clients about playlist update
      state.io.emit("playlistUpdate", state.radio.playlist);

      res.json({
        message: "Song removed from queue",
        removedSong: removedSong.getInfo(),
        newQueueLength: state.radio.playlist.length,
      });
    } catch (error) {
      console.error("Error removing from queue:", error);
      res.status(500).json({ error: "Failed to remove song from queue" });
    }
  };
}

// Get current playlist
function getPlaylist(state) {
  return (req, res) => {
    try {
      const playlist = state.radio.playlist.map((song) => song.getInfo());
      res.json({
        playlist,
        length: playlist.length,
        currentSong: state.radio.currentSong
          ? state.radio.currentSong.getInfo()
          : null,
      });
    } catch (error) {
      console.error("Error getting playlist:", error);
      res.status(500).json({ error: "Failed to get playlist" });
    }
  };
}

// Clear the entire playlist
function clearPlaylist(state) {
  return (req, res) => {
    try {
      state.radio.playlist = [];

      // Notify all clients about playlist update
      state.io.emit("playlistUpdate", state.radio.playlist);

      res.json({
        message: "Playlist cleared",
        playlist: [],
      });
    } catch (error) {
      console.error("Error clearing playlist:", error);
      res.status(500).json({ error: "Failed to clear playlist" });
    }
  };
}

// Play the next song in the queue
function playNextSong(state) {
  const nextSong = Radio.getNextSong(state.radio);
  if (nextSong) {
    Radio.setCurrentSong(state.radio, nextSong);
    Radio.startProgressTracking(state.radio, state.io);

    state.io.emit("nowPlaying", {
      song: nextSong.getInfo(),
      startTime: state.radio.startTime,
    });

    // Set up auto-advance when song ends
    const duration = nextSong.duration * 1000;
    setTimeout(() => {
      if (Radio.hasSongFinished(state.radio)) {
        if (Radio.hasNextSong(state.radio)) {
          playNextSong(state);
        } else {
          Radio.stop(state.radio);
          state.io.emit("radioStopped");
        }
      }
    }, duration + 1000);
  }
}

// Create a functional queue controller
function createQueueController(io) {
  const state = createQueueControllerState(io);

  return {
    // State access
    state,

    // API endpoints
    addToQueue: addToQueue(state),
    removeFromQueue: removeFromQueue(state),
    getPlaylist: getPlaylist(state),
    clearPlaylist: clearPlaylist(state),
  };
}

module.exports = {
  createQueueController,
  // Export individual functions for testing or advanced usage
  createQueueControllerState,
  addToQueue,
  removeFromQueue,
  getPlaylist,
  clearPlaylist,
  playNextSong,
};
