const Radio = require("../models/Radio");
const StreamingService = require("../services/StreamingService");
const YouTubeService = require("../services/YouTubeService");

class RadioController {
  constructor(io) {
    this.radio = new Radio();
    this.streamingService = new StreamingService();
    this.io = io;
  }

  // Get current radio status
  getStatus = (req, res) => {
    try {
      const status = this.radio.getState();
      res.json(status);
    } catch (error) {
      console.error("Error getting radio status:", error);
      res.status(500).json({ error: "Failed to get radio status" });
    }
  };

  // Handle radio stream requests
  getStream = (req, res) => {
    try {
      console.log("New listener joined the radio stream");

      // Set headers for audio streaming
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Accept-Ranges", "none");

      // Add this connection to listeners
      const listenerId = Date.now() + Math.random();
      this.radio.addListener(listenerId);

      // If there's an active stream, pipe it to this response
      if (this.streamingService.isStreaming()) {
        this.streamingService.pipeToResponse(res);
      } else {
        // No active stream, keep connection alive
        res.write("");
      }

      // Clean up when client disconnects
      res.on("close", () => {
        console.log("Listener disconnected from radio stream");
        this.radio.removeListener(listenerId);
        this.io.emit("listenerUpdate", this.radio.getListenerCount());
      });

      // Update listener count
      this.io.emit("listenerUpdate", this.radio.getListenerCount());
    } catch (error) {
      console.error("Error handling stream request:", error);
      res.status(500).json({ error: "Failed to start stream" });
    }
  };

  // Play the next song in queue
  async playNextSong() {
    try {
      if (!this.radio.hasNextSong()) {
        this.radio.stop();
        this.io.emit("radioUpdate", this.radio.getState());
        this.io.emit("currentSongUpdate", null);
        return;
      }

      const nextSong = this.radio.getNextSong();
      this.radio.setCurrentSong(nextSong);

      console.log(`🎵 Now playing: ${nextSong.title} - ${nextSong.artist}`);

      // Start streaming the song
      try {
        await this.streamingService.startStream(nextSong);

        // Start progress tracking for synchronized playback
        this.radio.startProgressTracking(this.io);

        // Set up stream event handlers
        const currentStream = this.streamingService.getCurrentStream();
        if (currentStream) {
          currentStream.on("close", (code) => {
            console.log(`Song ended: ${nextSong.title}`);
            
            // Stop progress tracking
            this.radio.stopProgressTracking();
            
            // Song finished, play next one after a small gap
            setTimeout(() => {
              this.playNextSong();
            }, 1000);
          });

          currentStream.on("error", (error) => {
            console.error("Stream error:", error);
            
            // Stop progress tracking
            this.radio.stopProgressTracking();
            
            // Try next song on error
            setTimeout(() => {
              this.playNextSong();
            }, 2000);
          });
        }

        // Notify all clients about current song and radio state
        this.io.emit("radioUpdate", this.radio.getState());
        this.io.emit("currentSongUpdate", nextSong.getInfo());
        
        console.log(`🎵 Started progress tracking for: ${nextSong.title}`);
      } catch (streamError) {
        console.error("Failed to start stream:", streamError);
        // Try next song if stream fails
        setTimeout(() => {
          this.playNextSong();
        }, 2000);
      }
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  }

  // Stop radio playback
  stop = () => {
    try {
      this.streamingService.stopStream();
      this.radio.stopProgressTracking();
      this.radio.stop();
      this.io.emit("radioUpdate", this.radio.getState());
      this.io.emit("currentSongUpdate", null);
      console.log("🛑 Radio stopped and progress tracking cleared");
    } catch (error) {
      console.error("Error stopping radio:", error);
    }
  };

  // Get radio instance (for other controllers)
  getRadio() {
    return this.radio;
  }
}

module.exports = RadioController;
