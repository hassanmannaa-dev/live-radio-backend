class Song {
  constructor({ id, title, artist, album = null, duration, thumbnail, url }) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.url = url;
  }

  static fromYouTubeData(ytdlpOutput) {
    return new Song({
      id: ytdlpOutput.id,
      title: ytdlpOutput.title || 'Unknown Title',
      artist: ytdlpOutput.artist || ytdlpOutput.uploader || ytdlpOutput.channel || 'Unknown Artist',
      album: ytdlpOutput.album || null,
      duration: ytdlpOutput.duration || 0,
      thumbnail: ytdlpOutput.thumbnail || ytdlpOutput.thumbnails?.[0]?.url || '',
      url: ytdlpOutput.url || ytdlpOutput.webpage_url || ''
    });
  }

  isValid() {
    return (
      typeof this.id === 'string' &&
      this.id.length > 0 &&
      typeof this.title === 'string' &&
      this.title.length > 0 &&
      typeof this.duration === 'number' &&
      this.duration >= 0
    );
  }

  getYouTubeUrl() {
    return `https://www.youtube.com/watch?v=${this.id}`;
  }

  getInfo() {
    return {
      id: this.id,
      title: this.title,
      artist: this.artist,
      album: this.album,
      duration: this.duration,
      thumbnail: this.thumbnail,
      url: this.url
    };
  }
}

module.exports = Song;
