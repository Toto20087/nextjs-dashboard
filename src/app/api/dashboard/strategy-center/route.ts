import { NextRequest, NextResponse } from "next/server";
import { currentUser, User } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user: User | null = null;
    if (
      !(
        process.env.NODE_ENV === "development" &&
        process.env.ACCESS_AUTHORIZATION_KEY
      )
    ) {
      const user = await currentUser();

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get("status");

    // Check user permissions
    let dbUser;

    if (process.env.NODE_ENV === "development") {
      // Development bypass - use mock admin user
      dbUser = {
        role: "admin",
        can_approve_strategies: true,
      };
    } else {
      dbUser = await prisma.users.findUnique({
        where: {
          clerk_user_id: user.id,
          is_active: true,
        },
        select: {
          role: true,
          can_approve_strategies: true,
        },
      });

      if (!dbUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found in database",
            },
          },
          { status: 404 }
        );
      }
    }

    // Build where clause for filtering
    const whereClause: any = {};

    if (process.env.NODE_ENV === "development") {
      // Development: Use available fields from strategies table
      if (statusFilter === "approved") {
        whereClause.is_active = true;
      } else if (statusFilter === "pending" || statusFilter === "rejected") {
        whereClause.is_active = false;
      }
      // Skip user filtering in development
    } else {
      // Production: Use proper approval_status and created_by fields
      if (
        statusFilter &&
        ["pending", "approved", "rejected"].includes(statusFilter)
      ) {
        whereClause.approval_status = statusFilter;
      }

      // For non-admin users, only show their own strategies unless they can approve
      if (
        dbUser.role !== "admin" &&
        dbUser.role !== "super_admin" &&
        !dbUser.can_approve_strategies
      ) {
        whereClause.created_by = user.id;
      }
    }

    // Fetch strategies with related data
    const [strategies, totalCount] = await Promise.all([
      prisma.strategies.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          strategy_allocations: {
            select: {
              allocated_capital: true,
              allocation_percentage: true,
              is_active: true,
            },
          },
          backtest_runs: {
            where: {
              status: "completed",
            },
            include: {
              backtest_metrics: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
          _count: {
            select: {
              positions: {
                where: {
                  is_active: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.strategies.count({
        where: whereClause,
      }),
    ]);

    // Calculate strategy metrics and format for frontend
    const formattedStrategies = strategies.map((strategy) => {
      const totalAllocation = strategy.strategy_allocations
        .filter((a) => a.is_active)
        .reduce((sum, a) => sum + Number(a.allocated_capital), 0);
      const totalAllocationPercentage = strategy.strategy_allocations
        .filter((a) => a.is_active)
        .reduce((sum, a) => sum + Number(a.allocation_percentage), 0);
      const latestBacktest = strategy.backtest_runs[0];
      const metrics = latestBacktest?.backtest_metrics[0];

      return {
        id: strategy.id,
        name: strategy.name,
        isActive: strategy.is_active,
        allocation: totalAllocation,
        allocationPercentage: totalAllocationPercentage,
        performance: metrics?.total_return
          ? Number(metrics.total_return) * 100
          : 0,
        sharpe: metrics?.sharpe_ratio ? Number(metrics.sharpe_ratio) : 0,
        maxDrawdown: metrics?.max_drawdown
          ? Number(metrics.max_drawdown) * 100
          : 0,
        positions: strategy._count.positions,
        lastUpdate: strategy.updated_at?.toISOString(),
        createdAt: strategy.created_at?.toISOString(),
      };
    });

    // Calculate summary statistics
    const [summaryStats, totalCapital] = await Promise.all([
      prisma.strategies.groupBy({
        by: ["is_active"],
        _count: {
          id: true,
        },
      }),
      prisma.strategy_allocations.aggregate({
        _sum: {
          allocated_capital: true,
        },
        where: {
          is_active: true,
          strategies: {
            is_active: true,
          },
        },
      }),
    ]);

    // Process summary statistics
    let totalStrategies = 0;
    let activeStrategies = 0;

    summaryStats.forEach((stat) => {
      totalStrategies += stat._count.id;

      if (stat.is_active) {
        activeStrategies += stat._count.id;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        strategies: formattedStrategies,
        summary: {
          totalStrategies,
          activeStrategies,
          totalCapital: totalCapital._sum.allocated_capital
            ? Number(totalCapital._sum.allocated_capital)
            : 0,
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
        permissions: {
          canApprove:
            dbUser.can_approve_strategies ||
            dbUser.role === "admin" ||
            dbUser.role === "super_admin",
        },
      },
    });
  } catch (error) {
    console.error("Strategy center API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "STRATEGY_CENTER_ERROR",
          message: "Failed to fetch strategy center data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let user: User | null = null;

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

    // Check user permissions
    let dbUser;

    if (process.env.NODE_ENV === "development") {
      // Development bypass - use mock admin user
      dbUser = {
        role: "admin",
        can_approve_strategies: true,
      };
    } else {
      dbUser = await prisma.users.findUnique({
        where: {
          clerk_user_id: user.id,
          is_active: true,
        },
        select: {
          role: true,
          can_approve_strategies: true,
        },
      });

      if (
        !dbUser ||
        (!dbUser.can_approve_strategies &&
          dbUser.role !== "admin" &&
          dbUser.role !== "super_admin")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Strategy approval permissions required",
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { strategyId, action, rejectionReason } = body;

    if (!strategyId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "Strategy ID and action are required",
          },
        },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "pause", "activate"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ACTION",
            message:
              "Invalid action. Must be approve, reject, pause, or activate",
          },
        },
        { status: 400 }
      );
    }

    // Check if strategy exists
    const strategy = await prisma.strategies.findUnique({
      where: { id: parseInt(strategyId) },
      select: {
        id: true,
        name: true,
        is_active: true,
      },
    });

    if (!strategy) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "STRATEGY_NOT_FOUND", message: "Strategy not found" },
        },
        { status: 404 }
      );
    }

    // Build update data based on action
    const updateData: any = {
      updated_at: new Date(),
    };

    const actorName =
      process.env.NODE_ENV === "development"
        ? "Admin User"
        : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
          user?.emailAddresses?.[0]?.emailAddress ||
          "Unknown User";

    switch (action) {
      case "approve":
        updateData.is_active = true;
        break;

      case "reject":
        updateData.is_active = false;
        break;

      case "pause":
        updateData.is_active = false;
        break;

      case "activate":
        updateData.is_active = true;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_ACTION",
              message:
                "Invalid action. Must be approve, reject, pause, or activate",
            },
          },
          { status: 400 }
        );
    }

    // Update strategy
    const updatedStrategy = await prisma.strategies.update({
      where: { id: parseInt(strategyId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        is_active: true,
        updated_at: true,
      },
    });

    // Log the action for audit trail
    await prisma.audit_log.create({
      data: {
        actor: actorName,
        action: `STRATEGY_${action.toUpperCase()}`,
        context: {
          resource_type: "strategy",
          resource_id: updatedStrategy.id,
          strategy: {
            id: updatedStrategy.id,
            name: updatedStrategy.name,
            previous_active: strategy.is_active,
            new_active: updatedStrategy.is_active,
          },
          admin_user:
            process.env.NODE_ENV === "development"
              ? {
                  clerk_id: "dev_user",
                  email: "admin@dev.local",
                }
              : {
                  clerk_id: user?.id,
                  email: user?.emailAddresses?.[0]?.emailAddress,
                },
          ip_address:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        strategy: {
          id: updatedStrategy.id,
          name: updatedStrategy.name,
          isActive: updatedStrategy.is_active,
          updatedAt: updatedStrategy.updated_at?.toISOString(),
        },
        message: `Strategy ${strategy.name} ${action}d successfully`,
      },
    });
  } catch (error) {
    console.error("Strategy action API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "STRATEGY_ACTION_ERROR",
          message: "Failed to process strategy action",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
