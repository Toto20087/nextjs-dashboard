import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');

  // Map period to Alpaca API format
  const mapPeriodToAlpaca = (period: TimePeriod) => {
    switch (period) {
      case '1D': return '1D';
      case '1W': return '7D';  
      case '1M': return '1M';
      case '1Y': return '1Y';
      case 'YTD': return 'all';
      default: return '1M';
    }
  };

  // Fetch portfolio history (market-mosaic style)
  const { data: portfolioHistory, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio-history', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/account/portfolio?period=${mapPeriodToAlpaca(selectedPeriod)}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio history');
      }
      return result.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes like market-mosaic
    staleTime: 120000, // Consider data stale after 2 minutes
  });

  // Fetch current account data for real-time portfolio value
  const { data: currentAccountData } = useQuery({
    queryKey: ['current-account-data'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/account');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch current account data');
      }
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    staleTime: 15000,
  });

  // Fetch real SPY historical data (like market-mosaic)
  const { data: spyData, isLoading: spyLoading, error: spyError } = useQuery({
    queryKey: ['spy-historical', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/market-data/SPY/history?timeframe=1Day&limit=30`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch SPY data');
      }
      return result.data?.bars || [];
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
  });

  const isLoading = portfolioLoading || spyLoading;
  const error = portfolioError || spyError;

  // Create portfolio vs SPY comparison data (exact same as market-mosaic)
  const chartData = useMemo(() => {
    if (!portfolioHistory || portfolioHistory.length === 0 || !spyData || spyData.length === 0) {
      return [];
    }

    // Calculate initial values for percentage calculations
    const initialPortfolio = portfolioHistory[0].portfolio;
    const initialSPY = spyData[0]?.close || 450; // Use first SPY close price
    
    // Create aligned data with both portfolio and SPY values
    const alignedData = [];
    const maxLength = Math.min(portfolioHistory.length, spyData.length);
    
    for (let i = 0; i < maxLength; i++) {
      const portfolioItem = portfolioHistory[i];
      const spyItem = spyData[i];
      
      if (portfolioItem?.portfolio && spyItem?.close) {
        const portfolioValue = portfolioItem.portfolio;
        const spyValue = spyItem.close;
        
        // Calculate percentage returns relative to start
        const portfolioChange = initialPortfolio > 0 
          ? ((portfolioValue - initialPortfolio) / initialPortfolio) * 100
          : 0;
        
        const spyChange = initialSPY > 0
          ? ((spyValue - initialSPY) / initialSPY) * 100
          : 0;
        
        alignedData.push({
          date: portfolioItem.date, // Already formatted like "Aug 12"
          portfolio: Math.round(portfolioValue),
          spy: Number(spyValue.toFixed(2)),
          portfolioChange: Number(portfolioChange.toFixed(2)),
          spyChange: Number(spyChange.toFixed(2))
        });
      }
    }
    
    return alignedData;
  }, [portfolioHistory, spyData]);

  const latestData = chartData[chartData.length - 1];
  
  // Get current portfolio performance from API data
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const portfolioData = payload.find((p) => p.dataKey === 'portfolioChange');
      const spyData = payload.find((p) => p.dataKey === 'spyChange');
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-primary">Portfolio:</span>
              <span className="text-sm font-mono">{formatPercentage(portfolioData?.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">SPY:</span>
              <span className="text-sm font-mono">{formatPercentage(spyData?.value || 0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Portfolio Performance vs SPY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading portfolio data...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Portfolio Performance vs SPY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-center text-muted-foreground">
              <p className="text-destructive mb-2">Failed to load portfolio data</p>
              <p className="text-sm">Please check your Alpaca API configuration</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="portfolioChange"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                name="Portfolio Return %"
              />
              <Line
                type="monotone"
                dataKey="spyChange"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                name="SPY Return %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Value</div>
            <div className="text-lg font-semibold financial-data">
              {formatCurrency(
                currentAccountData?.portfolioValue 
                  ? parseFloat(currentAccountData.portfolioValue)
                  : latestData?.portfolio || 0
              )}
            </div>
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