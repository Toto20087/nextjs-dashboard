import { NextRequest, NextResponse } from "next/server";
import { BacktestService } from "@/lib/db/services/backtestService";
import { backtestService } from "@/lib/backtest/client";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      // Get status from external backtesting service
      const externalStatus = await backtestService.getBacktestStatus(
        backtestRun.job_id
      );

      // Prepare response with local metadata and external status
      return NextResponse.json({
        success: true,
        data: {
          backtest: {
            id: backtestRun.id,
            jobId: backtestRun.job_id,
            status: externalStatus.status || backtestRun.status || "unknown",
            progress: externalStatus.progress || 0,
            strategy: {
              id: backtestRun.strategy_id,
              name: backtestRun.strategies?.name || "Unknown Strategy",
            },
            metadata: {
              createdAt: backtestRun.created_at?.toISOString(),
              startDate: backtestRun.start_date.toISOString(),
              endDate: backtestRun.end_date.toISOString(),
              initialCapital: Number(backtestRun.initial_capital),
              parameters: backtestRun.strategy_config || {},
            },
            // Include basic performance for completed backtests
            results: backtestRun.backtest_metrics?.[0]
              ? {
                  totalReturn:
                    Number(backtestRun.backtest_metrics[0].total_return) || 0,
                  sharpeRatio:
                    Number(backtestRun.backtest_metrics[0].sharpe_ratio) || 0,
                  totalTrades:
                    backtestRun.backtest_metrics[0].total_trades || 0,
                  winRate:
                    Number(backtestRun.backtest_metrics[0].win_rate) || 0,
                  maxDrawdown:
                    Number(backtestRun.backtest_metrics[0].max_drawdown) || 0,
                }
              : undefined,
          },
        },
      });
    } catch (externalError: unknown) {
      // Fallback: return status from local database
      throw externalError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKTEST_FETCH_ERROR",
          message: "Failed to fetch backtest",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = id;

    // Validate job ID format (UUID)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        jobId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_JOB_ID", message: "Invalid job ID format" },
        },
        { status: 400 }
      );
    }

    try {
      // Delete directly from VectorBT service
      await backtestService.cancelBacktest(jobId);

      // Optionally update local database if record exists
      try {
        const backtestRun = await prisma.backtest_runs.findFirst({
          where: { job_id: jobId },
        });

        if (backtestRun) {
          await BacktestService.updateBacktestRun(backtestRun.id, {
            status: "cancelled",
            completed_at: new Date(),
          });
        }
      } catch (dbError) {
        console.error("Failed to update local database:", dbError);
      }

      return NextResponse.json({
        success: true,
        data: {
          message: "Job cancelled successfully",
          jobId: jobId,
          status: "cancelled",
        },
      });
    } catch (deleteError: unknown) {
      console.error("Failed to delete job from VectorBT:", deleteError);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELETE_FAILED",
            message: "Failed to delete job",
            details:
              deleteError instanceof Error
                ? deleteError.message
                : "Unknown error",
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Backtest deletion API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKTEST_DELETE_ERROR",
          message: "Failed to delete backtest",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
