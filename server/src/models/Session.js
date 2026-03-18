const mongoose = require('mongoose');

const ElementSchema = new mongoose.Schema({
  id:        { type: String, required: true },   // unique element ID
  type:      { type: String, required: true },   // 'stroke' | 'rect' | 'circle' | 'text'
  data:      { type: Object, required: true },   // shape-specific properties
  userId:    { type: String },                   // who drew it
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  roomId:      { type: String, required: true, unique: true },
  name:        { type: String, default: 'Untitled Room' },
  isPrivate:   { type: Boolean, default: false },
  password:    { type: String, default: null },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  elements:    [ElementSchema],
  users:       [{ userId: mongoose.Schema.Types.ObjectId, joinedAt: Date }],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
