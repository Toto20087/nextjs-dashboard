interface PriceBar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export const calculateVolatility = (bars: PriceBar[]): number => {
  if (bars.length < 2) return 0;
  
  const returns = bars.slice(1).map((bar, i) => 
    Math.log(bar.close / bars[i].close)
  );
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance * 252) * 100;
};

export const calculateSMA = (bars: PriceBar[], period: number): number => {
  if (bars.length < period) return 0;
  
  const prices = bars.slice(-period).map(bar => bar.close);
  return prices.reduce((sum, price) => sum + price, 0) / period;
};

export const calculateRSI = (bars: PriceBar[], period: number = 14): number => {
  if (bars.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = bars.length - period; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const calculateVWAP = (bars: PriceBar[]): number => {
  if (bars.length === 0) return 0;
  
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  bars.forEach(bar => {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    totalVolumePrice += typicalPrice * bar.volume;
    totalVolume += bar.volume;
  });
  
  return totalVolume === 0 ? 0 : totalVolumePrice / totalVolume;
};

export const calculateAverageVolume = (bars: PriceBar[]): number => {
  if (bars.length === 0) return 0;
  
  const totalVolume = bars.reduce((sum, bar) => sum + bar.volume, 0);
  return totalVolume / bars.length;
};

export const calculatePriceChange = (bars: PriceBar[]): { amount: number; percentage: number } => {
  if (bars.length < 2) return { amount: 0, percentage: 0 };
  
  const currentPrice = bars[bars.length - 1].close;
  const previousPrice = bars[bars.length - 2].close;
  const amount = currentPrice - previousPrice;
  const percentage = (amount / previousPrice) * 100;
  
  return { amount, percentage };
};

export const calculateDayRange = (bars: PriceBar[]): { low: number; high: number } => {
  if (bars.length === 0) return { low: 0, high: 0 };
  
  const latestBar = bars[bars.length - 1];
  return { low: latestBar.low, high: latestBar.high };
};

export const calculate52WeekRange = (bars: PriceBar[]): { low: number; high: number } => {
  if (bars.length === 0) return { low: 0, high: 0 };
  
  const prices = bars.map(bar => bar.close);
  return {
    low: Math.min(...prices),
    high: Math.max(...prices)
  };
};

export const calculateTradingScore = (bars: PriceBar[]): number => {
  if (bars.length < 20) return 0;
  
  const volatility = calculateVolatility(bars);
  const rsi = calculateRSI(bars);
  const sma20 = calculateSMA(bars, 20);
  const sma50 = calculateSMA(bars, Math.min(50, bars.length));
  const currentPrice = bars[bars.length - 1].close;
  const averageVolume = calculateAverageVolume(bars);
  const currentVolume = bars[bars.length - 1].volume;
  
  let score = 50;
  
  // Trend analysis (30% weight)
  if (currentPrice > sma20) score += 15;
  if (currentPrice > sma50) score += 15;
  
  // RSI analysis (20% weight)
  if (rsi > 30 && rsi < 70) score += 20;
  else if (rsi > 70) score -= 10;
  else if (rsi < 30) score += 10;
  
  // Volatility analysis (20% weight)
  if (volatility > 10 && volatility < 30) score += 20;
  else if (volatility > 30) score -= 10;
  
  // Volume analysis (30% weight)
  const volumeRatio = currentVolume / averageVolume;
  if (volumeRatio > 1.2) score += 15;
  if (volumeRatio > 0.8) score += 15;
  
  return Math.max(0, Math.min(100, score));
};

export const getRecommendation = (score: number): { action: string; color: string; description: string } => {
  if (score >= 75) {
    return {
      action: "Strong Buy",
      color: "text-green-600",
      description: "Excellent technical indicators with strong momentum"
    };
  } else if (score >= 60) {
    return {
      action: "Buy",
      color: "text-green-500",
      description: "Positive technical indicators suggest upward potential"
    };
  } else if (score >= 40) {
    return {
      action: "Hold",
      color: "text-yellow-600",
      description: "Mixed signals, monitor for clearer direction"
    };
  } else if (score >= 25) {
    return {
      action: "Sell",
      color: "text-red-500",
      description: "Negative indicators suggest downward pressure"
    };
  } else {
    return {
      action: "Strong Sell",
      color: "text-red-600",
      description: "Poor technical indicators with significant risk"
    };
  }
};