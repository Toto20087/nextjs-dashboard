import { useState } from "react";
import { TrendingUp, TrendingDown, Zap, Brain, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "../ui/MetricCard";
import { LoadingCard } from "../ui/LoadingCard";
import { NewsDetailsModal } from "../modals/NewsDetailsModal";
import { useNewsData } from "../../hooks/useNewsData";
import { useNewsArticles } from "../../hooks/useNewsArticles";
import { formatCompactNumber, getSentimentColor, getSentimentLabel, formatTimestamp } from "@/lib/utils/newsUtils";
import React from "react";

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

const getImpactLevel = (score: number | null) => {
  if (score === null) return 'unknown';
  if (score > 0.7) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
};

const getImpactBadgeVariant = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'destructive' as const;
    case 'medium':
      return 'default' as const;
    case 'low':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

export const NewsFeedTab: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Overview data
  const { data: newsData, isLoading: isOverviewLoading, error: overviewError } = useNewsData();

  // Articles data
  const { data: articlesData, isLoading: isArticlesLoading, error: articlesError } = useNewsArticles(
    currentPage,
    searchTerm,
    selectedCategory,
    sentimentFilter
  );

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsDetailsModalOpen(true);
  };

  const handleFilterChange = (type: string, value: string) => {
    if (type === "search") setSearchTerm(value);
    if (type === "category") setSelectedCategory(value);
    if (type === "sentiment") setSentimentFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Overview cards section
  if (isOverviewLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load news data</p>
        <p className="text-sm text-gray-500 mt-2">Please try again later</p>
      </div>
    );
  }

  if (!newsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No news data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="News Volume"
          value={formatCompactNumber(newsData.newsVolume.current)}
          icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Avg Sentiment"
          value={newsData.avgSentiment.score >= 0 ? `+${newsData.avgSentiment.score.toFixed(2)}` : newsData.avgSentiment.score.toFixed(2)}
          changeColor={getSentimentColor(newsData.avgSentiment.score)}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="GPT Confidence"
          value={`${newsData.gptConfidence.percentage}%`}
          changeColor="text-blue-600"
          icon={<Brain className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Active Signals"
          value={newsData.activeSignals.count}
          changeColor="text-orange-600"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search news..." 
            value={searchTerm} 
            onChange={e => handleFilterChange("search", e.target.value)}
            className="w-full" 
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => handleFilterChange("category", value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {articlesData?.filters.categories?.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sentimentFilter} onValueChange={(value) => handleFilterChange("sentiment", value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiment</SelectItem>
            <SelectItem value="bullish">Bullish Only</SelectItem>
            <SelectItem value="bearish">Bearish Only</SelectItem>
            <SelectItem value="neutral">Neutral Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {isArticlesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articlesError ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load articles</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : articlesData?.articles && articlesData.articles.length > 0 ? (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {articlesData.articles.map((article: NewsArticle) => (
                <Card 
                  key={article.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>{article.source || 'Unknown Source'}</span>
                          <span>•</span>
                          <span>{formatTimestamp(article.publishedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-sm font-medium ${getSentimentColor(Number(article.sentiment?.score) || 0)}`}>
                          {getSentimentLabel(Number(article.sentiment?.score) || 0)}
                        </div>
                        <Badge variant={getImpactBadgeVariant(getImpactLevel(Number(article.impactScore) || 0))}>
                          {getImpactLevel(Number(article.impactScore) || 0)} impact
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-3">
                      {article.content ? article.content.substring(0, 200) + '...' : 'No content available'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {article.symbol ? (
                          <Badge variant="outline" className="text-xs">
                            {article.symbol.symbol}
                          </Badge>
                        ) : null}
                        {article.category && (
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        <span>{((Number(article.sentiment?.confidence) || 0) * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No News Articles</h3>
            <p className="text-muted-foreground">
              No news articles found matching your current filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {articlesData?.pagination && articlesData.pagination.pages > 1 && !isArticlesLoading && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!articlesData.pagination.hasPrev}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, articlesData.pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === currentPage;
                
                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {articlesData.pagination.pages > 5 && currentPage < articlesData.pagination.pages - 2 && (
                <>
                  <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(articlesData.pagination.pages)}
                    className="w-8 h-8 p-0"
                  >
                    {articlesData.pagination.pages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(articlesData.pagination.pages, prev + 1))}
              disabled={!articlesData.pagination.hasNext}
            >
              Next
            </Button>
            
            <div className="ml-4 text-sm text-muted-foreground">
              Page {currentPage} of {articlesData.pagination.pages} ({articlesData.pagination.total} articles)
            </div>
          </div>
        )}
      </div>

      {/* News Details Modal */}
      <NewsDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        article={selectedArticle}
      />
    </div>
  );
};