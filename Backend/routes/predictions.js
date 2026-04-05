const express = require('express');
const { body, validationResult } = require('express-validator');
const Prediction = require('../models/Prediction');
const auth = require('../middleware/auth');
const { calculateSIP, calculateLumpsum, calculateSIPForGoal } = require('../services/financial');

const router = express.Router();
router.use(auth);

// ─── GET /api/predictions ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;
    const filter = { userId: req.userId };
    if (type) filter.type = type;

    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Prediction.countDocuments(filter);
    res.json({ predictions, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get predictions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/predictions/calculate ──────────────────────────────────────
// Calculate + optionally save
router.post(
  '/calculate',
  [
    body('type').isIn(['sip', 'lumpsum', 'goal', 'retirement', 'custom']).withMessage('Invalid prediction type'),
    body('inputs').isObject().withMessage('Inputs must be an object'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { type, inputs, label, save: shouldSave = false } = req.body;
    const {
      principal = 0,
      monthlyContribution = 0,
      annualReturnRate = 12,
      inflationRate = 6,
      tenureYears = 10,
      stepUpPercent = 0,
    } = inputs;

    try {
      let results;

      if (type === 'sip') {
        results = calculateSIP(monthlyContribution, annualReturnRate, tenureYears, stepUpPercent);
        results.inflationAdjustedValue = Math.round(
          results.futureValue / Math.pow(1 + inflationRate / 100, tenureYears)
        );
      } else if (type === 'lumpsum') {
        results = calculateLumpsum(principal, annualReturnRate, tenureYears, inflationRate);
      } else if (type === 'goal') {
        const sipNeeded = calculateSIPForGoal(principal, 0, annualReturnRate, tenureYears);
        results = {
          futureValue: principal,
          totalInvested: sipNeeded * tenureYears * 12,
          totalReturns: principal - sipNeeded * tenureYears * 12,
          sipRequired: sipNeeded,
          yearlyBreakdown: [],
        };
      } else {
        // custom / retirement — treat as SIP + lumpsum combo
        const sipResult = calculateSIP(monthlyContribution, annualReturnRate, tenureYears, stepUpPercent);
        const lsResult = calculateLumpsum(principal, annualReturnRate, tenureYears, inflationRate);
        results = {
          futureValue: sipResult.futureValue + lsResult.futureValue,
          totalInvested: sipResult.totalInvested + lsResult.totalInvested,
          totalReturns: sipResult.totalReturns + lsResult.totalReturns,
          inflationAdjustedValue: Math.round(
            (sipResult.futureValue + lsResult.futureValue) / Math.pow(1 + inflationRate / 100, tenureYears)
          ),
          yearlyBreakdown: sipResult.yearlyBreakdown.map((y, i) => ({
            year: y.year,
            invested: y.invested + (lsResult.yearlyBreakdown[i]?.invested || 0),
            value: y.value + (lsResult.yearlyBreakdown[i]?.value || 0),
          })),
        };
      }

      let prediction = null;
      if (shouldSave) {
        prediction = await Prediction.create({
          userId: req.userId,
          type,
          label: label || `${type.toUpperCase()} Simulation`,
          inputs: { principal, monthlyContribution, annualReturnRate, inflationRate, tenureYears, stepUpPercent },
          results,
        });
      }

      res.json({ results, prediction });
    } catch (err) {
      console.error('Calculate prediction error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// ─── POST /api/predictions ────────────────────────────────────────────────
// Save a pre-calculated prediction
router.post('/', async (req, res) => {
  try {
    const { type, label, inputs, results, notes } = req.body;
    const prediction = await Prediction.create({
      userId: req.userId,
      type,
      label,
      inputs,
      results,
      notes: notes || '',
    });
    res.status(201).json({ prediction });
  } catch (err) {
    console.error('Save prediction error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/predictions/:id ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findOne({ _id: req.params.id, userId: req.userId });
    if (!prediction) return res.status(404).json({ message: 'Prediction not found.' });
    res.json({ prediction });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── DELETE /api/predictions/:id ──────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!prediction) return res.status(404).json({ message: 'Prediction not found.' });
    res.json({ message: 'Prediction deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
