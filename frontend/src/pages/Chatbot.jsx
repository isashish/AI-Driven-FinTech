import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/chatbot.css';

import { useTheme } from '../context/ThemeContext.jsx';
import { Card, Badge, ImgBanner } from '../components/UI.jsx';
import { calcHealth, fmtK, IMGS } from '../utils.jsx';
import { chatAPI } from '../api';
import { Sparkles, Trash2, Send } from 'lucide-react';

// ── Simple markdown → JSX renderer ──────────────────────────────────────────
function MarkdownText({ text, color }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const renderInline = (str) => {
    // Bold: **text**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={idx} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Heading (## or ###)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const content = line.replace(/^#{2,3}\s/, '');
      elements.push(
        <div key={i} style={{ fontWeight: 700, fontSize: '0.95em', marginTop: 10, marginBottom: 4, color }}>
          {renderInline(content)}
        </div>
      );
    }
    // Bullet (• or - or *)
    else if (/^[•\-\*]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2, lineHeight: 1.5 }}>
          <span style={{ color, flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{renderInline(line.replace(/^[•\-\*]\s/, ''))}</span>
        </div>
      );
    }
    // Numbered list (1. 2. etc)
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2, lineHeight: 1.5 }}>
          <span style={{ color, flexShrink: 0, fontWeight: 600, minWidth: 18 }}>{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }
    // Warning / note line starting with ⚠️
    else if (line.startsWith('⚠️')) {
      elements.push(
        <div key={i} style={{ marginTop: 8, opacity: 0.7, fontSize: '0.82em', fontStyle: 'italic' }}>
          {line}
        </div>
      );
    }
    // Empty line = spacer
    else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    }
    // Normal paragraph
    else {
      elements.push(
        <div key={i} style={{ lineHeight: 1.6, marginTop: 2 }}>
          {renderInline(line)}
        </div>
      );
    }
    i++;
  }

  return <div style={{ fontSize: '0.9rem' }}>{elements}</div>;
}

