const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Commercial', 'Other'],
        default: 'Other',
    },
    images: [{ type: String }], // file paths / URLs
    location: { type: String, default: '' },
    year: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });

// TTL Index
ProjectSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isDeleted: true } });

module.exports = mongoose.model('Project', ProjectSchema);
