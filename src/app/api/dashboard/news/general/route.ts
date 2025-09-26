import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get start of today for filtering signals made today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get strategy IDs where processed_by_rust = false
    const strategiesNotProcessedByRust = await prisma.strategies.findMany({
      where: {
        processed_by_rust: false,
      },
      select: {
        id: true,
      },
    });

    const strategyIds = strategiesNotProcessedByRust.map((s) => s.id);

    // Calculate metrics using aggregation queries
    const [
      newsVolumeResult,
      sentimentResult,
      confidenceResult,
      activeSignalsCount,
      todaySignalsCount,
    ] = await Promise.all([
      // News Volume: Total count of articles
      prisma.news_articles.count(),

      // Average Sentiment: Average of sentiment_score
      prisma.news_articles.aggregate({
        _avg: {
          sentiment_score: true,
        },
        where: {
          sentiment_score: {
            not: null,
          },
        },
      }),

      // GPT Confidence: Average of confidence_score
      prisma.news_articles.aggregate({
        _avg: {
          confidence_score: true,
        },
        where: {
          confidence_score: {
            not: null,
          },
        },
      }),

      // Active Signals: Count where strategy_id is in strategies with processed_by_rust = false
      prisma.signals.count({
        where: {
          strategy_id: {
            in: strategyIds,
          },
        },
      }),

      // Signals Made Today: Count where created_at >= today
      prisma.signals.count({
        where: {
          created_at: {
            gte: today,
          },
        },
      }),
    ]);

    // Format the metrics for response
    const newsVolume = newsVolumeResult || 0;
    const avgSentiment = sentimentResult._avg.sentiment_score
      ? Number(sentimentResult._avg.sentiment_score)
      : 0;
    const gptConfidence = confidenceResult._avg.confidence_score
      ? Math.round(Number(confidenceResult._avg.confidence_score) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        newsVolume: {
          current: newsVolume,
        },
        avgSentiment: {
          score: Number(avgSentiment.toFixed(2)),
        },
        gptConfidence: {
          percentage: gptConfidence,
        },
        activeSignals: {
          count: activeSignalsCount,
          today: todaySignalsCount,
        },
      },
    });
  } catch (error) {
    console.error("News metrics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NEWS_METRICS_ERROR",
          message: "Failed to fetch news metrics",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
