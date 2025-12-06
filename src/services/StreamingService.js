const { spawn } = require('child_process');

class StreamingService {
  constructor() {
    this.currentStream = null;
    this.streamListeners = new Set();
  }

  async startStream(song) {
    this.stopStream();

    const youtubeUrl = song.getYouTubeUrl();

    const args = [
      '-f', 'bestaudio/best',
      '--no-playlist',
      '-o', '-',
      '--no-warnings',
      youtubeUrl
    ];

    this.currentStream = spawn('yt-dlp', args);

    this.currentStream.on('error', (error) => {
      console.error('Stream error:', error.message);
      this.currentStream = null;
    });

    this.currentStream.on('close', () => {
      this.currentStream = null;
    });

    return this.currentStream;
  }

  stopStream() {
    if (this.currentStream) {
      this.currentStream.kill('SIGTERM');
      this.currentStream = null;
    }
  }

  isStreaming() {
    return this.currentStream !== null && !this.currentStream.killed;
  }

  pipeToResponse(res) {
    if (!this.currentStream || !this.currentStream.stdout) {
      return false;
    }

    this.currentStream.stdout.pipe(res);
    return true;
  }

  getCurrentStream() {
    return this.currentStream;
  }

  addListener(id) {
    this.streamListeners.add(id);
  }

  removeListener(id) {
    this.streamListeners.delete(id);
  }

  getListenerCount() {
    return this.streamListeners.size;
  }
}

module.exports = StreamingService;
