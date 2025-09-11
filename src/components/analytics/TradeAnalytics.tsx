import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';

// Mock trade data
const mockTrades = [
  {
    id: 'TR_001',
    strategy: 'Momentum Alpha',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 100,
    entryPrice: 185.50,
    exitPrice: 192.30,
    entryTime: '2024-01-15T09:30:00',
    exitTime: '2024-01-16T15:45:00',
    pnl: 680,
    pnlPercent: 3.67,
    duration: '1d 6h 15m',
    commission: 2.50,
    slippage: 0.05,
    status: 'closed',
    reason: 'take_profit'
  },
  {
    id: 'TR_002',
    strategy: 'Mean Reversion',
    symbol: 'TSLA',
    side: 'SELL',
    quantity: 50,
    entryPrice: 245.80,
    exitPrice: 238.20,
    entryTime: '2024-01-16T10:15:00',
    exitTime: '2024-01-16T14:30:00',
    pnl: 380,
    pnlPercent: 3.09,
    duration: '4h 15m',
    commission: 1.75,
    slippage: 0.12,
    status: 'closed',
    reason: 'take_profit'
  },
  {
    id: 'TR_003',
    strategy: 'Breakout Pro',
    symbol: 'NVDA',
    side: 'BUY',
    quantity: 25,
    entryPrice: 520.40,
    exitPrice: 508.90,
    entryTime: '2024-01-17T11:00:00',
    exitTime: '2024-01-17T16:00:00',
    pnl: -287.50,
    pnlPercent: -2.21,
    duration: '5h',
    commission: 1.25,
    slippage: 0.08,
    status: 'closed',
    reason: 'stop_loss'
  },
  {
    id: 'TR_004',
    strategy: 'Momentum Alpha',
    symbol: 'MSFT',
    side: 'BUY',
    quantity: 75,
    entryPrice: 412.30,
    exitPrice: null,
    entryTime: '2024-01-18T09:45:00',
    exitTime: null,
    pnl: 450,
    pnlPercent: 1.45,
    duration: '2h 30m',
    commission: 0,
    slippage: 0,
    status: 'open',
    reason: null
  }
];

// Performance metrics data
const performanceData = [
  { date: '2024-01-15', cumPnL: 680, drawdown: 0, trades: 1 },
  { date: '2024-01-16', cumPnL: 1060, drawdown: 0, trades: 3 },
  { date: '2024-01-17', cumPnL: 773, drawdown: -287, trades: 4 },
  { date: '2024-01-18', cumPnL: 1223, drawdown: 0, trades: 5 },
];

const winLossData = [
  { name: 'Wins', value: 68, fill: 'hsl(var(--success))' },
  { name: 'Losses', value: 32, fill: 'hsl(var(--destructive))' }
];

const strategyPerformance = [
  { strategy: 'Momentum Alpha', trades: 156, winRate: 72.3, avgReturn: 2.3, totalPnL: 15420 },
  { strategy: 'Mean Reversion', trades: 203, winRate: 68.9, avgReturn: 1.8, totalPnL: 12850 },
  { strategy: 'Breakout Pro', trades: 89, winRate: 64.7, avgReturn: 3.2, totalPnL: 8750 },
];

const hourlyDistribution = [
  { hour: '09:30', trades: 12, avgPnL: 1.2 },
  { hour: '10:00', trades: 18, avgPnL: 0.8 },
  { hour: '10:30', trades: 22, avgPnL: 1.5 },
  { hour: '11:00', trades: 25, avgPnL: 0.9 },
  { hour: '11:30', trades: 20, avgPnL: 1.1 },
  { hour: '12:00', trades: 15, avgPnL: 0.6 },
  { hour: '12:30', trades: 8, avgPnL: 0.3 },
  { hour: '13:00', trades: 10, avgPnL: 0.7 },
  { hour: '13:30', trades: 16, avgPnL: 1.0 },
  { hour: '14:00', trades: 19, avgPnL: 1.3 },
  { hour: '14:30', trades: 24, avgPnL: 1.6 },
  { hour: '15:00', trades: 28, avgPnL: 1.8 },
  { hour: '15:30', trades: 21, avgPnL: 1.4 },
  { hour: '16:00', trades: 14, avgPnL: 0.9 },
];

export const TradeAnalytics = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [timeRange, setTimeRange] = useState('1M');
  const [selectedTab, setSelectedTab] = useState('overview');

  const filteredTrades = mockTrades.filter(trade => 
    selectedStrategy === 'all' || trade.strategy === selectedStrategy
  );

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
  const totalTrades = filteredTrades.filter(trade => trade.status === 'closed').length;
  const winRate = totalTrades > 0 ? (winTrades / totalTrades * 100) : 0;
  const avgWin = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winTrades || 0;
  const avgLoss = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / (totalTrades - winTrades)) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trade Analytics</h2>
          <p className="text-muted-foreground">Comprehensive trade performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="Momentum Alpha">Momentum Alpha</SelectItem>
              <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
              <SelectItem value="Breakout Pro">Breakout Pro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="1W">1W</SelectItem>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="1Y">1Y</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total P&L</div>
                <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(totalPnL)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
                <div className="text-2xl font-bold">{totalTrades}</div>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Profit Factor</div>
                <div className="text-2xl font-bold">{avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '∞'}</div>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trades">Trade List</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* P&L Evolution */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Cumulative P&L
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="cumPnL"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Win/Loss Distribution */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Win/Loss Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Performance Comparison */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Strategy Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={strategyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="strategy" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalPnL" fill="hsl(var(--primary))" name="Total P&L" />
                  <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="hsl(var(--success))" strokeWidth={3} name="Win Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredTrades.map((trade) => (
                    <div key={trade.id} className="p-4 border rounded-lg bg-surface">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{trade.id}</Badge>
                          <Badge variant="secondary">{trade.strategy}</Badge>
                          <Badge 
                            className={trade.side === 'BUY' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}
                          >
                            {trade.side}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {trade.pnl >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(trade.pnl)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Symbol:</span>
                          <div className="font-semibold">{trade.symbol}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <div className="font-semibold">{trade.quantity}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entry:</span>
                          <div className="font-semibold">${trade.entryPrice}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit:</span>
                          <div className="font-semibold">
                            {trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Return:</span>
                          <div className={`font-semibold ${trade.pnlPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-semibold">{trade.duration}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={trade.status === 'open' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}>
                            {trade.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit Reason:</span>
                          <div className="font-semibold">{trade.reason || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Hourly Trading Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="trades" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Average Win</div>
                    <div className="text-lg font-bold text-success">{formatCurrency(avgWin)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Average Loss</div>
                    <div className="text-lg font-bold text-destructive">{formatCurrency(-avgLoss)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-bold text-destructive">-$287.50</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Recovery Factor</div>
                    <div className="text-lg font-bold">4.25</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Trade Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Best Performing Hour</div>
                  <div className="text-lg font-bold">15:00 - 15:30</div>
                  <div className="text-sm text-success">+1.8% avg return</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Most Active Symbol</div>
                  <div className="text-lg font-bold">AAPL</div>
                  <div className="text-sm text-primary">32% of trades</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Optimal Hold Time</div>
                  <div className="text-lg font-bold">4-6 hours</div>
                  <div className="text-sm text-success">74% win rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};