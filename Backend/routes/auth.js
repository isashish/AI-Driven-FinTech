const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// ─── POST /api/auth/google ──────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId });
      await Profile.create({ userId: user._id });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

// ─── POST /api/auth/forgotpassword ──────────────────────────────────────────
router.post('/forgotpassword', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail', // or configured service
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = `You are receiving this email because you requested a password reset.\n\nPlease make a put request to: \n\n${resetUrl}`;
    
    // In actual dev, if no SMTP creds, just log it out.
    if(!process.env.SMTP_EMAIL) {
      console.log('RESET URL (SMTP not configured):', resetUrl);
      return res.status(200).json({ message: 'SMTP not configured. Token logged to server console.' });
    }

    await transporter.sendMail({
      from: `${process.env.SMTP_EMAIL}`,
      to: user.email,
      subject: 'Password Reset Token',
      text: message,
    });

    res.status(200).json({ message: 'Email sent' });
  } catch (err) {
    console.error(err);
    if(req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if(user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
      }
    }
    res.status(500).json({ message: 'Email could not be sent' });
  }
});

// ─── PUT /api/auth/resetpassword/:token ──────────────────────────────────────
router.put('/resetpassword/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
