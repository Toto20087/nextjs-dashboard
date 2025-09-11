import { Ticker, TickerSearchResult, TickerSearchParams } from '@/types/ticker';

// Mock ticker data - replace with actual API calls
const mockTickers: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', marketCap: 3000000000000, price: 182.52, change: 1.25, changePercent: 0.69 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software', marketCap: 2800000000000, price: 378.85, change: -2.15, changePercent: -0.56 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services', marketCap: 2100000000000, price: 165.23, change: 0.85, changePercent: 0.52 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Discretionary', industry: 'E-commerce', marketCap: 1800000000000, price: 178.25, change: 3.45, changePercent: 1.97 },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Discretionary', industry: 'Automotive', marketCap: 800000000000, price: 248.42, change: -5.23, changePercent: -2.06 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', marketCap: 1900000000000, price: 875.28, change: 12.45, changePercent: 1.44 },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Social Media', marketCap: 1300000000000, price: 512.78, change: -1.85, changePercent: -0.36 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Insurance', marketCap: 900000000000, price: 439.21, change: 2.15, changePercent: 0.49 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banking', marketCap: 600000000000, price: 198.75, change: 1.25, changePercent: 0.63 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare', industry: 'Pharmaceuticals', marketCap: 450000000000, price: 162.45, change: -0.85, changePercent: -0.52 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Health Insurance', marketCap: 500000000000, price: 528.92, change: 3.25, changePercent: 0.62 },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', sector: 'Consumer Staples', industry: 'Household Products', marketCap: 380000000000, price: 158.73, change: 0.45, changePercent: 0.28 },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', sector: 'Consumer Discretionary', industry: 'Home Improvement', marketCap: 350000000000, price: 385.42, change: -1.25, changePercent: -0.32 },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Payment Processing', marketCap: 400000000000, price: 412.85, change: 2.15, changePercent: 0.52 },
  { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banking', marketCap: 320000000000, price: 39.78, change: 0.25, changePercent: 0.63 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas', marketCap: 450000000000, price: 108.52, change: -1.85, changePercent: -1.68 },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas', marketCap: 320000000000, price: 165.23, change: -0.95, changePercent: -0.57 },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Staples', industry: 'Retail', marketCap: 580000000000, price: 168.54, change: 1.15, changePercent: 0.69 },
  { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare', industry: 'Pharmaceuticals', marketCap: 750000000000, price: 782.15, change: 8.25, changePercent: 1.07 },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Payment Processing', marketCap: 520000000000, price: 289.76, change: 1.85, changePercent: 0.64 },
  
  // ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE', sector: 'ETF', industry: 'Large Cap Blend', price: 512.45, change: 2.15, changePercent: 0.42 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', sector: 'ETF', industry: 'Technology', price: 448.92, change: 1.85, changePercent: 0.41 },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', exchange: 'NYSE', sector: 'ETF', industry: 'Small Cap Blend', price: 218.75, change: 0.95, changePercent: 0.44 },
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', exchange: 'NYSE', sector: 'ETF', industry: 'Foreign Large Blend', price: 78.42, change: -0.25, changePercent: -0.32 },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', sector: 'ETF', industry: 'Large Cap Blend', price: 268.15, change: 1.45, changePercent: 0.54 },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', exchange: 'NASDAQ', sector: 'ETF', industry: 'Long Government', price: 92.35, change: -0.85, changePercent: -0.91 },
  { symbol: 'GLD', name: 'SPDR Gold Shares', exchange: 'NYSE', sector: 'ETF', industry: 'Commodities', price: 198.75, change: 1.25, changePercent: 0.63 },
  { symbol: 'VIX', name: 'CBOE Volatility Index', exchange: 'CBOE', sector: 'Index', industry: 'Volatility', price: 18.45, change: -0.85, changePercent: -4.41 },
  { symbol: 'USO', name: 'United States Oil Fund', exchange: 'NYSE', sector: 'ETF', industry: 'Commodities', price: 68.92, change: -1.25, changePercent: -1.78 },
  { symbol: 'XRT', name: 'SPDR S&P Retail ETF', exchange: 'NYSE', sector: 'ETF', industry: 'Consumer Discretionary', price: 78.45, change: 0.65, changePercent: 0.83 },
  
  // Additional popular stocks
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Entertainment', price: 486.23, change: 3.45, changePercent: 0.71 },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology', industry: 'Software', price: 298.45, change: -1.25, changePercent: -0.42 },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology', industry: 'Software', price: 125.78, change: 0.85, changePercent: 0.68 },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', price: 25.42, change: -0.15, changePercent: -0.59 },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', price: 165.23, change: 2.85, changePercent: 1.76 },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology', industry: 'Software', price: 298.45, change: -1.25, changePercent: -0.42 },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software', price: 578.92, change: 4.25, changePercent: 0.74 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', sector: 'Financial Services', industry: 'Payment Processing', price: 68.45, change: -0.85, changePercent: -1.23 },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', sector: 'Consumer Discretionary', industry: 'Entertainment', price: 112.58, change: 1.45, changePercent: 1.31 },
  { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', exchange: 'NYSE', sector: 'Technology', industry: 'E-commerce', price: 78.92, change: -1.85, changePercent: -2.29 }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TickerService {
  static async searchTickers(params: TickerSearchParams = {}): Promise<TickerSearchResult> {
    await delay(300); // Simulate API delay
    
    const { query = '', exchange, sector, limit = 20, page = 1 } = params;
    
    let filteredTickers = mockTickers;
    
    // Filter by search query
    if (query) {
      const searchQuery = query.toLowerCase();
      filteredTickers = filteredTickers.filter(ticker => 
        ticker.symbol.toLowerCase().includes(searchQuery) ||
        ticker.name.toLowerCase().includes(searchQuery)
      );
    }
    
    // Filter by exchange
    if (exchange && exchange !== 'all') {
      filteredTickers = filteredTickers.filter(ticker => ticker.exchange === exchange);
    }
    
    // Filter by sector
    if (sector && sector !== 'all') {
      filteredTickers = filteredTickers.filter(ticker => ticker.sector === sector);
    }
    
    // Sort by symbol
    filteredTickers.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedTickers = filteredTickers.slice(startIndex, startIndex + limit);
    
    return {
      tickers: paginatedTickers,
      total: filteredTickers.length,
      page,
      limit
    };
  }
  
  static async getTicker(symbol: string): Promise<Ticker | null> {
    await delay(200);
    
    const ticker = mockTickers.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
    return ticker || null;
  }
  
  static async getPopularTickers(): Promise<Ticker[]> {
    await delay(100);
    
    // Return top 10 by market cap
    return mockTickers
      .filter(t => t.marketCap)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 10);
  }
  
  static async getTickersByExchange(exchange: string): Promise<Ticker[]> {
    await delay(200);
    
    return mockTickers.filter(t => t.exchange === exchange);
  }
  
  static async getTickersBySector(sector: string): Promise<Ticker[]> {
    await delay(200);
    
    return mockTickers.filter(t => t.sector === sector);
  }
  
  static getExchanges(): string[] {
    return ['NASDAQ', 'NYSE', 'CBOE'];
  }
  
  static getSectors(): string[] {
    return [
      'Technology',
      'Healthcare', 
      'Financial Services',
      'Consumer Discretionary',
      'Consumer Staples',
      'Energy',
      'ETF',
      'Index'
    ];
  }
}