export default function Chatbot({ profile }) {
  const { T } = useTheme();
  const [msgs, setMsgs] = useState([
    {
      role: 'assistant',
      text: "👋 **Hello! I'm your AI Financial Advisor.**\n\nI've analyzed your financial profile — ask me anything about:\n• Budgeting & savings\n• SIPs & mutual funds\n• Loan repayment strategy\n• Tax saving (80C, NPS, HRA)\n• Retirement planning\n• Emergency fund building\n\nI give personalized, actionable advice based on your data!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await chatAPI.getHistory();
        if (res.data.messages && res.data.messages.length > 0) {
          setMsgs((prev) => [
            prev[0],
            ...res.data.messages.map((m) => ({ role: m.role, text: m.content })),
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, []);

  const score = calcHealth(profile);
  const scoreColor = score >= 75 ? T.teal : score >= 50 ? T.amber : T.rose;

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', text: input.trim() };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(userMsg.text);
      const reply = res.data.reply || 'Sorry, I could not process that.';
      setMsgs((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg =
        err.response?.data?.message ||
        '⚠️ Connection error. Make sure the backend is running and your Gemini API key is set in Backend/.env';
      setMsgs((m) => [...m, { role: 'assistant', text: errMsg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const clearHistory = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await chatAPI.clearHistory();
      setMsgs([
        {
          role: 'assistant',
          text: "🗑️ Chat history cleared!\n\nFeel free to start a new conversation. Ask me anything about your finances!",
        },
      ]);
    } catch (err) {
      console.error('Clear history error:', err);
    } finally {
      setClearing(false);
    }
  };

  const suggestions = [
    'How can I improve my financial health score?',
    'Should I prepay my home loan or invest in SIP?',
    'How much corpus do I need for retirement?',
    'Best tax-saving investments for me?',
    'How to build a 6-month emergency fund fast?',
    'Explain PPF vs ELSS vs NPS',
  ];

  return (
    <div className="cb-page">
      <ImgBanner
        src={IMGS.advisor}
        title="AI Financial Advisor"
        subtitle="Powered by Google Gemini · Personalized to your complete financial profile"
        color={T.teal}
      />

      <div className="cb-layout">
        {/* ── Chat window ── */}
        <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="cb-header" style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <div
              className="cb-header-avatar"
              style={{
                background: `linear-gradient(135deg,${T.teal},${T.blue})`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div className="cb-header-info">
              <div className="cb-header-name" style={{ color: T.text }}>AI-FinTech Advisor</div>
              <div className="cb-header-status" style={{ color: T.green }}>
                <div className="cb-header-status-dot" style={{ background: T.green }} />
                Online · Powered by Gemini
              </div>
            </div>
            <div className="cb-header-badge" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge color={T.teal}>Score: {score}/100</Badge>
              <button
                onClick={clearHistory}
                disabled={clearing}
                title="Clear chat history"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: T.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.rose; e.currentTarget.style.borderColor = T.rose; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
              >
                <Trash2 size={13} />
                Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`cb-msg-row ${m.role === 'user' ? 'cb-msg-row-user' : 'cb-msg-row-bot'}`}>
                {m.role === 'assistant' && (
                  <div
                    className="cb-msg-avatar"
                    style={{
                      background: `linear-gradient(135deg,${T.teal},${T.blue})`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={14} />
                  </div>
                )}
                <div
                  className={`cb-msg-bubble ${m.role === 'user' ? 'cb-msg-bubble-user' : 'cb-msg-bubble-bot'}`}
                  style={{
                    background: m.role === 'user' ? `linear-gradient(135deg,${T.teal},${T.blue})` : T.bg,
                    color: m.role === 'user' ? '#fff' : T.text,
                    borderColor: m.role === 'assistant' ? T.border : 'transparent',
                    boxShadow: T.shadow,
                  }}
                >
                  {m.role === 'assistant' ? (
                    <MarkdownText text={m.text} color={T.teal} />
                  ) : (
                    <span style={{ fontSize: '0.9rem' }}>{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="cb-typing">
                <div
                  className="cb-msg-avatar"
                  style={{
                    background: `linear-gradient(135deg,${T.teal},${T.blue})`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={14} />
                </div>
                <div className="cb-typing-box" style={{ background: T.bg, borderColor: T.border }}>
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="cb-typing-dot"
                      style={{ background: T.teal, animation: `blink 1s ${idx * 0.2}s infinite` }}
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about investments, loans, tax saving, SIP..."
              className="cb-input-field"
              style={{ background: T.surface, borderColor: T.border, color: T.text }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="cb-send-btn"
              style={{
                background: input.trim()
                  ? `linear-gradient(135deg,${T.teal},${T.blue})`
                  : T.border,
                boxShadow: input.trim() ? `0 4px 14px ${T.teal}44` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Send size={15} />
              Send
            </button>
          </div>
        </Card>

        {/* ── Sidebar ── */}
        <div className="cb-sidebar">
          <Card>
            <div className="cb-qs-title" style={{ color: T.text }}>💡 Quick Questions</div>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
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
              { l: 'Income',       v: fmtK(profile.income),   c: T.teal  },
              { l: 'Savings Rate', v: `${profile.income ? Math.round((profile.savings / profile.income) * 100) : 0}%`, c: T.blue },
              { l: 'Health Score', v: `${score}/100`,          c: scoreColor },
              { l: 'Emergency',    v: fmtK(profile.emergency), c: T.violet },
            ].map(({ l, v, c }) => (
              <div key={l} className="cb-snap-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="cb-snap-label" style={{ color: T.textMuted }}>{l}</span>
                <span className="cb-snap-value" style={{ color: c }}>{v}</span>
              </div>
            ))}
          </Card>

          {/* AI Status card */}
          <Card>
            <div style={{ color: T.text, fontWeight: 600, marginBottom: 10, fontSize: '0.85rem' }}>
              🤖 AI Advisor Status
            </div>
            <div style={{ fontSize: '0.8rem', color: T.textMuted, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                <span>AI Advisor Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                <span>Personalized to your data</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                <span>Financial context loaded</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
