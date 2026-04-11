import React, { useState } from 'react';
import '../styles/goals.css';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, Input, Badge, ImgBanner, ChartTooltip } from '../components/UI.jsx';
import { fmtK, fmt, IMGS } from '../utils.jsx';
import { goalsAPI, predictionsAPI } from '../api';

const GOAL_ICONS = { Home:'🏠',Retirement:'🏖️',Car:'🚗',Education:'🎓',Business:'💼',Emergency:'🛡️',Wedding:'💍',Travel:'✈️' };
const getIcon = name => GOAL_ICONS[Object.keys(GOAL_ICONS).find(k => (name || "").includes(k))] || '🎯';

function GoalCard({ g, profile, deleteGoal, T, getIcon, fmt }) {
  const pct = Math.min(100, Math.round((g.saved || 0) / (g.target || 1) * 100));
  const months = profile.savings > 0 ? Math.ceil(((g.target || 0) - (g.saved || 0)) / profile.savings) : null;
  const c = g.priority === 'High' ? T.rose : g.priority === 'Medium' ? T.amber : T.blue;

  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAI = async () => {
    if (aiData) { setAiData(null); return; }
    setAiLoading(true);
    try {
      const res = await predictionsAPI.getAIGoal({
        target: g.target,
        saved: g.saved,
        monthly_sip: profile.savings
      });
      setAiData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card hover style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge color={c}>{g.priority}</Badge>
        <button
          onClick={fetchAI}
          style={{ background: T.teal + '15', color: T.teal, border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {aiLoading ? '...' : '🧠 AI Insight'}
        </button>
        <button
          onClick={() => deleteGoal(g._id)}
          style={{ background: T.rose + '15', color: T.rose, border: 'none', padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="gl-card-header">
        <div className="gl-card-icon" style={{ background: c + '18' }}>{getIcon(g.name)}</div>
        <div className="gl-card-name-wrap">
          <div className="gl-card-name" style={{ color: T.text }}>{g.name}</div>
          <div className="gl-card-meta" style={{ color: T.textMuted }}>Target: {fmt(g.target)} · Saved: {fmt(g.saved)}</div>
        </div>
      </div>

      {aiData && (
        <div style={{ background: T.teal + '08', borderRadius: 12, padding: 14, marginBottom: 16, border: `1px solid ${T.teal}20`, animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.teal }}>AI SIMULATION RESULTS</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: aiData.status === 'On Track' ? T.teal : T.rose, color: '#fff' }}>
              {aiData.status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              Success Prob: <span style={{ color: T.text, fontWeight: 700 }}>{aiData.probability}%</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              Inflation Target: <span style={{ color: T.text, fontWeight: 700 }}>{fmt(aiData.inflation_adjusted_target)}</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              Step-up SIP: <span style={{ color: T.teal, fontWeight: 800 }}>+{aiData.recommended_step_up}% /yr</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              Time Saved: <span style={{ color: T.teal, fontWeight: 800 }}>{aiData.years_saved} yrs</span>
            </div>
          </div>
        </div>
      )}

      <div className="gl-progress-row">
        <div className="gl-progress-track" style={{ background: T.border }}>
          <div className="gl-progress-fill" style={{ background: `linear-gradient(90deg,${c},${c}88)`, width: `${pct}%` }} />
        </div>
        <span className="gl-progress-pct" style={{ color: c }}>{pct}%</span>
      </div>
      <div className="gl-detail">
        {[
          { l: 'Remaining', v: fmt(Math.max(0, (g.target || 0) - (g.saved || 0))) },
          { l: 'Time to Goal', v: months ? `${months} months` : '–' },
          { l: 'In Years', v: months ? `${(months / 12).toFixed(1)} yr` : '–' },
        ].map(({ l, v }) => (
          <div key={l} className="gl-detail-tile" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
            <div className="gl-detail-label" style={{ color: T.textMuted }}>{l}</div>
            <div className="gl-detail-value" style={{ color: T.text }}>{v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Goals({ goals, onUpdate, profile }) {
  const { T } = useTheme();
  const [form, setForm] = useState({ name: '', target: 500000, saved: 0, priority: 'Medium' });
  const [loading, setLoading] = useState(false);

  const addGoal = async () => {
    if (!form.name.trim() || loading) return;
    setLoading(true);
    try {
      await goalsAPI.create(form);
      setForm({ name: '', target: 500000, saved: 0, priority: 'Medium' });
      await onUpdate();
    } catch (err) {
      console.error('Failed to add goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalsAPI.delete(id);
      await onUpdate();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const barData = goals.map(g => ({
    name: (g.name || "").slice(0, 10),
    Saved: g.saved || 0,
    Remaining: Math.max(0, (g.target || 0) - (g.saved || 0)),
  }));

  return (
    <div className="gl-page">
      <ImgBanner src={IMGS.goal} title="Goal-Based Financial Planner" subtitle="Define, simulate & systematically achieve your financial targets" color={T.teal} />

      <div className="gl-grid">
        <div className="gl-form">
          <Card>
            <div className="gl-form-title" style={{ color: T.text }}>➕ Add New Goal</div>
            <label className="gl-label" style={{ color: T.textMuted }}>Goal Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Home, Retirement, Car..."
              className="gl-name-input"
              style={{ background: T.inputBg, borderColor: T.border, color: T.text }}
            />
            <Input label="Target Amount (₹)" value={form.target} onChange={v => setForm(f => ({ ...f, target: v }))} />
            <Input label="Already Saved (₹)" value={form.saved} onChange={v => setForm(f => ({ ...f, saved: v }))} />
            <label className="gl-label" style={{ color: T.textMuted }}>Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="gl-select"
              style={{ background: T.inputBg, borderColor: T.border, color: T.text }}
            >
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
            <div className="gl-time-box" style={{ background: T.tealLight, border: `1px solid ${T.teal}30` }}>
              <div className="gl-time-label" style={{ color: T.teal }}>⏱ TIME TO ACHIEVE</div>
              <div className="gl-time-value" style={{ color: T.teal }}>
                {profile.savings > 0 ? `${Math.ceil((form.target - form.saved) / profile.savings)} mo` : 'Set savings first'}
              </div>
              <div className="gl-time-sub" style={{ color: T.textMuted }}>at ₹{(profile.savings || 0).toLocaleString('en-IN')}/month</div>
            </div>
            <button
              onClick={addGoal}
              disabled={loading}
              className="gl-add-btn"
              style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 4px 16px ${T.teal}44`, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Adding...' : '+ Add Goal'}
            </button>
          </Card>

          {goals.length > 0 && (
            <Card>
              <div className="gl-chart-title" style={{ color: T.text }}>📊 Progress Overview</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                  <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.textSub, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Saved" fill={T.teal} stackId="a" name="Saved" />
                  <Bar dataKey="Remaining" fill={T.border} stackId="a" name="Remaining" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        <div className="gl-list">
          {goals.length === 0 && (
            <Card>
              <div className="gl-empty">
                <div className="gl-empty-icon">🎯</div>
                <div className="gl-empty-title" style={{ color: T.text }}>No Goals Yet</div>
                <div style={{ color: T.textMuted }}>Add your first financial goal to start tracking your progress</div>
              </div>
            </Card>
          )}
          {goals.map(g => (
            <GoalCard key={g._id || g.id} g={g} profile={profile} deleteGoal={deleteGoal} T={T} getIcon={getIcon} fmt={fmt} />
          ))}
        </div>
      </div>
    </div>
  );
}
