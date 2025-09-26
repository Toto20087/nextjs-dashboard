import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ScrollArea } from '../../ui/scroll-area';
import { Progress } from '../../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Newspaper, TrendingUp, TrendingDown, Brain, AlertTriangle, BarChart3, Clock, Globe, Zap, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const NewsCenter = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [newsUrl, setNewsUrl] = useState('');
  const [generateSignal, setGenerateSignal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sentimentTimeRange, setSentimentTimeRange] = useState('1d');
  const [tickersPage, setTickersPage] = useState(1);
  const [tickersSearch, setTickersSearch] = useState('');
  const [tickersFilter, setTickersFilter] = useState('watched');
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<any>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [allocatedCapital, setAllocatedCapital] = useState('');
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [tickerToRemove, setTickerToRemove] = useState<any>(null);
  const [selectedRemoveStrategyId, setSelectedRemoveStrategyId] = useState('');
  const [isSymbolDetailsModalOpen, setIsSymbolDetailsModalOpen] = useState(false);
  const [selectedSymbolForDetails, setSelectedSymbolForDetails] = useState<any>(null);


  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-success';
    if (sentiment < -0.3) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getSentimentLabel = (sentiment: number | null) => {
    if (sentiment === null) return 'Unknown';
    if (sentiment > 0.6) return 'Very Bullish';
    if (sentiment > 0.1) return 'Bullish';
    if (sentiment >= -0.1) return 'Neutral';
    if (sentiment > -0.6) return 'Bearish';
    return 'Very Bearish';
  };

  const getImpactLevel = (score: number | null) => {
    if (score === null) return 'unknown';
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  };

  const formatTimestamp = (dateString: string | null) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getTickerStatusBadge = (ticker: any) => {
    // Determine status based on ticker properties
    if (ticker.active === false) {
      return { label: 'Not Active', variant: 'destructive' as const };
    } else if (ticker.is_watched === true) {
      return { label: 'Watched', variant: 'default' as const };
    } else if (ticker.active === true) {
      return { label: 'Active', variant: 'secondary' as const };
    }
    return { label: 'Unknown', variant: 'outline' as const };
  };
  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['overview-data'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/news/general');
        if (!response.ok) throw new Error('Failed to fetch account data');
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.log('No overview data available:', error);
        return null;
      }
    },
    refetchInterval: 600000, // Refresh every minute
    retry: false,
  });

  // Build query parameters for symbols
  const buildSymbolsQuery = () => {
    const params = new URLSearchParams();
    params.set('page', tickersPage.toString());
    params.set('limit', '12'); // 12 cards per page for nice grid layout
    
    if (tickersSearch) params.set('search', tickersSearch);
    params.set('status', tickersFilter);
    
    return params.toString();
  };

  const { data: symbolsData, isLoading: isSymbolsLoading } = useQuery({
    queryKey: ['symbols-data', tickersPage, tickersSearch, tickersFilter],
    queryFn: async () => {
      try {
        const query = buildSymbolsQuery();
        const response = await fetch(`/api/symbols?${query}`);
        if (!response.ok) throw new Error('Failed to fetch symbols data');
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.log('No symbols data available:', error);
        return null;
      }
    },
    refetchInterval: false,
    retry: false,
  });

  // Build query parameters for news articles
  const buildNewsQuery = () => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', '10');
    
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sentimentFilter !== 'all') {
      if (sentimentFilter === 'bullish') params.set('sentiment', 'positive');
      else if (sentimentFilter === 'bearish') params.set('sentiment', 'negative');
      else if (sentimentFilter === 'neutral') params.set('sentiment', 'neutral');
    }
    
    return params.toString();
  };

  const { data: newsData, isLoading: isNewsLoading } = useQuery({
    queryKey: ['news-articles', currentPage, searchTerm, selectedCategory, sentimentFilter],
    queryFn: async () => {
      try {
        const query = buildNewsQuery();
        const response = await fetch(`/api/dashboard/news/articles?${query}`);
        if (!response.ok) throw new Error('Failed to fetch news articles');
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.log('No news articles available:', error);
        return null;
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  const { data: sentimentData, isLoading: isSentimentLoading } = useQuery({
    queryKey: ['sentiment-analysis', sentimentTimeRange],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/dashboard/news/sentiment-analysis?timeRange=${sentimentTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch sentiment analysis data');
        const result = await response.json();
        
        return result.data;
      } catch (error) {
        console.log('No sentiment analysis data available:', error);
        return null;
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  const { data: strategiesData, isLoading: isStrategiesLoading } = useQuery({
    queryKey: ['active-strategies'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/strategies?processed_by_rust=false&is_active=true');
        if (!response.ok) throw new Error('Failed to fetch strategies');
        const result = await response.json();
        return result.data?.strategies || [];
      } catch (error) {
        console.log('No strategies data available:', error);
        return [];
      }
    },
    retry: false,
  });

  // Query to fetch strategies for the ticker to be removed
  const { data: tickerStrategiesData, isLoading: isTickerStrategiesLoading } = useQuery({
    queryKey: ['ticker-strategies', tickerToRemove?.id],
    queryFn: async () => {
      if (!tickerToRemove?.id) return [];
      
      try {
        const response = await fetch(`/api/symbols/${tickerToRemove.id}/strategies?processed_by_rust=false&is_active=true`);
        if (!response.ok) throw new Error('Failed to fetch ticker strategies');
        const result = await response.json();
        return result.data?.strategies || [];
      } catch (error) {
        console.log('No ticker strategies data available:', error);
        return [];
      }
    },
    enabled: !!tickerToRemove?.id && isRemoveModalOpen,
    retry: false,
  });

  // Query to fetch current market data for symbol details
  const { data: symbolCurrentData, isLoading: isSymbolCurrentDataLoading } = useQuery({
    queryKey: ['symbol-current-data', selectedSymbolForDetails?.symbol],
    queryFn: async () => {
      if (!selectedSymbolForDetails?.symbol) return null;
      
      try {
        const response = await fetch(`/api/market-data/${selectedSymbolForDetails.symbol}`);
        if (!response.ok) throw new Error('Failed to fetch current market data');
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.log('No current market data available:', error);
        return null;
      }
    },
    enabled: !!selectedSymbolForDetails?.symbol && isSymbolDetailsModalOpen,
    retry: false,
  });

  // Query to fetch historical market data for chart
  const { data: symbolHistoryData, isLoading: isSymbolHistoryDataLoading } = useQuery({
    queryKey: ['symbol-history-data', selectedSymbolForDetails?.symbol],
    queryFn: async () => {
      if (!selectedSymbolForDetails?.symbol) return null;
      
      try {
        const response = await fetch(`/api/market-data/${selectedSymbolForDetails.symbol}/history?timeframe=1Day&limit=30`);
        if (!response.ok) throw new Error('Failed to fetch historical market data');
        const result = await response.json();
        // Extract the bars array from the nested data structure
        return result.data?.bars || [];
      } catch (error) {
        console.log('No historical market data available:', error);
        return [];
      }
    },
    enabled: !!selectedSymbolForDetails?.symbol && isSymbolDetailsModalOpen,
    retry: false,
  });

  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">News Center</h1>
          <p className="text-muted-foreground">AI-powered market intelligence and trading recommendations</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsUrlModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add News URL
          </Button>
          <div className="flex items-center gap-2">
            <div className="status-dot online"></div>
            <span className="text-sm font-medium">Live Feed Active</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-chart-1" />
              <span className="text-sm font-medium">News Volume</span>
            </div>
            <div className="mt-2">
              {isOverviewLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{overviewData?.newsVolume.current}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-chart-2" />
              <span className="text-sm font-medium">Avg Sentiment</span>
            </div>
            <div className="mt-2">
              {isOverviewLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-success">{overviewData?.avgSentiment.score}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-chart-3" />
              <span className="text-sm font-medium">GPT Confidence</span>
            </div>
            <div className="mt-2">
              {isOverviewLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{overviewData?.gptConfidence.percentage}%</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-chart-4" />
              <span className="text-sm font-medium">Active Signals</span>
            </div>
            <div className="mt-2">
              {isOverviewLoading ? (
                <div className="space-y-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{overviewData?.activeSignals.count}</div>
                  <div className="text-xs text-destructive">{overviewData?.activeSignals.today} made today</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">News Feed</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="tickers">Tickers</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Search news..." value={searchTerm} onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }} className="w-full" />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1); // Reset to first page when filtering
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {newsData?.filters.categories?.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={(value) => {
              setSentimentFilter(value);
              setCurrentPage(1); // Reset to first page when filtering
            }}>
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
            {isNewsLoading ? (
              // Loading skeleton
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
            ) : newsData?.articles?.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {newsData.articles.map((article: any) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                      setSelectedNews(article);
                      setIsNewsModalOpen(true);
                    }}>
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
                            <div className={`text-sm font-medium ${getSentimentColor(article.sentiment.score)}`}>
                              {getSentimentLabel(article.sentiment.score)}
                            </div>
                            <Badge variant={getImpactBadgeVariant(getImpactLevel(article.impactScore))}>
                              {getImpactLevel(article.impactScore)} impact
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
                            <span>{article.sentiment.confidence ? (article.sentiment.confidence * 100).toFixed(0) : 0}% confidence</span>
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
            {newsData?.pagination && newsData.pagination.pages > 1 && !isNewsLoading && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!newsData.pagination.hasPrev}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, newsData.pagination.pages) }, (_, i) => {
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
                  
                  {newsData.pagination.pages > 5 && currentPage < newsData.pagination.pages - 2 && (
                    <>
                      <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(newsData.pagination.pages)}
                        className="w-8 h-8 p-0"
                      >
                        {newsData.pagination.pages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(newsData.pagination.pages, prev + 1))}
                  disabled={!newsData.pagination.hasNext}
                >
                  Next
                </Button>
                
                <div className="ml-4 text-sm text-muted-foreground">
                  Page {currentPage} of {newsData.pagination.pages} ({newsData.pagination.total} articles)
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Sentiment Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Analyze market sentiment trends across different time periods
              </p>
            </div>
            <Select value={sentimentTimeRange} onValueChange={setSentimentTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="1w">1 Week</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {/* Top row with two charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Trend */}
              <Card>
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>
                  Market sentiment over {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
                  sentimentTimeRange === '1w' ? 'the last week' : 
                  sentimentTimeRange === '1m' ? 'the last month' : 
                  sentimentTimeRange === '3m' ? 'the last 3 months' : 
                  sentimentTimeRange === '6m' ? 'the last 6 months' : 
                  sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSentimentLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                  </div>
                ) : sentimentData?.sentimentTrend ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sentimentData.sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[-1, 1]} />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'sentiment') {
                            return [Number(value).toFixed(3), 'Sentiment'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line type="monotone" dataKey="sentiment" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No sentiment data available for this time range
                  </div>
                )}
              </CardContent>
            </Card>

            {/* News Volume */}
            <Card>
              <CardHeader>
                <CardTitle>News Volume</CardTitle>
                <CardDescription>
                  Article volume over {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
                  sentimentTimeRange === '1w' ? 'the last week' : 
                  sentimentTimeRange === '1m' ? 'the last month' : 
                  sentimentTimeRange === '3m' ? 'the last 3 months' : 
                  sentimentTimeRange === '6m' ? 'the last 6 months' : 
                  sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSentimentLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                  </div>
                ) : sentimentData?.sentimentTrend ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentimentData.sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'volume') {
                            return [Number(value), 'Articles'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No volume data available for this time range
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Sentiment Breakdown - Full width below */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>
                  Sentiment distribution for {sentimentTimeRange === '1d' ? 'the last 24 hours' : 
                  sentimentTimeRange === '1w' ? 'the last week' : 
                  sentimentTimeRange === '1m' ? 'the last month' : 
                  sentimentTimeRange === '3m' ? 'the last 3 months' : 
                  sentimentTimeRange === '6m' ? 'the last 6 months' : 
                  sentimentTimeRange === '1y' ? 'the last year' : 'all time'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSentimentLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : sentimentData?.sentimentBreakdown ? (
                  sentimentData.sentimentBreakdown.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm font-medium">
                          {item.percentage}% ({item.count} articles)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sentiment breakdown data available for this time range
                  </div>
                )}
                
                {/* Summary Stats */}
                {sentimentData?.summary && (
                  <div className="mt-6 pt-4 border-t border-border w-full">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Articles:</span>
                        <div className="font-medium">{sentimentData.summary.totalArticles}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Avg Sentiment:</span>
                        <div className={`font-medium ${getSentimentColor(sentimentData.summary.averageSentiment)}`}>
                          {sentimentData.summary.averageSentiment.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickers" className="space-y-4">
          {/* Header with Search */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Tracked Tickers</h2>
              <p className="text-sm text-muted-foreground">
                Securities being monitored for news updates
              </p>
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Search tickers..." 
                value={tickersSearch} 
                onChange={(e) => {
                  setTickersSearch(e.target.value);
                  setTickersPage(1); // Reset to first page when searching
                }}
                className="w-64"
              />
              <Select value={tickersFilter} onValueChange={(value) => {
                setTickersFilter(value);
                setTickersPage(1); // Reset to first page when filtering
              }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watched">Watched</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Not Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tickers Grid */}
          <div className="space-y-4">
            {isSymbolsLoading ? (
              // Loading skeleton grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : symbolsData?.symbols?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {symbolsData.symbols.map((ticker: any) => {
                    const statusBadge = getTickerStatusBadge(ticker);
                    return (
                      <Card 
                        key={ticker.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedSymbolForDetails(ticker);
                          setIsSymbolDetailsModalOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg">{ticker.symbol}</h3>
                                  <Badge variant={statusBadge.variant} className="text-xs">
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {ticker.name || 'No company name available'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                              <Badge variant="outline" className="text-xs">
                                {ticker.exchange || 'Unknown'}
                              </Badge>
                              <Button 
                                variant={ticker.is_watched ? 'destructive' : 'default'} 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  if (ticker.is_watched) {
                                    // Open confirmation dialog for removing ticker
                                    setTickerToRemove(ticker);
                                    setSelectedRemoveStrategyId('');
                                    setIsRemoveModalOpen(true);
                                  } else {
                                    // Open modal for adding ticker
                                    setSelectedTicker(ticker);
                                    setIsWatchModalOpen(true);
                                  }
                                }}
                              >
                                 {ticker.is_watched ? 'Remove' : 'Add'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {symbolsData?.pagination && symbolsData.pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTickersPage(prev => Math.max(1, prev - 1))}
                      disabled={!symbolsData.pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, symbolsData.pagination.pages) }, (_, i) => {
                        const pageNum = i + 1;
                        const isCurrentPage = pageNum === tickersPage;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTickersPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {symbolsData.pagination.pages > 5 && tickersPage < symbolsData.pagination.pages - 2 && (
                        <>
                          <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTickersPage(symbolsData.pagination.pages)}
                            className="w-8 h-8 p-0"
                          >
                            {symbolsData.pagination.pages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTickersPage(prev => Math.min(symbolsData.pagination.pages, prev + 1))}
                      disabled={!symbolsData.pagination.hasNext}
                    >
                      Next
                    </Button>
                    
                    <div className="ml-4 text-sm text-muted-foreground">
                      Page {tickersPage} of {symbolsData.pagination.pages} ({symbolsData.pagination.total} tickers)
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                  📊
                </div>
                <h3 className="text-xl font-semibold mb-2">No Tickers Found</h3>
                <p className="text-muted-foreground">
                  {tickersSearch ? 
                    `No tickers found matching "${tickersSearch}"` : 
                    'No tickers are currently being tracked'
                  }
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* News Detail Modal */}
      <Dialog open={isNewsModalOpen} onOpenChange={setIsNewsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold pr-8">
              {selectedNews?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNews && <div className="space-y-6">
              {/* News Header Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">{selectedNews.source || 'Unknown Source'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimestamp(selectedNews.publishedAt)}</span>
                </div>
                <Badge variant={getImpactBadgeVariant(getImpactLevel(selectedNews.impactScore))}>
                  {getImpactLevel(selectedNews.impactScore)} impact
                </Badge>
                {selectedNews.category && (
                  <Badge variant="outline" className="capitalize">
                    {selectedNews.category.replace('-', ' ')}
                  </Badge>
                )}
              </div>

              {/* Sentiment & Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Market Sentiment</div>
                        <div className={`text-lg font-bold ${getSentimentColor(selectedNews.sentiment.score)}`}>
                          {getSentimentLabel(selectedNews.sentiment.score)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {selectedNews.sentiment.score ? selectedNews.sentiment.score.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {selectedNews.sentiment.score ? (
                            <>
                              {selectedNews.sentiment.score > 0 ? '+' : ''}{(selectedNews.sentiment.score * 100).toFixed(0)}%
                            </>
                          ) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">AI Confidence</div>
                        <div className="text-lg font-bold">
                          {selectedNews.sentiment.confidence ? (selectedNews.sentiment.confidence * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedNews.sentiment.confidence ? (
                            selectedNews.sentiment.confidence > 0.9 ? 'Very High' : 
                            selectedNews.sentiment.confidence > 0.8 ? 'High' : 
                            selectedNews.sentiment.confidence > 0.7 ? 'Medium' : 'Low'
                          ) : 'Unknown'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-chart-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* News Content */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedNews.content || 'No content available'}
                </p>
              </div>

              {/* Affected Tickers */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Affected Securities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNews.symbol ? (
                    <Badge variant="secondary" className="px-3 py-1 text-sm font-mono">
                      {selectedNews.symbol.symbol}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">No specific securities identified</p>
                  )}
                </div>
              </div>

              {/* Trading Implications */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Trading Implications</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Market Impact</div>
                        <div className="flex items-center gap-2">
                          {getImpactLevel(selectedNews.impactScore) === 'high' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                          {getImpactLevel(selectedNews.impactScore) === 'medium' && <BarChart3 className="w-4 h-4 text-warning" />}
                          {getImpactLevel(selectedNews.impactScore) === 'low' && <TrendingUp className="w-4 h-4 text-success" />}
                          <span className="capitalize font-medium">{getImpactLevel(selectedNews.impactScore)} Impact Expected</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Trading Bias</div>
                        <div className="flex items-center gap-2">
                          {selectedNews.sentiment.score && selectedNews.sentiment.score > 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                          <span className="font-medium">
                            {selectedNews.sentiment.score && selectedNews.sentiment.score > 0 ? 'Bullish' : 'Bearish'} Outlook
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* URL Upload Modal */}
      <Dialog open={isUrlModalOpen} onOpenChange={setIsUrlModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add News URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newsUrl" className="text-sm font-medium">
                News Article URL
              </label>
              <div className="flex items-center gap-2 mt-1">
                <label htmlFor="generateSignal" className="text-sm font-medium">
                  Generate Signal
                </label>
                <Checkbox id="generateSignal" checked={generateSignal} onCheckedChange={(checked) => setGenerateSignal(checked === 'indeterminate' ? false : checked)} />
              </div>
              <Input id="newsUrl" type="url" value={newsUrl} onChange={e => setNewsUrl(e.target.value)} placeholder="https://example.com/news-article" className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
              setIsUrlModalOpen(false);
              setNewsUrl('');
            }}>
                Cancel
              </Button>
              <Button onClick={async () => {
              try {
                const response = await fetch('/api/dashboard/news/analyze', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ url: newsUrl, generate_signal: generateSignal })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                  console.log('News URL submitted successfully');
                } else {
                  console.error('Failed to submit news URL:', result.error?.message);
                }
              } catch (error) {
                console.error('Error submitting news URL:', error);
              }
              
              setIsUrlModalOpen(false);
              setNewsUrl('');
            }} disabled={!newsUrl}>
                Add News
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Watch Symbol Modal */}
      <Dialog open={isWatchModalOpen} onOpenChange={setIsWatchModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Symbol to Watch List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTicker && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{selectedTicker.symbol}</h3>
                  <Badge variant="outline">{selectedTicker.exchange || 'Unknown'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTicker.name || 'No company name available'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="strategy" className="text-sm font-medium">
                Strategy
              </label>
              <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                  {isStrategiesLoading ? (
                    <SelectItem value="loading" disabled>Loading strategies...</SelectItem>
                  ) : strategiesData?.length > 0 ? (
                    strategiesData.map((strategy: any) => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-strategies" disabled>No active strategies found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="capital" className="text-sm font-medium">
                Allocated Capital ($)
              </label>
              <Input
                id="capital"
                type="number"
                step="0.01"
                min="0"
                value={allocatedCapital}
                onChange={(e) => setAllocatedCapital(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsWatchModalOpen(false);
                  setSelectedTicker(null);
                  setSelectedStrategyId('');
                  setAllocatedCapital('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (!selectedStrategyId || !allocatedCapital || !selectedTicker || 
                      selectedStrategyId === 'loading' || selectedStrategyId === 'no-strategies') {
                    console.error('Missing required fields');
                    return;
                  }

                  try {
                    const response = await fetch(`/api/symbols/${selectedTicker.id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        strategyId: parseInt(selectedStrategyId),
                        allocatedCapital: parseFloat(allocatedCapital),
                      }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                      // Success toast with details
                      toast({
                        title: "Symbol Added to Watch List",
                        description: `${selectedTicker.symbol} successfully added with $${allocatedCapital} allocated capital.`,
                      });
                      
                      // Close modal and reset form
                      setIsWatchModalOpen(false);
                      setSelectedTicker(null);
                      setSelectedStrategyId('');
                      setAllocatedCapital('');
                      
                      // Refresh the symbols data
                      // You might want to use queryClient.invalidateQueries here
                      window.location.reload(); // Quick refresh for now
                    } else {
                      // Error toast with specific error message
                      const errorMessage = result.error?.message || 'Unknown error occurred';
                      const errorCode = result.error?.code;
                      
                      let title = "Failed to Add Symbol";
                      let description = errorMessage;
                      
                      // Handle specific error types
                      if (errorCode === 'INSUFFICIENT_CAPITAL') {
                        title = "Insufficient Capital";
                        description = `Cannot allocate $${allocatedCapital}. ${result.error?.details || errorMessage}`;
                      } else if (errorCode === 'ALPACA_ERROR') {
                        title = "Portfolio Connection Error";
                        description = "Could not validate portfolio balance. Please try again.";
                      }
                      
                      toast({
                        title,
                        description,
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error('Error adding symbol to watch list:', error);
                    
                    // Network or unexpected error toast
                    toast({
                      title: "Connection Error",
                      description: "Unable to connect to server. Please check your internet connection and try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!selectedStrategyId || !allocatedCapital || !selectedTicker || 
                         selectedStrategyId === 'loading' || selectedStrategyId === 'no-strategies'}
              >
                Add to Watch List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from Watch List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tickerToRemove && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{tickerToRemove.symbol}</h3>
                  <Badge variant="outline">{tickerToRemove.exchange || 'Unknown'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tickerToRemove.name || 'No company name available'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="removeStrategy" className="text-sm font-medium">
                Select Strategy to Remove
              </label>
              <Select value={selectedRemoveStrategyId} onValueChange={setSelectedRemoveStrategyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy to remove" />
                </SelectTrigger>
                <SelectContent>
                  {isTickerStrategiesLoading ? (
                    <SelectItem value="loading" disabled>Loading strategies...</SelectItem>
                  ) : tickerStrategiesData?.length > 0 ? (
                    tickerStrategiesData.map((strategy: any) => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.name} (${strategy.allocation?.allocated_capital || 0} allocated)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-strategies" disabled>No strategies found for this symbol</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This will deactivate the strategy allocation for this symbol.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setTickerToRemove(null);
                  setSelectedRemoveStrategyId('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  if (!tickerToRemove || !selectedRemoveStrategyId || 
                      selectedRemoveStrategyId === 'loading' || selectedRemoveStrategyId === 'no-strategies') {
                    return;
                  }

                  console.log('Removing symbol from watch list:', tickerToRemove.id, selectedRemoveStrategyId);
                  try {
                    const response = await fetch(`/api/symbols/${tickerToRemove.id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        strategyId: parseInt(selectedRemoveStrategyId),
                        allocatedCapital: 1, // Not used for removal
                      }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                      // Success toast
                      toast({
                        title: "Symbol Removed from Watch List",
                        description: `${tickerToRemove.symbol} has been successfully removed from the selected strategy.`,
                      });
                      
                      // Close modal and reset form
                      setIsRemoveModalOpen(false);
                      setTickerToRemove(null);
                      setSelectedRemoveStrategyId('');
                      
                      // Refresh the symbols data
                      window.location.reload(); // Quick refresh for now
                    } else {
                      // Error toast
                      const errorMessage = result.error?.message || 'Unknown error occurred';
                      toast({
                        title: "Failed to Remove Symbol",
                        description: errorMessage,
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error('Error removing symbol from watch list:', error);
                    
                    // Network error toast
                    toast({
                      title: "Connection Error",
                      description: "Unable to connect to server. Please check your internet connection and try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!selectedRemoveStrategyId || 
                         selectedRemoveStrategyId === 'loading' || selectedRemoveStrategyId === 'no-strategies'}
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Symbol Details Modal */}
      <Dialog open={isSymbolDetailsModalOpen} onOpenChange={setIsSymbolDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedSymbolForDetails?.symbol} - {selectedSymbolForDetails?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSymbolForDetails && (
            <div className="space-y-6">
              {/* Current Market Data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isSymbolCurrentDataLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-16 mb-2" />
                        <Skeleton className="h-8 w-20" />
                      </CardContent>
                    </Card>
                  ))
                ) : symbolCurrentData ? (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Current Price</div>
                        <div className="text-2xl font-bold">${symbolCurrentData.close?.toFixed(2) || 'N/A'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Volume</div>
                        <div className="text-2xl font-bold">{symbolCurrentData.volume?.toLocaleString() || 'N/A'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">High</div>
                        <div className="text-2xl font-bold">${symbolCurrentData.high?.toFixed(2) || 'N/A'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Low</div>
                        <div className="text-2xl font-bold">${symbolCurrentData.low?.toFixed(2) || 'N/A'}</div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="col-span-4">
                    <CardContent className="p-4 text-center">
                      <div className="text-muted-foreground">No current market data available</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Price Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Chart - Last 30 Days</CardTitle>
                  <CardDescription>Daily closing prices for {selectedSymbolForDetails.symbol}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isSymbolHistoryDataLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="space-y-2 text-center">
                        <Skeleton className="h-4 w-32 mx-auto" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </div>
                    </div>
                  ) : symbolHistoryData && symbolHistoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={symbolHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            if (name === 'close') {
                              return [`$${Number(value).toFixed(2)}`, 'Close Price'];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No historical price data available for this symbol
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trading Metrics & Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {/* Key Trading Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Trading Metrics</CardTitle>
                    <CardDescription>Important metrics for trading decisions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {symbolHistoryData && symbolHistoryData.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          const prices = symbolHistoryData.map((bar: any) => bar.close);
                          const volumes = symbolHistoryData.map((bar: any) => bar.volume);
                          const currentPrice = prices[prices.length - 1];
                          const previousPrice = prices[prices.length - 2];
                          
                          // Calculate metrics
                          const priceChange = currentPrice - previousPrice;
                          const priceChangePercent = ((priceChange / previousPrice) * 100);
                          const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
                          const currentVolume = volumes[volumes.length - 1];
                          const volumeRatio = currentVolume / avgVolume;
                          
                          // Volatility (standard deviation of returns)
                          const returns = prices.slice(1).map((price: number, i: number) => 
                            ((price - prices[i]) / prices[i]) * 100
                          );
                          const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
                          const volatility = Math.sqrt(
                            returns.reduce((sum: number, ret: number) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
                          );
                          
                          // Support and Resistance
                          const high30d = Math.max(...symbolHistoryData.map((bar: any) => bar.high));
                          const low30d = Math.min(...symbolHistoryData.map((bar: any) => bar.low));
                          const range = high30d - low30d;
                          const positionInRange = ((currentPrice - low30d) / range) * 100;
                          
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Price Change (1D)</div>
                                <div className={`font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(1)}%)
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">30D Volatility</div>
                                <div className="font-medium">{volatility.toFixed(2)}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Avg Volume (30D)</div>
                                <div className="font-medium">{(avgVolume / 1000000).toFixed(1)}M</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Volume Ratio</div>
                                <div className={`font-medium ${volumeRatio > 1.5 ? 'text-orange-600' : volumeRatio > 1.2 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                  {volumeRatio.toFixed(1)}x
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">30D High</div>
                                <div className="font-medium">${high30d.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">30D Low</div>
                                <div className="font-medium">${low30d.toFixed(2)}</div>
                              </div>
                              <div className="col-span-2">
                                <div className="text-sm text-muted-foreground">Position in 30D Range</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        positionInRange > 80 ? 'bg-red-500' : 
                                        positionInRange > 60 ? 'bg-orange-500' : 
                                        positionInRange > 40 ? 'bg-yellow-500' : 
                                        positionInRange > 20 ? 'bg-blue-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${positionInRange}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{positionInRange.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No historical data available for metrics calculation
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Symbol Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Symbol Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Symbol</div>
                      <div className="font-medium">{selectedSymbolForDetails.symbol}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Company Name</div>
                      <div className="font-medium">{selectedSymbolForDetails.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Exchange</div>
                      <div className="font-medium">{selectedSymbolForDetails.exchange || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge variant={selectedSymbolForDetails.is_watched ? 'default' : 'secondary'}>
                        {selectedSymbolForDetails.is_watched ? 'Watched' : 'Not Watched'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>;
};