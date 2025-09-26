import { NextRequest, NextResponse } from "next/server";
import { BacktestService } from "@/lib/db/services/backtestService";
import { backtestService } from "@/lib/backtest/client";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";

interface BacktestSymbol {
  id?: number;
  symbol: string;
  name?: string;
}

interface BacktestStrategy {
  id?: number;
  name: string;
}

interface BacktestPeriod {
  startDate: string;
  endDate: string;
}

interface BacktestBasicMetrics {
  totalReturn: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
}

interface BacktestListItem {
  id: number;
  jobId: string | null;
  status: string | null;
  strategy: BacktestStrategy;
  symbols: BacktestSymbol[];
  period: BacktestPeriod;
  initialCapital: number;
  createdAt?: string;
  completedAt?: string;
  basicMetrics?: BacktestBasicMetrics;
}

interface WalkForwardConfig {
  enabled: boolean;
  training_window: number;
  step_size: number;
  optimization_period: number;
  min_trade_count: number;
}

interface BacktestCreateRequest {
  strategy: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  initialCapital?: number;
  position_sizing?: number;
  parameters?: Record<string, unknown>;
  walkForwardConfig?: WalkForwardConfig;
  optimizeConfig?: boolean;
  benchmark?: string;
  commission?: number;
  slippage?: number;
  metadata?: Record<string, unknown>;
}

interface BacktestCreateResponse {
  jobId: string;
  status: string;
  message?: string;
  strategy: string;
  symbols: string[];
  estimatedCompletion?: string;
}

// Helper function to validate parameter types
function isValidType(value: unknown, expectedType: string): boolean {
  switch (expectedType.toLowerCase()) {
    case "float":
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "int":
    case "integer":
      return Number.isInteger(value);
    case "string":
      return typeof value === "string";
    case "boolean":
    case "bool":
      return typeof value === "boolean";
    default:
      return false;
  }
}

// Helper function to validate strategy parameters against database schema
async function validateStrategyParameters(
  strategyId: string,
  providedParams: Record<string, unknown>
) {
  // Find strategy by name
  const strategy = await prisma.strategies.findFirst({
    where: { id: parseInt(strategyId), is_active: true },
    include: {
      strategy_config_parameters: {
        where: { is_active: true },
      },
    },
  });

  if (!strategy) {
    throw new Error("Strategy not found");
  }

  if (!strategy.strategy_config_parameters) {
    throw new Error("Strategy configuration not found");
  }

  const strategyConfig = strategy.strategy_config_parameters;

  const requiredParams = strategyConfig.parameters as Record<string, string>;

  // Validate each required parameter exists and has correct type
  for (const [paramName, paramType] of Object.entries(requiredParams)) {
    if (!(paramName in providedParams)) {
      throw new Error(`Missing required parameter: ${paramName}`);
    }

    const providedValue = providedParams[paramName];
    if (!isValidType(providedValue, paramType)) {
      throw new Error(
        `Parameter ${paramName} must be of type ${paramType}, got ${typeof providedValue}`
      );
    }
  }

  // Check for unexpected parameters
  for (const paramName of Object.keys(providedParams)) {
    if (!(paramName in requiredParams)) {
      throw new Error(
        `Unexpected parameter: ${paramName}. Allowed parameters: ${Object.keys(
          requiredParams
        ).join(", ")}`
      );
    }
  }

  return { strategy, strategyConfig }; // Return strategy info for metadata
}

