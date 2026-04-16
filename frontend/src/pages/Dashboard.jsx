import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { predictionsAPI } from '../api';


import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, StatCard, Badge, ScoreRing, ChartTooltip } from '../components/UI.jsx';
import { calcHealth, fmtK, PIE_COLORS, IMGS } from '../utils.jsx';

export default function Dashboard({ profile, goals }) {
  const { T } = useTheme();
  const score      = calcHealth(profile);
  const surplus    = Math.max(0, profile.income - profile.expenses - profile.emi);
  const savePct    = profile.income ? ((profile.savings / profile.income) * 100).toFixed(1) : '0.0';
  const scoreColor = score >= 75 ? T.teal : score >= 50 ? T.amber : T.rose;

  const expData = [
    { name: 'Essential Exp.', value: profile.expenses },
    { name: 'EMI / Debt',     value: profile.emi },
    { name: 'Investments',    value: profile.investments },
    { name: 'Savings',        value: profile.savings },
  ].filter(d => d.value > 0);

  const [aiForecast, setAiForecast] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoadingAI(true);
      try {
        const res = await predictionsAPI.getAICashflow({
          income: profile.income,
          expenses: profile.expenses,
          emi: profile.emi,
          investments: profile.investments
        });
        if (res.data.forecast) setAiForecast(res.data.forecast);
      } catch (err) {
        console.error('Failed to fetch AI forecast:', err);
      } finally {
        setLoadingAI(false);
      }
    };
    if (profile.income > 0) fetchForecast();
  }, [profile]);

  const flowData = aiForecast.length > 0 ? aiForecast : ['Oct','Nov','Dec','Jan','Feb','Mar'].map((m, i) => {
    // Fallback data
    const variance = 1 + (i % 3 - 1) * 0.05; 
    return {
      month: m,
      Income:   Math.round(profile.income * variance),
      Expenses: Math.round(profile.expenses * (1 + (i % 2 === 0 ? 0.05 : -0.05))),
      Savings:  Math.round(profile.savings * (1 + (i % 4 === 0 ? 0.1 : -0.1))),
    };
  });

  const radData = [
    { name: 'Surplus',   value: Math.min(((profile.income - profile.expenses - profile.emi) / (profile.income || 1)) * 100, 20) / 20 * 100, fill: T.teal   },
    { name: 'Invest',    value: Math.min(profile.income ? (profile.investments / profile.income) * 100 : 0, 15) / 15 * 100, fill: T.blue },
    { name: 'Emergency', value: Math.min(profile.expenses ? profile.emergency / ((profile.expenses + profile.emi) * 6) * 100 : 0, 100), fill: T.violet },
    { name: 'Debt Safety', value: profile.income ? Math.max(0, (1 - (profile.emi / (profile.income * 0.6))) * 100) : 0, fill: T.amber },
  ];

  return (
    <div className="db-page">

      {/* Hero */}
      <div className="db-hero">
        <img src={IMGS.hero} alt="Finance" />
        <div className="db-hero-overlay" style={{ background: `linear-gradient(110deg,${T.teal}ee 0%,${T.blue}bb 55%,transparent 100%)` }} />
        <div className="db-hero-body">
          <div>
            <div className="db-hero-greeting">Track Your Financial Health 💰</div>
            <div className="db-hero-title">
              Your Financial<br /><span>Health Dashboard</span>
            </div>
          </div>
          <div className="db-hero-right">
            <div className="db-hero-stat">
              <div className="db-hero-stat-label">Health Score</div>
              <div className="db-hero-score-num">{score}</div>
              <div className="db-hero-stat-sub">out of 100</div>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <div className="db-hero-stat-label">Monthly Surplus</div>
              <div className="db-hero-surplus-num">{fmtK(surplus)}</div>
              <div className="db-hero-stat-sub">available to invest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="db-stats">
        <StatCard label="Monthly Income"  value={fmtK(profile.income)}               sub={`${savePct}% savings rate`} icon="💰" color={T.teal}   light={T.tealLight}  />
        <StatCard label="Total Outflow"   value={fmtK(profile.expenses+profile.emi)} sub="Expenses + EMI"             icon="📊" color={T.blue}   light={T.blueLight}  />
        <StatCard label="Investments/mo"  value={fmtK(profile.investments)}          sub="Wealth building"            icon="📈" color={T.violet} light={T.mode==='dark'?'#1A1040':'#F3F0FF'} />
        <StatCard label="Emergency Fund"  value={fmtK(profile.emergency)}            sub={`${profile.expenses ? Math.round(profile.emergency/profile.expenses) : 0} months cover`} icon="🛡️" color={T.green} light={T.greenLight} />
      </div>

      {/* Charts */}
      <div className="db-charts">
        <Card>
          <div className="db-chart-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div className="db-chart-title" style={{ color: T.text }}>Cash Flow Forecast</div>
              <Badge color={T.teal}>🧠 AI Predicted</Badge>
            </div>
            <div className="db-chart-sub" style={{ color: T.textMuted }}>Income · Expenses · Savings trend</div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={flowData}>
              <defs>
                {[[T.teal,'gI'],[T.rose,'gE'],[T.blue,'gS']].map(([c,id]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: T.textSub }} />
              <Area type="monotone" dataKey="Income"   stroke={T.teal} fill="url(#gI)" strokeWidth={2.5} name="Income"   />
              <Area type="monotone" dataKey="Expenses" stroke={T.rose} fill="url(#gE)" strokeWidth={2}   name="Expenses" />
              <Area type="monotone" dataKey="Savings"  stroke={T.blue} fill="url(#gS)" strokeWidth={2}   name="Savings" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="db-chart-head">
            <div className="db-chart-title" style={{ color: T.text }}>Expense Split</div>
            <div className="db-chart-sub" style={{ color: T.textMuted }}>Where your money goes</div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={expData} cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {expData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="db-pie-legend">
            {expData.map((d, i) => (
              <div key={d.name} className="db-pie-legend-item" style={{ color: T.textSub }}>
                <div className="db-pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="db-chart-head-sm">
            <div className="db-chart-title" style={{ color: T.text }}>Health Metrics</div>
            <div className="db-chart-sub" style={{ color: T.textMuted }}>4-dimension analysis</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ScoreRing score={score} />
          </div>
          <div className="db-metrics">
            {radData.map(d => (
              <div key={d.name} className="db-metric-row">
                <div className="db-metric-dot" style={{ background: d.fill }} />
                <span className="db-metric-label" style={{ color: T.textSub }}>{d.name}</span>
                <div className="db-metric-bar-wrap" style={{ background: T.border }}>
                  <div className="db-metric-bar-fill" style={{ background: d.fill, width: `${Math.round(d.value)}%` }} />
                </div>
                <span className="db-metric-pct" style={{ color: d.fill }}>{Math.round(d.value)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Loans Section */}
      {profile.assets?.debts?.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div className="db-goals-header">
            <div>
              <div className="db-goals-title" style={{ color: T.text }}>Active Loans & Liabilities</div>
              <div className="db-goals-sub" style={{ color: T.textMuted }}>Tracking your optimization journey</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.rose }}>TOTAL PRINCIPAL</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>
                {fmtK(profile.assets.debts.reduce((sum, l) => sum + (l.principal || 0), 0))}
              </div>
            </div>
          </div>
          <div className="db-goals-grid">
            {profile.assets.debts.map(l => {
              const c = l.rate > 15 ? T.rose : l.rate > 10 ? T.amber : T.teal;
              return (
                <div key={l.id} className="db-goal-card" style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `4px solid ${c}` }}>
                  <div className="db-goal-card-header">
                    <span className="db-goal-name" style={{ color: T.text, fontWeight: 700 }}>{l.name}</span>
                    <Badge color={c}>{l.rate}% p.a.</Badge>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: T.textSub }}>
                     Due: <span style={{ fontWeight: 800 }}>{fmtK(l.principal)}</span> over {l.months} months
                  </div>
                  <div className="db-goal-bar-track" style={{ background: T.border, height: 4, marginTop: 10 }}>
                    <div className="db-goal-bar-fill"
                      style={{ background: c, width: '100%', opacity: 0.3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <div className="db-goals-header">
            <div>
              <div className="db-goals-title" style={{ color: T.text }}>Active Financial Goals</div>
              <div className="db-goals-sub" style={{ color: T.textMuted }}>Progress toward your targets</div>
            </div>
            <Badge color={T.teal}>{goals.length} Active Goals</Badge>
          </div>
          <div className="db-goals-grid">
            {goals.map(g => {
              const pct = Math.min(100, Math.round(g.saved / g.target * 100));
              const c   = g.priority === 'High' ? T.rose : g.priority === 'Medium' ? T.amber : T.blue;
              return (
                <div key={g._id || g.id} className="db-goal-card" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                  <div className="db-goal-card-header">
                    <span className="db-goal-name" style={{ color: T.text }}>{g.name}</span>
                    <Badge color={c}>{pct}%</Badge>
                  </div>
                  <div className="db-goal-bar-track" style={{ background: T.border }}>
                    <div className="db-goal-bar-fill"
                      style={{ background: `linear-gradient(90deg,${c},${c}99)`, width: `${pct}%`, boxShadow: `0 2px 6px ${c}44` }} />
                  </div>
                  <div className="db-goal-amounts" style={{ color: T.textMuted }}>
                    <span>{fmtK(g.saved)}</span><span>{fmtK(g.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
