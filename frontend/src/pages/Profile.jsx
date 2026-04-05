import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, Input, ScoreRing, Badge, ImgBanner } from '../components/UI.jsx';
import { calcHealth, fmtK, IMGS } from '../utils.jsx';

export default function Profile({ profile, setProfile, user }) {
  const { T } = useTheme();

  /* -------------------------
     PERSONAL INFO STATES
  ------------------------- */
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoLocked, setInfoLocked] = useState(false);

  /* -------------------------
     FINANCIAL SAVE STATES
  ------------------------- */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* -------------------------
     CALCULATIONS
  ------------------------- */
  const score   = calcHealth(profile);
  const surplus = Math.max(0, profile.income - profile.expenses - profile.emi);

  /* -------------------------
     UPDATE FUNCTION (FIXED)
  ------------------------- */
  const update = key => val =>
    setProfile(prev => ({
      ...prev,
      [key]: typeof val === "string" && !isNaN(val) ? Number(val) : val
    }));

  /* -------------------------
     SAVE PERSONAL INFO
  ------------------------- */
  const handlePersonalSave = () => {
    setSavingInfo(true);

    setTimeout(() => {
      setSavingInfo(false);
      setInfoLocked(true);
    }, 1000);
  };

  const handleEditInfo = () => {
    setInfoLocked(false);
  };

  /* -------------------------
     SAVE FINANCIAL PROFILE
  ------------------------- */
  const saveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("financialProfile", JSON.stringify(profile));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  /* -------------------------
     STYLES
  ------------------------- */
  const labelStyle = {
    display: "block",
    fontSize: 12,
    color: T.textMuted,
    marginBottom: 6,
    fontWeight: 600
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${T.border}`,
    background: T.inputBg,
    color: T.text,
    fontSize: 14,
    outline: "none"
  };

  /* -------------------------
     PRIORITIES
  ------------------------- */
  const priorities = [
    { label: 'Emergency Fund',   need: profile.expenses * 6,       priority: 'High',   color: T.rose,  icon: '🛡️' },
    { label: 'Health Insurance', need: profile.income * 0.04,      priority: 'High',   color: T.rose,  icon: '❤️' },
    { label: 'EMI / Debt Repay', need: profile.emi,                priority: 'High',   color: T.amber, icon: '💳' },
    { label: 'Mutual Funds/SIP', need: surplus * 0.5,              priority: 'Medium', color: T.amber, icon: '📊' },
    { label: 'Home Loan',        need: surplus * 0.3,              priority: 'Medium', color: T.blue,  icon: '🏠' },
    { label: 'Lifestyle Goals',  need: surplus * 0.2,              priority: 'Low',    color: T.teal,  icon: '✨' },
  ];

  return (
    <div className="pf-page">

      <ImgBanner
        src={IMGS.profile}
        title="Financial Profile"
        subtitle="Build your Digital Financial Identity"
        color={T.blue}
      />

      <div className="pf-grid">

        {/* LEFT COLUMN */}
        <div className="pf-left">

          {/* PERSONAL INFORMATION */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
              👤 Personal Information
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Email Address", key: "email", type: "email" },
                { label: "Age", key: "age", type: "number" },
                { label: "Occupation", key: "occupation", type: "text" }
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type}
                    value={profile[field.key] || ""}
                    disabled={infoLocked}
                    onChange={e => update(field.key)(e.target.value)}
                    style={{
                      ...inputStyle,
                      opacity: infoLocked ? 0.7 : 1,
                      cursor: infoLocked ? "not-allowed" : "text"
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              {!infoLocked ? (
                <button
                  onClick={handlePersonalSave}
                  disabled={savingInfo}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#fff",
                    background: `linear-gradient(135deg, ${T.teal}, ${T.blue})`
                  }}
                >
                  {savingInfo ? "Saving..." : "💾 Update Personal Info"}
                </button>
              ) : (
                <button
                  onClick={handleEditInfo}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: `1px solid ${T.blue}`,
                    background: "transparent",
                    color: T.blue,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ✏️ Edit Information
                </button>
              )}
            </div>
          </Card>

          {/* SCORE CARD */}
          <Card style={{ textAlign: 'center', padding: 28 }}>
            <ScoreRing score={score} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              {[
                { l: 'Savings Rate',   v: profile.income ? `${Math.round(profile.savings / profile.income * 100)}%` : '0%', c: T.teal },
                { l: 'DTI Ratio',      v: profile.income ? `${Math.round(profile.emi / profile.income * 100)}%` : '0%', c: T.rose },
                { l: 'Monthly Surplus',v: fmtK(surplus), c: T.blue },
                { l: 'Invest Rate',    v: profile.income ? `${Math.round(profile.investments / profile.income * 100)}%` : '0%', c: T.violet },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ background: T.bg, borderRadius: 12, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>{l}</div>
                  <div style={{ color: c, fontWeight: 800, fontSize: 18, fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

        </div>


        {/* RIGHT COLUMN */}
        <div className="pf-right">

          {/* FINANCIAL BREAKDOWN */}
          <Card>
            <div className="pf-form-title">🏦 Financial Breakdown</div>

            <Input label="Monthly Income (₹)" value={profile.income} onChange={update('income')} />
            <Input label="Monthly Expenses (₹)" value={profile.expenses} onChange={update('expenses')} />
            <Input label="Monthly EMI / Loans (₹)" value={profile.emi} onChange={update('emi')} />
            <Input label="Monthly Savings (₹)" value={profile.savings} onChange={update('savings')} />
            <Input label="Monthly Investments (₹)" value={profile.investments} onChange={update('investments')} />
            <Input label="Emergency Fund Total (₹)" value={profile.emergency} onChange={update('emergency')} />

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                width: '100%',
                background: `linear-gradient(135deg,${T.teal},${T.blue})`,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px 0',
                fontWeight: 800,
                marginTop: 12,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
            </button>
          </Card>

          {/* PRIORITY */}
          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>
              📋 Priority Hierarchy
            </div>

            {priorities.map(p => (
              <div key={p.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: T.bg,
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  marginBottom: 8
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      {fmtK(Math.round(p.need))}/mo
                    </div>
                  </div>
                </div>
                <Badge color={p.color}>{p.priority}</Badge>
              </div>
            ))}
          </Card>

        </div>

      </div>
    </div>
  );
}