import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

/**
 * Transaction helpers for managing complex database operations
 */

export type TransactionClient = Prisma.TransactionClient

/**
 * Generic transaction wrapper with error handling
 */
export async function withTransaction<T>(
  operation: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(operation, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseTransactionError(error.message, error.code)
    }
    throw error
  }
}

/**
 * Custom error class for transaction errors
 */
export class DatabaseTransactionError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseTransactionError'
  }
}

/**
 * Helper for creating a signal with capital allocation update
 */
export async function createSignalWithAllocation(data: {
  signal: Prisma.SignalCreateInput
  strategyId: number
  symbolId: number
  capitalDelta: number
}) {
  return await withTransaction(async (tx) => {
    // Create the signal
    const signal = await tx.signal.create({
      data: data.signal,
      include: {
        strategy: true,
        symbol: true,
      },
    })

    // Update strategy allocation
    const allocation = await tx.strategyAllocation.findFirst({
      where: {
        strategyId: data.strategyId,
        symbolId: data.symbolId,
      },
    })

    if (!allocation) {
      throw new Error('Strategy allocation not found')
    }

    // Check if there's enough available capital
    const availableCapital = allocation.allocatedCapital - allocation.usedCapital
    if (data.capitalDelta > availableCapital) {
      throw new Error('Insufficient available capital')
    }

    await tx.strategyAllocation.update({
      where: { id: allocation.id },
      data: {
        usedCapital: {
          increment: data.capitalDelta,
        },
      },
    })

    return signal
  })
}

/**
 * Helper for batch updating positions from trade executions
 */
export async function updatePositionsFromTrades(trades: Array<{
  symbolId: number
  userId: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
}>) {
  return await withTransaction(async (tx) => {
    const results = []

    for (const trade of trades) {
      // Get current position
      const currentPosition = await tx.position.findFirst({
        where: {
          symbolId: trade.symbolId,
          userId: trade.userId,
        },
      })

      const isBuy = trade.side === 'BUY'
      const currentQuantity = currentPosition?.quantity || 0
      const currentAvgCost = currentPosition?.averageCost || 0

      let newQuantity: number
      let newAvgCost: number

      if (isBuy) {
        newQuantity = currentQuantity + trade.quantity
        // Calculate weighted average cost
        if (currentQuantity > 0) {
          newAvgCost = ((currentQuantity * currentAvgCost) + (trade.quantity * trade.price)) / newQuantity
        } else {
          newAvgCost = trade.price
        }
      } else {
        newQuantity = currentQuantity - trade.quantity
        newAvgCost = currentQuantity > 0 ? currentAvgCost : 0
      }

      // Upsert position
      const updatedPosition = await tx.position.upsert({
        where: {
          symbolId_userId: {
            symbolId: trade.symbolId,
            userId: trade.userId,
          },
        },
        create: {
          symbolId: trade.symbolId,
          userId: trade.userId,
          quantity: newQuantity,
          averageCost: newAvgCost,
        },
        update: {
          quantity: newQuantity,
          averageCost: newAvgCost,
          updatedAt: new Date(),
        },
        include: {
          symbol: true,
        },
      })

      results.push(updatedPosition)
    }

    return results
  })
}

/**
 * Helper for creating a backtest with initial run
 */
export async function createBacktestWithRun(data: {
  backtest: Prisma.BacktestCreateInput
  runData: {
    status: string
    startTime: Date
    config?: any
  }
}) {
  return await withTransaction(async (tx) => {
    // Create backtest
    const backtest = await tx.backtest.create({
      data: data.backtest,
      include: {
        strategy: true,
      },
    })

    // Create initial run
    const run = await tx.backtestRun.create({
      data: {
        backtestId: backtest.id,
        ...data.runData,
      },
    })

    return { backtest, run }
  })
}

/**
 * Helper for capital reallocation between strategies
 */
