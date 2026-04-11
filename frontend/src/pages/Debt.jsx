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
  const [extra, setExtra] = useState(profile.savings || 5000);
  const [newL, setNewL] = useState({ name: 'Credit Card', principal: 100000, rate: 16, months: 24, type: 'reducing', ratePeriod: 'yearly' });

  // Sync loans with profile debts on first load
  React.useEffect(() => {
    const liab = profile.assets?.liabilities || {};
    const savedDebts = profile.assets?.debts || [];
    
    if (savedDebts.length > 0) {
      setLoans(savedDebts);
    } else {
      const initialLoans = [];
      if (liab.homeLoan)     initialLoans.push({ id: 1, name: 'Home Loan',     principal: liab.homeLoan,     rate: 8.5,  months: 240, type: 'reducing', ratePeriod: 'yearly' });
      if (liab.carLoan)      initialLoans.push({ id: 2, name: 'Car Loan',      principal: liab.carLoan,      rate: 10.5, months: 60,  type: 'reducing', ratePeriod: 'yearly' });
      if (liab.personalLoan) initialLoans.push({ id: 3, name: 'Personal Loan', principal: liab.personalLoan, rate: 16,   months: 36,  type: 'reducing', ratePeriod: 'yearly' });
      
      // Fallback
      if (initialLoans.length === 0) {
         initialLoans.push(
           { id: 1, name: 'Home Loan',     principal: 3000000, rate: 8.5,  months: 240, type: 'reducing', ratePeriod: 'yearly' },
           { id: 2, name: 'Car Loan',      principal: 700000,  rate: 10.5, months: 60,  type: 'reducing', ratePeriod: 'yearly' }
         );
      }
      setLoans(initialLoans);
    }
  }, [profile.assets?.liabilities, profile.assets?.debts]);

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
  const sorted   = [...loans].sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.principal - b.principal);
  
  const getEffRate = (l) => l.ratePeriod === 'monthly' ? l.rate * 12 : l.rate;

  const totalEMI = loans.reduce((s, l) => s + calcEMI(l.principal, getEffRate(l), l.months, l.type), 0);
  const totalInt = loans.reduce((s, l) => { const e = calcEMI(l.principal, getEffRate(l), l.months, l.type); return s + (e * l.months - l.principal); }, 0);
  const maxRate  = Math.max(...loans.map(l => getEffRate(l)));

  const payoffData = sorted.map((l, i) => {
    const r = getEffRate(l);
    const e = calcEMI(l.principal, r, l.months, l.type);
    const bonus = i === 0 ? extra : 0;
    const newMonths = Math.round(l.months * l.principal / (l.principal + bonus * 12));
    return { name: l.name.slice(0, 10), Standard: l.months, Optimized: Math.max(6, newMonths) };
  });

  const updateLoan = (id, key, val) => setLoans(ls => ls.map(l => l.id === id ? { ...l, [key]: val } : l));

  // Predictive Add
  const effNewRate = newL.ratePeriod === 'monthly' ? (newL.rate || 0) * 12 : (newL.rate || 0);
  const previewEMI = calcEMI(newL.principal || 0, effNewRate, newL.months || 0, newL.type);
  const previewInt = (previewEMI * (newL.months || 0)) - (newL.principal || 0);

  return (
    <div className="dt-page">
      <ImgBanner src={IMGS.debt} title="Debt Snowball / Avalanche Optimizer" subtitle="AI-powered debt repayment strategy with intelligent decision engine" color={T.rose} />

      {/* Stat cards */}
      <div className="dt-stats">
        <StatCard label="Monthly EMI Total" value={fmtK(totalEMI)}             icon="💳" color={T.rose}  light={T.roseLight}  sub="Total monthly outflow" />
        <StatCard label="Total Interest"    value={fmtK(Math.round(totalInt))} icon="📉" color={T.amber} light={T.amberLight} sub="Lifetime cost of debt"  />
        <StatCard label="Active Loans"      value={loans.length}                icon="🏦" color={T.blue}  light={T.blueLight}  sub="Loan accounts"          />
      </div>

      <div className="dt-grid">
        {/* Controls */}
        <div className="dt-controls">
          <Card style={{ padding: '20px' }}>
            <div className="dt-strategy-title" style={{ color: T.text }}>⚙️ Strategy & Priority</div>
            <div className="dt-strategy-btns">
              {['avalanche', 'snowball'].map(s => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className="dt-strategy-btn"
                  style={{
                    borderColor: strategy === s ? T.teal : T.border,
                    background:  strategy === s ? T.tealLight : 'transparent',
                    color:       strategy === s ? T.tealDark  : T.textMuted,
                  }}
                >
                  {s === 'avalanche' ? '🏔 Avalanche' : '⛄ Snowball'}
                </button>
              ))}
            </div>
            <RangeInput label="Extra Monthly Payment" min={0} max={50000} step={500} value={extra}     onChange={setExtra}     format={fmtK} />
            <RangeInput label="Investment Return %"   min={5} max={25}    step={0.5} value={investRet} onChange={setInvestRet} format={v => `${v}%`} color={T.blue} />

            <div
              className="dt-ai-box"
              style={{
                background: maxRate > investRet ? T.roseLight  : T.greenLight,
                border:     `1.5px solid ${maxRate > investRet ? T.rose : T.green}44`,
                marginTop: 15
              }}
            >
              <div className="dt-ai-label" style={{ color: T.textMuted }}>🤖 AI RECOMMENDATION</div>
              {maxRate > investRet
                ? <div className="dt-ai-text" style={{ color: T.rose  }}>🔴 Pay Loans First<br /><span className="dt-ai-sub" style={{ color: T.textSub }}>Highest rate {maxRate}% &gt; returns {investRet}%</span></div>
                : <div className="dt-ai-text" style={{ color: T.green }}>🟢 Invest Surplus<br /><span className="dt-ai-sub" style={{ color: T.textSub }}>Returns {investRet}% &gt; highest rate {maxRate}%</span></div>}
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
                  onChange={e => setNewL({...newL, name: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Loan Amount (₹)</label>
                <input 
                  type="number" value={newL.principal === 0 ? '' : newL.principal}
                  onChange={e => setNewL({...newL, principal: e.target.value === '' ? 0 : Number(e.target.value)})}
                  placeholder="0"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, display: 'block' }}>Interest Rate (%)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="number" value={newL.rate === 0 ? '' : newL.rate}
                    onChange={e => setNewL({...newL, rate: e.target.value === '' ? 0 : Number(e.target.value)})}
                    placeholder="0"
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                  />
                  <select 
                    value={newL.ratePeriod}
                    onChange={e => setNewL({...newL, ratePeriod: e.target.value})}
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
                  onChange={e => setNewL({...newL, months: e.target.value === '' ? 0 : Number(e.target.value)})}
                  placeholder="0"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, outline: 'none', fontSize: 16 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 8, display: 'block' }}>Interest Type</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => setNewL({...newL, type: 'reducing'})}
                    style={{ flex: 1, padding: '14px', fontSize: 13, borderRadius: 12, border: `2px solid ${newL.type === 'reducing' ? T.teal : T.border}`, background: newL.type === 'reducing' ? T.teal + '11' : 'transparent', color: newL.type === 'reducing' ? T.teal : T.textMuted, cursor: 'pointer', fontWeight: 700 }}
                  >🏦 Reducing</button>
                  <button 
                    onClick={() => setNewL({...newL, type: 'flat'})}
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
                <span>{newL.type === 'reducing' ? 'REDUCING' : 'FLAT'} @ {newL.ratePeriod === 'monthly' ? (newL.rate*12) : newL.rate}%</span>
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
                <Bar dataKey="Standard"  fill={T.border} name="Std Mo."  radius={[4,4,0,0]} />
                <Bar dataKey="Optimized" fill={T.teal}   name="AI Mo." radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Loans list */}
        <div className="dt-loans-list">
          <div className="dt-order-label" style={{ color: T.textSub }}>
            Repayment Order — {strategy === 'avalanche' ? 'Highest Rate First ↓' : 'Smallest Balance First ↑'}
          </div>
          {sorted.map((loan, idx) => {
            const r = getEffRate(loan);
            const e = calcEMI(loan.principal, r, loan.months, loan.type);
            const interest = e * loan.months - loan.principal;
            const c        = idx === 0 ? T.rose : idx === 1 ? T.amber : T.blue;
            return (
              <Card key={loan.id} className="dt-loan-card" style={{ position: 'relative', borderLeft: `4px solid ${c}` }}>
                <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge color={loan.type === 'reducing' ? T.teal : T.rose} style={{ fontSize: 10 }}>{loan.type === 'reducing' ? 'Reducing Bal' : 'Flat Rate'}</Badge>
                  <button
                    onClick={() => setLoans(ls => ls.filter(l => l.id !== loan.id))}
                    className="dt-loan-remove"
                    style={{ background: T.roseLight, color: T.rose }}
                  >✕</button>
                </div>

                <div className="dt-loan-name" style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  {loan.name}
                </div>

                <div className="dt-loan-detail">
                  {[
                    { l: 'Principal', v: fmtK(loan.principal)           },
                    { l: 'Rate',      v: `${loan.rate}% ${loan.ratePeriod === 'monthly' ? 'p.m.' : 'p.a.'}` },
                    { l: 'Tenure',    v: `${loan.months}m`               },
                    { l: 'EMI',       v: fmtK(e)                         },
                    { l: 'Interest',  v: fmtK(Math.round(interest))      },
                    { l: 'Total',     v: fmtK(Math.round(e * loan.months)) },
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
