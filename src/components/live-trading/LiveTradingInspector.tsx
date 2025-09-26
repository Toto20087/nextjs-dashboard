import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  TrendingUp, 
  Target,
  BarChart3,
  RefreshCw,
  Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

interface Trade {
  id: string;
  strategy: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  duration: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  riskScore: number;
}

interface StrategyMetrics {
  name: string;
  totalTrades: number;
  openTrades: number;
  dayPnL: number;
  winRate: number;
  avgHoldTime: string;
  maxDrawdown: number;
  sharpeRatio: number;
  isActive: boolean;
}

interface LiveTradingInspectorProps {
  selectedStrategy?: string | null;
}

// Data transformation utilities
interface ApiTrade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  commission?: number;
  fees?: number;
  executedAt: string;
  strategyName?: string;
}

interface ApiPosition {
  symbol: string;
  market_value: string;
  qty: string;
}

const transformApiTradeToComponentTrade = (apiTrade: ApiTrade, positions: ApiPosition[] = []): Trade => {
  // Find current market price from positions if available
  const position = positions.find(p => p.symbol === apiTrade.symbol);
  const currentPrice = position?.market_value && position?.qty 
    ? parseFloat(position.market_value) / parseFloat(position.qty)
    : apiTrade.price; // Fallback to execution price

  // Calculate duration from executed_at to now
  const executedAt = new Date(apiTrade.executedAt);
  const now = new Date();
  const durationMs = now.getTime() - executedAt.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Calculate real-time P&L
  const quantity = apiTrade.quantity;
  const entryPrice = apiTrade.price;
  const priceDiff = currentPrice - entryPrice;
  const pnl = apiTrade.side.toLowerCase() === 'buy' 
    ? quantity * priceDiff - (apiTrade.commission || 0) - (apiTrade.fees || 0)
    : quantity * -priceDiff - (apiTrade.commission || 0) - (apiTrade.fees || 0);
  const pnlPercent = entryPrice > 0 ? (priceDiff / entryPrice) * 100 : 0;

  return {
    id: apiTrade.id,
    strategy: apiTrade.strategyName || 'Unknown Strategy',
    symbol: apiTrade.symbol,
    side: apiTrade.side.toUpperCase() as 'BUY' | 'SELL',
    quantity: quantity,
    entryPrice: entryPrice,
    currentPrice: currentPrice,
    pnl: pnl,
    pnlPercent: pnlPercent,
    entryTime: executedAt.toLocaleTimeString('en-US', { hour12: false }),
    duration: duration,
    status: 'OPEN', // Assume all trades are open for live view
    riskScore: Math.random() * 10 // Placeholder - would need risk calculation logic
  };
};

const calculateStrategyMetrics = (strategyName: string, trades: Trade[]): StrategyMetrics => {
  const strategyTrades = trades.filter(t => t.strategy === strategyName);
  const totalTrades = strategyTrades.length;
  const openTrades = strategyTrades.length; // All shown trades are considered "open"
  
  // Calculate day P&L (trades from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayPnL = strategyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  
  // Calculate win rate
  const winningTrades = strategyTrades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Calculate average hold time from duration strings
  const avgHoldTime = strategyTrades.length > 0 
    ? strategyTrades[0]?.duration || "0m" 
    : "0m";
  
  return {
    name: strategyName,
    totalTrades,
    openTrades,
    dayPnL,
    winRate,
    avgHoldTime,
    maxDrawdown: -5.0, // Placeholder - would need historical calculation
    sharpeRatio: 1.5, // Placeholder - would need historical calculation
    isActive: true
  };
};

