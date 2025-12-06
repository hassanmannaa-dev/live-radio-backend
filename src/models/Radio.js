class Radio {
  constructor() {
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null;
    this.playlist = [];
    this.listeners = new Set();
  }

  getCurrentPosition() {
    if (!this.isPlaying || !this.startTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getState() {
    return {
      currentSong: this.currentSong ? this.currentSong.getInfo() : null,
      isPlaying: this.isPlaying,
      startTime: this.startTime,
      position: this.getCurrentPosition(),
      listenerCount: this.getListenerCount()
    };
  }

  getListenerCount() {
    return this.listeners.size;
  }

  addListener(id) {
    this.listeners.add(id);
  }

  removeListener(id) {
    this.listeners.delete(id);
  }

  setCurrentSong(song) {
    this.currentSong = song;
    this.isPlaying = true;
    this.startTime = Date.now();
  }

  stop() {
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null;
  }
}

module.exports = Radio;
