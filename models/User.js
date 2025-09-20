class User {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.avatarId = data.avatarId;
    this.socketId = data.socketId;
    this.joinedAt = data.joinedAt || new Date();
    this.isOnline = data.isOnline !== undefined ? data.isOnline : true;
    this.lastActivity = data.lastActivity || new Date();
  }

  // Generate a unique user ID
  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update socket ID when user reconnects
  updateSocketId(socketId) {
    this.socketId = socketId;
    this.isOnline = true;
    this.lastActivity = new Date();
  }

  // Mark user as offline
  setOffline() {
    this.isOnline = false;
    this.socketId = null;
    this.lastActivity = new Date();
  }

  // Update last activity timestamp
  updateActivity() {
    this.lastActivity = new Date();
  }

  // Get user info for API responses (excluding sensitive data)
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      avatarId: this.avatarId,
      isOnline: this.isOnline,
      joinedAt: this.joinedAt,
      lastActivity: this.lastActivity,
    };
  }

  // Get user info for client-side display
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      avatarId: this.avatarId,
      isOnline: this.isOnline,
    };
  }

  // Validate required fields
  isValid() {
    return this.name && this.name.trim().length > 0 && this.avatarId;
  }

  // Get avatar URL based on avatarId
  getAvatarUrl() {
    return `https://i.pravatar.cc/150?img=${this.avatarId}`;
  }
}

module.exports = User;
