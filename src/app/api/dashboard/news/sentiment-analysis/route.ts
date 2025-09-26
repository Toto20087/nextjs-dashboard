import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange") || "1d"; // Default to 1 day
    
    // Calculate time boundaries based on timeRange
    const now = new Date();
    let startTime: Date;
    let intervalMinutes: number;
    let intervals: number;
    
    switch (timeRange) {
      case "1d":
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 1 day ago
        intervalMinutes = 60; // 1 hour intervals
        intervals = 24;
        break;
      case "1w":
        startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 1 week ago
        intervalMinutes = 24 * 60; // 1 day intervals
        intervals = 7; // 7 days
        break;
      case "1m":
        startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 1 month ago
        intervalMinutes = 24 * 60; // 1 day intervals
        intervals = 30; // 30 days
        break;
      case "3m":
        startTime = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 3 months ago
        intervalMinutes = 7 * 24 * 60; // 1 week intervals
        intervals = 12; // ~12 weeks
        break;
      case "6m":
        startTime = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)); // 6 months ago
        intervalMinutes = 14 * 24 * 60; // 2 week intervals
        intervals = 13; // ~13 intervals of 2 weeks
        break;
      case "1y":
        startTime = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago
        intervalMinutes = 30 * 24 * 60; // 1 month intervals
        intervals = 12; // 12 months
        break;
      case "all":
        // Get the earliest article date
        const earliestArticle = await prisma.news_articles.findFirst({
          orderBy: { published_at: 'asc' },
          select: { published_at: true }
        });
        startTime = earliestArticle?.published_at || new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        const totalDays = Math.ceil((now.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000));
        intervalMinutes = Math.max(24 * 60, Math.ceil(totalDays / 30) * 24 * 60); // Adjust interval to show ~30 points
        intervals = Math.min(30, Math.max(1, totalDays));
        break;
      default:
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        intervalMinutes = 60;
        intervals = 24;
    }
    
    // Generate time slots
    const timeSlots = [];
    for (let i = 0; i < intervals; i++) {
      const slotStart = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000));
      const slotEnd = new Date(startTime.getTime() + ((i + 1) * intervalMinutes * 60 * 1000));
      
      // Format time label based on interval length
      let timeLabel: string;
      if (intervalMinutes < 24 * 60) {
        // For hourly intervals (1 day), show time
        timeLabel = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (intervalMinutes === 24 * 60) {
        // For daily intervals (1 week, 1 month), show day name + date
        timeLabel = slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } else if (intervalMinutes === 7 * 24 * 60) {
        // For weekly intervals (3 months), show week of
        const weekStart = new Date(slotStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        timeLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (intervalMinutes === 14 * 24 * 60) {
        // For 2-week intervals (6 months), show 2-week period
        const weekStart = new Date(slotStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        timeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        // For monthly intervals (1 year), show month + year
        timeLabel = slotStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      timeSlots.push({
        start: slotStart,
        end: slotEnd,
        time: timeLabel
      });
    }

    // Fetch sentiment trend data
    const sentimentTrendPromises = timeSlots.map(async (slot) => {
      const [articles, avgSentiment] = await Promise.all([
        // Count articles in this time slot
        prisma.news_articles.count({
          where: {
            published_at: {
              gte: slot.start,
              lt: slot.end,
            },
          },
        }),
        
        // Average sentiment for this time slot
        prisma.news_articles.aggregate({
          _avg: {
            sentiment_score: true,
          },
          where: {
            published_at: {
              gte: slot.start,
              lt: slot.end,
            },
            sentiment_score: {
              not: null,
            },
          },
        }),
      ]);

      return {
        time: slot.time,
        sentiment: avgSentiment._avg.sentiment_score 
          ? Number(Number(avgSentiment._avg.sentiment_score).toFixed(3)) 
          : 0,
        volume: articles,
      };
    });

    const sentimentTrend = await Promise.all(sentimentTrendPromises);

    // Calculate sentiment breakdown
    const totalArticlesInRange = await prisma.news_articles.count({
      where: {
        published_at: {
          gte: startTime,
        },
        sentiment_score: {
          not: null,
        },
      },
    });

    // Get detailed sentiment breakdown
    const [veryBullish, bullish, neutral, bearish, veryBearish] = await Promise.all([
      prisma.news_articles.count({
        where: {
          published_at: { gte: startTime },
          sentiment_score: { gt: 0.6 },
        },
      }),
      prisma.news_articles.count({
        where: {
          published_at: { gte: startTime },
          sentiment_score: { gt: 0.1, lte: 0.6 },
        },
      }),
      prisma.news_articles.count({
        where: {
          published_at: { gte: startTime },
          sentiment_score: { gte: -0.1, lte: 0.1 },
        },
      }),
      prisma.news_articles.count({
        where: {
          published_at: { gte: startTime },
          sentiment_score: { gte: -0.6, lt: -0.1 },
        },
      }),
      prisma.news_articles.count({
        where: {
          published_at: { gte: startTime },
          sentiment_score: { lt: -0.6 },
        },
      }),
    ]);

    const sentimentBreakdown = [
      {
        label: 'Very Bullish',
        count: veryBullish,
        percentage: totalArticlesInRange > 0 ? Math.round((veryBullish / totalArticlesInRange) * 100) : 0,
      },
      {
        label: 'Bullish',
        count: bullish,
        percentage: totalArticlesInRange > 0 ? Math.round((bullish / totalArticlesInRange) * 100) : 0,
      },
      {
        label: 'Neutral',
        count: neutral,
        percentage: totalArticlesInRange > 0 ? Math.round((neutral / totalArticlesInRange) * 100) : 0,
      },
      {
        label: 'Bearish',
        count: bearish,
        percentage: totalArticlesInRange > 0 ? Math.round((bearish / totalArticlesInRange) * 100) : 0,
      },
      {
        label: 'Very Bearish',
        count: veryBearish,
        percentage: totalArticlesInRange > 0 ? Math.round((veryBearish / totalArticlesInRange) * 100) : 0,
      },
    ];

    // Calculate overall average sentiment for the period
    const overallSentiment = await prisma.news_articles.aggregate({
      _avg: {
        sentiment_score: true,
      },
      where: {
        published_at: {
          gte: startTime,
        },
        sentiment_score: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sentimentTrend,
        sentimentBreakdown,
        summary: {
          timeRange,
          totalArticles: totalArticlesInRange,
          averageSentiment: overallSentiment._avg.sentiment_score 
            ? Number(Number(overallSentiment._avg.sentiment_score).toFixed(3))
            : 0,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Sentiment analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SENTIMENT_ANALYSIS_ERROR",
          message: "Failed to fetch sentiment analysis data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}