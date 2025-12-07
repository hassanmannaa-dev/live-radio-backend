class RadioCoordinator {
  constructor(io) {
    this.io = io;
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null; // Precise start timestamp
    this.listeners = new Set();
  }

  addListener(socketId) {
    this.listeners.add(socketId);
    this.broadcastListenerCount();
  }

  removeListener(socketId) {
    this.listeners.delete(socketId);
    this.broadcastListenerCount();
  }

  async startSong(song) {
    const startTime = Date.now() + 3000; // 3 second lead time

    this.currentSong = song;
    this.isPlaying = true;
    this.startTime = startTime;

    // Broadcast the coordinated start
    this.io.emit('radioUpdate', {
      currentSong: this.currentSong,
      isPlaying: true,
      startTime: this.startTime,
      position: 0,
      listenerCount: this.listeners.size
    });

    // Schedule the end
    setTimeout(() => {
      this.endSong();
    }, song.duration * 1000);
  }

  endSong() {
    this.currentSong = null;
    this.isPlaying = false;
    this.startTime = null;

    this.io.emit('radioUpdate', {
      currentSong: null,
      isPlaying: false,
      startTime: null,
      position: 0,
      listenerCount: this.listeners.size
    });
  }

  getCurrentState() {
    let position = 0;
    if (this.isPlaying && this.startTime && this.currentSong) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      position = Math.min(elapsed, this.currentSong.duration);
    }

    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      startTime: this.startTime,
      position: position,
      listenerCount: this.listeners.size
    };
  }

  broadcastListenerCount() {
    this.io.emit('listenerUpdate', {
      count: this.listeners.size
    });
  }
}

module.exports = RadioCoordinator;
