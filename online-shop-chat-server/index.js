const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory chat storage (for demo, replace with DB for production)
let chats = [];

// REST endpoint: get all chats (for admin dashboard)
app.get('/chats', (req, res) => {
  res.json(chats);
});

// Socket.io events
io.on('connection', (socket) => {
  // New user joins
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
    io.emit('chat_message', chatMsg);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
