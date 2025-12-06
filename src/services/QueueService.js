class QueueService {
  constructor(radio) {
    this.radio = radio;
  }

  addSong(song) {
    this.radio.playlist.push(song);
  }

  removeSong(index) {
    if (index < 0 || index >= this.radio.playlist.length) {
      return null;
    }
    const [removed] = this.radio.playlist.splice(index, 1);
    return removed;
  }

  getPlaylist() {
    return this.radio.playlist.map(song => song.getInfo());
  }

  clearPlaylist() {
    this.radio.playlist = [];
  }

  hasNext() {
    return this.radio.playlist.length > 0;
  }

  getNext() {
    if (!this.hasNext()) {
      return null;
    }
    return this.radio.playlist.shift();
  }
}

module.exports = QueueService;
