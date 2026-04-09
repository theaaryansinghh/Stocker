import React from 'react';
import Sidebar from './Sidebar';
import { View, PredictData, QuoteData } from '../types';
import { Bell, Settings } from 'lucide-react';

interface ShellProps {
  currentView: View;
  onNavigate: (v: View) => void;
  title: string;
  ticker?: string;
  quote?: QuoteData | null;
  predict?: PredictData | null;
  children: React.ReactNode;
}

export default function Shell({
  currentView, onNavigate, title, ticker = 'AAPL', quote, predict, children
}: ShellProps) {
  return (
    <div className="shell">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="topbar-left">
            <span className="topbar-title">{title}</span>
            {ticker && <span className="topbar-pill">{ticker}</span>}
            {predict && (
              <span className={`live-rec-badge ${predict.signal}`}>
                {predict.signal}
              </span>
            )}
            {quote && currentView === 'terminal' && (
              <div className="tb-stats">
                <div className="tb-stat"><span>High</span><span>${quote.high.toFixed(2)}</span></div>
                <div className="tb-stat"><span>Low</span><span>${quote.low.toFixed(2)}</span></div>
                <div className="tb-stat"><span>Open</span><span>${quote.open.toFixed(2)}</span></div>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="mode-toggle">
              <button className="mode-btn active">Live</button>
              <button className="mode-btn">Simulation</button>
            </div>
            <button className="tb-icon" title="Notifications">
              <Bell size={17} />
            </button>
            <button className="tb-icon" title="Settings" onClick={() => onNavigate('settings')}>
              <Settings size={17} />
            </button>
            <button className="back-btn" onClick={() => onNavigate('landing')}>← Home</button>
          </div>
        </header>

        <div className="shell-body">{children}</div>

        <footer className="shell-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>© 2024 Stocker AI. Technical Elegance Defined.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="ldot on" />System Latency: 12ms
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Terms</span><span>Privacy</span><span>Disclosures</span>
          </div>
        </footer>
      </div>
    </div>
  );
}