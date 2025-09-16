import { BacktestResult, BacktestTrade, BacktestPerformance, BacktestEquityPoint } from './types'

/**
 * Utility functions for backtesting data processing and analysis
 */

/**
 * Calculate additional performance metrics from backtest results
 */
export function calculateAdvancedMetrics(result: BacktestResult): {
  ulcerIndex: number
  recoveryFactor: number
  gainToPainRatio: number
  probabilityOfSuccess: number
  averageMonthlyReturn: number
  worstMonth: number
  bestMonth: number
  consecutiveWinStreak: number
  consecutiveLossStreak: number
} {
  const { trades, equityCurve, performance } = result

  // Ulcer Index - measure of downside volatility
  const ulcerIndex = calculateUlcerIndex(equityCurve)
  
  // Recovery Factor - total return / max drawdown
  const recoveryFactor = performance.maxDrawdown > 0 
    ? performance.totalReturnPercent / performance.maxDrawdown 
    : 0

  // Gain-to-Pain Ratio
  const gainToPainRatio = calculateGainToPainRatio(equityCurve)

  // Probability of Success (% of profitable trades)
  const probabilityOfSuccess = trades.length > 0 
    ? (trades.filter(t => t.pnl > 0).length / trades.length) * 100 
    : 0

  // Monthly return statistics
  const monthlyReturns = calculateMonthlyReturns(equityCurve)
  const averageMonthlyReturn = monthlyReturns.length > 0 
    ? monthlyReturns.reduce((sum, r) => sum + r, 0) / monthlyReturns.length 
    : 0
  const worstMonth = monthlyReturns.length > 0 ? Math.min(...monthlyReturns) : 0
  const bestMonth = monthlyReturns.length > 0 ? Math.max(...monthlyReturns) : 0

  // Consecutive win/loss streaks
  const { winStreak, lossStreak } = calculateStreaks(trades)

  return {
    ulcerIndex,
    recoveryFactor,
    gainToPainRatio,
    probabilityOfSuccess,
    averageMonthlyReturn,
    worstMonth,
    bestMonth,
    consecutiveWinStreak: winStreak,
    consecutiveLossStreak: lossStreak,
  }
}

/**
 * Calculate Ulcer Index - measure of downside risk
 */
function calculateUlcerIndex(equityCurve: BacktestEquityPoint[]): number {
  if (equityCurve.length < 2) return 0

  const drawdowns = equityCurve.map(point => point.drawdown)
  const squaredDrawdowns = drawdowns.map(dd => dd * dd)
  const meanSquaredDrawdown = squaredDrawdowns.reduce((sum, dd) => sum + dd, 0) / squaredDrawdowns.length
  
  return Math.sqrt(meanSquaredDrawdown)
}

/**
 * Calculate Gain-to-Pain Ratio
 */
function calculateGainToPainRatio(equityCurve: BacktestEquityPoint[]): number {
  if (equityCurve.length < 2) return 0

  let gains = 0
  let losses = 0

  for (let i = 1; i < equityCurve.length; i++) {
    const dailyReturn = equityCurve[i].returns
    if (dailyReturn > 0) {
      gains += dailyReturn
    } else {
      losses += Math.abs(dailyReturn)
    }
  }

  return losses > 0 ? gains / losses : 0
}

/**
 * Calculate monthly returns from equity curve
 */
function calculateMonthlyReturns(equityCurve: BacktestEquityPoint[]): number[] {
  if (equityCurve.length < 2) return []

  const monthlyReturns: number[] = []
  let currentMonth = ''
  let monthStart = equityCurve[0].equity

  for (const point of equityCurve) {
    const date = new Date(point.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (currentMonth === '') {
      currentMonth = monthKey
    } else if (currentMonth !== monthKey) {
      // Month changed, calculate return
      const monthEnd = equityCurve[equityCurve.indexOf(point) - 1].equity
      const monthReturn = ((monthEnd - monthStart) / monthStart) * 100
      monthlyReturns.push(monthReturn)
      
      currentMonth = monthKey
      monthStart = monthEnd
    }
  }

  // Handle the last month
  if (equityCurve.length > 0) {
    const lastEquity = equityCurve[equityCurve.length - 1].equity
    const lastMonthReturn = ((lastEquity - monthStart) / monthStart) * 100
    monthlyReturns.push(lastMonthReturn)
  }

  return monthlyReturns
}

/**
 * Calculate consecutive win and loss streaks
 */
function calculateStreaks(trades: BacktestTrade[]): { winStreak: number; lossStreak: number } {
  if (trades.length === 0) return { winStreak: 0, lossStreak: 0 }

  let maxWinStreak = 0
  let maxLossStreak = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentWinStreak++
      currentLossStreak = 0
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
    } else {
      currentLossStreak++
      currentWinStreak = 0
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
    }
  }

  return { winStreak: maxWinStreak, lossStreak: maxLossStreak }
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(performance: BacktestPerformance) {
  return {
    'Total Return': `${performance.totalReturnPercent >= 0 ? '+' : ''}${performance.totalReturnPercent.toFixed(2)}%`,
    'Annualized Return': `${performance.annualizedReturn >= 0 ? '+' : ''}${performance.annualizedReturn.toFixed(2)}%`,
    'Sharpe Ratio': performance.sharpeRatio.toFixed(3),
    'Sortino Ratio': performance.sortinoRatio.toFixed(3),
    'Max Drawdown': `${performance.maxDrawdownPercent.toFixed(2)}%`,
    'Volatility': `${performance.volatility.toFixed(2)}%`,
    'Win Rate': `${performance.winRate.toFixed(1)}%`,
    'Profit Factor': performance.profitFactor.toFixed(3),
    'Total Trades': performance.totalTrades.toString(),
    'Avg Trade': `${performance.averageTradeReturn >= 0 ? '+' : ''}${performance.averageTradeReturn.toFixed(2)}%`,
  }
}

