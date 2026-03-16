const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Lead = require('../../models/Lead');

// GET /api/admin/leads — all leads, newest first, optional ?status= filter
router.get('/', auth, async (req, res) => {
    try {
        const filter = { isDeleted: { $ne: true } };
        if (req.query.status) filter.status = req.query.status;
        const leads = await Lead.find(filter).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// PUT /api/admin/leads/:id — update status
router.put('/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'contacted', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, isDeleted: { $ne: true } },
            { status },
            { new: true }
        );
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// DELETE /api/admin/leads/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

module.exports = router;
