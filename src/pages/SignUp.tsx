import React, { useState } from 'react';
import { View } from '../types';

interface SignUpProps {
  onNavigate: (v: View) => void;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const [step, setStep] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      onNavigate('dashboard');
    }
  }

  return (
    <div className="signup-screen">
      {/* Left panel */}
      <div className="signup-left">
        <div
          className="signup-left-bg"
          style={{
            backgroundImage: 'url(/img.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="signup-left-content">
          <div className="signup-badge">✦ Institutional Intelligence</div>
          <h2 className="signup-left-h">
            Observe the market with <span style={{ color: 'var(--primary)' }}>unrivaled clarity.</span>
          </h2>
          <p className="signup-left-p">
            Our Sovereign Analyst engine synthesizes millions of data points into actionable
            institutional-grade insights, exclusively for your terminal.
          </p>
          <div className="signup-insight-card">
            <div className="signup-insight-top">
              <span className="signup-insight-label">Live Insight</span>
              <span className="signup-insight-time">2m ago</span>
            </div>
            <p className="signup-insight-text">
              "Neural detection suggests a bullish shift in semiconductor liquidity. Execution risk: Low."
            </p>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="signup-right">
        <div className="signup-form-wrap">
          <div className="signup-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`signup-step-bar ${step >= s ? 'active' : ''}`} />
            ))}
          </div>

          <div className="signup-form-header">
            <h1 className="signup-form-h1">
              {step === 1 && 'Begin Your Sovereign Journey'}
              {step === 2 && 'Verify Your Identity'}
              {step === 3 && 'Set Your Preferences'}
            </h1>
            <p className="signup-form-sub">
              {step === 1 && 'Step 1 of 3: Establish your secure credentials.'}
              {step === 2 && 'Step 2 of 3: Confirm your phone number.'}
              {step === 3 && 'Step 3 of 3: Choose your risk profile.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {step === 1 && (
              <div className="signup-fields">
                <SignUpField label="Email Address" placeholder="name@institution.com" type="email" icon="✉" required />
                <SignUpField label="Secure Password" placeholder="••••••••" type="password" icon="🔒" required />
                <SignUpField label="Phone Number" placeholder="+1 (555) 000-0000" type="tel" icon="📱" />
              </div>
            )}
            {step === 2 && (
              <div className="signup-fields">
                <SignUpField label="Verification Code" placeholder="6-digit code" type="text" icon="🔑" required />
                <p className="signup-resend">Didn't receive it? <button type="button" className="signup-resend-btn">Resend code</button></p>
              </div>
            )}
            {step === 3 && (
              <div className="signup-fields">
                <div className="signup-risk-group">
                  {[
                    { id: 'conservative', label: 'Conservative', desc: 'Capital preservation, low volatility' },
                    { id: 'moderate', label: 'Moderately Aggressive', desc: 'Balanced growth and risk' },
                    { id: 'aggressive', label: 'Aggressive', desc: 'High upside, accepts high volatility' },
                  ].map(opt => (
                    <label key={opt.id} className="signup-risk-option">
                      <input type="radio" name="risk" value={opt.id} defaultChecked={opt.id === 'moderate'} />
                      <div className="signup-risk-body">
                        <span className="signup-risk-label">{opt.label}</span>
                        <span className="signup-risk-desc">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="signup-actions">
              <button type="submit" className="signup-submit-btn">
                {step < 3 ? 'Continue →' : 'Launch Terminal →'}
              </button>
              {step === 1 && (
                <p className="signup-signin-prompt">
                  Already a member?{' '}
                  <button type="button" className="signup-signin-link" onClick={() => onNavigate('dashboard')}>
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>

          <div className="signup-trust">
            <div className="signup-trust-divider">
              <div className="signup-trust-line" />
              <span className="signup-trust-label">Security Partners</span>
              <div className="signup-trust-line" />
            </div>
            <div className="signup-trust-marks">
              {['FINRA COMPLIANT', 'SIPC PROTECTED', 'AES-256 ENCRYPTION'].map(m => (
                <span key={m} className="signup-trust-mark">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignUpField({ label, placeholder, type, icon, required }: {
  label: string; placeholder: string; type: string; icon: string; required?: boolean;
}) {
  return (
    <div className="signup-field">
      <label className="signup-field-label">{label}</label>
      <div className="signup-field-input-wrap">
        <span className="signup-field-icon">{icon}</span>
        <input className="signup-field-input" type={type} placeholder={placeholder} required={required} />
      </div>
    </div>
  );
}