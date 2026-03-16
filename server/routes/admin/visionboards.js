const express = require('express');
const router = express.Router();
const VisionBoard = require('../../models/VisionBoard');
const auth = require('../../middleware/auth');

// ── GET /api/admin/visionboards?code=PH-XXXXXX ─────────────────────────────
// Admin: search by code or list all recent boards (exclude deleted)
router.get('/', auth, async (req, res) => {
  try {
    let { code } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (code) {
      const searchTerm = code.trim();
      query.$or = [
        { code: { $regex: searchTerm.startsWith('PH-') ? `^${searchTerm}` : `^PH-${searchTerm}|^${searchTerm}`, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ];
      const boards = await VisionBoard.find(query).sort({ createdAt: -1 }).limit(20);
      return res.json(boards);
    }
    
    // No code → list 50 most recent active
    const boards = await VisionBoard.find(query).sort({ createdAt: -1 }).limit(50);
    return res.json(boards);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/visionboards/rename/:id ──────────────────────────────
router.patch('/rename/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const board = await VisionBoard.findByIdAndUpdate(
      req.params.id,
      { name },
      { returnDocument: 'after' }
    );
    if (!board) return res.status(404).json({ error: 'Board not found' });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/visionboards/:id ─────────────────────────────────────
// Admin: move to trash
router.delete('/:id', auth, async (req, res) => {
  try {
    await VisionBoard.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date()
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
