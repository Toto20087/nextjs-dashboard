import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class AuditService {
  // Methods for audit_actions table (detailed action tracking)
  static async findAllActions(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.audit_actions.findMany({
      skip,
      take,
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })
  }

  static async findActionById(id: number) {
    return await prisma.audit_actions.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
  }

  static async logAction(data: {
    user_id?: number
    session_id?: number
    api_key_id?: number
    action_type: string
    resource_type?: string
    resource_id?: string
    ip_address?: string
    user_agent?: string
    request_method?: string
    request_path?: string
    success?: boolean
    error_code?: string
    error_message?: string
    request_data?: any
    response_data?: any
  }) {
    return await prisma.audit_actions.create({
      data,
    })
  }

  // Methods for audit_log table (simple action logging)
  static async findAllLogs(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.audit_log.findMany({
      skip,
      take,
      where,
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async findLogById(id: string) {
    return await prisma.audit_log.findUnique({
      where: { id: BigInt(id) },
    })
  }

  static async logSimple(data: {
    actor?: string
    action: string
    context?: any
  }) {
    return await prisma.audit_log.create({
      data: {
        actor: data.actor,
        action: data.action,
        context: data.context || {},
      },
    })
  }

  // Convenience methods for common actions
  static async logStrategyAction(
    userId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE',
    strategyId: number,
    sessionId?: number,
    ipAddress?: string,
    metadata?: any
  ) {
    return await this.logAction({
      user_id: userId,
      session_id: sessionId,
      action_type: action,
      resource_type: 'STRATEGY',
      resource_id: strategyId.toString(),
      ip_address: ipAddress,
      success: true,
      request_data: metadata,
    })
  }

  static async logSignalAction(
    userId: number,
    action: 'CREATE' | 'UPDATE' | 'PROCESS' | 'EXECUTE',
    signalId: string,
    sessionId?: number,
    ipAddress?: string,
    metadata?: any
  ) {
    return await this.logAction({
      user_id: userId,
      session_id: sessionId,
      action_type: action,
      resource_type: 'SIGNAL',
      resource_id: signalId,
      ip_address: ipAddress,
      success: true,
      request_data: metadata,
    })
  }

  static async logBacktestAction(
    userId: number,
    action: 'CREATE' | 'START' | 'COMPLETE' | 'FAIL' | 'DELETE',
    backtestId: number,
    sessionId?: number,
    ipAddress?: string,
    metadata?: any
  ) {
    return await this.logAction({
      user_id: userId,
      session_id: sessionId,
      action_type: action,
      resource_type: 'BACKTEST',
      resource_id: backtestId.toString(),
      ip_address: ipAddress,
      success: action !== 'FAIL',
      request_data: metadata,
    })
  }

  static async logUserAction(
    actorUserId: number,
    action: 'LOGIN' | 'LOGOUT' | 'UPDATE' | 'DELETE' | 'ROLE_CHANGE',
    targetUserId: number,
    sessionId?: number,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ) {
    return await this.logAction({
      user_id: actorUserId,
      session_id: sessionId,
      action_type: action,
      resource_type: 'USER',
      resource_id: targetUserId.toString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
    })
  }

  static async logApiAction(
    apiKeyId: number,
    action: string,
    resourceType?: string,
    resourceId?: string,
    requestMethod?: string,
    requestPath?: string,
    ipAddress?: string,
    success: boolean = true,
    errorCode?: string,
    errorMessage?: string
  ) {
    return await this.logAction({
      api_key_id: apiKeyId,
      action_type: action,
      resource_type: resourceType,
      resource_id: resourceId,
      request_method: requestMethod,
      request_path: requestPath,
      ip_address: ipAddress,
      success,
      error_code: errorCode,
      error_message: errorMessage,
    })
  }

  // Analytics and reporting methods
  static async getActionsSummary(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalActions,
      uniqueUsers,
      actionBreakdown,
      resourceBreakdown,
      successfulActions,
    ] = await Promise.all([
      prisma.audit_actions.count({
        where: {
          timestamp: { gte: startDate },
        },
      }),
      prisma.audit_actions.findMany({
        where: {
          timestamp: { gte: startDate },
        },
        select: { user_id: true },
        distinct: ['user_id'],
      }),
      prisma.audit_actions.groupBy({
        by: ['action_type'],
        where: {
          timestamp: { gte: startDate },
        },
        _count: {
          action_type: true,
        },
        orderBy: {
          _count: {
            action_type: 'desc',
          },
        },
      }),
      prisma.audit_actions.groupBy({
        by: ['resource_type'],
        where: {
          timestamp: { gte: startDate },
          resource_type: { not: null },
        },
        _count: {
          resource_type: true,
        },
        orderBy: {
          _count: {
            resource_type: 'desc',
          },
        },
      }),
      prisma.audit_actions.count({
        where: {
          timestamp: { gte: startDate },
          success: true,
        },
      }),
    ])

    return {
      totalActions,
      uniqueUsers: uniqueUsers.filter(u => u.user_id).length,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action_type,
        count: item._count.action_type,
      })),
      resourceBreakdown: resourceBreakdown.map(item => ({
        resourceType: item.resource_type,
        count: item._count.resource_type,
      })),
      successRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
    }
  }

  static async getUserActionTrail(userId: number, params: {
    skip?: number
    take?: number
    actionType?: string
    resourceType?: string
    startDate?: Date
    endDate?: Date
    success?: boolean
  } = {}) {
    const { skip, take, actionType, resourceType, startDate, endDate, success } = params
    
    const where: any = { user_id: userId }
    
    if (actionType) where.action_type = actionType
    if (resourceType) where.resource_type = resourceType
    if (success !== undefined) where.success = success
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    return await prisma.audit_actions.findMany({
      where,
      skip,
      take,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        action_type: true,
        resource_type: true,
        resource_id: true,
        success: true,
        error_code: true,
        error_message: true,
        timestamp: true,
        ip_address: true,
      },
    })
  }

  static async getResourceAuditTrail(resourceType: string, resourceId: string) {
    return await prisma.audit_actions.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })
  }

  static async getFilters() {
    const [users, actionTypes, resourceTypes] = await Promise.all([
      prisma.audit_actions.findMany({
        select: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        where: {
          user_id: { not: null },
        },
        distinct: ['user_id'],
        take: 100,
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.audit_actions.findMany({
        select: { action_type: true },
        distinct: ['action_type'],
      }),
      prisma.audit_actions.findMany({
        select: { resource_type: true },
        distinct: ['resource_type'],
        where: {
          resource_type: { not: null },
        },
      }),
    ])

    return {
      users: users.map(entry => entry.users).filter(user => user),
      actionTypes: actionTypes.map(entry => entry.action_type),
      resourceTypes: resourceTypes.map(entry => entry.resource_type),
    }
  }

  static async cleanupOldActions(retentionDays = 365) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const deletedActions = await prisma.audit_actions.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    return deletedActions.count
  }

  static async cleanupOldLogs(retentionDays = 365) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const deletedLogs = await prisma.audit_log.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    })

    return deletedLogs.count
  }

  static async getAuditStats() {
    const [
      totalActions,
      totalLogs,
      actionsToday,
      logsToday,
    ] = await Promise.all([
      prisma.audit_actions.count(),
      prisma.audit_log.count(),
      prisma.audit_actions.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.audit_log.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    return {
      totalActions,
      totalLogs,
      actionsToday,
      logsToday,
      totalEntries: totalActions + totalLogs,
      entriesToday: actionsToday + logsToday,
    }
  }
}