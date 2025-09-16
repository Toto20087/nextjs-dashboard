import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export class NewsService {
  static async findAll(params: {
    skip?: number
    take?: number
    where?: any
  } = {}) {
    const { skip, take, where } = params

    return await prisma.news_articles.findMany({
      skip,
      take,
      where,
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
      orderBy: {
        published_at: 'desc',
      },
    })
  }

  static async findById(id: number) {
    return await prisma.news_articles.findUnique({
      where: { id },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
    })
  }

  static async findByExternalId(externalId: string) {
    return await prisma.news_articles.findUnique({
      where: { external_id: externalId },
    })
  }

  static async findByUrl(url: string) {
    return await prisma.news_articles.findFirst({
      where: { url },
    })
  }

  static async create(data: {
    title: string
    content?: string
    source?: string
    url?: string
    published_at?: Date
    category?: string
    sentiment_score?: number
    confidence_score?: number
    relevance_score?: number
    impact_score?: number
    external_id?: string
    symbol_id?: number
    tags?: string[]
    metadata?: any
  }) {
    return await prisma.news_articles.create({
      data: {
        ...data,
        published_at: data.published_at || new Date(),
        processed: false,
      },
    })
  }

  static async update(id: number, data: {
    title?: string
    content?: string
    source?: string
    url?: string
    published_at?: Date
    category?: string
    sentiment_score?: number
    confidence_score?: number
    relevance_score?: number
    impact_score?: number
    processed?: boolean
    processed_at?: Date
    tags?: string[]
    metadata?: any
    symbol_id?: number
  }) {
    return await prisma.news_articles.update({
      where: { id },
      data,
    })
  }

  static async delete(id: number) {
    return await prisma.news_articles.delete({
      where: { id },
    })
  }

  static async upsertArticle(data: {
    external_id: string
    title: string
    content?: string
    source?: string
    url?: string
    published_at?: Date
    category?: string
    sentiment_score?: number
    confidence_score?: number
    relevance_score?: number
    impact_score?: number
    symbol_id?: number
    tags?: string[]
    metadata?: any
  }) {
    return await prisma.news_articles.upsert({
      where: { external_id: data.external_id },
      create: {
        ...data,
        published_at: data.published_at || new Date(),
        processed: false,
      },
      update: {
        ...data,
      },
    })
  }

  static async getRecentArticles(limit = 50) {
    return await prisma.news_articles.findMany({
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
    })
  }

  static async getArticlesBySentimentScore(
    minScore?: number,
    maxScore?: number,
    limit = 20
  ) {
    const where: any = {
      sentiment_score: { not: null },
    }

    if (minScore !== undefined && maxScore !== undefined) {
      where.sentiment_score = { gte: minScore, lte: maxScore }
    } else if (minScore !== undefined) {
      where.sentiment_score = { gte: minScore }
    } else if (maxScore !== undefined) {
      where.sentiment_score = { lte: maxScore }
    }

    return await prisma.news_articles.findMany({
      where,
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
    })
  }

  static async getArticlesBySymbol(symbolId: number, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        symbol_id: symbolId,
      },
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
      include: {
        symbols: {
          select: {
            id: true,
            symbol: true,
            name: true,
          },
        },
      },
    })
  }

  static async getArticlesByCategory(category: string, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        category: {
          equals: category,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
    })
  }

  static async getArticlesBySource(source: string, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        source: {
          equals: source,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
    })
  }

  static async getArticlesByTag(tag: string, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
    })
  }

  static async searchArticles(query: string, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: limit,
      orderBy: {
        published_at: 'desc',
      },
      select: {
        id: true,
        title: true,
        url: true,
        published_at: true,
        source: true,
        category: true,
        sentiment_score: true,
        tags: true,
        symbols: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    })
  }

  static async getNewsSummary(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalArticles,
      processedArticles,
      categoryBreakdown,
      sourceBreakdown,
      averageSentimentScore,
      recentArticles,
    ] = await Promise.all([
      prisma.news_articles.count({
        where: {
          published_at: { gte: startDate },
        },
      }),
      prisma.news_articles.count({
        where: {
          published_at: { gte: startDate },
          processed: true,
        },
      }),
      prisma.news_articles.groupBy({
        by: ['category'],
        where: {
          published_at: { gte: startDate },
          category: { not: null },
        },
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
      }),
      prisma.news_articles.groupBy({
        by: ['source'],
        where: {
          published_at: { gte: startDate },
          source: { not: null },
        },
        _count: {
          source: true,
        },
        take: 10,
        orderBy: {
          _count: {
            source: 'desc',
          },
        },
      }),
      prisma.news_articles.aggregate({
        where: {
          published_at: { gte: startDate },
          sentiment_score: { not: null },
        },
        _avg: {
          sentiment_score: true,
        },
      }),
      prisma.news_articles.findMany({
        where: {
          published_at: { gte: startDate },
        },
        take: 5,
        orderBy: {
          published_at: 'desc',
        },
        select: {
          id: true,
          title: true,
          published_at: true,
          sentiment_score: true,
          impact_score: true,
          symbols: {
            select: {
              symbol: true,
            },
          },
        },
      }),
    ])

    return {
      totalArticles,
      processedArticles,
      processingRate: totalArticles > 0 ? (processedArticles / totalArticles) * 100 : 0,
      averageSentimentScore: averageSentimentScore._avg.sentiment_score ? Number(averageSentimentScore._avg.sentiment_score) : null,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      sourceBreakdown: sourceBreakdown.map(item => ({
        source: item.source,
        count: item._count.source,
      })),
      recentArticles,
    }
  }

  static async getTagMentions(limit = 10) {
    const articles = await prisma.news_articles.findMany({
      where: {
        NOT: {
          tags: { isEmpty: true },
        },
      },
      take: 500,
      orderBy: {
        published_at: 'desc',
      },
      select: {
        tags: true,
      },
    })

    // Count tag mentions
    const tagCounts: Record<string, number> = {}
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, mentions: count }))

    return sortedTags
  }

  static async updateScores(
    id: number,
    scores: {
      sentiment_score?: number
      confidence_score?: number
      relevance_score?: number
      impact_score?: number
    }
  ) {
    return await this.update(id, scores)
  }

  static async markAsProcessed(id: number) {
    return await this.update(id, {
      processed: true,
      processed_at: new Date(),
    })
  }

  static async getUnprocessedArticles(limit = 50) {
    return await prisma.news_articles.findMany({
      where: {
        processed: false,
      },
      take: limit,
      orderBy: {
        created_at: 'asc',
      },
    })
  }

  static async getHighImpactArticles(minImpactScore = 0.7, limit = 20) {
    return await prisma.news_articles.findMany({
      where: {
        impact_score: {
          gte: minImpactScore,
        },
      },
      take: limit,
      orderBy: [
        { impact_score: 'desc' },
        { published_at: 'desc' },
      ],
      include: {
        symbols: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    })
  }

  static async cleanupOldArticles(retentionDays = 90) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.news_articles.deleteMany({
      where: {
        published_at: {
          lt: cutoffDate,
        },
      },
    })

    return deleted.count
  }

  static async getNewsStats() {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalArticles,
      processedArticles,
      articlesThisMonth,
      articlesLastMonth,
      averageSentiment,
      averageImpact,
    ] = await Promise.all([
      prisma.news_articles.count(),
      prisma.news_articles.count({ where: { processed: true } }),
      prisma.news_articles.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
      prisma.news_articles.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      prisma.news_articles.aggregate({
        where: {
          sentiment_score: { not: null },
        },
        _avg: {
          sentiment_score: true,
        },
      }),
      prisma.news_articles.aggregate({
        where: {
          impact_score: { not: null },
        },
        _avg: {
          impact_score: true,
        },
      }),
    ])

    const growthRate = articlesLastMonth > 0 
      ? ((articlesThisMonth - articlesLastMonth) / articlesLastMonth) * 100 
      : 0

    return {
      totalArticles,
      processedArticles,
      unprocessedArticles: totalArticles - processedArticles,
      processingRate: totalArticles > 0 ? (processedArticles / totalArticles) * 100 : 0,
      articlesThisMonth,
      articlesLastMonth,
      growthRate,
      averageSentiment: averageSentiment._avg.sentiment_score ? Number(averageSentiment._avg.sentiment_score) : null,
      averageImpact: averageImpact._avg.impact_score ? Number(averageImpact._avg.impact_score) : null,
    }
  }
}