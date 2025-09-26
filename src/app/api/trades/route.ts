import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { PaginatedResponse } from "@/types/api";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";

// Prisma types for all trades
type PrismaExecutionWithFullRelations = Prisma.executionsGetPayload<{
  include: {
    positions: {
      select: {
        id: true;
        strategy_id: true;
        strategies: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    symbols: {
      select: {
        symbol: true;
        name: true;
      };
    };
  };
}>;

// Business logic interfaces
interface Trade {
  id: string;
  executionId: string;
  symbol: string;
  symbolName?: string;
  side: string;
  quantity: number;
  price: number;
  commission?: number;
  fees?: number;
  totalCost?: number;
  executedAt: string;
  settledAt?: string;
  venue?: string;
  positionId?: string;
  strategyId?: number;
  strategyName?: string;
  pnl?: number;
}

interface TradesSummary {
  totalTrades: number;
  totalVolume: number;
  totalCommission: number;
  totalFees: number;
  avgPrice: number;
  buyTrades: number;
  sellTrades: number;
  uniqueSymbols: number;
  uniqueStrategies: number;
  dateRange: {
    earliest?: string;
    latest?: string;
  };
}

interface TradesResponse {
  trades: Trade[];
  summary: TradesSummary;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Type conversion utilities
function convertDecimalToNumber(decimal: Decimal | null | undefined): number {
  return decimal ? Number(decimal.toString()) : 0;
}

function convertPrismaExecution(execution: PrismaExecutionWithFullRelations): Trade {
  return {
    id: execution.id.toString(),
    executionId: execution.execution_id,
    symbol: execution.symbol,
    symbolName: execution.symbols?.name,
    side: execution.side,
    quantity: convertDecimalToNumber(execution.quantity),
    price: convertDecimalToNumber(execution.price),
    commission: convertDecimalToNumber(execution.commission),
    fees: convertDecimalToNumber(execution.fees),
    totalCost: convertDecimalToNumber(execution.total_cost),
    executedAt: execution.executed_at.toISOString(),
    settledAt: execution.settled_at?.toISOString(),
    venue: execution.venue || undefined,
    positionId: execution.position_id?.toString(),
    strategyId: execution.positions?.strategy_id || undefined,
    strategyName: execution.positions?.strategies?.name,
    // Enhanced P&L calculation
    pnl: (() => {
      const qty = convertDecimalToNumber(execution.quantity);
      const price = convertDecimalToNumber(execution.price);
      const commission = convertDecimalToNumber(execution.commission);
      const fees = convertDecimalToNumber(execution.fees);
      const totalCosts = commission + fees;
      
      if (execution.side.toLowerCase() === 'sell') {
        return (qty * price) - totalCosts;
      } else {
        return -(qty * price) - totalCosts;
      }
    })(),
  };
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<PaginatedResponse<TradesResponse>>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000); // Cap at 1000
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Filters
    const symbol = searchParams.get("symbol");
    const side = searchParams.get("side");
    const strategyId = searchParams.get("strategyId");
    const positionId = searchParams.get("positionId");
    const venue = searchParams.get("venue");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minQuantity = searchParams.get("minQuantity");
    const maxQuantity = searchParams.get("maxQuantity");
    
    // Sorting
    const sortBy = searchParams.get("sortBy") || "executed_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause for executions
    const whereClause: Prisma.executionsWhereInput = {};

    // Apply filters
    if (symbol) {
      whereClause.symbol = {
        contains: symbol,
        mode: 'insensitive',
      };
    }

    if (side) {
      whereClause.side = {
        equals: side,
        mode: 'insensitive',
      };
    }

    if (venue) {
      whereClause.venue = {
        contains: venue,
        mode: 'insensitive',
      };
    }

    if (positionId) {
      whereClause.position_id = BigInt(positionId);
    }

    if (strategyId) {
      whereClause.positions = {
        strategy_id: parseInt(strategyId),
      };
    }

    if (startDate || endDate) {
      whereClause.executed_at = {};
      if (startDate) {
        whereClause.executed_at.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.executed_at.lte = new Date(endDate);
      }
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        whereClause.price.lte = parseFloat(maxPrice);
      }
    }

    if (minQuantity || maxQuantity) {
      whereClause.quantity = {};
      if (minQuantity) {
        whereClause.quantity.gte = parseFloat(minQuantity);
      }
      if (maxQuantity) {
        whereClause.quantity.lte = parseFloat(maxQuantity);
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.executionsOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case 'symbol':
        orderBy.symbol = sortOrder as 'asc' | 'desc';
        break;
      case 'price':
        orderBy.price = sortOrder as 'asc' | 'desc';
        break;
      case 'quantity':
        orderBy.quantity = sortOrder as 'asc' | 'desc';
        break;
      case 'side':
        orderBy.side = sortOrder as 'asc' | 'desc';
        break;
      case 'executed_at':
      default:
        orderBy.executed_at = sortOrder as 'asc' | 'desc';
        break;
    }

    // Fetch executions with pagination and count
    const [executions, totalCount] = await Promise.all([
      prisma.executions.findMany({
        where: whereClause,
        include: {
          positions: {
            select: {
              id: true,
              strategy_id: true,
              strategies: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          symbols: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.executions.count({
        where: whereClause,
      }),
    ]);

    // Convert to business logic format
    const trades: Trade[] = executions.map(convertPrismaExecution);

    // Calculate comprehensive summary statistics
    const allExecutionsForSummary = await prisma.executions.findMany({
      where: whereClause,
      select: {
        quantity: true,
        price: true,
        commission: true,
        fees: true,
        side: true,
        symbol: true,
        executed_at: true,
        positions: {
          select: {
            strategies: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const summary: TradesSummary = {
      totalTrades: totalCount,
      totalVolume: allExecutionsForSummary.reduce(
        (sum, exec) => sum + (convertDecimalToNumber(exec.quantity) * convertDecimalToNumber(exec.price)),
        0
      ),
      totalCommission: allExecutionsForSummary.reduce(
        (sum, exec) => sum + convertDecimalToNumber(exec.commission),
        0
      ),
      totalFees: allExecutionsForSummary.reduce(
        (sum, exec) => sum + convertDecimalToNumber(exec.fees),
        0
      ),
      avgPrice: allExecutionsForSummary.length > 0
        ? allExecutionsForSummary.reduce((sum, exec) => sum + convertDecimalToNumber(exec.price), 0) / allExecutionsForSummary.length
        : 0,
      buyTrades: allExecutionsForSummary.filter(exec => exec.side.toLowerCase() === 'buy').length,
      sellTrades: allExecutionsForSummary.filter(exec => exec.side.toLowerCase() === 'sell').length,
      uniqueSymbols: new Set(allExecutionsForSummary.map(exec => exec.symbol)).size,
      uniqueStrategies: new Set(
        allExecutionsForSummary
          .map(exec => exec.positions?.strategies?.id)
          .filter(id => id !== null && id !== undefined)
      ).size,
      dateRange: {
        earliest: allExecutionsForSummary.length > 0 
          ? new Date(Math.min(...allExecutionsForSummary.map(exec => exec.executed_at.getTime()))).toISOString()
          : undefined,
        latest: allExecutionsForSummary.length > 0
          ? new Date(Math.max(...allExecutionsForSummary.map(exec => exec.executed_at.getTime()))).toISOString()
          : undefined,
      },
    };

    const response: TradesResponse = {
      trades,
      summary,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        items: [response],
        pagination: {
          limit,
          offset,
          total: 1,
          hasMore: false,
        }
      }
    });

  } catch (error) {
    console.error("Trades API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TRADES_ERROR",
          message: "Failed to fetch trades",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}