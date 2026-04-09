import React, { useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import { View } from '../types';

const TAPE_DATA = [
  ['AAPL','182.52','+1.2%',true],['GOOGL','141.08','-0.4%',false],
  ['MSFT','378.91','+0.8%',true],['TSLA','177.30','-1.1%',false],
  ['AMZN','186.62','+2.1%',true],['NFLX','628.41','+0.3%',true],
  ['NVDA','824.10','+3.4%',true],['META','487.33','-0.2%',false],
] as [string, string, string, boolean][];

interface LandingProps {
  onNavigate: (v: View) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  useEffect(() => {
    const el = document.getElementById('tape');
    if (!el) return;
    const items = [...TAPE_DATA, ...TAPE_DATA].map(([s, p, c, u]) =>
      `<span class="tape-item"><b>${s}</b>$${p} <span class="${u ? 'up' : 'dn'}">${c}</span></span>`
    ).join('');
    el.innerHTML = items;
  }, []);

  return (
    <div id="landing-inner">
      {/* Nav */}
      <nav className="land-nav">
        <div className="logo">Stocker</div>
        <div className="nav-links">
          <button className="active">Market</button>
          <button onClick={() => onNavigate('terminal')}>Trade</button>
          <button>Simulation</button>
          <button onClick={() => onNavigate('dashboard')}>Insights</button>
        </div>
        <div className="nav-right">
          <button className="nav-icon-btn" title="Notifications"><Bell size={18} /></button>
          <button className="nav-icon-btn" onClick={() => onNavigate('settings')} title="Settings"><Settings size={18} /></button>
          <button className="btn-get-started" onClick={() => onNavigate('signup')}>Get Started</button>
        </div>
      </nav>

      <div style={{ paddingTop: 72, height: '100vh', overflowY: 'auto' }}>
        {/* Hero */}
        <section className="land-hero">
          <div className="hero-glow-1" /><div className="hero-glow-2" />
          <div className="hero-badge"><span className="ping-dot" />The Sovereign Analyst Is Online</div>
          <h1 className="hero-h1">The Future of Trading<br />is <em>AI-Powered</em></h1>
          <p className="hero-p">
            Stocker leverages institutional-grade algorithms to analyze millions of data points
            in real-time, providing you with the edge required for modern markets.
          </p>
          <div className="hero-cta">
            <button className="btn-hero-p" onClick={() => onNavigate('signup')}>Get Started</button>
            <button className="btn-hero-s" onClick={() => onNavigate('terminal')}>View Demo</button>
          </div>
          <div className="hero-trust">
            <div className="avatar-stack">
              <img src="https://i.pravatar.cc/100?img=1" alt="" />
              <img src="https://i.pravatar.cc/100?img=2" alt="" />
              <img src="https://i.pravatar.cc/100?img=3" alt="" />
              <div className="avatar-more">+100k</div>
            </div>
            <p className="trust-text">Trusted by 100k+ Sovereign Traders</p>
          </div>
        </section>

        {/* Bento */}
        <section className="bento-section">
          <div className="bento-head"><h2>The Technical Edge</h2><div className="accent-bar" /></div>
          <div className="bento-grid">
            <div className="bento-card bento-lg">
              <div className="bento-icon g">📈</div>
              <h3 className="bento-h3">AI Market Analysis</h3>
              <p className="bento-p">Our linear regression models process historical S&amp;P 500 data to predict movements before they happen. Institutional intelligence, built right into your browser.</p>
              <button className="bento-link" onClick={() => onNavigate('terminal')}>Open Terminal →</button>
            </div>
            <div className="bento-card bento-sm">
              <div className="bento-icon b">⚡</div>
              <h3 className="bento-h3" style={{ fontSize: 18 }}>Simulation Engine</h3>
              <p className="bento-p" style={{ fontSize: 13 }}>Backtest strategies against 5 years of S&amp;P 500 data. No risk, pure insight.</p>
              <div className="mini-bars">
                {[30, 60, 50, 75, 100].map((h, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bento-card bento-wide">
              <div className="bento-icon r">🛡</div>
              <h3 className="bento-h3" style={{ fontSize: 18 }}>Risk Management</h3>
              <p className="bento-p" style={{ fontSize: 13 }}>Live Buy / Sell / Hold signals with configurable thresholds that protect your capital during volatile sessions.</p>
            </div>
            <div className="insight-card-land">
              <div className="insight-body">
                <div className="insight-tag">✦ Stocker Insight</div>
                <h3 className="insight-h3">"Diversification into tech-aligned sectors recommended for next quarter."</h3>
                <p className="insight-p">Our ML model identifies a 14% higher-than-average probability of bullish momentum in semiconductor indices based on historical patterns.</p>
              </div>
              <div className="insight-img">
                <img src="https://picsum.photos/seed/chip/300/300" alt="" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div><div className="stat-num">$2.4B</div><div className="stat-label">Trading Volume</div></div>
            <div><div className="stat-num a">99.9%</div><div className="stat-label">Uptime Record</div></div>
            <div><div className="stat-num">15ms</div><div className="stat-label">Execution Latency</div></div>
            <div><div className="stat-num">AI-2</div><div className="stat-label">Proprietary Core</div></div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-box">
            <h2 className="cta-h2">Ready to out-trade the market?</h2>
            <p className="cta-p">Join thousands of traders using Stocker to navigate the global economy with AI precision.</p>
            <button className="btn-cta" onClick={() => onNavigate('signup')}>Create Your Terminal</button>
          </div>
        </section>

        <div className="ticker-tape"><div className="tape-track" id="tape" /></div>

        <footer className="land-footer">
          <div>
            <div className="footer-logo">Stocker</div>
            <div className="footer-copy">© 2024 Stocker AI. Technical Elegance Defined.</div>
          </div>
          <div className="footer-links">
            {['Terms','Privacy','Disclosures','Contact'].map(l => <button key={l}>{l}</button>)}
          </div>
        </footer>
      </div>
    </div>
  );
}