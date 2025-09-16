import { prisma } from '../prisma'
import type { users, Prisma } from '@prisma/client'

export class UserService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.usersWhereInput
    include?: Prisma.usersInclude
  } = {}) {
    const { skip, take, where, include } = params

    return await prisma.users.findMany({
      skip,
      take,
      where,
      include: {
        _count: {
          select: {
            api_keys: true,
            sessions: true,
            audit_actions: true,
          },
        },
        ...include,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async findById(id: number) {
    return await prisma.users.findUnique({
      where: { id },
      include: {
        api_keys: {
          where: {
            is_active: true,
          },
          select: {
            id: true,
            name: true,
            created_at: true,
          },
        },
        _count: {
          select: {
            api_keys: true,
            sessions: true,
            audit_actions: true,
          },
        },
      },
    })
  }

  static async findByClerkId(clerkUserId: string) {
    return await prisma.users.findUnique({
      where: { clerk_user_id: clerkUserId },
    })
  }

  static async findByEmail(email: string) {
    return await prisma.users.findUnique({
      where: { email },
    })
  }

  static async create(data: Prisma.usersCreateInput) {
    return await prisma.users.create({
      data,
    })
  }

  static async update(id: number, data: Prisma.usersUpdateInput) {
    return await prisma.users.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  static async delete(id: number) {
    // Check if user has any active sessions or API keys
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sessions: {
              where: {
                is_active: true,
              },
            },
            api_keys: {
              where: {
                is_active: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user._count.sessions > 0 || user._count.api_keys > 0) {
      throw new Error('Cannot delete user with active sessions or API keys')
    }

    return await prisma.users.delete({
      where: { id },
    })
  }

  static async upsertFromClerk(clerkData: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }) {
    const name = `${clerkData.firstName || ''} ${clerkData.lastName || ''}`.trim()
    
    return await prisma.users.upsert({
      where: { clerk_user_id: clerkData.id },
      create: {
        clerk_user_id: clerkData.id,
        email: clerkData.email,
        name: name || 'User',
        avatar_url: clerkData.imageUrl,
        email_verified: true,
      },
      update: {
        email: clerkData.email,
        name: name || 'User',
        avatar_url: clerkData.imageUrl,
        updated_at: new Date(),
      },
    })
  }

  static async getUserStats() {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: {
          is_active: true,
          last_login: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.users.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
      prisma.users.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ])

    const growthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 0

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      growthRate,
    }
  }

  static async updateLastLogin(userId: number, ipAddress?: string, userAgent?: string) {
    return await prisma.users.update({
      where: { id: userId },
      data: {
        last_login: new Date(),
        login_count: {
          increment: 1,
        },
        updated_at: new Date(),
      },
    })
  }

  static async getUserActivity(userId: number, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get recent activities from audit log
    const auditEntries = await prisma.audit_actions.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: startDate,
        },
      },
      take: 100,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        action_type: true,
        resource_type: true,
        resource_id: true,
        timestamp: true,
        success: true,
      },
    })

    return {
      auditEntries,
      activitySummary: {
        totalActions: auditEntries.length,
        successfulActions: auditEntries.filter(entry => entry.success).length,
        failedActions: auditEntries.filter(entry => !entry.success).length,
      },
    }
  }

  static async searchUsers(query: string, limit = 10) {
    return await prisma.users.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        is_active: true,
      },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        created_at: true,
        last_login: true,
        role: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async updateUserRole(userId: number, role: string) {
    return await prisma.users.update({
      where: { id: userId },
      data: {
        role,
        updated_at: new Date(),
      },
    })
  }

  static async toggleUserStatus(userId: number) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_active: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return await prisma.users.update({
      where: { id: userId },
      data: {
        is_active: !user.is_active,
        updated_at: new Date(),
      },
    })
  }

  static async getUsersByRole(role: string) {
    return await prisma.users.findMany({
      where: {
        role,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        created_at: true,
        last_login: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }
}