/**
 * Compare multiple backtest results
 */
export function compareBacktests(backtests: BacktestResult[]): {
  summary: {
    bestReturn: { name: string; value: number }
    bestSharpe: { name: string; value: number }
    lowestDrawdown: { name: string; value: number }
    mostTrades: { name: string; value: number }
  }
  rankings: Array<{
    name: string
    rank: number
    score: number // composite score
    metrics: {
      return: number
      sharpe: number
      drawdown: number
      winRate: number
    }
  }>
} {
  if (backtests.length === 0) {
    return {
      summary: {
        bestReturn: { name: '', value: 0 },
        bestSharpe: { name: '', value: 0 },
        lowestDrawdown: { name: '', value: 0 },
        mostTrades: { name: '', value: 0 },
      },
      rankings: [],
    }
  }

  // Find best performers in each category
  const bestReturn = backtests.reduce((best, bt) => 
    bt.performance.totalReturnPercent > best.performance.totalReturnPercent ? bt : best
  )
  
  const bestSharpe = backtests.reduce((best, bt) => 
    bt.performance.sharpeRatio > best.performance.sharpeRatio ? bt : best
  )
  
  const lowestDrawdown = backtests.reduce((best, bt) => 
    bt.performance.maxDrawdownPercent < best.performance.maxDrawdownPercent ? bt : best
  )
  
  const mostTrades = backtests.reduce((best, bt) => 
    bt.performance.totalTrades > best.performance.totalTrades ? bt : best
  )

  // Calculate composite scores
  const rankings = backtests.map(bt => {
    const returnScore = normalizeScore(bt.performance.totalReturnPercent, backtests.map(b => b.performance.totalReturnPercent))
    const sharpeScore = normalizeScore(bt.performance.sharpeRatio, backtests.map(b => b.performance.sharpeRatio))
    const drawdownScore = normalizeScore(-bt.performance.maxDrawdownPercent, backtests.map(b => -b.performance.maxDrawdownPercent))
    const winRateScore = normalizeScore(bt.performance.winRate, backtests.map(b => b.performance.winRate))
    
    const compositeScore = (returnScore * 0.3) + (sharpeScore * 0.3) + (drawdownScore * 0.2) + (winRateScore * 0.2)
    
    return {
      name: bt.strategyName,
      score: compositeScore,
      metrics: {
        return: bt.performance.totalReturnPercent,
        sharpe: bt.performance.sharpeRatio,
        drawdown: bt.performance.maxDrawdownPercent,
        winRate: bt.performance.winRate,
      },
    }
  })
  .sort((a, b) => b.score - a.score)
  .map((item, index) => ({ ...item, rank: index + 1 }))

  return {
    summary: {
      bestReturn: { name: bestReturn.strategyName, value: bestReturn.performance.totalReturnPercent },
      bestSharpe: { name: bestSharpe.strategyName, value: bestSharpe.performance.sharpeRatio },
      lowestDrawdown: { name: lowestDrawdown.strategyName, value: lowestDrawdown.performance.maxDrawdownPercent },
      mostTrades: { name: mostTrades.strategyName, value: mostTrades.performance.totalTrades },
    },
    rankings,
  }
}

/**
 * Normalize a score to 0-100 range based on min/max of dataset
 */
function normalizeScore(value: number, dataset: number[]): number {
  const min = Math.min(...dataset)
  const max = Math.max(...dataset)
  
  if (max === min) return 50 // If all values are the same
  
  return ((value - min) / (max - min)) * 100
}

/**
 * Calculate correlation between two equity curves
 */
