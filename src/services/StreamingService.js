const { spawn } = require('child_process');

class StreamingService {
  constructor() {
    this.ytdlpProcess = null;
    this.ffmpegProcess = null;
    this.audioBuffer = [];        // Store audio chunks
    this.activeResponses = new Set(); // Track connected clients
    this.isBuffering = false;
    this.streamListeners = new Set();
    this.songStartTime = null;    // When the song started playing
    this.bitrate = 128000;        // 128kbps in bits per second
  }

  async startStream(song) {
    this.stopStream();

    const youtubeUrl = song.getYouTubeUrl();

    // Reset buffer for new song
    this.audioBuffer = [];
    this.isBuffering = true;
    this.songStartTime = Date.now();

    // yt-dlp outputs raw audio to stdout
    const ytdlpArgs = [
      '-f', 'bestaudio/best',
      '--no-playlist',
      '-o', '-',
      '--no-warnings',
      youtubeUrl
    ];

    // ffmpeg converts to mp3 for browser compatibility
    const ffmpegArgs = [
      '-i', 'pipe:0',        // Read from stdin
      '-f', 'mp3',           // Output format
      '-acodec', 'libmp3lame',
      '-ab', '128k',         // Bitrate
      '-ar', '44100',        // Sample rate
      'pipe:1'               // Output to stdout
    ];

    this.ytdlpProcess = spawn('yt-dlp', ytdlpArgs);
    this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    // Pipe yt-dlp output to ffmpeg input
    this.ytdlpProcess.stdout.pipe(this.ffmpegProcess.stdin);

    // Buffer the audio data and broadcast to all connected clients
    this.ffmpegProcess.stdout.on('data', (chunk) => {
      // Store chunk in buffer
      this.audioBuffer.push(chunk);

      // Send to all connected clients
      for (const res of this.activeResponses) {
        if (!res.writableEnded) {
          res.write(chunk);
        }
      }
    });

    this.ytdlpProcess.on('error', (error) => {
      console.error('yt-dlp error:', error.message);
    });

    this.ytdlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    this.ffmpegProcess.on('error', (error) => {
      console.error('ffmpeg error:', error.message);
    });

    this.ffmpegProcess.stderr.on('data', (data) => {
      // ffmpeg outputs progress to stderr, uncomment to debug
      // console.error('ffmpeg stderr:', data.toString());
    });

    this.ytdlpProcess.on('close', (code) => {
      console.log('yt-dlp closed with code:', code);
    });

    this.ffmpegProcess.on('close', (code) => {
      console.log('ffmpeg closed with code:', code);
      this.isBuffering = false;
      this.ytdlpProcess = null;
      this.ffmpegProcess = null;
    });

    // Return ffmpeg process so we can pipe its stdout to responses
    return this.ffmpegProcess;
  }

  stopStream() {
    if (this.ytdlpProcess) {
      this.ytdlpProcess.kill('SIGTERM');
      this.ytdlpProcess = null;
    }
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
    // Clear buffer and close all active responses
    this.audioBuffer = [];
    this.isBuffering = false;
    this.songStartTime = null;
    for (const res of this.activeResponses) {
      if (!res.writableEnded) {
        res.end();
      }
    }
    this.activeResponses.clear();
  }

  isStreaming() {
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }

  pipeToResponse(res) {
    // Check if we have audio to serve (either buffering or have buffered data)
    if (!this.isBuffering && this.audioBuffer.length === 0) {
      return false;
    }

    // Calculate current playback position for sync
    const elapsedMs = Date.now() - this.songStartTime;
    const elapsedSeconds = elapsedMs / 1000;
    const bytesPerSecond = this.bitrate / 8; // 128kbps = 16000 bytes/sec
    const targetBytePosition = Math.floor(elapsedSeconds * bytesPerSecond);

    // Find the position in buffer to start from
    let currentBytePosition = 0;
    let startChunkIndex = 0;
    let startByteOffset = 0;

    for (let i = 0; i < this.audioBuffer.length; i++) {
      const chunkSize = this.audioBuffer[i].length;
      if (currentBytePosition + chunkSize > targetBytePosition) {
        startChunkIndex = i;
        startByteOffset = targetBytePosition - currentBytePosition;
        break;
      }
      currentBytePosition += chunkSize;
      startChunkIndex = i + 1;
    }

    // Send buffered audio from current position (for sync)
    for (let i = startChunkIndex; i < this.audioBuffer.length; i++) {
      if (!res.writableEnded) {
        if (i === startChunkIndex && startByteOffset > 0) {
          // First chunk: start from offset
          res.write(this.audioBuffer[i].slice(startByteOffset));
        } else {
          res.write(this.audioBuffer[i]);
        }
      }
    }

    // Add this response to active responses for future chunks
    this.activeResponses.add(res);

    // Remove from active responses when client disconnects
    res.on('close', () => {
      this.activeResponses.delete(res);
    });

    return true;
  }

  getCurrentStream() {
    return this.ffmpegProcess;
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
