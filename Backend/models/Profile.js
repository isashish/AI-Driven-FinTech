const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Financial Data (Aligned with Frontend keys)
    income: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    emi: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    investments: { type: Number, default: 0 },
    emergency: { type: Number, default: 0 },

    // Detail breakdown (optional, kept for robustness)
    otherIncome: { type: Number, default: 0 },
    rent: { type: Number, default: 0 },
    utilities: { type: Number, default: 0 },
    groceries: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    
    totalSavings: { type: Number, default: 0 },
    totalInvestments: { type: Number, default: 0 },
    emergencyFundTarget: { type: Number, default: 0 },

    // Personal Info
    age: { type: Number, default: null },
    occupation: { type: String, default: '' },
    
    // Risk profile & settings
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate',
    },
    retirementAge: { type: Number, default: 60 },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
