const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const VisionBoard = require('../models/VisionBoard');
const userAuth = require('../middleware/userAuth');

// ── POST /api/visionboard/save ─────────────────────────────────────────────
// Saves a board to DB and returns the generated code
router.post('/save', async (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }

    // Sanitise: only keep allowed fields, strip local file:// URLs
    const safe = images
      .filter(img => (img.url || img.thumb) && !(img.url?.startsWith('file://')))
      .map(img => ({
        url:         img.url || img.thumb,
        thumb:       img.thumb || img.url,
        description: img.description || '',
        source:      img.source || 'explorer',
        id:          img.id ? String(img.id) : undefined
      }));

    if (safe.length === 0) {
      return res.status(400).json({ error: 'No valid image URLs found.' });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inteDesignSecretKey2026');
        if (decoded && decoded.user && decoded.user.id) {
          userId = decoded.user.id;
        }
      } catch (e) {
        // Token invalid or expired, ignore and save anonymously
      }
    }

    const board = await VisionBoard.create({ images: safe, userId });
    return res.json({ code: board.code, count: board.images.length });
  } catch (err) {
    console.error('VisionBoard save error:', err);
    return res.status(500).json({ error: 'Failed to save board.' });
  }
});

// ── GET /api/visionboard/history ────────────────────────────────────────────
// Fetch user's past vision boards
router.get('/history', userAuth, async (req, res) => {
  try {
    const boards = await VisionBoard.find({ userId: req.user.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .select('code createdAt images');
    
    // Map to simplified structure for the frontend
    const history = boards.map(b => ({
      code: b.code,
      createdAt: b.createdAt,
      count: b.images.length,
      images: b.images
    }));

    return res.json({ history });
  } catch (err) {
    console.error('VisionBoard history error:', err);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ── GET /api/visionboard/:code ──────────────────────────────────────────────
// Public: look up a board by code and return its images
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const board = await VisionBoard.findOne({ code });
    if (!board) return res.status(404).json({ error: 'Board not found.' });
    return res.json({ code: board.code, images: board.images, createdAt: board.createdAt });
  } catch (err) {
    console.error('VisionBoard lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed.' });
  }
});

module.exports = router;
