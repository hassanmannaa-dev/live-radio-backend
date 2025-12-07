const { v4: uuidv4 } = require('uuid');

class Chat {
  constructor(maxMessages = 1000) {
    this.messages = [];
    this.maxMessages = maxMessages;
  }

  static createMessage(userId, username, avatarId, message) {
    return {
      id: uuidv4(),
      userId,
      username,
      avatarId,
      message,
      timestamp: new Date().toISOString()
    };
  }

  addMessage(message) {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    return message;
  }

  getHistory(count = 50) {
    return this.messages.slice(-count);
  }

  getMessagesAfter(timestamp) {
    const targetTime = new Date(timestamp).getTime();
    return this.messages.filter(msg => new Date(msg.timestamp).getTime() > targetTime);
  }

  clearMessages() {
    this.messages = [];
  }
}

module.exports = Chat;
