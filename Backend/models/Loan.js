const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Loan name is required'],
      trim: true,
      maxlength: [150, 'Loan name cannot exceed 150 characters'],
    },
    loanType: {
      type: String,
      enum: ['home', 'car', 'personal', 'education', 'business', 'other'],
      default: 'other',
    },
    principalAmount: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: [0, 'Principal must be positive'],
    },
    outstandingAmount: {
      type: Number,
      default: null, // defaults to principalAmount if not specified
    },
    annualInterestRate: {
      type: Number,
      required: [true, 'Annual interest rate is required'],
      min: [0, 'Interest rate must be positive'],
      max: [100, 'Interest rate seems too high'],
    },
    tenureMonths: {
      type: Number,
      required: [true, 'Loan tenure is required'],
      min: [1, 'Tenure must be at least 1 month'],
    },
    emiAmount: {
      type: Number,
      default: 0, // auto-calculated
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    lender: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate EMI before saving
loanSchema.pre('save', function (next) {
  const P = this.outstandingAmount ?? this.principalAmount;
  const r = this.annualInterestRate / 12 / 100;
  const n = this.tenureMonths;

  if (r === 0) {
    this.emiAmount = P / n;
  } else {
    this.emiAmount = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  this.emiAmount = Math.round(this.emiAmount * 100) / 100;
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
