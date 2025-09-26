import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { alpacaDataService } from "@/lib/alpaca/client";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types/api";

// Prisma database result types
type PrismaStrategyAllocation = Prisma.strategy_allocationsGetPayload<{
  include: {
    strategies: {
      select: {
        id: true;
        name: true;
        processed_by_rust: true;
        is_active: true;
      };
    };
    symbols: {
      select: {
        symbol: true;
        name: true;
        last_price: true;
      };
    };
  };
}>;

type PrismaCapitalSnapshot = Prisma.strategy_capital_snapshotsGetPayload<{
  include: {
    strategies: {
      select: {
        id: true;
        name: true;
        processed_by_rust: true;
      };
    };
  };
}>;

type PrismaPositionCount = {
  strategy_id: number | null;
  _count: {
    id: number;
  };
};

// Business logic interfaces
interface ProcessedStrategy {
  id: number;
  name: string;
  allocated: number;
  used: number;
  available: number;
  performance: string;
  managed_by: string;
  positions: number;
  status: string;
  utilizationRate: number;
}

interface CapitalTotals {
  totalCapital: number;
  accountCash: number;
  portfolioValue: number;
  buyingPower: number;
  allocated: number;
  deployed: number;
  available: number;
  unallocated: number;
}

interface RecentAllocation {
  strategy: string;
  amount: number;
  type: "increase" | "decrease";
  time: string;
  timestamp: Date;
}

