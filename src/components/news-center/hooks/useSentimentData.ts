import { useQuery } from "@tanstack/react-query";

interface SentimentTrendData {
  time: string;
  sentiment: number;
  volume: number;
}

interface SentimentBreakdownData {
  label: string;
  count: number;
  percentage: number;
}

interface SentimentAnalysisData {
  sentimentTrend: SentimentTrendData[];
  sentimentBreakdown: SentimentBreakdownData[];
  summary: {
    timeRange: string;
    totalArticles: number;
    averageSentiment: number;
    startTime: string;
    endTime: string;
  };
}

export const useSentimentData = (timeRange: string = "1d") => {
  return useQuery<SentimentAnalysisData>({
    queryKey: ["sentiment-analysis", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/news/sentiment-analysis?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sentiment data");
      }
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 60000,
  });
};