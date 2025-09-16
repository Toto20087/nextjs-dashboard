import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class PortfolioService {
  // Methods for positions table
  static async getPositions(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.positions.findMany({
      skip,
      take,
      where: {
        is_active: true,
        ...where,
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  }

  static async getPositionById(id: number) {
    return await prisma.positions.findUnique({
      where: { id },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
    })
  }

  static async getPositionsByStrategy(strategyId: number) {
    return await prisma.positions.findMany({
      where: {
        strategy_id: strategyId,
        is_active: true,
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  }

  static async updatePosition(id: number, data: {
    quantity?: number
    average_cost?: number
    current_value?: number
    unrealized_pnl?: number
    realized_pnl?: number
    is_active?: boolean
  }) {
    return await prisma.positions.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  // Methods for strategy_allocations table
  static async getStrategyAllocations(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.strategy_allocations.findMany({
      skip,
      take,
      where: {
        is_active: true,
        ...where,
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  }

  static async getStrategyAllocation(strategyId: number, symbolId: number) {
    return await prisma.strategy_allocations.findFirst({
      where: {
        strategy_id: strategyId,
        symbol_id: symbolId,
        is_active: true,
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
    })
  }

  static async getAllocationsByStrategy(strategyId: number) {
    return await prisma.strategy_allocations.findMany({
      where: {
        strategy_id: strategyId,
        is_active: true,
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
      orderBy: {
        allocated_capital: 'desc',
      },
    })
  }

  static async updateStrategyAllocation(id: number, data: {
    allocated_capital?: number
    used_capital?: number
    available_capital?: number
    reserved_capital?: number
    current_position?: number
    average_cost?: number
    realized_pnl?: number
    unrealized_pnl?: number
    allocation_percentage?: number
  }) {
    return await prisma.strategy_allocations.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  // Portfolio summary methods
  static async getPortfolioSummary() {
    const allocations = await prisma.strategy_allocations.findMany({
      where: {
        is_active: true,
      },
      include: {
        strategies: {
          select: {
            id: true,
            name: true,
          },
        },
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
    })

    const totalAllocated = allocations.reduce((sum, alloc) => sum + Number(alloc.allocated_capital), 0)
    const totalUsed = allocations.reduce((sum, alloc) => sum + Number(alloc.used_capital || 0), 0)
    const totalAvailable = allocations.reduce((sum, alloc) => sum + Number(alloc.available_capital || 0), 0)
    const totalRealized = allocations.reduce((sum, alloc) => sum + Number(alloc.realized_pnl || 0), 0)
    const totalUnrealized = allocations.reduce((sum, alloc) => sum + Number(alloc.unrealized_pnl || 0), 0)

    return {
      allocations,
      summary: {
        totalAllocated,
        totalUsed,
        totalAvailable,
        totalRealized,
        totalUnrealized,
        totalPnl: totalRealized + totalUnrealized,
        utilizationRate: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0,
        returnRate: totalAllocated > 0 ? ((totalRealized + totalUnrealized) / totalAllocated) * 100 : 0,
        allocationCount: allocations.length,
      },
    }
  }

  static async getPortfolioSummaryByStrategy(strategyId: number) {
    const allocations = await prisma.strategy_allocations.findMany({
      where: {
        strategy_id: strategyId,
        is_active: true,
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
            last_price: true,
          },
        },
      },
    })

    const totalAllocated = allocations.reduce((sum, alloc) => sum + Number(alloc.allocated_capital), 0)
    const totalUsed = allocations.reduce((sum, alloc) => sum + Number(alloc.used_capital || 0), 0)
    const totalRealized = allocations.reduce((sum, alloc) => sum + Number(alloc.realized_pnl || 0), 0)
    const totalUnrealized = allocations.reduce((sum, alloc) => sum + Number(alloc.unrealized_pnl || 0), 0)

    return {
      strategyId,
      allocations,
      summary: {
        totalAllocated,
        totalUsed,
        totalRealized,
        totalUnrealized,
        totalPnl: totalRealized + totalUnrealized,
        utilizationRate: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0,
        returnRate: totalAllocated > 0 ? ((totalRealized + totalUnrealized) / totalAllocated) * 100 : 0,
      },
    }
  }

  // Capital snapshots methods
  static async getCapitalSnapshots(params: {
    strategyId?: number
    days?: number
    limit?: number
  } = {}) {
    const { strategyId, days = 30, limit } = params
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const whereClause: any = {
      created_at: {
        gte: startDate,
      },
    }
    
    if (strategyId) {
      whereClause.strategy_id = strategyId
    }

    return await prisma.strategy_capital_snapshots.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        strategy_id: true,
        snapshot_version: true,
        allocated_capital: true,
        used_capital: true,
        available_capital: true,
        reserved_capital: true,
        realized_pnl: true,
        unrealized_pnl: true,
        snapshot_reason: true,
        created_at: true,
      },
    })
  }

  static async getPerformanceMetrics(strategyId?: number, days = 30) {
    const snapshots = await this.getCapitalSnapshots({ 
      strategyId, 
      days, 
      limit: 1000 
    })

    if (snapshots.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        maxDrawdown: 0,
        currentValue: 0,
        initialValue: 0,
        snapshotsCount: 0,
        timeSeriesData: [],
      }
    }

    // Sort by date (oldest first for calculations)
    const sortedSnapshots = snapshots.reverse()
    
    const initialSnapshot = sortedSnapshots[0]
    const currentSnapshot = sortedSnapshots[sortedSnapshots.length - 1]
    
    const initialValue = Number(initialSnapshot.allocated_capital)
    const currentValue = Number(currentSnapshot.allocated_capital) + 
                        Number(currentSnapshot.realized_pnl || 0) + 
                        Number(currentSnapshot.unrealized_pnl || 0)
    
    const totalReturn = currentValue - initialValue
    const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0

    // Calculate drawdown
    let maxValue = initialValue
    let maxDrawdown = 0
    
    const timeSeriesData = sortedSnapshots.map(snapshot => {
      const snapshotValue = Number(snapshot.allocated_capital) + 
                          Number(snapshot.realized_pnl || 0) + 
                          Number(snapshot.unrealized_pnl || 0)
      
      if (snapshotValue > maxValue) {
        maxValue = snapshotValue
      }
      
      const currentDrawdown = maxValue > 0 ? ((maxValue - snapshotValue) / maxValue) * 100 : 0
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
      }

      return {
        date: snapshot.created_at.toISOString(),
        portfolioValue: snapshotValue,
        allocatedCapital: Number(snapshot.allocated_capital),
        usedCapital: Number(snapshot.used_capital || 0),
        realizedPnl: Number(snapshot.realized_pnl || 0),
        unrealizedPnl: Number(snapshot.unrealized_pnl || 0),
        cumulativeReturn: initialValue > 0 ? ((snapshotValue - initialValue) / initialValue) * 100 : 0,
        drawdown: currentDrawdown,
      }
    })

    return {
      totalReturn,
      totalReturnPercent,
      maxDrawdown,
      currentValue,
      initialValue,
      snapshotsCount: snapshots.length,
      timeSeriesData,
    }
  }

  static async getPortfolioStats() {
    const [
      totalAllocations,
      activeAllocations,
      totalPositions,
      activePositions,
    ] = await Promise.all([
      prisma.strategy_allocations.count(),
      prisma.strategy_allocations.count({ where: { is_active: true } }),
      prisma.positions.count(),
      prisma.positions.count({ where: { is_active: true } }),
    ])

    // Get total capital metrics
    const allocations = await prisma.strategy_allocations.findMany({
      where: { is_active: true },
      select: {
        allocated_capital: true,
        used_capital: true,
        realized_pnl: true,
        unrealized_pnl: true,
      },
    })

    const totalAllocated = allocations.reduce((sum, alloc) => sum + Number(alloc.allocated_capital), 0)
    const totalUsed = allocations.reduce((sum, alloc) => sum + Number(alloc.used_capital || 0), 0)
    const totalRealized = allocations.reduce((sum, alloc) => sum + Number(alloc.realized_pnl || 0), 0)
    const totalUnrealized = allocations.reduce((sum, alloc) => sum + Number(alloc.unrealized_pnl || 0), 0)

    return {
      totalAllocations,
      activeAllocations,
      totalPositions,
      activePositions,
      capitalMetrics: {
        totalAllocated,
        totalUsed,
        totalAvailable: totalAllocated - totalUsed,
        totalRealized,
        totalUnrealized,
        totalPnl: totalRealized + totalUnrealized,
        utilizationRate: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0,
        returnRate: totalAllocated > 0 ? ((totalRealized + totalUnrealized) / totalAllocated) * 100 : 0,
      },
    }
  }
}