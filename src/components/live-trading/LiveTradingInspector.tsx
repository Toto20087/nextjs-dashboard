import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Target,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

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

export const LiveTradingInspector = ({ selectedStrategy }: LiveTradingInspectorProps) => {
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock live trading data - in real app this would come from WebSocket/API
  const strategies: StrategyMetrics[] = [
    {
      name: 'Momentum Strategy A',
      totalTrades: 234,
      openTrades: 12,
      dayPnL: 15420,
      winRate: 68.3,
      avgHoldTime: '2h 15m',
      maxDrawdown: -8.3,
      sharpeRatio: 1.8,
      isActive: true
    },
    {
      name: 'Mean Reversion B',
      totalTrades: 156,
      openTrades: 8,
      dayPnL: -3240,
      winRate: 72.1,
      avgHoldTime: '4h 32m',
      maxDrawdown: -12.1,
      sharpeRatio: 1.2,
      isActive: true
    },
    {
      name: 'Pairs Trading C',
      totalTrades: 89,
      openTrades: 6,
      dayPnL: 8750,
      winRate: 65.2,
      avgHoldTime: '1h 45m',
      maxDrawdown: -5.9,
      sharpeRatio: 2.3,
      isActive: true
    }
  ];

  const liveTrades: Trade[] = [
    {
      id: 'T001',
      strategy: 'Momentum Strategy A',
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 500,
      entryPrice: 185.42,
      currentPrice: 187.15,
      pnl: 865.00,
      pnlPercent: 0.93,
      entryTime: '09:34:12',
      duration: '2h 15m',
      status: 'OPEN',
      riskScore: 6.2
    },
    {
      id: 'T002',
      strategy: 'Pairs Trading C',
      symbol: 'TSLA',
      side: 'SELL',
      quantity: 200,
      entryPrice: 248.90,
      currentPrice: 246.33,
      pnl: 514.00,
      pnlPercent: 1.03,
      entryTime: '10:12:45',
      duration: '1h 37m',
      status: 'OPEN',
      riskScore: 7.8
    },
    {
      id: 'T003',
      strategy: 'Mean Reversion B',
      symbol: 'MSFT',
      side: 'BUY',
      quantity: 300,
      entryPrice: 378.21,
      currentPrice: 376.89,
      pnl: -396.00,
      pnlPercent: -0.35,
      entryTime: '08:45:33',
      duration: '3h 04m',
      status: 'OPEN',
      riskScore: 4.1
    },
    {
      id: 'T004',
      strategy: 'Momentum Strategy A',
      symbol: 'NVDA',
      side: 'BUY',
      quantity: 150,
      entryPrice: 495.67,
      currentPrice: 498.23,
      pnl: 384.00,
      pnlPercent: 0.52,
      entryTime: '11:22:18',
      duration: '28m',
      status: 'OPEN',
      riskScore: 8.9
    },
    {
      id: 'T005',
      strategy: 'Pairs Trading C',
      symbol: 'GOOGL',
      side: 'SELL',
      quantity: 100,
      entryPrice: 142.78,
      currentPrice: 141.95,
      pnl: 83.00,
      pnlPercent: 0.58,
      entryTime: '09:55:07',
      duration: '1h 54m',
      status: 'OPEN',
      riskScore: 5.5
    }
  ];

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Auto-refresh simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        // In real app, this would fetch latest data
        console.log('Auto-refreshing trade data...');
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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
        {/* Strategy Filter */}
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Filter by Strategy:</span>
              <div className="flex gap-2">
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
          </CardContent>
        </Card>

        {/* Live Trades Table */}
        <Card className="trading-card">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Trades {effectiveFilter !== 'all' && `- ${effectiveFilter}`}
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