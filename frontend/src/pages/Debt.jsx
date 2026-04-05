import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, StatCard, RangeInput, Badge, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { calcEMI, fmtK, IMGS } from '../utils.jsx';

export default function Debt() {
  const { T } = useTheme();
  const [loans, setLoans] = useState([
    { id: 1, name: 'Home Loan',     principal: 3000000, rate: 8.5,  months: 240 },
    { id: 2, name: 'Car Loan',      principal: 700000,  rate: 10.5, months: 60  },
    { id: 3, name: 'Personal Loan', principal: 200000,  rate: 16,   months: 36  },
  ]);
  const [strategy,  setStrategy]  = useState('avalanche');
  const [investRet, setInvestRet] = useState(12);
  const [extra,     setExtra]     = useState(5000);

  const sorted   = [...loans].sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.principal - b.principal);
  const totalEMI = loans.reduce((s, l) => s + calcEMI(l.principal, l.rate, l.months), 0);
  const totalInt = loans.reduce((s, l) => { const e = calcEMI(l.principal, l.rate, l.months); return s + (e * l.months - l.principal); }, 0);
  const maxRate  = Math.max(...loans.map(l => l.rate));

  const payoffData = sorted.map((l, i) => {
    const e = calcEMI(l.principal, l.rate, l.months);
    const bonus = i === 0 ? extra : 0;
    const newMonths = Math.round(l.months * l.principal / (l.principal + bonus * 12));
    return { name: l.name.slice(0, 10), Standard: l.months, Optimized: Math.max(6, newMonths) };
  });

  const updateLoan = (id, key, val) => setLoans(ls => ls.map(l => l.id === id ? { ...l, [key]: val } : l));

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
          <Card>
            <div className="dt-strategy-title" style={{ color: T.text }}>⚙️ Strategy Settings</div>
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
              }}
            >
              <div className="dt-ai-label" style={{ color: T.textMuted }}>🤖 AI RECOMMENDATION</div>
              {maxRate > investRet
                ? <div className="dt-ai-text" style={{ color: T.rose  }}>🔴 Pay Loans First<br /><span className="dt-ai-sub" style={{ color: T.textSub }}>Highest rate {maxRate}% &gt; returns {investRet}%</span></div>
                : <div className="dt-ai-text" style={{ color: T.green }}>🟢 Invest Surplus<br /><span className="dt-ai-sub" style={{ color: T.textSub }}>Returns {investRet}% &gt; highest rate {maxRate}%</span></div>}
            </div>
          </Card>

          <Card>
            <div className="dt-chart-title" style={{ color: T.text }}>📊 Payoff Timeline (months)</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={payoffData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Standard"  fill={T.border} name="Standard"  radius={[4,4,0,0]} />
                <Bar dataKey="Optimized" fill={T.teal}   name="Optimized" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <button
            onClick={() => setLoans(ls => [...ls, { id: Date.now(), name: 'New Loan', principal: 100000, rate: 10, months: 24 }])}
            className="dt-add-loan-btn"
            style={{ borderColor: T.border, color: T.textMuted }}
          >
            + Add Another Loan
          </button>
        </div>

        {/* Loans list */}
        <div className="dt-loans">
          <div className="dt-order-label" style={{ color: T.textSub }}>
            Repayment Order — {strategy === 'avalanche' ? 'Highest Rate First ↓' : 'Smallest Balance First ↑'}
          </div>
          {sorted.map((loan, idx) => {
            const e        = calcEMI(loan.principal, loan.rate, loan.months);
            const interest = e * loan.months - loan.principal;
            const c        = idx === 0 ? T.rose : idx === 1 ? T.amber : T.blue;
            return (
              <Card key={loan.id} hover style={{ position: 'relative', borderLeft: `4px solid ${c}` }}>
                <div className="dt-loan-card-top">
                  <div className="dt-loan-priority-badge" style={{ background: c + '18', color: c }}>
                    #{idx + 1} Priority
                  </div>
                  <button
                    onClick={() => setLoans(ls => ls.filter(l => l.id !== loan.id))}
                    className="dt-loan-remove"
                    style={{ background: T.roseLight, color: T.rose }}
                  >✕</button>
                </div>

                <input
                  value={loan.name}
                  onChange={e => updateLoan(loan.id, 'name', e.target.value)}
                  className="dt-loan-name-input"
                  style={{ color: T.text }}
                />

                <div className="dt-loan-detail">
                  {[
                    { l: 'Principal', v: fmtK(loan.principal)           },
                    { l: 'Rate',      v: `${loan.rate}%`                 },
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
