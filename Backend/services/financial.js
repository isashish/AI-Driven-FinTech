/**
 * Financial calculation utilities (server-side)
 * EMI, Health Score, SIP, SWP, Compound Interest, etc.
 */

/**
 * Calculate EMI (Equated Monthly Installment)
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenureMonths - Loan tenure in months
 */
const calculateEMI = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
};

/**
 * Generate amortization schedule for a loan
 */
const generateAmortizationSchedule = (principal, annualRate, tenureMonths) => {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const r = annualRate / 12 / 100;
  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = Math.round(balance * r * 100) / 100;
    const principalPaid = Math.round((emi - interest) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principalPaid) * 100) / 100);
    schedule.push({ month, emi, interest, principalPaid, balance });
  }
  return schedule;
};

/**
 * Calculate future value of SIP (Systematic Investment Plan)
 * Optionally with step-up (annual % increase in contribution)
 */
const calculateSIP = (monthlyAmount, annualRate, tenureYears, stepUpPercent = 0) => {
  const totalMonths = tenureYears * 12;
  const r = annualRate / 12 / 100;
  const yearlyBreakdown = [];
  let totalInvested = 0;
  let futureValue = 0;

  if (stepUpPercent === 0) {
    // Standard SIP formula
    futureValue = monthlyAmount * ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
    totalInvested = monthlyAmount * totalMonths;

    // Year-by-year for chart
    for (let y = 1; y <= tenureYears; y++) {
      const months = y * 12;
      const fv = monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      yearlyBreakdown.push({ year: y, invested: monthlyAmount * months, value: Math.round(fv) });
    }
  } else {
    // Step-up SIP (month-by-month simulation)
    let currentMonthly = monthlyAmount;
    let corpus = 0;
    let invested = 0;

    for (let month = 1; month <= totalMonths; month++) {
      if (month > 1 && (month - 1) % 12 === 0) {
        currentMonthly = currentMonthly * (1 + stepUpPercent / 100);
      }
      corpus = (corpus + currentMonthly) * (1 + r);
      invested += currentMonthly;

      if (month % 12 === 0) {
        yearlyBreakdown.push({
          year: month / 12,
          invested: Math.round(invested),
          value: Math.round(corpus),
        });
      }
    }
    futureValue = corpus;
    totalInvested = invested;
  }

  return {
    futureValue: Math.round(futureValue),
    totalInvested: Math.round(totalInvested),
    totalReturns: Math.round(futureValue - totalInvested),
    yearlyBreakdown,
  };
};

/**
 * Calculate lumpsum investment future value
 */
const calculateLumpsum = (principal, annualRate, tenureYears, inflationRate = 0) => {
  const yearlyBreakdown = [];
  for (let y = 1; y <= tenureYears; y++) {
    const value = principal * Math.pow(1 + annualRate / 100, y);
    yearlyBreakdown.push({ year: y, invested: principal, value: Math.round(value) });
  }
  const futureValue = principal * Math.pow(1 + annualRate / 100, tenureYears);
  const inflationAdjustedValue = inflationRate > 0
    ? futureValue / Math.pow(1 + inflationRate / 100, tenureYears)
    : futureValue;

  return {
    futureValue: Math.round(futureValue),
    totalInvested: principal,
    totalReturns: Math.round(futureValue - principal),
    inflationAdjustedValue: Math.round(inflationAdjustedValue),
    yearlyBreakdown,
  };
};

/**
 * Calculate monthly SIP required to reach a goal
 */
const calculateSIPForGoal = (targetAmount, currentSavings, annualRate, tenureYears) => {
  const remaining = targetAmount - currentSavings;
  if (remaining <= 0) return 0;
  const n = tenureYears * 12;
  const r = annualRate / 12 / 100;
  const sip = (remaining * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
  return Math.round(sip);
};

/**
 * Calculate financial health score (0–100)
 * Based on savings rate, emergency fund, debt ratio, and investment ratio
 */
const calculateHealthScore = (profile) => {
  const {
    income = 0,
    expenses = 0,
    emi = 0,
    savings = 0,
    investments = 0,
    emergency = 0,
    emergencyFundTarget = 0, // This can stay or be derived
  } = profile;

  if (income === 0) return { score: 0, breakdown: {}, grade: 'N/A' };

  const scores = {};

  // 1. Savings Rate (25 pts): target ≥ 20% of income
  const savingsRate = savings / income;
  scores.savings = Math.min(25, Math.round((savingsRate / 0.2) * 25));

  // 2. Debt-to-Income Ratio (25 pts): EMI ≤ 35% of income is healthy
  const dti = emi / income;
  scores.debtRatio = dti > 0.6 ? 0 : Math.round((1 - dti / 0.6) * 25);

  // 3. Emergency Fund (25 pts): target = 6 months of expenses
  const sixMonthExpenses = (expenses + emi) * 6;
  const efTarget = emergencyFundTarget > 0 ? emergencyFundTarget : sixMonthExpenses;
  scores.emergencyFund = efTarget > 0 ? Math.min(25, Math.round((emergency / efTarget) * 25)) : 0;

  // 4. Investment Rate (25 pts): target ≥ 10% of income
  const investRate = investments / income;
  scores.investment = Math.min(25, Math.round((investRate / 0.1) * 25));

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let grade = 'F';
  if (total >= 90) grade = 'A+';
  else if (total >= 80) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 50) grade = 'D';

  return { score: total, breakdown: scores, grade };
};

/**
 * Dashboard summary — aggregates profile + goals + loans
 */
const buildDashboardSummary = (profile, goals, loans) => {
  const activeLoans = loans.filter((l) => l.isActive);
  const totalEMI = activeLoans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
  const totalDebt = activeLoans.reduce((sum, l) => sum + (l.outstandingAmount ?? l.principalAmount), 0);

  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const goalProgress = totalGoalTarget > 0 ? (totalGoalSaved / totalGoalTarget) * 100 : 0;

  const healthScore = calculateHealthScore({ ...profile, emi: totalEMI || profile.emi });

  return {
    totalIncome: (profile.income || 0) + (profile.otherIncome || 0),
    totalExpenses: profile.expenses || 0,
    totalEMI: Math.round(totalEMI || profile.emi || 0),
    totalDebt: Math.round(totalDebt),
    monthlySavings: profile.savings || 0,
    totalSavings: profile.totalSavings || 0,
    monthlyInvestments: profile.investments || 0,
    totalInvestments: profile.totalInvestments || 0,
    emergencyFund: profile.emergency || 0,
    healthScore,
    goals: {
      total: goals.length,
      completed: completedGoals,
      progress: Math.round(goalProgress),
    },
    loans: {
      total: activeLoans.length,
      totalEMI: Math.round(totalEMI),
      totalDebt: Math.round(totalDebt),
    },
  };
};

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  calculateSIP,
  calculateLumpsum,
  calculateSIPForGoal,
  calculateHealthScore,
  buildDashboardSummary,
};
