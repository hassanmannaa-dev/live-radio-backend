const { spawn } = require("child_process");

class StreamingService {
  constructor() {
    this.currentStream = null;
    this.listeners = new Set(); // Track all connected listeners
  }

  // Start streaming a song
  startStream(song) {
    return new Promise((resolve, reject) => {
      // Kill previous stream if exists
      if (this.currentStream) {
        this.currentStream.kill("SIGKILL");
      }

      console.log(`🎵 Starting stream for: ${song.title}`);

      // Start new yt-dlp stream
      const url = song.getYouTubeUrl();
      this.currentStream = spawn("yt-dlp", [
        "-f",
        "bestaudio/best",
        "--no-playlist",
        "-o",
        "-",
        url,
      ]);

      // Handle stream events
      this.currentStream.on("error", (error) => {
        console.error("Stream error:", error);
        reject(error);
      });

      this.currentStream.on("spawn", () => {
        console.log(`🎵 Stream started for: ${song.title}`);
        
        // Start broadcasting to all connected listeners
        this.currentStream.stdout.on('data', (chunk) => {
          // Broadcast to all listeners
          for (const listener of this.listeners) {
            try {
              if (!listener.destroyed && listener.writable) {
                listener.write(chunk);
              } else {
                // Clean up broken connections
                this.removeListener(listener);
              }
            } catch (error) {
              console.error('Error writing to listener:', error);
              this.removeListener(listener);
            }
          }
        });

        this.currentStream.stdout.on('error', (error) => {
          console.error('Stream stdout error:', error);
          // Close all listener connections on stream error
          for (const listener of this.listeners) {
            try {
              if (!listener.destroyed) {
                listener.end();
              }
            } catch (e) {
              console.error('Error closing listener connection:', e);
            }
          }
          this.listeners.clear();
        });

        resolve(this.currentStream);
      });

      this.currentStream.on("close", (code) => {
        console.log(`🎵 Stream ended for: ${song.title} (code: ${code})`);
        this.currentStream = null;
        
        // Clean up all listeners
        for (const listener of this.listeners) {
          try {
            if (!listener.destroyed) {
              listener.end();
            }
          } catch (error) {
            console.error('Error closing listener on stream end:', error);
          }
        }
        this.listeners.clear();
      });
    });
  }

  // Stop current stream
  stopStream() {
    if (this.currentStream) {
      console.log("🛑 Stopping current stream");
      this.currentStream.kill("SIGKILL");
      this.currentStream = null;
    }

    // Close all listener connections
    for (const listener of this.listeners) {
      try {
        if (!listener.destroyed) {
          listener.end();
        }
      } catch (error) {
        console.error('Error closing listener on stop:', error);
      }
    }
    this.listeners.clear();
    console.log("🛑 All listeners disconnected");
  }

  // Get current stream
  getCurrentStream() {
    return this.currentStream;
  }

  // Check if stream is active
  isStreaming() {
    return this.currentStream !== null;
  }

  // Add a listener to the broadcast
  addListener(res) {
    if (!res) return false;

    const listenerId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up error handling for the response stream
    res.on('error', (error) => {
      console.error('Response stream error:', error);
      this.removeListener(res);
    });

    res.on('close', () => {
      console.log('Client disconnected from audio stream');
      this.removeListener(res);
    });

         this.listeners.add(res);
     console.log(`🎧 Added listener to stream broadcast. Total: ${this.listeners.size}`);

     // Note: Data broadcasting is handled in the stream's 'data' event handler
     // No need to pipe here as we're using manual broadcasting for better control

     return true;
  }

  // Remove a listener from the broadcast
  removeListener(res) {
    this.listeners.delete(res);
    console.log(`🎧 Removed listener from stream broadcast. Total: ${this.listeners.size}`);
  }

  // Pipe stream data to response (legacy method for compatibility)
  pipeToResponse(res) {
    return this.addListener(res);
  }
}

module.exports = StreamingService;
