import React, { useState } from 'react';
import { View, AppState, Holding } from '../types';
import Shell from '../components/Shell';

interface Props {
  appState: AppState;
  onNavigate: (v: View) => void;
}

const HOLDINGS: Holding[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 840,   avgPrice: 42.80,  marketValue: 784320.00, gainLoss: 748334.40, gainLossPercent: 2079.7, signal: 'Accumulate' },
  { symbol: 'AAPL', name: 'Apple Inc.',         shares: 1200,  avgPrice: 145.20, marketValue: 224400.00, gainLoss:  49560.00, gainLossPercent:   28.4, signal: 'Hold'       },
  { symbol: 'TSLA', name: 'Tesla Inc.',          shares: 215,   avgPrice: 198.45, marketValue:  48224.25, gainLoss:  -5429.50, gainLossPercent:   -10.1, signal: 'Sell'       },
  { symbol: 'MSFT', name: 'Microsoft Corp.',     shares: 310,   avgPrice: 310.00, marketValue: 117331.00, gainLoss:  20631.00, gainLossPercent:    21.4, signal: 'Accumulate' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.',     shares: 95,    avgPrice: 142.00, marketValue:  17731.90, gainLoss:   2231.90, gainLossPercent:    14.4, signal: 'Hold'       },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',      shares: 180,   avgPrice: 125.00, marketValue:  25394.40, gainLoss:   2894.40, gainLossPercent:    12.9, signal: 'Hold'       },
];

const ALLOCATION = [
  { name: 'Technology', value: 58.2, color: '#00e475' },
  { name: 'Energy',     value: 22.4, color: '#8dcdff' },
  { name: 'Financials', value: 11.8, color: '#ffb800' },
  { name: 'Other',      value:  7.6, color: '#44474d' },
];

const TOTAL_VALUE   = HOLDINGS.reduce((a, h) => a + h.marketValue, 0);
const TOTAL_GAIN    = HOLDINGS.reduce((a, h) => a + h.gainLoss, 0);
const TOTAL_COST    = TOTAL_VALUE - TOTAL_GAIN;
const TOTAL_GAIN_PCT = ((TOTAL_GAIN / TOTAL_COST) * 100).toFixed(2);

type SortKey = 'symbol' | 'marketValue' | 'gainLossPercent';

