import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Cap at 100
  const offset = (page - 1) * limit;
  
  // Optional search and status parameters
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  try {
    // Build where clause
    const whereClause: any = {};

    // Handle status filter
    if (status) {
      switch (status) {
        case "active":
          whereClause.active = true;
          whereClause.is_watched = { not: true }; // Active but not watched
          break;
        case "watched":
          whereClause.is_watched = true;
          break;
        case "inactive":
          whereClause.active = false;
          break;
        default:
          // For 'all' or unknown status, don't add status filter
          break;
      }
    } else {
      // Default behavior - only show active tickers if no status specified
      whereClause.active = true;
    }

    if (search) {
      whereClause.OR = [
        {
          symbol: {
            contains: search.toUpperCase(),
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
      // Debug logging
      console.log('Symbol search query:', {
        search: search,
        searchUpper: search.toUpperCase(),
        whereClause: JSON.stringify(whereClause, null, 2)
      });
    }

    // Fetch symbols with pagination and total count
    const [symbols, totalCount] = await Promise.all([
      prisma.symbols.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          symbol: "asc",
        },
      }),
      prisma.symbols.count({
        where: whereClause,
      }),
    ]);

    // Debug logging
    if (search) {
      console.log('Symbol search results:', {
        searchTerm: search,
        foundCount: symbols.length,
        totalCount: totalCount,
        foundSymbols: symbols.map(s => ({ symbol: s.symbol, name: s.name, active: s.active }))
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        symbols,
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
