import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useTheme } from '../context/ThemeContext.jsx';
import { Card, Badge, ImgBanner } from '../components/UI.jsx';
import { calcHealth, fmtK, IMGS } from '../utils.jsx';
import { chatAPI } from '../api';

export default function Chatbot({ profile }) {
  const { T } = useTheme();
  const [msgs,    setMsgs]    = useState([
    { role: 'assistant', text: "👋 Hello! I'm your personal AI Financial Advisor.\n\nI've analyzed your financial profile — ask me anything about budgeting, SIPs, loan repayment, tax saving, or wealth building. I give personalized, actionable advice!" }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await chatAPI.getHistory();
        if (res.data.messages && res.data.messages.length > 0) {
          setMsgs(prev => [
            prev[0], // Keep welcome message
            ...res.data.messages.map(m => ({ role: m.role, text: m.content }))
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, []);

  const score      = calcHealth(profile);
  const scoreColor = score >= 75 ? T.teal : score >= 50 ? T.amber : T.rose;

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', text: input };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await chatAPI.sendMessage(userMsg.text);
      const reply = res.data.reply || 'Sorry, I could not process that.';
      setMsgs(m => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMsgs(m => [...m, { role: 'assistant', text: '⚠️ Connection error. Please make sure the backend is running and your API key is set.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const suggestions = [
    'How can I improve my financial health score?',
    'Should I prepay my home loan or invest in SIP?',
    'How much corpus do I need for retirement?',
    'Best tax-saving investments for me?',
    'How to build a 6-month emergency fund fast?',
  ];

  return (
    <div className="cb-page">
      <ImgBanner src={IMGS.advisor} title="AI Financial Advisor" subtitle="Powered by Claude AI · Personalized to your complete financial profile" color={T.teal} />

      <div className="cb-layout">
        {/* Chat window */}
        <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="cb-header" style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <div
              className="cb-header-avatar"
              style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})` }}
            >🤖</div>
            <div className="cb-header-info">
              <div className="cb-header-name" style={{ color: T.text }}>FinAI Advisor</div>
              <div className="cb-header-status" style={{ color: T.green }}>
                <div className="cb-header-status-dot" style={{ background: T.green }} />
                Online · Ready to help
              </div>
            </div>
            <div className="cb-header-badge">
              <Badge color={T.teal}>Score: {score}/100</Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`cb-msg-row ${m.role === 'user' ? 'cb-msg-row-user' : 'cb-msg-row-bot'}`}>
                {m.role === 'assistant' && (
                  <div
                    className="cb-msg-avatar"
                    style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})` }}
                  >🤖</div>
                )}
                <div
                  className={`cb-msg-bubble ${m.role === 'user' ? 'cb-msg-bubble-user' : 'cb-msg-bubble-bot'}`}
                  style={{
                    background:   m.role === 'user' ? `linear-gradient(135deg,${T.teal},${T.blue})` : T.bg,
                    color:        m.role === 'user' ? '#fff' : T.text,
                    borderColor:  m.role === 'assistant' ? T.border : 'transparent',
                    boxShadow:    T.shadow,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="cb-typing">
                <div
                  className="cb-msg-avatar"
                  style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})` }}
                >🤖</div>
                <div className="cb-typing-box" style={{ background: T.bg, borderColor: T.border }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="cb-typing-dot"
                      style={{ background: T.teal, animation: `blink 1s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input bar */}
          <div className="cb-input-bar" style={{ borderTopColor: T.border, background: T.bg }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about investments, loans, tax saving..."
              className="cb-input-field"
              style={{ background: T.surface, borderColor: T.border, color: T.text }}
            />
            <button
              onClick={send}
              disabled={loading}
              className="cb-send-btn"
              style={{
                background:  `linear-gradient(135deg,${T.teal},${T.blue})`,
                boxShadow:   `0 4px 14px ${T.teal}44`,
              }}
            >
              Send ↗
            </button>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="cb-sidebar">
          <Card>
            <div className="cb-qs-title" style={{ color: T.text }}>💡 Quick Questions</div>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="cb-qs-btn"
                style={{ background: T.bg, borderColor: T.border, color: T.textSub }}
              >
                {s}
              </button>
            ))}
          </Card>

          <Card>
            <div className="cb-snap-title" style={{ color: T.text }}>📊 Your Snapshot</div>
            {[
              { l: 'Income',       v: fmtK(profile.income),   c: T.teal     },
              { l: 'Savings Rate', v: `${profile.income ? Math.round(profile.savings / profile.income * 100) : 0}%`, c: T.blue },
              { l: 'Health Score', v: `${score}/100`,          c: scoreColor },
              { l: 'Emergency',    v: fmtK(profile.emergency), c: T.violet   },
            ].map(({ l, v, c }) => (
              <div key={l} className="cb-snap-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="cb-snap-label" style={{ color: T.textMuted }}>{l}</span>
                <span className="cb-snap-value" style={{ color: c }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
