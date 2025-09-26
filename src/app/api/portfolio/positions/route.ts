import { NextResponse } from "next/server";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function GET() {
  try {
    // Fetch positions from Alpaca
    const positions = await alpacaDataService.getPositions();

    return NextResponse.json({
      success: true,
      data: {
        positions: positions,
      },
    });
  } catch (error) {
    console.error("Positions API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PORTFOLIO_POSITIONS_ERROR",
          message: "Failed to fetch portfolio positions",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
