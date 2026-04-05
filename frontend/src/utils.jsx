export const fmt  = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const fmtK = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export function calcHealth(p) {
  if (!p.income) return 0;
  const sr  = clamp(((p.savings      / p.income) * 100) / 20, 0, 1) * 25;
  const dti = clamp(1 - (p.emi       / p.income),            0, 1) * 25;
  const ir  = clamp(((p.investments  / p.income) * 100) / 15, 0, 1) * 25;
  const ef  = clamp(p.emergency / (p.expenses * 6),          0, 1) * 25;
  return Math.round(sr + dti + ir + ef);
}

export function calcEMI(P, r, n) {
  if (!P || !r || !n) return 0;
  const m = r / 12 / 100;
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