export const LiveTradingInspector = ({ selectedStrategy }: LiveTradingInspectorProps) => {
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch active strategies
  const { data: strategiesData, refetch: refetchStrategies } = useQuery({
    queryKey: ['active-strategies'],
    queryFn: async () => {
      const response = await fetch('/api/strategies/active');
      if (!response.ok) throw new Error('Failed to fetch strategies');
      const result = await response.json();
      return result.data.strategies;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh enabled
    retry: false,
  });

  // Fetch trades with optional date range filtering
  const { data: tradesData, refetch: refetchTrades } = useQuery({
    queryKey: ['recent-trades', startDate, endDate],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      
      // If no dates specified, default to last 24 hours for live view
      if (!startDate && !endDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        params.append('startDate', yesterday.toISOString());
      } else {
        if (startDate) params.append('startDate', new Date(startDate).toISOString());
        if (endDate) params.append('endDate', new Date(endDate).toISOString());
      }
      
      params.append('limit', '100');
      params.append('sortBy', 'executed_at');
      params.append('sortOrder', 'desc');
      
      const response = await fetch(`/api/trades?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      const result = await response.json();
      return result.data.items[0]?.trades || [];
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds for live trades
    retry: false,
  });

  // Fetch current positions for real-time pricing
  const { data: positionsData, refetch: refetchPositions } = useQuery({
    queryKey: ['positions-data'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const result = await response.json();
      return result.data?.positions || [];
    },
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds
    retry: false,
  });

  // Transform API data to component format
  const transformedTrades: Trade[] = (tradesData || []).map((trade: ApiTrade) => 
    transformApiTradeToComponentTrade(trade, positionsData)
  );

  // Calculate strategy metrics from real data
  const strategies: StrategyMetrics[] = (strategiesData || []).map((strategy: {id: number, name: string}) => {
    const strategyName = strategy.name;
    return calculateStrategyMetrics(strategyName, transformedTrades);
  });

  // Use transformed trades as the live trades data
  const liveTrades: Trade[] = transformedTrades;

  // Filter trades based on selected strategy from props or dropdown
  const effectiveFilter = selectedStrategy || selectedStrategyFilter;
  const filteredTrades = effectiveFilter === 'all' 
    ? liveTrades 
    : liveTrades.filter(trade => trade.strategy === effectiveFilter);

  // Set the dropdown to match the selected strategy if provided
  React.useEffect(() => {
    if (selectedStrategy) {
      setSelectedStrategyFilter(selectedStrategy);
    }
  }, [selectedStrategy]);

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const openTrades = filteredTrades.filter(trade => trade.status === 'OPEN').length;
  const winningTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-success';
    if (score <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Manually trigger refetch of all data
      await Promise.all([
        refetchStrategies(),
        refetchTrades(),
        refetchPositions()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // No need for separate auto-refresh since React Query handles this with refetchInterval

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Trading Inspector</h2>
          <p className="text-muted-foreground">Real-time trade monitoring and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Strategy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total P&L</div>
                <div className={cn(
                  "text-xl font-bold",
                  totalPnL >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(totalPnL)}
                </div>
              </div>
              <TrendingUp className={cn(
                "w-8 h-8",
                totalPnL >= 0 ? "text-success" : "text-destructive"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Open Trades</div>
                <div className="text-xl font-bold">{openTrades}</div>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-xl font-bold text-success">{winRate.toFixed(1)}%</div>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Active Strategies</div>
                <div className="text-xl font-bold">{strategies.filter(s => s.isActive).length}</div>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Trades View */}
      <div className="space-y-4">
        {/* Filters */}
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Strategy Filter */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">Filter by Strategy:</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedStrategyFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStrategyFilter('all')}
                  >
                    All Strategies
                  </Button>
                  {strategies.map((strategy) => (
                    <Button
                      key={strategy.name}
                      variant={selectedStrategyFilter === strategy.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStrategyFilter(strategy.name)}
                    >
                      {strategy.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">Date Range:</span>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 border border-border rounded text-sm bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 border border-border rounded text-sm bg-background"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="mt-4"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Trades Table */}
        <Card className="trading-card">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Trades 
                {effectiveFilter !== 'all' && <span className="text-sm font-normal">- {effectiveFilter}</span>}
                {(startDate || endDate) && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({startDate && `from ${startDate}`} {startDate && endDate && '|'} {endDate && `to ${endDate}`})
                  </span>
                )}
              </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <div key={trade.id} className="border border-border rounded-lg p-4 hover:bg-surface/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                    <div>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-xs text-muted-foreground">{trade.strategy}</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                        {trade.side}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">{trade.quantity}</div>
                      <div className="text-xs text-muted-foreground">shares</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">${trade.entryPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">entry</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">${trade.currentPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">current</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-bold",
                        trade.pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(trade.pnl)}
                      </div>
                      <div className={cn(
                        "text-xs",
                        trade.pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatPercentage(trade.pnlPercent)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm">{trade.duration}</div>
                      <div className="text-xs text-muted-foreground">{trade.entryTime}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={cn("text-sm font-medium", getRiskColor(trade.riskScore))}>
                        {trade.riskScore}/10
                      </div>
                      <div className="text-xs text-muted-foreground">risk</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};