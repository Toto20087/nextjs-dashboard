import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const strategyId = searchParams.get("strategyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "30d"; // 30d, 90d, 1y, all

    // Calculate date range based on period
    const now = new Date();
    let dateFilter: { gte?: Date; lte?: Date } = {};

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      switch (period) {
        case "30d":
          dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          dateFilter.gte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          dateFilter.gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          // No date filter for 'all'
          break;
      }
    }

    // Build where clause for date filtering
    const whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
      whereClause.executed_at = dateFilter;
    }

    // If filtering by strategy, we need to get position IDs first
    if (strategyId) {
      const positions = await prisma.positions.findMany({
        where: {
          strategy_id: parseInt(strategyId),
        },
        select: {
          id: true,
        },
      });

      const positionIds = positions.map((p) => p.id);
      if (positionIds.length > 0) {
        whereClause.position_id = {
          in: positionIds,
        };
      } else {
        // No positions found for this strategy, return empty result
        whereClause.position_id = -1; // This will return no results
      }
    }

    // Fetch historical executions (trades) - try with positions first
    let executions;
    try {
      executions = await prisma.executions.findMany({
        where: whereClause,
        include: {
          positions: {
            select: {
              id: true,
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
        orderBy: {
          executed_at: "asc",
        },
      });
    } catch (error) {
      // If positions include fails, fall back to fetching without it and join client-side
      console.log("Falling back to client-side join for positions");

      executions = await prisma.executions.findMany({
        where: whereClause,
        include: {
          symbols: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
        orderBy: {
          executed_at: "asc",
        },
      });

      // Fetch positions with strategies separately
      const executionPositionIds = executions
        .map((exec) => exec.position_id)
        .filter(Boolean) as bigint[];

      const positionsWithStrategies =
        executionPositionIds.length > 0
          ? await prisma.positions.findMany({
              where: {
                id: {
                  in: executionPositionIds,
                },
              },
              include: {
                strategies: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            })
          : [];

      // Create a map for quick lookup
      const positionStrategyMap = new Map();
      positionsWithStrategies.forEach((position) => {
        positionStrategyMap.set(position.id.toString(), position.strategies);
      });

      // Enrich executions with strategy data
      executions = executions.map((exec) => ({
        ...exec,
        positions: exec.position_id
          ? {
              id: exec.position_id,
              strategies: positionStrategyMap.get(exec.position_id.toString()),
            }
          : null,
      }));
    }

    // Fetch portfolio snapshots for equity curve
    const snapshots = await prisma.strategy_capital_snapshots.findMany({
      where: {
        ...(strategyId && { strategy_id: parseInt(strategyId) }),
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(executions);

    // Generate time series data from snapshots
    const timeSeriesData = snapshots.map((snapshot) => ({
      date: snapshot.created_at.toISOString().split("T")[0],
      portfolioValue: Number(snapshot.allocated_capital),
      totalCapital: Number(snapshot.allocated_capital),
      usedCapital: Number(snapshot.used_capital),
      pnl: Number(snapshot.realized_pnl) + Number(snapshot.unrealized_pnl),
      realizedPnl: Number(snapshot.realized_pnl),
      unrealizedPnl: Number(snapshot.unrealized_pnl),
    }));

    // Calculate strategy breakdown
    const strategyBreakdown = calculateStrategyBreakdown(executions);

    // Calculate regime performance from actual database data
    const regimePerformance = await calculateRegimePerformance(
      executions,
      strategyId ? parseInt(strategyId) : undefined,
      dateFilter
    );

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        timeSeriesData,
        strategyBreakdown,
        regimePerformance,
        totalExecutions: executions.length,
        dateRange: {
          start: dateFilter.gte?.toISOString() || null,
          end: dateFilter.lte?.toISOString() || now.toISOString(),
          period,
        },
      },
    });
  } catch (error) {
    console.error("Performance analytics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PERFORMANCE_ANALYTICS_ERROR",
          message: "Failed to fetch performance analytics",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

function calculatePerformanceMetrics(executions: any[]) {
  if (executions.length === 0) {
    return {
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
    };
  }

  // Calculate PnL for each execution
  const pnlValues = executions.map((exec) => {
    const quantity = Number(exec.quantity);
    const price = Number(exec.price);
    const side = exec.side;

    // Simple PnL calculation (would need more sophisticated logic for real trading)
    const pnl =
      side === "buy" ? -Math.abs(quantity * price) : Math.abs(quantity * price);
    return pnl;
  });

  const totalPnl = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
  const wins = pnlValues.filter((pnl) => pnl > 0);
  const losses = pnlValues.filter((pnl) => pnl < 0);

  const winRate =
    pnlValues.length > 0 ? (wins.length / pnlValues.length) * 100 : 0;
  const averageWin =
    wins.length > 0 ? wins.reduce((sum, win) => sum + win, 0) / wins.length : 0;
  const averageLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / losses.length)
      : 0;
  const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

  // Calculate cumulative returns for drawdown
  const cumulativeReturns = [0];
  let runningSum = 0;
  for (const pnl of pnlValues) {
    runningSum += pnl;
    cumulativeReturns.push(runningSum);
  }

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];
  for (const value of cumulativeReturns) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / Math.abs(peak)) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calculate Sharpe ratio (simplified - would need risk-free rate and proper returns)
  const returns = pnlValues;
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  return {
    totalReturn: totalPnl,
    sharpeRatio: Number(sharpeRatio.toFixed(3)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    averageWin: Number(averageWin.toFixed(2)),
    averageLoss: Number(averageLoss.toFixed(2)),
    totalTrades: executions.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
  };
}

function calculateStrategyBreakdown(executions: any[]) {
  const strategyGroups: { [key: string]: any[] } = {};

  // Group executions by strategy
  executions.forEach((exec) => {
    const strategyName = exec.positions?.strategies?.name || "Unknown Strategy";
    if (!strategyGroups[strategyName]) {
      strategyGroups[strategyName] = [];
    }
    strategyGroups[strategyName].push(exec);
  });

  // Calculate metrics for each strategy
  return Object.entries(strategyGroups).map(([strategyName, strategyExecs]) => {
    const metrics = calculatePerformanceMetrics(strategyExecs);
    return {
      strategy: strategyName,
      executions: strategyExecs.length,
      totalReturn: metrics.totalReturn,
      winRate: metrics.winRate,
      sharpeRatio: metrics.sharpeRatio,
      maxDrawdown: metrics.maxDrawdown,
    };
  });
}

async function calculateRegimePerformance(
  executions: any[],
  strategyId?: number,
  dateFilter?: { gte?: Date; lte?: Date }
) {
  try {
    // Get all regime types
    const regimeTypes = await prisma.regime_types.findMany({
      where: { is_active: true },
      orderBy: { id: "asc" },
    });

    // Get historical market regime data to map executions to regimes
    const globalRegimeHistory = await prisma.global_market_regime.findMany({
      where: {
        ...(Object.keys(dateFilter || {}).length > 0 && {
          created_at: dateFilter,
        }),
      },
      include: {
        regime_types_global_market_regime_current_regime_idToregime_types: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    // Create a map of regime periods for faster lookup
    const regimePeriods: Array<{
      regimeId: number;
      regimeName: string;
      startDate: Date;
      endDate: Date | null;
      duration: number;
    }> = [];

    for (let i = 0; i < globalRegimeHistory.length; i++) {
      const current = globalRegimeHistory[i];
      const next = globalRegimeHistory[i + 1];

      regimePeriods.push({
        regimeId: current.current_regime_id,
        regimeName:
          current
            .regime_types_global_market_regime_current_regime_idToregime_types
            ?.name || "Unknown",
        startDate: current.regime_start_date || current.created_at,
        endDate: next ? next.regime_start_date || next.created_at : null,
        duration: current.regime_duration_hours || 0,
      });
    }

    // Group executions by regime
    const regimeExecutions: { [regimeName: string]: any[] } = {};

    executions.forEach((execution) => {
      const executionDate = new Date(execution.executed_at);

      // Find which regime this execution belongs to
      const regime = regimePeriods.find((period) => {
        const afterStart = executionDate >= period.startDate;
        const beforeEnd = !period.endDate || executionDate <= period.endDate;
        return afterStart && beforeEnd;
      });

      const regimeName = regime?.regimeName || "Unknown";
      if (!regimeExecutions[regimeName]) {
        regimeExecutions[regimeName] = [];
      }
      regimeExecutions[regimeName].push(execution);
    });

    // Calculate performance metrics for each regime
    const regimePerformance = Object.entries(regimeExecutions).map(
      ([regimeName, regimeExecs]) => {
        const metrics = calculatePerformanceMetrics(regimeExecs);

        // Calculate regime occurrences and average duration
        const regimeOccurrences = regimePeriods.filter(
          (p) => p.regimeName === regimeName
        );
        const avgDuration =
          regimeOccurrences.length > 0
            ? regimeOccurrences.reduce(
                (sum, period) => sum + period.duration,
                0
              ) /
              regimeOccurrences.length /
              24 // Convert hours to days
            : 0;

        return {
          regime: regimeName,
          avgReturn: metrics.totalReturn,
          sharpe: metrics.sharpeRatio,
          maxDrawdown: metrics.maxDrawdown,
          occurrences: regimeOccurrences.length,
          avgDuration: Math.round(avgDuration),
          executions: regimeExecs.length,
          winRate: metrics.winRate,
        };
      }
    );

    // Add regimes with no executions but that exist in the system
    regimeTypes.forEach((regimeType) => {
      if (!regimePerformance.find((rp) => rp.regime === regimeType.name)) {
        const regimeOccurrences = regimePeriods.filter(
          (p) => p.regimeName === regimeType.name
        );
        const avgDuration =
          regimeOccurrences.length > 0
            ? regimeOccurrences.reduce(
                (sum, period) => sum + period.duration,
                0
              ) /
              regimeOccurrences.length /
              24
            : 0;

        regimePerformance.push({
          regime: regimeType.name,
          avgReturn: 0,
          sharpe: 0,
          maxDrawdown: 0,
          occurrences: regimeOccurrences.length,
          avgDuration: Math.round(avgDuration),
          executions: 0,
          winRate: 0,
        });
      }
    });

    return regimePerformance.sort((a, b) => b.executions - a.executions);
  } catch (error) {
    console.error("Error calculating regime performance:", error);
    // Fallback to empty array if calculation fails
    return [];
  }
}
