import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const strategyId = parseInt(id);

    const parameters = await prisma.strategy_parameters.findMany({
      where: { strategy_id: strategyId },
    });

    return NextResponse.json({
      success: true,
      data: parameters,
    });
  } catch (error) {
    console.error("Strategy parameters API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PARAMETERS_FETCH_ERROR",
          message: "Failed to fetch strategy parameters",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const strategyId = parseInt(id);
    const body = await req.json();

    // TODO: Implement strategy parameters update
    // - Verify user owns this strategy
    // - Validate parameter data
    // - Update parameters in database

    return NextResponse.json({
      success: true,
      data: {
        parameters: {},
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PARAMETERS_UPDATE_ERROR",
          message: "Failed to update strategy parameters",
        },
      },
      { status: 500 }
    );
  }
}
