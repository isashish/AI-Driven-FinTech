const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper to sign JWT
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      const user = await User.create({ name, email, password });

      // Create empty profile for the new user
      await Profile.create({ userId: user._id });

      const token = signToken(user._id);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = signToken(user._id);
      res.json({ token, user });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
// (Stateless JWT — client deletes token; server-side is a no-op)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

// ─── PUT /api/auth/change-password ────────────────────────────────────────
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.userId);
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

module.exports = router;
