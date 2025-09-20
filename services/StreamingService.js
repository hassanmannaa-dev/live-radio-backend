const { spawn } = require("child_process");

class StreamingService {
  constructor() {
    this.currentStream = null;
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
        console.log(`Stream started for: ${song.title}`);
        resolve(this.currentStream);
      });

      this.currentStream.on("close", (code) => {
        console.log(`Stream ended for: ${song.title} (code: ${code})`);
        this.currentStream = null;
      });
    });
  }

  // Stop current stream
  stopStream() {
    if (this.currentStream) {
      console.log("Stopping current stream");
      this.currentStream.kill("SIGKILL");
      this.currentStream = null;
    }
  }

  // Get current stream
  getCurrentStream() {
    return this.currentStream;
  }

  // Check if stream is active
  isStreaming() {
    return this.currentStream !== null;
  }

  // Pipe stream data to response
  pipeToResponse(res) {
    if (this.currentStream && this.currentStream.stdout) {
      this.currentStream.stdout.pipe(res, { end: false });
      return true;
    }
    return false;
  }
}

module.exports = StreamingService;
