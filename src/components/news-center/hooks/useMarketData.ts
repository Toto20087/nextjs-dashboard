import { useQuery } from "@tanstack/react-query";

interface PriceBar {
  timestamp: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

interface MarketData {
  symbol: string;
  timeframe: string;
  bars: PriceBar[];
  metadata: {
    start: string;
    end: string;
    count: number;
  };
}

interface LatestMarketData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export const useHistoricalData = (
  symbol: string,
  timeframe: string = "1Day",
  start?: string,
  end?: string,
  limit: number = 100
) => {
  return useQuery<MarketData>({
    queryKey: ["market-data-history", symbol, timeframe, start, end, limit],
    queryFn: async () => {
      let url = `/api/market-data/${symbol}/history?timeframe=${timeframe}&limit=${limit}`;
      if (start) url += `&start=${start}`;
      if (end) url += `&end=${end}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch historical market data");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!symbol,
    refetchInterval: 60000,
  });
};

export const useLatestMarketData = (symbol: string) => {
  return useQuery<LatestMarketData>({
    queryKey: ["market-data-latest", symbol],
    queryFn: async () => {
      const response = await fetch(`/api/market-data/${symbol}`);
      if (!response.ok) {
        throw new Error("Failed to fetch latest market data");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!symbol,
    refetchInterval: 30000,
  });
};