const User = require('../models/User');

class UserService {
  constructor() {
    this.users = new Map();
    this.socketToUser = new Map();
  }

  registerUser(name, avatarId) {
    const user = User.create(name, avatarId);
    this.users.set(user.id, user);
    return user;
  }

  connectUser(userId, socketId) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    user.socketId = socketId;
    user.isOnline = true;
    user.lastActivity = new Date();
    this.socketToUser.set(socketId, userId);

    return user;
  }

  disconnectUser(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return null;
    }

    const user = this.users.get(userId);
    if (user) {
      user.socketId = null;
      user.isOnline = false;
      user.lastActivity = new Date();
    }

    this.socketToUser.delete(socketId);
    return user;
  }

  getUserById(userId) {
    return this.users.get(userId) || null;
  }

  getUserBySocketId(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return null;
    }
    return this.users.get(userId) || null;
  }

  getOnlineUsers() {
    return Array.from(this.users.values())
      .filter(user => user.isOnline)
      .map(user => user.getPublicInfo());
  }

  isNameTaken(name) {
    const normalizedName = name.toLowerCase().trim();
    return Array.from(this.users.values())
      .some(user => user.name.toLowerCase().trim() === normalizedName);
  }

  updateActivity(socketId) {
    const user = this.getUserBySocketId(socketId);
    if (user) {
      user.lastActivity = new Date();
    }
  }

  cleanupInactive(maxHours = 24) {
    const cutoff = Date.now() - (maxHours * 60 * 60 * 1000);
    const toDelete = [];

    for (const [userId, user] of this.users) {
      if (!user.isOnline && user.lastActivity.getTime() < cutoff) {
        toDelete.push(userId);
      }
    }

    for (const userId of toDelete) {
      this.users.delete(userId);
    }

    return toDelete.length;
  }
}

module.exports = UserService;
