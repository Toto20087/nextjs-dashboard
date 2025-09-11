import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { ScrollArea } from '../../ui/scroll-area';
import { Progress } from '../../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Newspaper, TrendingUp, TrendingDown, Brain, Search, Filter, AlertTriangle, Lightbulb, Target, BarChart3, Clock, Globe, Zap, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Mock data for news and sentiment
const mockNews = [{
  id: 1,
  title: "Federal Reserve Signals Potential Rate Cut in Q2",
  source: "Reuters",
  timestamp: "2 minutes ago",
  sentiment: 0.75,
  impact: "high",
  category: "monetary-policy",
  summary: "The Federal Reserve indicated a dovish stance in recent communications...",
  tickers: ["SPY", "TLT", "AAPL", "MSFT"],
  confidence: 0.92
}, {
  id: 2,
  title: "Tech Earnings Beat Expectations Across Sector",
  source: "Bloomberg",
  timestamp: "15 minutes ago",
  sentiment: 0.85,
  impact: "medium",
  category: "earnings",
  summary: "Major tech companies continue to outperform analyst expectations...",
  tickers: ["AAPL", "MSFT", "GOOGL", "META"],
  confidence: 0.88
}, {
  id: 3,
  title: "Oil Prices Surge on Middle East Tensions",
  source: "MarketWatch",
  timestamp: "32 minutes ago",
  sentiment: -0.45,
  impact: "high",
  category: "commodities",
  summary: "Geopolitical tensions drive energy sector volatility...",
  tickers: ["XOM", "CVX", "USO"],
  confidence: 0.79
}, {
  id: 4,
  title: "Retail Sales Data Shows Consumer Strength",
  source: "CNBC",
  timestamp: "1 hour ago",
  sentiment: 0.65,
  impact: "medium",
  category: "economic-data",
  summary: "Consumer spending remains robust despite economic headwinds...",
  tickers: ["XRT", "AMZN", "WMT"],
  confidence: 0.85
}];
const sentimentTrend = [{
  time: '9:00',
  sentiment: 0.2,
  volume: 45
}, {
  time: '9:30',
  sentiment: 0.45,
  volume: 67
}, {
  time: '10:00',
  sentiment: 0.35,
  volume: 52
}, {
  time: '10:30',
  sentiment: 0.65,
  volume: 78
}, {
  time: '11:00',
  sentiment: 0.75,
  volume: 89
}, {
  time: '11:30',
  sentiment: 0.55,
  volume: 61
}, {
  time: '12:00',
  sentiment: 0.4,
  volume: 43
}];
const categoryDistribution = [{
  name: 'Earnings',
  value: 35,
  color: 'hsl(var(--chart-1))'
}, {
  name: 'Economic Data',
  value: 25,
  color: 'hsl(var(--chart-2))'
}, {
  name: 'Monetary Policy',
  value: 20,
  color: 'hsl(var(--chart-3))'
}, {
  name: 'Geopolitical',
  value: 12,
  color: 'hsl(var(--chart-4))'
}, {
  name: 'Commodities',
  value: 8,
  color: 'hsl(var(--chart-5))'
}];
const gptRecommendations = [{
  id: 1,
  type: "strategy",
  confidence: 0.89,
  title: "Defensive Positioning Recommended",
  reasoning: "Based on current sentiment analysis and Fed signals, consider reducing exposure to rate-sensitive sectors. The dovish pivot suggests potential volatility in financial stocks.",
  actions: ["Reduce XLF allocation by 15%", "Increase TLT position", "Add VIX hedge"],
  timeframe: "1-2 weeks",
  risk: "medium"
}, {
  id: 2,
  type: "opportunity",
  confidence: 0.92,
  title: "Tech Sector Momentum Play",
  reasoning: "Strong earnings beats combined with positive sentiment create a favorable setup for continued tech outperformance. News flow supports bullish thesis.",
  actions: ["Increase QQQ allocation", "Focus on AAPL, MSFT calls", "Set tight stops"],
  timeframe: "3-5 days",
  risk: "low"
}, {
  id: 3,
  type: "alert",
  confidence: 0.76,
  title: "Energy Volatility Warning",
  reasoning: "Geopolitical tensions creating unpredictable energy sector moves. High sentiment volatility indicates uncertain directional bias.",
  actions: ["Reduce energy exposure", "Use straddles for XLE", "Monitor news closely"],
  timeframe: "immediate",
  risk: "high"
}];
export const NewsCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedNews, setSelectedNews] = useState<typeof mockNews[0] | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [newsUrl, setNewsUrl] = useState('');
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-success';
    if (sentiment < -0.3) return 'text-destructive';
    return 'text-muted-foreground';
  };
  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.6) return 'Very Bullish';
    if (sentiment > 0.3) return 'Bullish';
    if (sentiment > -0.3) return 'Neutral';
    if (sentiment > -0.6) return 'Bearish';
    return 'Very Bearish';
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
  const getRecommendationType = (type: string) => {
    switch (type) {
      case 'strategy':
        return {
          icon: Target,
          color: 'text-chart-1'
        };
      case 'opportunity':
        return {
          icon: TrendingUp,
          color: 'text-success'
        };
      case 'alert':
        return {
          icon: AlertTriangle,
          color: 'text-destructive'
        };
      default:
        return {
          icon: Lightbulb,
          color: 'text-muted-foreground'
        };
    }
  };
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
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-xs text-success">+23% vs yesterday</div>
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
              <div className="text-2xl font-bold text-success">+0.67</div>
              <div className="text-xs text-muted-foreground">Bullish territory</div>
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
              <div className="text-2xl font-bold">87%</div>
              <div className="text-xs text-chart-3">High accuracy</div>
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
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-destructive">3 high impact</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">News Feed</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="signals">Trading Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Search news..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="earnings">Earnings</SelectItem>
                <SelectItem value="economic-data">Economic Data</SelectItem>
                <SelectItem value="monetary-policy">Monetary Policy</SelectItem>
                <SelectItem value="geopolitical">Geopolitical</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
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
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {mockNews.map(news => <Card key={news.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setSelectedNews(news);
              setIsNewsModalOpen(true);
            }}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{news.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>{news.source}</span>
                          <span>•</span>
                          <span>{news.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-sm font-medium ${getSentimentColor(news.sentiment)}`}>
                          {getSentimentLabel(news.sentiment)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{news.summary}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {news.tickers.map(ticker => <Badge key={ticker} variant="outline" className="text-xs">
                            {ticker}
                          </Badge>)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        <span>{(news.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>Real-time market sentiment throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[-1, 1]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sentiment" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* News Volume */}
            <Card>
              <CardHeader>
                <CardTitle>News Volume</CardTitle>
                <CardDescription>News article volume by time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>News Categories</CardTitle>
                <CardDescription>Distribution of news by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({
                    name,
                    percent
                  }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>Current sentiment distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Very Bullish</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Bullish</span>
                    <span className="text-sm font-medium">41%</span>
                  </div>
                  <Progress value={41} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Neutral</span>
                    <span className="text-sm font-medium">21%</span>
                  </div>
                  <Progress value={21} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Bearish</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Very Bearish</span>
                    <span className="text-sm font-medium">3%</span>
                  </div>
                  <Progress value={3} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Trading Signals</CardTitle>
              <CardDescription>News-driven trading opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Signals</h3>
                <p className="text-muted-foreground">
                  Trading signals will appear here when news events create actionable opportunities
                </p>
              </div>
            </CardContent>
          </Card>
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
                  <span className="font-medium">{selectedNews.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedNews.timestamp}</span>
                </div>
                <Badge variant={getImpactBadgeVariant(selectedNews.impact)}>
                  {selectedNews.impact} impact
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedNews.category.replace('-', ' ')}
                </Badge>
              </div>

              {/* Sentiment & Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Market Sentiment</div>
                        <div className={`text-lg font-bold ${getSentimentColor(selectedNews.sentiment)}`}>
                          {getSentimentLabel(selectedNews.sentiment)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {selectedNews.sentiment.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {selectedNews.sentiment > 0 ? '+' : ''}{(selectedNews.sentiment * 100).toFixed(0)}%
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
                        <div className="text-lg font-bold">{(selectedNews.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedNews.confidence > 0.9 ? 'Very High' : selectedNews.confidence > 0.8 ? 'High' : selectedNews.confidence > 0.7 ? 'Medium' : 'Low'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-chart-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* News Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedNews.summary}
                </p>
              </div>

              {/* Affected Tickers */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Affected Securities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNews.tickers.map(ticker => <Badge key={ticker} variant="secondary" className="px-3 py-1 text-sm font-mono">
                      {ticker}
                    </Badge>)}
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
                          {selectedNews.impact === 'high' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                          {selectedNews.impact === 'medium' && <BarChart3 className="w-4 h-4 text-warning" />}
                          {selectedNews.impact === 'low' && <TrendingUp className="w-4 h-4 text-success" />}
                          <span className="capitalize font-medium">{selectedNews.impact} Impact Expected</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Trading Bias</div>
                        <div className="flex items-center gap-2">
                          {selectedNews.sentiment > 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                          <span className="font-medium">
                            {selectedNews.sentiment > 0 ? 'Bullish' : 'Bearish'} Outlook
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
              <Input id="newsUrl" type="url" value={newsUrl} onChange={e => setNewsUrl(e.target.value)} placeholder="https://example.com/news-article" className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
              setIsUrlModalOpen(false);
              setNewsUrl('');
            }}>
                Cancel
              </Button>
              <Button onClick={() => {
              // TODO: Handle URL submission
              console.log('Submitting news URL:', newsUrl);
              setIsUrlModalOpen(false);
              setNewsUrl('');
            }} disabled={!newsUrl}>
                Add News
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};