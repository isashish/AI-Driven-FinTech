const express = require('express');
const Profile = require('../models/Profile');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { buildDashboardSummary, calculateHealthScore } = require('../services/financial');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── GET /api/profile ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await Profile.create({ userId: req.userId });
    }
    
    const user = await User.findById(req.userId).select('name email');
    
    // Merge user info with profile for the frontend
    const profileData = {
      ...profile.toObject(),
      name: user?.name,
      email: user?.email,
    };
    
    res.json({ profile: profileData });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PUT /api/profile ─────────────────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { name, email, ...otherUpdates } = req.body;

    // Handle User updates if name/email provided
    if (name || email) {
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (email) userUpdates.email = email;
      await User.findByIdAndUpdate(req.userId, { $set: userUpdates });
    }

    const allowedFields = [
      'income', 'expenses', 'emi', 'savings', 'investments', 'emergency',
      'otherIncome', 'rent', 'utilities', 'groceries', 'transport', 
      'entertainment', 'otherExpenses', 'totalSavings', 'totalInvestments',
      'emergencyFundTarget', 'riskTolerance', 'age', 'occupation',
      'retirementAge', 'currency',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (otherUpdates[field] !== undefined) updates[field] = otherUpdates[field];
    });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    const user = await User.findById(req.userId).select('name email');
    const profileData = {
      ...profile.toObject(),
      name: user?.name,
      email: user?.email,
    };

    res.json({ profile: profileData });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/profile/dashboard ───────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [profile, goals, loans] = await Promise.all([
      Profile.findOne({ userId: req.userId }),
      Goal.find({ userId: req.userId }),
      Loan.find({ userId: req.userId }),
    ]);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please complete your profile.' });
    }

    const summary = buildDashboardSummary(profile.toObject(), goals, loans);
    res.json({ summary });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/profile/health-score ────────────────────────────────────────
router.get('/health-score', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const loans = await Loan.find({ userId: req.userId, isActive: true });
    const totalEMI = loans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

    const healthScore = calculateHealthScore({ ...profile.toObject(), totalEMI });
    res.json({ healthScore });
  } catch (err) {
    console.error('Health score error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
