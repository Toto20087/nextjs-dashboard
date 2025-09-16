import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Play, 
  Send,
  BarChart3, 
  TestTube,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Activity,
  PieChart,
  Eye,
  CheckCircle,
  Filter,
  ArrowRight,
  Calendar,
  Users,
  TrendingDown,
  Percent,
  Timer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TradeAnalytics } from '../analytics/TradeAnalytics';
import { EnhancedTradeAnalytics } from '../analytics/EnhancedTradeAnalytics';
import { RegimeAnalysis } from '../analytics/RegimeAnalysis';
import { AdvancedCharts } from '../live-trading/components/AdvancedCharts';
import { NewBacktestModal } from './NewBacktestModal';
import { vectorBtService } from '../../services/api';
import { transformBacktestHistory, BacktestHistoryItem } from '../../types/vectorbt';


// Mock data for historical backtest runs
const backtestRuns = [
  {
    id: 'BT_001',
    name: 'Momentum Alpha + MACD',
    indicators: ['RSI', 'MACD', 'SMA_20', 'SMA_50'],
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    allocatedPercentage: 25.0,
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    status: 'completed',
    createdAt: '2025-01-15T14:30:00',
    performance: {
      totalReturn: 18.7,
      sharpeRatio: 1.92,
      maxDrawdown: -6.8,
      winRate: 72.3,
      totalTrades: 156,
      avgWin: 2.3,
      avgLoss: -1.1,
      profitFactor: 2.1
    },
    regime: 'Bull Market',
    confidence: 0.89
  },
  {
    id: 'BT_002',
    name: 'Mean Reversion Pro',
    indicators: ['Bollinger Bands', 'RSI', 'Stochastic'],
    tickers: ['SPY', 'QQQ', 'IWM'],
    allocatedPercentage: 30.0,
    startDate: '2023-06-01',
    endDate: '2024-12-31',
    status: 'completed',
    createdAt: '2025-01-14T09:15:00',
    performance: {
      totalReturn: 14.2,
      sharpeRatio: 1.67,
      maxDrawdown: -9.3,
      winRate: 68.9,
      totalTrades: 203,
      avgWin: 1.8,
      avgLoss: -1.4,
      profitFactor: 1.8
    },
    regime: 'Sideways',
    confidence: 0.82
  },
  {
    id: 'BT_003',
    name: 'Breakout Strategy Enhanced',
    indicators: ['Volume Profile', 'ATR', 'EMA_12', 'EMA_26'],
    tickers: ['NVDA', 'TSLA', 'AMD'],
    allocatedPercentage: 20.0,
    startDate: '2023-03-01',
    endDate: '2024-12-31',
    status: 'completed',
    createdAt: '2025-01-13T16:45:00',
    performance: {
      totalReturn: 24.8,
      sharpeRatio: 2.15,
      maxDrawdown: -11.2,
      winRate: 64.7,
      totalTrades: 89,
      avgWin: 3.2,
      avgLoss: -1.8,
      profitFactor: 2.4
    },
    regime: 'High Volatility',
    confidence: 0.91
  },
  {
    id: 'BT_004',
    name: 'Sector Rotation Beta',
    indicators: ['Relative Strength', 'Momentum', 'Volume'],
    tickers: ['XLK', 'XLF', 'XLE', 'XLV'],
    allocatedPercentage: 15.0,
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    status: 'completed',
    createdAt: '2025-01-12T11:20:00',
    performance: {
      totalReturn: 16.9,
      sharpeRatio: 1.74,
      maxDrawdown: -7.4,
      winRate: 69.8,
      totalTrades: 124,
      avgWin: 2.1,
      avgLoss: -1.3,
      profitFactor: 1.9
    },
    regime: 'Bull Market',
    confidence: 0.85
  },
  {
    id: 'BT_005',
    name: 'ML Enhanced Momentum',
    indicators: ['Custom ML Signal', 'RSI', 'MACD'],
    tickers: ['META', 'AMZN', 'NFLX'],
    allocatedPercentage: 18.0,
    startDate: '2023-09-01',
    endDate: '2024-12-31',
    status: 'failed',
    createdAt: '2025-01-11T13:10:00',
    performance: {
      totalReturn: -5.2,
      sharpeRatio: -0.34,
      maxDrawdown: -18.7,
      winRate: 42.1,
      totalTrades: 67,
      avgWin: 1.9,
      avgLoss: -2.8,
      profitFactor: 0.7
    },
    regime: 'Bear Market',
    confidence: 0.45
  }
];