export default function Portfolio({ appState, onNavigate }: Props) {
  const [sort, setSort] = useState<SortKey>('marketValue');
  const [filter, setFilter] = useState<'all' | 'gains' | 'losses'>('all');

  const sorted = [...HOLDINGS]
    .filter(h => filter === 'all' ? true : filter === 'gains' ? h.gainLoss >= 0 : h.gainLoss < 0)
    .sort((a, b) => {
      if (sort === 'symbol') return a.symbol.localeCompare(b.symbol);
      if (sort === 'gainLossPercent') return b.gainLossPercent - a.gainLossPercent;
      return b.marketValue - a.marketValue;
    });

  return (
    <Shell currentView="portfolio" onNavigate={onNavigate} title="Portfolio" ticker={appState.currentTicker} predict={appState.lastPredict}>

      {/* Summary cards */}
      <div className="port-summary-row">
        <div className="port-summary-card main">
          <div className="port-s-label">Total Portfolio Value</div>
          <div className="port-s-value">${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="port-s-sub up">↑ +${TOTAL_GAIN.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({TOTAL_GAIN_PCT}%) all time</div>
        </div>
        <div className="port-summary-card">
          <div className="port-s-label">Invested Capital</div>
          <div className="port-s-value" style={{ fontSize: 28 }}>${TOTAL_COST.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="port-s-sub">cost basis</div>
        </div>
        <div className="port-summary-card">
          <div className="port-s-label">Positions</div>
          <div className="port-s-value" style={{ fontSize: 28 }}>{HOLDINGS.length}</div>
          <div className="port-s-sub">{HOLDINGS.filter(h => h.gainLoss >= 0).length} gaining · {HOLDINGS.filter(h => h.gainLoss < 0).length} losing</div>
        </div>
        <div className="port-summary-card">
          <div className="port-s-label">Best Performer</div>
          <div className="port-s-value" style={{ fontSize: 28, color: 'var(--primary)' }}>
            {HOLDINGS.reduce((a, b) => a.gainLossPercent > b.gainLossPercent ? a : b).symbol}
          </div>
          <div className="port-s-sub up">
            +{HOLDINGS.reduce((a, b) => a.gainLossPercent > b.gainLossPercent ? a : b).gainLossPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="port-main-grid">

        {/* Holdings table */}
        <div className="port-table-card">
          <div className="port-table-header">
            <span className="port-section-title">Holdings</span>
            <div className="port-controls">
              <div className="port-filter-group">
                {(['all','gains','losses'] as const).map(f => (
                  <button key={f} className={`port-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <select className="port-sort-select" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                <option value="marketValue">Sort: Value</option>
                <option value="gainLossPercent">Sort: Gain %</option>
                <option value="symbol">Sort: Ticker</option>
              </select>
            </div>
          </div>

          <table className="port-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Shares</th>
                <th>Avg Price</th>
                <th>Market Value</th>
                <th>Gain / Loss</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(h => (
                <tr key={h.symbol}>
                  <td>
                    <div className="port-sym-cell">
                      <div className="port-sym-badge">{h.symbol}</div>
                      <div>
                        <div className="port-sym-name">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="port-td-num">{h.shares.toLocaleString()}</td>
                  <td className="port-td-num">${h.avgPrice.toFixed(2)}</td>
                  <td className="port-td-num">${h.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className={`port-td-num ${h.gainLoss >= 0 ? 'up' : 'down'}`}>
                    {h.gainLoss >= 0 ? '+' : ''}${h.gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="port-td-pct"> ({h.gainLoss >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%)</span>
                  </td>
                  <td>
                    <span className={`port-signal-pill ${h.signal === 'Accumulate' ? 'buy' : h.signal === 'Sell' ? 'sell' : 'hold'}`}>
                      {h.signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="port-right-col">

          {/* Allocation donut */}
          <div className="port-alloc-card">
            <div className="port-section-title" style={{ marginBottom: 20 }}>Allocation</div>
            <div className="port-alloc-donut-wrap">
              <svg viewBox="0 0 120 120" width="140" height="140">
                {(() => {
                  let offset = 0;
                  const circ = 2 * Math.PI * 45;
                  return ALLOCATION.map((a, i) => {
                    const dash = (a.value / 100) * circ;
                    const gap  = circ - dash;
                    const rotate = (offset / 100) * 360 - 90;
                    offset += a.value;
                    return (
                      <circle key={i} cx="60" cy="60" r="45" fill="transparent"
                        stroke={a.color} strokeWidth="18"
                        strokeDasharray={`${dash} ${gap}`}
                        style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '60px 60px' }}
                      />
                    );
                  });
                })()}
                <text x="60" y="55" textAnchor="middle" fill="#dae2fd" fontSize="14" fontWeight="800" fontFamily="Manrope,sans-serif">
                  {HOLDINGS.length}
                </text>
                <text x="60" y="70" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="Inter,sans-serif">
                  POSITIONS
                </text>
              </svg>
              <div className="port-alloc-legend">
                {ALLOCATION.map(a => (
                  <div key={a.name} className="port-legend-row">
                    <span className="port-legend-dot" style={{ background: a.color }} />
                    <span className="port-legend-name">{a.name}</span>
                    <span className="port-legend-val">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="port-stats-card">
            <div className="port-section-title" style={{ marginBottom: 16 }}>Quick Stats</div>
            {[
              { label: 'Day Gain',         value: '+$1,284.40',  up: true  },
              { label: 'Unrealized P&L',   value: `+$${TOTAL_GAIN.toLocaleString('en-US',{minimumFractionDigits:2})}`, up: true  },
              { label: 'Dividend Income',  value: '$842.16',      up: true  },
              { label: 'Largest Position', value: 'NVDA (64.8%)', up: null  },
              { label: 'Portfolio Beta',   value: '1.24',         up: null  },
            ].map(s => (
              <div key={s.label} className="port-quick-row">
                <span className="port-quick-label">{s.label}</span>
                <span className={`port-quick-val ${s.up === true ? 'up' : s.up === false ? 'down' : ''}`}>{s.value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Shell>
  );
}