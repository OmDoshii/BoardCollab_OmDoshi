const { Server } = require('socket.io');
const registerHandlers = require('./handlers');

module.exports = function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 30000,
  });

  registerHandlers(io);
  console.log('Socket.IO initialized');
  return io;
};