export function calculateCorrelation(curve1: BacktestEquityPoint[], curve2: BacktestEquityPoint[]): number {
  if (curve1.length !== curve2.length || curve1.length < 2) return 0

  const returns1 = curve1.slice(1).map((point, i) => point.returns)
  const returns2 = curve2.slice(1).map((point, i) => point.returns)

  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length

  let numerator = 0
  let sum1Sq = 0
  let sum2Sq = 0

  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1
    const diff2 = returns2[i] - mean2
    
    numerator += diff1 * diff2
    sum1Sq += diff1 * diff1
    sum2Sq += diff2 * diff2
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Generate backtest report summary
 */
export function generateReportSummary(result: BacktestResult): string {
  const { strategyName, performance, period } = result
  const advanced = calculateAdvancedMetrics(result)
  
  const isPositive = performance.totalReturnPercent > 0
  const performanceVerb = isPositive ? 'generated' : 'resulted in'
  const returnDescription = isPositive ? 'profit' : 'loss'
  
  return `The ${strategyName} strategy backtest ran from ${new Date(period.start).toLocaleDateString()} to ${new Date(period.end).toLocaleDateString()}, covering ${period.tradingDays} trading days. 

The strategy ${performanceVerb} a total return of ${performance.totalReturnPercent.toFixed(2)}% (${returnDescription}) with an annualized return of ${performance.annualizedReturn.toFixed(2)}%. 

Risk-adjusted performance showed a Sharpe ratio of ${performance.sharpeRatio.toFixed(3)} and a Sortino ratio of ${performance.sortinoRatio.toFixed(3)}. The maximum drawdown reached ${performance.maxDrawdownPercent.toFixed(2)}%, lasting ${performance.maxDrawdownDuration} days.

Trading activity included ${performance.totalTrades} total trades with a win rate of ${performance.winRate.toFixed(1)}%. The profit factor was ${performance.profitFactor.toFixed(3)}, indicating ${performance.profitFactor > 1 ? 'profitable' : 'unprofitable'} trading overall.

The strategy showed ${advanced.consecutiveWinStreak} consecutive winning trades at best and ${advanced.consecutiveLossStreak} consecutive losing trades at worst. Monthly performance analysis revealed an average monthly return of ${advanced.averageMonthlyReturn.toFixed(2)}%, with the best month at ${advanced.bestMonth.toFixed(2)}% and worst month at ${advanced.worstMonth.toFixed(2)}%.`
}

/**
 * Validate backtest result data integrity
 */
export function validateBacktestResult(result: BacktestResult): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!result.backtestId) errors.push('Missing backtest ID')
  if (!result.strategyName) errors.push('Missing strategy name')
  if (!result.performance) errors.push('Missing performance data')
  if (!Array.isArray(result.trades)) errors.push('Invalid trades data')
  if (!Array.isArray(result.equityCurve)) errors.push('Invalid equity curve data')

  // Validate performance metrics
  if (result.performance) {
    if (result.performance.totalTrades !== result.trades.length) {
      errors.push('Trade count mismatch between performance and trades array')
    }
    
    if (result.performance.winningTrades + result.performance.losingTrades !== result.performance.totalTrades) {
      errors.push('Winning + losing trades does not equal total trades')
    }
  }

  // Validate equity curve continuity
  if (result.equityCurve.length > 1) {
    for (let i = 1; i < result.equityCurve.length; i++) {
      const current = new Date(result.equityCurve[i].date)
      const previous = new Date(result.equityCurve[i - 1].date)
      
      if (current <= previous) {
        errors.push('Equity curve dates are not in chronological order')
        break
      }
    }
  }

  // Validate trade data
  for (const trade of result.trades) {
    if (new Date(trade.entryDate) >= new Date(trade.exitDate)) {
      errors.push(`Trade ${trade.id}: entry date must be before exit date`)
    }
    
    if (trade.quantity <= 0) {
      errors.push(`Trade ${trade.id}: quantity must be positive`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Export backtest results to CSV format
 */
export function exportToCsv(result: BacktestResult): { 
  trades: string
  equity: string 
  summary: string 
} {
  // Trades CSV
  const tradesHeaders = ['Date Entry', 'Date Exit', 'Symbol', 'Side', 'Quantity', 'Entry Price', 'Exit Price', 'PnL', 'PnL %', 'Duration']
  const tradesRows = result.trades.map(trade => [
    new Date(trade.entryDate).toLocaleDateString(),
    new Date(trade.exitDate).toLocaleDateString(),
    trade.symbol,
    trade.side,
    trade.quantity.toString(),
    trade.entryPrice.toFixed(4),
    trade.exitPrice.toFixed(4),
    trade.pnl.toFixed(2),
    trade.pnlPercent.toFixed(2),
    trade.duration.toString(),
  ])
  const tradesCsv = [tradesHeaders.join(','), ...tradesRows.map(row => row.join(','))].join('\n')

  // Equity curve CSV
  const equityHeaders = ['Date', 'Equity', 'Returns', 'Cumulative Returns', 'Drawdown', 'Cash', 'Positions']
  const equityRows = result.equityCurve.map(point => [
    new Date(point.date).toLocaleDateString(),
    point.equity.toFixed(2),
    point.returns.toFixed(4),
    point.cumulativeReturns.toFixed(4),
    point.drawdown.toFixed(4),
    point.cash.toFixed(2),
    point.positions.toString(),
  ])
  const equityCsv = [equityHeaders.join(','), ...equityRows.map(row => row.join(','))].join('\n')

  // Summary CSV
  const summaryData = formatPerformanceMetrics(result.performance)
  const summaryRows = Object.entries(summaryData).map(([key, value]) => `${key},${value}`)
  const summaryCsv = ['Metric,Value', ...summaryRows].join('\n')

  return {
    trades: tradesCsv,
    equity: equityCsv,
    summary: summaryCsv,
  }
}