import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

type TimePeriod = '1D' | '1W' | '1M' | '1Y' | 'YTD';

interface ChartDataPoint {
  date: string;
  portfolio: number;
  spy: number;
  portfolioChange: number;
  spyChange: number;
}

export const PortfolioPerformanceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');

  // Mock data - in real app this would come from API
  const generateMockData = (period: TimePeriod): ChartDataPoint[] => {
    const now = new Date();
    let days = 1;
    let dataPoints = 24; // hourly for 1D
    
    switch (period) {
      case '1D':
        days = 1;
        dataPoints = 24;
        break;
      case '1W':
        days = 7;
        dataPoints = 7;
        break;
      case '1M':
        days = 30;
        dataPoints = 30;
        break;
      case '1Y':
        days = 365;
        dataPoints = 52; // weekly data points
        break;
      case 'YTD':
        days = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        dataPoints = Math.min(days, 52);
        break;
    }

    const data: ChartDataPoint[] = [];
    const basePortfolio = 1000000; // $1M starting value
    const baseSpy = 100; // Normalized SPY starting value
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (days / dataPoints) * 24 * 60 * 60 * 1000);
      
      // Generate realistic but volatile performance data
      const portfolioVolatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
      const spyVolatility = 0.01 + Math.random() * 0.02; // 1-3% daily volatility
      
      const portfolioTrend = 1 + (Math.random() - 0.45) * portfolioVolatility; // Slight positive bias
      const spyTrend = 1 + (Math.random() - 0.48) * spyVolatility; // Slight positive bias
      
      const prevPortfolio = i === dataPoints ? basePortfolio : data[data.length - 1]?.portfolio || basePortfolio;
      const prevSpy = i === dataPoints ? baseSpy : data[data.length - 1]?.spy || baseSpy;
      
      const portfolio = prevPortfolio * portfolioTrend;
      const spy = prevSpy * spyTrend;
      
      const portfolioChange = ((portfolio - basePortfolio) / basePortfolio) * 100;
      const spyChange = ((spy - baseSpy) / baseSpy) * 100;
      
      data.push({
        date: period === '1D' ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolio: Math.round(portfolio),
        spy: Number(spy.toFixed(2)),
        portfolioChange: Number(portfolioChange.toFixed(2)),
        spyChange: Number(spyChange.toFixed(2))
      });
    }
    
    return data;
  };

  const chartData = generateMockData(selectedPeriod);
  const latestData = chartData[chartData.length - 1];
  const portfolioPerformance = latestData?.portfolioChange || 0;
  const spyPerformance = latestData?.spyChange || 0;
  const outperformance = portfolioPerformance - spyPerformance;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const portfolioData = payload.find((p: any) => p.dataKey === 'portfolio');
      const spyData = payload.find((p: any) => p.dataKey === 'spy');
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-primary">Portfolio:</span>
              <span className="text-sm font-mono">{formatCurrency(portfolioData?.value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">SPY:</span>
              <span className="text-sm font-mono">${spyData?.value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Portfolio Performance vs SPY
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Portfolio:</span>
                <span className={cn(
                  "text-sm font-semibold",
                  portfolioPerformance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatPercentage(portfolioPerformance)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">SPY:</span>
                <span className={cn(
                  "text-sm font-semibold",
                  spyPerformance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatPercentage(spyPerformance)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Alpha:</span>
                <Badge variant={outperformance >= 0 ? "default" : "destructive"} className="text-xs">
                  {outperformance >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {formatPercentage(outperformance)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '1Y', 'YTD'] as TimePeriod[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="text-xs px-3 py-1"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                domain={['dataMin - 1000', 'dataMax + 1000']}
                tickFormatter={(value) => selectedPeriod === '1D' && typeof value === 'number' ? formatCurrency(value) : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                name="Portfolio Value"
              />
              <Line
                type="monotone"
                dataKey="spy"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                name="SPY Benchmark"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Value</div>
            <div className="text-lg font-semibold financial-data">{formatCurrency(latestData?.portfolio || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Return</div>
            <div className={cn(
              "text-lg font-semibold",
              portfolioPerformance >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatPercentage(portfolioPerformance)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">vs SPY</div>
            <div className={cn(
              "text-lg font-semibold",
              outperformance >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatPercentage(outperformance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};