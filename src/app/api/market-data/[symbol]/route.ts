import { NextRequest, NextResponse } from "next/server";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: symbolParam } = await params;
    const symbol = symbolParam.toUpperCase();

    console.log("Symbol: ", symbol);

    const latestBar = await alpacaDataService.getLatestBar(symbol);

    return NextResponse.json({
      success: true,
      data: latestBar,
    });
  } catch (error) {
    console.error("Market data API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MARKET_DATA_ERROR",
          message: "Failed to fetch market data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