export async function reallocateCapital(reallocations: Array<{
  fromStrategyId: number
  toStrategyId: number
  symbolId: number
  amount: number
}>) {
  return await withTransaction(async (tx) => {
    const results = []

    for (const reallocation of reallocations) {
      // Get source allocation
      const fromAllocation = await tx.strategyAllocation.findFirst({
        where: {
          strategyId: reallocation.fromStrategyId,
          symbolId: reallocation.symbolId,
        },
      })

      if (!fromAllocation) {
        throw new Error(`Source allocation not found for strategy ${reallocation.fromStrategyId}`)
      }

      const availableCapital = fromAllocation.allocatedCapital - fromAllocation.usedCapital
      if (reallocation.amount > availableCapital) {
        throw new Error(`Insufficient available capital in strategy ${reallocation.fromStrategyId}`)
      }

      // Reduce from source
      await tx.strategyAllocation.update({
        where: { id: fromAllocation.id },
        data: {
          allocatedCapital: {
            decrement: reallocation.amount,
          },
        },
      })

      // Add to destination (or create if doesn't exist)
      const updatedDestination = await tx.strategyAllocation.upsert({
        where: {
          strategyId_symbolId: {
            strategyId: reallocation.toStrategyId,
            symbolId: reallocation.symbolId,
          },
        },
        create: {
          strategyId: reallocation.toStrategyId,
          symbolId: reallocation.symbolId,
          allocatedCapital: reallocation.amount,
          usedCapital: 0,
        },
        update: {
          allocatedCapital: {
            increment: reallocation.amount,
          },
        },
        include: {
          strategy: true,
          symbol: true,
        },
      })

      results.push(updatedDestination)
    }

    return results
  })
}

/**
 * Helper for bulk audit log creation
 */
export async function createBulkAuditLogs(entries: Array<{
  userId: string
  action: string
  entityType: string
  entityId: string
  changes?: any
  metadata?: any
}>) {
  return await withTransaction(async (tx) => {
    return await tx.auditLog.createMany({
      data: entries.map(entry => ({
        ...entry,
        changes: entry.changes || {},
        metadata: entry.metadata || {},
      })),
    })
  })
}

/**
 * Helper for strategy cleanup (soft delete with related data handling)
 */
export async function cleanupStrategy(strategyId: number, userId: string) {
  return await withTransaction(async (tx) => {
    // Verify ownership
    const strategy = await tx.strategy.findFirst({
      where: { id: strategyId, userId, isActive: true },
      include: {
        allocations: true,
        _count: {
          select: {
            signals: {
              where: {
                // Add any conditions for pending signals
              },
            },
          },
        },
      },
    })

    if (!strategy) {
      throw new Error('Strategy not found or access denied')
    }

    if (strategy._count.signals > 0) {
      throw new Error('Cannot delete strategy with pending signals')
    }

    // Check if there's allocated capital
    const totalAllocated = strategy.allocations.reduce((sum, alloc) => sum + alloc.allocatedCapital, 0)
    if (totalAllocated > 0) {
      throw new Error('Cannot delete strategy with allocated capital. Please reallocate capital first.')
    }

    // Soft delete strategy
    const updatedStrategy = await tx.strategy.update({
      where: { id: strategyId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entityType: 'STRATEGY',
        entityId: strategyId.toString(),
        changes: {
          old: { isActive: true },
          new: { isActive: false },
        },
      },
    })

    return updatedStrategy
  })
}

/**
 * Helper for batch operations with progress tracking
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (tx: TransactionClient, item: T) => Promise<R>,
  batchSize = 10
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const batchResults = await withTransaction(async (tx) => {
      return Promise.all(batch.map(item => operation(tx, item)))
    })
    
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Helper for deadlock retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a deadlock or serialization error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const isRetryable = ['P2034', 'P2002'].includes(error.code) // Deadlock, unique constraint
        
        if (isRetryable && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
          continue
        }
      }
      
      throw error
    }
  }
  
  throw lastError!
}

/**
 * Helper to validate foreign key relationships before operations
 */
export async function validateRelationships(checks: Array<{
  model: string
  where: any
  errorMessage: string
}>) {
  return await withTransaction(async (tx) => {
    for (const check of checks) {
      let exists = false
      
      switch (check.model) {
        case 'strategy':
          exists = !!(await tx.strategy.findFirst({ where: check.where }))
          break
        case 'symbol':
          exists = !!(await tx.symbol.findFirst({ where: check.where }))
          break
        case 'user':
          exists = !!(await tx.user.findFirst({ where: check.where }))
          break
        default:
          throw new Error(`Unknown model: ${check.model}`)
      }
      
      if (!exists) {
        throw new Error(check.errorMessage)
      }
    }
  })
}