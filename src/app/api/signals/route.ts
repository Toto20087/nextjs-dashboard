import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Filter parameters
    const strategyId = searchParams.get("strategy_id");
    const side = searchParams.get("side");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause for filtering
    const whereClause: any = {};

    if (strategyId) {
      whereClause.strategy_id = parseInt(strategyId);
    }

    if (side && ["buy", "sell"].includes(side.toLowerCase())) {
      whereClause.signal_type = side.toLowerCase();
    }

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.created_at.lte = new Date(endDate);
      }
    }

    // Fetch signals with pagination and filtering
    const [signals, totalCount] = await Promise.all([
      prisma.signals.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.signals.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        signals,
        pagination: {
          page,
          limit,
          offset,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Signals API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIGNALS_ERROR",
          message: "Failed to fetch signals",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
