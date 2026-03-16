const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');

// Multer: buffer storage (we process with sharp before saving)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
    },
});

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Helper: save image as WebP via sharp
async function saveAsWebP(buffer, filename) {
    const outPath = path.join(UPLOADS_DIR, filename);
    await sharp(buffer)
        .resize(1400, 1000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
    return `/uploads/${filename}`;
}

// GET /api/admin/projects — all projects sorted by order
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: { $ne: true } }).sort({ order: 1, createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/admin/projects — create project with images
router.post('/', auth, upload.array('images', 10), async (req, res) => {
    try {
        const { title, description, category, location, year, featured } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });

        const imagePaths = [];
        for (const file of req.files || []) {
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
            const url = await saveAsWebP(file.buffer, filename);
            imagePaths.push(url);
        }

        const count = await Project.countDocuments({ isDeleted: { $ne: true } });
        const project = await Project.create({
            title, description, category, location, year,
            featured: featured === 'true',
            images: imagePaths,
            order: count,
        });

        res.status(201).json(project);
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/admin/projects/:id — update metadata
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const { title, description, category, location, year, featured, order, removeImages } = req.body;

        if (title !== undefined) project.title = title;
        if (description !== undefined) project.description = description;
        if (category !== undefined) project.category = category;
        if (location !== undefined) project.location = location;
        if (year !== undefined) project.year = year;
        if (featured !== undefined) project.featured = featured === 'true';
        if (order !== undefined) project.order = Number(order);

        // Remove specific images
        if (removeImages) {
            const toRemove = JSON.parse(removeImages);
            toRemove.forEach((imgPath) => {
                const fullPath = path.join(__dirname, '../../', imgPath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });
            project.images = project.images.filter((img) => !toRemove.includes(img));
        }

        // Add new images
        for (const file of req.files || []) {
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
            const url = await saveAsWebP(file.buffer, filename);
            project.images.push(url);
        }

        await project.save();
        res.json(project);
    } catch (err) {
        console.error('Update project error:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/admin/projects/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;
