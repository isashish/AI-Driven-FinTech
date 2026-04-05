const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const auth = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const Profile = require('../models/Profile');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');

const router = express.Router();
router.use(auth);

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Build a finance-aware system prompt using user's actual data
const buildSystemPrompt = (profile, goals, loans) => {
  const totalEMI = loans.filter(l => l.isActive).reduce((s, l) => s + (l.emiAmount || 0), 0);
  const netIncome = (profile?.income || 0) + (profile?.otherIncome || 0);
  const disposable = netIncome - (profile?.expenses || 0) - (totalEMI || profile?.emi || 0);

  return `You are FinanceAI, a knowledgeable and empathetic personal financial advisor integrated into the Smart Financial Planning app. You help users with budgeting, saving, investing, loan management, and reaching their financial goals.

## User's Financial Snapshot:
- Monthly Income: ₹${netIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${(profile?.expenses || 0).toLocaleString('en-IN')}
- Total EMI: ₹${Math.round(totalEMI || profile?.emi || 0).toLocaleString('en-IN')}
- Monthly Savings: ₹${(profile?.savings || 0).toLocaleString('en-IN')}
- Monthly Investments: ₹${(profile?.investments || 0).toLocaleString('en-IN')}
- Emergency Fund: ₹${(profile?.emergency || 0).toLocaleString('en-IN')}
- Estimated Disposable Surplus: ₹${Math.round(disposable).toLocaleString('en-IN')}
- Risk Tolerance: ${profile?.riskTolerance || 'moderate'}

## Active Goals (${goals.length}):
${goals.slice(0, 5).map(g => `- ${g.name}: ₹${g.saved.toLocaleString('en-IN')} / ₹${g.target.toLocaleString('en-IN')} (${g.priority} priority)`).join('\n') || 'No goals set yet.'}

## Active Loans (${loans.filter(l => l.isActive).length}):
${loans.filter(l => l.isActive).slice(0, 5).map(l => `- ${l.name}: EMI ₹${l.emiAmount.toLocaleString('en-IN')}/mo @ ${l.annualInterestRate}%`).join('\n') || 'No active loans.'}

## Guidelines:
- Always provide specific, actionable advice tailored to this user's data above
- Use Indian Rupee (₹) and Indian financial context (mutual funds, PPF, NPS, FD, SGB, etc.)
- Be concise but thorough; use bullet points for steps/recommendations
- If the user asks something outside finance, gently redirect them
- Never recommend specific stocks; you can suggest categories (large-cap, index funds, etc.)
- Always remind users that financial decisions should also consult a certified advisor for large sums`;
};

// ─── GET /api/chat/history ────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ userId: req.userId });
    res.json({ messages: history?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/chat/message ───────────────────────────────────────────────
router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  try {
    // Fetch user's financial data for context
    const [profile, goals, loans, chatDoc] = await Promise.all([
      Profile.findOne({ userId: req.userId }),
      Goal.find({ userId: req.userId }),
      Loan.find({ userId: req.userId }),
      ChatHistory.findOne({ userId: req.userId }),
    ]);

    const history = chatDoc?.messages || [];

    // Build messages array for Claude (last 20 exchanges for context)
    const recentHistory = history.slice(-40);
    const claudeMessages = [
      ...recentHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: buildSystemPrompt(profile, goals, loans),
      messages: claudeMessages,
    });

    const assistantReply = response.content[0]?.text || 'Sorry, I could not generate a response.';

    // Save updated history
    const newMessages = [
      ...history,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: assistantReply },
    ];

    await ChatHistory.findOneAndUpdate(
      { userId: req.userId },
      { $set: { messages: newMessages } },
      { upsert: true }
    );

    res.json({ reply: assistantReply });
  } catch (err) {
    console.error('Chat error:', err);
    if (err.status === 429) {
      return res.status(429).json({ message: 'Rate limit reached. Please try again shortly.' });
    }
    res.status(500).json({ message: 'Failed to get response from AI.' });
  }
});

// ─── DELETE /api/chat/history ─────────────────────────────────────────────
router.delete('/history', async (req, res) => {
  try {
    await ChatHistory.findOneAndUpdate(
      { userId: req.userId },
      { $set: { messages: [] } },
      { upsert: true }
    );
    res.json({ message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
