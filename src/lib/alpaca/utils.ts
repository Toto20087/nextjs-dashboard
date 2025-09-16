import { AlpacaBar, AlpacaPosition, PortfolioAnalytics } from './types'

/**
 * Utility functions for Alpaca data processing and calculations
 */

/**
 * Convert Alpaca string values to numbers
 */
export function parseAlpacaNumber(value: string | number): number {
  if (typeof value === 'number') return value
  return parseFloat(value) || 0
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate position weight in portfolio
 */
export function calculatePositionWeight(positionValue: number, totalPortfolioValue: number): number {
  if (totalPortfolioValue === 0) return 0
  return (positionValue / totalPortfolioValue) * 100
}

/**
 * Convert Alpaca positions to portfolio analytics
 */
export function calculatePortfolioAnalytics(
  positions: AlpacaPosition[],
  totalEquity: number,
  cash: number,
  dayChangeTotal: number
): PortfolioAnalytics {
  const totalMarketValue = positions.reduce((sum, pos) => 
    sum + parseAlpacaNumber(pos.marketValue), 0
  )
  
  const totalCostBasis = positions.reduce((sum, pos) => 
    sum + parseAlpacaNumber(pos.costBasis), 0
  )
  
  const totalUnrealizedPnl = positions.reduce((sum, pos) => 
    sum + parseAlpacaNumber(pos.unrealizedPl), 0
  )

  const enrichedPositions = positions.map(position => {
    const marketValue = parseAlpacaNumber(position.marketValue)
    const costBasis = parseAlpacaNumber(position.costBasis)
    const currentPrice = parseAlpacaNumber(position.currentPrice)
    const lastDayPrice = parseAlpacaNumber(position.lastdayPrice)
    const quantity = parseAlpacaNumber(position.qty)
    
    const dayChange = (currentPrice - lastDayPrice) * Math.abs(quantity)
    const dayChangePercent = calculatePercentageChange(currentPrice, lastDayPrice)
    
    return {
      symbol: position.symbol,
      quantity,
      marketValue,
      costBasis,
      unrealizedPnl: parseAlpacaNumber(position.unrealizedPl),
      unrealizedPnlPercent: parseAlpacaNumber(position.unrealizedPlpc),
      dayChange,
      dayChangePercent,
      weight: calculatePositionWeight(marketValue, totalEquity),
    }
  })

  return {
    totalReturn: totalUnrealizedPnl,
    totalReturnPercent: totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0,
    dayChange: dayChangeTotal,
    dayChangePercent: totalEquity > 0 ? (dayChangeTotal / (totalEquity - dayChangeTotal)) * 100 : 0,
    positions: enrichedPositions,
    cash,
    buyingPower: totalEquity, // This would need to be passed from account data
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatLargeNumber(value: number): string {
  const absValue = Math.abs(value)
  const sign = value >= 0 ? '' : '-'
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`
  }
  
  return `${sign}${absValue.toFixed(2)}`
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(bars: AlpacaBar[], period: number): number[] {
  const result: number[] = []
  
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += bars[j].close
    }
    
    result.push(sum / period)
  }
  
  return result
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(bars: AlpacaBar[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  if (bars.length === 0) return result
  
  // First value is just the close price
  result.push(bars[0].close)
  
  for (let i = 1; i < bars.length; i++) {
    const ema = (bars[i].close - result[i - 1]) * multiplier + result[i - 1]
    result.push(ema)
  }
  
  return result
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(bars: AlpacaBar[], period = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  if (bars.length < period + 1) {
    return new Array(bars.length).fill(NaN)
  }
  
  // Calculate price changes
  for (let i = 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period
  
  // Fill initial values with NaN
  for (let i = 0; i <= period; i++) {
    result.push(NaN)
  }
  
  // Calculate RSI
  if (avgLoss === 0) {
    result.push(100)
  } else {
    const rs = avgGain / avgLoss
    result.push(100 - (100 / (1 + rs)))
  }
  
  // Calculate subsequent RSI values
  for (let i = period + 1; i < bars.length; i++) {
    const gain = gains[i - 1]
    const loss = losses[i - 1]
    
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    
    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    }
  }
  
  return result
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(bars: AlpacaBar[], period = 20, multiplier = 2) {
  const sma = calculateSMA(bars, period)
  const upperBand: number[] = []
  const lowerBand: number[] = []
  
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      upperBand.push(NaN)
      lowerBand.push(NaN)
      continue
    }
    
    // Calculate standard deviation
    let sumSquaredDiffs = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = bars[j].close - sma[i]
      sumSquaredDiffs += diff * diff
    }
    
    const stdDev = Math.sqrt(sumSquaredDiffs / period)
    
    upperBand.push(sma[i] + (multiplier * stdDev))
    lowerBand.push(sma[i] - (multiplier * stdDev))
  }
  
  return {
    middle: sma,
    upper: upperBand,
    lower: lowerBand,
  }
}

/**
 * Convert timestamp to various formats
 */
export function formatTimestamp(timestamp: string | number, format: 'date' | 'time' | 'datetime' | 'iso' = 'datetime'): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000)
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    case 'datetime':
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    case 'iso':
      return date.toISOString()
    default:
      return date.toString()
  }
}

/**
 * Check if market hours (basic US market hours check)
 */
export function isMarketHours(date: Date = new Date()): boolean {
  const day = date.getDay() // 0 = Sunday, 6 = Saturday
  const hour = date.getHours()
  const minute = date.getMinutes()
  const time = hour * 100 + minute // Convert to HHMM format
  
  // Weekend check
  if (day === 0 || day === 6) return false
  
  // Market hours: 9:30 AM - 4:00 PM ET (assuming local time is ET)
  return time >= 930 && time <= 1600
}

/**
 * Get market session (pre-market, market, after-hours, closed)
 */
export function getMarketSession(date: Date = new Date()): 'pre-market' | 'market' | 'after-hours' | 'closed' {
  const day = date.getDay()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const time = hour * 100 + minute
  
  // Weekend
  if (day === 0 || day === 6) return 'closed'
  
  // Pre-market: 4:00 AM - 9:30 AM ET
  if (time >= 400 && time < 930) return 'pre-market'
  
  // Market hours: 9:30 AM - 4:00 PM ET
  if (time >= 930 && time <= 1600) return 'market'
  
  // After-hours: 4:00 PM - 8:00 PM ET
  if (time > 1600 && time <= 2000) return 'after-hours'
  
  return 'closed'
}

/**
 * Validate symbol format
 */
export function isValidSymbol(symbol: string): boolean {
  // Basic validation for US equity symbols
  const pattern = /^[A-Z]{1,5}$/
  return pattern.test(symbol.toUpperCase())
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function calculateVolatility(bars: AlpacaBar[], period?: number): number {
  if (bars.length < 2) return 0
  
  const data = period ? bars.slice(-period) : bars
  const returns = []
  
  for (let i = 1; i < data.length; i++) {
    const return_ = (data[i].close - data[i - 1].close) / data[i - 1].close
    returns.push(return_)
  }
  
  if (returns.length === 0) return 0
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  
  return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(values: number[]): number {
  let maxDrawdown = 0
  let peak = values[0] || 0
  
  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    
    const drawdown = (peak - value) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return maxDrawdown * 100 // Return as percentage
}