const mongoose = require('mongoose');

const LegalDocSchema = new mongoose.Schema({
    key: {
        type: String,
        enum: ['privacy_policy', 'terms_conditions'],
        required: true,
        unique: true,
    },
    title: { type: String, required: true },
    htmlContent: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('LegalDoc', LegalDocSchema);
