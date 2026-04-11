export const fmt  = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const fmtK = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export function calcHealth(p) {
  if (!p || !p.income || p.income <= 0) return 0;
  
  const income = Number(p.income);
  const emi = Number(p.emi) || 0;
  const investments = Number(p.investments) || 0;
  const emergency = Number(p.emergency) || 0;
  const expenses = Number(p.expenses) || 0;

  // DERIVED SAVINGS: What's left after basics AND investments AND emergency contributions
  // This matches the logic in Profile.jsx: income - expenses - emi - investments - emergency
  const derivedSavings = Math.max(0, income - expenses - emi - investments - emergency);

  const sr  = clamp(((derivedSavings / income) * 100) / 20, 0, 1) * 25;
  const dti = clamp(1 - (emi / income), 0, 1) * 25;
  const ir  = clamp(((investments / income) * 100) / 15, 0, 1) * 25;
  
  const efTarget = expenses * 6;
  const efScore = efTarget > 0 ? clamp(emergency / efTarget, 0, 1) * 25 : 25;

  const total = Math.round(sr + dti + ir + efScore);
  return isNaN(total) ? 0 : total;
}

export function calcEMI(P, r, n, type = 'reducing') {
  if (!P || !r || !n) return 0;
  const i = r / 100;
  
  if (type === 'flat' || type === 'simple') {
    // Total Interest = Principal * Rate * (Tenure in Years) / 100
    const totalInterest = P * i * (n / 12);
    return Math.round((P + totalInterest) / n);
  }
  
  // Reducing Balance (Standard)
  const m = i / 12;
  return Math.round(P * m * Math.pow(1 + m, n) / (Math.pow(1 + m, n) - 1));
}

export function genInvestData(P, sip, rate, yrs) {
  const data = [];
  let inv = P, val = P, mr = rate / 12 / 100;
  for (let y = 0; y <= yrs; y++) {
    data.push({ year: `Y${y}`, invested: Math.round(inv), value: Math.round(val), gains: Math.round(val - inv) });
    for (let m = 0; m < 12; m++) { val = (val + sip) * (1 + mr); inv += sip; }
  }
  return data;
}

export const PIE_COLORS = ['#0EA5A0','#4F6EF7','#7C5CFC','#F59E0B','#F43F5E','#10B981'];

export const IMGS = {
  hero:    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
  invest:  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=700&auto=format&fit=crop&q=80',
  goal:    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=700&auto=format&fit=crop&q=80',
  debt:    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&auto=format&fit=crop&q=80',
  advisor: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=700&auto=format&fit=crop&q=80',
  profile: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&auto=format&fit=crop&q=80',
  whatif:  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=700&auto=format&fit=crop&q=80',
};