// Mock performance evolution data for chart
const getPerformanceEvolution = (backtestId: string) => {
  const baseData = [
    { date: '2023-01', cumulativeReturn: 0, drawdown: 0, sharpe: 0, trades: 0 },
    { date: '2023-02', cumulativeReturn: 2.1, drawdown: -1.2, sharpe: 0.5, trades: 8 },
    { date: '2023-03', cumulativeReturn: 4.8, drawdown: -0.8, sharpe: 0.8, trades: 15 },
    { date: '2023-04', cumulativeReturn: 3.2, drawdown: -2.1, sharpe: 0.6, trades: 23 },
    { date: '2023-05', cumulativeReturn: 6.7, drawdown: -1.5, sharpe: 1.1, trades: 31 },
    { date: '2023-06', cumulativeReturn: 9.4, drawdown: -1.8, sharpe: 1.3, trades: 39 },
    { date: '2023-07', cumulativeReturn: 11.2, drawdown: -2.3, sharpe: 1.4, trades: 47 },
    { date: '2023-08', cumulativeReturn: 8.9, drawdown: -4.1, sharpe: 1.2, trades: 55 },
    { date: '2023-09', cumulativeReturn: 12.6, drawdown: -2.8, sharpe: 1.5, trades: 63 },
    { date: '2023-10', cumulativeReturn: 15.3, drawdown: -1.9, sharpe: 1.6, trades: 71 },
    { date: '2023-11', cumulativeReturn: 17.8, drawdown: -2.5, sharpe: 1.7, trades: 79 },
    { date: '2023-12', cumulativeReturn: 19.2, drawdown: -3.2, sharpe: 1.8, trades: 87 },
    { date: '2024-01', cumulativeReturn: 16.7, drawdown: -4.8, sharpe: 1.6, trades: 95 },
    { date: '2024-02', cumulativeReturn: 18.9, drawdown: -3.1, sharpe: 1.7, trades: 103 },
    { date: '2024-03', cumulativeReturn: 21.4, drawdown: -2.2, sharpe: 1.8, trades: 111 },
    { date: '2024-04', cumulativeReturn: 23.1, drawdown: -1.8, sharpe: 1.9, trades: 119 },
    { date: '2024-05', cumulativeReturn: 20.8, drawdown: -5.1, sharpe: 1.7, trades: 127 },
    { date: '2024-06', cumulativeReturn: 22.3, drawdown: -3.4, sharpe: 1.8, trades: 135 },
    { date: '2024-07', cumulativeReturn: 24.7, drawdown: -2.9, sharpe: 1.9, trades: 143 },
    { date: '2024-08', cumulativeReturn: 21.5, drawdown: -6.8, sharpe: 1.6, trades: 151 },
    { date: '2024-09', cumulativeReturn: 18.7, drawdown: -4.2, sharpe: 1.5, trades: 156 }
  ];
  
  // Adjust data slightly based on strategy type
  const multiplier = backtestId === 'BT_003' ? 1.3 : backtestId === 'BT_002' ? 0.8 : 1;
  return baseData.map(d => ({
    ...d,
    cumulativeReturn: Number((d.cumulativeReturn * multiplier).toFixed(1)),
    drawdown: Number((d.drawdown * multiplier).toFixed(1)),
    sharpe: Number((d.sharpe * (multiplier * 0.9 + 0.1)).toFixed(2))
  }));
};

