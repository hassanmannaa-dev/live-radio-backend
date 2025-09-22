function fromYouTubeData(data) {
  return {
    id: data.id,
    title: data.title,
    artist: data.artist || data.uploader,
    album: data.album,
    duration: data.duration,
    thumbnail: data.thumbnail,
    url: data.original_url,
    playlist: data.playlist,
  };
}

function getInfo(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    thumbnail: song.thumbnail,
    url: song.url,
    playlist: song.playlist,
  };
}

function getYouTubeUrl(song) {
  return `https://music.youtube.com/watch?v=${song.id}`;
}

function isValid(song) {
  return song.id && song.title;
}

module.exports = {
  fromYouTubeData,
  getInfo,
  getYouTubeUrl,
  isValid,
};
