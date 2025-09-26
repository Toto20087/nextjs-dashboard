import { useQuery } from "@tanstack/react-query";

interface NewsMetrics {
  newsVolume: {
    current: number;
  };
  avgSentiment: {
    score: number;
  };
  gptConfidence: {
    percentage: number;
  };
  activeSignals: {
    count: number;
    today: number;
  };
}

export const useNewsData = () => {
  return useQuery<NewsMetrics>({
    queryKey: ["news-general"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/news/general");
      if (!response.ok) {
        throw new Error("Failed to fetch news data");
      }
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
  });
};
