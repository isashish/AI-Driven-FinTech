const express = require('express');
const Profile = require('../models/Profile');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { buildDashboardSummary, calculateHealthScore } = require('../services/financial');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
      'retirementAge', 'currency', 'phone', 'location',
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

// ─── PUT /api/profile/assets ─────────────────────────────────────────────
router.put('/assets', async (req, res) => {
  try {
    const { physicalAssets, liquidAssets, liabilities } = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { 
        $set: { 
          assets: {
            physicalAssets,
            liquidAssets,
            liabilities
          }
        } 
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, assets: profile.assets });
  } catch (err) {
    console.error('Update assets error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/profile/assets ─────────────────────────────────────────────
router.get('/assets', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    const assets = profile?.assets || {
      physicalAssets: { realEstate: 0, gold: 0, vehicles: 0, otherPhysical: 0 },
      liquidAssets: { cash: 0, bankBalance: 0, mutualFunds: 0, stocks: 0, otherLiquid: 0 },
      liabilities: { homeLoan: 0, carLoan: 0, personalLoan: 0, otherLiabilities: 0 }
    };
    
    res.json({ assets });
  } catch (err) {
    console.error('Get assets error:', err);
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

// ─── POST /api/profile/scan ──────────────────────────────────────────────
router.post('/scan', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!imageBase64) return res.status(400).json({ message: 'Image data is required.' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(400).json({ message: 'AI Scanner is not configured (missing API Key).' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an AI financial document scanner. Analyze the attached image (bank statement, receipt, or asset document).
      Extract financial assets or liabilities.
      Return ONLY a JSON array of objects with the following structure:
      [{ "label": "String", "value": Number, "type": "physical" | "liquid" | "liability", "icon": "Emoji" }]
      
      Guidelines:
      - If it's a bank balance, type is "liquid", icon is "💰".
      - If it's a loan/debt, type is "liability", icon is "💳".
      - If it's a property/vehicle, type is "physical", icon is "🏠" or "🚗".
      - Return an empty array if no clear data is found.
      - Do not include Markdown formatting or code blocks in your response.
    `;

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\\/\\w+;base64,/, '');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text().trim();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    res.json({ success: true, extracted: data });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ message: 'Failed to process document with AI.' });
  }
});

module.exports = router;