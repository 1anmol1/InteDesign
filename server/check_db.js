const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('./models/Admin');

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const admin = await Admin.findOne({ email: (process.env.ADMIN_EMAIL || 'admin@intedesign.studio').toLowerCase() });
        if (admin) {
            console.log('Admin user found:', admin.email);
        } else {
            console.log('Admin user NOT found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err.message);
        process.exit(1);
    });
