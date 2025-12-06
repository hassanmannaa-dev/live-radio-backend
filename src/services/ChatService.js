const Chat = require('../models/Chat');

class ChatService {
  constructor() {
    this.chat = new Chat(100);
  }

  addMessage(userId, username, avatarId, message) {
    const chatMessage = Chat.createMessage(userId, username, avatarId, message);
    return this.chat.addMessage(chatMessage);
  }

  getHistory(count = 50) {
    return this.chat.getHistory(count);
  }

  getMessagesAfter(timestamp) {
    return this.chat.getMessagesAfter(timestamp);
  }

  clearMessages() {
    this.chat.clearMessages();
  }
}

module.exports = ChatService;
