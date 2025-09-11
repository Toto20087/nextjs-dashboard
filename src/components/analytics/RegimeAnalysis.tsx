import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Shield,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  Gauge,
  Brain,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';

// Market regime definitions
const regimeTypes = {
  bull: { name: 'Bull Market', color: 'hsl(var(--success))', icon: TrendingUp },
  bear: { name: 'Bear Market', color: 'hsl(var(--destructive))', icon: TrendingDown },
  sideways: { name: 'Sideways/Consolidation', color: 'hsl(var(--warning))', icon: Activity },
  volatile: { name: 'High Volatility', color: 'hsl(var(--primary))', icon: Zap },
  lowvol: { name: 'Low Volatility', color: 'hsl(var(--muted))', icon: Shield }
};

// Historical regime data based on SPY analysis
const regimeHistory = [
  { date: '2023-01', regime: 'bear', confidence: 0.82, spyReturn: -6.2, vix: 22.1, rsi: 35.2, macd: -0.15 },
  { date: '2023-02', regime: 'bear', confidence: 0.78, spyReturn: -2.6, vix: 20.8, rsi: 42.1, macd: -0.08 },
  { date: '2023-03', regime: 'sideways', confidence: 0.65, spyReturn: 3.5, vix: 18.9, rsi: 55.3, macd: 0.02 },
  { date: '2023-04', regime: 'bull', confidence: 0.71, spyReturn: 1.5, vix: 16.2, rsi: 58.7, macd: 0.12 },
  { date: '2023-05', regime: 'bull', confidence: 0.89, spyReturn: 0.3, vix: 14.8, rsi: 62.1, macd: 0.18 },
  { date: '2023-06', regime: 'bull', confidence: 0.92, spyReturn: 6.5, vix: 13.1, rsi: 68.9, macd: 0.25 },
  { date: '2023-07', regime: 'bull', confidence: 0.87, spyReturn: 3.1, vix: 15.3, rsi: 65.4, macd: 0.22 },
  { date: '2023-08', regime: 'volatile', confidence: 0.79, spyReturn: -1.8, vix: 19.7, rsi: 48.2, macd: 0.05 },
  { date: '2023-09', regime: 'bear', confidence: 0.84, spyReturn: -4.9, vix: 21.4, rsi: 38.6, macd: -0.11 },
  { date: '2023-10', regime: 'bear', confidence: 0.88, spyReturn: -2.1, vix: 23.8, rsi: 42.3, macd: -0.18 },
  { date: '2023-11', regime: 'bull', confidence: 0.76, spyReturn: 8.9, vix: 12.9, rsi: 72.1, macd: 0.31 },
  { date: '2023-12', regime: 'bull', confidence: 0.83, spyReturn: 4.5, vix: 14.2, rsi: 68.7, macd: 0.28 },
  { date: '2024-01', regime: 'bull', confidence: 0.91, spyReturn: 1.6, vix: 13.8, rsi: 59.3, macd: 0.19 },
  { date: '2024-02', regime: 'bull', confidence: 0.85, spyReturn: 5.3, vix: 15.1, rsi: 66.2, macd: 0.24 }
];

// Strategy performance by regime
const strategyRegimePerformance = [
  {
    strategy: 'Momentum Alpha',
    bull: { return: 18.7, sharpe: 1.92, maxDD: -6.8, trades: 156 },
    bear: { return: -3.2, sharpe: -0.41, maxDD: -15.3, trades: 89 },
    sideways: { return: 8.9, sharpe: 1.23, maxDD: -4.2, trades: 124 },
    volatile: { return: 12.1, sharpe: 0.87, maxDD: -12.5, trades: 98 },
    lowvol: { return: 6.3, sharpe: 1.56, maxDD: -2.1, trades: 67 }
  },
  {
    strategy: 'Mean Reversion',
    bull: { return: 8.2, sharpe: 1.12, maxDD: -8.9, trades: 203 },
    bear: { return: 15.6, sharpe: 1.78, maxDD: -11.2, trades: 178 },
    sideways: { return: 14.3, sharpe: 1.89, maxDD: -5.7, trades: 234 },
    volatile: { return: 9.7, sharpe: 0.94, maxDD: -16.8, trades: 156 },
    lowvol: { return: 7.1, sharpe: 1.34, maxDD: -3.4, trades: 89 }
  },
  {
    strategy: 'Breakout Pro',
    bull: { return: 24.8, sharpe: 2.15, maxDD: -11.2, trades: 89 },
    bear: { return: -8.7, sharpe: -0.67, maxDD: -23.4, trades: 45 },
    sideways: { return: 2.1, sharpe: 0.23, maxDD: -8.9, trades: 67 },
    volatile: { return: 18.9, sharpe: 1.34, maxDD: -18.7, trades: 123 },
    lowvol: { return: 4.5, sharpe: 0.78, maxDD: -6.2, trades: 34 }
  }
];

