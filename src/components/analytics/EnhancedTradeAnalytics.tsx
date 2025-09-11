import React, { useState, useMemo } from 'react';
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  ZoomIn,
  ZoomOut,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { cn } from '../../lib/utils';

// Enhanced mock trade data with timestamps for charting
const allTrades = [
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
    entryTimestamp: new Date('2024-01-15T09:30:00').getTime(),
    exitTimestamp: new Date('2024-01-16T15:45:00').getTime(),
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
    entryTimestamp: new Date('2024-01-16T10:15:00').getTime(),
    exitTimestamp: new Date('2024-01-16T14:30:00').getTime(),
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
    entryTimestamp: new Date('2024-01-17T11:00:00').getTime(),
    exitTimestamp: new Date('2024-01-17T16:00:00').getTime(),
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
    entryPrice: 420.15,
    exitPrice: 435.80,
    entryTime: '2024-01-18T13:45:00',
    exitTime: '2024-01-19T10:20:00',
    entryTimestamp: new Date('2024-01-18T13:45:00').getTime(),
    exitTimestamp: new Date('2024-01-19T10:20:00').getTime(),
    pnl: 1173.75,
    pnlPercent: 3.73,
    duration: '20h 35m',
    commission: 2.25,
    slippage: 0.15,
    status: 'closed',
    reason: 'take_profit'
  },
  {
    id: 'TR_005',
    strategy: 'Mean Reversion',
    symbol: 'GOOGL',
    side: 'SELL',
    quantity: 30,
    entryPrice: 142.90,
    exitPrice: 138.45,
    entryTime: '2024-01-19T09:00:00',
    exitTime: '2024-01-19T15:30:00',
    entryTimestamp: new Date('2024-01-19T09:00:00').getTime(),
    exitTimestamp: new Date('2024-01-19T15:30:00').getTime(),
    pnl: 133.50,
    pnlPercent: 3.11,
    duration: '6h 30m',
    commission: 1.50,
    slippage: 0.07,
    status: 'closed',
    reason: 'take_profit'
  },
  {
    id: 'TR_006',
    strategy: 'Breakout Pro',
    symbol: 'AMD',
    side: 'BUY',
    quantity: 80,
    entryPrice: 145.20,
    exitPrice: 141.30,
    entryTime: '2024-01-20T10:30:00',
    exitTime: '2024-01-20T14:15:00',
    entryTimestamp: new Date('2024-01-20T10:30:00').getTime(),
    exitTimestamp: new Date('2024-01-20T14:15:00').getTime(),
    pnl: -312.00,
    pnlPercent: -2.69,
    duration: '3h 45m',
    commission: 2.00,
    slippage: 0.10,
    status: 'closed',
    reason: 'stop_loss'
  }
];

// Mock price data for the chart
const generatePriceData = () => {
  const baseDate = new Date('2024-01-15T09:00:00');
  const data = [];
  
  for (let i = 0; i < 120; i++) { // 5 days of hourly data
    const timestamp = new Date(baseDate.getTime() + i * 60 * 60 * 1000);
    const basePrice = 500 + Math.sin(i * 0.1) * 50 + Math.random() * 20;
    
    data.push({
      timestamp: timestamp.getTime(),
      time: timestamp.toISOString(),
      price: basePrice,
      volume: Math.random() * 1000000 + 500000
    });
  }
  
  return data;
};

interface EnhancedTradeAnalyticsProps {
  selectedStrategy?: string;
}

