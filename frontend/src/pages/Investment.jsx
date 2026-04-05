import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, GradCard, RangeInput, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { genInvestData, fmtK, IMGS } from '../utils.jsx';

export default function Investment() {
  const { T } = useTheme();
  const [P,   setP]   = useState(100000);
  const [sip, setSip] = useState(10000);
  const [r,   setR]   = useState(12);
  const [yrs, setYrs] = useState(10);

  const data = genInvestData(P, sip, r, yrs);
  const fin  = data[data.length - 1];
  const roi  = fin.invested ? Math.round(fin.gains / fin.invested * 100) : 0;
  const mult = fin.invested ? (fin.value / fin.invested).toFixed(1) : '–';

  const compData = [
    { name: 'FD (7%)',      ...genInvestData(P, sip, 7,     yrs)[yrs] },
    { name: 'Debt MF (9%)', ...genInvestData(P, sip, 9,     yrs)[yrs] },
    { name: 'Balanced',     ...genInvestData(P, sip, 11,    yrs)[yrs] },
    { name: 'Your Rate',    ...genInvestData(P, sip, r,     yrs)[yrs] },
    { name: 'Small Cap',    ...genInvestData(P, sip, r + 4, yrs)[yrs] },
  ];

  return (
    <div className="inv-page">
      <ImgBanner src={IMGS.invest} title="AI Investment Predictor" subtitle="Compound growth modeling · Time-series forecasting · Fund comparison" color={T.violet} />

      <div className="inv-grid">
        <div className="inv-controls">
          <Card>
            <div className="inv-params-title" style={{ color: T.text }}>🎛 Parameters</div>
            <RangeInput label="Initial Investment" min={0}   max={2000000} step={10000} value={P}   onChange={setP}   format={fmtK} />
            <RangeInput label="Monthly SIP"        min={500} max={100000}  step={500}   value={sip} onChange={setSip} format={fmtK}        color={T.blue}   />
            <RangeInput label="Annual Return %"    min={4}   max={30}      step={0.5}   value={r}   onChange={setR}   format={v=>`${v}%`}   color={T.violet} />
            <RangeInput label="Time Horizon (yrs)" min={1}   max={30}                   value={yrs} onChange={setYrs} format={v=>`${v} yr`} color={T.amber}  />
          </Card>

          <div className="inv-mini">
            {[
              { l:'Invested',   v:fmtK(fin?.invested||0), c:T.blue,   bg:T.blueLight  },
              { l:'Future Val', v:fmtK(fin?.value   ||0), c:T.teal,   bg:T.tealLight  },
              { l:'Gains',      v:fmtK(fin?.gains   ||0), c:T.violet, bg:T.mode==='dark'?'#1A1040':'#F3F0FF' },
              { l:'ROI',        v:`${roi}%`,               c:T.amber,  bg:T.amberLight },
            ].map(({ l, v, c, bg }) => (
              <div key={l} className="inv-mini-tile" style={{ background: bg, border: `1px solid ${c}22` }}>
                <div className="inv-mini-label" style={{ color: T.textMuted }}>{l}</div>
                <div className="inv-mini-value" style={{ color: c }}>{v}</div>
              </div>
            ))}
          </div>

          <GradCard from={T.teal} to={T.blue} style={{ padding: 20 }}>
            <div className="inv-mult-label">🚀 Wealth Multiplier</div>
            <div className="inv-mult-value">{mult}x</div>
            <div className="inv-mult-desc">
              Your ₹{fmtK(P)} + ₹{fmtK(sip)}/mo grows to <strong style={{ color: '#fff' }}>{fmtK(fin?.value||0)}</strong> in {yrs} years
            </div>
          </GradCard>
        </div>

        <div className="inv-charts">
          <Card>
            <div className="inv-chart-title" style={{ color: T.text }}>📈 Growth Projection</div>
            <div className="inv-chart-sub" style={{ color: T.textMuted }}>Portfolio value vs amount invested over time</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: T.textSub }} />
                <Area type="monotone" dataKey="value"    stroke={T.teal} fill="url(#gVal)" strokeWidth={3} name="Portfolio Value" />
                <Area type="monotone" dataKey="invested" stroke={T.blue} fill="url(#gInv)" strokeWidth={2} name="Amount Invested" strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="inv-sub-charts">
            <Card>
              <div className="inv-chart-title-sm" style={{ color: T.text }}>Yearly Breakdown</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={data.filter((_, i) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="invested" fill={T.blue} name="Invested" stackId="a" />
                  <Bar dataKey="gains"    fill={T.teal} name="Gains"    stackId="a" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="inv-chart-title-sm" style={{ color: T.text }}>Fund Comparison</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={compData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                  <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill={T.violet} name="Final Value" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