export const StrategyTestingLab = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Fetch backtest history from API
  const { data: backtestHistoryData, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ['backtest-history'],
    queryFn: async () => {
      const response = await fetch('/api/backtests');
      if (!response.ok) throw new Error('Failed to fetch backtest history');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds for updates
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
  });

  // Fetch backtest queue status
  const { data: activeJobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['backtest-queue'],
    queryFn: async () => {
      const response = await fetch('/api/backtests/queue');
      if (!response.ok) throw new Error('Failed to fetch backtest queue');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for job updates
    retry: 2,
  });

  // Transform vector-bt data to component format, with fallback to mock data
  const backtestRuns = React.useMemo(() => {
    if (backtestHistoryData && Array.isArray(backtestHistoryData)) {
      return transformBacktestHistory(backtestHistoryData);
    }
    // Fallback to minimal mock data when API is unavailable
    return [{
      id: 'BT_MOCK_001',
      name: 'Sample Strategy (Backend Offline)',
      indicators: ['RSI', 'MACD'],
      tickers: ['AAPL', 'MSFT'],
      allocatedPercentage: 25.0,
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      status: 'completed',
      createdAt: '2025-01-15T14:30:00',
      performance: {
        totalReturn: 18.7,
        sharpeRatio: 1.92,
        maxDrawdown: -6.8,
        winRate: 72.3,
        totalTrades: 156,
        avgWin: 2.3,
        avgLoss: -1.1,
        profitFactor: 2.1
      },
      regime: 'Bull Market',
      confidence: 0.89
    }];
  }, [backtestHistoryData]);

  const [selectedBacktest, setSelectedBacktest] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewBacktestModal, setShowNewBacktestModal] = useState(false);

  // Update selectedBacktest when backtestRuns data changes
  useEffect(() => {
    if (backtestRuns.length > 0 && (!selectedBacktest || !backtestRuns.find(bt => bt.id === selectedBacktest?.id))) {
      setSelectedBacktest(backtestRuns[0]);
    }
  }, [backtestRuns, selectedBacktest]);

  const filteredBacktests = backtestRuns.filter(bt => 
    filterStatus === 'all' || bt.status === filterStatus
  );

  const sendToApproval = () => {
    console.log('Sending backtest to approval:', selectedBacktest.id);
    // This would integrate with Strategy Approval in a real implementation
  };

  const handleNewBacktest = (config: any) => {
    console.log('Creating new backtest with config:', config);
    // This would start a new backtest with the configuration
  };

  const getStatusCircle = (status: string) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'completed':
          return { 
            color: 'bg-emerald-500', 
            label: 'Completed',
            description: 'Backtest completed successfully'
          };
        case 'failed':
          return { 
            color: 'bg-red-500', 
            label: 'Failed',
            description: 'Backtest failed to complete'
          };
        case 'running':
          return { 
            color: 'bg-amber-500', 
            label: 'Running',
            description: 'Backtest is currently running'
          };
        case 'pending':
          return { 
            color: 'bg-slate-400', 
            label: 'Pending',
            description: 'Backtest is queued to run'
          };
        default:
          return { 
            color: 'bg-gray-400', 
            label: 'Unknown',
            description: 'Status unknown'
          };
      }
    };

    const config = getStatusConfig(status);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`w-3 h-3 rounded-full ${config.color} cursor-help`}
              aria-label={config.label}
            />
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="max-w-xs">
            <div className="text-center">
              <div className="font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getPerformanceBadge = (performance: any) => {
    if (performance.totalReturn <= 10 || performance.sharpeRatio <= 1.0) {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Poor</Badge>;
    }
    return null;
  };

  // Show loading state
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading backtest history...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (historyError) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="text-red-500">
                <Activity className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium">Unable to Load Backtest Data</h3>
              <p className="text-muted-foreground">
                Could not connect to the vector-bt backend. Using fallback data.
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure the backend is running on port 8000.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if no backtest selected yet
  if (!selectedBacktest) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No backtest data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Backtest List */}
        <Card className="lg:col-span-1 flex flex-col min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Backtest Runs
              </CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3">
                {filteredBacktests.map((backtest) => (
                  <div
                    key={backtest.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-surface-elevated ${
                      selectedBacktest.id === backtest.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setSelectedBacktest(backtest)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-1">
                        {getStatusCircle(backtest.status)}
                        {backtest.status === 'completed' && getPerformanceBadge(backtest.performance)}
                      </div>
                    </div>
                    
                    <div className="text-sm font-semibold mb-1">{backtest.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{backtest.id}</div>
                    
                    {backtest.status === 'completed' && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Return:</span>
                          <div className={`font-bold ${backtest.performance.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                            {backtest.performance.totalReturn > 0 ? '+' : ''}{backtest.performance.totalReturn}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sharpe:</span>
                          <div className="font-bold">{backtest.performance.sharpeRatio}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max DD:</span>
                          <div className="font-bold text-destructive">{backtest.performance.maxDrawdown}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trades:</span>
                          <div className="font-bold">{backtest.performance.totalTrades}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(backtest.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Backtest Details */}
        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {selectedBacktest.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedBacktest.id}</Badge>
                  {getStatusCircle(selectedBacktest.status)}
                  {selectedBacktest.status === 'completed' && getPerformanceBadge(selectedBacktest.performance)}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedBacktest.status === 'completed' && selectedBacktest.performance.totalReturn > 10 && (
                  <Button size="sm" onClick={sendToApproval}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Send to Approval
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
                
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Configuration</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Indicators:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedBacktest.indicators.map(indicator => (
                              <Badge key={indicator} variant="outline" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Tickers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedBacktest.tickers.map(ticker => (
                              <Badge key={ticker} variant="secondary" className="text-xs">
                                {ticker}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Allocated Percentage:</span>
                          <div className="font-bold">{selectedBacktest.allocatedPercentage}%</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Period:</span>
                          <div className="font-mono text-sm">{selectedBacktest.startDate} to {selectedBacktest.endDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Regime Analysis</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Detected Regime:</span>
                          <Badge variant="default" className="ml-2">{selectedBacktest.regime}</Badge>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <div className="font-bold">{(selectedBacktest.confidence * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedBacktest.status === 'completed' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <div className={`text-2xl font-bold ${selectedBacktest.performance.totalReturn > 0 ? 'text-success' : 'text-destructive'}`}>
                        {selectedBacktest.performance.totalReturn > 0 ? '+' : ''}{selectedBacktest.performance.totalReturn}%
                      </div>
                      <div className="text-sm text-muted-foreground">Total Return</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedBacktest.performance.sharpeRatio}</div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-destructive">{selectedBacktest.performance.maxDrawdown}%</div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedBacktest.performance.winRate}%</div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {selectedBacktest.status === 'completed' ? (
                  <>
                    {/* Key Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-chart-1" />
                          <span className="text-sm text-muted-foreground">Total Trades</span>
                        </div>
                        <div className="text-2xl font-bold">{selectedBacktest.performance.totalTrades}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm text-muted-foreground">Average Win</span>
                        </div>
                        <div className="text-2xl font-bold text-success">+{selectedBacktest.performance.avgWin}%</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-muted-foreground">Average Loss</span>
                        </div>
                        <div className="text-2xl font-bold text-destructive">{selectedBacktest.performance.avgLoss}%</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-chart-2" />
                          <span className="text-sm text-muted-foreground">Profit Factor</span>
                        </div>
                        <div className="text-2xl font-bold">{selectedBacktest.performance.profitFactor}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="w-4 h-4 text-chart-3" />
                          <span className="text-sm text-muted-foreground">Win Rate</span>
                        </div>
                        <div className="text-2xl font-bold">{selectedBacktest.performance.winRate}%</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-chart-4" />
                          <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                        </div>
                        <div className="text-2xl font-bold">{selectedBacktest.performance.sharpeRatio}</div>
                      </div>
                    </div>

                    {/* Strategy Development Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Strategy Development Over Time
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Cumulative returns and key metrics evolution during the backtesting period
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getPerformanceEvolution(selectedBacktest.id)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  const [year, month] = value.split('-');
                                  return `${month}/${year.slice(2)}`;
                                }}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-semibold">{label}</p>
                                        <p className="text-success">
                                          Cumulative Return: {data.cumulativeReturn > 0 ? '+' : ''}{data.cumulativeReturn}%
                                        </p>
                                        <p className="text-destructive">
                                          Drawdown: {data.drawdown}%
                                        </p>
                                        <p>Sharpe Ratio: {data.sharpe}</p>
                                        <p>Total Trades: {data.trades}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="cumulativeReturn" 
                                stroke="hsl(var(--success))" 
                                fill="hsl(var(--success))" 
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Performance Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Drawdown Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            Drawdown Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={getPerformanceEvolution(selectedBacktest.id)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }}
                                  tickFormatter={(value) => {
                                    const [year, month] = value.split('-');
                                    return `${month}/${year.slice(2)}`;
                                  }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area 
                                  type="monotone" 
                                  dataKey="drawdown" 
                                  stroke="hsl(var(--destructive))" 
                                  fill="hsl(var(--destructive))" 
                                  fillOpacity={0.3}
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sharpe Ratio Evolution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Risk-Adjusted Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getPerformanceEvolution(selectedBacktest.id)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }}
                                  tickFormatter={(value) => {
                                    const [year, month] = value.split('-');
                                    return `${month}/${year.slice(2)}`;
                                  }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="sharpe" 
                                  stroke="hsl(var(--chart-3))" 
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Trade Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Timer className="w-5 h-5" />
                            Trade Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Winning Trades</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-success h-2 rounded-full" 
                                    style={{ width: `${selectedBacktest.performance.winRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold">{Math.round(selectedBacktest.performance.totalTrades * selectedBacktest.performance.winRate / 100)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Losing Trades</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-destructive h-2 rounded-full" 
                                    style={{ width: `${100 - selectedBacktest.performance.winRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold">{selectedBacktest.performance.totalTrades - Math.round(selectedBacktest.performance.totalTrades * selectedBacktest.performance.winRate / 100)}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Avg Trade Duration</span>
                                <span className="text-sm font-bold">2.3 hours</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Metrics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Risk Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Maximum Drawdown</span>
                              <span className="text-sm font-bold text-destructive">{selectedBacktest.performance.maxDrawdown}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Volatility (Annual)</span>
                              <span className="text-sm font-bold">12.4%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Value at Risk (95%)</span>
                              <span className="text-sm font-bold">-2.1%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Calmar Ratio</span>
                              <span className="text-sm font-bold">{(selectedBacktest.performance.totalReturn / Math.abs(selectedBacktest.performance.maxDrawdown)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-sm text-muted-foreground">Risk Score</span>
                              <Badge variant={selectedBacktest.performance.maxDrawdown > -10 ? 'default' : 'destructive'}>
                                {selectedBacktest.performance.maxDrawdown > -5 ? 'Low' : selectedBacktest.performance.maxDrawdown > -10 ? 'Medium' : 'High'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Backtest Not Completed</h3>
                    <p className="text-muted-foreground">Performance data will be available once the backtest completes successfully</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trades">
                <EnhancedTradeAnalytics selectedStrategy={selectedBacktest.name} />
              </TabsContent>


              <TabsContent value="charts">
                <AdvancedCharts />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <NewBacktestModal
        open={showNewBacktestModal}
        onOpenChange={setShowNewBacktestModal}
      />
    </div>
  );
};