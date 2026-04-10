const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['sip', 'lumpsum', 'goal', 'retirement', 'custom'],
      required: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'Investment Simulation',
    },
    // Input parameters
    inputs: {
      principal: { type: Number, default: 0 },
      monthlyContribution: { type: Number, default: 0 },
      annualReturnRate: { type: Number, default: 12 },
      inflationRate: { type: Number, default: 6 },
      tenureYears: { type: Number, default: 10 },
      stepUpPercent: { type: Number, default: 0 }, // annual SIP step-up
    },
    // Computed results
    results: {
      futureValue: { type: Number, default: 0 },
      totalInvested: { type: Number, default: 0 },
      totalReturns: { type: Number, default: 0 },
      inflationAdjustedValue: { type: Number, default: 0 },
      // Year-by-year breakdown stored as JSON
      yearlyBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user-based queries
predictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
