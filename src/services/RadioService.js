const Radio = require('../models/Radio');

class RadioService {
  constructor(streamingService, queueService) {
    this.radio = new Radio();
    this.streamingService = streamingService;
    this.queueService = queueService;
    this.onSongEnd = null;
  }

  getStatus() {
    return this.radio.getState();
  }

  async playNext() {
    const nextSong = this.queueService.getNext();

    if (!nextSong) {
      this.stop();
      return null;
    }

    this.radio.setCurrentSong(nextSong);

    const stream = await this.streamingService.startStream(nextSong);

    if (stream) {
      stream.on('close', () => {
        if (this.radio.isPlaying && this.queueService.hasNext()) {
          this.playNext();
        } else if (!this.queueService.hasNext()) {
          this.stop();
        }
        if (this.onSongEnd) {
          this.onSongEnd();
        }
      });
    }

    return nextSong;
  }

  stop() {
    this.radio.stop();
    this.streamingService.stopStream();
  }

  addListener(id) {
    this.radio.addListener(id);
  }

  removeListener(id) {
    this.radio.removeListener(id);
  }

  getListenerCount() {
    return this.radio.getListenerCount();
  }

  isPlaying() {
    return this.radio.isPlaying;
  }

  getCurrentSong() {
    return this.radio.currentSong;
  }

  setOnSongEnd(callback) {
    this.onSongEnd = callback;
  }
}

module.exports = RadioService;
