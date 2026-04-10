const express = require('express');
const auth = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const Profile = require('../models/Profile');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');

const router = express.Router();
router.use(auth);

// ─── Try loading Gemini SDK (optional) ────────────────────────────────────────
let GoogleGenerativeAI = null;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (_) {
  console.log('ℹ️  @google/generative-ai not installed — using built-in advisor');
}

// ─── Check if a real API key is configured ────────────────────────────────────
const isValidApiKey = (key) => {
  if (!key) return false;
  const placeholders = [
    'your_gemini_api_key_here',
    'your_api_key_here',
    'your-key-here',
    'sk-ant-api03-your-key-here',
    'your_anthropic_key_here',
    '',
  ];
  return !placeholders.includes(key.trim().toLowerCase()) && key.trim().length > 10;
};

// ─── Initialize Gemini (only if valid key) ────────────────────────────────────
let genAI = null;
const getGenAI = () => {
  if (!genAI && GoogleGenerativeAI && isValidApiKey(process.env.GEMINI_API_KEY)) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (e) {
      console.warn('⚠️  Failed to init Gemini:', e.message);
    }
  }
  return genAI;
};

// ─── Build finance-aware system prompt ───────────────────────────────────────
const buildSystemPrompt = (profile, goals, loans) => {
  const totalEMI = loans.filter(l => l.isActive).reduce((s, l) => s + (l.emiAmount || 0), 0);
  const netIncome = (profile?.income || 0) + (profile?.otherIncome || 0);
  const disposable = netIncome - (profile?.expenses || 0) - (totalEMI || profile?.emi || 0);

  return `You are FinanceAI, a knowledgeable and empathetic personal financial advisor integrated into the AI-FinTech Smart Financial Planning app. You help users with budgeting, saving, investing, loan management, and reaching their financial goals.

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
- Use Indian Rupee (₹) and Indian financial context (mutual funds, PPF, NPS, FD, SGB, ELSS, etc.)
- Be concise but thorough; use bullet points for steps/recommendations
- If the user asks something outside finance, gently redirect them
- Never recommend specific stocks; you can suggest categories (large-cap, index funds, etc.)
- Always remind users that financial decisions should also consult a certified advisor for large sums
- Format responses clearly with headers and bullet points where applicable`;
};

