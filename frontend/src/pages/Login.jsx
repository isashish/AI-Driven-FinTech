import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { authAPI } from '../api';
import '../styles/auth.css';
import { Sparkles } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login({ onLogin, onGoSignup, onGoLanding, onGoForgot }) {
  const { T } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      const res = await authAPI.googleLogin(tokenResponse.credential || tokenResponse.access_token);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Google Login failed. Credentials may be unconfigured.');
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Login Failed'),
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onLogin(); // navigate into the app
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-center" style={{ background: T.bg }}>
      <div className="auth-card" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        {/* Logo */}
        <div className="auth-logo-row">
          <div className="auth-logo-icon"
            style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 4px 14px ${T.teal}44`, color: '#fff' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div className="auth-logo-name" style={{ color: T.text }}>AI-FinTech</div>
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

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="auth-field">
            <label style={{ color: T.textSub }}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              style={{ background: T.inputBg, border: `1.5px solid ${T.border}`, color: T.text }}
              required
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
              required
            />
            <div
              className="auth-forgot"
              style={{ color: T.teal, cursor: 'pointer' }}
              onClick={onGoForgot}
            >
              Forgot password?
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn-primary auth-btn-full"
            disabled={loading}
            style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-divider"><span style={{ background: T.surface, color: T.textMuted }}>or</span></div>

        <button
          className="auth-btn-ghost auth-btn-full"
          style={{ color: T.textSub, borderColor: T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => loginGoogle()}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
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
