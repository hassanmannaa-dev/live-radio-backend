const Radio = require('../models/Radio');

class RadioService {
  constructor(streamingService, queueService) {
    this.radio = new Radio();
    this.streamingService = streamingService;
    this.queueService = queueService;
    this.onSongEnd = null;
    this.songEndTimer = null;
  }

  getStatus() {
    return this.radio.getState();
  }

  async playNext() {
    // Clear any existing timer
    if (this.songEndTimer) {
      clearTimeout(this.songEndTimer);
      this.songEndTimer = null;
    }

    const nextSong = this.queueService.getNext();

    if (!nextSong) {
      this.stop();
      return null;
    }

    const stream = await this.streamingService.startStream(nextSong);

    if (stream) {
      this.radio.setCurrentSong(nextSong);
      // Use song duration to determine when song ends, not stream close
      const durationMs = (nextSong.duration || 180) * 1000; // Default 3 min if no duration
      console.log(`Song started: ${nextSong.title}, duration: ${nextSong.duration}s`);

      this.songEndTimer = setTimeout(() => {
        console.log('Song duration ended, isPlaying:', this.radio.isPlaying, 'hasNext:', this.queueService.hasNext());

        // First, handle the next song (removes from queue if exists)
        if (this.radio.isPlaying && this.queueService.hasNext()) {
          this.playNext();
        } else if (!this.queueService.hasNext()) {
          console.log('No next song, stopping');
          this.stop();
        }

        // Then notify listeners (after queue is updated)
        if (this.onSongEnd) {
          this.onSongEnd();
        }
      }, durationMs);
    }

    return nextSong;
  }

  stop() {
    if (this.songEndTimer) {
      clearTimeout(this.songEndTimer);
      this.songEndTimer = null;
    }
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