// Current market indicators
const currentIndicators = [
  { name: 'SPY RSI (14)', value: 59.3, threshold: { oversold: 30, overbought: 70 }, status: 'neutral' },
  { name: 'VIX Level', value: 13.8, threshold: { low: 15, high: 25 }, status: 'low' },
  { name: 'MACD Signal', value: 0.19, threshold: { negative: 0, positive: 0.1 }, status: 'positive' },
  { name: '20/50 SMA Ratio', value: 1.08, threshold: { bearish: 1.0, bullish: 1.05 }, status: 'bullish' },
  { name: 'Market Breadth', value: 68.4, threshold: { weak: 40, strong: 60 }, status: 'strong' },
  { name: 'Options Put/Call', value: 0.78, threshold: { bullish: 0.8, bearish: 1.2 }, status: 'bullish' }
];

// Regime transition probabilities
const transitionMatrix = [
  { from: 'Bull', to: 'Bull', probability: 78.2 },
  { from: 'Bull', to: 'Sideways', probability: 15.3 },
  { from: 'Bull', to: 'Volatile', probability: 4.8 },
  { from: 'Bull', to: 'Bear', probability: 1.7 },
  { from: 'Bear', to: 'Bear', probability: 65.4 },
  { from: 'Bear', to: 'Volatile', probability: 18.9 },
  { from: 'Bear', to: 'Sideways', probability: 12.3 },
  { from: 'Bear', to: 'Bull', probability: 3.4 },
  { from: 'Sideways', to: 'Sideways', probability: 52.1 },
  { from: 'Sideways', to: 'Bull', probability: 23.7 },
  { from: 'Sideways', to: 'Volatile', probability: 14.2 },
  { from: 'Sideways', to: 'Bear', probability: 10.0 }
];

