import React, { useState, useEffect } from 'react';
import '../styles/investment.css';

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, GradCard, RangeInput, ImgBanner, ChartTooltip, Badge } from '../components/UI.jsx';
import { genInvestData, fmtK, IMGS } from '../utils.jsx';
import { predictionsAPI } from '../api';
import { Brain, ShieldAlert, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

export default function Investment() {
  const { T, isDark } = useTheme();
  const [P, setP] = useState(100000);
  const [sip, setSip] = useState(10000);
  const [r, setR] = useState(12);
  const [yrs, setYrs] = useState(10);

  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiForecast, setShowAiForecast] = useState(true);

  const fetchAIInsights = async () => {
    setAiLoading(true);
    try {
      const plan = { initial_investment: P, monthly_sip: sip, annual_return: r, years: yrs };
      const [investRes, suggRes] = await Promise.all([
        predictionsAPI.getAIInvest(plan),
        predictionsAPI.getAISuggestions(plan)
      ]);

      setAiData(investRes.data);
      setAiSuggestions(suggRes.data.suggestions || []);
    } catch (err) {
      console.error('AI Insights failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAIInsights, 1000); // Debounce AI calls
    return () => clearTimeout(timer);
  }, [P, sip, r, yrs]);

  const standardData = genInvestData(P, sip, r, yrs);
  // Merge AI forecast data into standard data if available
  const data = standardData.map((d, i) => ({
    ...d,
    ai_forecast: aiData?.growth?.[i]?.ai_forecast || d.value // Fallback to standard
  }));

  const fin = data[data.length - 1];
  const roi = fin.invested ? Math.round(fin.gains / fin.invested * 100) : 0;
  const mult = fin.invested ? (fin.value / fin.invested).toFixed(1) : '–';

  const compData = [
    { name: 'FD (7%)', ...genInvestData(P, sip, 7, yrs)[yrs] },
    { name: 'Debt MF (9%)', ...genInvestData(P, sip, 9, yrs)[yrs] },
    { name: 'Balanced', ...genInvestData(P, sip, 11, yrs)[yrs] },
    { name: 'Your Rate', ...genInvestData(P, sip, r, yrs)[yrs] },
    { name: 'Small Cap', ...genInvestData(P, sip, r + 4, yrs)[yrs] },
  ];

  return (
    <div className="inv-page">
      <ImgBanner
        src={IMGS.invest}
        title="AI Investment Predictor"
        subtitle="Compound growth modeling · Time-series forecasting · AI recommendations"
        color={T.violet}
      />

      <div className="inv-grid">
        <div className="inv-controls">
          <Card>
            <div className="inv-params-title" style={{ color: T.text, display: 'flex', justifyContent: 'space-between' }}>
              <span>🎛 Parameters</span>
              <RefreshCw
                size={14}
                className={aiLoading ? 'spin' : ''}
                style={{ cursor: 'pointer', opacity: 0.5 }}
                onClick={fetchAIInsights}
              />
            </div>
            <RangeInput label="Initial Investment" min={0} max={2000000} step={10000} value={P} onChange={setP} format={fmtK} />
            <RangeInput label="Monthly SIP" min={500} max={100000} step={500} value={sip} onChange={setSip} format={fmtK} color={T.blue} />
            <RangeInput label="Annual Return %" min={4} max={30} step={0.5} value={r} onChange={setR} format={v => `${v}%`} color={T.violet} />
            <RangeInput label="Time Horizon (yrs)" min={1} max={30} value={yrs} onChange={setYrs} format={v => `${v} yr`} color={T.amber} />
          </Card>

          {/* AI Insights Card */}
          <Card style={{ border: `1.5px solid ${T.violet}33` }}>
            <div className="inv-ai-title" style={{ color: T.violet }}>
              <Brain size={18} /> AI Financial Insight
            </div>

            {aiLoading && !aiData ? (
              <div className="inv-ai-loading">🔮 Analyzing market data...</div>
            ) : (
              <div className="inv-ai-insights">
                <div className="inv-ai-risk-row">
                  <span style={{ fontSize: 13, color: T.textSub }}>Risk Profile</span>
                  <span className="inv-ai-risk-badge" style={{
                    background: aiData?.risk?.risk_level === 'High' ? T.rose + '22' : T.teal + '22',
                    color: aiData?.risk?.risk_level === 'High' ? T.rose : T.teal
                  }}>
                    {aiData?.risk?.risk_level || 'Moderate'}
                  </span>
                </div>

                <div className="inv-ai-risk-row">
                  <span style={{ fontSize: 12, color: T.textMuted }}>Volatility Index</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{aiData?.risk?.volatility_index || '2.44'}</span>
                </div>

                <div style={{ margin: '8px 0', padding: '12px', background: T.bg, borderRadius: '12px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>P(Success) Probability</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${aiData?.risk?.probability_of_success || 75}%`, background: T.teal, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{aiData?.risk?.probability_of_success || 75}%</span>
                  </div>
                </div>

                <div className="inv-ai-title" style={{ fontSize: 13, marginTop: 4, color: T.text }}>
                  <Sparkles size={14} /> AI Suggestions
                </div>

                <ul className="inv-ai-suggestion-list">
                  {(aiSuggestions.length > 0 ? aiSuggestions : [
                    "Consider diversifying into debt funds to lower volatility.",
                    "Set up an auto-increase SIP of 5% to combat inflation.",
                    "Review your portfolio rebalancing every 6 months."
                  ]).map((s, i) => (
                    <li key={i} className="inv-ai-suggestion-item" style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textSub }}>
                      <div className="inv-ai-suggestion-bullet" style={{ color: T.violet }}>✦</div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <GradCard from={T.teal} to={T.blue} style={{ padding: 20 }}>
            <div className="inv-mult-label">🚀 Wealth Multiplier</div>
            <div className="inv-mult-value">{mult}x</div>
            <div className="inv-mult-desc">
              Your ₹{fmtK(P)} + ₹{fmtK(sip)}/mo grows to <strong style={{ color: '#fff' }}>{fmtK(fin?.value || 0)}</strong> in {yrs} years
            </div>
          </GradCard>
        </div>

        <div className="inv-charts">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="inv-chart-title" style={{ color: T.text }}>📈 Growth Projection</div>
                <div className="inv-chart-sub" style={{ color: T.textMuted }}>Portfolio value vs amount invested over time</div>
              </div>
              <button
                onClick={() => setShowAiForecast(!showAiForecast)}
                style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: 11, fontWeight: 700,
                  background: showAiForecast ? T.violet + '22' : T.bg,
                  color: showAiForecast ? T.violet : T.textMuted,
                  border: `1px solid ${showAiForecast ? T.violet : T.border}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Brain size={12} /> {showAiForecast ? 'AI Forecast ON' : 'AI Forecast OFF'}
              </button>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.violet} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: T.textSub }} />
                <Area type="monotone" dataKey="value" stroke={T.teal} fill="url(#gVal)" strokeWidth={3} name="Portfolio Value" />
                {showAiForecast && (
                  <Area type="monotone" dataKey="ai_forecast" stroke={T.violet} fill="url(#gAi)" strokeWidth={2} name="AI Market Forecast" strokeDasharray="3 3" />
                )}
                <Area type="monotone" dataKey="invested" stroke={T.blue} fill="url(#gInv)" strokeWidth={2} name="Amount Invested" strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* --- VEER'S STOCK AI RESEARCH PANEL --- */}
          <Card style={{ marginTop: 20, border: `1px solid ${T.teal}44` }}>
            <div className="inv-chart-head" style={{ marginBottom: 20 }}>
              <div>
                <div className="inv-chart-title" style={{ color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color={T.teal} />
                  AI Stock Research Beta
                </div>
                <div className="inv-chart-sub" style={{ color: T.textMuted }}>Deep Learning LSTM Engine for Sequential Time-Series Market Forecasting</div>
              </div>
            </div>

            <StockSearchUI api={predictionsAPI} T={T} />
          </Card>

          <div className="inv-sub-charts">
            <Card>
              <div className="inv-chart-title-sm" style={{ color: T.text }}>Yearly Breakdown</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={data.filter((_, i) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="invested" fill={T.blue} name="Invested" stackId="a" />
                  <Bar dataKey="gains" fill={T.teal} name="Gains" stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="inv-chart-title-sm" style={{ color: T.text }}>Fund Comparison</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={compData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                  <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill={T.violet} name="Final Value" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component for Veer's Stock AI ---
function StockSearchUI({ api, T }) {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!symbol) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const [riskRes, predictRes] = await Promise.all([
        api.getStockRisk(symbol),
        api.getStockPredict(symbol)
      ]);

      if (riskRes.data.error || predictRes.data.error) {
        throw new Error(riskRes.data.message || predictRes.data.message || 'Stock data error');
      }

      setResults({
        risk: riskRes.data.analysis,
        predict: predictRes.data
      });
    } catch (err) {
      setError(err.message || 'Could not find stock. Try symbols like RELIANCE, TCS, or AAPL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-search-container">
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter Symbol (e.g. RELIANCE)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: '12px', border: `1px solid ${T.border}`,
            background: T.bg, color: T.text, outline: 'none'
          }}
        />
        <button
          disabled={loading}
          style={{
            padding: '10px 24px', borderRadius: '12px', background: T.teal, color: '#fff',
            border: 'none', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Stock'}
        </button>
      </form>

      {error && <div style={{ color: T.rose, fontSize: 13, marginBottom: 15 }}>{error}</div>}

      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div style={{ padding: 15, background: T.bg, borderRadius: 15, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 5 }}>AI Prediction (7 Days)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>₹{results?.predict?.predicted_price}</div>
            <div style={{ color: T.textSub, fontSize: 11, marginTop: 4 }}>
              Current: ₹{results?.predict?.current_price}
              <span style={{ marginLeft: 8, color: results?.predict?.predicted_price > results?.predict?.current_price ? T.green : T.rose }}>
                ({((results?.predict?.predicted_price / results?.predict?.current_price - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div style={{ padding: 15, background: T.bg, borderRadius: 15, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 5 }}>Security Risk</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: results?.risk?.risk_level === 'High' ? T.rose : T.teal }}>
              {results?.risk?.risk_level} Risk
            </div>
            <div style={{ color: T.textSub, fontSize: 11, marginTop: 4 }}>
              Volatility: {results?.risk?.volatility}% · Sharpe: {results?.risk?.sharpe_ratio}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
