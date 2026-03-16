const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET /api/projects — public, sorted by order
router.get('/', async (req, res) => {
    try {
        // If DB is not connected, return empty immediately to allow frontend fallbacks
        if (require('mongoose').connection.readyState !== 1) {
            return res.json([]);
        }
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 }).lean();
        res.json(projects);
    } catch (err) {
        console.error('Fetch projects error:', err);
        res.json([]); // Return empty on error
    }
});

module.exports = router;
