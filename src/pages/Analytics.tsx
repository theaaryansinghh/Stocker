import React, { useEffect, useRef, useState } from 'react';
import { View, AppState } from '../types';
import Shell from '../components/Shell';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Props {
  appState: AppState;
  onNavigate: (v: View) => void;
}

const MONTHS = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
const PORTFOLIO_RETURNS = [2.1, -0.8, 3.4, 1.2, 4.1, -1.3, 2.9, 5.2, 1.8];
const SP500_RETURNS     = [1.4, -1.2, 2.1, 0.8, 2.9, -0.9, 1.7, 3.1, 1.1];

const METRICS = [
  { label: 'Sharpe Ratio',      value: '2.14',   sub: 'risk-adjusted return',    color: 'var(--primary)'  },
  { label: 'Alpha vs S&P 500',  value: '+4.2%',  sub: 'quarterly outperformance', color: 'var(--primary)'  },
  { label: 'Max Drawdown',      value: '-8.3%',  sub: 'worst peak-to-trough',    color: 'var(--error)'    },
  { label: 'Win Rate',          value: '67%',    sub: 'profitable trades',        color: 'var(--primary)'  },
  { label: 'Volatility (Ann.)', value: '18.4%',  sub: 'annualised std deviation', color: 'var(--tertiary)' },
  { label: 'Sortino Ratio',     value: '3.02',   sub: 'downside risk-adjusted',   color: 'var(--primary)'  },
];

const SENTIMENT = [
  { ticker: 'NVDA', score: 92, label: 'Very Bullish' },
  { ticker: 'AAPL', score: 61, label: 'Bullish'      },
  { ticker: 'MSFT', score: 74, label: 'Bullish'      },
  { ticker: 'TSLA', score: 38, label: 'Bearish'      },
  { ticker: 'AMZN', score: 55, label: 'Neutral'      },
];

function sentimentColor(score: number) {
  if (score >= 70) return 'var(--primary)';
  if (score >= 50) return 'var(--tertiary)';
  return 'var(--error)';
}

