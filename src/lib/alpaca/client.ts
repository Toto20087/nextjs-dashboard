import AlpacaApi from "@alpacahq/alpaca-trade-api";

/**
 * Alpaca Market Data Service
 *
 * This service handles all interactions with the Alpaca API for:
 * - Real-time market data
 * - Historical market data
 * - Account information
 * - Portfolio data
 *
 * Note: This is READ-ONLY for market data and account info, no trading operations
 */

interface AlpacaQuote {
  symbol: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
}

interface AlpacaBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
  vwap: number;
}

interface AlpacaAccount {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  buyingPower: string;
  cash: string;
  portfolioValue: string;
  equity: string;
  lastEquity: string;
  multiplier: string;
  dayTradeCount: number;
  dayTradingBuyingPower: string;
  regtBuyingPower: string;
}

interface AlpacaPosition {
  symbol: string;
  qty: string;
  marketValue: string;
  costBasis: string;
  unrealizedPl: string;
  unrealizedPlpc: string;
  currentPrice: string;
  lastdayPrice: string;
  changeToday: string;
}

interface AlpacaPortfolioHistory {
  timestamp: number[];
  equity: number[];
  profitLoss: number[];
  profitLossPercent: number[];
  baseValue: number;
  timeframe: string;
}

export class AlpacaDataService {
  private client!: AlpacaApi;
  private isInitialized = false;

