import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { authAPI } from '../api';
import '../styles/auth.css';
import { Sparkles } from 'lucide-react';

export default function ForgotPassword({ onGoLogin }) {
  const { T } = useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!email) { 
      setError('Please enter your email.'); 
      return; 
    }
    
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-center" style={{ background: T.bg }}>
      <div className="auth-card" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
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

        <h2 className="auth-title" style={{ color: T.text }}>Reset Password</h2>
        <p className="auth-subtitle" style={{ color: T.textSub }}>Enter your email to receive a reset link</p>

        {error && (
          <div className="auth-error" style={{ background: T.roseLight, color: T.rose, border: `1px solid ${T.rose}33` }}>
            ⚠️ {error}
          </div>
        )}
        
        {message && (
          <div className="auth-error" style={{ background: T.teal + '33', color: T.teal, border: `1px solid ${T.teal}` }}>
            ✅ {message}
          </div>
        )}

        <div className="auth-field">
          <label style={{ color: T.textSub }}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
          {loading ? '⏳ Sending…' : 'Send Reset Link →'}
        </button>

        <p className="auth-back" onClick={onGoLogin} style={{ color: T.textMuted, marginTop: '1rem', cursor: 'pointer' }}>
          ← Back to Login
        </p>
      </div>
    </div>
  );
}
