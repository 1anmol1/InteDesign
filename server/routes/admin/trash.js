const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Lead = require('../../models/Lead');
const Project = require('../../models/Project');
const Service = require('../../models/Service');
const Review = require('../../models/Review');
const VisionBoard = require('../../models/VisionBoard');

// GET /api/admin/trash — all deleted items from all collections
router.get('/', auth, async (req, res) => {
    try {
        const [leads, projects, services, reviews, boards] = await Promise.all([
            Lead.find({ isDeleted: true }).sort({ deletedAt: -1 }),
            Project.find({ isDeleted: true }).sort({ deletedAt: -1 }),
            Service.find({ isDeleted: true }).sort({ deletedAt: -1 }),
            Review.find({ isDeleted: true }).sort({ deletedAt: -1 }),
            VisionBoard.find({ isDeleted: true }).sort({ deletedAt: -1 }),
        ]);

        const allItems = [
            ...leads.map(i => ({ ...i._doc, type: 'lead', displayTitle: i.name || i.email })),
            ...projects.map(i => ({ ...i._doc, type: 'project', displayTitle: i.title })),
            ...services.map(i => ({ ...i._doc, type: 'service', displayTitle: i.title })),
            ...reviews.map(i => ({ ...i._doc, type: 'review', displayTitle: i.name })),
            ...boards.map(i => ({ ...i._doc, type: 'visionboard', displayTitle: i.code })),
        ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

        res.json(allItems);
    } catch (err) {
        console.error('Trash fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch trash' });
    }
});

// POST /api/admin/trash/restore — bulk restore
router.post('/restore', auth, async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, type }
        if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

        const results = await Promise.all(items.map(async ({ id, type }) => {
            let Model;
            switch (type) {
                case 'lead': Model = Lead; break;
                case 'project': Model = Project; break;
                case 'service': Model = Service; break;
                case 'review': Model = Review; break;
                case 'visionboard': Model = VisionBoard; break;
                default: return null;
            }
            return Model.findByIdAndUpdate(id, { isDeleted: false, $unset: { deletedAt: 1 } });
        }));

        res.json({ success: true, restored: results.filter(Boolean).length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to restore items' });
    }
});

// POST /api/admin/trash/purge — bulk permanent delete
router.post('/purge', auth, async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, type }
        if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

        const results = await Promise.all(items.map(async ({ id, type }) => {
            let Model;
            switch (type) {
                case 'lead': Model = Lead; break;
                case 'project': Model = Project; break;
                case 'service': Model = Service; break;
                case 'review': Model = Review; break;
                case 'visionboard': Model = VisionBoard; break;
                default: return null;
            }
            
            // For projects, we might want to delete images? 
            // In a permanent delete, yes.
            if (type === 'project') {
                const project = await Project.findById(id);
                if (project && project.images) {
                    const fs = require('fs');
                    const path = require('path');
                    project.images.forEach(imgPath => {
                        const fullPath = path.join(__dirname, '../../', imgPath);
                        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                    });
                }
            }
            if (type === 'visionboard') {
                 // Nothing extra to delete for visionboard documents themselves 
            }

            return Model.findByIdAndDelete(id);
        }));

        res.json({ success: true, purged: results.filter(Boolean).length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to purge items' });
    }
});

module.exports = router;
