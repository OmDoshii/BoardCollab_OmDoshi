const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const Session = require('../models/Session');

// Helper: generate short room ID
const genRoomId = () => Math.random().toString(36).slice(2, 9).toUpperCase();

// POST /api/rooms — create room
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, isPrivate } = req.body;
    const roomId = genRoomId();
    const session = await Session.create({
      roomId,
      name: name || 'Untitled Room',
      isPrivate: !!isPrivate,
      owner: req.user.id,
    });
    res.status(201).json({ roomId: session.roomId, name: session.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms — list public rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Session.find({ isPrivate: false })
      .select('roomId name lastUpdated')
      .sort({ lastUpdated: -1 })
      .limit(20);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/:id — get room session
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.id });
    if (!session) return res.status(404).json({ message: 'Room not found' });
    res.json({ roomId: session.roomId, name: session.name, elements: session.elements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;