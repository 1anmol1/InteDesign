const express = require('express');
const router = express.Router();
const LegalDoc = require('../models/LegalDoc');

// GET /api/legal/:key  — public
router.get('/:key', async (req, res) => {
    try {
        const doc = await LegalDoc.findOne({ key: req.params.key });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json({ title: doc.title, htmlContent: doc.htmlContent, updatedAt: doc.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