interface TimeSeriesPoint {
  date: string;
  strategyName: string;
  totalCapital: number;
  usedCapital: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

interface CapitalSummary {
  activeStrategies: number;
  totalStrategies: number;
  utilizationRate: number;
  accountUtilization: number;
}

interface CapitalOverviewResponse {
  totalCapital: number;
  accountCash: number;
  portfolioValue: number;
  buyingPower: number;
  allocatedCapital: number;
  deployedCapital: number;
  availableCapital: number;
  unallocatedCapital: number;
  strategies: ProcessedStrategy[];
  recentAllocations: RecentAllocation[];
  snapshots: TimeSeriesPoint[];
  summary: CapitalSummary;
}

// Type conversion utilities
function convertDecimalToNumber(decimal: Decimal | null | undefined): number {
  return decimal ? Number(decimal.toString()) : 0;
}

export async function GET(): Promise<
  NextResponse<ApiResponse<CapitalOverviewResponse>>
> {
  try {
    // Fetch strategy allocations with related data
    const strategyAllocations = await prisma.strategy_allocations.findMany({
      where: {
        is_active: true,
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
            processed_by_rust: true,
            is_active: true,
          },
        },
        symbols: {
          select: {
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
    });

    // Get recent capital snapshots for performance calculation
    const recentSnapshots = await prisma.strategy_capital_snapshots.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
            processed_by_rust: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Get active positions count per strategy
    const positionCounts = await prisma.positions.groupBy({
      by: ["strategy_id"],
      where: {
        is_active: true,
        quantity: {
          not: 0,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get recent allocation changes from strategy_capital_snapshots
    const allSnapshots = await prisma.strategy_capital_snapshots.findMany({
      take: 50,
      include: {
        strategies: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Process strategy data
    const strategies = processStrategiesData(
      strategyAllocations,
      recentSnapshots,
      positionCounts
    );

    // Calculate totals - this will throw an error if total capital pool is not configured
    const totals = await calculateTotals(strategies);

    // Generate recent allocation changes (cast to the compatible type)
    const recentAllocations = generateRecentAllocations(
      allSnapshots as PrismaCapitalSnapshot[]
    );

    // Get latest snapshots for time series
    const timeSeriesSnapshots =
      await prisma.strategy_capital_snapshots.findMany({
        take: 30,
        orderBy: {
          created_at: "desc",
        },
        include: {
          strategies: {
            select: {
              name: true,
            },
          },
        },
      });

    const snapshots: TimeSeriesPoint[] = timeSeriesSnapshots.map(
      (snapshot) => ({
        date: snapshot.created_at?.toISOString() || "",
        strategyName: snapshot.strategies?.name || "Unknown",
        totalCapital: convertDecimalToNumber(snapshot.allocated_capital),
        usedCapital: convertDecimalToNumber(snapshot.used_capital),
        realizedPnl: convertDecimalToNumber(snapshot.realized_pnl),
        unrealizedPnl: convertDecimalToNumber(snapshot.unrealized_pnl),
      })
    );

    const response: CapitalOverviewResponse = {
      // Real Alpaca account data
      totalCapital: totals.totalCapital,
      accountCash: totals.accountCash,
      portfolioValue: totals.portfolioValue,
      buyingPower: totals.buyingPower,
      // Strategy allocation data from database
      allocatedCapital: totals.allocated,
      deployedCapital: totals.deployed,
      availableCapital: totals.available,
      unallocatedCapital: totals.unallocated,
      strategies,
      recentAllocations,
      snapshots,
      summary: {
        activeStrategies: strategies.filter((s) => s?.status === "active")
          .length,
        totalStrategies: strategies.length,
        utilizationRate:
          totals.allocated > 0 ? (totals.deployed / totals.allocated) * 100 : 0,
        accountUtilization:
          totals.totalCapital > 0
            ? (totals.allocated / totals.totalCapital) * 100
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Capital overview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CAPITAL_OVERVIEW_ERROR",
          message: "Failed to fetch capital overview",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

function processStrategiesData(
  allocations: PrismaStrategyAllocation[],
  snapshots: PrismaCapitalSnapshot[],
  positionCounts: PrismaPositionCount[]
): ProcessedStrategy[] {
  // Group allocations by strategy
  const strategyGroups: Record<number, PrismaStrategyAllocation[]> = {};

  allocations.forEach((allocation) => {
    const strategyId = allocation.strategy_id;
    if (!strategyGroups[strategyId]) {
      strategyGroups[strategyId] = [];
    }
    strategyGroups[strategyId].push(allocation);
  });

  // Process each strategy
  const results = Object.entries(strategyGroups)
    .map(([strategyIdStr, strategyAllocations]) => {
      const strategyId = parseInt(strategyIdStr);
      const strategy = strategyAllocations[0]?.strategies;

      if (!strategy) return null;

      // Calculate totals for this strategy
      const allocated = strategyAllocations.reduce(
        (sum, alloc) => sum + convertDecimalToNumber(alloc.allocated_capital),
        0
      );
      const used = strategyAllocations.reduce(
        (sum, alloc) => sum + convertDecimalToNumber(alloc.used_capital),
        0
      );
      const available = allocated - used;

      // Get position count
      const positionData = positionCounts.find(
        (pc) => pc.strategy_id === strategyId
      );
      const positions = positionData?._count.id || 0;

      // Calculate performance from recent snapshots
      const strategySnapshots = snapshots.filter(
        (s) => s.strategy_id === strategyId
      );
      const performance = calculateStrategyPerformance(strategySnapshots);

      return {
        id: strategy.id,
        name: strategy.name,
        allocated,
        used,
        available,
        performance: `${performance >= 0 ? "+" : ""}${performance.toFixed(1)}%`,
        managed_by: strategy.processed_by_rust ? "rust" : "n8n",
        positions,
        status: strategy.is_active ? "active" : "inactive",
        utilizationRate: allocated > 0 ? (used / allocated) * 100 : 0,
      };
    })
    .filter((strategy): strategy is ProcessedStrategy => strategy !== null);

  return results;
}

function calculateStrategyPerformance(
  snapshots: PrismaCapitalSnapshot[]
): number {
  if (snapshots.length < 2) return 0;

  // Sort by date to get oldest and newest
  const sortedSnapshots = snapshots.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });

  const oldest = sortedSnapshots[0];
  const newest = sortedSnapshots[sortedSnapshots.length - 1];

  // Use allocated_capital instead of total_capital (which doesn't exist)
  const oldValue = convertDecimalToNumber(oldest.allocated_capital);
  const newValue =
    convertDecimalToNumber(newest.allocated_capital) +
    convertDecimalToNumber(newest.realized_pnl) +
    convertDecimalToNumber(newest.unrealized_pnl);

  // Prevent division by zero
  if (oldValue === 0 || isNaN(oldValue) || isNaN(newValue)) return 0;

  const performance = ((newValue - oldValue) / oldValue) * 100;

  // Return 0 if result is NaN or Infinity
  return isFinite(performance) ? performance : 0;
}

async function calculateTotals(
  strategies: ProcessedStrategy[]
): Promise<CapitalTotals> {
  const totals = strategies.reduce(
    (acc, strategy) => ({
      allocated: acc.allocated + (strategy?.allocated || 0),
      deployed: acc.deployed + (strategy?.used || 0),
      available: acc.available + (strategy?.available || 0),
    }),
    { allocated: 0, deployed: 0, available: 0 }
  );

  // Get real account balance from Alpaca API
  const alpacaAccount = await alpacaDataService.getAccount();
  const totalCapitalPool =
    parseFloat(alpacaAccount.cash) + parseFloat(alpacaAccount.portfolioValue);

  return {
    totalCapital: totalCapitalPool,
    accountCash: parseFloat(alpacaAccount.cash),
    portfolioValue: parseFloat(alpacaAccount.portfolioValue),
    buyingPower: parseFloat(alpacaAccount.buyingPower),
    ...totals,
    unallocated: totalCapitalPool - totals.allocated,
  };
}

function generateRecentAllocations(
  snapshots: PrismaCapitalSnapshot[]
): RecentAllocation[] {
  const recentChanges: RecentAllocation[] = [];

  // Group snapshots by strategy to detect allocation changes
  const strategySnapshots: Record<string, PrismaCapitalSnapshot[]> = {};

  snapshots.forEach((snapshot) => {
    const strategyName = snapshot.strategies?.name || "Unknown";
    if (!strategySnapshots[strategyName]) {
      strategySnapshots[strategyName] = [];
    }
    strategySnapshots[strategyName].push(snapshot);
  });

  // Analyze changes for each strategy
  Object.entries(strategySnapshots).forEach(([strategyName, snapshots]) => {
    if (snapshots.length < 2) return;

    // Sort by date
    snapshots.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    for (let i = 0; i < Math.min(snapshots.length - 1, 4); i++) {
      const current = snapshots[i];
      const previous = snapshots[i + 1];

      // Use allocated_capital instead of total_capital
      const currentCapital = convertDecimalToNumber(current.allocated_capital);
      const previousCapital = convertDecimalToNumber(
        previous.allocated_capital
      );
      const change = currentCapital - previousCapital;

      // Only include significant changes (> $1000)
      if (Math.abs(change) > 1000) {
        recentChanges.push({
          strategy: strategyName,
          amount: change,
          type: change > 0 ? "increase" : "decrease",
          time: getTimeAgo(current.created_at || new Date()),
          timestamp: current.created_at || new Date(),
        });
      }
    }
  });

  // Sort by timestamp and return latest 8
  return recentChanges
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - new Date(date).getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}
