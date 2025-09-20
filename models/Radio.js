class Radio {
  constructor() {
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null;
    this.currentTime = 0;
    this.playlist = [];
    this.listeners = new Set();
  }

  // Get current playback position
  getCurrentPosition() {
    return this.isPlaying && this.startTime ? Date.now() - this.startTime : 0;
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

  // Get current radio state
  getState() {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      startTime: this.startTime,
      currentPosition: this.getCurrentPosition(),
      playlist: this.playlist,
      listeners: this.getListenerCount(),
    };
  }

  // Check if playlist is empty
  hasNextSong() {
    return this.playlist.length > 0;
  }
}

module.exports = Radio;
