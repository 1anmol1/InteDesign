const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✓ MongoDB Connected');
        await seedAdmin();
        await seedDefaultData();
    })
    .catch(err => console.log('MongoDB Connection Error (Expected if no local DB):', err.message));

// ── Seed: Admin User ───────────────────────────────────────────────────────────
async function seedAdmin() {
    try {
        const Admin = require('./models/Admin');
        const email = (process.env.ADMIN_EMAIL || 'admin@phantasia.studio').toLowerCase();
        const existing = await Admin.findOne({ email });
        if (!existing) {
            const password = process.env.ADMIN_PASSWORD || 'phantasia2026';
            const passwordHash = await bcrypt.hash(password, 12);
            await Admin.create({ email, passwordHash });
            console.log(`✓ Admin seeded: ${email}`);
        }
    } catch (err) {
        console.error('Admin seed error:', err.message);
    }
}

// ── Seed: Default Services & Portfolio ────────────────────────────────────────
async function seedDefaultData() {
    try {
        const Service = require('./models/Service');
        const count = await Service.countDocuments();
        if (count === 0) {
            await Service.insertMany([
                {
                    title: 'Full-Service Remodel',
                    price: 'From ₹6,50,000',
                    description: 'End-to-end interior transformation. We handle every detail from concept to final install.',
                    features: ['Full space planning & 3D renders', 'Contractor coordination', 'Furniture & material sourcing', 'On-site installation oversight', 'Final styling & reveal'],
                    accent: 'from-purple-600/20 to-transparent',
                    order: 0,
                },
                {
                    title: 'Virtual E-Design',
                    price: 'From ₹95,000',
                    description: "Get a complete design package delivered digitally — perfect for those who want a designer's eye without full-service commitment.",
                    features: ['AI-curated mood board', 'Full floor plan & layout', 'Shopping list with direct links', '2 rounds of revisions', 'Implementation guide'],
                    accent: 'from-cyan-600/20 to-transparent',
                    order: 1,
                },
                {
                    title: 'Colour Consultation',
                    price: 'From ₹28,000',
                    description: 'A focused 90-minute session to find your perfect palette — walls, trims, accents — transforming your space with just paint.',
                    features: ['90-minute virtual session', 'Custom colour palette deck', 'Paint brand & code recommendations', 'Before/after visualisation', 'Follow-up Q&A email'],
                    accent: 'from-amber-600/20 to-transparent',
                    order: 2,
                },
            ]);
            console.log('✓ Default services seeded');
        }

        const Project = require('./models/Project');
        const pCount = await Project.countDocuments();
        if (pCount === 0) {
            await Project.insertMany([
                { title: 'The Khanna Residence', description: 'A serene minimalist living room bathed in warm natural light.', category: 'Living Room', location: 'Andheri West, Mumbai — 400 053', year: '2025', images: ['/images/living_room.png'], featured: true, order: 0 },
                { title: 'The Noirhaus Kitchen', description: 'Dark, dramatic kitchen with marble and brass accents.', category: 'Kitchen', location: 'Indiranagar, Bengaluru — 560 038', year: '2024', images: ['/images/kitchen.png'], featured: true, order: 1 },
                { title: 'Casa Serena Suite', description: 'Warm boho bedroom with rattan textures and terracotta tones.', category: 'Bedroom', location: 'Golf Course Road, Gurugram — 122 001', year: '2025', images: ['/images/bedroom.png'], featured: true, order: 2 },
                { title: 'Kyoto Bath Retreat', description: 'Spa-like Japandi bathroom with stone and natural wood.', category: 'Bathroom', location: 'Banjara Hills, Hyderabad — 500 034', year: '2024', images: ['/images/bathroom.png'], order: 3 },
                { title: 'Verdant HQ', description: 'Tech office with living walls and mid-century modern furniture.', category: 'Commercial', location: 'Viman Nagar, Pune — 411 014', year: '2024', images: ['/images/commercial.png'], order: 4 },
            ]);
            console.log('✓ Default projects seeded');
        }
        // Seed default legal docs
        const LegalDoc = require('./models/LegalDoc');
        for (const key of ['privacy_policy', 'terms_conditions']) {
            const exists = await LegalDoc.findOne({ key });
            if (!exists) {
                const title = key === 'privacy_policy' ? 'Privacy Policy' : 'Terms & Conditions';
                await LegalDoc.create({
                    key,
                    title,
                    htmlContent: `<h2>${title}</h2><p>This document is empty. Please update the content from <strong>Admin → Legal</strong>.</p>`,
                });
            }
        }
        // Seed default reviews
        const Review = require('./models/Review');
        const rCount = await Review.countDocuments();
        if (rCount === 0) {
            await Review.insertMany([
                { quote: 'Phantasia transformed our Andheri apartment into a soulful sanctuary. Every detail speaks volumes.', name: 'Ananya & Rohan Desai', location: 'Mumbai', order: 0 },
                { quote: 'The AI Style Explorer was almost magical — I described my dream and had a full mood board in minutes.', name: 'Karan Mehta', location: 'Delhi NCR', order: 1 },
                { quote: "Working with Phantasia felt deeply personal. They didn't just design our space — they understood us.", name: 'Priya Nair', location: 'Bengaluru', order: 2 },
            ]);
            console.log('✓ Default reviews seeded');
        }

        console.log('✓ Legal docs ensured');
    } catch (err) {
        console.error('Default data seed error:', err.message);
    }
}

// ── Public Routes ─────────────────────────────────────────────────────────────
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pinterest', require('./routes/pinterest'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/services', require('./routes/services'));
app.use('/api/legal', require('./routes/legal'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/images', require('./routes/images'));
app.use('/api/visionboard', require('./routes/visionboard'));

// ── Admin Routes (JWT-protected) ──────────────────────────────────────────────
app.use('/api/admin', require('./routes/admin/auth'));
app.use('/api/admin/projects', require('./routes/admin/projects'));
app.use('/api/admin/leads', require('./routes/admin/leads'));
app.use('/api/admin/services', require('./routes/admin/services'));
app.use('/api/admin/legal', require('./routes/admin/legal'));
app.use('/api/admin/reviews', require('./routes/admin/reviews'));
app.use('/api/admin/visionboards', require('./routes/admin/visionboards'));
app.use('/api/admin/trash', require('./routes/admin/trash'));

// Pinterest API health check
app.get('/api/pinterest/health', async (req, res) => {
    const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY && process.env.UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY_HERE';
    const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE';
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ unsplash: hasUnsplash, gemini: hasGemini, mongodb: mongoStatus });
});

app.get('/', (req, res) => res.send('✦ Phantasia API'));

app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
