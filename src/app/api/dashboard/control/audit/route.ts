import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  let dbUser;
  let user;
  try {
    if (
      !(
        process.env.NODE_ENV === "development" &&
        process.env.ACCESS_AUTHORIZATION_KEY
      )
    ) {
      user = await currentUser();

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          { status: 401 }
        );
      }
    }

    if (process.env.NODE_ENV === "development") {
      dbUser = {
        role: "admin",
        can_override_risk: true,
      };
    } else {
      // Check if user has admin role
      dbUser = await prisma.users.findUnique({
        where: {
          clerk_user_id: user.id,
          is_active: true,
        },
        select: {
          role: true,
          can_override_risk: true,
        },
      });
    }
    if (
      !dbUser ||
      (dbUser.role !== "admin" &&
        dbUser.role !== "super_admin" &&
        !dbUser.can_override_risk)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin access required for audit trail",
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Query parameters for filtering
    const actorFilter = searchParams.get("actor");
    const actionFilter = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause for filtering
    const whereClause: any = {};

    if (actorFilter) {
      whereClause.actor = {
        contains: actorFilter,
        mode: "insensitive",
      };
    }

    if (actionFilter) {
      whereClause.action = {
        contains: actionFilter,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.created_at.lte = new Date(endDate);
      }
    }

    // Fetch audit entries with filters and pagination
    const [entries, totalCount] = await Promise.all([
      prisma.audit_log.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.audit_log.count({
        where: whereClause,
      }),
    ]);

    // Get unique actors and actions for filter options
    const [actors, actions] = await Promise.all([
      prisma.audit_log.findMany({
        select: {
          actor: true,
        },
        distinct: ["actor"],
        where: {
          actor: {
            not: null,
          },
        },
        orderBy: {
          actor: "asc",
        },
      }),
      prisma.audit_log.findMany({
        select: {
          action: true,
        },
        distinct: ["action"],
        orderBy: {
          action: "asc",
        },
      }),
    ]);

    // Format entries for response
    const formattedEntries = entries.map((entry) => ({
      id: entry.id.toString(),
      actor: entry.actor,
      action: entry.action,
      context: entry.context || {},
      timestamp: entry.created_at?.toISOString(),
      // Parse context for additional display info
      ...(entry.context && typeof entry.context === "object"
        ? {
            resource: (entry.context as any)?.resource_type || null,
            resourceId: (entry.context as any)?.resource_id ? (entry.context as any).resource_id.toString() : null,
            details: (entry.context as any)?.details || null,
            ipAddress: (entry.context as any)?.ip_address || null,
            userAgent: (entry.context as any)?.user_agent || null,
          }
        : {}),
    }));

    return NextResponse.json({
      success: true,
      data: {
        entries: formattedEntries,
        filters: {
          actors: actors.map((a) => a.actor).filter(Boolean),
          actions: actions.map((a) => a.action),
        },
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
    console.error("Audit trail API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUDIT_TRAIL_ERROR",
          message: "Failed to fetch audit trail data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
