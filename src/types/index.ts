export type View = 'landing' | 'signup' | 'dashboard' | 'terminal' | 'settings' | 'portfolio' | 'analytics';

export interface QuoteData {
  ticker: string;
  price: number;
  change: number;
  change_pct: number;
  high: number;
  low: number;
  open: number;
  prev_close: number;
}

export interface PredictData {
  ticker: string;
  current: number;
  predicted: number;
  diff: number;
  diff_pct: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  r2: number;
  mse: number;
}

export interface TrainMeta {
  ticker: string;
  r2: number;
  mse: number;
  data_points: number;
  date_range: string;
  last_close: number;
  last_index: number;
}

export interface HistoryPoint {
  date: string;
  close: number;
}

export interface TrainResponse {
  success: boolean;
  meta: TrainMeta;
  history: HistoryPoint[];
}

export interface AppState {
  currentTicker: string;
  modelMeta: TrainMeta | null;
  lastQuote: QuoteData | null;
  lastPredict: PredictData | null;
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  signal: 'Hold' | 'Accumulate' | 'Sell';
}

export interface Activity {
  id: string;
  type: 'buy' | 'dividend' | 'swap';
  title: string;
  details: string;
  amount: number;
  timestamp: string;
}

export interface Recommendation {
  symbol: string;
  name: string;
  sector: string;
  signal: 'Strong Buy' | 'Hold' | 'Add To Watch';
  description: string;
}