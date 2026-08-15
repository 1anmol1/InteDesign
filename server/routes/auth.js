const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'inteDesignSecretKey2026';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, preferredStyle, projectType, budget, timeline } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      fullName,
      email,
      password,
      preferredStyle,
      projectType,
      budget,
      timeline,
      role: 'user'
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Login User or Admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // First check if it's the admin
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const payload = { user: { role: 'admin' } };
      return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) throw err;
        return res.json({ token, user: { email, role: 'admin', fullName: 'Admin' } });
      });
    }
    
    // If not admin, check for regular user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get Current User (Auto-login)
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.user.role === 'admin') {
      return res.json({ user: { role: 'admin', email: process.env.ADMIN_EMAIL, fullName: 'Admin' } });
    }

    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