  constructor() {
    if (process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    try {
      if (
        !process.env.ALPACA_API_KEY ||
        !process.env.ALPACA_API_SECRET ||
        process.env.ALPACA_API_KEY.trim() === "" ||
        process.env.ALPACA_API_SECRET.trim() === ""
      ) {
        throw new Error("Alpaca API credentials are not configured");
      }

      this.client = new AlpacaApi({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_API_SECRET,
        paper:
          process.env.ALPACA_PAPER === "true" ||
          process.env.NODE_ENV !== "production",
      });

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  private ensureInitialized() {
    // Force re-initialization to ensure we have proper credentials
    this.isInitialized = false;
    this.initializeClient();

    if (!this.isInitialized) {
      throw new Error("Alpaca client is not properly initialized");
    }
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<AlpacaQuote> {
    this.ensureInitialized();

    try {
      const quote = await this.client.getLatestQuote(symbol);

      return {
        symbol,
        bid: quote.BidPrice || 0,
        ask: quote.AskPrice || 0,
        bidSize: quote.BidSize || 0,
        askSize: quote.AskSize || 0,
        timestamp: quote.Timestamp || new Date().toISOString(),
      };
    } catch (error) {
      throw new AlpacaError(`Failed to fetch quote for ${symbol}`, error);
    }
  }

  /**
   * Get real-time market data (latest trade)
   */
  async getLatestTrade(symbol: string) {
    this.ensureInitialized();

    try {
      const trade = await this.client.getLatestTrade(symbol);

      return {
        symbol,
        price: trade.Price || 0,
        size: trade.Size || 0,
        timestamp: trade.Timestamp || new Date().toISOString(),
        conditions: trade.Conditions || [],
      };
    } catch (error) {
      throw new AlpacaError(
        `Failed to fetch latest trade for ${symbol}`,
        error
      );
    }
  }

  /**
   * Get latest bar for a symbol
   */
  async getLatestBar(symbol: string): Promise<AlpacaBar> {
    this.ensureInitialized();

    try {
      const bar = await this.client.getLatestBar(symbol);

      return {
        timestamp: bar.Timestamp || new Date().toISOString(),
        open: bar.OpenPrice || 0,
        high: bar.HighPrice || 0,
        low: bar.LowPrice || 0,
        close: bar.ClosePrice || 0,
        volume: bar.Volume || 0,
        tradeCount: bar.TradeCount || 0,
        vwap: bar.VWAP || 0,
      };
    } catch (error) {
      throw new AlpacaError(`Failed to fetch latest bar for ${symbol}`, error);
    }
  }

  /**
   * Get historical bars for a symbol
   */
  async getHistoricalBars(
    symbol: string,
    options: {
      timeframe?: "1Min" | "5Min" | "15Min" | "30Min" | "1Hour" | "1Day";
      start?: string;
      end?: string;
      limit?: number;
      adjustment?: "raw" | "split" | "dividend" | "all";
    } = {}
  ): Promise<AlpacaBar[]> {
    this.ensureInitialized();

    try {
      const {
        timeframe = "1Day",
        start,
        end,
        limit = 100,
        adjustment = "split",
      } = options;

      const bars = await this.client.getBarsV2(symbol, {
        timeframe,
        start,
        end,
        limit,
        adjustment,
      });

      const result = (await Array.fromAsync(bars)).map((bar) => ({
        timestamp: bar.Timestamp,
        open: bar.OpenPrice || 0,
        high: bar.HighPrice || 0,
        low: bar.LowPrice || 0,
        close: bar.ClosePrice || 0,
        volume: bar.Volume || 0,
        tradeCount: bar.TradeCount || 0,
        vwap: bar.VWAP || 0,
      }));

      return result;
    } catch (error) {
      throw new AlpacaError(
        `Failed to fetch historical bars for ${symbol}`,
        error
      );
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    this.ensureInitialized();

    try {
      const account = await this.client.getAccount();

      return {
        id: account.id,
        accountNumber: account.account_number,
        status: account.status,
        currency: account.currency,
        buyingPower: account.buying_power,
        cash: account.cash,
        portfolioValue: account.portfolio_value,
        equity: account.equity,
        lastEquity: account.last_equity,
        multiplier: account.multiplier,
        dayTradeCount: account.daytrade_count,
        dayTradingBuyingPower: account.daytrading_buying_power,
        regtBuyingPower: account.regt_buying_power,
      };
    } catch (error) {
      throw new AlpacaError("Failed to fetch account information", error);
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    this.ensureInitialized();

    try {
      const positions = await this.client.getPositions();

      return positions.map((position: any) => ({
        symbol: position.symbol,
        qty: position.qty,
        marketValue: position.market_value,
        costBasis: position.cost_basis,
        unrealizedPl: position.unrealized_pl,
        unrealizedPlpc: position.unrealized_plpc,
        currentPrice: position.current_price,
        lastdayPrice: position.lastday_price,
        changeToday: position.change_today,
      }));
    } catch (error) {
      throw new AlpacaError("Failed to fetch positions", error);
    }
  }

  /**
   * Get portfolio history
   */
  async getPortfolioHistory(
    options: {
      period?: "1D" | "1W" | "1M" | "3M" | "1A" | "all";
      timeframe?: "1Min" | "5Min" | "15Min" | "1H" | "1D";
      extendedHours?: boolean;
    } = {}
  ): Promise<AlpacaPortfolioHistory> {
    this.ensureInitialized();

    try {
      const {
        period = "1M",
        timeframe = "1D",
      } = options;

      const history = await this.client.getPortfolioHistory({
        period,
        timeframe,
        date_start: undefined,
        date_end: undefined,
        extended_hours: false
      });

      return {
        timestamp: history.timestamp || [],
        equity: history.equity || [],
        profitLoss: history.profit_loss || [],
        profitLossPercent: history.profit_loss_pct || [],
        baseValue: history.base_value || 0,
        timeframe: history.timeframe || timeframe,
      };
    } catch (error) {
      throw new AlpacaError("Failed to fetch portfolio history", error);
    }
  }

  /**
   * Get portfolio performance vs benchmark (e.g., SPY)
   */
  async getPortfolioVsBenchmark(benchmarkSymbol = "SPY") {
    this.ensureInitialized();

    try {
      const [portfolioHistory, benchmarkBars] = await Promise.all([
        this.getPortfolioHistory({ period: "all", timeframe: "1D" }),
        this.getHistoricalBars(benchmarkSymbol, {
          timeframe: "1Day",
          limit: 1000,
        }),
      ]);

      // Align data by matching timestamps
      const alignedData = portfolioHistory.timestamp
        .map((timestamp, index) => {
          const portfolioValue = portfolioHistory.equity[index];
          const portfolioReturn = portfolioHistory.profitLossPercent[index];

          // Find closest benchmark data point
          const benchmarkBar = benchmarkBars.find((bar) => {
            const barDate = new Date(bar.timestamp).getTime();
            const portfolioDate = timestamp * 1000;
            return Math.abs(barDate - portfolioDate) < 24 * 60 * 60 * 1000; // Within 24 hours
          });

          return {
            date: new Date(timestamp * 1000).toISOString(),
            portfolioValue,
            portfolioReturn,
            benchmarkPrice: benchmarkBar?.close || null,
          };
        })
        .filter((item) => item.benchmarkPrice !== null);

      // Calculate benchmark returns from the first data point
      const baselineBenchmarkPrice = alignedData[0]?.benchmarkPrice || 1;
      const enrichedData = alignedData.map((item) => ({
        ...item,
        benchmarkReturn:
          ((item.benchmarkPrice! - baselineBenchmarkPrice) /
            baselineBenchmarkPrice) *
          100,
      }));

      return {
        data: enrichedData,
        summary: {
          portfolioReturn:
            portfolioHistory.profitLossPercent[
              portfolioHistory.profitLossPercent.length - 1
            ] || 0,
          benchmarkReturn:
            enrichedData.length > 0
              ? enrichedData[enrichedData.length - 1].benchmarkReturn
              : 0,
          outperformance:
            enrichedData.length > 0
              ? (enrichedData[enrichedData.length - 1].portfolioReturn || 0) -
                enrichedData[enrichedData.length - 1].benchmarkReturn
              : 0,
        },
      };
    } catch (error) {
      throw new AlpacaError(
        "Failed to fetch portfolio vs benchmark data",
        error
      );
    }
  }

  /**
   * Check if markets are open
   */
  async isMarketOpen(): Promise<boolean> {
    this.ensureInitialized();

    try {
      const clock = await this.client.getClock();
      return clock.is_open;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get market calendar
   */
  async getMarketCalendar(start?: string, end?: string) {
    this.ensureInitialized();

    try {
      return await this.client.getCalendar({ start, end });
    } catch (error) {
      throw new AlpacaError("Failed to fetch market calendar", error);
    }
  }

  /**
   * Test connection to Alpaca API
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    if (!this.isInitialized) {
      return { success: false, message: "Client not initialized" };
    }

    try {
      const start = Date.now();
      await this.client.getClock();
      const latency = Date.now() - start;

      return { success: true, message: "Connected successfully", latency };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}

/**
 * Custom error class for Alpaca-related errors
 */
export class AlpacaError extends Error {
  constructor(message: string, originalError?: any) {
    super(message);
    this.name = "AlpacaError";

    if (originalError) {
      this.cause = originalError;
      console.error("Alpaca Error Details:", originalError);
    }
  }
}

// Export singleton instance
export const alpacaDataService = new AlpacaDataService();
