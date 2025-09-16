import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { vectorBtService } from '../../../services/api';
import { transformEquityCurve, transformBacktestMetrics } from '../../../types/vectorbt';

interface PerformanceAnalyticsProps {
  selectedStrategy?: string | null;
}

export const PerformanceAnalytics = ({ selectedStrategy }: PerformanceAnalyticsProps) => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Fetch backtest history to get available runs
  const { data: backtestHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['performance-backtest-history'],
    queryFn: async () => {
      const response = await fetch('/api/backtests');
      if (!response.ok) throw new Error('Failed to fetch backtest history');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 10000,
    retry: 2,
  });

  // Extract jobs array from the response
  const backtestHistory = React.useMemo(() => {
    if (!backtestHistoryData?.jobs || !Array.isArray(backtestHistoryData.jobs)) {
      return [];
    }
    return backtestHistoryData.jobs;
  }, [backtestHistoryData]);

  // Fetch detailed results for selected run
  const { data: backtestDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['backtest-details', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      // Note: This endpoint might need to be implemented in vector-bt backend
      // For now, we'll try to get job details
      const response = await vectorBtService.backtests.getJob(selectedRunId);
      return response.data;
    },
    enabled: !!selectedRunId,
    retry: 1,
  });

  // Use the first backtest as default selection
  React.useEffect(() => {
    if (backtestHistory && backtestHistory.length > 0 && !selectedRunId) {
      const firstRun = backtestHistory[0];
      setSelectedRunId(firstRun.run_id || firstRun.job_id);
    }
  }, [backtestHistory, selectedRunId]);

  // SPY data with regime types and performance indicators (fallback data)
  const spyRegimeData = [
    { date: '2023-01-01', spyPrice: 380, regimeType: 2, regime: 'High Volatility', performanceReturn: 8.2, sharpe: 1.1, maxDrawdown: -12.5, duration: 45 },
    { date: '2023-01-15', spyPrice: 385, regimeType: 2, regime: 'High Volatility', performanceReturn: 8.2, sharpe: 1.1, maxDrawdown: -12.5, duration: 45 },
    { date: '2023-02-01', spyPrice: 390, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-02-15', spyPrice: 398, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-03-01', spyPrice: 405, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-03-15', spyPrice: 412, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-04-01', spyPrice: 420, regimeType: 3, regime: 'Low Volatility', performanceReturn: 6.3, sharpe: 1.4, maxDrawdown: -3.1, duration: 60 },
    { date: '2023-04-15', spyPrice: 418, regimeType: 3, regime: 'Low Volatility', performanceReturn: 6.3, sharpe: 1.4, maxDrawdown: -3.1, duration: 60 },
    { date: '2023-05-01', spyPrice: 410, regimeType: 1, regime: 'Bear Trend', performanceReturn: -8.1, sharpe: -0.3, maxDrawdown: -18.7, duration: 75 },
    { date: '2023-05-15', spyPrice: 405, regimeType: 1, regime: 'Bear Trend', performanceReturn: -8.1, sharpe: -0.3, maxDrawdown: -18.7, duration: 75 },
    { date: '2023-06-01', spyPrice: 425, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-06-15', spyPrice: 435, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-07-01', spyPrice: 440, regimeType: 3, regime: 'Low Volatility', performanceReturn: 6.3, sharpe: 1.4, maxDrawdown: -3.1, duration: 60 },
    { date: '2023-07-15', spyPrice: 445, regimeType: 3, regime: 'Low Volatility', performanceReturn: 6.3, sharpe: 1.4, maxDrawdown: -3.1, duration: 60 },
    { date: '2023-08-01', spyPrice: 450, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-08-15', spyPrice: 448, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-09-01', spyPrice: 435, regimeType: 2, regime: 'High Volatility', performanceReturn: 12.8, sharpe: 1.1, maxDrawdown: -12.5, duration: 45 },
    { date: '2023-09-15', spyPrice: 430, regimeType: 2, regime: 'High Volatility', performanceReturn: 12.8, sharpe: 1.1, maxDrawdown: -12.5, duration: 45 },
    { date: '2023-10-01', spyPrice: 420, regimeType: 1, regime: 'Bear Trend', performanceReturn: -8.1, sharpe: -0.3, maxDrawdown: -18.7, duration: 75 },
    { date: '2023-10-15', spyPrice: 415, regimeType: 5, regime: 'Crisis', performanceReturn: -15.2, sharpe: -0.8, maxDrawdown: -25.3, duration: 30 },
    { date: '2023-11-01', spyPrice: 445, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-11-15', spyPrice: 452, regimeType: 0, regime: 'Bull Trend', performanceReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, duration: 90 },
    { date: '2023-12-01', spyPrice: 460, regimeType: 4, regime: 'Sideways', performanceReturn: 3.1, sharpe: 0.8, maxDrawdown: -4.5, duration: 35 },
    { date: '2023-12-15', spyPrice: 465, regimeType: 4, regime: 'Sideways', performanceReturn: 3.1, sharpe: 0.8, maxDrawdown: -4.5, duration: 35 }
  ];

  // Regime performance summary
  const regimePerformance = [
    { regime: 'Bull Trend', type: 0, avgReturn: 22.4, sharpe: 1.8, maxDrawdown: -6.2, occurrences: 8, avgDuration: 90, color: 'hsl(var(--chart-2))' },
    { regime: 'Bear Trend', type: 1, avgReturn: -8.1, sharpe: -0.3, maxDrawdown: -18.7, occurrences: 3, avgDuration: 75, color: 'hsl(var(--destructive))' },
    { regime: 'High Volatility', type: 2, avgReturn: 12.8, sharpe: 1.1, maxDrawdown: -12.5, occurrences: 4, avgDuration: 45, color: 'hsl(var(--chart-3))' },
    { regime: 'Low Volatility', type: 3, avgReturn: 6.3, sharpe: 1.4, maxDrawdown: -3.1, occurrences: 4, avgDuration: 60, color: 'hsl(var(--chart-4))' },
    { regime: 'Sideways', type: 4, avgReturn: 3.1, sharpe: 0.8, maxDrawdown: -4.5, occurrences: 2, avgDuration: 35, color: 'hsl(var(--chart-1))' },
    { regime: 'Crisis', type: 5, avgReturn: -15.2, sharpe: -0.8, maxDrawdown: -25.3, occurrences: 1, avgDuration: 30, color: 'hsl(var(--destructive))' }
  ];

  // Show loading state
  if (isLoadingHistory || isLoadingDetails) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading performance analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform real data if available (handle both run_id and job_id)
  const currentBacktest = backtestHistory?.find(bt => 
    bt.run_id === selectedRunId || bt.job_id === selectedRunId
  );
  const realMetrics = currentBacktest ? {
    totalReturn: ((currentBacktest.total_return || 0) * 100).toFixed(1),
    sharpeRatio: (currentBacktest.sharpe_ratio || 0).toFixed(2),
    maxDrawdown: ((currentBacktest.max_drawdown || 0) * 100).toFixed(1),
    winRate: ((currentBacktest.win_rate || 0) * 100).toFixed(1),
  } : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">
            {currentBacktest ? `Analysis for ${currentBacktest.strategy} strategy` : 'Deep performance analysis and optimization'}
          </p>
        </div>
        {backtestHistory && backtestHistory.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Select Run:</label>
            <select 
              value={selectedRunId || ''} 
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="px-3 py-1 border border-border rounded-md bg-background text-sm"
            >
              {backtestHistory.map(bt => {
                const id = bt.run_id || bt.job_id;
                const strategy = bt.strategy || bt.mode || 'Unknown';
                const symbols = bt.symbols || bt.tickers || [];
                return (
                  <option key={id} value={id}>
                    {strategy} - {Array.isArray(symbols) ? symbols.join(', ') : 'No symbols'} - {new Date(bt.created_at).toLocaleDateString()}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Portfolio Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold financial-data ${realMetrics?.totalReturn && parseFloat(realMetrics.totalReturn) >= 0 ? 'text-success' : 'text-destructive'}`}>
              {realMetrics ? `${parseFloat(realMetrics.totalReturn) >= 0 ? '+' : ''}${realMetrics.totalReturn}%` : '+15.8%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentBacktest ? 'Total Return' : 'YTD performance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Avg Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold financial-data">
              {realMetrics ? realMetrics.sharpeRatio : '1.96'}
            </div>
            <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Max Drawdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning financial-data">
              {realMetrics ? `-${realMetrics.maxDrawdown}%` : '-9.8%'}
            </div>
            <p className="text-xs text-muted-foreground">Worst decline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold financial-data">
              {backtestHistory ? backtestHistory.length : '8'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backtestHistory ? 'Total runs' : 'Currently deployed'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regime Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            SPY-based market regime detection and strategy performance breakdown
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

            {/* Regime Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Market Regime</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Strategy performance breakdown across different market conditions
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regimePerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="regime" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold mb-2">{label}</p>
                                  <div className="space-y-1 text-sm">
                                    <p>Avg Return: <span className={`font-mono ${data.avgReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      {data.avgReturn >= 0 ? '+' : ''}{data.avgReturn}%
                                    </span></p>
                                    <p>Sharpe Ratio: <span className="font-mono">{data.sharpe}</span></p>
                                    <p>Max Drawdown: <span className="font-mono text-destructive">{data.maxDrawdown}%</span></p>
                                    <p>Occurrences: <span className="font-mono">{data.occurrences}</span></p>
                                    <p>Avg Duration: <span className="font-mono">{data.avgDuration} days</span></p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgReturn" radius={[4, 4, 0, 0]}>
                          {regimePerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Regime Statistics */}
                  <div className="space-y-4">
                    {regimePerformance.map((regime, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center">
                            <div 
                              className="w-3 h-3 rounded mr-2" 
                              style={{ backgroundColor: regime.color }}
                            ></div>
                            {regime.regime}
                          </h4>
                          <Badge variant="outline">{regime.occurrences} periods</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Return</div>
                            <div className={`font-mono font-semibold ${regime.avgReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {regime.avgReturn >= 0 ? '+' : ''}{regime.avgReturn}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Sharpe</div>
                            <div className="font-mono font-semibold">{regime.sharpe}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Duration</div>
                            <div className="font-mono font-semibold">{regime.avgDuration}d</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};