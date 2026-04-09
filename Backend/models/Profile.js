const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Financial Data
  income: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  emi: { type: Number, default: 0 },
  savings: { type: Number, default: 0 },
  investments: { type: Number, default: 0 },
  emergency: { type: Number, default: 0 },

  // Detail breakdown (optional)
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
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  
  // Risk profile & settings
  riskTolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  },
  retirementAge: { type: Number, default: 60 },
  currency: { type: String, default: 'INR' },
  
  // Assets and Liabilities
  assets: {
    physicalAssets: {
      realEstate: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      vehicles: { type: Number, default: 0 },
      otherPhysical: { type: Number, default: 0 }
    },
    liquidAssets: {
      cash: { type: Number, default: 0 },
      bankBalance: { type: Number, default: 0 },
      mutualFunds: { type: Number, default: 0 },
      stocks: { type: Number, default: 0 },
      otherLiquid: { type: Number, default: 0 }
    },
    liabilities: {
      homeLoan: { type: Number, default: 0 },
      carLoan: { type: Number, default: 0 },
      personalLoan: { type: Number, default: 0 },
      otherLiabilities: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);