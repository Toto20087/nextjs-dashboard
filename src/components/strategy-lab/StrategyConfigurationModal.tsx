'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  Trophy,
  AlertTriangle,
  Settings,
  Activity,
  Zap,
  Clock,
  Star
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface Strategy {
  id: number;
  name: string;
  status: string;
  allocation: number; // Fixed dollar amount
  performance: string;
  sharpe: number;
  maxDrawdown: string;
  positions: number;
  lastUpdate: string;
  approver: string | null;
  isActive: boolean;
  managed_by: 'rust' | 'n8n'; // Management type
  utilized_capital: number; // Currently deployed capital
  available_capital: number; // Available for new positions
}

interface StrategyConfigurationModalProps {
  strategy: Strategy | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyConfigurationModal = ({ strategy, isOpen, onClose }: StrategyConfigurationModalProps) => {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  if (!strategy) return null;

  // Mock detailed data for the strategy
  const strategySnapshot = {
    totalTrades: 847,
    winRate: 68.2,
    avgWin: 2.4,
    avgLoss: -1.1,
    profitFactor: 2.18,
    maxConsecutiveWins: 12,
    maxConsecutiveLosses: 5,
    sharpeRatio: strategy.sharpe,
    sortinoRatio: 2.1,
    calmarRatio: 1.8,
    avgHoldTime: '2.3 days',
    monthlyReturn: 8.4,
    annualReturn: 15.2
  };

  const tickerPerformance = [
    { symbol: 'AAPL', quantity: 189, avgPrice: 185.23, currentPrice: 219.45, allocation: 35000, performance: '+18.3%', trades: 156, winRate: 72, pnl: 6405, status: 'outperforming', strategyPercent: 28.5 },
    { symbol: 'MSFT', quantity: 82, avgPrice: 341.67, currentPrice: 392.13, allocation: 28000, performance: '+14.7%', trades: 134, winRate: 69, pnl: 4116, status: 'outperforming', strategyPercent: 22.8 },
    { symbol: 'GOOGL', quantity: 161, avgPrice: 155.34, currentPrice: 174.12, allocation: 25000, performance: '+12.1%', trades: 98, winRate: 65, pnl: 3025, status: 'meeting', strategyPercent: 20.3 },
    { symbol: 'TSLA', quantity: 80, avgPrice: 250.45, currentPrice: 272.78, allocation: 20000, performance: '+8.9%', trades: 167, winRate: 61, pnl: 1780, status: 'underperforming', strategyPercent: 16.3 },
    { symbol: 'NVDA', quantity: 36, avgPrice: 416.89, currentPrice: 519.34, allocation: 15000, performance: '+24.6%', trades: 89, winRate: 78, pnl: 3690, status: 'outperforming', strategyPercent: 12.2 },
    { symbol: 'AMZN', quantity: 79, avgPrice: 151.90, currentPrice: 161.32, allocation: 12000, performance: '+6.2%', trades: 76, winRate: 58, pnl: 744, status: 'underperforming', strategyPercent: 9.8 }
  ];

  const topWinners = [
    { symbol: 'NVDA', trade: 'Long 100 shares @ $420', pnl: '+$2,340', date: '2024-01-15', duration: '3.2 days' },
    { symbol: 'AAPL', trade: 'Long 200 shares @ $185', pnl: '+$1,890', date: '2024-01-12', duration: '2.1 days' },
    { symbol: 'MSFT', trade: 'Long 150 shares @ $340', pnl: '+$1,620', date: '2024-01-10', duration: '4.6 days' },
    { symbol: 'GOOGL', trade: 'Long 80 shares @ $155', pnl: '+$1,240', date: '2024-01-08', duration: '1.8 days' },
    { symbol: 'TSLA', trade: 'Long 120 shares @ $250', pnl: '+$960', date: '2024-01-05', duration: '2.9 days' }
  ];

  const performanceHistory = [
    { date: '2024-01-01', cumulative: 0, daily: 0 },
    { date: '2024-01-05', cumulative: 2.1, daily: 0.8 },
    { date: '2024-01-10', cumulative: 4.8, daily: 1.2 },
    { date: '2024-01-15', cumulative: 7.2, daily: -0.3 },
    { date: '2024-01-20', cumulative: 9.8, daily: 1.5 },
    { date: '2024-01-25', cumulative: 15.2, daily: 2.1 }
  ];

  const allocationData = tickerPerformance.map(ticker => ({
    name: ticker.symbol,
    value: ticker.allocation,
    performance: parseFloat(ticker.performance.replace('%', '').replace('+', ''))
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outperforming': return 'text-success';
      case 'meeting': return 'text-primary';
      case 'underperforming': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'outperforming': return <TrendingUp className="w-4 h-4" />;
      case 'meeting': return <Target className="w-4 h-4" />;
      case 'underperforming': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Settings className="w-5 h-5" />
            {strategy.name} - Configuration & Analysis
          </DialogTitle>
          <DialogDescription>
            Comprehensive strategy overview, performance analysis, and ticker-level insights
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Strategy Overview */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Strategy Snapshot
                  <Badge variant={strategy.managed_by === 'rust' ? 'default' : 'secondary'} className="ml-auto">
                    {strategy.managed_by === 'rust' ? 'Rust Engine' : 'n8n Workflow'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Capital Allocation Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-3 p-4 bg-surface/30 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground">Allocated Capital</div>
                    <div className="text-2xl font-bold financial-data">{formatCurrency(strategy.allocation)}</div>
                  </div>
                  <div className="space-y-3 p-4 bg-surface/30 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground">Utilized Capital</div>
                    <div className="text-2xl font-bold text-warning">{formatCurrency(strategy.utilized_capital || strategy.allocation * 0.85)}</div>
                    <Progress value={((strategy.utilized_capital || strategy.allocation * 0.85) / strategy.allocation) * 100} className="w-full" />
                  </div>
                  <div className="space-y-3 p-4 bg-surface/30 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground">Available Capital</div>
                    <div className="text-2xl font-bold text-success">{formatCurrency(strategy.available_capital || strategy.allocation * 0.15)}</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Performance</div>
                    <div className="text-xl font-bold text-success">{strategy.performance}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                    <div className="text-xl font-bold">{strategySnapshot.totalTrades}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="text-xl font-bold">{strategySnapshot.winRate}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Active Positions</div>
                    <div className="text-xl font-bold">{strategy.positions}</div>
                  </div>
                </div>

                {/* Historical Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-lg font-semibold">{strategySnapshot.sharpeRatio}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-semibold text-destructive">{strategy.maxDrawdown}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Monthly Return</div>
                    <div className="text-lg font-semibold text-success">{strategySnapshot.monthlyReturn}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Annual Return</div>
                    <div className="text-lg font-semibold text-success">{strategySnapshot.annualReturn}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Profit Factor</div>
                    <div className="text-lg font-semibold">{strategySnapshot.profitFactor}</div>
                  </div>
                </div>

                {/* Management Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm text-muted-foreground">
                      Strategy Status: 
                      <Badge variant={strategy.isActive ? 'default' : 'secondary'} className="ml-2">
                        {strategy.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="tickers" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tickers">Ticker Analysis</TabsTrigger>
                <TabsTrigger value="winners">Top Winners</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
              </TabsList>

              <TabsContent value="tickers" className="space-y-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Ticker Performance Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tickerPerformance.map((ticker) => (
                        <div 
                          key={ticker.symbol}
                          className="p-4 border border-border rounded-lg hover:bg-surface/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedTicker(ticker.symbol === selectedTicker ? null : ticker.symbol)}
                        >
                           <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(ticker.status)}
                                <div className="font-mono text-lg font-bold">{ticker.symbol}</div>
                              </div>
                              <Badge className={getStatusColor(ticker.status)}>
                                {ticker.status}
                              </Badge>
                              <div className="text-sm text-muted-foreground">
                                {ticker.strategyPercent}% of strategy
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-success">{ticker.performance}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(ticker.pnl)} P&L
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Position</div>
                              <div className="font-semibold">{ticker.quantity} shares</div>
                              <div className="text-xs text-muted-foreground">@ {formatCurrency(ticker.avgPrice)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Current Price</div>
                              <div className="font-semibold">{formatCurrency(ticker.currentPrice)}</div>
                              <div className="text-xs text-success">
                                +{(((ticker.currentPrice - ticker.avgPrice) / ticker.avgPrice) * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Allocation</div>
                              <div className="font-semibold financial-data">{formatCurrency(ticker.allocation)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Trades</div>
                              <div className="font-semibold">{ticker.trades}</div>
                              <div className="text-xs text-muted-foreground">{ticker.winRate}% win rate</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Performance</div>
                              <Progress value={ticker.winRate} className="w-full mt-1" />
                              <div className="text-xs text-muted-foreground mt-1">{ticker.winRate}%</div>
                            </div>
                          </div>

                          {selectedTicker === ticker.symbol && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Avg Win</div>
                                  <div className="font-semibold text-success">+$248</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Avg Loss</div>
                                  <div className="font-semibold text-destructive">-$127</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Best Trade</div>
                                  <div className="font-semibold text-success">+$1,240</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Worst Trade</div>
                                  <div className="font-semibold text-destructive">-$456</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="winners" className="space-y-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Top Winning Trades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topWinners.map((trade, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-warning" />
                              <span className="font-mono font-bold">{trade.symbol}</span>
                            </div>
                            <div>
                              <div className="font-medium">{trade.trade}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {trade.date}
                                <Clock className="w-3 h-3 ml-2" />
                                {trade.duration}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-success">{trade.pnl}</div>
                            <div className="text-sm text-muted-foreground">#{index + 1} Winner</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Cumulative Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumulative" 
                            stroke="hsl(var(--success))" 
                            fill="hsl(var(--success) / 0.1)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="allocation" className="space-y-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Capital Allocation by Ticker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Optimize Strategy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};