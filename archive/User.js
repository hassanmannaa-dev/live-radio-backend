function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createUser(data) {
  return {
    id: data.id || generateId(),
    name: data.name,
    avatarId: data.avatarId,
    socketId: data.socketId,
    joinedAt: data.joinedAt || new Date(),
    isOnline: data.isOnline !== undefined ? data.isOnline : true,
    lastActivity: data.lastActivity || new Date(),
  };
}

function updateSocketId(user, socketId) {
  user.socketId = socketId;
  user.isOnline = true;
  user.lastActivity = new Date();
}

function setOffline(user) {
  user.isOnline = false;
  user.socketId = null;
  user.lastActivity = new Date();
}

function updateActivity(user) {
  user.lastActivity = new Date();
}

function getInfo(user) {
  return {
    id: user.id,
    name: user.name,
    avatarId: user.avatarId,
    isOnline: user.isOnline,
    joinedAt: user.joinedAt,
    lastActivity: user.lastActivity,
  };
}

function getPublicInfo(user) {
  return {
    id: user.id,
    name: user.name,
    avatarId: user.avatarId,
    isOnline: user.isOnline,
  };
}

function isValid(user) {
  return user.name && user.name.trim().length > 0 && user.avatarId;
}

function getAvatarUrl(user) {
  return `https://i.pravatar.cc/150?img=${user.avatarId}`;
}

module.exports = {
  generateId,
  createUser,
  updateSocketId,
  setOffline,
  updateActivity,
  getInfo,
  getPublicInfo,
  isValid,
  getAvatarUrl,
};
