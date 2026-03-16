const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: String, default: '' },
    description: { type: String, default: '' },
    features: [{ type: String }],
    accent: { type: String, default: 'from-purple-600/20 to-transparent' },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });

// TTL Index
ServiceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isDeleted: true } });

module.exports = mongoose.model('Service', ServiceSchema);
