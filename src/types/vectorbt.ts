// Vector-BT API Response Types

export interface BacktestHistoryItem {
  run_id: string;
  job_id: string;
  created_at: string;
  strategy: string;
  symbols: string[];
  start_date: string;
  end_date: string;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
}

export interface BacktestMetrics {
  total_return: number;
  annualized_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number;
  avg_loss: number;
  best_trade: number;
  worst_trade: number;
  avg_trade_duration?: number;
  total_commission: number;
  net_profit: number;
}

export interface BacktestMetadata {
  run_id: string;
  job_id: string;
  created_at: string;
  strategy: string;
  symbols: string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  status: string;
}

export interface BacktestTrade {
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  commission: number;
  pnl: number;
  cumulative_pnl?: number;
  position_size: number;
}

export interface BacktestJob {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  strategy?: string;
  symbols?: string[];
  start_date?: string;
  end_date?: string;
  progress?: number;
  error?: string;
  result?: any;
}

export interface AvailableStrategy {
  name: string;
  display_name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      default: any;
      min?: number;
      max?: number;
      options?: any[];
      description?: string;
    };
  };
}

export interface ParameterRange {
  type: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: any[];
  description?: string;
}

export interface ModularBacktestRequest {
  mode: 'specific' | 'walk_forward' | 'find_best' | 'rebalance' | 'test_date';
  tickers?: string[];
  start_date?: string;
  end_date?: string;
  test_date?: string;
  parameters?: Record<string, any>;
  optimize?: boolean;
  lookback_days?: number;
  top_n?: number;
  max_positions?: number;
  months?: number;
  current_positions?: string[];
}

export interface JobStatistics {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  pending_jobs: number;
  success_rate: number;
  avg_completion_time: number;
  recent_jobs: BacktestJob[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  components: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      response_time?: number;
      last_check: string;
      details?: any;
    };
  };
  uptime: number;
  memory_usage?: number;
  cpu_usage?: number;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown?: number;
}

// Transform functions to convert Vector-BT format to Lovable format
export const transformBacktestHistory = (vectorBtData: BacktestHistoryItem[]): any[] => {
  return vectorBtData.map((item, index) => ({
    id: item.run_id,
    name: `${item.strategy.toUpperCase()} Strategy`,
    indicators: [item.strategy.toUpperCase()], // Simplified - could be enhanced
    tickers: item.symbols,
    allocatedPercentage: 25.0, // Default - could be calculated
    startDate: item.start_date,
    endDate: item.end_date,
    status: 'completed',
    createdAt: item.created_at,
    performance: {
      totalReturn: item.total_return * 100, // Convert to percentage
      sharpeRatio: item.sharpe_ratio,
      maxDrawdown: item.max_drawdown * 100, // Convert to percentage
      winRate: item.win_rate * 100, // Convert to percentage
      totalTrades: 0, // Will be filled from detailed metrics
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0
    },
    regime: 'Market Regime', // Placeholder
    confidence: 0.85 // Placeholder
  }));
};

export const transformBacktestMetrics = (vectorBtMetrics: BacktestMetrics) => ({
  totalReturn: vectorBtMetrics.total_return * 100,
  annualizedReturn: vectorBtMetrics.annualized_return * 100,
  sharpeRatio: vectorBtMetrics.sharpe_ratio,
  sortinoRatio: vectorBtMetrics.sortino_ratio,
  maxDrawdown: vectorBtMetrics.max_drawdown * 100,
  winRate: vectorBtMetrics.win_rate * 100,
  profitFactor: vectorBtMetrics.profit_factor,
  totalTrades: vectorBtMetrics.total_trades,
  winningTrades: vectorBtMetrics.winning_trades,
  losingTrades: vectorBtMetrics.losing_trades,
  avgWin: vectorBtMetrics.avg_win,
  avgLoss: vectorBtMetrics.avg_loss,
  bestTrade: vectorBtMetrics.best_trade,
  worstTrade: vectorBtMetrics.worst_trade,
  totalCommission: vectorBtMetrics.total_commission,
  netProfit: vectorBtMetrics.net_profit
});

export const transformEquityCurve = (equityData: EquityPoint[]) => {
  return equityData.map((point, index) => ({
    date: new Date(point.timestamp).getTime(),
    value: point.equity,
    drawdown: point.drawdown || 0,
    index
  }));
};