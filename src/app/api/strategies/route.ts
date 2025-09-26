import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100
    const offset = (page - 1) * limit;
    
    // Query parameters for filtering
    const isActive = searchParams.get("is_active");
    const processedByRust = searchParams.get("processed_by_rust");
    const search = searchParams.get("search");

    // Build where clause for filtering
    const whereClause: any = {};

    // Filter by is_active
    if (isActive !== null) {
      whereClause.is_active = isActive === "true";
    }

    // Filter by processed_by_rust
    if (processedByRust !== null) {
      whereClause.processed_by_rust = processedByRust === "true";
    }

    // Search by name
    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Fetch strategies with filters and pagination
    const [strategies, totalCount] = await Promise.all([
      prisma.strategies.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          processed_by_rust: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.strategies.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        strategies,
        pagination: {
          page,
          limit,
          offset,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Strategies API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "STRATEGIES_ERROR",
          message: "Failed to fetch strategies",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}