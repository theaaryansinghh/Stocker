import React, { useState } from 'react';
import { View } from '../types';
import Shell from '../components/Shell';

interface SettingsProps {
  onNavigate: (v: View) => void;
}

type Section = 'profile' | 'security' | 'api' | 'subscription';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'profile',      label: 'Profile',      icon: '👤' },
  { id: 'security',     label: 'Security',     icon: '🛡' },
  { id: 'api',          label: 'API Access',   icon: '⚙️' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
];

export default function Settings({ onNavigate }: SettingsProps) {
  const [active, setActive] = useState<Section>('profile');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Shell currentView="settings" onNavigate={onNavigate} title="Account Settings">
      <div className="settings-page">
        {/* Page header */}
        <header className="settings-header">
          <h1 className="settings-h1">Account Settings</h1>
          <p className="settings-sub">Manage your institutional identity, security protocols, and algorithmic connectivity.</p>
        </header>

        <div className="settings-layout">
          {/* Left nav */}
          <nav className="settings-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`settings-nav-btn ${active === item.id ? 'active' : ''}`}
                onClick={() => setActive(item.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{item.icon}</span>{item.label}
                </span>
                {active === item.id && <span>›</span>}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="settings-content">

            {active === 'profile' && (
              <section className="settings-card settings-card-blue">
                <h2 className="settings-card-title">
                  <span>👤</span> Profile Information
                </h2>
                <div className="settings-profile-row">
                  {/* Avatar */}
                  <div className="settings-avatar-wrap">
                    <div className="settings-avatar">
                      <img src="https://i.pravatar.cc/128?img=11" alt="Profile" referrerPolicy="no-referrer" />
                      <div className="settings-avatar-overlay">📷</div>
                    </div>
                    <div className="settings-avatar-edit">✏</div>
                  </div>
                  {/* Fields */}
                  <div className="settings-fields-grid">
                    <SettingsField label="Legal Name"          type="text"   defaultValue="Alexander Sterling" />
                    <SettingsField label="Email Address"       type="email"  defaultValue="sterling.a@sovereign-node.ai" />
                    <SettingsField label="Timezone"            type="select"
                      options={['UTC-05:00 Eastern Time (NY)', 'UTC+00:00 London (LSE)', 'UTC+09:00 Tokyo (TSE)']} />
                    <SettingsField label="Interface Language"  type="select"
                      options={['English (Sovereign)', 'Mandarin (Simplified)', 'Japanese']} />
                  </div>
                </div>
                <div className="settings-save-row">
                  <button className="settings-save-btn" onClick={handleSave}>
                    {saved ? '✓ Saved' : 'Save Profile Changes'}
                  </button>
                </div>
              </section>
            )}

            {active === 'security' && (
              <section className="settings-card settings-card-green">
                <h2 className="settings-card-title"><span>🛡</span> Security &amp; Authentication</h2>
                <div className="settings-security-list">
                  <div className="settings-security-row">
                    <div className="settings-security-left">
                      <div className="settings-sec-icon green">📱</div>
                      <div>
                        <div className="settings-sec-name">Two-Factor Authentication</div>
                        <div className="settings-sec-desc">Protect your account with an extra layer of biometric security.</div>
                      </div>
                    </div>
                    <div className="settings-toggle on">
                      <div className="settings-toggle-thumb" />
                    </div>
                  </div>
                  <div className="settings-security-row">
                    <div className="settings-security-left">
                      <div className="settings-sec-icon muted">🔑</div>
                      <div>
                        <div className="settings-sec-name">Master Password</div>
                        <div className="settings-sec-desc">Last changed 42 days ago.</div>
                      </div>
                    </div>
                    <button className="settings-link-btn">Change Key</button>
                  </div>
                  <div className="settings-security-row">
                    <div className="settings-security-left">
                      <div className="settings-sec-icon green">🔐</div>
                      <div>
                        <div className="settings-sec-name">Session Timeout</div>
                        <div className="settings-sec-desc">Auto-lock terminal after 30 minutes of inactivity.</div>
                      </div>
                    </div>
                    <div className="settings-toggle off">
                      <div className="settings-toggle-thumb" />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {active === 'api' && (
              <div className="settings-api-grid">
                <section className="settings-card">
                  <div className="settings-api-header">
                    <h3 className="settings-card-title" style={{ marginBottom: 0 }}>API Gateway</h3>
                    <span className="settings-live-badge">Live</span>
                  </div>
                  <div className="settings-api-key">sk_live_51M2K...Xz92p</div>
                  <p className="settings-api-note">Rotate keys every 90 days for maximum security compliance.</p>
                  <button className="settings-outline-btn">Regenerate Token</button>
                </section>
                <section className="settings-card">
                  <h3 className="settings-card-title">Webhooks</h3>
                  <div className="settings-webhook-status">
                    <span className="ldot on" />
                    <span className="settings-webhook-label">3 active endpoints</span>
                  </div>
                  <p className="settings-api-note">Stream real-time AI signals directly to your custom execution engine or Discord server.</p>
                  <button className="settings-solid-btn">Configure Endpoints</button>
                </section>
              </div>
            )}

            {active === 'subscription' && (
              <section className="settings-sub-card">
                <div className="settings-sub-header">
                  <div>
                    <h2 className="settings-sub-title">Stocker Institutional Elite</h2>
                    <div className="settings-sub-status">
                      <span className="settings-active-badge">Active Tier</span>
                      <span className="settings-renewal">• Renewal on Oct 24, 2025</span>
                    </div>
                  </div>
                  <div className="settings-sub-price">
                    <div className="settings-price-num">$1,499<span className="settings-price-per">/mo</span></div>
                    <div className="settings-price-label">Billed Annually</div>
                  </div>
                </div>
                <div className="settings-features-grid">
                  {[
                    { icon: '⚡', title: 'Unlimited Compute', desc: 'Zero-latency AI analysis on all asset classes.' },
                    { icon: '🖥',  title: 'Direct DMA',       desc: 'Direct Market Access to 45 global exchanges.' },
                    { icon: '🎧', title: 'Priority Node',     desc: '24/7 dedicated analyst support line.' },
                  ].map(f => (
                    <div key={f.title} className="settings-feature-card">
                      <div className="settings-feature-icon">{f.icon}</div>
                      <div className="settings-feature-title">{f.title}</div>
                      <div className="settings-feature-desc">{f.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="settings-sub-actions">
                  <button className="settings-sub-primary-btn">Manage Subscription</button>
                  <button className="settings-sub-secondary-btn">Compare Tiers</button>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </Shell>
  );
}

function SettingsField({ label, type, defaultValue, options }: {
  label: string; type: string; defaultValue?: string; options?: string[];
}) {
  return (
    <div className="settings-field">
      <label className="settings-field-label">{label}</label>
      {type === 'select' ? (
        <select className="settings-field-input" defaultValue={options?.[0]}>
          {options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input className="settings-field-input" type={type} defaultValue={defaultValue} />
      )}
    </div>
  );
}
