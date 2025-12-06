const { spawn } = require('child_process');

class StreamingService {
  constructor() {
    this.ytdlpProcess = null;
    this.ffmpegProcess = null;
    this.streamListeners = new Set();
  }

  async startStream(song) {
    this.stopStream();

    const youtubeUrl = song.getYouTubeUrl();

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
  }

  isStreaming() {
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }

  pipeToResponse(res) {
    if (!this.ffmpegProcess || !this.ffmpegProcess.stdout) {
      return false;
    }

    this.ffmpegProcess.stdout.pipe(res);
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
