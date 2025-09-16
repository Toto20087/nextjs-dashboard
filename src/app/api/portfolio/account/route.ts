import { NextRequest, NextResponse } from "next/server";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters for historical data options
    const { searchParams } = new URL(req.url);
    const period =
      (searchParams.get("period") as
        | "1D"
        | "1W"
        | "1M"
        | "3M"
        | "1A"
        | "all") || "1M";
    const timeframe =
      (searchParams.get("timeframe") as
        | "1Min"
        | "5Min"
        | "15Min"
        | "1H"
        | "1D") || "1D";
    const extendedHours = searchParams.get("extendedHours") === "true";

    // Fetch account information first
    const accountData = await alpacaDataService.getAccount();

    // Try to fetch portfolio history, but handle gracefully if it fails (new accounts might not have history)
    let portfolioHistory;
    try {
      portfolioHistory = await alpacaDataService.getPortfolioHistory({
        period,
        timeframe,
        extendedHours,
      });
    } catch (error) {
      portfolioHistory = {
        timestamp: [],
        equity: [],
        profitLoss: [],
        profitLossPercent: [],
        baseValue: parseFloat(accountData.portfolioValue) || 0,
        timeframe: timeframe,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        accountValue: parseFloat(accountData.portfolioValue),
        buyingPower: parseFloat(accountData.buyingPower),
        cash: parseFloat(accountData.cash),
        portfolioValue: parseFloat(accountData.portfolioValue),
        dayTradeCount: accountData.dayTradeCount,
        equity: parseFloat(accountData.equity),
        lastEquity: parseFloat(accountData.lastEquity),
        historicalData: {
          timestamp: portfolioHistory.timestamp,
          equity: portfolioHistory.equity,
          profitLoss: portfolioHistory.profitLoss,
          profitLossPercent: portfolioHistory.profitLossPercent,
          baseValue: portfolioHistory.baseValue,
          timeframe: portfolioHistory.timeframe,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ACCOUNT_INFO_ERROR",
          message: "Failed to fetch account information",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
