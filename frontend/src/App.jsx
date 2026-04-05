import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import MobileNavbar from './components/MobileNavbar';

import Dashboard  from './pages/Dashboard';
import Profile    from './pages/Profile';
import Goals      from './pages/Goals';
import Investment from './pages/Investment';
import Debt       from './pages/Debt';
import WhatIf     from './pages/WhatIf';
import Chatbot    from './pages/Chatbot';
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Signup     from './pages/Signup';

import { calcHealth } from './utils.jsx';
import { profileAPI, goalsAPI } from './api';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',        emoji: '📊' },
  { id: 'profile',    label: 'Financial Profile', emoji: '👤' },
  { id: 'goals',      label: 'Goal Planner',      emoji: '🎯' },
  { id: 'investment', label: 'Investments',       emoji: '📈' },
  { id: 'debt',       label: 'Debt Optimizer',    emoji: '💳' },
  { id: 'whatif',     label: 'What-If Simulator', emoji: '🔬' },
  { id: 'chatbot',    label: 'AI Advisor',        emoji: '🤖' },
];

function ThemeToggle() {
  const { isDark, toggleTheme, T } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="app-theme-btn"
      style={{ background: isDark ? '#1E2738' : '#F0F4FF', borderColor: T.border }}
    >
      <div className="app-theme-track" style={{ background: isDark ? T.teal : T.border }}>
        <div className="app-theme-knob" style={{ left: isDark ? 16 : 3 }} />
      </div>
      <span className="app-theme-label" style={{ color: T.textSub }}>
        {isDark ? '🌙 Dark' : '☀️ Light'}
      </span>
    </button>
  );
}

function AppInner() {
  const { T, isDark } = useTheme();
  const [screen, setScreen] = useState('landing');
  const [page,        setPage]        = useState('dashboard'); // Default to dashboard
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  
  const [profile, setProfile] = useState({
    income: 0, expenses: 0, savings: 0,
    emi: 0, investments: 0, emergency: 0,
  });
  const [goals, setGoals] = useState([]);

  // Check auth and fetch data
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setScreen('app');
        await fetchData();
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, gRes] = await Promise.all([
        profileAPI.get(),
        goalsAPI.getAll()
      ]);
      setProfile(pRes.data.profile);
      setGoals(gRes.data.goals);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // If unauthorized, logout
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    await fetchData();
    setScreen('app');
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setScreen('landing');
  };

  const score      = calcHealth(profile);
  const scoreColor = score >= 75 ? T.teal : score >= 50 ? T.amber : T.rose;
  const navigate   = id => { setPage(id); setSidebarOpen(false); };

  const globalStyle = `body { background: ${T.bg}; color: ${T.text}; }`;

  if (loading && screen === 'app') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.text }}>
      <div className="spinner">⌛ Loading your finances...</div>
    </div>
  );

  if (screen === 'landing') return (
    <><style>{globalStyle}</style>
    <Landing onLogin={() => setScreen('login')} onSignup={() => setScreen('signup')} /></>
  );

  if (screen === 'login') return (
    <><style>{globalStyle}</style>
    <Login onLogin={handleLogin} onGoSignup={() => setScreen('signup')} onGoLanding={() => setScreen('landing')} /></>
  );

  if (screen === 'signup') return (
    <><style>{globalStyle}</style>
    <Signup onSignup={handleLogin} onGoLogin={() => setScreen('login')} onGoLanding={() => setScreen('landing')} /></>
  );

  const pages = {
    dashboard:  <Dashboard  profile={profile} goals={goals} refreshData={fetchData} />,
    profile:    <Profile    profile={profile} setProfile={setProfile} onUpdate={fetchData} />,
    goals:      <Goals      goals={goals} setGoals={setGoals} profile={profile} onUpdate={fetchData} />,
    investment: <Investment />,
    debt:       <Debt />,
    whatif:     <WhatIf     profile={profile} />,
    chatbot:    <Chatbot    profile={profile} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
        body { background: ${T.bg}; color: ${T.text}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; }
        input[type=range] { background: ${T.border}; }
        select option { background: ${T.surface}; color: ${T.text}; }
        .spinner { font-size: 20px; font-weight: 600; animate: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
     
      <MobileNavbar
        toggleSidebar={() => setSidebarOpen(o => !o)}
        T={T}
      />

      <div className={`app-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="app-shell">
        {/* SIDEBAR */}
        <div
          className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{ background: T.sidebarBg, borderRight: `1px solid ${T.border}`,
            boxShadow: isDark ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 20px rgba(60,80,160,0.06)' }}
        >
          <div className="app-logo-wrap">
            <div className="app-logo-inner">
              <div className="app-logo-icon"
                style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, boxShadow: `0 4px 14px ${T.teal}44` }}>
                💎
              </div>
              <div>
                <div className="app-logo-name" style={{ color: T.text }}>AI-FinTech</div>
                <div className="app-logo-sub" style={{ color: T.textMuted }}>Health Planner</div>
              </div>
            </div>
          </div>

          <div className="app-score-pill" style={{ background: scoreColor + '15', border: `1px solid ${scoreColor}30` }}>
            <div className="app-score-label" style={{ color: T.textMuted }}>Health Score</div>
            <div className="app-score-row">
              <div className="app-score-num" style={{ color: scoreColor }}>{score}</div>
              <div className="app-score-bar-wrap">
                <div className="app-score-bar-track" style={{ background: T.border }}>
                  <div className="app-score-bar-fill"
                    style={{ background: `linear-gradient(90deg,${scoreColor},${scoreColor}88)`, width: `${score}%` }} />
                </div>
                <div className="app-score-out" style={{ color: T.textMuted }}>out of 100</div>
              </div>
            </div>
          </div>

          <nav className="app-nav">
            {NAV.map(({ id, label, emoji }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`app-nav-btn ${active ? 'active' : ''}`}
                  style={{
                    background: active ? T.navActive : 'transparent',
                    borderLeft: `3px solid ${active ? T.teal : 'transparent'}`,
                    color: active ? T.teal : T.textMuted,
                  }}
                >
                  <span className="app-nav-emoji">{emoji}</span>
                  {label}
                  {active && <div className="app-nav-dot" style={{ background: T.teal }} />}
                </button>
              );
            })}
          </nav>

          <div className="app-footer" style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={handleLogout} className="app-theme-btn" style={{ width: '100%', marginBottom: 10, background: T.rose + '22', color: T.rose, borderColor: T.rose + '44' }}>
              🚪 Logout
            </button>
            <ThemeToggle />
            <div className="app-footer-tagline" style={{ color: T.textMuted }}>
              AI-Driven FinTech Platform<br />
              <span className="app-footer-brand" style={{ color: T.teal }}>Powered by Ashish and Team's</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="app-main" style={{ background: T.bg }}>
          {pages[page]}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return <ThemeProvider><AppInner /></ThemeProvider>;
}
