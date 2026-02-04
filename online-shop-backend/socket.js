module.exports = function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    // Broadcast visitor count
    const count = io.engine.clientsCount;
    io.emit('visitor_count', count);

    // Handle admin things
    socket.on('disconnect', () => {
      io.emit('visitor_count', io.engine.clientsCount);
    });
  });

  return io;
};
