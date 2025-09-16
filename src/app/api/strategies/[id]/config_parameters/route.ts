import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const strategyId = parseInt(id);

    const configParams = await prisma.strategy_config_parameters.findUnique({
      where: { strategy_id: strategyId },
    });

    return NextResponse.json({
      success: true,
      data: configParams,
    });
  } catch (error) {
    console.error("Strategy config parameters API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFIG_PARAMETERS_ERROR",
          message: "Failed to fetch strategy config parameters",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
