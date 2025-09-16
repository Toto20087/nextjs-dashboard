import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class StrategyService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.strategiesWhereInput
    include?: Prisma.strategiesInclude
  } = {}) {
    const { skip, take, where, include } = params

    return await prisma.strategies.findMany({
      skip,
      take,
      where: {
        is_active: true,
        ...where,
      },
      include: {
        strategy_allocations: true,
        strategy_parameters: true,
        backtests: true,
        positions: true,
        _count: {
          select: {
            backtests: true,
            positions: true,
            strategy_allocations: true,
          },
        },
        ...include,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  }

  static async findById(id: number) {
    return await prisma.strategies.findFirst({
      where: {
        id,
        is_active: true,
      },
      include: {
        strategy_allocations: {
          include: {
            symbols: {
              select: {
                symbol: true,
                name: true,
                last_price: true,
              },
            },
          },
        },
        strategy_parameters: true,
        backtests: {
          orderBy: {
            created_at: 'desc',
          },
          take: 10,
        },
        positions: {
          where: {
            is_active: true,
          },
          include: {
            symbols: {
              select: {
                symbol: true,
                name: true,
                last_price: true,
              },
            },
          },
        },
        _count: {
          select: {
            backtests: true,
            positions: {
              where: {
                is_active: true,
              },
            },
            strategy_allocations: true,
          },
        },
      },
    })
  }

  static async findByName(name: string) {
    return await prisma.strategies.findFirst({
      where: {
        name,
        is_active: true,
      },
    })
  }

  static async create(data: {
    name: string
    processed_by_rust?: boolean
  }) {
    return await prisma.strategies.create({
      data: {
        name: data.name,
        processed_by_rust: data.processed_by_rust ?? true,
        is_active: true,
      },
    })
  }

  static async update(id: number, data: any) {
    return await prisma.strategies.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  static async delete(id: number) {
    // Soft delete by setting is_active to false
    return await prisma.strategies.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    })
  }

  static async hardDelete(id: number) {
    // Check for dependent records first
    const strategy = await prisma.strategies.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            positions: {
              where: {
                quantity: {
                  not: 0,
                },
              },
            },
            strategy_allocations: true,
            backtests: true,
          },
        },
      },
    })

    if (!strategy) {
      throw new Error('Strategy not found')
    }

    if (strategy._count.positions > 0) {
      throw new Error('Cannot delete strategy with active positions')
    }

    if (strategy._count.backtests > 0) {
      throw new Error('Cannot delete strategy with existing backtests')
    }

    return await prisma.strategies.delete({
      where: { id },
    })
  }

  static async getStrategyStats() {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalStrategies,
      activeStrategies,
      newStrategiesThisMonth,
      newStrategiesLastMonth,
    ] = await Promise.all([
      prisma.strategies.count(),
      prisma.strategies.count({
        where: {
          is_active: true,
        },
      }),
      prisma.strategies.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
      prisma.strategies.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ])

    const growthRate = newStrategiesLastMonth > 0 
      ? ((newStrategiesThisMonth - newStrategiesLastMonth) / newStrategiesLastMonth) * 100 
      : 0

    return {
      totalStrategies,
      activeStrategies,
      newStrategiesThisMonth,
      newStrategiesLastMonth,
      growthRate,
    }
  }

  static async getStrategyAllocations(strategyId: number) {
    return await prisma.strategy_allocations.findMany({
      where: {
        strategy_id: strategyId,
        is_active: true,
      },
      include: {
        symbols: {
          select: {
            symbol: true,
            name: true,
            last_price: true,
            sector: true,
          },
        },
      },
      orderBy: {
        allocated_capital: 'desc',
      },
    })
  }

  static async updateStrategyAllocation(
    strategyId: number,
    symbolId: number,
    data: {
      allocated_capital?: number
      allocation_percentage?: number
      is_active?: boolean
    }
  ) {
    return await prisma.strategy_allocations.upsert({
      where: {
        unique_strategy_symbol_allocation: {
          strategy_id: strategyId,
          symbol_id: symbolId,
        },
      },
      create: {
        strategy_id: strategyId,
        symbol_id: symbolId,
        allocated_capital: data.allocated_capital || 0,
        allocation_percentage: data.allocation_percentage,
        is_active: data.is_active ?? true,
      },
      update: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  static async getStrategyParameters(strategyId: number) {
    return await prisma.strategy_parameters.findMany({
      where: {
        strategy_id: strategyId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async createStrategyParameters(
    strategyId: number,
    parameterSetName: string,
    parameters: Record<string, any>,
    regimeId?: number
  ) {
    return await prisma.strategy_parameters.create({
      data: {
        strategy_id: strategyId,
        parameter_set_name: parameterSetName,
        parameters,
        regime_id: regimeId,
        is_active: true,
      },
    })
  }

  static async updateStrategyParameters(
    id: number,
    data: {
      parameters?: Record<string, any>
      is_active?: boolean
    }
  ) {
    return await prisma.strategy_parameters.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  }

  static async searchStrategies(query: string, limit = 10) {
    return await prisma.strategies.findMany({
      where: {
        AND: [
          { is_active: true },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            backtests: true,
            positions: {
              where: {
                is_active: true,
              },
            },
            strategy_allocations: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  }

  static async getStrategyPerformanceSummary(strategyId: number) {
    const strategy = await prisma.strategies.findUnique({
      where: { id: strategyId },
      include: {
        backtests: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
          select: {
            total_return: true,
            sharpe_ratio: true,
            max_drawdown: true,
            win_rate: true,
            total_trades: true,
          },
        },
        positions: {
          where: {
            is_active: true,
          },
          include: {
            symbols: {
              select: {
                last_price: true,
              },
            },
          },
        },
        strategy_allocations: {
          where: {
            is_active: true,
          },
          select: {
            allocated_capital: true,
            used_capital: true,
            realized_pnl: true,
            unrealized_pnl: true,
          },
        },
      },
    })

    if (!strategy) {
      return null
    }

    // Calculate current performance metrics
    const totalAllocatedCapital = strategy.strategy_allocations.reduce(
      (sum: number, alloc: any) => sum + Number(alloc.allocated_capital),
      0
    )
    
    const totalUsedCapital = strategy.strategy_allocations.reduce(
      (sum: number, alloc: any) => sum + Number(alloc.used_capital || 0),
      0
    )

    const totalRealizedPnl = strategy.strategy_allocations.reduce(
      (sum: number, alloc: any) => sum + Number(alloc.realized_pnl || 0),
      0
    )

    const totalUnrealizedPnl = strategy.strategy_allocations.reduce(
      (sum: number, alloc: any) => sum + Number(alloc.unrealized_pnl || 0),
      0
    )

    const latestBacktest = strategy.backtests[0]

    return {
      strategy: {
        id: strategy.id,
        name: strategy.name,
        is_active: strategy.is_active,
      },
      currentPerformance: {
        totalAllocatedCapital,
        totalUsedCapital,
        utilization: totalAllocatedCapital > 0 ? (totalUsedCapital / totalAllocatedCapital) * 100 : 0,
        totalRealizedPnl,
        totalUnrealizedPnl,
        totalPnl: totalRealizedPnl + totalUnrealizedPnl,
        activePositions: strategy.positions.length,
      },
      backtestPerformance: latestBacktest ? {
        totalReturn: latestBacktest.total_return ? Number(latestBacktest.total_return) : null,
        sharpeRatio: latestBacktest.sharpe_ratio ? Number(latestBacktest.sharpe_ratio) : null,
        maxDrawdown: latestBacktest.max_drawdown ? Number(latestBacktest.max_drawdown) : null,
        winRate: latestBacktest.win_rate ? Number(latestBacktest.win_rate) : null,
        totalTrades: latestBacktest.total_trades,
      } : null,
    }
  }
}