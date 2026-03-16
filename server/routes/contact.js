const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');

// Lazy-init transporter (no crash if SMTP not configured)
function getTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

// POST /api/contact
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, roomType, message, savedImages, visionBoardCode } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required.' });
        }

        // Save to DB
        const lead = await Lead.create({ 
            name, 
            email, 
            phone, 
            roomType, 
            message, 
            savedImages: savedImages || [],
            visionBoardCode: visionBoardCode || ''
        });

        // Email notification (optional — only if SMTP configured)
        const transporter = getTransporter();
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"Phantasia Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                    to: process.env.SMTP_USER,
                    subject: `✦ New Lead: ${name} — ${roomType || 'Inquiry'}`,
                    html: `
                        <h2 style="font-family:serif">New Consultation Request</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone || '—'}</p>
                        <p><strong>Room Type:</strong> ${roomType || '—'}</p>
                        <hr/>
                        <p><strong>Message:</strong><br/>${message}</p>
                        ${visionBoardCode ? `<p><strong>Vision Board Code:</strong> <code style="background:#eee;padding:2px 5px;border-radius:3px">${visionBoardCode}</code></p>` : ''}
                        ${savedImages?.length ? `<p><strong>AI Vision Board Images:</strong> ${savedImages.length} image(s) saved</p>` : ''}
                    `,
                });
            } catch (emailErr) {
                console.error('Email send failed (non-fatal):', emailErr.message);
            }
        }

        res.json({ success: true, message: 'Thank you! We will be in touch soon.', id: lead._id });
    } catch (err) {
        console.error('Contact form error:', err);
        res.status(500).json({ error: 'Failed to submit form. Please try again.' });
    }
});

module.exports = router;
