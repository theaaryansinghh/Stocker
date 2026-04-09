import React from 'react';
import {
  Home, LayoutDashboard, Terminal, Briefcase,
  BarChart2, HelpCircle, User, Bot
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (v: View) => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'landing',   label: 'Home',      icon: <Home            size={18} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'terminal',  label: 'Terminal',  icon: <Terminal        size={18} /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Briefcase       size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2       size={18} /> },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        <div className="logo-text">Stocker</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={item.id === currentView ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            <span className="ni">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-agent">
          <div className="agent-av" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={16} color="var(--primary)" />
          </div>
          <div>
            <div className="agent-name">The Sovereign Analyst</div>
            <div className="agent-sub">Institutional Grade AI</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button>
            <span className="ni"><HelpCircle size={18} /></span>Support
          </button>
          <button
            className={currentView === 'settings' ? 'active' : ''}
            onClick={() => onNavigate('settings')}
          >
            <span className="ni"><User size={18} /></span>Account
          </button>
        </nav>
      </div>
    </aside>
  );
}