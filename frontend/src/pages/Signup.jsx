import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import '../styles/auth.css';

export default function Signup({ onSignup, onGoLogin, onGoLanding }) {
  const { T } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    // Simulate registration — replace with your real auth logic
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onSignup();         // navigate into the app
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = [T.border, T.rose, T.amber, T.blue, T.teal][strength];

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

        <h2 className="auth-title" style={{ color: T.text }}>Create your account</h2>
        <p className="auth-subtitle" style={{ color: T.textSub }}>Start your financial health journey today — free forever</p>

        {error && (
          <div className="auth-error" style={{ background: T.roseLight, color: T.rose, border: `1px solid ${T.rose}33` }}>
            ⚠️ {error}
          </div>
        )}

        <div className="auth-field">
          <label style={{ color: T.textSub }}>Full name</label>
          <input
            type="text"
            placeholder="Arjun Sharma"
            value={form.name}
            onChange={set('name')}
            style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
          />
        </div>

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
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
          />
          {form.password && (
            <div className="auth-strength">
              <div className="auth-strength-bars">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="auth-strength-bar"
                    style={{ background: i <= strength ? strengthColor : T.border }} />
                ))}
              </div>
              <span style={{ color: strengthColor, fontSize: 11, fontWeight: 700 }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        <div className="auth-field">
          <label style={{ color: T.textSub }}>Confirm password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set('confirm')}
            style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button
          className="auth-btn-primary auth-btn-full"
          onClick={handleSubmit}
          disabled={loading}
          style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Creating account…' : 'Create Account →'}
        </button>

        <p className="auth-terms" style={{ color: T.textMuted }}>
          By signing up you agree to our{' '}
          <span style={{ color: T.teal }}>Terms of Service</span> and{' '}
          <span style={{ color: T.teal }}>Privacy Policy</span>.
        </p>

        <p className="auth-switch" style={{ color: T.textMuted }}>
          Already have an account?{' '}
          <span onClick={onGoLogin} style={{ color: T.teal, cursor: 'pointer', fontWeight: 700 }}>
            Sign in
          </span>
        </p>

        <p className="auth-back" onClick={onGoLanding} style={{ color: T.textMuted }}>
          ← Back to home
        </p>
      </div>
    </div>
  );
}
