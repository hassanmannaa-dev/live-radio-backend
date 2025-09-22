function createRadio() {
  return {
    currentSong: null,
    isPlaying: false,
    startTime: null,
    currentTime: 0,
    playlist: [],
    listeners: new Set(),
    progressInterval: null,
  };
}

function getCurrentPosition(radio) {
  if (!radio.isPlaying || !radio.startTime || !radio.currentSong) {
    return 0;
  }
  return Math.floor((Date.now() - radio.startTime) / 1000);
}

function getProgressPercentage(radio) {
  if (!radio.currentSong || !radio.currentSong.duration) {
    return 0;
  }
  const position = getCurrentPosition(radio);
  return Math.min((position / radio.currentSong.duration) * 100, 100);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getFormattedCurrentTime(radio) {
  return formatTime(getCurrentPosition(radio));
}

function getFormattedDuration(radio) {
  return formatTime(radio.currentSong?.duration || 0);
}

function hasSongFinished(radio) {
  if (!radio.currentSong || !radio.currentSong.duration) {
    return false;
  }
  return getCurrentPosition(radio) >= radio.currentSong.duration;
}

function addToPlaylist(radio, song) {
  radio.playlist.push(song);
}

function getNextSong(radio) {
  return radio.playlist.shift();
}

function setCurrentSong(radio, song) {
  radio.currentSong = song;
  radio.isPlaying = true;
  radio.startTime = Date.now();
}

function stop(radio) {
  radio.isPlaying = false;
  radio.currentSong = null;
  radio.startTime = null;
  if (radio.progressInterval) {
    clearInterval(radio.progressInterval);
    radio.progressInterval = null;
  }
}

function startProgressTracking(radio, io) {
  if (radio.progressInterval) {
    clearInterval(radio.progressInterval);
  }

  radio.progressInterval = setInterval(() => {
    if (radio.isPlaying && radio.currentSong) {
      if (hasSongFinished(radio)) {
        return;
      }

      const progressData = {
        currentPosition: getCurrentPosition(radio),
        duration: radio.currentSong.duration || 0,
        progress: getProgressPercentage(radio),
        formattedCurrentTime: getFormattedCurrentTime(radio),
        formattedDuration: getFormattedDuration(radio),
        isPlaying: radio.isPlaying,
        currentSong: radio.currentSong ? radio.currentSong.getInfo() : null,
      };

      io.emit("progressUpdate", progressData);
    }
  }, 1000);
}

function stopProgressTracking(radio) {
  if (radio.progressInterval) {
    clearInterval(radio.progressInterval);
    radio.progressInterval = null;
  }
}

function addListener(radio, listenerId) {
  radio.listeners.add(listenerId);
}

function removeListener(radio, listenerId) {
  radio.listeners.delete(listenerId);
}

function getListenerCount(radio) {
  return radio.listeners.size;
}

function getState(radio) {
  const state = {
    currentSong: radio.currentSong ? radio.currentSong.getInfo() : null,
    isPlaying: radio.isPlaying,
    startTime: radio.startTime,
    currentPosition: getCurrentPosition(radio),
    progress: getProgressPercentage(radio),
    formattedCurrentTime: getFormattedCurrentTime(radio),
    formattedDuration: getFormattedDuration(radio),
    playlist: radio.playlist.map(song => song.getInfo()),
    listeners: getListenerCount(radio),
  };

  return state;
}

function hasNextSong(radio) {
  return radio.playlist.length > 0;
}

module.exports = {
  createRadio,
  getCurrentPosition,
  getProgressPercentage,
  formatTime,
  getFormattedCurrentTime,
  getFormattedDuration,
  hasSongFinished,
  addToPlaylist,
  getNextSong,
  setCurrentSong,
  stop,
  startProgressTracking,
  stopProgressTracking,
  addListener,
  removeListener,
  getListenerCount,
  getState,
  hasNextSong,
};
