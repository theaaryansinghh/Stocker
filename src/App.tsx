import React, { useState } from 'react';
import { View, AppState } from './types';
import Landing   from './pages/Landing';
import SignUp    from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Terminal  from './pages/Terminal';
import Settings  from './pages/Settings';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';

const INITIAL_STATE: AppState = {
  currentTicker: 'AAPL',
  modelMeta: null,
  lastQuote: null,
  lastPredict: null,
};

export default function App() {
  const [view, setView]         = useState<View>('landing');
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);

  function updateState(updates: Partial<AppState>) {
    setAppState(prev => ({ ...prev, ...updates }));
  }

  return (
    <>
      {view === 'landing'   && <Landing   onNavigate={setView} />}
      {view === 'signup'    && <SignUp    onNavigate={setView} />}
      {view === 'dashboard' && <Dashboard appState={appState} onNavigate={setView} />}
      {view === 'terminal'  && <Terminal  appState={appState} onNavigate={setView} onStateUpdate={updateState} />}
      {view === 'settings'  && <Settings  onNavigate={setView} />}
      {view === 'portfolio' && <Portfolio appState={appState} onNavigate={setView} />}
      {view === 'analytics' && <Analytics appState={appState} onNavigate={setView} />}
    </>
  );
}