export const RegimeAnalysis = () => {
  const [selectedRegime, setSelectedRegime] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState('1M');
  const [selectedTab, setSelectedTab] = useState('current');

  const currentRegime = regimeHistory[regimeHistory.length - 1];
  const regimeConfidence = currentRegime.confidence * 100;

  const getIndicatorStatus = (indicator: any) => {
    switch (indicator.status) {
      case 'positive':
      case 'bullish':
      case 'strong':
        return { color: 'text-success', bg: 'bg-success/20' };
      case 'negative':
      case 'bearish':
      case 'weak':
        return { color: 'text-destructive', bg: 'bg-destructive/20' };
      default:
        return { color: 'text-warning', bg: 'bg-warning/20' };
    }
  };

  const formatPercent = (value: number, decimals = 1) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Regime Analysis</h2>
          <p className="text-muted-foreground">SPY-based regime detection and strategy optimization</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeHorizon} onValueChange={setTimeHorizon}>
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

      {/* Current Regime Status */}
      <Card className="trading-card border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Current Market Regime
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary">
              {regimeTypes[currentRegime.regime as keyof typeof regimeTypes].name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Confidence Level</div>
              <div className="text-2xl font-bold">{regimeConfidence.toFixed(1)}%</div>
              <Progress value={regimeConfidence} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">SPY Monthly Return</div>
              <div className={`text-2xl font-bold ${currentRegime.spyReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercent(currentRegime.spyReturn)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">VIX Level</div>
              <div className="text-2xl font-bold">{currentRegime.vix}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">RSI (14)</div>
              <div className="text-2xl font-bold">{currentRegime.rsi}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current State</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Market Indicators */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Market Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentIndicators.map((indicator, index) => {
                  const status = getIndicatorStatus(indicator);
                  return (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{indicator.name}</span>
                        <Badge className={`${status.bg} ${status.color}`}>
                          {indicator.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">{indicator.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {indicator.name.includes('RSI') && 'Oversold: 30, Overbought: 70'}
                        {indicator.name.includes('VIX') && 'Low: &lt;15, High: &gt;25'}
                        {indicator.name.includes('MACD') && 'Signal strength indicator'}
                        {indicator.name.includes('SMA') && 'Trend direction ratio'}
                        {indicator.name.includes('Breadth') && 'Market participation %'}
                        {indicator.name.includes('Put/Call') && 'Options sentiment'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Regime Recommendations */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Strategy Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="font-semibold text-success">Recommended: Momentum Alpha</span>
                  </div>
                    <p className="text-sm text-muted-foreground">
                      Current bull market regime favors momentum strategies. Expected performance: +15-20% with Sharpe ratio &gt;1.8
                    </p>
                </div>
                
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="font-semibold text-warning">Monitor: Mean Reversion</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reduced effectiveness in bull markets. Consider lower allocation or regime-specific parameters.
                  </p>
                </div>

                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive">Avoid: Breakout Pro</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    High risk in current market conditions. Wait for volatility regime transition.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Regime History & SPY Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={regimeHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
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
                  <Bar 
                    yAxisId="left" 
                    dataKey="spyReturn" 
                    fill="hsl(var(--primary))" 
                    name="SPY Return %" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3} 
                    name="Regime Confidence" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="vix" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2} 
                    name="VIX Level" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Strategy Performance by Regime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {strategyRegimePerformance.map((strategy, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4">{strategy.strategy}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(regimeTypes).map(([key, regime]) => {
                        const performance = strategy[key as keyof typeof strategy] as any;
                        const isOptimal = performance.return === Math.max(
                          strategy.bull.return,
                          strategy.bear.return,
                          strategy.sideways.return,
                          strategy.volatile.return,
                          strategy.lowvol.return
                        );
                        
                        return (
                          <div 
                            key={key} 
                            className={`p-3 border rounded-lg text-center ${isOptimal ? 'border-success bg-success/10' : ''}`}
                          >
                            <div className="text-sm font-medium mb-1">{regime.name}</div>
                            <div className={`text-lg font-bold ${performance.return >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatPercent(performance.return)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Sharpe: {performance.sharpe} | DD: {performance.maxDD}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {performance.trades} trades
                            </div>
                            {isOptimal && (
                              <Badge className="bg-success/20 text-success text-xs mt-1">
                                Optimal
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transitions" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Regime Transition Probabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">From Current Bull Market</h4>
                  <div className="space-y-3">
                    {transitionMatrix.filter(t => t.from === 'Bull').map((transition, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">To {transition.to}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={transition.probability} className="w-20" />
                          <span className="text-sm font-medium w-12">{transition.probability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Expected Duration</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Bull Market Persistence</span>
                      <span className="font-medium">3.2 months avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Next Regime Change</span>
                      <span className="font-medium">15.3% chance in 30d</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Most Likely Transition</span>
                      <span className="font-medium">To Sideways (15.3%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Regime Change Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Bull → Bear Signals</div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                     <li>• VIX &gt; 25 for 3+ days</li>
                     <li>• RSI &lt; 30 with negative MACD</li>
                    <li>• SPY breaks 50-day SMA</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Bull → Sideways Signals</div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• VIX 15-20 range</li>
                    <li>• RSI 45-55 range</li>
                    <li>• Decreasing volume</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Early Warning</div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Options skew shift</li>
                    <li>• Sector rotation patterns</li>
                    <li>• Credit spread widening</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};