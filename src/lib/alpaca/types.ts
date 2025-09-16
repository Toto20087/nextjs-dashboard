/**
 * Type definitions for Alpaca API responses and data structures
 */

export interface AlpacaQuote {
  symbol: string
  bid: number
  ask: number
  bidSize: number
  askSize: number
  timestamp: string
}

export interface AlpacaTrade {
  symbol: string
  price: number
  size: number
  timestamp: string
  conditions: string[]
}

export interface AlpacaBar {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  tradeCount: number
  vwap: number
}

export interface AlpacaAccount {
  id: string
  accountNumber: string
  status: 'ONBOARDING' | 'SUBMISSION_FAILED' | 'SUBMITTED' | 'ACCOUNT_UPDATED' | 'APPROVAL_PENDING' | 'ACTIVE' | 'REJECTED'
  currency: string
  buyingPower: string
  cash: string
  portfolioValue: string
  equity: string
  lastEquity: string
  multiplier: string
  dayTradeCount: number
  dayTradingBuyingPower: string
  regtBuyingPower: string
}

export interface AlpacaPosition {
  symbol: string
  qty: string
  marketValue: string
  costBasis: string
  unrealizedPl: string
  unrealizedPlpc: string
  currentPrice: string
  lastdayPrice: string
  changeToday: string
}

export interface AlpacaPortfolioHistory {
  timestamp: number[]
  equity: number[]
  profitLoss: number[]
  profitLossPercent: number[]
  baseValue: number
  timeframe: string
}

export interface AlpacaClock {
  timestamp: string
  is_open: boolean
  next_open: string
  next_close: string
}

export interface AlpacaCalendarDay {
  date: string
  open: string
  close: string
  settlement_date: string
}

export interface AlpacaAsset {
  id: string
  class: 'us_equity' | 'crypto'
  exchange: string
  symbol: string
  name: string
  status: 'active' | 'inactive'
  tradable: boolean
  marginable: boolean
  shortable: boolean
  easy_to_borrow: boolean
  fractionable: boolean
  min_order_size: string
  min_trade_increment: string
  price_increment: string
}

export interface MarketDataRequest {
  symbol: string
  timeframe?: '1Min' | '5Min' | '15Min' | '30Min' | '1Hour' | '1Day'
  start?: string
  end?: string
  limit?: number
  adjustment?: 'raw' | 'split' | 'dividend' | 'all'
}

export interface PortfolioHistoryRequest {
  period?: '1D' | '1W' | '1M' | '3M' | '1A' | 'all'
  timeframe?: '1Min' | '5Min' | '15Min' | '1H' | '1D'
  extendedHours?: boolean
}

export interface MarketDataResponse {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  bid?: number
  ask?: number
  high52w?: number
  low52w?: number
}

export interface PortfolioSummary {
  totalValue: number
  dayChange: number
  dayChangePercent: number
  totalPnl: number
  totalPnlPercent: number
  buyingPower: number
  cash: number
}

export interface PortfolioVsBenchmark {
  data: Array<{
    date: string
    portfolioValue: number
    portfolioReturn: number
    benchmarkPrice: number
    benchmarkReturn: number
  }>
  summary: {
    portfolioReturn: number
    benchmarkReturn: number
    outperformance: number
  }
}

export interface AlpacaConnectionStatus {
  success: boolean
  message: string
  latency?: number
  timestamp: string
}

export interface AlpacaRateLimit {
  limit: number
  remaining: number
  reset: number
}

// Error types
export interface AlpacaErrorResponse {
  code: number
  message: string
  details?: any
}

// Configuration types
export interface AlpacaConfig {
  apiKey: string
  apiSecret: string
  paper: boolean
  baseUrl?: string
  dataUrl?: string
  rateLimit?: boolean
}

// Market data subscription types (for future WebSocket implementation)
export interface MarketDataSubscription {
  trades?: string[]
  quotes?: string[]
  bars?: string[]
  updatedBars?: string[]
  dailyBars?: string[]
  statuses?: string[]
  lulds?: string[]
}

// Historical data aggregation types
export interface AggregatedData {
  symbol: string
  timeframe: string
  data: AlpacaBar[]
  meta: {
    totalCount: number
    startDate: string
    endDate: string
    hasMore: boolean
  }
}

// Portfolio analytics types
export interface PortfolioAnalytics {
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
  positions: Array<{
    symbol: string
    quantity: number
    marketValue: number
    costBasis: number
    unrealizedPnl: number
    unrealizedPnlPercent: number
    dayChange: number
    dayChangePercent: number
    weight: number
  }>
  cash: number
  buyingPower: number
}

// Market status types
export interface MarketStatus {
  market: 'open' | 'closed' | 'early_close'
  nextOpen?: string
  nextClose?: string
  timezone: string
  timestamp: string
}

export interface ExtendedHoursStatus {
  preMarket: {
    isOpen: boolean
    open?: string
    close?: string
  }
  afterHours: {
    isOpen: boolean
    open?: string
    close?: string
  }
}

// Search and discovery types
export interface SymbolSearchResult {
  symbol: string
  name: string
  exchange: string
  assetClass: string
  status: string
  tradable: boolean
}

// News and fundamental data types (for future implementation)
export interface AlpacaNewsItem {
  id: string
  headline: string
  summary: string
  author: string
  created_at: string
  updated_at: string
  url: string
  symbols: string[]
  images: Array<{
    size: 'thumb' | 'small' | 'large'
    url: string
  }>
}

// Utility types
export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok'
export type OrderClass = 'simple' | 'bracket' | 'oco' | 'oto'
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
export type OrderSide = 'buy' | 'sell'
export type AssetStatus = 'active' | 'inactive'
export type AssetClass = 'us_equity' | 'crypto'