export const EnhancedTradeAnalytics = ({ selectedStrategy }: EnhancedTradeAnalyticsProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [selectedTradeType, setSelectedTradeType] = useState('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [useAllTime, setUseAllTime] = useState(true);

  const priceData = useMemo(() => generatePriceData(), []);

  // Filter trades based on selections
  const filteredTrades = useMemo(() => {
    return allTrades.filter(trade => {
      const symbolMatch = selectedSymbol === 'ALL' || trade.symbol === selectedSymbol;
      const typeMatch = selectedTradeType === 'ALL' || trade.side === selectedTradeType;
      const strategyMatch = !selectedStrategy || trade.strategy === selectedStrategy;
      
      // Date filtering
      let dateMatch = true;
      if (!useAllTime && startDate && endDate) {
        const tradeDate = new Date(trade.entryTime);
        dateMatch = tradeDate >= startDate && tradeDate <= endDate;
      }
      
      return symbolMatch && typeMatch && strategyMatch && dateMatch;
    });
  }, [selectedSymbol, selectedTradeType, selectedStrategy, startDate, endDate, useAllTime]);

  // Get unique symbols for filter
  const symbols = [...new Set(allTrades.map(trade => trade.symbol))];

  // Prepare chart data with buy/sell points
  const chartData = useMemo(() => {
    const data = priceData.map(point => ({
      ...point,
      buyPoints: [],
      sellPoints: []
    }));

    filteredTrades.forEach(trade => {
      // Find closest price data point for entry
      const entryIndex = data.findIndex(point => 
        Math.abs(point.timestamp - trade.entryTimestamp) < 60 * 60 * 1000 // within 1 hour
      );
      
      const exitIndex = data.findIndex(point => 
        Math.abs(point.timestamp - trade.exitTimestamp) < 60 * 60 * 1000
      );

      if (entryIndex !== -1) {
        if (trade.side === 'BUY') {
          data[entryIndex].buyPoints.push({
            ...trade,
            y: trade.entryPrice
          });
        } else {
          data[entryIndex].sellPoints.push({
            ...trade,
            y: trade.entryPrice
          });
        }
      }

      if (exitIndex !== -1 && exitIndex !== entryIndex) {
        if (trade.side === 'BUY') {
          data[exitIndex].sellPoints.push({
            ...trade,
            y: trade.exitPrice,
            isExit: true
          });
        } else {
          data[exitIndex].buyPoints.push({
            ...trade,
            y: trade.exitPrice,
            isExit: true
          });
        }
      }
    });

    return data;
  }, [priceData, filteredTrades]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-sm">
            Price: <span className="font-bold">{formatCurrency(data.price)}</span>
          </p>
          {data.buyPoints.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-success font-medium">Buy Orders:</p>
              {data.buyPoints.map((trade: any, idx: number) => (
                <p key={idx} className="text-xs">
                  {trade.symbol}: {formatCurrency(trade.y)} ({trade.quantity} shares)
                </p>
              ))}
            </div>
          )}
          {data.sellPoints.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-destructive font-medium">Sell Orders:</p>
              {data.sellPoints.map((trade: any, idx: number) => (
                <p key={idx} className="text-xs">
                  {trade.symbol}: {formatCurrency(trade.y)} ({trade.quantity} shares)
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winningTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Trade Analysis</h3>
          <p className="text-sm text-muted-foreground">Detailed trade execution and performance</p>
        </div>
        
        {/* Filter Controls - Wrapped Layout */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={useAllTime ? "default" : "outline"}
            size="sm"
            onClick={() => setUseAllTime(true)}
          >
            All Time
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal min-w-[120px]",
                  !startDate && "text-muted-foreground"
                )}
                onClick={() => setUseAllTime(false)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM dd") : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal min-w-[120px]",
                  !endDate && "text-muted-foreground"
                )}
                onClick={() => setUseAllTime(false)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM dd") : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="ALL">All Symbols</SelectItem>
              {symbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedTradeType} onValueChange={setSelectedTradeType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="BUY">Buy Only</SelectItem>
              <SelectItem value="SELL">Sell Only</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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
              <DollarSign className={cn(
                "w-8 h-8",
                totalPnL >= 0 ? "text-success" : "text-destructive"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
                <div className="text-xl font-bold">{filteredTrades.length}</div>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-xl font-bold text-success">{winRate.toFixed(1)}%</div>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
                <div className="text-xl font-bold">5h 30m</div>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Price Chart with Trade Execution Points</span>
            <div className="flex items-center gap-2">
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Price line */}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                
                {/* Buy points */}
                <ScatterChart data={chartData}>
                  <Scatter
                    dataKey="buyPoints"
                    fill="hsl(var(--success))"
                    name="Buy Orders"
                    shape="triangle"
                  />
                </ScatterChart>
                
                {/* Sell points */}
                <ScatterChart data={chartData}>
                  <Scatter
                    dataKey="sellPoints"
                    fill="hsl(var(--destructive))"
                    name="Sell Orders"
                    shape="triangleDown"
                  />
                </ScatterChart>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trade Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Details ({filteredTrades.length} trades)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-2 pr-4">
              {allTrades.map((trade) => (
                <div key={trade.id} className="border border-border rounded-lg p-4 hover:bg-surface/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                    <div>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-xs text-muted-foreground">{trade.id}</div>
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
                      <div className="text-sm font-medium">${trade.exitPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">exit</div>
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
                      <div className="text-xs text-muted-foreground">
                        {new Date(trade.entryTime).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Badge 
                        variant={trade.reason === 'take_profit' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {trade.reason.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};