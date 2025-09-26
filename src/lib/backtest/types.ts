/**
 * Type definitions for the backtesting service integration
 */

export interface WalkForwardConfig {
  enabled: boolean
  training_window?: number // Training Window (days)
  step_size?: number // Step Size (days)  
  optimization_period?: number // Optimization Period (days)
  min_trade_count?: number // Min Trade Count
  // Legacy support for existing format
  windowSize?: number // Training Window (days)
  stepSize?: number // Step Size (days)
  optimizationPeriod?: number // Optimization Period (days)
  minTradeCount?: number // Min Trade Count
}

export interface BacktestRequest {
  strategyName: string
  symbols: string[]
  parameters: Record<string, any> | null
  startDate: string | null // ISO date string
  endDate: string | null // ISO date string
  initialCapital?: number
  position_sizing?: number
  timeframe?: string
  enable_regime_position_sizing?: boolean
  walkForwardConfig?: WalkForwardConfig | null
  optimizeConfig?: boolean
  benchmark?: string
  commission?: number
  slippage?: number
  metadata?: Record<string, any>
}

export interface BacktestResponse {
  success: boolean
  backtestId: string
  status: 'queued' | 'pending' | 'running'
  estimatedDuration?: string
  queuePosition?: number
  message?: string
}

export interface BacktestStatus {
  backtestId: string
  status: 'queued' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress?: number // 0-100
  currentStep?: string
  estimatedTimeRemaining?: string
  startedAt?: string
  completedAt?: string
  error?: string
  logs?: string[]
}

export interface BacktestResult {
  backtestId: string
  strategyName: string
  symbols: string[]
  parameters: Record<string, any>
  period: {
    start: string
    end: string
    totalDays: number
    tradingDays: number
  }
  performance: BacktestPerformance
  trades: BacktestTrade[]
  equityCurve: BacktestEquityPoint[]
  metrics: BacktestMetrics
  drawdown: BacktestDrawdownPoint[]
  benchmark?: {
    symbol: string
    totalReturn: number
    equityCurve: Array<{ date: string; value: number }>
  }
  riskMetrics: RiskMetrics
  monthlyReturns: MonthlyReturn[]
  yearlyReturns: YearlyReturn[]
  createdAt: string
  completedAt: string
  processingTime: number // seconds
}

export interface BacktestPerformance {
  initialCapital: number
  finalCapital: number
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  cagr: number // Compound Annual Growth Rate
  volatility: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  maxDrawdownDuration: number // days
  winRate: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageTradeReturn: number
  averageTradeDuration: number // days
  expectancy: number
  kelly: number // Kelly Criterion
  var95: number // Value at Risk 95%
  cvar95: number // Conditional Value at Risk 95%
}

export interface BacktestTrade {
  id: string
  symbol: string
  entryDate: string
  exitDate: string
  entryPrice: number
  exitPrice: number
  quantity: number
  side: 'long' | 'short'
  pnl: number
  pnlPercent: number
  duration: number // days
  commission: number
  slippage: number
  entrySignal?: string
  exitSignal?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface BacktestEquityPoint {
  date: string
  equity: number
  returns: number
  cumulativeReturns: number
  drawdown: number
  positions: number
  cash: number
}

export interface BacktestDrawdownPoint {
  date: string
  drawdown: number
  drawdownPercent: number
  isNewHigh: boolean
  daysSinceHigh: number
}

export interface BacktestMetrics {
  // Return Metrics
  totalReturn: number
  annualizedReturn: number
  monthlyReturn: number
  dailyReturn: number
  
  // Risk Metrics
  volatility: number
  downside_volatility: number
  tracking_error: number
  information_ratio: number
  
  // Risk-Adjusted Returns
  sharpe_ratio: number
  sortino_ratio: number
  calmar_ratio: number
  omega_ratio: number
  
  // Drawdown Metrics
  max_drawdown: number
  max_drawdown_duration: number
  avg_drawdown: number
  avg_drawdown_duration: number
  
  // Trade Statistics
  total_trades: number
  win_rate: number
  loss_rate: number
  avg_win: number
  avg_loss: number
  profit_factor: number
  expectancy: number
  
