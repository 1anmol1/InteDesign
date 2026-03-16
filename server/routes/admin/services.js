const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Service = require('../../models/Service');

// GET /api/admin/services
router.get('/', auth, async (req, res) => {
    try {
        const services = await Service.find({ isDeleted: { $ne: true } }).sort({ order: 1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// POST /api/admin/services (Create new)
router.post('/', auth, async (req, res) => {
    try {
        const { title, price, description, features, accent, isPopular } = req.body;
        const count = await Service.countDocuments({ isDeleted: { $ne: true } });
        const service = await Service.create({
            title,
            price: price || '',
            description: description || '',
            features: features || [],
            accent: accent || 'from-purple-600/20 to-transparent',
            isPopular: isPopular || false,
            order: count,
            isVisible: true
        });
        res.status(201).json(service);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// PUT /api/admin/services/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, price, description, features, accent, isVisible, order, isPopular } = req.body;
        const update = {};
        if (title !== undefined) update.title = title;
        if (price !== undefined) update.price = price;
        if (description !== undefined) update.description = description;
        if (features !== undefined) update.features = features;
        if (accent !== undefined) update.accent = accent;
        if (isVisible !== undefined) update.isVisible = isVisible;
        if (order !== undefined) update.order = order;
        if (isPopular !== undefined) update.isPopular = isPopular;

        const service = await Service.findOneAndUpdate(
            { _id: req.params.id, isDeleted: { $ne: true } },
            update,
            { new: true }
        );
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// DELETE /api/admin/services/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json({ message: 'Service moved to trash' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;
