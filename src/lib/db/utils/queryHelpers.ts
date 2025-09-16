import { Prisma } from '@prisma/client'

/**
 * Common query helpers for building dynamic Prisma queries
 */

export interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
  take?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  status?: string
  userId?: string
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = params.skip ?? (page - 1) * limit
  const take = params.take ?? limit

  return {
    page,
    limit,
    skip,
    take,
    offset: skip, // Alias for compatibility
  }
}

/**
 * Build date range filter
 */
export function buildDateFilter(dateFrom?: Date | string, dateTo?: Date | string) {
  const filter: { gte?: Date; lte?: Date } = {}
  
  if (dateFrom) {
    filter.gte = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom
  }
  
  if (dateTo) {
    filter.lte = typeof dateTo === 'string' ? new Date(dateTo) : dateTo
  }
  
  return Object.keys(filter).length > 0 ? filter : undefined
}

/**
 * Build text search filter for multiple fields
 */
export function buildSearchFilter(search: string, fields: string[]) {
  if (!search.trim()) return undefined
  
  const searchTerms = search.trim().toLowerCase().split(/\s+/)
  
  return {
    OR: fields.flatMap(field => 
      searchTerms.map(term => ({
        [field]: {
          contains: term,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      }))
    ),
  }
}

/**
 * Build user ownership filter
 */
export function buildUserFilter(userId?: string) {
  if (!userId) return {}
  
  return {
    userId,
  }
}

/**
 * Build nested user filter (for resources owned through relationships)
 */
export function buildNestedUserFilter(userId?: string, relationPath = 'strategy') {
  if (!userId) return {}
  
  return {
    [relationPath]: {
      userId,
      isActive: true,
    },
  }
}

/**
 * Build sort configuration
 */
export function buildSortConfig(params: SortParams, defaultSort = 'createdAt', defaultOrder: 'asc' | 'desc' = 'desc') {
  const sortBy = params.sortBy || defaultSort
  const sortOrder = params.sortOrder || defaultOrder
  
  return {
    [sortBy]: sortOrder,
  }
}

/**
 * Build status filter
 */
export function buildStatusFilter(status?: string, activeOnly = false) {
  const filter: any = {}
  
  if (activeOnly) {
    filter.isActive = true
  }
  
  if (status) {
    filter.status = status
  }
  
  return filter
}

/**
 * Combine multiple where conditions
 */
export function combineWhereConditions(...conditions: (any | undefined)[]) {
  const validConditions = conditions.filter(Boolean)
  
  if (validConditions.length === 0) return {}
  if (validConditions.length === 1) return validConditions[0]
  
  return {
    AND: validConditions,
  }
}

/**
 * Build include configuration for common relations
 */
export const CommonIncludes = {
  strategy: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  
  strategyWithDetails: {
    include: {
      allocations: {
        include: {
          symbol: {
            select: {
              id: true,
              symbol: true,
              name: true,
            },
          },
        },
      },
      parameters: true,
      _count: {
        select: {
          signals: true,
          backtests: true,
        },
      },
    },
  },
  
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  },
  
  symbol: {
    select: {
      id: true,
      symbol: true,
      name: true,
    },
  },
  
  signal: {
    include: {
      strategy: {
        select: {
          id: true,
          name: true,
        },
      },
      symbol: {
        select: {
          id: true,
          symbol: true,
          name: true,
        },
      },
    },
  },
  
  backtest: {
    include: {
      strategy: {
        select: {
          id: true,
          name: true,
        },
      },
      backtestRuns: {
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
        },
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  },
}

/**
 * Helper to build complex filters for analytics queries
 */
export class QueryBuilder {
  private where: any = {}
  private include: any = {}
  private orderBy: any = {}
  private pagination: any = {}

  constructor() {}

  addUserFilter(userId?: string, relationPath?: string) {
    if (userId) {
      if (relationPath) {
        this.where = combineWhereConditions(this.where, buildNestedUserFilter(userId, relationPath))
      } else {
        this.where = combineWhereConditions(this.where, buildUserFilter(userId))
      }
    }
    return this
  }

  addDateFilter(field: string, dateFrom?: Date | string, dateTo?: Date | string) {
    const dateFilter = buildDateFilter(dateFrom, dateTo)
    if (dateFilter) {
      this.where = combineWhereConditions(this.where, {
        [field]: dateFilter,
      })
    }
    return this
  }

  addSearchFilter(search: string, fields: string[]) {
    const searchFilter = buildSearchFilter(search, fields)
    if (searchFilter) {
      this.where = combineWhereConditions(this.where, searchFilter)
    }
    return this
  }

  addStatusFilter(status?: string, activeOnly = false) {
    const statusFilter = buildStatusFilter(status, activeOnly)
    this.where = combineWhereConditions(this.where, statusFilter)
    return this
  }

  addCustomFilter(filter: any) {
    this.where = combineWhereConditions(this.where, filter)
    return this
  }

  addInclude(includeConfig: any) {
    this.include = { ...this.include, ...includeConfig }
    return this
  }

  addSort(params: SortParams, defaultSort?: string, defaultOrder?: 'asc' | 'desc') {
    this.orderBy = buildSortConfig(params, defaultSort, defaultOrder)
    return this
  }

  addPagination(params: PaginationParams) {
    this.pagination = normalizePagination(params)
    return this
  }

  build() {
    return {
      where: this.where,
      include: Object.keys(this.include).length > 0 ? this.include : undefined,
      orderBy: Object.keys(this.orderBy).length > 0 ? this.orderBy : undefined,
      ...this.pagination,
    }
  }

  buildWhere() {
    return this.where
  }
}

/**
 * Helper function to create a new QueryBuilder
 */
export function createQueryBuilder() {
  return new QueryBuilder()
}