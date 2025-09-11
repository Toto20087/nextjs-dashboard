export interface Ticker {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  price?: number;
  change?: number;
  changePercent?: number;
}

export interface TickerSearchResult {
  tickers: Ticker[];
  total: number;
  page: number;
  limit: number;
}

export interface TickerSearchParams {
  query?: string;
  exchange?: string;
  sector?: string;
  limit?: number;
  page?: number;
}