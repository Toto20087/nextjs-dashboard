import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { alpacaDataService } from "@/lib/alpaca/client";

export async function GET(req: NextRequest) {
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

    // Generate recent allocation changes
    const recentAllocations = generateRecentAllocations(allSnapshots);

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

    const snapshots = timeSeriesSnapshots.map((snapshot) => ({
      date: snapshot.created_at.toISOString(),
      strategyName: snapshot.strategies?.name || "Unknown",
      totalCapital: Number(snapshot.allocated_capital),
      usedCapital: Number(snapshot.used_capital),
      realizedPnl: Number(snapshot.realized_pnl),
      unrealizedPnl: Number(snapshot.unrealized_pnl),
    }));

    return NextResponse.json({
      success: true,
      data: {
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
          activeStrategies: strategies.filter((s) => s.status === "active")
            .length,
          totalStrategies: strategies.length,
          utilizationRate:
            totals.allocated > 0
              ? (totals.deployed / totals.allocated) * 100
              : 0,
          accountUtilization:
            totals.totalCapital > 0
              ? (totals.allocated / totals.totalCapital) * 100
              : 0,
        },
      },
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
  allocations: any[],
  snapshots: any[],
  positionCounts: any[]
) {
  // Group allocations by strategy
  const strategyGroups: { [strategyId: number]: any[] } = {};

  allocations.forEach((allocation) => {
    const strategyId = allocation.strategy_id;
    if (!strategyGroups[strategyId]) {
      strategyGroups[strategyId] = [];
    }
    strategyGroups[strategyId].push(allocation);
  });

  // Process each strategy
  return Object.entries(strategyGroups)
    .map(([strategyIdStr, strategyAllocations]) => {
      const strategyId = parseInt(strategyIdStr);
      const strategy = strategyAllocations[0]?.strategies;

      if (!strategy) return null;

      // Calculate totals for this strategy
      const allocated = strategyAllocations.reduce(
        (sum, alloc) => sum + Number(alloc.allocated_capital),
        0
      );
      const deployed = strategyAllocations.reduce(
        (sum, alloc) => sum + Number(alloc.used_capital || 0),
        0
      );
      const available = allocated - deployed;

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
        deployed,
        available,
        performance: `${performance >= 0 ? "+" : ""}${performance.toFixed(1)}%`,
        managed_by: strategy.processed_by_rust ? "rust" : "n8n",
        positions,
        status: strategy.is_active ? "active" : "inactive",
        utilizationRate: allocated > 0 ? (deployed / allocated) * 100 : 0,
      };
    })
    .filter(Boolean);
}

function calculateStrategyPerformance(snapshots: any[]): number {
  if (snapshots.length < 2) return 0;

  // Sort by date to get oldest and newest
  const sortedSnapshots = snapshots.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const oldest = sortedSnapshots[0];
  const newest = sortedSnapshots[sortedSnapshots.length - 1];

  // Use allocated_capital instead of total_capital (which doesn't exist)
  const oldValue = Number(oldest.allocated_capital || 0);
  const newValue =
    Number(newest.allocated_capital || 0) +
    Number(newest.realized_pnl || 0) +
    Number(newest.unrealized_pnl || 0);

  // Prevent division by zero
  if (oldValue === 0 || isNaN(oldValue) || isNaN(newValue)) return 0;

  const performance = ((newValue - oldValue) / oldValue) * 100;
  
  // Return 0 if result is NaN or Infinity
  return isFinite(performance) ? performance : 0;
}

async function calculateTotals(strategies: any[]) {
  const totals = strategies.reduce(
    (acc, strategy) => ({
      allocated: acc.allocated + (strategy?.allocated || 0),
      deployed: acc.deployed + (strategy?.deployed || 0),
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

function generateRecentAllocations(snapshots: any[]): any[] {
  const recentChanges: any[] = [];

  // Group snapshots by strategy to detect allocation changes
  const strategySnapshots: { [strategyName: string]: any[] } = {};

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
    snapshots.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 0; i < Math.min(snapshots.length - 1, 4); i++) {
      const current = snapshots[i];
      const previous = snapshots[i + 1];

      // Use allocated_capital instead of total_capital
      const currentCapital = Number(current.allocated_capital || 0);
      const previousCapital = Number(previous.allocated_capital || 0);
      const change = currentCapital - previousCapital;

      // Only include significant changes (> $1000)
      if (Math.abs(change) > 1000) {
        recentChanges.push({
          strategy: strategyName,
          amount: change,
          type: change > 0 ? "increase" : "decrease",
          time: getTimeAgo(current.created_at),
          timestamp: current.created_at,
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
