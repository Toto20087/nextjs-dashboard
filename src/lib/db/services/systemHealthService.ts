import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class SystemHealthService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.system_health.findMany({
      skip,
      take,
      where,
      orderBy: {
        timestamp: 'desc',
      },
    })
  }

  static async findById(id: number) {
    return await prisma.system_health.findUnique({
      where: { id },
    })
  }

  static async create(data: {
    component: string
    status: string
    response_time_ms?: number
    error_rate?: number
    throughput_per_second?: number
    last_error?: string
    error_count?: number
    uptime_percentage?: number
    metrics?: any
  }) {
    return await prisma.system_health.create({
      data,
    })
  }

  static async recordHealthCheck(data: {
    component: string
    status: 'healthy' | 'degraded' | 'down'
    response_time_ms?: number
    error_rate?: number
    throughput_per_second?: number
    last_error?: string
    error_count?: number
    uptime_percentage?: number
    metrics?: any
  }) {
    return await prisma.system_health.create({
      data: {
        component: data.component,
        status: data.status,
        response_time_ms: data.response_time_ms,
        error_rate: data.error_rate,
        throughput_per_second: data.throughput_per_second,
        last_error: data.last_error,
        error_count: data.error_count || 0,
        uptime_percentage: data.uptime_percentage,
        metrics: data.metrics || {},
      },
    })
  }

  static async getLatestHealthStatus() {
    // Get the latest health check for each component
    const components = ['database', 'alpaca', 'backtesting', 'n8n', 'railway', 'api']
    
    const healthChecks = await Promise.all(
      components.map(async (component) => {
        const latest = await prisma.system_health.findFirst({
          where: { component },
          orderBy: { timestamp: 'desc' },
        })
        
        return {
          name: component,
          status: latest?.status || 'unknown',
          responseTime: latest?.response_time_ms || 0,
          errorRate: latest?.error_rate ? Number(latest.error_rate) : 0,
          throughput: latest?.throughput_per_second ? Number(latest.throughput_per_second) : 0,
          uptime: latest?.uptime_percentage ? Number(latest.uptime_percentage) : 0,
          lastCheck: latest?.timestamp?.toISOString() || null,
          lastError: latest?.last_error || null,
          errorCount: latest?.error_count || 0,
        }
      })
    )

    return healthChecks
  }

  static async getComponentHistory(component: string, hours = 24) {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)

    return await prisma.system_health.findMany({
      where: {
        component,
        timestamp: { gte: startDate },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        status: true,
        response_time_ms: true,
        error_rate: true,
        throughput_per_second: true,
        uptime_percentage: true,
        last_error: true,
        timestamp: true,
      },
    })
  }

  static async getSystemOverview() {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      currentHealth,
      last24HoursIncidents,
      last7DaysIncidents,
      averageResponseTimes,
      averageErrorRates,
    ] = await Promise.all([
      this.getLatestHealthStatus(),
      prisma.system_health.count({
        where: {
          status: { in: ['degraded', 'down'] },
          timestamp: { gte: last24Hours },
        },
      }),
      prisma.system_health.count({
        where: {
          status: { in: ['degraded', 'down'] },
          timestamp: { gte: last7Days },
        },
      }),
      prisma.system_health.groupBy({
        by: ['component'],
        where: {
          timestamp: { gte: last24Hours },
          response_time_ms: { not: null },
        },
        _avg: {
          response_time_ms: true,
        },
      }),
      prisma.system_health.groupBy({
        by: ['component'],
        where: {
          timestamp: { gte: last24Hours },
          error_rate: { not: null },
        },
        _avg: {
          error_rate: true,
        },
      }),
    ])

    // Calculate overall system status
    const healthyServices = currentHealth.filter(s => s.status === 'healthy').length
    const totalServices = currentHealth.length
    const overallStatus = 
      healthyServices === totalServices ? 'healthy' : 
      healthyServices > totalServices * 0.7 ? 'degraded' : 'down'

    return {
      overallStatus,
      services: currentHealth,
      incidents: {
        last24Hours: last24HoursIncidents,
        last7Days: last7DaysIncidents,
      },
      averageResponseTimes: averageResponseTimes.map(item => ({
        component: item.component,
        avgResponseTime: item._avg.response_time_ms || 0,
      })),
      averageErrorRates: averageErrorRates.map(item => ({
        component: item.component,
        avgErrorRate: item._avg.error_rate ? Number(item._avg.error_rate) : 0,
      })),
      uptime: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,
    }
  }

  static async getDatabaseConnectionInfo() {
    try {
      // Get database connection info
      const [result] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `
      
      const activeConnections = Number(result.count)
      
      // Get database size
      const [sizeResult] = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `
      
      return {
        status: 'healthy',
        connections: activeConnections,
        databaseSize: sizeResult.size,
        version: await this.getDatabaseVersion(),
      }
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        connections: 0,
        databaseSize: 'unknown',
        version: 'unknown',
      }
    }
  }

  private static async getDatabaseVersion() {
    try {
      const [result] = await prisma.$queryRaw<[{ version: string }]>`
        SELECT version() as version
      `
      return result.version
    } catch {
      return 'unknown'
    }
  }

  static async checkDatabaseHealth() {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - start

      await this.recordHealthCheck({
        component: 'database',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        response_time_ms: responseTime,
        uptime_percentage: responseTime < 100 ? 100 : 95,
      })

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database connection failed'
      
      await this.recordHealthCheck({
        component: 'database',
        status: 'down',
        last_error: errorMessage,
        error_count: 1,
        uptime_percentage: 0,
      })

      return {
        status: 'down' as const,
        error: errorMessage,
      }
    }
  }

  static async getAlerts(limit = 50) {
    // Get recent health issues that could be considered alerts
    return await prisma.system_health.findMany({
      where: {
        status: { in: ['degraded', 'down'] },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        component: true,
        status: true,
        last_error: true,
        error_count: true,
        response_time_ms: true,
        timestamp: true,
      },
    })
  }

  static async getUptimeStats(component?: string, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const where: any = {
      timestamp: { gte: startDate },
    }
    
    if (component) {
      where.component = component
    }

    const [totalChecks, healthyChecks] = await Promise.all([
      prisma.system_health.count({ where }),
      prisma.system_health.count({
        where: {
          ...where,
          status: 'healthy',
        },
      }),
    ])

    const uptimePercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0

    return {
      totalChecks,
      healthyChecks,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      period: `${days} days`,
    }
  }

  static async getComponentMetrics(component: string, hours = 24) {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)

    const metrics = await prisma.system_health.aggregate({
      where: {
        component,
        timestamp: { gte: startDate },
        response_time_ms: { not: null },
      },
      _avg: {
        response_time_ms: true,
        error_rate: true,
        throughput_per_second: true,
        uptime_percentage: true,
      },
      _max: {
        response_time_ms: true,
        error_rate: true,
      },
      _min: {
        response_time_ms: true,
        uptime_percentage: true,
      },
    })

    return {
      component,
      period: `${hours} hours`,
      averageResponseTime: metrics._avg.response_time_ms || 0,
      maxResponseTime: metrics._max.response_time_ms || 0,
      minResponseTime: metrics._min.response_time_ms || 0,
      averageErrorRate: metrics._avg.error_rate ? Number(metrics._avg.error_rate) : 0,
      maxErrorRate: metrics._max.error_rate ? Number(metrics._max.error_rate) : 0,
      averageThroughput: metrics._avg.throughput_per_second ? Number(metrics._avg.throughput_per_second) : 0,
      averageUptime: metrics._avg.uptime_percentage ? Number(metrics._avg.uptime_percentage) : 0,
      minUptime: metrics._min.uptime_percentage ? Number(metrics._min.uptime_percentage) : 0,
    }
  }

  static async cleanupOldHealthChecks(retentionDays = 30) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.system_health.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    return deleted.count
  }

  static async getSystemHealthStats() {
    const now = new Date()
    const thisHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const lastHour = new Date(thisHour.getTime() - 60 * 60 * 1000)

    const [
      totalRecords,
      healthyRecords,
      recordsThisHour,
      recordsLastHour,
      componentBreakdown,
    ] = await Promise.all([
      prisma.system_health.count(),
      prisma.system_health.count({ where: { status: 'healthy' } }),
      prisma.system_health.count({
        where: {
          timestamp: {
            gte: thisHour,
          },
        },
      }),
      prisma.system_health.count({
        where: {
          timestamp: {
            gte: lastHour,
            lt: thisHour,
          },
        },
      }),
      prisma.system_health.groupBy({
        by: ['component'],
        _count: {
          component: true,
        },
        orderBy: {
          _count: {
            component: 'desc',
          },
        },
      }),
    ])

    const overallHealthRate = totalRecords > 0 ? (healthyRecords / totalRecords) * 100 : 0

    return {
      totalRecords,
      healthyRecords,
      overallHealthRate,
      recordsThisHour,
      recordsLastHour,
      componentBreakdown: componentBreakdown.map(item => ({
        component: item.component,
        count: item._count.component,
      })),
    }
  }
}