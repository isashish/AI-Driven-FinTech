import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export function Card({ children, style = {}, hover = false }) {
  const { T } = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.cardBg, borderRadius: 20, border: `1px solid ${T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow, padding: 24,
        transition: 'box-shadow 0.25s, transform 0.25s, background 0.3s, border-color 0.3s',
        transform: hov ? 'translateY(-2px)' : 'none', ...style,
      }}
    >{children}</div>
  );
}

export function GradCard({ children, from, to, style = {} }) {
  return (
    <div style={{
      background: `linear-gradient(135deg,${from},${to})`,
      borderRadius: 20, boxShadow: `0 8px 32px ${from}44`, padding: 24, ...style,
    }}>{children}</div>
  );
}

export function StatCard({ label, value, sub, icon, color, light }) {
  const { T } = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.cardBg, borderRadius: 20, border: `1px solid ${T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow, padding: '20px 22px',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export function Badge({ children, color, bg }) {
  return (
    <span style={{
      background: bg || color + '18', color, border: `1px solid ${color}30`,
      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
    }}>{children}</span>
  );
}

export function RangeInput({ label, min, max, step = 1, value, onChange, format = v => v, color }) {
  const { T } = useTheme();
  const c = color || T.teal;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: c, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, background: c + '14', padding: '2px 10px', borderRadius: 8 }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: c, cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginTop: 4 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, prefix = '₹' }) {
  const { T } = useTheme();
  const [foc, setFoc] = useState(false);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // allow only numbers
    onChange(raw === "" ? 0 : Number(raw));
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: T.textMuted,
          marginBottom: 6,
          fontWeight: 600,
          letterSpacing: 0.3
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: foc ? T.blueLight : T.inputBg,
          border: `1.5px solid ${foc ? T.blue : T.border}`,
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'all 0.2s'
        }}
      >
        {prefix && (
          <span
            style={{
              padding: '0 12px',
              color: T.textMuted,
              fontSize: 13,
              fontWeight: 600
            }}
          >
            {prefix}
          </span>
        )}

        <input
          type="text"                // 👈 changed from number
          inputMode="numeric"        // 👈 mobile numeric keyboard
          value={value}
          onChange={handleChange}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: T.text,
            padding: '11px 12px 11px 0',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600
          }}
        />
      </div>
    </div>
  );
}
export function ScoreRing({ score }) {
  const { T } = useTheme();
  const r = 58, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  const color = score >= 75 ? T.teal : score >= 50 ? T.amber : T.rose;
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Fair' : 'Needs Work';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={150} height={150} viewBox="0 0 150 150">
        <circle cx={75} cy={75} r={r} fill="none" stroke={T.border} strokeWidth={12} />
        <circle cx={75} cy={75} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 75 75)" style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
        <circle cx={75} cy={75} r={42} fill={color + '14'} />
        <text x={75} y={70} textAnchor="middle" fill={color} fontSize={30} fontWeight={800} fontFamily="JetBrains Mono,monospace">{score}</text>
        <text x={75} y={88} textAnchor="middle" fill={T.textMuted} fontSize={11} fontWeight={600}>{label}</text>
      </svg>
    </div>
  );
}

export function ImgBanner({ src, title, subtitle, color, height = 170 }) {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height, boxShadow: `0 8px 32px ${color}33` }}>
      <img src={src} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg,${color}e0 0%,${color}88 55%,transparent 100%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '20px 28px' }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, textShadow: '0 2px 8px rgba(0,0,0,0.3)', letterSpacing: -0.5 }}>{title}</div>
        {subtitle && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export function ChartTooltip({ active, payload, label }) {
  const { T } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', boxShadow: T.shadow, fontSize: 13 }}>
      <div style={{ color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  const { T } = useTheme();
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}