interface GroupedBacktestResponse {
  items: Record<string, BacktestListItem[]>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<GroupedBacktestResponse>>> {
  try {
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const statusFilter = searchParams.get("status");
    const strategyFilter = searchParams.get("strategy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause for filtering
    const whereClause: {
      status?: string;
      strategies?: { name: { contains: string; mode: string } };
      created_at?: { gte?: Date; lte?: Date };
    } = {};

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (strategyFilter) {
      whereClause.strategies = {
        name: {
          contains: strategyFilter,
          mode: "insensitive",
        },
      };
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

    // Fetch backtests with related data
    const [backtests, totalCount] = await Promise.all([
      BacktestService.findAllBacktestRuns({
        skip: offset,
        where: whereClause,
      }),
      BacktestService.countBacktestRuns({ where: whereClause }),
    ]);

    // Format individual backtests first
    const formattedBacktests = backtests.map(
      (backtest: any): BacktestListItem => ({
        id: backtest.id,
        jobId: backtest.job_id,
        status: backtest.status,
        strategy: {
          id: backtest.strategies?.id,
          name: backtest.strategies?.name || "Unknown Strategy",
        },
        symbols:
          backtest.backtest_symbols_backtest_symbols_backtest_idTobacktest_runs?.map(
            (bs: {
              symbols?: { id?: number; symbol: string; name?: string };
            }) => ({
              id: bs.symbols?.id,
              symbol: bs.symbols?.symbol || "",
              name: bs.symbols?.name,
            })
          ) || [],
        period: {
          startDate: backtest.start_date.toISOString(),
          endDate: backtest.end_date.toISOString(),
        },
        initialCapital: Number(backtest.initial_capital),
        createdAt: backtest.created_at?.toISOString(),
        completedAt: backtest.completed_at?.toISOString(),
        basicMetrics: backtest.backtest_metrics?.[0]
          ? {
              totalReturn:
                Number(backtest.backtest_metrics[0].total_return) || 0,
              sharpeRatio:
                Number(backtest.backtest_metrics[0].sharpe_ratio) || 0,
              totalTrades: backtest.backtest_metrics[0].total_trades || 0,
              winRate: Number(backtest.backtest_metrics[0].win_rate) || 0,
              maxDrawdown:
                Number(backtest.backtest_metrics[0].max_drawdown) || 0,
            }
          : undefined,
      })
    );

    // Group by job ID
    const groupedByJobId = formattedBacktests.reduce(
      (groups: Record<string, BacktestListItem[]>, backtest) => {
        const jobId = backtest.jobId || "unknown";
        if (!groups[jobId]) {
          groups[jobId] = [];
        }
        groups[jobId].push(backtest);
        return groups;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        items: groupedByJobId,
        pagination: {
          limit: totalCount, // Since we removed pagination, return total count as limit
          offset,
          total: totalCount,
          hasMore: false, // No more pages since we return all items
        },
      },
    });
  } catch (error) {
    console.error("Backtests GET API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKTESTS_ERROR",
          message: "Failed to fetch backtests",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<BacktestCreateResponse>>> {
  try {
    const body: BacktestCreateRequest = await req.json();

    // Basic request validation
    const {
      strategy,
      symbols,
      startDate,
      endDate,
      initialCapital = 100000,
      position_sizing = 0.03,
      parameters = {},
      walkForwardConfig,
      optimizeConfig,
    } = body;

    if (!strategy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELD",
            message: "Strategy name is required",
          },
        },
        { status: 400 }
      );
    }

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELD",
            message: "Symbols array is required and must not be empty",
          },
        },
        { status: 400 }
      );
    }

    // Date validation - only required for normal backtests (not walk forward optimization)
    const isWalkForwardMode = optimizeConfig && walkForwardConfig?.enabled;

    if (!isWalkForwardMode && (!startDate || !endDate)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELD",
            message:
              "Start date and end date are required for normal backtests",
          },
        },
        { status: 400 }
      );
    }

    // Date validation - only for normal backtests
    if (!isWalkForwardMode && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE",
              message: "Invalid date format. Use YYYY-MM-DD",
            },
          },
          { status: 400 }
        );
      }

      if (start >= end) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_RANGE",
              message: "Start date must be before end date",
            },
          },
          { status: 400 }
        );
      }

      if (start > now) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_RANGE",
              message: "Start date cannot be in the future",
            },
          },
          { status: 400 }
        );
      }
    }

    // Symbol validation
    for (const symbol of symbols) {
      if (typeof symbol !== "string" || !/^[A-Z]{1,5}$/.test(symbol)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_SYMBOL",
              message: `Invalid symbol format: ${symbol}`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Walk Forward Config validation
    if (walkForwardConfig && walkForwardConfig.enabled) {
      const {
        training_window,
        step_size,
        optimization_period,
        min_trade_count,
      } = walkForwardConfig;

      if (!training_window || training_window <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_WALK_FORWARD_CONFIG",
              message: "Window size must be a positive number",
            },
          },
          { status: 400 }
        );
      }

      if (!step_size || step_size <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_WALK_FORWARD_CONFIG",
              message: "Step size must be a positive number",
            },
          },
          { status: 400 }
        );
      }

      if (!optimization_period || optimization_period <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_WALK_FORWARD_CONFIG",
              message: "Optimization period must be a positive number",
            },
          },
          { status: 400 }
        );
      }

      if (!min_trade_count || min_trade_count <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_WALK_FORWARD_CONFIG",
              message: "Minimum trade count must be a positive number",
            },
          },
          { status: 400 }
        );
      }

      if (step_size > training_window) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_WALK_FORWARD_CONFIG",
              message: "Step size cannot be larger than window size",
            },
          },
          { status: 400 }
        );
      }
    }

    try {
      // Look up strategy by ID to get strategy info
      let strategyInfo;
      if (optimizeConfig && walkForwardConfig?.enabled) {
        // For WFO, just get strategy info without validating parameters
        strategyInfo = await prisma.strategies.findFirst({
          where: { id: parseInt(strategy), is_active: true },
        });
        if (!strategyInfo) {
          throw new Error("Strategy not found");
        }
      } else {
        // For manual mode, validate strategy parameters against database schema
        const result = await validateStrategyParameters(strategy, parameters);
        strategyInfo = result.strategy;
      }

      // Prepare request for unified endpoint based on scenario
      let backtestRequest;

      if (optimizeConfig && walkForwardConfig?.enabled) {
        // Scenario 2: Walk Forward Backtest - Use optimization parameters from request
        backtestRequest = {
          strategyName: strategyInfo.name,
          symbols,
          startDate: null,
          endDate: null,
          initialCapital,
          position_sizing: position_sizing,
          enable_regime_position_sizing: true,
          parameters: parameters,
          walkForwardConfig: {
            enabled: true,
            training_window: walkForwardConfig.training_window || 30,
            step_size: walkForwardConfig.step_size || 7,
            optimization_period: walkForwardConfig.optimization_period || 7,
            min_trade_count: walkForwardConfig.min_trade_count || 10,
          },
        };
      } else {
        // Scenario 1: Normal Backtest
        backtestRequest = {
          strategyName: strategyInfo.name,
          symbols,
          startDate,
          endDate,
          initialCapital,
          position_sizing: position_sizing,
          timeframe: "1h",
          parameters,
          walkForwardConfig: null,
        };
      }

      // Submit to external service (NO local database storage)
      const result = await backtestService.submitBacktest(backtestRequest);

      // Return external service response directly
      return NextResponse.json({
        success: true,
        data: {
          jobId: result.backtestId,
          status: result.status,
          message: result.message,
          strategy: strategyInfo.name,
          symbols: symbols,
          estimatedCompletion: result.estimatedDuration,
        },
      });
    } catch (validationError: unknown) {
      // Handle parameter validation errors
      const errorMessage =
        validationError instanceof Error
          ? validationError.message
          : String(validationError);

      if (errorMessage.includes("Strategy not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "STRATEGY_NOT_FOUND",
              message: errorMessage,
            },
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes("configuration not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "STRATEGY_CONFIG_NOT_FOUND",
              message: errorMessage,
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMETERS",
            message: "Parameter validation failed",
            details: errorMessage,
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Backtest creation API error:", error);

    // Handle external service errors
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_TIMEOUT",
            message: "Backtesting service timeout",
          },
        },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Backtesting service is unavailable",
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKTEST_CREATION_ERROR",
          message: "Failed to create backtest",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
