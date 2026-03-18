const Session = require('../models/Session');

/**
 * BatchWriter: collects canvas operations and flushes to MongoDB
 * every 5 seconds OR when 100 operations have accumulated.
 * This avoids hammering the DB on every single brush stroke.
 */
class BatchWriter {
  constructor() {
    this.queues = {}; // roomId -> [operations]
    this.timers = {}; // roomId -> setTimeout handle
  }

  enqueue(roomId, operation) {
    if (!this.queues[roomId]) this.queues[roomId] = [];
    this.queues[roomId].push(operation);

    // Flush immediately if 100 ops queued
    if (this.queues[roomId].length >= 100) {
      this.flush(roomId);
      return;
    }

    // Otherwise, set/reset a 5s timer
    if (this.timers[roomId]) clearTimeout(this.timers[roomId]);
    this.timers[roomId] = setTimeout(() => this.flush(roomId), 5000);
  }

  async flush(roomId) {
    if (!this.queues[roomId] || this.queues[roomId].length === 0) return;
    const ops = this.queues[roomId];
    this.queues[roomId] = [];
    if (this.timers[roomId]) {
      clearTimeout(this.timers[roomId]);
      delete this.timers[roomId];
    }

    try {
      const session = await Session.findOne({ roomId });
      if (!session) return;

      for (const op of ops) {
        if (op.type === 'add') {
          const exists = session.elements.find(e => e.id === op.element.id);
          if (!exists) session.elements.push(op.element);
        } else if (op.type === 'update') {
          const idx = session.elements.findIndex(e => e.id === op.element.id);
          if (idx !== -1) session.elements[idx] = { ...session.elements[idx], ...op.element };
        } else if (op.type === 'delete') {
          session.elements = session.elements.filter(e => e.id !== op.element.id);
        } else if (op.type === 'clear') {
          session.elements = [];
        }
      }

      session.lastUpdated = new Date();
      await session.save();
    } catch (err) {
      console.error(`BatchWriter flush error for room ${roomId}:`, err.message);
    }
  }

  // Flush all rooms (call on server shutdown)
  async flushAll() {
    const roomIds = Object.keys(this.queues);
    await Promise.all(roomIds.map(id => this.flush(id)));
  }
}

module.exports = new BatchWriter();
