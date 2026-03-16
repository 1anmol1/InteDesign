const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    roomType: { type: String, default: '' },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['new', 'contacted', 'closed'],
        default: 'new',
    },
    savedImages: [{ type: String }], // URLs of AI Explorer images attached
    visionBoardCode: { type: String, default: '' }, // Link to a VisionBoard document code
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });

// TTL Index: Auto-delete documents 30 days after deletedAt if isDeleted is true
LeadSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isDeleted: true } });

module.exports = mongoose.model('Lead', LeadSchema);
