import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, StatCard, RangeInput, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { calcEMI, fmtK, fmt, IMGS } from '../utils.jsx';

export default function WhatIf({ profile }) {
  const { T } = useTheme();
  const [expCut,   setExpCut]   = useState(0);
  const [incBoost, setIncBoost] = useState(0);
  const [sipExtra, setSipExtra] = useState(0);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanMo,   setLoanMo]   = useState(240);

  const base = {
    inc: profile.income      || 80000,
    exp: profile.expenses    || 40000,
    sav: profile.savings     || 15000,
    inv: profile.investments || 10000,
  };
  const sim = {
    inc: base.inc * (1 + incBoost / 100),
    exp: base.exp * (1 - expCut   / 100),
    inv: base.inv + sipExtra,
  };
  sim.sav   = sim.inc - sim.exp;
  sim.delta = sim.sav - base.sav;

  const loan    = 3000000;
  const baseEMI = calcEMI(loan, 8.5, 240);
  const newEMI  = calcEMI(loan, loanRate, loanMo);
  const baseTot = baseEMI * 240;
  const newTot  = newEMI  * loanMo;

  const simData = Array.from({ length: 10 }, (_, i) => ({
    year:      `Y${i + 1}`,
    Baseline:  Math.round(base.sav * 12 * i * 1.10),
    Optimized: Math.round(sim.sav  * 12 * i * 1.12),
  }));

  const compareData = [
    { name: 'Monthly', Current: Math.round(base.sav),      Optimized: Math.round(Math.max(0, sim.sav))      },
    { name: 'Yearly',  Current: Math.round(base.sav * 12), Optimized: Math.round(Math.max(0, sim.sav) * 12) },
  ];

  const saving = newTot < baseTot;

  return (
    <div className="wi-page">
      <ImgBanner src={IMGS.whatif} title="What-If Scenario Simulator" subtitle="Real-time sensitivity analysis — drag any slider to model financial outcomes" color={T.blue} />

      <div className="wi-grid">
        {/* Sliders panel */}
        <Card>
          <div className="wi-sliders-title" style={{ color: T.text }}>🎛 Adjust Scenarios</div>
          <RangeInput label="Cut Expenses by %" min={0} max={40}    value={expCut}   onChange={setExpCut}   format={v => `${v}%`} color={T.rose}   />
          <RangeInput label="Boost Income by %" min={0} max={100}   value={incBoost} onChange={setIncBoost} format={v => `${v}%`} color={T.teal}   />
          <RangeInput label="Extra SIP / Month" min={0} max={50000} step={500} value={sipExtra} onChange={setSipExtra} format={fmtK} color={T.blue} />

          <hr className="wi-divider" style={{ borderColor: T.border }} />
          <div className="wi-loan-section-title" style={{ color: T.textSub }}>🏦 Loan Refinancing</div>
          <RangeInput label="New Interest Rate %" min={6}  max={20}  step={0.25} value={loanRate} onChange={setLoanRate} format={v => `${v}%`} color={T.amber}  />
          <RangeInput label="Tenure (months)"     min={12} max={360} step={12}   value={loanMo}   onChange={setLoanMo}   format={v => `${v}m`} color={T.violet} />

          <div
            className="wi-refi-box"
            style={{
              background: saving ? T.greenLight : T.roseLight,
              border: `1.5px solid ${saving ? T.green : T.rose}44`,
            }}
          >
            <div className="wi-loan-mini">
              {[
                { l: 'Old EMI',   v: fmt(baseEMI),              c: T.textSub },
                { l: 'New EMI',   v: fmt(newEMI),               c: newEMI < baseEMI ? T.green : T.rose },
                { l: 'Old Total', v: fmtK(Math.round(baseTot)), c: T.textSub },
                { l: 'New Total', v: fmtK(Math.round(newTot)),  c: newTot < baseTot ? T.green : T.rose },
              ].map(({ l, v, c }) => (
                <div key={l} className="wi-loan-mini-tile" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="wi-loan-mini-label" style={{ color: T.textMuted }}>{l}</div>
                  <div className="wi-loan-mini-value" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="wi-refi-result" style={{ color: saving ? T.green : T.rose }}>
              {saving
                ? `✅ Save ${fmtK(Math.round(baseTot - newTot))} total`
                : `⚠️ Pay ${fmtK(Math.round(newTot - baseTot))} extra`}
            </div>
          </div>
        </Card>

        {/* Right output */}
        <div className="wi-right">
          <div className="wi-stat-row">
            <StatCard label="Simulated Income"    value={fmtK(Math.round(sim.inc))}               sub={`+${incBoost}% applied`} icon="💹" color={T.teal}   light={T.tealLight}  />
            <StatCard label="Simulated Expenses"  value={fmtK(Math.round(sim.exp))}               sub={`−${expCut}% applied`}   icon="✂️" color={T.rose}   light={T.roseLight}  />
            <StatCard label="Extra Monthly Saved" value={fmtK(Math.round(Math.max(0, sim.delta)))} sub="vs current baseline"    icon="🚀" color={T.violet} light={T.mode === 'dark' ? '#1A1040' : '#F3F0FF'} />
          </div>

          <Card>
            <div className="wi-area-title" style={{ color: T.text }}>📈 Baseline vs Optimized Wealth (10yr)</div>
            <div className="wi-area-sub" style={{ color: T.textMuted }}>Small adjustments compound dramatically over time</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={simData}>
                <defs>
                  <linearGradient id="gOpt"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.teal} stopOpacity={0.3}  />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: T.textSub }} />
                <Area type="monotone" dataKey="Optimized" stroke={T.teal} fill="url(#gOpt)"  strokeWidth={3} name="Optimized Scenario" />
                <Area type="monotone" dataKey="Baseline"  stroke={T.blue} fill="url(#gBase)" strokeWidth={2} name="Current Baseline"    strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="wi-sub-charts">
            <Card>
              <div className="wi-chart-title-sm" style={{ color: T.text }}>Savings Comparison</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Current"   fill={T.blue} name="Current"   radius={[6,6,0,0]} />
                  <Bar dataKey="Optimized" fill={T.teal} name="Optimized" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="wi-impact-title" style={{ color: T.text }}>💡 Impact Summary</div>
              {[
                { l: 'Annual Extra Savings',  v: fmt(Math.round(Math.max(0, sim.delta) * 12)),           c: T.teal   },
                { l: '10-Year Wealth Delta',  v: fmtK(Math.round(Math.max(0, sim.delta) * 120 * 1.5)),  c: T.violet },
                { l: 'Loan Savings',          v: fmtK(Math.round(Math.max(0, baseTot - newTot))),        c: T.amber  },
              ].map(({ l, v, c }) => (
                <div key={l} className="wi-impact-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <span className="wi-impact-label" style={{ color: T.textSub }}>{l}</span>
                  <span className="wi-impact-value" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
