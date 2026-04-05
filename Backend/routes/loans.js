const express = require('express');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');
const { calculateEMI, generateAmortizationSchedule } = require('../services/financial');

const router = express.Router();

router.use(auth);

const loanValidation = [
  body('name').trim().notEmpty().withMessage('Loan name is required'),
  body('principalAmount').isNumeric().withMessage('Principal amount must be a number'),
  body('annualInterestRate').isNumeric().withMessage('Interest rate must be a number'),
  body('tenureMonths').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
];

// ─── GET /api/loans ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const filter = { userId: req.userId };
    if (active !== undefined) filter.isActive = active === 'true';

    const loans = await Loan.find(filter).sort({ createdAt: -1 });
    const totalEMI = loans.filter(l => l.isActive).reduce((s, l) => s + l.emiAmount, 0);
    res.json({ loans, totalEMI: Math.round(totalEMI) });
  } catch (err) {
    console.error('Get loans error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/loans ──────────────────────────────────────────────────────
router.post('/', loanValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, loanType, principalAmount, outstandingAmount, annualInterestRate, tenureMonths, startDate, lender, notes } = req.body;
    const loan = await Loan.create({
      userId: req.userId,
      name,
      loanType: loanType || 'other',
      principalAmount,
      outstandingAmount: outstandingAmount ?? principalAmount,
      annualInterestRate,
      tenureMonths,
      startDate: startDate || Date.now(),
      lender: lender || '',
      notes: notes || '',
    });
    res.status(201).json({ loan });
  } catch (err) {
    console.error('Create loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/loans/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json({ loan });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/loans/:id/amortization ─────────────────────────────────────
router.get('/:id/amortization', async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const schedule = generateAmortizationSchedule(
      loan.outstandingAmount ?? loan.principalAmount,
      loan.annualInterestRate,
      loan.tenureMonths
    );
    res.json({ schedule, emi: loan.emiAmount, loan });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PUT /api/loans/:id ───────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = ['name', 'loanType', 'principalAmount', 'outstandingAmount', 'annualInterestRate', 'tenureMonths', 'startDate', 'lender', 'notes', 'isActive'];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json({ loan });
  } catch (err) {
    console.error('Update loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── DELETE /api/loans/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json({ message: 'Loan deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