  // Other Metrics
  beta: number
  alpha: number
  r_squared: number
  skewness: number
  kurtosis: number
  tail_ratio: number
}

export interface RiskMetrics {
  var: {
    daily95: number
    daily99: number
    monthly95: number
    monthly99: number
  }
  cvar: {
    daily95: number
    daily99: number
    monthly95: number
    monthly99: number
  }
  maxConsecutiveLosses: number
  maxConsecutiveWins: number
  longestDrawdownDays: number
  recoveryFactor: number
  ulcerIndex: number
  gainToPainRatio: number
}

export interface MonthlyReturn {
  year: number
  month: number
  monthName: string
  return: number
  returnPercent: number
  trades: number
}

export interface YearlyReturn {
  year: number
  return: number
  returnPercent: number
  trades: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
}

// Strategy-related types
export interface StrategyDefinition {
  name: string
  description: string
  version: string
  parameters: StrategyParameter[]
  defaultSymbols: string[]
  minHistoryDays: number
  category: string
  riskLevel: 'low' | 'medium' | 'high'
  author: string
  documentation?: string
}

export interface StrategyParameter {
  name: string
  displayName: string
  type: 'number' | 'integer' | 'boolean' | 'string' | 'select'
  defaultValue: any
  description: string
  constraints?: {
    min?: number
    max?: number
    step?: number
    options?: Array<{ value: any; label: string }>
    required?: boolean
  }
  advanced?: boolean
  group?: string
}

// Queue and service status types
export interface QueueStatus {
  queueSize: number
  runningJobs: number
  completedToday: number
  failedToday: number
  averageProcessingTime: number
  estimatedWaitTime: string
  systemLoad: number
  maxConcurrentJobs: number
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down'
  version: string
  uptime: number
  lastHealthCheck: string
  dependencies: {
    database: 'up' | 'down'
    dataProvider: 'up' | 'down'
    storage: 'up' | 'down'
  }
  performance: {
    avgResponseTime: number
    successRate: number
    errorRate: number
  }
}

// Backtest comparison types
export interface BacktestComparison {
  backtests: Array<{
    id: string
    name: string
    strategy: string
    performance: BacktestPerformance
    equityCurve: BacktestEquityPoint[]
  }>
  comparison: {
    bestReturn: string // backtest id
    bestSharpe: string
    lowestDrawdown: string
    mostTrades: string
    correlation: number[][] // correlation matrix
  }
}

// Walk-forward analysis types
export interface WalkForwardResult {
  backtestId: string
  periods: Array<{
    optimizationStart: string
    optimizationEnd: string
    testStart: string
    testEnd: string
    optimizedParameters: Record<string, any>
    performance: BacktestPerformance
    trades: BacktestTrade[]
  }>
  overallPerformance: BacktestPerformance
  parameterStability: Record<string, {
    values: any[]
    stability: number // 0-1
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
}

// Monte Carlo simulation types
export interface MonteCarloResult {
  backtestId: string
  simulations: number
  results: Array<{
    finalCapital: number
    totalReturn: number
    maxDrawdown: number
    sharpeRatio: number
  }>
  statistics: {
    meanReturn: number
    medianReturn: number
    stdReturn: number
    probabilityOfProfit: number
    var95: number
    bestCase: number
    worstCase: number
    percentiles: Record<number, number> // 5th, 10th, 25th, 75th, 90th, 95th
  }
  confidence: {
    return95: [number, number] // [lower, upper]
    return99: [number, number]
    drawdown95: [number, number]
    drawdown99: [number, number]
  }
}

// Error types
export interface BacktestErrorDetails {
  code: string
  message: string
  details?: any
  timestamp: string
  backtestId?: string
  retryable: boolean
}

// Export utility types
export type BacktestStatusType = BacktestStatus['status']
export type StrategyParameterType = StrategyParameter['type']
export type TradeSide = BacktestTrade['side']
export type ServiceStatus = ServiceHealth['status']

// Validation schemas (for runtime validation)
export interface BacktestRequestValidation {
  strategyName: { required: true; minLength: 1; maxLength: 100 }
  symbols: { required: true; minItems: 1; maxItems: 50 }
  startDate: { required: true; format: 'date' }
  endDate: { required: true; format: 'date' }
  initialCapital: { required: false; min: 1000; max: 10000000 }
  parameters: { required: true; type: 'object' }
  walkForwardConfig: { required: false; type: 'object' }
  optimizeConfig: { required: false; type: 'boolean' }
}