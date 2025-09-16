import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class SignalService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.signals.findMany({
      skip,
      take,
      where,
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async findById(id: string) {
    return await prisma.signals.findUnique({
      where: { id },
    })
  }

  static async create(data: {
    strategy_id: number
    symbol_id: number
    ticker_symbol: string
    signal_type: string
    quantity: number
    source?: string
    urgency?: string
    confidence_score?: number
    order_type?: string
    limit_price?: number
    stop_price?: number
    time_in_force?: string
    stop_loss?: number
    take_profit?: number
    trail_percent?: number
    trail_amount?: number
    max_slippage?: number
    extended_hours?: boolean
    market_session?: string
    strategy_config?: any
    execution_config?: any
    risk_config?: any
    metadata?: any
  }) {
    return await prisma.signals.create({
      data: {
        strategy_id: data.strategy_id,
        symbol_id: data.symbol_id,
        ticker_symbol: data.ticker_symbol,
        signal_type: data.signal_type,
        quantity: data.quantity,
        source: data.source,
        urgency: data.urgency,
        confidence_score: data.confidence_score,
        order_type: data.order_type,
        limit_price: data.limit_price,
        stop_price: data.stop_price,
        time_in_force: data.time_in_force,
        stop_loss: data.stop_loss,
        take_profit: data.take_profit,
        trail_percent: data.trail_percent,
        trail_amount: data.trail_amount,
        max_slippage: data.max_slippage,
        extended_hours: data.extended_hours,
        market_session: data.market_session,
        processing_status: 'created',
        strategy_config: data.strategy_config,
        execution_config: data.execution_config,
        risk_config: data.risk_config,
        metadata: data.metadata,
      },
    })
  }

  static async update(id: string, data: {
    processing_status?: string
    processing_started_at?: Date
    processing_completed_at?: Date
    processed_by?: string
    failure_reason?: string
    strategy_config?: any
    execution_config?: any
    risk_config?: any
    metadata?: any
  }) {
    return await prisma.signals.update({
      where: { id },
      data,
    })
  }

  static async updateProcessingStatus(
    id: string, 
    status: 'created' | 'processing' | 'completed' | 'failed' | 'cancelled',
    processed_by?: string,
    failure_reason?: string
  ) {
    const updateData: any = {
      processing_status: status,
    }

    if (status === 'processing') {
      updateData.processing_started_at = new Date()
      updateData.processed_by = processed_by
    } else if (status === 'completed') {
      updateData.processing_completed_at = new Date()
    } else if (status === 'failed') {
      updateData.processing_completed_at = new Date()
      updateData.failure_reason = failure_reason
    }

    return await prisma.signals.update({
      where: { id },
      data: updateData,
    })
  }

  static async getRecentSignals(limit = 50) {
    return await prisma.signals.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        strategy_id: true,
        symbol_id: true,
        ticker_symbol: true,
        signal_type: true,
        quantity: true,
        processing_status: true,
        confidence_score: true,
        created_at: true,
      },
    })
  }

  static async getSignalsByStrategy(strategyId: number) {
    return await prisma.signals.findMany({
      where: {
        strategy_id: strategyId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getSignalsBySymbol(symbolId: number) {
    return await prisma.signals.findMany({
      where: {
        symbol_id: symbolId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getSignalMetrics() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalSignals,
      todaySignals,
      weekSignals,
      pendingSignals,
      processingSignals,
      completedSignals,
      failedSignals,
    ] = await Promise.all([
      prisma.signals.count(),
      prisma.signals.count({
        where: {
          created_at: {
            gte: todayStart,
          },
        },
      }),
      prisma.signals.count({
        where: {
          created_at: {
            gte: weekStart,
          },
        },
      }),
      prisma.signals.count({
        where: {
          processing_status: 'created',
        },
      }),
      prisma.signals.count({
        where: {
          processing_status: 'processing',
        },
      }),
      prisma.signals.count({
        where: {
          processing_status: 'completed',
        },
      }),
      prisma.signals.count({
        where: {
          processing_status: 'failed',
        },
      }),
    ])

    return {
      totalSignals,
      todaySignals,
      weekSignals,
      pendingSignals,
      processingSignals,
      completedSignals,
      failedSignals,
      successRate: totalSignals > 0 ? (completedSignals / totalSignals) * 100 : 0,
    }
  }

  static async getSignalsByProcessingStatus(status: string) {
    return await prisma.signals.findMany({
      where: {
        processing_status: status,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async searchSignals(query: string, limit = 10) {
    return await prisma.signals.findMany({
      where: {
        OR: [
          {
            ticker_symbol: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            signal_type: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            source: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getSignalStats() {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalSignals,
      newSignalsThisMonth,
      newSignalsLastMonth,
    ] = await Promise.all([
      prisma.signals.count(),
      prisma.signals.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
      prisma.signals.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ])

    const growthRate = newSignalsLastMonth > 0 
      ? ((newSignalsThisMonth - newSignalsLastMonth) / newSignalsLastMonth) * 100 
      : 0

    return {
      totalSignals,
      newSignalsThisMonth,
      newSignalsLastMonth,
      growthRate,
    }
  }

  static async bulkUpdateProcessingStatus(
    ids: string[],
    status: string,
    processed_by?: string
  ) {
    return await prisma.signals.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        processing_status: status,
        processed_by,
        processing_started_at: status === 'processing' ? new Date() : undefined,
        processing_completed_at: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    })
  }
}