import React, { useState } from 'react';
import '../styles/debt.css';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, StatCard, RangeInput, Badge, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { calcEMI, fmtK, IMGS } from '../utils.jsx';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { profileAPI } from '../api.js';

export default function Debt({ profile = {}, onRefresh }) {
  const { T } = useTheme();
  const [loans, setLoans] = useState([]);
  const [strategy, setStrategy] = useState('avalanche');
  const [investRet, setInvestRet] = useState(12);
  const [extra, setExtra] = useState(0);
  const [lumpsum, setLumpsum] = useState(0);
  const [newL, setNewL] = useState({ name: 'Credit Card', principal: 100000, rate: 16, months: 24, type: 'reducing', ratePeriod: 'yearly' });

  const [hasLoaded, setHasLoaded] = useState(false);

  // Sync loans with profile debts on first load
  React.useEffect(() => {
    if (hasLoaded) return; // Prevent overwriting manual state after load

    const liab = profile.assets?.liabilities || {};
    const savedDebts = profile.assets?.debts || [];

    if (savedDebts && savedDebts.length > 0) {
      setLoans(savedDebts);
      setHasLoaded(true);
    } else if (liab && Object.values(liab).some(v => v > 0)) {
      // Only load from liab if we haven't already manually edited loans
      const initialLoans = [];
      if (liab.homeLoan) initialLoans.push({ id: 'h1', name: 'Home Loan', principal: liab.homeLoan, rate: 8.5, months: 240, type: 'reducing', ratePeriod: 'yearly' });
      if (liab.carLoan) initialLoans.push({ id: 'c1', name: 'Car Loan', principal: liab.carLoan, rate: 10.5, months: 60, type: 'reducing', ratePeriod: 'yearly' });
      if (liab.personalLoan) initialLoans.push({ id: 'p1', name: 'Personal Loan', principal: liab.personalLoan, rate: 16, months: 36, type: 'reducing', ratePeriod: 'yearly' });
      if (liab.otherLiabilities) initialLoans.push({ id: 'o1', name: 'Other Debt', principal: liab.otherLiabilities, rate: 12, months: 12, type: 'reducing', ratePeriod: 'yearly' });

      setLoans(initialLoans);
      setHasLoaded(true);
    }
  }, [profile.assets?.liabilities, profile.assets?.debts, hasLoaded]);

  // Sync Extra Payment with surplus (Commented out as user wants default 0)
  /*
  React.useEffect(() => {
    if (profile.savings > 0) setExtra(profile.savings);
  }, [profile.savings]);
  */

  const syncToDb = async (newList) => {
    try {
      await profileAPI.updateAssets({
        ...profile.assets,
        debts: newList
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to sync debts:', err);
    }
  };

  const handleAdd = async () => {
    const newList = [{ ...newL, id: Date.now() }, ...loans];
    setLoans(newList);
    setNewL({ name: '', principal: 0, rate: 0, months: 0, type: 'reducing', ratePeriod: 'yearly' });
    await syncToDb(newList);
  };

  const handleDelete = async (id) => {
    const newList = loans.filter(l => l.id !== id);
    setLoans(newList);
    await syncToDb(newList);
  };
  const sorted = [...loans].sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.principal - b.principal);

  const getEffRate = (l) => l.ratePeriod === 'monthly' ? l.rate * 12 : l.rate;

  const totalEMI = loans.reduce((s, l) => s + calcEMI(l.principal, getEffRate(l), l.months, l.type), 0);
  const totalInt = loans.reduce((s, l) => { const e = calcEMI(l.principal, getEffRate(l), l.months, l.type); return s + (e * l.months - l.principal); }, 0);
  const maxRate = Math.max(...loans.map(l => getEffRate(l)));

  let totalInterestSaved = 0;
  let totalMonthsSaved = 0;
  let maxOptimizedMonths = 0;

  const optimizedData = sorted.map((l, i) => {
    const r = getEffRate(l);
    const standardEMI = calcEMI(l.principal, r, l.months, l.type);
    // Apply lumpsum ONLY to the first target loan
    const currentPrincipal = i === 0 ? Math.max(0, l.principal - lumpsum) : l.principal;
    const bonus = i === 0 ? extra : 0;

    const newMonths = currentPrincipal <= 0 ? 0 : Math.max(1, Math.round(currentPrincipal / (standardEMI + bonus)));
    const monthsSaved = l.months - newMonths;
    const interestSaved = (standardEMI * l.months - l.principal) - ((standardEMI + bonus) * newMonths - currentPrincipal);

    if (newMonths > maxOptimizedMonths) maxOptimizedMonths = newMonths;

    if (monthsSaved > 0) {
      totalMonthsSaved += monthsSaved;
      totalInterestSaved += interestSaved;
    }

    return {
      ...l,
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
                  setHasLoaded(false); // Allow re-sync from profile
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
                <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: 8, alignItems: 'center' }}>
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

                <div className="dt-loan-name" style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  {loan.name}
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
