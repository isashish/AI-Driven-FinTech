import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import ThemeToggle from "../components/ThemeToggle";
import '../styles/auth.css';

const FEATURES = [
  { emoji: '📊', title: 'Smart Dashboard', desc: 'Real-time financial health score with actionable insights.' },
  { emoji: '🎯', title: 'Goal Planner', desc: 'Set, track, and reach your financial goals with AI guidance.' },
  { emoji: '📈', title: 'Investment Insights', desc: 'Portfolio analysis and smart allocation recommendations.' },
  { emoji: '💳', title: 'Debt Optimizer', desc: 'Crush debt faster with avalanche & snowball strategies.' },
  { emoji: '🔬', title: 'What-If Simulator', desc: 'Model financial scenarios before you commit.' },
  { emoji: '🤖', title: 'AI Advisor', desc: 'Chat with Claude AI for personalised financial advice.' },
];

export default function Landing({ onLogin, onSignup }) {
  const { T, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="auth-page"
      style={{
        background: T.bg,
        color: T.text,
        "--teal": T.teal,
        "--blue": T.blue,
        "--surface": T.surface
      }}
    >

      {/* NAV */}
      <nav className="landing-nav" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="landing-nav-inner">

          {/* Logo */}
          <div className="landing-logo">
            <div
              className="landing-logo-icon"
              style={{
                background: `linear-gradient(135deg,${T.teal},${T.blue})`,
                boxShadow: `0 4px 14px ${T.teal}44`
              }}
            >
              💎
            </div>
            <div>
              <div className="landing-logo-name" style={{ color: T.text }}>AI-FinTech</div>
              <div className="landing-logo-sub" style={{ color: T.textMuted }}>Health Planner</div>
            </div>
          </div>

          {/* Hamburger Icon (Mobile Only) */}
          <button
            className="landing-menu-toggle"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          {/* Nav Buttons */}
          <div className={`landing-nav-actions ${menuOpen ? 'active' : ''}`}>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            <button
            className="auth-btn-ghost"
            onClick={() => {
              setMenuOpen(false);
              onLogin();
            }}
            style={{ color: T.teal, borderColor: T.teal }}
            >
              Log In
            </button>

            <button
              className="auth-btn-primary"
              onClick={() => {
                setMenuOpen(false);
                onSignup();
              }}
              style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})` }}
            >
              Get Started Free
            </button>

          </div>
        </div>
      </nav>

      {/* ---- Rest of your component stays EXACTLY SAME ---- */}

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-hero-badge"
          style={{ background: T.tealLight, color: T.teal, border: `1px solid ${T.teal}33` }}>
          ✨ Powered by AI Intelligence
        </div>
          <h1 className="landing-hero-title">
            Your Financial Health,<br />
            <span className="gradient-text">
              Supercharged by AI-FinTech
            </span>
          </h1>

        <p className="landing-hero-sub" style={{ color: T.textSub }}>
          Track goals, optimise debt, simulate scenarios, and receive AI-driven financial guidance — all in one seamless platform.
        </p>
        <div className="landing-hero-cta">
          <button className="auth-btn-primary auth-btn-lg" onClick={onSignup}
            style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 8px 28px ${T.teal}44` }}>
            Start for Free →
          </button>
          <button className="auth-btn-ghost auth-btn-lg" onClick={onLogin}
            style={{ color: T.textSub, borderColor: T.border }}>
            I already have an account
          </button>
        </div>

        {/* Score badge decoration */}
        <div className="landing-score-badge" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: `0 8px 32px ${T.teal}22` }}>
          <div className="landing-score-num" style={{ color: T.teal }}>84</div>
          <div>
            <div className="landing-score-label" style={{ color: T.text }}>Financial Health</div>
            <div className="landing-score-sub" style={{ color: T.textMuted }}>Excellent · Top 12%</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-features" style={{ background: isDark ? T.surface : '#F0F4FF' }}>
        <h2 className="landing-section-title" style={{ color: T.text }}>Everything you need to thrive financially</h2>
        <p className="landing-section-sub" style={{ color: T.textSub }}>Six powerful modules. One intelligent platform.</p>
        <div className="landing-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="landing-feature-card"
              style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div className="landing-feature-emoji"
                style={{ background: T.tealLight }}>{f.emoji}</div>
              <div className="landing-feature-title" style={{ color: T.text }}>{f.title}</div>
              <div className="landing-feature-desc" style={{ color: T.textSub }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="landing-cta-banner"
        style={{ background: `linear-gradient(135deg,${T.teal}22,${T.blue}22)`, border: `1px solid ${T.teal}33` }}>
        <h2 className="landing-cta-title" style={{ color: T.text }}>Ready to take control of your finances?</h2>
        <p style={{ color: T.textSub, marginBottom: 28 }}>Join thousands already on the path to financial freedom.</p>
        <button className="auth-btn-primary auth-btn-lg" onClick={onSignup}
          style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 8px 28px ${T.teal}44` }}>
          Create Free Account →
        </button>
      </section>
      

      {/* FOOTER */}
      <footer className="landing-footer" style={{ borderTop: `1px solid ${T.border}`, color: T.textMuted }}>
        <span>💎 AI-Driven FinTech</span>
        <span style={{ color: T.teal }}>Powered by Ashish and Team</span>
        
      </footer>
    </div>
  );
}
