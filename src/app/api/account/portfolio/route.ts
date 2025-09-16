import { NextRequest, NextResponse } from "next/server";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1M";

    // Validate period
    const validPeriods = ["1D", "7D", "1M", "3M", "1Y", "all"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(", ")}` },
        { status: 400 }
      );
    }

    // Get portfolio history from Alpaca
    const portfolioHistory = await alpacaDataService.getPortfolioHistory({
      period: period as "1D" | "1M" | "3M" | "all" | "1W" | "1A",
      timeframe: "1D",
      extendedHours: false,
    });

    // Transform to market-mosaic format: simple array of {date, portfolio, market}
    const transformedData = portfolioHistory.timestamp.map(
      (ts: number, index: number) => ({
        date: new Date(ts * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        portfolio: portfolioHistory.equity[index],
      })
    );

    return NextResponse.json({
      data: transformedData,
      success: true,
      timestamp: new Date().toISOString(),
      parameters: {
        period,
      },
    });
  } catch (error) {
    console.error("Portfolio history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
