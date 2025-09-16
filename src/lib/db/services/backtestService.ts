import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";

export class BacktestService {
  // Methods for backtests table (simple backtest records)
  static async findAllBacktests(
    params: {
      skip?: number;
      take?: number;
      where?: any;
    } = {}
  ) {
    const { skip, take, where } = params;

    return await prisma.backtests.findMany({
      skip,
      take,
      where,
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async findBacktestById(id: number) {
    return await prisma.backtests.findUnique({
      where: { id },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async createBacktest(data: {
    strategy_id: number;
    config: any;
    period_start: Date;
    period_end: Date;
  }) {
    return await prisma.backtests.create({
      data,
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async updateBacktest(
    id: number,
    data: {
      total_return?: number;
      sharpe_ratio?: number;
      max_drawdown?: number;
      total_trades?: number;
      win_rate?: number;
      config?: any;
    }
  ) {
    return await prisma.backtests.update({
      where: { id },
      data,
    });
  }

  // Methods for backtest_runs table (detailed backtest execution records)
  static async findAllBacktestRuns(
    params: {
      skip?: number;
      take?: number;
      where?: any;
    } = {}
  ) {
    const { skip, take, where } = params;

    return await prisma.backtest_runs.findMany({
      skip,
      take,
      where,
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        backtest_metrics: {
          select: {
            total_return: true,
            sharpe_ratio: true,
            total_trades: true,
            win_rate: true,
            max_drawdown: true,
          },
          take: 1,
          orderBy: {
            id: "desc",
          },
        },
        backtest_symbols_backtest_symbols_backtest_idTobacktest_runs: {
          include: {
            symbols: {
              select: {
                id: true,
                symbol: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            backtest_metrics: true,
            backtest_trades: true,
            backtest_equity_curve: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async findBacktestRunById(id: number) {
    return await prisma.backtest_runs.findUnique({
      where: { id },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        backtest_metrics: true,
        backtest_trades: {
          orderBy: {
            timestamp: "asc",
          },
        },
        backtest_equity_curve: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });
  }

  static async createBacktestRun(data: {
    job_id: string;
    start_date: Date;
    end_date: Date;
    initial_capital: number;
    strategy_id?: number;
    strategy_config: any;
    backtest_symbols?: number;
  }) {
    return await prisma.backtest_runs.create({
      data: {
        job_id: data.job_id,
        start_date: data.start_date,
        end_date: data.end_date,
        initial_capital: data.initial_capital,
        strategy_id: data.strategy_id,
        strategy_config: data.strategy_config,
        backtest_symbols: data.backtest_symbols,
        status: "running",
      },
    });
  }

  static async updateBacktestRun(
    id: number,
    data: {
      status?: string;
      completed_at?: Date;
    }
  ) {
    return await prisma.backtest_runs.update({
      where: { id },
      data,
    });
  }

  static async countBacktestRuns(params: { where?: any }) {
    const { where } = params;
    return await prisma.backtest_runs.count({ where });
  }

  static async completeBacktestRun(id: number) {
    return await prisma.backtest_runs.update({
      where: { id },
      data: {
        status: "completed",
        completed_at: new Date(),
      },
    });
  }

  static async failBacktestRun(id: number) {
    return await prisma.backtest_runs.update({
      where: { id },
      data: {
        status: "failed",
        completed_at: new Date(),
      },
    });
  }

  // Get backtest results with all related data
  static async getBacktestResults(runId: number) {
    const run = await prisma.backtest_runs.findUnique({
      where: { id: runId },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        backtest_metrics: true,
        backtest_trades: {
          orderBy: {
            timestamp: "asc",
          },
        },
        backtest_equity_curve: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    if (!run) {
      return null;
    }

    return {
      metadata: {
        runId: run.id,
        jobId: run.job_id,
        strategyName: run.strategies?.name || "Unknown Strategy",
        period: {
          start: run.start_date.toISOString(),
          end: run.end_date.toISOString(),
        },
        initialCapital: Number(run.initial_capital),
        status: run.status,
        parameters: run.strategy_config || {},
      },
      metrics: run.backtest_metrics,
      equityCurve: run.backtest_equity_curve,
      trades: run.backtest_trades,
    };
  }

  // Store backtest results
  static async storeBacktestResults(
    runId: number,
    results: {
      metrics?: any;
      trades?: any[];
      equityCurve?: any[];
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      // Store metrics
      if (results.metrics) {
        await tx.backtest_metrics.create({
          data: {
            backtest_run_id: runId,
            ...results.metrics,
          },
        });
      }

      // Store trades
      if (results.trades && results.trades.length > 0) {
        await tx.backtest_trades.createMany({
          data: results.trades.map((trade) => ({
            backtest_run_id: runId,
            ...trade,
          })),
        });
      }

      // Store equity curve
      if (results.equityCurve && results.equityCurve.length > 0) {
        await tx.backtest_equity_curve.createMany({
          data: results.equityCurve.map((point) => ({
            backtest_run_id: runId,
            ...point,
          })),
        });
      }
    });
  }

  static async getRecentBacktestRuns(limit = 10) {
    return await prisma.backtest_runs.findMany({
      take: limit,
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            backtest_metrics: true,
            backtest_trades: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async getBacktestRunsByStrategy(strategyId: number) {
    return await prisma.backtest_runs.findMany({
      where: {
        strategy_id: strategyId,
      },
      include: {
        _count: {
          select: {
            backtest_metrics: true,
            backtest_trades: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async getBacktestRunsByStatus(status: string) {
    return await prisma.backtest_runs.findMany({
      where: { status },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async getBacktestStats() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRuns,
      completedRuns,
      runningRuns,
      failedRuns,
      newRunsThisMonth,
      newRunsLastMonth,
    ] = await Promise.all([
      prisma.backtest_runs.count(),
      prisma.backtest_runs.count({ where: { status: "completed" } }),
      prisma.backtest_runs.count({ where: { status: "running" } }),
      prisma.backtest_runs.count({ where: { status: "failed" } }),
      prisma.backtest_runs.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
      prisma.backtest_runs.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ]);

    const growthRate =
      newRunsLastMonth > 0
        ? ((newRunsThisMonth - newRunsLastMonth) / newRunsLastMonth) * 100
        : 0;

    return {
      totalRuns,
      completedRuns,
      runningRuns,
      failedRuns,
      successRate: totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0,
      newRunsThisMonth,
      newRunsLastMonth,
      growthRate,
    };
  }
}