export default function Analytics({ appState, onNavigate }: Props) {
  const barRef   = useRef<HTMLCanvasElement>(null);
  const lineRef  = useRef<HTMLCanvasElement>(null);
  const barChart = useRef<Chart | null>(null);
  const lineChart = useRef<Chart | null>(null);
  const [activeTab, setActiveTab] = useState<'returns'|'drawdown'>('returns');

  // Bar chart — monthly returns comparison
  useEffect(() => {
    if (!barRef.current || barChart.current) return;
    barChart.current = new Chart(barRef.current.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: 'Portfolio',
            data: PORTFOLIO_RETURNS,
            backgroundColor: PORTFOLIO_RETURNS.map(v => v >= 0 ? 'rgba(0,228,117,0.7)' : 'rgba(255,180,171,0.7)'),
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'S&P 500',
            data: SP500_RETURNS,
            backgroundColor: 'rgba(141,205,255,0.25)',
            borderColor: 'rgba(141,205,255,0.6)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#64748b', font: { size: 11 }, boxWidth: 12, padding: 16 },
          },
        },
        scales: {
          x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
          y: {
            ticks: { callback: (v: any) => v + '%', color: '#475569', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
    return () => { barChart.current?.destroy(); barChart.current = null; };
  }, []);

  // Line chart — cumulative performance
  useEffect(() => {
    if (!lineRef.current || lineChart.current) return;
    const cumPort = PORTFOLIO_RETURNS.reduce<number[]>((acc, v) => {
      acc.push((acc[acc.length - 1] ?? 100) * (1 + v / 100));
      return acc;
    }, []);
    const cumSP = SP500_RETURNS.reduce<number[]>((acc, v) => {
      acc.push((acc[acc.length - 1] ?? 100) * (1 + v / 100));
      return acc;
    }, []);
    lineChart.current = new Chart(lineRef.current.getContext('2d')!, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: 'Portfolio',
            data: cumPort,
            borderColor: '#00e475',
            backgroundColor: 'rgba(0,228,117,0.06)',
            borderWidth: 2, pointRadius: 3, fill: true, tension: 0.4,
          },
          {
            label: 'S&P 500',
            data: cumSP,
            borderColor: '#8dcdff',
            backgroundColor: 'transparent',
            borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false, tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#64748b', font: { size: 11 }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}` },
          },
        },
        scales: {
          x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
          y: {
            ticks: { callback: (v: any) => v.toFixed(0), color: '#475569', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
    return () => { lineChart.current?.destroy(); lineChart.current = null; };
  }, []);

  const { modelMeta, lastPredict, currentTicker } = appState;

  return (
    <Shell currentView="analytics" onNavigate={onNavigate} title="Analytics" ticker={currentTicker} predict={lastPredict}>

      {/* Metric cards */}
      <div className="ana-metrics-row">
        {METRICS.map(m => (
          <div key={m.label} className="ana-metric-card">
            <div className="ana-metric-label">{m.label}</div>
            <div className="ana-metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="ana-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="ana-charts-row">

        {/* Monthly returns bar */}
        <div className="ana-card ana-card-lg">
          <div className="ana-card-header">
            <span className="ana-card-title">Monthly Returns — Portfolio vs S&P 500</span>
            <div className="ana-tab-group">
              <button className={`ana-tab ${activeTab === 'returns' ? 'active' : ''}`} onClick={() => setActiveTab('returns')}>Monthly</button>
              <button className={`ana-tab ${activeTab === 'drawdown' ? 'active' : ''}`} onClick={() => setActiveTab('drawdown')}>Cumulative</button>
            </div>
          </div>
          <div style={{ height: 240, display: activeTab === 'returns' ? 'block' : 'none' }}>
            <canvas ref={barRef} />
          </div>
          <div style={{ height: 240, display: activeTab === 'drawdown' ? 'block' : 'none' }}>
            <canvas ref={lineRef} />
          </div>
        </div>

        {/* AI Sentiment */}
        <div className="ana-card">
          <div className="ana-card-title" style={{ marginBottom: 20 }}>AI Sentiment Scores</div>
          <div className="ana-sentiment-list">
            {SENTIMENT.map(s => (
              <div key={s.ticker} className="ana-sentiment-row">
                <div className="ana-sentiment-left">
                  <span className="ana-sent-sym">{s.ticker}</span>
                  <span className="ana-sent-label" style={{ color: sentimentColor(s.score) }}>{s.label}</span>
                </div>
                <div className="ana-sent-bar-wrap">
                  <div className="ana-sent-bar-bg">
                    <div className="ana-sent-bar-fill" style={{ width: `${s.score}%`, background: sentimentColor(s.score) }} />
                  </div>
                  <span className="ana-sent-score" style={{ color: sentimentColor(s.score) }}>{s.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — ML model stats + trade log */}
      <div className="ana-bottom-row">

        {/* ML Model performance */}
        <div className="ana-card">
          <div className="ana-card-title" style={{ marginBottom: 20 }}>Neural Network Performance</div>
          {modelMeta ? (
            <div className="ana-ml-grid">
              {[
                { label: 'Model Type',   value: 'MLP (128→64→32)' },
                { label: 'R² Score',     value: modelMeta.r2.toString() },
                { label: 'MSE',          value: modelMeta.mse.toString() },
                { label: 'Data Points',  value: modelMeta.data_points.toLocaleString() },
                { label: 'Date Range',   value: modelMeta.date_range },
                { label: 'Last Signal',  value: lastPredict?.signal ?? '—' },
              ].map(row => (
                <div key={row.label} className="ana-ml-row">
                  <span className="ana-ml-label">{row.label}</span>
                  <span className={`ana-ml-val ${row.label === 'Last Signal' ? (lastPredict?.signal ?? '') : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="ana-ml-accuracy-wrap">
                <div className="ana-ml-accuracy-label">Model Accuracy (R²)</div>
                <div className="ana-ml-accuracy-bar-bg">
                  <div className="ana-ml-accuracy-bar-fill" style={{ width: `${(modelMeta.r2 * 100).toFixed(0)}%` }} />
                </div>
                <span className="ana-ml-accuracy-pct">{(modelMeta.r2 * 100).toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div className="ana-ml-empty">
              <div className="ana-ml-empty-icon">🧠</div>
              <p>Train the model in the Terminal to see neural network performance metrics.</p>
              <button className="ana-go-terminal-btn" onClick={() => onNavigate('terminal')}>
                Open Terminal →
              </button>
            </div>
          )}
        </div>

        {/* Trade log */}
        <div className="ana-card ana-card-lg">
          <div className="ana-card-title" style={{ marginBottom: 20 }}>Recent Trade Log</div>
          <table className="ana-trade-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th>Action</th>
                <th>Shares</th>
                <th>Price</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'Apr 09', ticker: 'AAPL', action: 'BUY',  shares: 12,  price: 192.12, pnl: null      },
                { date: 'Apr 07', ticker: 'NVDA', action: 'SELL', shares: 50,  price: 824.10, pnl: +4120.50  },
                { date: 'Apr 05', ticker: 'TSLA', action: 'SELL', shares: 30,  price: 177.30, pnl:  -892.20  },
                { date: 'Apr 02', ticker: 'MSFT', action: 'BUY',  shares: 20,  price: 378.91, pnl: null      },
                { date: 'Mar 31', ticker: 'AMZN', action: 'BUY',  shares: 15,  price: 186.62, pnl: null      },
                { date: 'Mar 28', ticker: 'GOOGL', action: 'SELL', shares: 40, price: 141.08, pnl: +1820.00  },
              ].map((t, i) => (
                <tr key={i}>
                  <td className="ana-td-muted">{t.date}</td>
                  <td><span className="ana-ticker-badge">{t.ticker}</span></td>
                  <td>
                    <span className={`port-signal-pill ${t.action === 'BUY' ? 'buy' : 'sell'}`} style={{ fontSize: 10 }}>
                      {t.action}
                    </span>
                  </td>
                  <td className="ana-td-num">{t.shares}</td>
                  <td className="ana-td-num">${t.price.toFixed(2)}</td>
                  <td className={`ana-td-num ${t.pnl === null ? '' : t.pnl >= 0 ? 'up' : 'down'}`}>
                    {t.pnl === null ? '—' : `${t.pnl >= 0 ? '+' : ''}$${Math.abs(t.pnl).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Shell>
  );
}