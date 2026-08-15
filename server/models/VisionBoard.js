const mongoose = require('mongoose');

// Each saved image entry
const boardImageSchema = new mongoose.Schema({
  id:          { type: String },
  url:         { type: String, required: true },
  thumb:       { type: String },
  description: { type: String },
  source:      { type: String, enum: ['portfolio', 'explorer', 'uploaded'], default: 'explorer' },
}, { _id: false });

const visionBoardSchema = new mongoose.Schema({
  // Short human-readable code like PH-A3F9
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
  },
  images: [boardImageSchema],
  name: { type: String, trim: true }, // Admin-assigned name
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDownloaded: { type: Boolean, default: false },
  downloadedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// TTL Index: Auto-delete documents 30 days after deletedAt if isDeleted is true
visionBoardSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isDeleted: true } });

// Generate a random 6-char alphanumeric code prefixed with "PH-"
visionBoardSchema.pre('save', async function () {
  if (!this.code) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusable chars
    let code;
    let exists = true;
    while (exists) {
      code = 'PH-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      exists = await this.constructor.exists({ code });
    }
    this.code = code;
  }
});

module.exports = mongoose.model('VisionBoard', visionBoardSchema);
