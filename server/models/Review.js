const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    quote: { type: String, required: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, default: 5 },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });

// TTL Index
ReviewSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isDeleted: true } });

module.exports = mongoose.model('Review', ReviewSchema);
