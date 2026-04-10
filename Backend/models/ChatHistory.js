const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    // Keep only the last N messages to manage context window
    maxMessages: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Trim messages array to maxMessages before saving
chatHistorySchema.pre('save', function (next) {
  if (this.messages.length > this.maxMessages) {
    this.messages = this.messages.slice(-this.maxMessages);
  }
  next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
