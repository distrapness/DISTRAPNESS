// socket.js
const { Server } = require('socket.io');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    // Example event handler
    socket.on('chat_message', (msg) => {
      // Broadcast to all connected admins/clients
      io.emit('chat_message', msg);
    });
    socket.on('disconnect', () => {
      console.log('Admin disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = setupSocket;
