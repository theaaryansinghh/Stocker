import React, { useEffect, useRef } from 'react';
import { View, AppState } from '../types';
import Shell from '../components/Shell';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface DashboardProps {
  appState: AppState;
  onNavigate: (v: View) => void;
}

const ACTIVITIES = [
  { icon: '🛒', cls: 'buy',  name: 'Bought AAPL',         detail: 'Today, 2:14 PM • 12 Shares @ $192.12',    amount: -2305.44 },
  { icon: '💳', cls: 'div',  name: 'Dividend Received',   detail: 'Yesterday, 4:00 PM • KO Quarterly',        amount:   84.12 },
  { icon: '🔁', cls: 'swap', name: 'ETH Swapped to USDC', detail: 'Oct 24, 11:20 AM • 1.2 ETH @ $2,410.00',  amount: 2892.00 },
];

export default function Dashboard({ appState, onNavigate }: DashboardProps) {
  const sparkRef = useRef<HTMLCanvasElement>(null);
  const sparkChartRef = useRef<Chart | null>(null);
  const { currentTicker, lastQuote, lastPredict } = appState;

  // Build / update sparkline
  useEffect(() => {
    if (!sparkRef.current) return;
    const seed = Array.from({ length: 20 }, (_, i) => 140000 + Math.random() * 4000 + i * 200);
    if (sparkChartRef.current) sparkChartRef.current.destroy();
    sparkChartRef.current = new Chart(sparkRef.current.getContext('2d')!, {
      type: 'line',
      data: {
        labels: seed.map((_, i) => i),
        datasets: [{
          data: seed,
          borderColor: '#00e475',
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 88);
            g.addColorStop(0, 'rgba(0,228,117,.25)');
            g.addColorStop(1, 'rgba(0,228,117,0)');
            return g;
          },
          borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
    return () => { sparkChartRef.current?.destroy(); };
  }, []);

  // Push live price into sparkline
  useEffect(() => {
    if (!sparkChartRef.current || !lastQuote) return;
    const chart = sparkChartRef.current;
    chart.data.labels!.push(chart.data.labels!.length);
    (chart.data.datasets[0].data as number[]).push(lastQuote.price);
    if ((chart.data.labels as number[]).length > 40) {
      chart.data.labels!.shift();
      (chart.data.datasets[0].data as number[]).shift();
    }
    chart.update('none');
  }, [lastQuote]);

  const priceStr = lastQuote ? `$${lastQuote.price.toFixed(2)}` : '$—';
  const predStr  = lastPredict ? `$${lastPredict.predicted}` : '$—';
  const signal   = lastPredict?.signal ?? 'HOLD';

  return (
    <Shell
      currentView="dashboard"
      onNavigate={onNavigate}
      title="Dashboard"
      ticker={currentTicker}
      predict={lastPredict}
    >
      {/* Top bento row */}
      <div className="bento-grid" style={{ marginBottom: 24 }}>
        {/* Portfolio card */}
        <div className="portfolio-card">
          <div>
            <div className="pcard-top-row">
              <span className="pcard-label">Total Account Value</span>
              <div className="verified-badge"><div className="verified-dot" />Verified</div>
            </div>
            <div className="pcard-value">{priceStr}</div>
            <div className="pcard-pnl">
              {lastQuote ? (
                <span className="pnl-positive" style={{ color: lastQuote.change >= 0 ? 'var(--primary)' : 'var(--error)' }}>
                  {lastQuote.change >= 0 ? '↑' : '↓'} {Math.abs(lastQuote.change)} ({Math.abs(lastQuote.change_pct)}%)
                </span>
              ) : <span className="pnl-positive">— —</span>}
              <span className="pnl-label">Today's P&amp;L</span>
            </div>
          </div>
          <div className="sparkline-wrap">
            <canvas ref={sparkRef} />
            <div className="sparkline-labels"><span>09:30 AM</span><span>Market Close</span></div>
          </div>
        </div>

        {/* Stat mini cards */}
        <div className="stat-mini-col">
          <div className="stat-mini">
            <div className="mini-icon sec">🛡</div>
            <div><div className="mini-label">Security Status</div><div className="mini-val">L3 Institutional</div></div>
          </div>
          <div className="stat-mini">
            <div className="mini-icon margin">⚡</div>
            <div><div className="mini-label">Active Margin</div><div className="mini-val">2.4x Utilized</div></div>
          </div>
          <div className="stat-mini buying-power" onClick={() => onNavigate('terminal')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="mini-icon buy">🏛</div>
              <div>
                <div className="mini-label primary">Predicted Next Close</div>
                <div className="mini-val primary">{predStr}</div>
              </div>
            </div>
            <span style={{ color: 'var(--primary)', fontSize: 18 }}>›</span>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rec-section">
        <div className="rec-header">
          <div className="rec-title-group">
            <div className="rec-accent-bar" />
            <span className="rec-title">AI Recommendations</span>
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Risk Profile: <span className="risk-badge">Moderately Aggressive</span>
          </span>
        </div>
        <div className="rec-grid">
          {/* Live rec card */}
          <div className="rec-card">
            <div className="rec-card-top">
              <div className="rec-sym-group">
                <div className="rec-sym-icon">{currentTicker}</div>
                <div>
                  <div className="rec-sym-name">{currentTicker}</div>
                  <div className="rec-sym-sector">S&amp;P 500 Dataset</div>
                </div>
              </div>
              <span className={`sig-pill ${signal === 'BUY' ? 'buy' : signal === 'SELL' ? 'sell' : 'hold'}`}>
                {lastPredict ? signal : '—'}
              </span>
            </div>
            <p className="rec-desc">
              {lastPredict
                ? signal === 'BUY'
                  ? `Model predicts next close at ${predStr} — up ${lastPredict.diff} (${lastPredict.diff_pct}%). Positive momentum.`
                  : signal === 'SELL'
                  ? `Model predicts next close at ${predStr} — down ${lastPredict.diff} (${lastPredict.diff_pct}%). Negative trend.`
                  : `Predicted change ${lastPredict.diff_pct}% within ±0.3% band. No strong directional signal.`
                : 'Connect + Train in the Terminal to see live AI recommendation for your selected ticker.'}
            </p>
            <button className="rec-btn" onClick={() => onNavigate('terminal')}>
              {lastPredict ? 'View in Terminal →' : 'Open Terminal →'}
            </button>
          </div>

          {/* Static NVDA card */}
          <div className="rec-card">
            <div className="rec-card-top">
              <div className="rec-sym-group">
                <div className="rec-sym-icon">NVDA</div>
                <div><div className="rec-sym-name">NVIDIA Corp</div><div className="rec-sym-sector">Tech • Semiconductor</div></div>
              </div>
              <span className="sig-pill buy">Strong Buy</span>
            </div>
            <p className="rec-desc">AI models detect high probability breakout following supply chain optimisation signals. 12% upside projected.</p>
            <button className="rec-btn">View Full Analysis</button>
          </div>

          {/* Static BTC card */}
          <div className="rec-card">
            <div className="rec-card-top">
              <div className="rec-sym-group">
                <div className="rec-sym-icon">BTC</div>
                <div><div className="rec-sym-name">Bitcoin</div><div className="rec-sym-sector">Crypto • Digital Gold</div></div>
              </div>
              <span className="sig-pill hold">Hold</span>
            </div>
            <p className="rec-desc">Consolidation phase initiated. On-chain metrics suggest whales are accumulating. Maintain current position.</p>
            <button className="rec-btn">View Full Analysis</button>
          </div>
        </div>
      </div>

      {/* Bottom: Activity + Alpha */}
      <div className="bottom-grid">
        <div className="activity-card">
          <div className="activity-header">
            <span className="activity-title">Recent Activity</span>
            <button className="ledger-btn">View Ledger</button>
          </div>
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-left">
                <div className={`activity-icon ${a.cls}`}>{a.icon}</div>
                <div>
                  <div className="activity-name">{a.name}</div>
                  <div className="activity-detail">{a.detail}</div>
                </div>
              </div>
              <div className={`activity-amount ${a.amount > 0 ? 'pos' : ''}`}>
                {a.amount > 0 ? '+' : ''}${Math.abs(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>

        <div className="alpha-card">
          <div className="alpha-ring-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="64" fill="transparent" stroke="#222a3d" strokeWidth="12" />
              <circle cx="80" cy="80" r="64" fill="transparent" stroke="#00e475"
                strokeDasharray="402" strokeDashoffset="96"
                strokeLinecap="round" strokeWidth="12" />
            </svg>
            <div className="alpha-ring-inner">
              <span className="alpha-pct">84%</span>
              <span className="alpha-pct-label">Efficiency</span>
            </div>
          </div>
          <div className="alpha-title">Alpha Performance</div>
          <p className="alpha-desc">
            You are outperforming the S&amp;P 500 by{' '}
            <strong style={{ color: 'var(--primary)' }}>4.2%</strong>{' '}
            this quarter using AI execution models.
          </p>
        </div>
      </div>
    </Shell>
  );
}
