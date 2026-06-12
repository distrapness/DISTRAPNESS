const { Server } = require('socket.io');

// In-memory chat storage (for real-time support admin chat)
const chats = [];

module.exports = function setupSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
  });

  // If Express app is passed, register the REST endpoint to get chat history
  if (app) {
    const { verifyToken, verifyAdmin } = require('./middleware/auth');
    app.get('/chats', verifyToken, verifyAdmin, (req, res) => {
      res.json(chats);
    });
  }

  io.on('connection', (socket) => {
    // Broadcast visitor count
    const count = io.engine.clientsCount;
    io.emit('visitor_count', count);

    // New user/admin joins chat
    socket.on('join', (user) => {
      socket.user = user;
    });

    // User sends a message
    socket.on('chat_message', (msg) => {
      const chatMsg = {
        user: socket.user || 'Guest',
        message: msg.message,
        role: msg.role || 'user',
        timestamp: new Date().toISOString()
      };
      chats.push(chatMsg);
      io.emit('chat_message', chatMsg); // Broadcast to all
    });

    // Admin sends a message
    socket.on('admin_message', (msg) => {
      const chatMsg = {
        user: 'Admin',
        message: msg.message,
        role: 'admin',
        timestamp: new Date().toISOString()
      };
      chats.push(chatMsg);
      io.emit('chat_message', chatMsg); // Broadcast to all
    });

    socket.on('disconnect', () => {
      io.emit('visitor_count', io.engine.clientsCount);
    });
  });

  return io;
};
