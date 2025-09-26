import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
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
            message: "Admin access required for user management",
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search");

    // Build where clause for filtering
    const whereClause: any = {};

    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    if (statusFilter === "active") {
      whereClause.is_active = true;
    } else if (statusFilter === "inactive") {
      whereClause.is_active = false;
    }

    if (searchQuery) {
      whereClause.OR = [
        {
          first_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          last_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    // Fetch users with pagination and filtering
    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        select: {
          id: true,
          clerk_user_id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          timezone: true,
          locale: true,
          can_trade: true,
          can_approve_strategies: true,
          can_override_risk: true,
          max_order_value: true,
          is_active: true,
          last_login: true,
          login_count: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.users.count({
        where: whereClause,
      }),
    ]);

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeUsers, newUsersThisMonth, roleDistribution] =
      await Promise.all([
        prisma.users.count({
          where: { is_active: true },
        }),
        prisma.users.count({
          where: {
            created_at: {
              gte: thisMonth,
            },
          },
        }),
        prisma.users.groupBy({
          by: ["role"],
          _count: {
            role: true,
          },
          where: {
            is_active: true,
          },
        }),
      ]);

    // Format users for response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      clerkId: user.clerk_user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      timezone: user.timezone,
      locale: user.locale,
      permissions: {
        canTrade: user.can_trade,
        canApproveStrategies: user.can_approve_strategies,
        canOverrideRisk: user.can_override_risk,
      },
      maxOrderValue: user.max_order_value ? Number(user.max_order_value) : null,
      isActive: user.is_active,
      lastLogin: user.last_login?.toISOString() || null,
      loginCount: user.login_count || 0,
      createdAt: user.created_at?.toISOString(),
      updatedAt: user.updated_at?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        statistics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          newUsersThisMonth,
          roleDistribution: roleDistribution.reduce(
            (acc, item) => ({
              ...acc,
              [item.role]: item._count.role,
            }),
            {}
          ),
        },
        pagination: {
          page,
          limit,
          offset,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
          hasNext: offset + limit < totalUsers,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("User management API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "USER_MANAGEMENT_ERROR",
          message: "Failed to fetch user management data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Check if user has admin role
    const dbUser = await prisma.users.findUnique({
      where: {
        clerk_user_id: user.id,
        is_active: true,
      },
      select: {
        role: true,
        can_override_risk: true,
      },
    });

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
            message: "Admin access required for user management",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, role, permissions, maxOrderValue, department, isActive } =
      body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_FIELD", message: "User ID is required" },
        },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ["super_admin", "admin", "trader", "analyst", "viewer"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: `Role must be one of: ${validRoles.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        role: true,
        clerk_user_id: true,
        email: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    // Prevent non-super-admin from modifying super-admin users or creating super-admin users
    if (dbUser.role !== "super_admin") {
      if (targetUser.role === "super_admin") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot modify super admin users",
            },
          },
          { status: 403 }
        );
      }
      if (role === "super_admin") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot assign super admin role",
            },
          },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date(),
    };

    if (role !== undefined) {
      updateData.role = role;
    }

    if (permissions !== undefined) {
      updateData.can_trade = permissions.canTrade ?? false;
      updateData.can_approve_strategies =
        permissions.canApproveStrategies ?? false;
      updateData.can_override_risk = permissions.canOverrideRisk ?? false;
    }

    if (maxOrderValue !== undefined) {
      updateData.max_order_value = maxOrderValue;
    }

    if (department !== undefined) {
      updateData.department = department;
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        clerk_user_id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        can_trade: true,
        can_approve_strategies: true,
        can_override_risk: true,
        max_order_value: true,
        is_active: true,
        updated_at: true,
      },
    });

    // Log the admin action for audit trail
    await prisma.audit_log.create({
      data: {
        actor:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.emailAddresses?.[0]?.emailAddress ||
          "Unknown Admin",
        action: "UPDATE_USER_PERMISSIONS",
        context: {
          resource_type: "user",
          resource_id: updatedUser.id,
          target_user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: `${updatedUser.name || ""} ${updatedUser.name || ""}`.trim(),
          },
          changes: updateData,
          admin_user: {
            clerk_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress,
          },
          ip_address:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        },
      },
    });

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      clerkId: updatedUser.clerk_user_id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      department: updatedUser.department,
      permissions: {
        canTrade: updatedUser.can_trade,
        canApproveStrategies: updatedUser.can_approve_strategies,
        canOverrideRisk: updatedUser.can_override_risk,
      },
      maxOrderValue: updatedUser.max_order_value
        ? Number(updatedUser.max_order_value)
        : null,
      isActive: updatedUser.is_active,
      updatedAt: updatedUser.updated_at?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        user: formattedUser,
        message: `User ${
          formattedUser.name || formattedUser.email
        } updated successfully`,
      },
    });
  } catch (error) {
    console.error("User update API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "USER_UPDATE_ERROR",
          message: "Failed to update user",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
