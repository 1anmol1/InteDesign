const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET /api/services — public
router.get('/', async (req, res) => {
    try {
        const services = await Service.find({ isVisible: true }).sort({ order: 1 }).lean();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

module.exports = router;
