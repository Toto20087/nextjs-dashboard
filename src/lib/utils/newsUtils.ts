export const getSentimentColor = (sentiment: number): string => {
  if (sentiment >= 0.33) return "text-green-600";
  if (sentiment >= -0.33) return "text-yellow-600";
  return "text-red-600";
};

export const getSentimentLabel = (sentiment: number): string => {
  if (sentiment >= 0.33) return "Bullish";
  if (sentiment >= -0.33) return "Neutral";
  return "Bearish";
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString();
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toString();
};