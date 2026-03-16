const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../../models/Review');

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

// GET all reviews
router.get('/', auth, async (req, res) => {
    try {
        const reviews = await Review.find({ isDeleted: { $ne: true } }).sort('order');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new review
router.post('/', auth, async (req, res) => {
    try {
        const review = await Review.create(req.body);
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update review
router.put('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOneAndUpdate(
            { _id: req.params.id, isDeleted: { $ne: true } },
            req.body,
            { new: true }
        );
        if (!review) return res.status(404).json({ error: 'Review not found' });
        res.json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE review — soft delete
router.delete('/:id', auth, async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });
        res.json({ message: 'Moved to trash' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
