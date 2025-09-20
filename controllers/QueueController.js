const YouTubeService = require("../services/YouTubeService");

class QueueController {
  constructor(radioController, io) {
    this.radioController = radioController;
    this.radio = radioController.getRadio();
    this.io = io;
  }

  // Add song to radio queue
  addToQueue = async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Song ID is required" });
      }

      // Get song info from YouTube
      const songInfo = await YouTubeService.getSongInfo(id);

      if (!songInfo.isValid()) {
        return res.status(400).json({ error: "Invalid song data" });
      }

      // Add to playlist
      this.radio.addToPlaylist(songInfo);

      // If nothing is playing, start this song
      if (!this.radio.isPlaying) {
        this.radioController.playNextSong();
      }

      // Notify all clients about playlist update
      this.io.emit("playlistUpdate", this.radio.playlist);

      res.json({
        message: "Song added to queue",
        song: songInfo.getInfo(),
        position: this.radio.playlist.length + 1,
      });
    } catch (error) {
      console.error("Queue error:", error);
      res.status(500).json({
        error: "Failed to add song to queue",
        message: error.message,
      });
    }
  };

  // Remove song from queue
  removeFromQueue = (req, res) => {
    try {
      const { index } = req.params;
      const queueIndex = parseInt(index);

      if (
        isNaN(queueIndex) ||
        queueIndex < 0 ||
        queueIndex >= this.radio.playlist.length
      ) {
        return res.status(400).json({ error: "Invalid queue index" });
      }

      const removedSong = this.radio.playlist.splice(queueIndex, 1)[0];

      // Notify all clients about playlist update
      this.io.emit("playlistUpdate", this.radio.playlist);

      res.json({
        message: "Song removed from queue",
        removedSong: removedSong.getInfo(),
        newQueueLength: this.radio.playlist.length,
      });
    } catch (error) {
      console.error("Error removing from queue:", error);
      res.status(500).json({ error: "Failed to remove song from queue" });
    }
  };

  // Get current playlist
  getPlaylist = (req, res) => {
    try {
      const playlist = this.radio.playlist.map((song) => song.getInfo());
      res.json({
        playlist,
        length: playlist.length,
        currentSong: this.radio.currentSong
          ? this.radio.currentSong.getInfo()
          : null,
      });
    } catch (error) {
      console.error("Error getting playlist:", error);
      res.status(500).json({ error: "Failed to get playlist" });
    }
  };

  // Clear the entire playlist
  clearPlaylist = (req, res) => {
    try {
      this.radio.playlist = [];

      // Notify all clients about playlist update
      this.io.emit("playlistUpdate", this.radio.playlist);

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

module.exports = QueueController;
