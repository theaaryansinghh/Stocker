import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, AppState, TrainMeta, QuoteData, PredictData } from '../types';
import Shell from '../components/Shell';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from 'chartjs-chart-financial';

Chart.register(...registerables, CandlestickController, CandlestickElement, OhlcController, OhlcElement);

interface TerminalProps {
  appState: AppState;
  onNavigate: (v: View) => void;
  onStateUpdate: (updates: Partial<AppState>) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NFLX'];
const MAX_LIVE = 80;
const QUOTE_POLL_MS = 30_000;

const CHART_OPTS: any = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      type: 'time',
      time: { unit: 'month' },
      ticks: { maxTicksLimit: 6, font: { size: 9 }, color: '#475569' },
      grid: { color: 'rgba(255,255,255,0.03)' },
    },
    y: {
      ticks: {
        callback: (v: number | string) => '$' + Number(v).toFixed(0),
        font: { size: 9 },
        color: '#475569',
      },
      grid: { color: 'rgba(255,255,255,0.03)' },
    },
  },
};

const LIVE_CHART_OPTS: any = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { maxTicksLimit: 6, font: { size: 9 }, color: '#475569' },
      grid: { color: 'rgba(255,255,255,0.03)' },
    },
    y: {
      ticks: {
        callback: (v: number | string) => '$' + Number(v).toFixed(0),
        font: { size: 9 },
        color: '#475569',
      },
      grid: { color: 'rgba(255,255,255,0.03)' },
    },
  },
};

