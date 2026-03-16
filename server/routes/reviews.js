const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET /api/reviews — public, only visible reviews sorted by order
router.get('/', async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.json([]);
        }
        const reviews = await Review.find({ isVisible: true }).sort('order').lean();
        res.json(reviews);
    } catch (err) {
        console.error('Fetch reviews error:', err);
        res.json([]);
    }
});

module.exports = router;
