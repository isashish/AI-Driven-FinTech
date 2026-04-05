import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import '../styles/auth.css';

export default function Login({ onLogin, onGoSignup, onGoLanding }) {
  const { T } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    // Simulate auth — replace with your real auth logic
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onLogin();          // navigate into the app
  };

  return (
    <div className="auth-page auth-center" style={{ background: T.bg }}>
      <div className="auth-card" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        {/* Logo */}
        <div className="auth-logo-row">
          <div className="auth-logo-icon"
            style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 4px 14px ${T.teal}44` }}>
            💎
          </div>
          <div>
            <div className="auth-logo-name" style={{ color: T.text }}>FinAI</div>
            <div className="auth-logo-sub" style={{ color: T.textMuted }}>Health Planner</div>
          </div>
        </div>

        <h2 className="auth-title" style={{ color: T.text }}>Welcome back</h2>
        <p className="auth-subtitle" style={{ color: T.textSub }}>Sign in to your account to continue</p>

        {error && (
          <div className="auth-error" style={{ background: T.roseLight, color: T.rose, border: `1px solid ${T.rose}33` }}>
            ⚠️ {error}
          </div>
        )}

        <div className="auth-field">
          <label style={{ color: T.textSub }}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
          />
        </div>

        <div className="auth-field">
          <label style={{ color: T.textSub }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <div className="auth-forgot" style={{ color: T.teal }}>Forgot password?</div>
        </div>

        <button
          className="auth-btn-primary auth-btn-full"
          onClick={handleSubmit}
          disabled={loading}
          style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Signing in…' : 'Sign In →'}
        </button>

        <div className="auth-divider"><span style={{ background: T.surface, color: T.textMuted }}>or</span></div>

        <button
          className="auth-btn-ghost auth-btn-full"
          style={{ color: T.textSub, borderColor: T.border }}
          onClick={() => {}}
        >
          <span>🔵</span> Continue with Google
        </button>

        <p className="auth-switch" style={{ color: T.textMuted }}>
          Don't have an account?{' '}
          <span onClick={onGoSignup} style={{ color: T.teal, cursor: 'pointer', fontWeight: 700 }}>
            Sign up free
          </span>
        </p>

        <p className="auth-back" onClick={onGoLanding} style={{ color: T.textMuted }}>
          ← Back to home
        </p>
      </div>
    </div>
  );
}
