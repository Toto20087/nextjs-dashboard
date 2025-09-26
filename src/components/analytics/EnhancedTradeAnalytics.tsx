import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  TrendingUp,
  DollarSign,
  Target,
} from 'lucide-react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
} from 'recharts';
import { cn } from '../../lib/utils';

interface EnhancedTradeAnalyticsProps {
  selectedStrategy?: string;
  trades?: Array<{
    symbol: string;
    timestamp: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    value: number;
    pnl: number;
    position_size: number;
  }>;
}

export const EnhancedTradeAnalytics = ({ trades }: EnhancedTradeAnalyticsProps) => {

  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    return trades
  }, [trades]);

  // Create price line data from trades
  const priceData = useMemo(() => {
    return filteredTrades.map(trade => ({
      timestamp: new Date(trade.timestamp).getTime(),
      close: trade.price
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredTrades]);

  // Prepare trade data for scatter plots
  const buyTrades = useMemo(() => {
    return filteredTrades
      .filter(t => t.side.toLowerCase() === 'buy')
      .map(trade => ({
        ...trade,
        timestamp: new Date(trade.timestamp).getTime(),
        price: trade.price
      }));
  }, [filteredTrades]);

  const sellTrades = useMemo(() => {
    return filteredTrades
      .filter(t => t.side.toLowerCase() === 'sell')
      .map(trade => ({
        ...trade,
        timestamp: new Date(trade.timestamp).getTime(),
        price: trade.price
      }));
  }, [filteredTrades]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <ComposedChart 
                data={priceData}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  domain={['dataMin - 0.2', 'dataMax + 0.2']}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const date = new Date(data.timestamp);
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
                          <p><span className="text-muted-foreground">Price:</span> <span className="font-bold">${data.close?.toFixed(4) || 'N/A'}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                
                {/* Price line connecting trade points */}
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                
                <Scatter
                  dataKey="price"
                  data={buyTrades}
                  fill="#22c55e"
                  name="Buy Orders"
                />
                
                <Scatter
                  dataKey="price"
                  data={sellTrades}
                  fill="#ef4444"
                  name="Sell Orders"
                />
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
              {filteredTrades.map((trade, index) => (
                <div key={`${trade.symbol}-${trade.timestamp}-${index}`} className="border border-border rounded-lg p-4 hover:bg-surface/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={trade.side.toLocaleLowerCase()   === 'buy' ? 'default' : 'destructive'}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">{trade.quantity.toFixed(6)}</div>
                      <div className="text-xs text-muted-foreground">shares</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">${trade.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">price</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">${trade.value.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">value</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-bold",
                        trade.pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(trade.pnl)}
                      </div>
                      <div className="text-xs text-muted-foreground">P&L</div>
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