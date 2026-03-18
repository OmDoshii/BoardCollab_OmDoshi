const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const batchWriter = require('./batchWriter');
const { applyOperation, transform } = require('../ot/transform');

// In-memory room state: roomId -> { elements: [], users: {} }
const rooms = {};

function getRoomState(roomId) {
  if (!rooms[roomId]) rooms[roomId] = { elements: [], users: {} };
  return rooms[roomId];
}

module.exports = function registerHandlers(io) {

  // Middleware: verify JWT on every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.user.username})`);

    // ─── join-room ─────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      try {
        // Validate room exists in DB
        let session = await Session.findOne({ roomId });
        if (!session) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);
        socket.roomId = roomId;

        const roomState = getRoomState(roomId);

        // Load from DB into memory if room is fresh
        if (roomState.elements.length === 0 && session.elements.length > 0) {
          roomState.elements = [...session.elements];
        }

        // Track user in room
        roomState.users[socket.id] = { username: socket.user.username, id: socket.user.id };

        // Send current canvas state to the joining user
        socket.emit('room-state', {
          elements: roomState.elements,
          users: Object.values(roomState.users),
        });

        // Notify others that someone joined
        socket.to(roomId).emit('user-joined', {
          username: socket.user.username,
          users: Object.values(roomState.users),
        });

        console.log(`${socket.user.username} joined room ${roomId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── draw-stroke ────────────────────────────────────────────────
    // operation: { type: 'add'|'update'|'delete'|'clear', element: {...} }
    socket.on('draw-stroke', ({ roomId, operation }) => {
      const roomState = getRoomState(roomId);

      // Apply OT: check against last op in room for same element
      let finalOp = operation;
      const lastOp = roomState.lastOp;
      if (lastOp && lastOp.element?.id === operation.element?.id) {
        finalOp = transform(operation, lastOp);
      }
      roomState.lastOp = finalOp;

      // Apply to in-memory state
      roomState.elements = applyOperation(roomState.elements, finalOp);

      // Broadcast to everyone else in the room
      socket.to(roomId).emit('draw-stroke', { operation: finalOp, userId: socket.user.id });

      // Queue for DB write (batched)
      batchWriter.enqueue(roomId, finalOp);
    });

    // ─── undo ────────────────────────────────────────────────────────
    // Client tells us which elementId to remove (their last drawn element)
    socket.on('undo', ({ roomId, elementId }) => {
      const roomState = getRoomState(roomId);
      const op = { type: 'delete', element: { id: elementId } };
      roomState.elements = applyOperation(roomState.elements, op);
      socket.to(roomId).emit('draw-stroke', { operation: op, userId: socket.user.id });
      batchWriter.enqueue(roomId, op);
    });

    // ─── clear-canvas ────────────────────────────────────────────────
    socket.on('clear-canvas', ({ roomId }) => {
      const roomState = getRoomState(roomId);
      roomState.elements = [];
      const op = { type: 'clear', element: {} };
      io.to(roomId).emit('draw-stroke', { operation: op, userId: socket.user.id });
      batchWriter.enqueue(roomId, op);
    });

    // ─── heartbeat ───────────────────────────────────────────────────
    socket.on('heartbeat', () => socket.emit('heartbeat-ack'));

    // ─── disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomId } = socket;
      if (roomId && rooms[roomId]) {
        delete rooms[roomId].users[socket.id];
        socket.to(roomId).emit('user-left', {
          username: socket.user.username,
          users: Object.values(rooms[roomId].users),
        });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
