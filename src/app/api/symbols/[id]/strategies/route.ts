import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const resolvedParams = await params;
    const symbolId = parseInt(resolvedParams.id);
    
    // Query parameters for filtering
    const isActive = searchParams.get("is_active");
    const processedByRust = searchParams.get("processed_by_rust");

    if (!symbolId || isNaN(symbolId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SYMBOL_ID",
            message: "Invalid symbol ID provided",
          },
        },
        { status: 400 }
      );
    }

    // Build where clause for strategy filtering
    const strategyWhereClause: any = {};
    
    if (isActive !== null) {
      strategyWhereClause.is_active = isActive === "true";
    }
    
    if (processedByRust !== null) {
      strategyWhereClause.processed_by_rust = processedByRust === "true";
    }

    // Fetch strategies associated with this symbol through strategy_allocations
    const strategiesWithAllocations = await prisma.strategy_allocations.findMany({
      where: {
        symbol_id: symbolId,
        is_active: true,
        strategies: strategyWhereClause,
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
            processed_by_rust: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    // Extract unique strategies and include allocation info
    const strategies = strategiesWithAllocations.map((allocation) => ({
      id: allocation.strategies.id,
      name: allocation.strategies.name,
      processed_by_rust: allocation.strategies.processed_by_rust,
      is_active: allocation.strategies.is_active,
      created_at: allocation.strategies.created_at,
      updated_at: allocation.strategies.updated_at,
      allocation: {
        id: allocation.id,
        allocated_capital: allocation.allocated_capital,
        used_capital: allocation.used_capital,
        available_capital: allocation.available_capital,
        current_position: allocation.current_position,
        realized_pnl: allocation.realized_pnl,
        unrealized_pnl: allocation.unrealized_pnl,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        strategies,
        symbol_id: symbolId,
        total: strategies.length,
      },
    });
  } catch (error) {
    console.error("Symbol strategies API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYMBOL_STRATEGIES_ERROR",
          message: "Failed to fetch symbol strategies",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}