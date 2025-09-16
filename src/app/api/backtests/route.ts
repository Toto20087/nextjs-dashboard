import { NextRequest, NextResponse } from "next/server";
import { BacktestService } from "@/lib/db/services/backtestService";
import { backtestService } from "@/lib/backtest/client";
import { prisma } from "@/lib/db/prisma";

// Helper function to validate parameter types
function isValidType(value: any, expectedType: string): boolean {
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
  strategyName: string,
  providedParams: Record<string, any>
) {
  // Find strategy by name
  const strategy = await prisma.strategies.findFirst({
    where: { name: strategyName, is_active: true },
    include: {
      strategy_config_parameters: {
        where: { is_active: true },
      },
    },
  });

  console.log("strategy", strategy);

  if (!strategy) {
    throw new Error("Strategy not found");
  }

  if (
    !strategy.strategy_config_parameters ||
    strategy.strategy_config_parameters.length === 0
  ) {
    throw new Error("Strategy configuration not found");
  }

  const strategyConfig = strategy.strategy_config_parameters;

  console.log("strategyConfig", strategyConfig);

  const requiredParams = strategyConfig.parameters as Record<string, string>;

  console.log("requiredParams", requiredParams);

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Cap at 100
    const offset = parseInt(searchParams.get("offset") || "0");
    const statusFilter = searchParams.get("status");
    const strategyFilter = searchParams.get("strategy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause for filtering
    const whereClause: any = {};

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
        take: limit,
        where: whereClause,
      }),
      BacktestService.countBacktestRuns({ where: whereClause }),
    ]);

    // Format response
    const formattedBacktests = backtests.map((backtest: any) => ({
      id: backtest.id,
      jobId: backtest.job_id,
      status: backtest.status,
      strategy: {
        id: backtest.strategies?.id,
        name: backtest.strategies?.name || "Unknown Strategy",
      },
      symbols:
        backtest.backtest_symbols_backtest_symbols_backtest_idTobacktest_runs?.map(
          (bs: any) => ({
            id: bs.symbols?.id,
            symbol: bs.symbols?.symbol,
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
            totalReturn: Number(backtest.backtest_metrics[0].total_return) || 0,
            sharpeRatio: Number(backtest.backtest_metrics[0].sharpe_ratio) || 0,
            totalTrades: backtest.backtest_metrics[0].total_trades || 0,
            winRate: Number(backtest.backtest_metrics[0].win_rate) || 0,
            maxDrawdown: Number(backtest.backtest_metrics[0].max_drawdown) || 0,
          }
        : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        backtests: formattedBacktests,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic request validation
    const {
      strategy,
      symbols,
      startDate,
      endDate,
      initialCapital = 100000,
      parameters = {},
      benchmark = "SPY",
      commission = 0,
      slippage = 0,
      metadata = {},
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

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELD",
            message: "Start date and end date are required",
          },
        },
        { status: 400 }
      );
    }

    // Date validation
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

    try {
      // Validate strategy parameters against database schema
      const { strategy: strategyInfo, strategyConfig } =
        await validateStrategyParameters(strategy, parameters);

      // Prepare request for external service
      const backtestRequest = {
        strategy: strategy,
        symbols,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
        parameters,
      };

      // Submit to external service (NO local database storage)
      const result = await backtestService.submitBacktest(
        backtestRequest as any
      );

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
    } catch (validationError: any) {
      // Handle parameter validation errors
      if (validationError.message.includes("Strategy not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "STRATEGY_NOT_FOUND",
              message: validationError.message,
            },
          },
          { status: 404 }
        );
      }

      if (validationError.message.includes("configuration not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "STRATEGY_CONFIG_NOT_FOUND",
              message: validationError.message,
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
            details: validationError.message,
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
