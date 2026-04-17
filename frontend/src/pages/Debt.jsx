import React, { useState } from 'react';
import '../styles/debt.css';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, StatCard, RangeInput, Badge, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { calcEMI, fmtK, IMGS } from '../utils.jsx';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { profileAPI, loansAPI } from '../api.js';

export default function Debt({ profile = {}, onRefresh }) {
  const { T } = useTheme();
  const [loans, setLoans] = useState([]);
  const [strategy, setStrategy] = useState('avalanche');
  const [investRet, setInvestRet] = useState(12);
  const [extra, setExtra] = useState(0);
  const [lumpsum, setLumpsum] = useState(0);
  const [newL, setNewL] = useState({ name: 'Credit Card', principal: 100000, rate: 16, months: 24, type: 'reducing', ratePeriod: 'yearly' });

  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLoans = async () => {
    try {
      const res = await loansAPI.getAll();
      setLoans(res.data.loans || []);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    }
  };

  // Sync loans with database on load
  React.useEffect(() => {
    fetchLoans();
  }, [profile]);

  const syncToDb = async (newList) => {
    // This is now handled by individual create/delete calls in the new architecture
    if (onRefresh) onRefresh();
  };

  const handleAdd = async () => {
    if (!newL.name || !newL.principal || !newL.rate || !newL.months) {
      alert("Please fill in all loan details before saving.");
      return;
    }
    try {
      // Map frontend fields to DB model
      const dbLoan = {
        name: newL.name,
        principalAmount: Number(newL.principal),
        annualInterestRate: Number(newL.ratePeriod === 'monthly' ? newL.rate * 12 : newL.rate),
        tenureMonths: Number(newL.months),
        loanType: (function() {
          const n = newL.name.toLowerCase();
          if (n.includes('home')) return 'home';
          if (n.includes('car')) return 'car';
          if (n.includes('educ')) return 'education';
          if (n.includes('bus')) return 'business';
          if (n.includes('pers')) return 'personal';
          return 'other';
        })()
      };
      
      const response = await loansAPI.create(dbLoan);
      await fetchLoans(); // Refresh list from DB
      setNewL({ name: '', principal: 0, rate: 0, months: 0, type: 'reducing', ratePeriod: 'yearly' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Add loan failed:', err);
      const msg = err.response?.data?.message || "Check your inputs and try again.";
      alert(`Failed to save loan: ${msg}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await loansAPI.delete(id);
      fetchLoans(); // Refresh from DB
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Delete loan failed:', err);
    }
  };
  const sorted = [...loans].sort((a, b) => {
    const rateA = a.annualInterestRate || a.rate || 0;
    const rateB = b.annualInterestRate || b.rate || 0;
    const princA = a.principalAmount || a.principal || 0;
    const princB = b.principalAmount || b.principal || 0;
    return strategy === 'avalanche' ? rateB - rateA : princA - princB;
  });

  const getEffRate = (l) => {
    const r = l.annualInterestRate || l.rate || 0;
    return l.ratePeriod === 'monthly' ? r * 12 : r;
  };

  const totalEMI = loans.reduce((s, l) => {
    const r = l.annualInterestRate || l.rate || 0;
    const p = l.principalAmount || l.principal || 0;
    const m = l.tenureMonths || l.months || 0;
    return s + calcEMI(p, getEffRate(l), m, l.type || 'reducing');
  }, 0);

  const totalInt = loans.reduce((s, l) => {
    const p = l.principalAmount || l.principal || 0;
    const r = l.annualInterestRate || l.rate || 0;
    const m = l.tenureMonths || l.months || 0;
    const e = calcEMI(p, getEffRate(l), m, l.type || 'reducing');
    return s + (e * m - p);
  }, 0);

  const maxRate = Math.max(...loans.map(l => l.annualInterestRate || l.rate || 0), 0);

  let totalInterestSaved = 0;
  let totalMonthsSaved = 0;
  let maxOptimizedMonths = 0;

  const optimizedData = sorted.map((loan, i) => {
    const r = loan.rate || loan.annualInterestRate || 0;
    const principal = loan.principal || loan.principalAmount || 0;
    const months = loan.months || loan.tenureMonths || 0;
    
    const standardEMI = calcEMI(principal, getEffRate({ ...loan, rate: r }), months, loan.type || 'reducing');
    
    // Apply lumpsum ONLY to the first target loan
    const currentPrincipal = i === 0 ? Math.max(0, principal - lumpsum) : principal;
    const bonus = i === 0 ? extra : 0;
    
    const newMonths = currentPrincipal <= 0 ? 0 : Math.max(1, Math.round(currentPrincipal / (standardEMI + bonus)));
    const monthsSaved = months - newMonths;
    const interestSaved = (standardEMI * months - principal) - ((standardEMI + bonus) * newMonths - currentPrincipal);
    
    if (newMonths > maxOptimizedMonths) maxOptimizedMonths = newMonths;

    if (monthsSaved > 0) {
      totalMonthsSaved += monthsSaved;
      totalInterestSaved += interestSaved;
    }
    
    return {
      ...loan,
      id: loan._id || loan.id,
      principal,
      rate: r,
      months,
      newMonths,
      monthsSaved,
      interestSaved: Math.max(0, interestSaved),
      isTarget: i === 0 && (extra > 0 || lumpsum > 0),
      isQuickWin: strategy === 'snowball' && i === 0
    };
  });

  const payoffData = optimizedData.map(l => ({
    name: l.name.slice(0, 10),
    Standard: l.months,
    Optimized: l.newMonths
  }));

  const updateLoan = (id, key, val) => setLoans(ls => ls.map(l => l.id === id ? { ...l, [key]: val } : l));

  // Predictive Add
  const effNewRate = newL.ratePeriod === 'monthly' ? (newL.rate || 0) * 12 : (newL.rate || 0);
  const previewEMI = calcEMI(newL.principal || 0, effNewRate, newL.months || 0, newL.type);
  const previewInt = (previewEMI * (newL.months || 0)) - (newL.principal || 0);

  return (
    <div className="dt-page">
      <ImgBanner src={IMGS.debt} title="Debt Snowball / Avalanche Optimizer" subtitle="AI-powered debt repayment strategy with intelligent decision engine" color={T.rose} />

      {/* AI ADVANCED SUMMARY BANNER */}
      <Card style={{
        background: `linear-gradient(135deg, ${T.rose}22, ${T.teal}22)`,
        marginBottom: 20,
        padding: '24px',
        border: `1.5px solid ${T.rose}44`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, marginBottom: 4 }}>🏁 THE FINISH LINE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.text }}>
            DEBT FREE BY: <span style={{ color: totalMonthsSaved > 0 ? T.teal : T.rose }}>
              {(() => {
                const d = new Date();
                d.setMonth(d.getMonth() + (maxOptimizedMonths || 0));
                return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              })()}
            </span>
          </div>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>
            {totalMonthsSaved > 0
              ? `✨ You're saving ${fmtK(totalInterestSaved)} and finishing ${totalMonthsSaved} months earlier!`
              : "Increase your monthly extra payment to see your debt-free date jump forward."}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 800 }}>WIN MARGIN</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.teal }}>{totalMonthsSaved}mo</div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="dt-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Monthly EMI Total" value={fmtK(totalEMI)} icon="💳" color={T.rose} light={T.roseLight} sub="Current outflow" />
        <StatCard label="Total Interest" value={fmtK(Math.round(totalInt))} icon="📉" color={T.amber} light={T.amberLight} sub="Total interest cost" />
        <StatCard label="Months Saved" value={Math.round(totalMonthsSaved)} icon="⏳" color={T.teal} light={T.tealLight} sub={`w/ ₹${extra} extra`} />
        <StatCard label="Interest Saved" value={fmtK(Math.round(totalInterestSaved))} icon="💰" color={T.blue} light={T.blueLight} sub="AI Optimization" />
      </div>

      <div className="dt-grid">
        {/* Controls */}
        <div className="dt-controls">
          <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="dt-strategy-title" style={{ color: T.text, margin: 0 }}>⚙️ Strategy & Priority</div>
              <RefreshCw
                size={16}
                style={{ cursor: 'pointer', opacity: 0.6 }}
                onClick={() => {
                  fetchLoans();
                  setExtra(0);         // Reset extra payment to 0
                  setLumpsum(0);       // Reset lumpsum to 0
                  if (onRefresh) onRefresh();
                }}
              />
            </div>
            <div className="dt-strategy-btns">
              {['avalanche', 'snowball'].map(s => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className="dt-strategy-btn"
                  style={{
                    borderColor: strategy === s ? T.teal : T.border,
                    background: strategy === s ? T.tealLight : 'transparent',
                    color: strategy === s ? T.tealDark : T.textMuted,
                  }}
                >
                  {s === 'avalanche' ? '🏔 Avalanche' : '⛄ Snowball'}
                </button>
              ))}
            </div>
            <RangeInput label="Extra Monthly Payment" min={0} max={50000} step={500} value={extra} onChange={setExtra} format={fmtK} />
            <RangeInput label="One-Time Lumpsum (₹)" min={0} max={500000} step={5000} value={lumpsum} onChange={setLumpsum} format={fmtK} color={T.rose} />
            <RangeInput label="Investment Return %" min={5} max={25} step={0.5} value={investRet} onChange={setInvestRet} format={v => `${v}%`} color={T.blue} />

            <div
              className="dt-ai-box"
              style={{
                background: maxRate > investRet ? T.roseLight : T.greenLight,
                border: `1.5px solid ${maxRate > investRet ? T.rose : T.green}44`,
                marginTop: 15,
                padding: '12px',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div className="dt-ai-label" style={{ color: T.textMuted, fontSize: 10, fontWeight: 800 }}>🤖 STRATEGIC VERDICT</div>
                <Badge color={maxRate > investRet ? T.rose : T.green}>{maxRate > investRet ? 'ALARM' : 'OPTIMAL'}</Badge>
              </div>
              {maxRate > investRet
                ? <div className="dt-ai-text" style={{ color: T.rose, fontWeight: 700, fontSize: 13 }}>🚨 Critical Interest Gap: <span style={{ color: T.text }}>Your debt is growing faster ({maxRate}%) than your potential market returns ({investRet}%).</span></div>
                : <div className="dt-ai-text" style={{ color: T.green, fontWeight: 700, fontSize: 13 }}>🤝 Positive Spread: <span style={{ color: T.text }}>You can comfortably invest as returns ({investRet}%) exceed loan costs ({maxRate}%).</span></div>}
            </div>
          </Card>

          {/* Add New Loan - MOVED UP for better sequence */}
          <Card style={{ border: `1px solid ${T.teal}44`, marginBottom: 0, padding: '24px' }}>
            <div className="dt-strategy-title" style={{ color: T.teal, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
              <RefreshCw size={20} /> Add New Loan (Sandbox)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Loan Name</label>
                <input
                  type="text" value={newL.name} placeholder="e.g. Credit Card"
                  onChange={e => setNewL({ ...newL, name: e.target.value })}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Loan Amount (₹)</label>
                <input 
                  type="number" value={newL.principal === 0 ? '' : newL.principal}
                  onChange={e => setNewL({ ...newL, principal: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Interest Rate (%)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" value={newL.rate === 0 ? '' : newL.rate}
                    onChange={e => setNewL({ ...newL, rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0"
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                  />
                  <select
                    value={newL.ratePeriod}
                    onChange={e => setNewL({ ...newL, ratePeriod: e.target.value })}
                    style={{ padding: '0 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 14, fontWeight: 700 }}
                  >
                    <option value="yearly">p.a.</option>
                    <option value="monthly">p.m.</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Tenure (Months)</label>
                <input
                  type="number" value={newL.months === 0 ? '' : newL.months}
                  onChange={e => setNewL({ ...newL, months: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 8, display: 'block' }}>Interest Type</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setNewL({ ...newL, type: 'reducing' })}
                    style={{ flex: 1, padding: '14px', fontSize: 13, borderRadius: 12, border: `2px solid ${newL.type === 'reducing' ? T.teal : T.border}`, background: newL.type === 'reducing' ? T.teal + '11' : 'transparent', color: newL.type === 'reducing' ? T.teal : T.textMuted, cursor: 'pointer', fontWeight: 700 }}
                  >🏦 Reducing</button>
                  <button
                    onClick={() => setNewL({ ...newL, type: 'flat' })}
                    style={{ flex: 1, padding: '14px', fontSize: 13, borderRadius: 12, border: `2px solid ${newL.type === 'flat' ? T.teal : T.border}`, background: newL.type === 'flat' ? T.teal + '11' : 'transparent', color: newL.type === 'flat' ? T.teal : T.textMuted, cursor: 'pointer', fontWeight: 700 }}
                  >📈 Flat Rate</button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                style={{ width: '100%', padding: '16px', borderRadius: 12, background: T.teal, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 16, marginTop: 10 }}
              >
                Save & Optimize
              </button>
            </div>

            <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 16, background: T.teal + '08', border: `1px dashed ${T.teal}66` }}>
              <div style={{ fontSize: 11, color: T.teal, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>🤖 AI PREDICTION</span>
                <span>{newL.type === 'reducing' ? 'REDUCING' : 'FLAT'} @ {newL.ratePeriod === 'monthly' ? (newL.rate * 12) : newL.rate}%</span>
              </div>
              <div className="dt-prediction-results" style={{ display: 'flex', gap: 30 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Monthly EMI</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: T.text }}>{fmtK(Math.round(previewEMI))}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Interest Cost</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: T.rose }}>{fmtK(Math.round(previewInt))}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="dt-chart-title" style={{ color: T.text }}>📊 Payoff Journey (Estimated)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={payoffData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Standard" fill={T.border} name="Std Mo." radius={[4, 4, 0, 0]} />
                <Bar dataKey="Optimized" fill={T.teal} name="AI Mo." radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Loans list */}
        <div className="dt-loans-list">
          <div className="dt-order-label" style={{ color: T.textSub }}>
            Repayment Order — {strategy === 'avalanche' ? 'Highest Rate First ↓' : 'Smallest Balance First ↑'}
          </div>
          {optimizedData.map((loan, idx) => {
            const r = getEffRate(loan);
            const e = calcEMI(loan.principal, r, loan.months, loan.type);
            const interest = e * loan.months - loan.principal;
            const c = loan.isTarget ? T.teal : (idx === 0 ? T.rose : T.blue);
            return (
              <Card key={loan.id} className="dt-loan-card" style={{
                position: 'relative',
                borderLeft: `4px solid ${c}`,
                transform: loan.isTarget ? 'scale(1.01)' : 'none',
                boxShadow: loan.isTarget ? `0 8px 30px ${T.teal}22` : 'none',
                zIndex: loan.isTarget ? 2 : 1
              }}>
                <div className="dt-loan-header">
                  <div className="dt-loan-name" style={{ color: T.text, fontSize: 18, fontWeight: 800 }}>
                    {loan.name}
                  </div>
                  <div className="dt-loan-card-top">
                    {loan.isQuickWin && <Badge color={T.amber} style={{ fontSize: 11 }}>🎁 NEXT QUICK WIN</Badge>}
                    {loan.isTarget && <Badge color={T.teal} style={{ fontSize: 11, animation: 'pulse 2s infinite' }}>⚡ {lumpsum > 0 ? 'LUMPSUM TARGET' : 'MONTHLY TARGET'}</Badge>}
                    {loan.monthsSaved > 0 && <Badge color={T.blue} style={{ fontSize: 10 }}>Reduced by {Math.round(loan.monthsSaved / loan.months * 100)}%</Badge>}
                    <Badge color={loan.type === 'reducing' ? T.teal : T.rose} style={{ fontSize: 10 }}>{loan.type === 'reducing' ? 'Reducing Bal' : 'Flat Rate'}</Badge>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="dt-loan-remove"
                      style={{ background: T.roseLight, color: T.rose }}
                    >✕</button>
                  </div>
                </div>

                <div className="dt-loan-detail">
                  {[
                    { l: 'Principal', v: fmtK(loan.principal) },
                    { l: 'Rate', v: `${loan.rate}% ${loan.ratePeriod === 'monthly' ? 'p.m.' : 'p.a.'}` },
                    { l: 'Tenure', v: `${loan.months}m` },
                    { l: 'EMI', v: fmtK(e) },
                    { l: 'Interest', v: fmtK(Math.round(interest)) },
                    { l: 'Total', v: fmtK(Math.round(e * loan.months)) },
                  ].map(({ l, v }) => (
                    <div key={l} className="dt-loan-detail-tile" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                      <div className="dt-loan-detail-label" style={{ color: T.textMuted }}>{l}</div>
                      <div className="dt-loan-detail-value" style={{ color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div className="dt-loan-rate-row">
                  <span className="dt-loan-rate-label" style={{ color: T.textMuted }}>Interest rate:</span>
                  <div className="dt-loan-rate-track" style={{ background: T.border }}>
                    <div className="dt-loan-rate-fill" style={{ background: c, width: `${Math.min(loan.rate / 25 * 100, 100)}%` }} />
                  </div>
                  <span className="dt-loan-rate-value" style={{ color: c }}>{loan.rate}% p.a.</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
