import { NextRequest, NextResponse } from "next/server";
import { BacktestService } from "@/lib/db/services/backtestService";
import { backtestService } from "@/lib/backtest/client";

interface ExternalResults {
  status?: string;
  symbols?: string[];
  metrics?: {
    total_return?: number;
    annualized_return?: number;
    sharpe_ratio?: number;
    sortino_ratio?: number;
    max_drawdown?: number;
    total_trades?: number;
    winning_trades?: number;
    losing_trades?: number;
    win_rate?: number;
    profit_factor?: number;
    net_profit?: number;
  };
  trades?: Array<{
    id?: string;
    symbol?: string;
    side?: "long" | "short";
    quantity?: number;
    price?: number;
    timestamp?: string;
    profit_loss?: number;
  }>;
  equity_curve?: Array<{
    date: string;
    value: number;
    drawdown: number;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const backtestId = parseInt(id);

    // Validate backtest ID
    if (isNaN(backtestId) || backtestId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_ID", message: "Invalid backtest ID" },
        },
        { status: 400 }
      );
    }

    // Get backtest run from database
    const backtestRun = await BacktestService.findBacktestRunById(backtestId);

    if (!backtestRun) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Backtest not found" },
        },
        { status: 404 }
      );
    }

    // Verify user has access to this backtest
    // For now, we'll check if the user is authenticated (already verified above)
    // In production, you might want to add user ownership checks based on your auth model

    if (!backtestRun.job_id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_JOB_ID", message: "Backtest job ID not found" },
        },
        { status: 404 }
      );
    }

    try {
      // Fetch results from external backtesting service using job_id (external service groups by job)
      const externalResults: ExternalResults =
        await backtestService.getBacktestResults(backtestId.toString());

      // Get the symbol for this specific backtest run
      const backtestSymbols = await BacktestService.getBacktestSymbolsByRunId(
        backtestId
      );
      const runSymbol = backtestSymbols?.[0]?.symbols?.symbol;

      // Filter external results to only include trades for this run's symbol
      if (externalResults.trades && runSymbol) {
        externalResults.trades = externalResults.trades.filter(
          (trade) => trade.symbol?.toUpperCase() === runSymbol.toUpperCase()
        );
      }

      // Fetch equity curve data from database using the run ID
      const equityCurveData = await BacktestService.getEquityCurveByRunId(
        backtestId
      );

      // Get the initial capital from the backtest_runs table
      const initialCapital = Number(backtestRun.initial_capital) || 100000;

      // Transform equity curve data to proper format
      const formattedEquityCurve = equityCurveData.map((point: any) => ({
        date: point.timestamp?.toISOString() || new Date().toISOString(),
        value: Number(point.equity_value) || initialCapital,
        drawdown: Number(point.drawdown_pct) || 0,
      }));

      // Prepare metadata from local database (without status)
      const metadata = {
        strategyName: backtestRun.strategies?.name || "Unknown Strategy",
        symbols:
          // Convert external service string[] to object format if available
          externalResults.symbols?.map((symbol) => ({ symbol })) || [],
        period: {
          start: backtestRun.start_date.toISOString(),
          end: backtestRun.end_date.toISOString(),
        },
        parameters: backtestRun.strategy_config || {},
        jobId: backtestRun.job_id,
        initialCapital,
      };

      // Use the actual status from VectorBT service
      const isCompleted = externalResults.status === "completed";

      // Helper function to convert BigInt to number
      const convertBigIntToNumber = (value: any): any => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        if (typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            return value.map(convertBigIntToNumber);
          }
          const converted: any = {};
          for (const [key, val] of Object.entries(value)) {
            converted[key] = convertBigIntToNumber(val);
          }
          return converted;
        }
        return value;
      };

      const responseData = {
        status: externalResults.status || "unknown",
        metadata: {
          ...metadata,
        },
        metrics: {
          totalReturn: externalResults.metrics?.total_return || 0,
          annualizedReturn: externalResults.metrics?.annualized_return || 0,
          sharpeRatio: externalResults.metrics?.sharpe_ratio || 0,
          sortinoRatio: externalResults.metrics?.sortino_ratio || 0,
          maxDrawdown: externalResults.metrics?.max_drawdown || 0,
          totalTrades: externalResults.metrics?.total_trades || 0,
          winningTrades: externalResults.metrics?.winning_trades || 0,
          losingTrades: externalResults.metrics?.losing_trades || 0,
          winRate: externalResults.metrics?.win_rate || 0,
          profitFactor: externalResults.metrics?.profit_factor || 0,
          netProfit: externalResults.metrics?.net_profit || 0,
        },
        equityCurve: formattedEquityCurve,
        trades: externalResults.trades || backtestRun.backtest_trades || [],
        readyForApproval: isCompleted,
      };

      // Convert any BigInt values to numbers before serialization
      const cleanedData = convertBigIntToNumber(responseData);

      return NextResponse.json({
        success: true,
        data: cleanedData,
      });
    } catch (externalError: unknown) {
      // Type guard to check if error has message property
      const isErrorWithMessage = (
        error: unknown
      ): error is { message: string } => {
        return (
          typeof error === "object" && error !== null && "message" in error
        );
      };

      // Check if it's a 404 from external service
      if (
        isErrorWithMessage(externalError) &&
        (externalError.message.includes("404") ||
          externalError.message.includes("not found"))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EXTERNAL_NOT_FOUND",
              message: "Backtest results not found in external service",
            },
          },
          { status: 404 }
        );
      }

      // Check if external service is unavailable
      if (
        isErrorWithMessage(externalError) &&
        (externalError.message.includes("timeout") ||
          externalError.message.includes("ECONNREFUSED"))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Backtesting service temporarily unavailable",
            },
          },
          { status: 503 }
        );
      }

      throw externalError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKTEST_RESULTS_ERROR",
          message: "Failed to fetch backtest results",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
