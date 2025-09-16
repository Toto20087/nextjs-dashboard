import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const strategyId = parseInt(id);

    const allocations = await prisma.strategy_allocations.findMany({
      where: { strategy_id: strategyId },
    });

    return NextResponse.json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    console.error("Strategy allocations API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ALLOCATIONS_FETCH_ERROR",
          message: "Failed to fetch strategy allocations",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
