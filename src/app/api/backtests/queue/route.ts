import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    try {
      // Direct fetch from VectorBT /api/backtest/jobs endpoint
      const response = await fetch("http://localhost:8000/api/backtest/jobs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jobsData = await response.json();

      return NextResponse.json({
        success: true,
        data: jobsData,
      });
    } catch (externalError: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "VectorBT service is unavailable",
            details:
              externalError instanceof Error
                ? externalError.message
                : "Unknown error",
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Queue status API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "QUEUE_STATUS_ERROR",
          message: "Failed to fetch queue status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
