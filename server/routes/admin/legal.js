const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const LegalDoc = require('../../models/LegalDoc');

// JWT auth middleware
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// GET /api/admin/legal/:key  — admin (also usable to preview)
router.get('/:key', auth, async (req, res) => {
    try {
        const doc = await LegalDoc.findOne({ key: req.params.key });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json({ title: doc.title, htmlContent: doc.htmlContent, updatedAt: doc.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/legal/:key  — admin: update htmlContent
router.put('/:key', auth, async (req, res) => {
    try {
        const { htmlContent } = req.body;
        if (typeof htmlContent !== 'string') {
            return res.status(400).json({ error: 'htmlContent must be a string' });
        }
        const doc = await LegalDoc.findOneAndUpdate(
            { key: req.params.key },
            { htmlContent },
            { returnDocument: 'after', upsert: false }
        );
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json({ message: 'Saved', updatedAt: doc.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
