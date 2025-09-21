class Radio {
  constructor() {
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null;
    this.currentTime = 0;
    this.playlist = [];
    this.listeners = new Set();
    this.progressInterval = null; // For tracking progress updates
  }

  // Get current playback position in seconds
  getCurrentPosition() {
    if (!this.isPlaying || !this.startTime || !this.currentSong) {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Get progress percentage (0-100)
  getProgressPercentage() {
    if (!this.currentSong || !this.currentSong.duration) {
      return 0;
    }
    const position = this.getCurrentPosition();
    return Math.min((position / this.currentSong.duration) * 100, 100);
  }

  // Format time in MM:SS format
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Get formatted current position
  getFormattedCurrentTime() {
    return this.formatTime(this.getCurrentPosition());
  }

  // Get formatted duration
  getFormattedDuration() {
    return this.formatTime(this.currentSong?.duration || 0);
  }

  // Check if current song has finished
  hasSongFinished() {
    if (!this.currentSong || !this.currentSong.duration) {
      return false;
    }
    return this.getCurrentPosition() >= this.currentSong.duration;
  }

  // Add a song to the playlist
  addToPlaylist(song) {
    this.playlist.push(song);
  }

  // Get the next song in queue
  getNextSong() {
    return this.playlist.shift();
  }

  // Set the currently playing song
  setCurrentSong(song) {
    this.currentSong = song;
    this.isPlaying = true;
    this.startTime = Date.now();
  }

  // Stop playback
  stop() {
    this.isPlaying = false;
    this.currentSong = null;
    this.startTime = null;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Start progress tracking
  startProgressTracking(io) {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = setInterval(() => {
      if (this.isPlaying && this.currentSong) {
        // Check if song has finished
        if (this.hasSongFinished()) {
          return; // Let the stream handler manage song transitions
        }

        // Emit progress update to all clients
        const progressData = {
          currentPosition: this.getCurrentPosition(),
          duration: this.currentSong.duration || 0,
          progress: this.getProgressPercentage(),
          formattedCurrentTime: this.getFormattedCurrentTime(),
          formattedDuration: this.getFormattedDuration(),
          isPlaying: this.isPlaying,
          currentSong: this.currentSong ? this.currentSong.getInfo() : null,
        };

        io.emit("progressUpdate", progressData);
      }
    }, 1000); // Update every second
  }

  // Stop progress tracking
  stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Add a listener
  addListener(listenerId) {
    this.listeners.add(listenerId);
  }

  // Remove a listener
  removeListener(listenerId) {
    this.listeners.delete(listenerId);
  }

  // Get listener count
  getListenerCount() {
    return this.listeners.size;
  }

  // Get current radio state with progress information
  getState() {
    const state = {
      currentSong: this.currentSong ? this.currentSong.getInfo() : null,
      isPlaying: this.isPlaying,
      startTime: this.startTime,
      currentPosition: this.getCurrentPosition(),
      progress: this.getProgressPercentage(),
      formattedCurrentTime: this.getFormattedCurrentTime(),
      formattedDuration: this.getFormattedDuration(),
      playlist: this.playlist.map(song => song.getInfo()),
      listeners: this.getListenerCount(),
    };
    
    return state;
  }

  // Check if playlist is empty
  hasNextSong() {
    return this.playlist.length > 0;
  }
}

module.exports = Radio;
