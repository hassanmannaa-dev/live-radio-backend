class User {
  constructor({ id, name, avatarId, socketId = null, isOnline = false, joinedAt = new Date(), lastActivity = new Date() }) {
    this.id = id;
    this.name = name;
    this.avatarId = avatarId;
    this.socketId = socketId;
    this.isOnline = isOnline;
    this.joinedAt = joinedAt;
    this.lastActivity = lastActivity;
  }

  static generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${random}`;
  }

  static create(name, avatarId) {
    return new User({
      id: User.generateId(),
      name,
      avatarId: Number(avatarId),
      socketId: null,
      isOnline: false,
      joinedAt: new Date(),
      lastActivity: new Date()
    });
  }

  isValid() {
    return (
      typeof this.id === 'string' &&
      this.id.startsWith('user_') &&
      typeof this.name === 'string' &&
      this.name.trim().length > 0 &&
      typeof this.avatarId === 'number' &&
      this.avatarId >= 0
    );
  }

  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      avatarId: this.avatarId,
      isOnline: this.isOnline
    };
  }

  getAvatarUrl() {
    return `https://i.pravatar.cc/150?img=${this.avatarId}`;
  }
}

module.exports = User;
