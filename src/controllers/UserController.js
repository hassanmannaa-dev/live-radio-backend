class UserController {
  constructor(userService, chatService, io) {
    this.userService = userService;
    this.chatService = chatService;
    this.io = io;
  }

  register = async (req, res, next) => {
    try {
      const { name, avatarId } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      if (avatarId === undefined || typeof Number(avatarId) !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Avatar ID must be a number'
        });
      }

      if (this.userService.isNameTaken(name)) {
        return res.status(400).json({
          success: false,
          error: 'Name is already taken'
        });
      }

      const user = this.userService.registerUser(name.trim(), Number(avatarId));

      this.io.emit('userJoined', user.getPublicInfo());
      this.io.emit('usersUpdate', { users: this.userService.getOnlineUsers() });

      res.status(201).json({
        success: true,
        user: user.getPublicInfo()
      });
    } catch (error) {
      next(error);
    }
  };

  getOnlineUsers = async (req, res, next) => {
    try {
      const users = this.userService.getOnlineUsers();
      res.json({
        count: users.length,
        users
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const user = this.userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json(user.getPublicInfo());
    } catch (error) {
      next(error);
    }
  };

  getChatHistory = async (req, res, next) => {
    try {
      const count = parseInt(req.query.count) || 50;
      const messages = this.chatService.getHistory(count);

      res.json({ messages });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = UserController;
