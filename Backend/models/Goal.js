const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [150, 'Goal name cannot exceed 150 characters'],
    },
    target: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0, 'Target amount must be positive'],
    },
    saved: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative'],
    },
    targetDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['emergency', 'education', 'home', 'vehicle', 'travel', 'retirement', 'wedding', 'other'],
      default: 'other',
    },
    monthlySIPRequired: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
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

// Auto-mark as completed when saved >= target
goalSchema.pre('save', function (next) {
  if (this.saved >= this.target && this.target > 0) {
    this.isCompleted = true;
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
