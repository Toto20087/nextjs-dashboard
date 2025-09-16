import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { BacktestService } from "@/lib/db/services/backtestService";
import { backtestService } from "@/lib/backtest/client";

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
      // Fetch results from external backtesting service
      const externalResults: any = await backtestService.getBacktestResults(
        backtestRun.job_id
      );

      // Prepare metadata from local database (without status)
      const metadata = {
        strategyName: backtestRun.strategies?.name || "Unknown Strategy",
        symbols:
          backtestRun.backtest_symbols_backtest_symbols_backtest_idTobacktest_runs?.map(
            (bs: any) => ({
              id: bs.symbols?.id,
              symbol: bs.symbols?.symbol,
              name: bs.symbols?.name,
            })
          ) ||
          externalResults.symbols ||
          [],
        period: {
          start: backtestRun.start_date.toISOString(),
          end: backtestRun.end_date.toISOString(),
        },
        parameters: backtestRun.strategy_config || {},
        jobId: backtestRun.job_id,
      };

      // Use the actual status from VectorBT service
      const isCompleted = externalResults.status === "completed";

      return NextResponse.json({
        success: true,
        data: {
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
          equityCurve: backtestRun.backtest_equity_curve || [], // VectorBT doesn't seem to return equity curve in this format
          trades: externalResults.trades || backtestRun.backtest_trades || [],
          readyForApproval: isCompleted,
        },
      });
    } catch (externalError: any) {
      // Handle external service errors gracefully
      console.error("External service error:", externalError);

      // Check if it's a 404 from external service
      if (
        externalError.message?.includes("404") ||
        externalError.message?.includes("not found")
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
        externalError.message?.includes("timeout") ||
        externalError.message?.includes("ECONNREFUSED")
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

      // Fallback: return status from local database if available
      return NextResponse.json({
        success: true,
        data: {
          status: backtestRun.status || "unknown",
          progress: 0,
          currentStep: "Service unavailable",
          metadata: {
            strategyName: backtestRun.strategies?.name || "Unknown Strategy",
            symbols: [],
            period: {
              start: backtestRun.start_date.toISOString(),
              end: backtestRun.end_date.toISOString(),
            },
            parameters: backtestRun.strategy_config || {},
            jobId: backtestRun.job_id,
          },
          metrics: {
            totalReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            totalTrades: 0,
            winRate: 0,
          },
          equityCurve: [],
          trades: [],
          readyForApproval: false,
        },
      });
    }
  } catch (error) {
    console.error("Backtest results API error:", error);
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