// ── Sovereign Analyst Sidebar ─────────────────────────────
function SovereignSidebar({ open, onClose, appState }: {
  open: boolean;
  onClose: () => void;
  appState: AppState;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `I'm the Sovereign Analyst — your institutional-grade AI. I have context on your current terminal session. Ask me about ${appState.currentTicker}, market signals, or anything you see on screen.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    const contextNote = `You are the Sovereign Analyst, an institutional-grade AI embedded in the Stocker trading terminal. Current context: ticker=${appState.currentTicker}, price=${appState.lastQuote?.price ?? 'N/A'}, signal=${appState.lastPredict?.signal ?? 'N/A'}, R²=${appState.modelMeta?.r2 ?? 'N/A'}. Be concise, insightful, and market-focused.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: contextNote,
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.map((b: any) => b.text || '').join('') || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 199, backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 380,
        background: 'linear-gradient(180deg, #0a0f1a 0%, #060d14 100%)',
        borderLeft: '1px solid rgba(0,228,117,0.15)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(0,228,117,0.1)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e475, #0077ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
              The Sovereign Analyst
            </div>
            <div style={{ color: '#00e475', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Institutional Grade AI · Active
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1,
              transition: 'color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseOut={e => (e.currentTarget.style.color = '#475569')}
          >✕</button>
        </div>

        {/* Context pill */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{
            background: 'rgba(0,119,255,0.08)', border: '1px solid rgba(0,119,255,0.2)',
            borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 16, flexWrap: 'wrap',
          }}>
            {[
              { l: 'TICKER', v: appState.currentTicker },
              { l: 'PRICE', v: appState.lastQuote ? `$${appState.lastQuote.price.toFixed(2)}` : '—' },
              { l: 'SIGNAL', v: appState.lastPredict?.signal ?? '—' },
            ].map(({ l, v }) => (
              <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em' }}>{l}</span>
                <span style={{ color: '#00e475', fontSize: 11, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'assistant' && (
                <span style={{ color: '#00e475', fontSize: 9, letterSpacing: '0.1em', marginBottom: 4 }}>
                  SOVEREIGN ANALYST
                </span>
              )}
              <div style={{
                maxWidth: '88%',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(0,119,255,0.25), rgba(0,119,255,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,119,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '10px 14px',
                color: msg.role === 'user' ? '#e2e8f0' : '#94a3b8',
                fontSize: 12, lineHeight: 1.6,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#00e475', fontSize: 9, letterSpacing: '0.1em' }}>SOVEREIGN ANALYST</span>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px 12px 12px 2px', padding: '10px 14px',
              }}>
                <span style={{ color: '#475569', fontSize: 12 }}>Analyzing</span>
                <span style={{ color: '#00e475' }}> ···</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,228,117,0.1)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask the Analyst anything..."
              rows={2}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                color: '#e2e8f0', fontSize: 12, padding: '8px 12px',
                resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,228,117,0.3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button
              onClick={() => { void sendMessage(); }}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'rgba(0,228,117,0.2)' : '#00e475',
                border: 'none', borderRadius: 8, width: 40, height: 40,
                color: loading || !input.trim() ? '#00e475' : '#0a0f1a',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 16, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s',
              }}
            >↑</button>
          </div>
          <p style={{ color: '#2a4a3a', fontSize: 9, margin: '6px 0 0', letterSpacing: '0.05em' }}>
            SHIFT+ENTER FOR NEW LINE · ENTER TO SEND
          </p>
        </div>
      </div>
    </>
  );
}

// ── Main Terminal ─────────────────────────────────────────
export default function Terminal({ appState, onNavigate, onStateUpdate }: TerminalProps) {
  const { currentTicker, modelMeta, lastQuote } = appState;
  const [customTicker, setCustomTicker] = useState('');
  const [status, setStatus]             = useState<'offline' | 'training' | 'live' | 'error' | 'closed'>('offline');
  const [logs, setLogs]                 = useState<string[]>(['// TERMINAL READY · AUTO-CONNECTING...']);
  const [analystOpen, setAnalystOpen]   = useState(false);
  const hasAutoRun = useRef(false);

  const histRef   = useRef<HTMLCanvasElement>(null);
  const liveRef   = useRef<HTMLCanvasElement>(null);
  const regRef    = useRef<HTMLCanvasElement>(null);
  const histChart = useRef<Chart | null>(null);
  const liveChart = useRef<Chart | null>(null);
  const regChart  = useRef<Chart | null>(null);
  const wsRef     = useRef<WebSocket | null>(null);
  const liveData  = useRef<{ labels: string[]; prices: number[] }>({ labels: [], prices: [] });
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const modelRef  = useRef<TrainMeta | null>(null);
  const tickerRef = useRef<string>(currentTicker);

  useEffect(() => { modelRef.current = modelMeta; }, [modelMeta]);
  useEffect(() => { tickerRef.current = currentTicker; }, [currentTicker]);

  function addLog(msg: string) {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [`[${t}] ${msg}`, ...prev.slice(0, 60)]);
  }

  // ── Init charts ───────────────────────────────────────
  useEffect(() => {
    // Candlestick historical chart
    if (!histChart.current && histRef.current) {
      histChart.current = new Chart(histRef.current.getContext('2d')!, {
        type: 'candlestick' as any,
        data: {
          datasets: [
            {
              label: currentTicker,
              data: [],
              borderColor: {
                up: '#00e475',
                down: '#ff6b6b',
                unchanged: '#94a3b8',
              } as any,
              backgroundColor: {
                up: 'rgba(0,228,117,0.4)',
                down: 'rgba(255,107,107,0.4)',
                unchanged: 'rgba(148,163,184,0.4)',
              } as any,
            },
            {
              type: 'line' as any,
              data: [],
              borderColor: '#0077ff',
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: CHART_OPTS,
      });
    }

    // Live price line chart
    if (!liveChart.current && liveRef.current) {
      liveChart.current = new Chart(liveRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderColor: '#00e475',
            backgroundColor: 'rgba(0,228,117,0.06)',
            borderWidth: 1.5,
            pointRadius: 2,
            fill: true,
            tension: 0.3,
          }],
        },
        options: LIVE_CHART_OPTS,
      });
    }

    // Regression chart
    if (!regChart.current && regRef.current) {
      regChart.current = new Chart(regRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            { data: [], borderColor: '#0077ff', borderWidth: 1.5, pointRadius: 3, fill: false },
            { data: [], borderColor: '#ffb800', borderWidth: 2, borderDash: [5, 4], pointRadius: 0, fill: false },
          ],
        },
        options: LIVE_CHART_OPTS,
      });
    }

    return () => {
      histChart.current?.destroy(); histChart.current = null;
      liveChart.current?.destroy(); liveChart.current = null;
      regChart.current?.destroy();  regChart.current  = null;
      if (pollRef.current) clearInterval(pollRef.current);
      wsRef.current?.close();
    };
  }, []);

  // ── Auto-run ──────────────────────────────────────────
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      setTimeout(() => { void connectAll(currentTicker); }, 600);
    }
  }, []);

  // ── Live point ────────────────────────────────────────
  function addLivePoint(price: number, label: string) {
    liveData.current.prices.push(price);
    liveData.current.labels.push(label);
    if (liveData.current.prices.length > MAX_LIVE) {
      liveData.current.prices.shift();
      liveData.current.labels.shift();
    }
    if (liveChart.current) {
      liveChart.current.data.labels = liveData.current.labels;
      liveChart.current.data.datasets[0].data = liveData.current.prices;
      liveChart.current.update('none');
    }
    onStateUpdate({ lastQuote: lastQuote ? { ...lastQuote, price } : null });
  }

  // ── Predict ───────────────────────────────────────────
  async function doPredict(ticker: string, price: number) {
    if (!modelRef.current) return;
    try {
      const pr = await fetch('/api/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, live_price: price }),
      });
      if (!pr.ok) return;
      const text = await pr.text();
      if (!text) return;
      const pd: PredictData = JSON.parse(text);
      if (!(pd as any).error) onStateUpdate({ lastPredict: pd });
    } catch { /* silent */ }
  }

  // ── Quote fetch ───────────────────────────────────────
  async function doRefreshQuote(ticker: string, meta?: TrainMeta | null) {
    try {
      const r = await fetch('/api/quote?ticker=' + ticker);
      if (!r.ok) { addLog('QUOTE HTTP ERROR: ' + r.status); return; }
      const text = await r.text();
      if (!text) { addLog('QUOTE ERROR: empty response'); return; }
      const d: QuoteData = JSON.parse(text);
      if ((d as any).error) { addLog('QUOTE ERROR: ' + (d as any).error); return; }
      onStateUpdate({ lastQuote: d });
      const currentMeta = meta ?? modelRef.current;
      if (currentMeta) await doPredict(ticker, d.price);
    } catch (e: any) {
      addLog('QUOTE ERROR: ' + e.message);
    }
  }

  // ── WebSocket ─────────────────────────────────────────
  function connectWS(apiKey: string, ticker: string) {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket('wss://ws.finnhub.io?token=' + apiKey);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', symbol: ticker }));
      setStatus('live');
      addLog('WebSocket connected ✓  Subscribed to ' + ticker);
    };
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'trade' && msg.data) {
        for (const t of msg.data) addLivePoint(parseFloat(t.p), new Date(t.t).toLocaleTimeString());
        const latest = liveData.current.prices[liveData.current.prices.length - 1];
        if (modelRef.current && latest) await doPredict(ticker, latest);
      }
    };
    ws.onerror = () => { setStatus('error'); addLog('WebSocket error — will keep polling quote.'); };
    ws.onclose = () => { setStatus('closed'); addLog('WebSocket closed.'); };
  }

  // ── Connect + Train ───────────────────────────────────
  const connectAll = useCallback(async (forceTicker?: string) => {
    const ticker = forceTicker ?? (customTicker.trim().toUpperCase() || tickerRef.current);
    if (!forceTicker && customTicker.trim()) onStateUpdate({ currentTicker: ticker });

    setStatus('training');
    addLog('Training ML model for ' + ticker + '...');
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const r = await fetch('/api/train', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => '');
        let errMsg = errText.slice(0, 200) || 'no body';
        errMsg = errMsg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        addLog(`TRAIN HTTP ${r.status}: ${errMsg}`);
        setStatus('error'); return;
      }

      const text = await r.text();
      if (!text || text.trim() === '') {
        addLog('TRAIN ERROR: empty response from Flask — check your terminal for Python errors.');
        setStatus('error'); return;
      }

      let d: any;
      try { d = JSON.parse(text); }
      catch { addLog('TRAIN ERROR: invalid JSON — ' + text.slice(0, 80)); setStatus('error'); return; }

      if (d.error) { addLog('TRAIN ERROR: ' + d.error); setStatus('error'); return; }

      const meta: TrainMeta = d.meta;
      modelRef.current = meta;
      onStateUpdate({ modelMeta: meta });
      addLog(`Model trained ✓  R²=${meta.r2}  MSE=${meta.mse}  Points=${meta.data_points}`);

      // ── Candlestick chart ──────────────────────────────
      if (histChart.current && d.history?.length) {
        // Dataset 0: candlesticks (OHLC)
        histChart.current.data.datasets[0].data = d.history.map((h: any, i: number, arr: any[]) => {
          const open  = i === 0 ? h.close : arr[i - 1].close;
          const close = h.close;
          // Use real OHLC if available, otherwise approximate wicks
          const high  = h.high  ?? Math.max(open, close) * (1 + Math.random() * 0.005);
          const low   = h.low   ?? Math.min(open, close) * (1 - Math.random() * 0.005);
          return { x: new Date(h.date).getTime(), o: open, h: high, l: low, c: close };
        });
        // Dataset 1: line overlay
        (histChart.current.data.datasets[1] as any).data = d.history.map((h: any) => ({
          x: new Date(h.date).getTime(),
          y: h.close,
        }));
        histChart.current.update();
      }

      // ── Regression chart ───────────────────────────────
      if (regChart.current && d.history?.length) {
        const last50 = d.history.slice(-50);
        const xs  = last50.map((_: any, i: number) => i + 1);
        const n   = xs.length;
        const sy  = last50.reduce((a: number, h: any) => a + h.close, 0);
        const sx  = xs.reduce((a: number, x: number) => a + x, 0);
        const sxy = xs.reduce((a: number, x: number, i: number) => a + x * last50[i].close, 0);
        const sx2 = xs.reduce((a: number, x: number) => a + x * x, 0);
        const m   = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
        const b   = (sy - m * sx) / n;
        regChart.current.data.labels = last50.map((h: any) => h.date);
        regChart.current.data.datasets[0].data = last50.map((h: any) => h.close);
        regChart.current.data.datasets[1].data = xs.map((x: number) => parseFloat((m * x + b).toFixed(2)));
        regChart.current.update();
      }

      await doRefreshQuote(ticker, meta);

      try {
        const tr = await fetch('/api/wstoken');
        if (tr.ok) {
          const tdText = await tr.text();
          if (tdText) {
            const td = JSON.parse(tdText);
            if (!td.error) connectWS(td.token, ticker);
          }
        }
      } catch { addLog('WS token fetch failed — using poll mode.'); }

      pollRef.current = setInterval(() => { void doRefreshQuote(tickerRef.current); }, QUOTE_POLL_MS);

    } catch (e: any) {
      addLog('ERROR: ' + e.message + ' — is Flask running? (python app.py)');
      setStatus('error');
    }
  }, [customTicker]);

  // ── Switch ticker ─────────────────────────────────────
  function setTicker(t: string) {
    onStateUpdate({ currentTicker: t });
    tickerRef.current = t;
    liveData.current = { labels: [], prices: [] };
    if (liveChart.current) {
      liveChart.current.data.labels = [];
      liveChart.current.data.datasets[0].data = [];
      liveChart.current.update('none');
    }
    void connectAll(t);
  }

  const { lastPredict } = appState;
  const signal = lastPredict?.signal ?? 'HOLD';

  return (
    <>
      <Shell
        currentView="terminal"
        onNavigate={onNavigate}
        title="Terminal"
        ticker={currentTicker}
        quote={lastQuote}
        predict={lastPredict}
      >
        {/* ── Controls ── */}
        <div className="controls-row">
          <div className="tick-tabs">
            {TICKERS.map(t => (
              <div
                key={t}
                className={`tick-btn ${currentTicker === t ? 'active' : ''}`}
                onClick={() => setTicker(t)}
              >{t}</div>
            ))}
          </div>
          <div className="ctrls-right">
            <input
              type="text" value={customTicker}
              onChange={e => setCustomTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && void connectAll()}
              placeholder="Custom ticker (e.g. NVDA)"
              style={{ width: 155 }}
            />
            <button className="btn-p" onClick={() => { void connectAll(); }}>
              {status === 'training' ? '⏳ Training...' : 'Connect + Train'}
            </button>
            <button className="btn-s" onClick={() => { void doRefreshQuote(currentTicker); }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Main 2-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12, marginTop: 12 }}>

          {/* LEFT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Price header */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {currentTicker} / USD
                </span>
                {lastQuote && (
                  <span style={{ color: lastQuote.change >= 0 ? '#00e475' : '#ff6b6b', fontSize: 13, fontWeight: 700 }}>
                    {lastQuote.change >= 0 ? '+' : ''}{lastQuote.change_pct}%
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20, marginLeft: 'auto', alignItems: 'center' }}>
                {lastQuote && [
                  { l: 'HIGH', v: `$${lastQuote.high.toFixed(2)}` },
                  { l: 'LOW',  v: `$${lastQuote.low.toFixed(2)}` },
                  { l: 'OPEN', v: `$${lastQuote.open.toFixed(2)}` },
                ].map(({ l, v }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em' }}>{l}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button className="btn-p" style={{ padding: '4px 14px', fontSize: 11 }}>Live</button>
                  <button className="btn-s" style={{ padding: '4px 14px', fontSize: 11 }}>Simulation</button>
                </div>
              </div>
            </div>

            {/* Candlestick chart */}
            <div className="dash-card" style={{ flex: 1, minHeight: 320 }}>
              <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {status === 'live' && <span className="ldot on" style={{ display: 'inline-block' }} />}
                Historical Candlestick + Line Overlay
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 10 }}>
                  <span style={{ color: '#00e475' }}>▲ Bullish</span>
                  <span style={{ color: '#ff6b6b' }}>▼ Bearish</span>
                  <span style={{ color: '#0077ff' }}>── MA Overlay</span>
                </span>
              </div>
              <div className="chart-wrap" style={{ height: 280 }}><canvas ref={histRef} /></div>
            </div>

            {/* Trade execution + ML signal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Trade execution */}
              <div className="dash-card">
                <div className="dash-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  TRADE EXECUTION
                  <span style={{ color: '#00e475', fontSize: 10 }}>● INSTANT</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em', marginBottom: 4 }}>AMOUNT (USD)</div>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, overflow: 'hidden', marginBottom: 12,
                  }}>
                    <input
                      type="number" placeholder="0.00"
                      style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', fontSize: 14, padding: '8px 12px', outline: 'none' }}
                    />
                    <span style={{ color: '#475569', fontSize: 10, padding: '0 12px' }}>MAX</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button style={{
                      background: '#00e475', border: 'none', borderRadius: 6,
                      color: '#0a0f1a', fontWeight: 800, fontSize: 13, padding: '10px', cursor: 'pointer',
                    }}>Buy {currentTicker}</button>
                    <button style={{
                      background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
                      borderRadius: 6, color: '#ff6b6b', fontWeight: 800, fontSize: 13, padding: '10px', cursor: 'pointer',
                    }}>Sell {currentTicker}</button>
                  </div>
                </div>
              </div>

              {/* ML Signal */}
              <div className="dash-card">
                <div className="dash-card-title">ML SIGNAL — MLP NEURAL NET</div>
                <div className="signal-wrap" style={{ marginTop: 10 }}>
                  <div className={`sig-badge ${signal}`}>{signal}</div>
                  <div className="sig-desc" style={{ marginTop: 8 }}>
                    {lastPredict
                      ? signal === 'BUY'
                        ? `Predicts $${lastPredict.predicted} — up ${lastPredict.diff} (${lastPredict.diff_pct}%). Positive trend.`
                        : signal === 'SELL'
                        ? `Predicts $${lastPredict.predicted} — down ${lastPredict.diff} (${lastPredict.diff_pct}%). Negative trend.`
                        : `Predicted change (${lastPredict.diff_pct}%) within ±0.3% band.`
                      : 'Connecting to model...'}
                  </div>
                  {modelMeta && (
                    <div className="model-grid" style={{ marginTop: 10 }}>
                      <div className="model-stat">R² <strong>{modelMeta.r2}</strong></div>
                      <div className="model-stat">MSE <strong>{modelMeta.mse}</strong></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* AI Market Insights */}
            <div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(0,119,255,0.05), rgba(0,0,0,0))' }}>
              <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#0077ff' }}>✦✦</span> AI Market Insights
              </div>
              <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em', marginBottom: 10 }}>
                POWERED BY STOCKER V4.2 DEEP ANALYSIS
              </div>
              {lastPredict ? (
                <div style={{
                  background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.15)',
                  borderRadius: 8, padding: '12px 14px', marginBottom: 12,
                }}>
                  <div style={{ color: '#0077ff', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6 }}>
                    ⚡ {signal === 'BUY' ? 'BULLISH MOMENTUM DETECTED' : signal === 'SELL' ? 'BEARISH SIGNAL DETECTED' : 'NEUTRAL ZONE'}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.7, margin: 0 }}>
                    {signal === 'BUY'
                      ? `${currentTicker} shows positive momentum. Model predicts $${lastPredict.predicted} next close — up ${lastPredict.diff_pct}%.`
                      : signal === 'SELL'
                      ? `${currentTicker} facing headwinds. Predicted decline to $${lastPredict.predicted} (${lastPredict.diff_pct}%).`
                      : `${currentTicker} consolidating. Predicted next close: $${lastPredict.predicted}.`}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ color: '#475569', fontSize: 9 }}>
                      CONFIDENCE: {modelMeta ? Math.round(parseFloat(modelMeta.r2) * 100) : '—'}%
                    </span>
                    <span style={{ color: '#475569', fontSize: 9 }}>{new Date().toLocaleTimeString()} UTC</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#2a4a3a', fontSize: 11, padding: '12px 0' }}>
                  Training model — insights loading...
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>KEY INDICATORS</div>
                {[
                  { l: 'Model R²',    v: modelMeta?.r2 ?? '—',          color: '#00e475' },
                  { l: 'Data Points', v: modelMeta?.data_points ?? '—',  color: '#94a3b8' },
                  { l: 'WS Status',   v: status.toUpperCase(),           color: status === 'live' ? '#00e475' : '#ff6b6b' },
                ].map(({ l, v, color }) => (
                  <div key={l} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <span style={{ color: '#475569', fontSize: 11 }}>{l}</span>
                    <span style={{ color, fontSize: 11, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live chart */}
            <div className="dash-card">
              <div className="dash-card-title">Live Price Stream</div>
              <div className="chart-wrap" style={{ height: 140 }}><canvas ref={liveRef} /></div>
            </div>

            {/* Regression chart */}
            <div className="dash-card">
              <div className="dash-card-title">Predicted vs Actual (Last 50d)</div>
              <div className="chart-wrap" style={{ height: 140 }}><canvas ref={regRef} /></div>
            </div>

            {/* Sovereign Analyst button */}
            <button
              onClick={() => setAnalystOpen(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(0,228,117,0.08), rgba(0,119,255,0.05))',
                border: '1px solid rgba(0,228,117,0.2)', borderRadius: 10,
                padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.2s', width: '100%',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'rgba(0,228,117,0.5)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,228,117,0.12), rgba(0,119,255,0.08))';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(0,228,117,0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,228,117,0.08), rgba(0,119,255,0.05))';
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00e475, #0077ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>✦</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>The Sovereign Analyst</div>
                <div style={{ color: '#475569', fontSize: 10, letterSpacing: '0.05em' }}>Institutional Grade AI</div>
              </div>
              <span style={{ color: '#00e475', marginLeft: 'auto', fontSize: 16 }}>→</span>
            </button>
          </div>
        </div>

        {/* ── Log ── */}
        <div className="dash-log" style={{ marginTop: 12 }}>
          {logs.map((l, i) => (
            <div key={i} style={{
              color: l.includes('ERROR') ? '#ff6b6b' : l.includes('✓') ? '#00e475' : '#2a7a50',
            }}>{l}</div>
          ))}
        </div>
      </Shell>

      <SovereignSidebar
        open={analystOpen}
        onClose={() => setAnalystOpen(false)}
        appState={appState}
      />
    </>
  );
}