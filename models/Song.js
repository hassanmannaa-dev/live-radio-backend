class Song {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.artist = data.artist || data.uploader;
    this.album = data.album;
    this.duration = data.duration;
    this.thumbnail = data.thumbnail;
    this.url = data.original_url || data.url;
    this.playlist = data.playlist;
  }

  // Create a Song instance from YouTube metadata
  static fromYouTubeData(data) {
    return new Song({
      id: data.id,
      title: data.title,
      artist: data.artist || data.uploader,
      album: data.album,
      duration: data.duration,
      thumbnail: data.thumbnail,
      url: data.original_url,
      playlist: data.playlist,
    });
  }

  // Get song info for API responses
  getInfo() {
    return {
      id: this.id,
      title: this.title,
      artist: this.artist,
      album: this.album,
      duration: this.duration,
      thumbnail: this.thumbnail,
      url: this.url,
      playlist: this.playlist,
    };
  }

  // Get YouTube URL for this song
  getYouTubeUrl() {
    return `https://music.youtube.com/watch?v=${this.id}`;
  }

  // Validate required fields
  isValid() {
    return this.id && this.title;
  }
}

module.exports = Song;
