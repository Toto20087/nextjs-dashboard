import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const signalId = parseInt(id);

    const signal = await prisma.signals.findUnique({
      where: { id: signalId },
    });

    return NextResponse.json({
      success: true,
      data: signal,
    });
  } catch (error) {
    console.error("Signal fetch API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIGNAL_FETCH_ERROR",
          message: "Failed to fetch signal",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
