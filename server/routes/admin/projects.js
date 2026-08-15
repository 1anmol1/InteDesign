const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer: buffer storage
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

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = "intedesign") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

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
            const url = await uploadToCloudinary(file.buffer, 'intedesign/projects');
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
            // In a production app you'd also delete them from Cloudinary:
            // e.g. cloudinary.uploader.destroy(public_id)
            project.images = project.images.filter((img) => !toRemove.includes(img));
        }

        // Add new images
        for (const file of req.files || []) {
            const url = await uploadToCloudinary(file.buffer, 'intedesign/projects');
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
