import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Count active strategies
    const activeStrategiesCount = await prisma.strategies.count({
      where: {
        is_active: true,
      },
    });

    // Get basic info about active strategies
    const activeStrategies = await prisma.strategies.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        processed_by_rust: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        count: activeStrategiesCount,
        strategies: activeStrategies,
      },
    });
  } catch (error) {
    console.error("Active strategies API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ACTIVE_STRATEGIES_ERROR",
          message: "Failed to fetch active strategies",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
