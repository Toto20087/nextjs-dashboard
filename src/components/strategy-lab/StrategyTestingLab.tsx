import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  BarChart3, 
  TestTube,
  TrendingUp,
  Target,
  Activity,
  ArrowRight,
  Calendar,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts';
import { EnhancedTradeAnalytics } from '../analytics/EnhancedTradeAnalytics';
import { NewBacktestModal } from './NewBacktestModal';

// Define proper types for the backtest data
interface BacktestPerformance {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
}

// Detailed results from the API
interface BacktestResults {
  status: string;
  metadata: {
    strategyName: string;
    symbols: Array<{ symbol: string }>;
    period: {
      start: string;
      end: string;
    };
    parameters: Record<string, any>;
    jobId: string;
    initialCapital: number;
  };
  metrics: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    netProfit: number;
  };
  equityCurve: Array<{
    date: string;
    value: number;
    drawdown: number;
  }>;
  trades: Array<{
    symbol: string;
    timestamp: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    value: number;
    pnl: number;
    position_size: number;
  }>;
  readyForApproval: boolean;
}

interface BacktestRun {
  id: string;
  name: string;
  indicators: string[];
  tickers: string[];
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  performance: BacktestPerformance;
}

// Get performance evolution data - use actual data when available, otherwise fallback to mock
const getPerformanceEvolution = (backtestId: string, equityCurve?: BacktestResults['equityCurve'], initialCapital?: number, metrics?: BacktestResults['metrics']) => {
  if (equityCurve && equityCurve.length > 0) {
    const capital = initialCapital || 0;
    const sharpeRatio = metrics?.sharpeRatio || 0;
    
    return equityCurve.map((point, index) => {
      const date = new Date(point.date);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${month}/${day}`;
      
      return {
        date: formattedDate,
        value: point.value,
        cumulativeReturn: Number(((point.value - capital) / capital * 100).toFixed(2)),
        drawdown: Number((point.drawdown * 100).toFixed(2)),
        sharpe: Number(sharpeRatio.toFixed(2)), // Use actual Sharpe ratio
        trades: metrics?.totalTrades ? Math.ceil((index + 1) * metrics.totalTrades / equityCurve.length) : index + 1 // Approximate progressive trade count
      };
    });
  }
};

export const StrategyTestingLab = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Fetch backtest history from API (all records, no backend filtering)
  const { data: backtestHistoryData, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ['backtest-history-all'],
    queryFn: async () => {
      const response = await fetch('/api/backtests');
      if (!response.ok) throw new Error('Failed to fetch backtest history');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 600000, // Poll every 10 minutes for updates
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
  });

  // Transform grouped API data to job groups
  const jobGroups = React.useMemo(() => {
    if (backtestHistoryData && backtestHistoryData.items && typeof backtestHistoryData.items === 'object') {
      return Object.entries(backtestHistoryData.items).map(([jobId, backtests]: [string, any[]]) => {
        const firstBacktest = backtests[0];
        
        const allSymbols = backtests.reduce((symbols: string[], backtest: any) => {
          const backtestSymbols = backtest.symbols.map((s: any) => s.symbol);
          return [...symbols, ...backtestSymbols];
        }, []);
        const uniqueSymbols = [...new Set(allSymbols)];
        
        return {
          jobId,
          name: firstBacktest.strategy.name.toUpperCase() + ' Strategy',
          strategy: firstBacktest.strategy,
          symbols: uniqueSymbols,
          status: firstBacktest.status,
          createdAt: firstBacktest.createdAt,
          period: firstBacktest.period,
          backtestRuns: backtests.map((bt: any) => ({
            id: bt.id.toString(),
            name: bt.symbols.map((s: any) => s.symbol).join(', '),
            symbols: bt.symbols.map((s: any) => s.symbol),
            status: bt.status,
            ...bt // Include all original data for compatibility
          }))
        };
      });
    }
    return [];
  }, [backtestHistoryData]);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedBacktestRunId, setSelectedBacktestRunId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewBacktestModal, setShowNewBacktestModal] = useState(false);

  // Fetch detailed results when a backtest run is selected
  const { data: backtestResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ['backtest-results', selectedBacktestRunId],
    queryFn: async () => {
      if (!selectedBacktestRunId) return null;
      const response = await fetch(`/api/backtests/${selectedBacktestRunId}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch backtest results');
      }
      const result = await response.json();
      return result.data as BacktestResults;
    },
    enabled: !!selectedBacktestRunId && !!selectedJob,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
  });

  // Filter job groups by status
  const filteredJobs = jobGroups.filter((job: any) =>
    filterStatus === 'all' || job.status === filterStatus
  );

  // Get selected backtest from selectedJob and selectedBacktestRunId for compatibility with existing code
  const selectedBacktest: BacktestRun | null = React.useMemo(() => {
    if (!selectedJob || !selectedBacktestRunId) return null;
    
    const selectedRun = selectedJob.backtestRuns.find((run: any) => run.id === selectedBacktestRunId);
    if (!selectedRun) return null;

    // Transform to BacktestRun format for compatibility
    return {
      id: selectedRun.id,
      name: selectedJob.name,
      indicators: [selectedJob.strategy.name.toUpperCase()],
      tickers: selectedJob.symbols,
      startDate: new Date(selectedJob.period.startDate).toISOString().split('T')[0],
      endDate: new Date(selectedJob.period.endDate).toISOString().split('T')[0],
      status: selectedRun.status,
      createdAt: selectedJob.createdAt,
      performance: selectedRun.basicMetrics ? {
        totalReturn: parseFloat((selectedRun.basicMetrics.totalReturn * 100).toFixed(2)),
        sharpeRatio: parseFloat(selectedRun.basicMetrics.sharpeRatio.toFixed(2)),
        maxDrawdown: parseFloat((selectedRun.basicMetrics.maxDrawdown * 100).toFixed(2)),
        winRate: parseFloat((selectedRun.basicMetrics.winRate * 100).toFixed(1)),
        totalTrades: selectedRun.basicMetrics.totalTrades
      } : {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0
      }
    };
  }, [selectedJob, selectedBacktestRunId]);

  const sendToApproval = () => {
    if (selectedBacktest) {
      console.log('Sending backtest to approval:', selectedBacktest.id);
      // This would integrate with Strategy Approval in a real implementation
    }
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

  const getPerformanceBadge = (performance: BacktestPerformance) => {
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

  // Show jobs list if no job selected yet  
  if (!selectedJob) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Jobs List */}
          <Card className="lg:col-span-3 flex flex-col min-h-0">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Backtest Jobs
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
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-surface-elevated hover:border-primary"
                      onClick={() => {
                        setSelectedJob(job);
                        // Auto-select first backtest run when job is selected
                        if (job.backtestRuns.length > 0) {
                          setSelectedBacktestRunId(job.backtestRuns[0].id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-1">
                          {getStatusCircle(job.status)}
                        </div>
                      </div>
                      
                      <div className="text-sm font-semibold mb-1">{job.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Job: {job.jobId.slice(0, 8)}...
                      </div>
                      
                      {/* Show combined symbols */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {job.symbols.map(symbol => (
                          <Badge key={symbol} variant="secondary" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>• {job.backtestRuns.length} runs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Selected Job Info */}
        <Card className="lg:col-span-1 flex flex-col min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Selected Job
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedJob(null);
                  setSelectedBacktestRunId('');
                }}
              >
                ← Back to Jobs
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold">{selectedJob.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Job: {selectedJob.jobId.slice(0, 8)}...
                </div>
                
                {/* Show combined symbols */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedJob.symbols.map(symbol => (
                    <Badge key={symbol} variant="secondary" className="text-xs">
                      {symbol}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                  <span>• {selectedJob.backtestRuns.length} runs</span>
                </div>
              </div>

              {/* Dropdown for selecting backtest runs */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Backtest Run:</label>
                <Select value={selectedBacktestRunId} onValueChange={setSelectedBacktestRunId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select backtest run" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {selectedJob.backtestRuns.map((run: any) => (
                      <SelectItem key={run.id} value={run.id}>
                        {run.name} - ID: {run.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backtest Details */}
        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {selectedBacktest?.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedBacktest?.id}</Badge>
                  {getStatusCircle(selectedBacktest?.status ?? '')}
                  {selectedBacktest?.status === 'completed' && getPerformanceBadge(selectedBacktest.performance)}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedBacktest?.status === 'completed' && selectedBacktest.performance.totalReturn > 10 && (
                  <Button size="sm" onClick={sendToApproval}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Send to Approval
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingResults && selectedBacktest?.status === 'completed' && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading detailed results...</span>
                </div>
              </div>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
                
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
                            {selectedBacktest?.indicators.map(indicator => (
                              <Badge key={indicator} variant="outline" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Tickers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedBacktest?.tickers.map(ticker => (
                              <Badge key={ticker} variant="secondary" className="text-xs">
                                {ticker}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Period:</span>
                          <div className="font-mono text-sm">{selectedBacktest?.startDate} to {selectedBacktest?.endDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {selectedBacktest?.status === 'completed' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <div className={`text-2xl font-bold ${(backtestResults?.metrics.totalReturn ?? selectedBacktest.performance.totalReturn) > 0 ? 'text-success' : 'text-destructive'}`}>
                        {(backtestResults?.metrics.totalReturn ?? selectedBacktest.performance.totalReturn) > 0 ? '+' : ''}
                        {backtestResults?.metrics.totalReturn 
                          ? (backtestResults.metrics.totalReturn * 100).toFixed(2) 
                          : selectedBacktest.performance.totalReturn}%
                      </div>
                      <div className="text-sm text-muted-foreground">Total Return</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {backtestResults?.metrics.sharpeRatio?.toFixed(2) ?? selectedBacktest.performance.sharpeRatio}
                      </div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {backtestResults?.metrics.maxDrawdown 
                          ? (backtestResults.metrics.maxDrawdown * 100).toFixed(2)
                          : selectedBacktest.performance.maxDrawdown}%
                      </div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {backtestResults?.metrics.winRate 
                          ? (backtestResults.metrics.winRate * 100).toFixed(1)
                          : selectedBacktest.performance.winRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {selectedBacktest?.status === 'completed' ? (
                  <>
                    {/* Key Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-chart-1" />
                          <span className="text-sm text-muted-foreground">Total Trades</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {backtestResults?.metrics.totalTrades ?? selectedBacktest.performance.totalTrades}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm text-muted-foreground">Winning Trades</span>
                        </div>
                        <div className="text-2xl font-bold text-success">
                          {backtestResults?.metrics.winningTrades ?? Math.round(selectedBacktest.performance.totalTrades * selectedBacktest.performance.winRate / 100)}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-muted-foreground">Losing Trades</span>
                        </div>
                        <div className="text-2xl font-bold text-destructive">
                          {backtestResults?.metrics.losingTrades ?? (selectedBacktest.performance.totalTrades - Math.round(selectedBacktest.performance.totalTrades * selectedBacktest.performance.winRate / 100))}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-chart-2" />
                          <span className="text-sm text-muted-foreground">Profit Factor</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {backtestResults?.metrics.profitFactor?.toFixed(2) ?? 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="w-4 h-4 text-chart-3" />
                          <span className="text-sm text-muted-foreground">Win Rate</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {backtestResults?.metrics.winRate ? (backtestResults.metrics.winRate * 100).toFixed(1) : selectedBacktest.performance.winRate}%
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-chart-4" />
                          <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {backtestResults?.metrics.sharpeRatio?.toFixed(2) ?? selectedBacktest.performance.sharpeRatio}
                        </div>
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
                            <AreaChart data={getPerformanceEvolution(selectedBacktest?.id ?? '', backtestResults?.equityCurve, backtestResults?.metadata.initialCapital, backtestResults?.metrics)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  return value; // Use the formatted date directly (MM/DD)
                                }}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <RechartsTooltip 
                                content={({ active, payload, label }: any) => {
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
                                fill="hsl(var(--primary))" 
                                fillOpacity={0.8}
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
                              <AreaChart data={getPerformanceEvolution(selectedBacktest.id, backtestResults?.equityCurve, backtestResults?.metadata.initialCapital, backtestResults?.metrics)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }}
                                  tickFormatter={(value) => {
                                    return value; // Use the formatted date directly (MM/DD)
                                  }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
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
                              <LineChart data={getPerformanceEvolution(selectedBacktest.id, backtestResults?.equityCurve, backtestResults?.metadata.initialCapital, backtestResults?.metrics)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 12 }}
                                  tickFormatter={(value) => {
                                    return value; // Use the formatted date directly (MM/DD)
                                  }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
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
                <EnhancedTradeAnalytics 
                  selectedStrategy={selectedBacktest?.name}
                  trades={backtestResults?.trades}
                />
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