// ─── Smart built-in financial advisor (no API needed) ─────────────────────────
const getSmartResponse = (message, profile, goals, loans) => {
  const msg = message.toLowerCase().trim();
  const income = (profile?.income || 0) + (profile?.otherIncome || 0);
  const expenses = profile?.expenses || 0;
  const savings = profile?.savings || 0;
  const emi = profile?.emi || 0;
  const investments = profile?.investments || 0;
  const emergency = profile?.emergency || 0;
  const risk = profile?.riskTolerance || 'moderate';
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const emiRatio = income > 0 ? Math.round((emi / income) * 100) : 0;
  const disposable = income - expenses - emi;
  const monthsOfEmergency = expenses > 0 ? (emergency / expenses).toFixed(1) : 0;
  const totalEMI = loans.filter(l => l.isActive).reduce((s, l) => s + (l.emiAmount || 0), 0);

  const fmtINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  // ── Health score ───────────────────────────────────────────
  if (msg.includes('health score') || msg.includes('financial health') || (msg.includes('improve') && msg.includes('score'))) {
    let advice = `## 📊 Your Financial Health Analysis\n\n`;
    advice += `Here's a breakdown based on your current profile:\n\n`;

    // Savings rate
    if (savingsRate >= 30) {
      advice += `• ✅ **Savings Rate: ${savingsRate}%** — Excellent! You're saving well above the recommended 20%\n`;
    } else if (savingsRate >= 20) {
      advice += `• ✅ **Savings Rate: ${savingsRate}%** — Good! You're meeting the recommended 20% target\n`;
    } else if (savingsRate >= 10) {
      advice += `• ⚠️ **Savings Rate: ${savingsRate}%** — Below target. Aim for at least 20% of income (${fmtINR(income * 0.2)}/month)\n`;
    } else {
      advice += `• 🔴 **Savings Rate: ${savingsRate}%** — Critical! Try to save at least ${fmtINR(income * 0.2)}/month\n`;
    }

    // EMI burden
    if (emiRatio <= 30) {
      advice += `• ✅ **EMI Burden: ${emiRatio}%** — Healthy! Well within the safe 30-40% limit\n`;
    } else if (emiRatio <= 50) {
      advice += `• ⚠️ **EMI Burden: ${emiRatio}%** — High. Try to keep EMIs below 30% of income\n`;
    } else {
      advice += `• 🔴 **EMI Burden: ${emiRatio}%** — Critical! Consider debt consolidation or faster repayment\n`;
    }

    // Emergency fund
    if (parseFloat(monthsOfEmergency) >= 6) {
      advice += `• ✅ **Emergency Fund: ${monthsOfEmergency} months** — Great! You have solid protection\n`;
    } else if (parseFloat(monthsOfEmergency) >= 3) {
      advice += `• ⚠️ **Emergency Fund: ${monthsOfEmergency} months** — Decent, but aim for 6 months (${fmtINR(expenses * 6)})\n`;
    } else {
      advice += `• 🔴 **Emergency Fund: ${monthsOfEmergency} months** — Priority #1! Build to ${fmtINR(expenses * 6)} (6 months)\n`;
    }

    // Investment ratio
    const investRatio = income > 0 ? Math.round((investments / income) * 100) : 0;
    if (investRatio >= 15) {
      advice += `• ✅ **Investment Ratio: ${investRatio}%** — Excellent wealth-building momentum\n`;
    } else if (investRatio >= 10) {
      advice += `• ⚠️ **Investment Ratio: ${investRatio}%** — Good, but increasing to 15-20% will accelerate growth\n`;
    } else {
      advice += `• 🔴 **Investment Ratio: ${investRatio}%** — Consider starting a SIP of at least ${fmtINR(income * 0.15)}/month\n`;
    }

    advice += `\n## 🎯 Top 3 Actions:\n`;
    if (parseFloat(monthsOfEmergency) < 3) {
      advice += `1. **Build emergency fund** to ${fmtINR(expenses * 3)} immediately (use liquid funds or FD)\n`;
    }
    if (savingsRate < 20) {
      advice += `${parseFloat(monthsOfEmergency) < 3 ? '2' : '1'}. **Increase savings** by cutting discretionary spending by ${fmtINR(income * 0.05)}/month\n`;
    }
    if (investRatio < 10) {
      advice += `3. **Start SIP** of ${fmtINR(Math.max(500, income * 0.1))} in a Nifty 50 index fund\n`;
    }
    if (savingsRate >= 20 && parseFloat(monthsOfEmergency) >= 3 && investRatio >= 10) {
      advice += `1. **Increase SIP step-up** by 10% annually\n2. **Diversify** into debt funds + gold (Sovereign Gold Bonds)\n3. **Review insurance** — ensure term cover of 10x annual income\n`;
    }

    return advice;
  }

  // ── SIP / Systematic Investment Plan ───────────────────────
  if (msg.includes('sip') || msg.includes('systematic investment')) {
    const sipAmt = Math.max(500, Math.round(disposable * 0.3 / 100) * 100);
    return `## 📊 SIP (Systematic Investment Plan) Guide\n\nBased on your disposable income of ${fmtINR(disposable)}/month:\n\n### Recommended SIP Allocation:\n• **Suggested SIP**: ${fmtINR(sipAmt)}/month\n• Start date: 1st or 5th of every month (auto-debit from salary account)\n\n### SIP Growth Projections (${fmtINR(sipAmt)}/month):\n• **5 years** @ 12%: ~${fmtINR(sipAmt * 5 * 12 * 1.35)}\n• **10 years** @ 12%: ~${fmtINR(sipAmt * 10 * 12 * 1.8)}\n• **20 years** @ 12%: ~${fmtINR(sipAmt * 20 * 12 * 3.5)}\n\n### Fund Selection by Risk:\n${risk === 'aggressive' ? '• **Large Cap**: 30% (Nifty 50 Index Fund)\n• **Mid Cap**: 40% (Mid-cap Fund)\n• **Small Cap**: 20% (Small-cap Fund)\n• **International**: 10% (US/Global fund)' : risk === 'conservative' ? '• **Large Cap**: 50% (Nifty 50 Index Fund)\n• **Debt Fund**: 30% (Short-term debt fund)\n• **Hybrid**: 20% (Balanced Advantage Fund)' : '• **Large Cap**: 40% (Nifty 50 Index Fund)\n• **Mid Cap**: 30% (Mid-cap Fund)\n• **Flexi Cap**: 20% (Flexi-cap fund)\n• **Debt**: 10% (Short-term debt fund)'}\n\n### 💡 Pro Tips:\n• Use **step-up SIP** — increase by 10% every year\n• Never stop SIPs during market corrections\n• Minimum 7-year horizon for equity SIPs\n• Use the **Investment Calculator** in this app to model exact returns!`;
  }

  // ── Emergency fund ─────────────────────────────────────────
  if (msg.includes('emergency') || msg.includes('emergency fund') || msg.includes('rainy day')) {
    const targetFund = expenses * 6;
    const gap = Math.max(0, targetFund - emergency);
    const monthsToGoal = disposable > 0 ? Math.ceil(gap / (disposable * 0.4)) : 0;

    return `## 🛡️ Emergency Fund Strategy\n\n### Your Current Status:\n• **Current Emergency Fund**: ${fmtINR(emergency)}\n• **Target (6 months expenses)**: ${fmtINR(targetFund)}\n• **Gap**: ${fmtINR(gap)}\n${gap > 0 ? `• **Time to goal**: ~${monthsToGoal} months (saving 40% of surplus)\n` : '• ✅ You have a healthy emergency fund!\n'}\n### Where to Park Emergency Fund:\n• **Liquid Mutual Funds** (60%): ~6-7% returns, instant redemption\n• **Bank FD with sweep-in** (25%): ~6.5-7% returns, safe\n• **High-yield Savings Account** (15%): Instant access\n\n### How to Build It:\n1. Set aside ${fmtINR(Math.min(disposable * 0.4, gap))}/month automatically\n2. Park any bonus or windfall income here first\n3. Don't invest emergency fund in stocks or equity\n4. Review every 6 months and adjust for expense changes\n\n### 💡 Golden Rules:\n• Never touch it for non-emergencies\n• Keep it separate from your regular savings account\n• Medical emergency + Job loss buffer = True emergency fund`;
  }

  // ── Loan / EMI / Debt ──────────────────────────────────────
  if (msg.includes('loan') || msg.includes('emi') || msg.includes('debt') || msg.includes('prepay')) {
    const activeLoans = loans.filter(l => l.isActive);
    let response = `## 💳 Debt Optimization Strategy\n\n`;

    if (activeLoans.length > 0) {
      response += `### Your Active Loans:\n`;
      activeLoans.forEach(l => {
        response += `• **${l.name}**: EMI ${fmtINR(l.emiAmount)}/mo @ ${l.annualInterestRate}% p.a.\n`;
      });
      response += `• **Total EMI Load**: ${fmtINR(totalEMI)}/month (${income > 0 ? Math.round(totalEMI / income * 100) : 0}% of income)\n\n`;

      // Sort by interest rate for avalanche method
      const sorted = [...activeLoans].sort((a, b) => b.annualInterestRate - a.annualInterestRate);
      if (sorted.length > 1) {
        response += `### 🎯 Recommended: Avalanche Method\nPay minimum on all, put extra towards **${sorted[0].name}** (highest interest at ${sorted[0].annualInterestRate}%)\n\n`;
      }
    } else {
      response += `### ✅ No Active Loans — Great Position!\n\nYou're debt-free. Focus fully on wealth building:\n`;
    }

    response += `### Prepayment vs Investment Decision:\n`;
    if (activeLoans.some(l => l.annualInterestRate > 10)) {
      response += `• **Prepay first**: Your high-interest loans (>10%) beat most investment returns\n`;
      response += `• After clearing high-interest debt, invest the freed EMI into SIPs\n`;
    } else {
      response += `• **Invest alongside**: Your loan rates are manageable. SIP returns (12-15%) likely beat loan costs\n`;
      response += `• Use 50% surplus for prepayment, 50% for SIP investments\n`;
    }

    response += `\n### 💡 Quick Wins:\n• Extra ₹2,000/month on home loan saves lakhs in total interest\n• Credit card debt (36-42% interest) = Pay off IMMEDIATELY\n• Balance transfer to lower-rate loans when possible\n• Use the **Debt Optimizer** page to simulate prepayment savings!`;

    return response;
  }

  // ── Tax saving ─────────────────────────────────────────────
  if (msg.includes('tax') || msg.includes('80c') || msg.includes('save tax') || msg.includes('deduction') || msg.includes('80d') || msg.includes('nps')) {
    const elssAmt = Math.min(150000, Math.max(500, income * 12 * 0.1));
    return `## 🏦 Tax Saving Strategy (FY 2024-25)\n\nBased on your income of ${fmtINR(income)}/month (${fmtINR(income * 12)}/year):\n\n### Section 80C — ₹1,50,000 limit:\n• **ELSS Mutual Funds**: ${fmtINR(elssAmt)} (best returns, 3-yr lock-in)\n• **EPF/VPF**: Check employer contribution\n• **PPF**: ${fmtINR(Math.min(50000, 150000 - elssAmt))} (safe, 7.1%, 15-yr)\n• **Life Insurance Premium** / **Home Loan Principal**: If applicable\n\n### Section 80CCD(1B) — Extra ₹50,000:\n• **NPS (National Pension System)**: Additional ₹50,000 deduction\n• Choose aggressive allocation (75% equity) if under 40\n\n### Section 80D — Health Insurance:\n• **Self/Family**: Up to ₹25,000 premium deduction\n• **Parents (60+)**: Up to ₹50,000 deduction\n• Total possible: ₹75,000 tax benefit\n\n### Other Deductions:\n• **HRA**: If paying rent, claim HRA exemption\n• **Home Loan Interest**: ₹2,00,000 under Section 24(b)\n• **Education Loan Interest**: Full deduction under Section 80E\n\n### 💡 Best Combo for Maximum Savings:\n1. ELSS SIP: ₹12,500/month (covers 80C)\n2. NPS: ₹4,167/month (covers 80CCD)\n3. Health Insurance: ₹2,000/month (covers 80D)\n4. **Total monthly**: ~₹18,667 → Saves ₹65,000-₹90,000 in taxes!`;
  }

  // ── Retirement ─────────────────────────────────────────────
  if (msg.includes('retirement') || msg.includes('retire') || msg.includes('corpus') || msg.includes('fire')) {
    const age = 30; // Assume 30, can be refined
    const retireAge = 60;
    const yearsLeft = retireAge - age;
    const monthlyExpInflated = expenses * Math.pow(1.06, yearsLeft);
    const corpusNeeded = monthlyExpInflated * 12 * 25;
    const sipForRetirement = Math.round(corpusNeeded / (yearsLeft * 12 * 3.5));

    return `## 🎯 Retirement Planning\n\n### The Math (assuming age ~30, retire at 60):\n• **Current Monthly Expenses**: ${fmtINR(expenses)}\n• **Inflation-adjusted at 60** (6%/yr): ~${fmtINR(monthlyExpInflated)}/month\n• **Corpus Needed** (25x rule): ~${fmtINR(corpusNeeded)}\n\n### How to Get There:\n• **Required SIP**: ~${fmtINR(sipForRetirement)}/month at 12% returns\n• **With 10% annual step-up**: Start with ~${fmtINR(Math.round(sipForRetirement * 0.6))}/month\n\n### Recommended Allocation by Age:\n**Under 35:**\n• 70% Equity MF (Index + Mid-cap SIP)\n• 15% NPS (Equity allocation)\n• 10% PPF\n• 5% Gold (SGBs)\n\n**35-50:**\n• 50% Equity MF\n• 20% NPS\n• 20% PPF/Debt Funds\n• 10% Gold\n\n**50+:**\n• 30% Equity MF\n• 20% NPS\n• 40% Debt Funds/FD\n• 10% Gold\n\n### 💡 Key Strategies:\n• **EPF + PPF** = Foundation (safe, guaranteed)\n• **ELSS + Index Fund SIP** = Growth engine\n• **NPS** = Extra tax benefit + pension\n• **Health Insurance** = Must-have cushion for medical costs\n• Use the **What-If Simulator** to model your retirement scenario!`;
  }

  // ── Investment / Mutual Funds ──────────────────────────────
  if (msg.includes('invest') || msg.includes('wealth') || msg.includes('mutual fund') || msg.includes('where to invest') || msg.includes('start investing')) {
    return `## 📈 Investment Strategy\n\nBased on your risk profile: **${risk}** | Surplus: ${fmtINR(disposable)}/month\n\n### Beginner-Friendly Portfolio:\n${risk === 'aggressive' ? '• **Nifty 50 Index Fund**: 30% (~${fmtINR(disposable * 0.3)}/mo)\n• **Nifty Next 50**: 20% (~' + fmtINR(disposable * 0.2) + '/mo)\n• **Mid-cap Fund**: 25% (~' + fmtINR(disposable * 0.25) + '/mo)\n• **Small-cap Fund**: 15% (~' + fmtINR(disposable * 0.15) + '/mo)\n• **International Fund**: 10% (~' + fmtINR(disposable * 0.1) + '/mo)' : risk === 'conservative' ? '• **Nifty 50 Index Fund**: 35% (~' + fmtINR(disposable * 0.35) + '/mo)\n• **Balanced Advantage Fund**: 25% (~' + fmtINR(disposable * 0.25) + '/mo)\n• **Short-term Debt Fund**: 25% (~' + fmtINR(disposable * 0.25) + '/mo)\n• **Liquid Fund**: 15% (~' + fmtINR(disposable * 0.15) + '/mo)' : '• **Nifty 50 Index Fund**: 35% (~' + fmtINR(disposable * 0.35) + '/mo)\n• **Flexi-cap Fund**: 25% (~' + fmtINR(disposable * 0.25) + '/mo)\n• **Mid-cap Fund**: 20% (~' + fmtINR(disposable * 0.2) + '/mo)\n• **Short-term Debt Fund**: 10% (~' + fmtINR(disposable * 0.1) + '/mo)\n• **Gold (SGB)**: 10% (~' + fmtINR(disposable * 0.1) + '/mo)'}\n\n### Safe Investment Options:\n• **PPF**: 7.1% p.a. (tax-free, 15-yr lock-in)\n• **Sukanya Samriddhi**: 8.2% (if you have a daughter)\n• **Senior Citizen Savings Scheme**: 8.2% (for parents 60+)\n• **Sovereign Gold Bonds**: 2.5% interest + gold appreciation\n• **FD**: 6-7.5% (for short-term parking)\n\n### 💡 Golden Rules:\n1. SIP > Lumpsum for volatile markets\n2. Never invest money needed in next 3 years in equity\n3. Diversify across asset classes\n4. Review portfolio every 6 months, rebalance annually\n5. Don't chase past returns — stick to your asset allocation`;
  }

  // ── Budget / Expenses ──────────────────────────────────────
  if (msg.includes('budget') || msg.includes('expense') || msg.includes('spend') || msg.includes('save money') || msg.includes('cut cost')) {
    return `## 💰 Budgeting Framework\n\n### Your Current Breakdown:\n• **Income**: ${fmtINR(income)}/month\n• **Expenses**: ${fmtINR(expenses)} (${income > 0 ? Math.round(expenses / income * 100) : 0}%)\n• **EMI**: ${fmtINR(emi)} (${emiRatio}%)\n• **Savings**: ${fmtINR(savings)} (${savingsRate}%)\n• **Surplus**: ${fmtINR(disposable)}\n\n### Recommended 40-30-20-10 Budget:\n• **40% Needs** (${fmtINR(income * 0.4)}): Rent, groceries, utilities, insurance\n• **30% Wants** (${fmtINR(income * 0.3)}): Dining, entertainment, shopping\n• **20% Savings/Investment** (${fmtINR(income * 0.2)}): SIPs, FDs, PPF\n• **10% EMI/Debt** (${fmtINR(income * 0.1)}): Keep debt minimal\n\n### 🎯 Quick Wins to Save More:\n1. **Audit subscriptions**: Cancel unused OTT/gym memberships\n2. **Cook more**: Saves ₹3,000-5,000/month vs eating out\n3. **Switch to UPI cashback**: Earn on everyday spends\n4. **Compare insurance**: Annual review can save thousands\n5. **Automate SIP on salary day**: Forces savings before spending\n\n### Track & Optimize:\n• Set expense limits for each category\n• Review spending every Sunday (15-minute habit)\n• Use the **Financial Profile** page to update and track your budget!`;
  }

  // ── PPF ────────────────────────────────────────────────────
  if (msg.includes('ppf') || msg.includes('public provident fund')) {
    return `## 🏛️ PPF (Public Provident Fund)\n\n### Key Features:\n• **Interest Rate**: 7.1% per annum (compounded annually)\n• **Lock-in Period**: 15 years (extensions in 5-year blocks)\n• **Annual Limit**: ₹500 to ₹1,50,000\n• **Tax Status**: EEE (Exempt-Exempt-Exempt) — best tax treatment!\n\n### How Much to Invest:\n• **Maximum annual**: ₹1,50,000 (₹12,500/month)\n• **Sweet spot**: ${fmtINR(Math.min(12500, disposable * 0.2))}/month\n\n### Growth Projection:\n• ₹1,50,000/year for 15 years → **~₹40.7 Lakhs** at maturity\n• ₹1,50,000/year for 25 years → **~₹99.9 Lakhs** (with extension)\n\n### When PPF Makes Sense:\n• ✅ You want guaranteed, risk-free returns\n• ✅ You're in the 20-30% tax bracket (max tax savings)\n• ✅ Long-term goal (child education, retirement)\n• ❌ Not ideal if you need liquidity in <7 years\n\n### 💡 Pro Tips:\n• Invest before 5th of every month to earn full month's interest\n• Partial withdrawal allowed after 7th year\n• Loan against PPF available from 3rd to 6th year`;
  }

  // ── Gold / SGB ─────────────────────────────────────────────
  if (msg.includes('gold') || msg.includes('sgb') || msg.includes('sovereign gold')) {
    return `## 🥇 Gold Investment Guide\n\n### Best Way to Invest: Sovereign Gold Bonds (SGBs)\n• **Interest**: 2.5% per annum (paid semi-annually) + gold appreciation\n• **Tenure**: 8 years (exit option after 5th year)\n• **Tax**: LTCG tax-free at maturity!\n• **Min investment**: 1 gram (~₹6,500-7,000)\n\n### Why Gold in Your Portfolio:\n• **Hedge** against inflation and currency depreciation\n• **Negative correlation** with equity — stabilizes portfolio\n• **Recommended allocation**: 5-10% of total investments\n• For you: ~${fmtINR(disposable * 0.1)}/month in Gold ETF or SGB\n\n### Gold Options Compared:\n• **SGB**: Best overall (interest + tax-free LTCG) ✅\n• **Gold ETF**: Good for trading, no interest\n• **Digital Gold**: Convenient but higher charges\n• **Physical Gold**: Avoid (storage risk, making charges)\n\n### 💡 Strategy:\n1. Allocate 10% of your SIP to Gold ETF/SGB\n2. Buy SGBs whenever RBI issues new tranches\n3. Hold for minimum 5 years for best returns\n4. Don't over-allocate — gold doesn't compound like equity`;
  }

  // ── Insurance ──────────────────────────────────────────────
  if (msg.includes('insurance') || msg.includes('term plan') || msg.includes('life cover') || msg.includes('health insurance')) {
    return `## 🛡️ Insurance Guide\n\n### Term Life Insurance (MUST HAVE):\n• **Cover needed**: 10-15x annual income = ${fmtINR(income * 12 * 12)}\n• **Ideal premium**: ₹8,000-15,000/year for ₹1 Crore cover (age 25-35)\n• **Type**: Pure term plan (NOT endowment/money-back/ULIP)\n• **Top providers**: LIC Tech Term, HDFC Click2Protect, ICICI iProtect\n\n### Health Insurance (CRITICAL):\n• **Cover needed**: At least ₹10-15 Lakhs (family floater)\n• **Super top-up**: Add ₹25-50 Lakhs super top-up for ₹3,000-5,000/year\n• **Premium**: ₹15,000-25,000/year for ₹10L family cover\n• **Tax benefit**: Section 80D deduction up to ₹25,000\n\n### Insurance Do's & Don'ts:\n• ✅ Buy term + health insurance EARLY (lower premiums)\n• ✅ Read claim settlement ratio (CSR > 95% is good)\n• ❌ Avoid investment-cum-insurance plans (ULIP, endowment)\n• ❌ Don't over-insure — focus on term + health only\n• ❌ Never treat insurance as an investment\n\n### 💡 Action Items:\n1. Get ₹1 Crore term plan → ~₹800-1,200/month\n2. Get ₹10L family health cover → ~₹1,500-2,000/month\n3. Add critical illness rider for ~₹200/month extra`;
  }

  // ── Greetings ──────────────────────────────────────────────
  if (msg.match(/^(hi|hello|hey|namaste|good morning|good evening|how are you)/)) {
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good morning' : time < 17 ? 'Good afternoon' : 'Good evening';
    return `## ${greeting}! 👋\n\nI'm your personalized AI Financial Advisor. I have your complete financial profile loaded.\n\n### Your Quick Snapshot:\n• **Monthly Income**: ${fmtINR(income)}\n• **Savings Rate**: ${savingsRate}%\n• **EMI Load**: ${emiRatio}% of income\n• **Emergency Cover**: ${monthsOfEmergency} months\n\nWhat would you like to discuss today?\n\n• 📊 How to improve your financial health score\n• 💰 Budget optimization strategies\n• 📈 Investment & SIP recommendations\n• 💳 Debt management & prepayment\n• 🏦 Tax-saving options\n• 🎯 Retirement planning\n• 🛡️ Insurance review`;
  }

  // ── What should I do / where to start ──────────────────────
  if (msg.includes('what should i do') || msg.includes('where to start') || msg.includes('financial plan') || msg.includes('advice') || msg.includes('suggest') || msg.includes('recommend') || msg.includes('guide')) {
    let plan = `## 🗺️ Your Personalized Financial Roadmap\n\n`;
    plan += `Based on your profile (Income: ${fmtINR(income)}, Surplus: ${fmtINR(disposable)}):\n\n`;

    plan += `### Step 1: Emergency Fund 🛡️\n`;
    if (parseFloat(monthsOfEmergency) < 3) {
      plan += `• **PRIORITY**: Build to ${fmtINR(expenses * 3)} (3 months)\n• Action: Save ${fmtINR(Math.min(disposable * 0.5, expenses * 3 - emergency))}/month in liquid fund\n\n`;
    } else if (parseFloat(monthsOfEmergency) < 6) {
      plan += `• ✅ Good start! Top up to ${fmtINR(expenses * 6)} (6 months)\n\n`;
    } else {
      plan += `• ✅ Done! You have ${monthsOfEmergency} months covered\n\n`;
    }

    plan += `### Step 2: Insurance 🏥\n`;
    plan += `• Term Insurance: ₹1 Crore cover (~₹1,000/month)\n• Health Insurance: ₹10-15 Lakhs family floater (~₹1,500/month)\n\n`;

    plan += `### Step 3: Debt Management 💳\n`;
    if (totalEMI > 0) {
      plan += `• Total EMIs: ${fmtINR(totalEMI)} — ${emiRatio > 40 ? 'reduce aggressively' : 'manageable, continue planned'}\n\n`;
    } else {
      plan += `• ✅ No active debt — excellent!\n\n`;
    }

    plan += `### Step 4: Investments 📈\n`;
    plan += `• Start SIP: ${fmtINR(Math.max(500, Math.round(disposable * 0.4 / 100) * 100))}/month in index funds\n• PPF: ${fmtINR(Math.min(12500, Math.round(disposable * 0.15 / 100) * 100))}/month\n• NPS: ${fmtINR(Math.min(4167, Math.round(disposable * 0.1 / 100) * 100))}/month for extra tax saving\n\n`;

    plan += `### Step 5: Goals 🎯\n`;
    if (goals.length > 0) {
      goals.slice(0, 3).forEach(g => {
        const gap = g.target - g.saved;
        plan += `• **${g.name}**: ${fmtINR(gap)} remaining — allocate ${fmtINR(Math.round(gap / 24))}/month (2-year plan)\n`;
      });
    } else {
      plan += `• Set specific goals in the **Goal Planner** page!\n`;
    }

    return plan;
  }

  // ── ELSS ───────────────────────────────────────────────────
  if (msg.includes('elss') || msg.includes('equity linked')) {
    return `## 📊 ELSS (Equity Linked Savings Scheme)\n\n### Why ELSS is the Best 80C Option:\n• **Shortest lock-in**: Only 3 years (vs PPF 15 years)\n• **Highest potential returns**: 12-15% historical average\n• **Tax saving**: Up to ₹46,800 (₹1.5L × 30% bracket)\n• **SIP mode**: Invest ₹12,500/month = ₹1.5L/year\n\n### Top Performing ELSS Categories:\n• Index-based ELSS (lowest expense ratio)\n• Large-cap focused ELSS (stable)\n• Multi-cap ELSS (higher growth potential)\n\n### Optimal Strategy:\n1. Start SIP of ₹12,500/month in 1-2 ELSS funds\n2. Each SIP installment has its own 3-year lock-in\n3. After lock-in, decide: Continue or switch to non-ELSS fund\n4. Don't redeem just because lock-in ends — stay invested!\n\n### 💡 ELSS vs PPF:\n• ELSS: Higher returns, market risk, 3-yr lock-in\n• PPF: Guaranteed 7.1%, zero risk, 15-yr lock-in\n• **Best approach**: Do BOTH — ELSS for growth, PPF for safety`;
  }

  // ── Thank you ──────────────────────────────────────────────
  if (msg.match(/^(thanks|thank you|thx|ty|great|awesome|helpful|perfect)/)) {
    return `You're welcome! 😊\n\nRemember, the key to financial success is **consistency**:\n• Keep your SIPs running\n• Review your plan quarterly\n• Increase investments with every salary hike\n\nFeel free to ask me anything else about your finances. I'm always here to help!\n\n💡 **Quick tip**: Visit the **Goal Planner** and **What-If Simulator** pages to model different scenarios for your financial goals.`;
  }

  // ── Default / catch-all ────────────────────────────────────
  return `## 💬 I'm Your AI Financial Advisor!\n\nI can help you with personalized advice on:\n\n• 📊 **Financial Health Score** — "How can I improve my score?"\n• 💰 **Budgeting** — "Help me create a budget"\n• 📈 **Investments & SIP** — "Where should I invest?"\n• 💳 **Loans & Debt** — "Should I prepay my loan?"\n• 🏦 **Tax Saving** — "Best tax-saving options for me?"\n• 🎯 **Retirement** — "How much do I need for retirement?"\n• 🛡️ **Emergency Fund** — "How to build an emergency fund?"\n• 🥇 **Gold & SGB** — "Should I invest in gold?"\n• 🏥 **Insurance** — "Do I need term insurance?"\n• 📋 **PPF / ELSS / NPS** — "PPF vs ELSS — which is better?"\n\nAll my advice is **personalized** using your actual financial data. Just ask a question!`;
};


// ─── GET /api/chat/history ────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ userId: req.userId });
    res.json({ messages: history?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/chat/message ───────────────────────────────────────────────────
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
    let assistantReply;

    const ai = getGenAI();

    if (ai) {
      // ── Gemini API path ──────────────────────────────────────
      try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemPrompt = buildSystemPrompt(profile, goals, loans);

        const recentHistory = history.slice(-40);
        const geminiHistory = recentHistory.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({
          history: geminiHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        const result = await chat.sendMessage(message.trim());
        assistantReply = result.response.text();
      } catch (geminiErr) {
        console.warn('⚠️  Gemini API failed, falling back to built-in advisor:', geminiErr.message);
        // Fallback to smart built-in advisor
        assistantReply = getSmartResponse(message.trim(), profile, goals, loans);
      }
    } else {
      // ── Smart built-in advisor (no API key needed) ───────────
      assistantReply = getSmartResponse(message.trim(), profile, goals, loans);
    }

    // Save updated history to MongoDB
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
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─── DELETE /api/chat/history ──────────────────────────────────────────────────
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
