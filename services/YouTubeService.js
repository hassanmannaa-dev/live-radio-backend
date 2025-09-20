const { exec } = require("child_process");
const Song = require("../models/Song");

class YouTubeService {
  // Search for a song on YouTube Music
  static async searchSong(songTitle) {
    console.log(
      `Searching for song: ${songTitle} using url: https://music.youtube.com/search?q=${songTitle}`
    );

    return new Promise((resolve, reject) => {
      const command = `yt-dlp -j "https://music.youtube.com/search?q=${songTitle}" --playlist-items 1`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("YouTube search error:", error);
          return reject(error);
        }

        try {
          // -j outputs JSON metadata for the first result
          const info = JSON.parse(stdout);
          const song = Song.fromYouTubeData(info);
          resolve(song);
        } catch (err) {
          console.error("Error parsing YouTube data:", err);
          reject(err);
        }
      });
    });
  }

  // Get song info without playing
  static async getSongInfo(id) {
    return new Promise((resolve, reject) => {
      const url = `https://music.youtube.com/watch?v=${id}`;
      const command = `yt-dlp -j "${url}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("YouTube info error:", error);
          return reject(error);
        }

        try {
          const info = JSON.parse(stdout);
          const song = new Song({
            id: info.id,
            title: info.title,
            artist: info.artist || info.uploader,
            duration: info.duration,
            thumbnail: info.thumbnail,
          });
          resolve(song);
        } catch (err) {
          console.error("Error parsing song info:", err);
          reject(err);
        }
      });
    });
  }

  // Validate YouTube URL
  static isValidYouTubeUrl(url) {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/.+/;
    return youtubeRegex.test(url);
  }

  // Extract video ID from YouTube URL
  static extractVideoId(url) {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/
    );
    return match ? match[1] : null;
  }
}

module.exports = YouTubeService;
