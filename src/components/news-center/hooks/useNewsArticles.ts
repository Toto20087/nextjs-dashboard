import { useQuery } from "@tanstack/react-query";

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment: {
    score: number;
    confidence: number;
  };
  impactScore: number;
  symbol?: {
    symbol: string;
  };
}

interface NewsArticlesResponse {
  articles: NewsArticle[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  filters: {
    categories: string[];
  };
}

export const useNewsArticles = (
  page: number = 1,
  searchTerm: string = "",
  category: string = "all",
  sentimentFilter: string = "all"
) => {
  return useQuery<NewsArticlesResponse>({
    queryKey: ["news-articles", page, searchTerm, category, sentimentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      
      if (searchTerm) params.set("search", searchTerm);
      if (category !== "all") params.set("category", category);
      if (sentimentFilter !== "all") {
        if (sentimentFilter === "bullish") params.set("sentiment", "positive");
        else if (sentimentFilter === "bearish") params.set("sentiment", "negative");
        else if (sentimentFilter === "neutral") params.set("sentiment", "neutral");
      }
      
      const response = await fetch(`/api/dashboard/news/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch news articles");
      }
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};