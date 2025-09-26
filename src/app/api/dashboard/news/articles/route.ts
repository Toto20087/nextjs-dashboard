import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Query parameters for filtering
    const symbolFilter = searchParams.get("symbol");
    const categoryFilter = searchParams.get("category");
    const sourceFilter = searchParams.get("source");
    const searchQuery = searchParams.get("search");
    const sentimentFilter = searchParams.get("sentiment"); // positive, negative, neutral
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const processedFilter = searchParams.get("processed"); // true, false

    // Build where clause for filtering
    const whereClause: any = {};

    if (symbolFilter) {
      whereClause.symbols = {
        symbol: {
          equals: symbolFilter.toUpperCase(),
        },
      };
    }

    if (categoryFilter) {
      whereClause.category = categoryFilter;
    }

    if (sourceFilter) {
      whereClause.source = {
        contains: sourceFilter,
        mode: "insensitive",
      };
    }

    if (searchQuery) {
      whereClause.OR = [
        {
          title: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    if (sentimentFilter) {
      if (sentimentFilter === "positive") {
        whereClause.sentiment_score = { gt: 0.1 };
      } else if (sentimentFilter === "negative") {
        whereClause.sentiment_score = { lt: -0.1 };
      } else if (sentimentFilter === "neutral") {
        whereClause.sentiment_score = { gte: -0.1, lte: 0.1 };
      }
    }

    if (startDate || endDate) {
      whereClause.published_at = {};
      if (startDate) {
        whereClause.published_at.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.published_at.lte = new Date(endDate);
      }
    }

    if (processedFilter !== null) {
      whereClause.processed = processedFilter === "true";
    }

    // Fetch articles with filters and pagination
    const [articles, totalCount] = await Promise.all([
      prisma.news_articles.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
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
          published_at: "desc",
        },
      }),
      prisma.news_articles.count({
        where: whereClause,
      }),
    ]);

    // Get filter options for frontend
    const [categories, sources, symbols] = await Promise.all([
      prisma.news_articles.findMany({
        select: {
          category: true,
        },
        distinct: ["category"],
        where: {
          category: {
            not: null,
          },
        },
        orderBy: {
          category: "asc",
        },
      }),
      prisma.news_articles.findMany({
        select: {
          source: true,
        },
        distinct: ["source"],
        where: {
          source: {
            not: null,
          },
        },
        orderBy: {
          source: "asc",
        },
      }),
      prisma.news_articles.findMany({
        select: {
          symbols: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
        where: {
          symbol_id: {
            not: null,
          },
        },
        distinct: ["symbol_id"],
        orderBy: {
          symbols: {
            symbol: "asc",
          },
        },
      }),
    ]);

    // Format articles for response
    const formattedArticles = articles.map((article) => ({
      id: article.id,
      externalId: article.external_id,
      title: article.title,
      content: article.content,
      source: article.source,
      url: article.url,
      publishedAt: article.published_at?.toISOString(),
      category: article.category,
      sentiment: {
        score: article.sentiment_score ? Number(article.sentiment_score) : null,
        confidence: article.confidence_score
          ? Number(article.confidence_score)
          : null,
        label: getSentimentLabel(
          article.sentiment_score ? Number(article.sentiment_score) : null
        ),
      },
      relevanceScore: article.relevance_score
        ? Number(article.relevance_score)
        : null,
      impactScore: article.impact_score ? Number(article.impact_score) : null,
      processed: article.processed,
      processedAt: article.processed_at?.toISOString(),
      tags: article.tags || [],
      metadata: article.metadata || {},
      symbol: article.symbols
        ? {
            id: article.symbols.id,
            symbol: article.symbols.symbol,
            name: article.symbols.name,
          }
        : null,
      createdAt: article.created_at?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: formattedArticles,
        pagination: {
          page,
          limit,
          offset,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1,
        },
        filters: {
          categories: categories.map((c) => c.category).filter(Boolean),
          sources: sources.map((s) => s.source).filter(Boolean),
          symbols: symbols.map((s) => s.symbols).filter(Boolean),
        },
      },
    });
  } catch (error) {
    console.error("News articles API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NEWS_ARTICLES_ERROR",
          message: "Failed to fetch news articles",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to convert sentiment score to label
function getSentimentLabel(score: number | null): string {
  if (score === null) return "unknown";
  if (score > 0.1) return "positive";
  if (score < -0.1) return "negative";
  return "neutral";
}
