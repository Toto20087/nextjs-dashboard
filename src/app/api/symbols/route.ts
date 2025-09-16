import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest) {
  try {
    const symbols = await prisma.symbols.findMany({
      where: {
        active: true,
      },
      orderBy: {
        symbol: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        symbols,
      },
    });
  } catch (error) {
    console.error("Symbols API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYMBOLS_ERROR",
          message: "Failed to fetch symbols",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
