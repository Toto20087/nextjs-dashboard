import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
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
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  Target,
  Zap,
  X
} from 'lucide-react';

interface Strategy {
  id: number;
  name: string;
  status: string;
  allocation: number;
  performance: string;
  sharpe: number;
  maxDrawdown: string;
  positions: number;
  lastUpdate: string;
  approver: string | null;
  isActive: boolean;
}

interface StrategyApprovalModalProps {
  strategy: Strategy | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (strategyId: number) => void;
  onReject: (strategyId: number) => void;
}

export const StrategyApprovalModal: React.FC<StrategyApprovalModalProps> = ({
  strategy,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  if (!strategy) return null;

  // Mock performance data
  const performanceData = [
    { date: '2024-01', strategy: 12.5, benchmark: 8.2, drawdown: -2.1 },
    { date: '2024-02', strategy: 15.8, benchmark: 9.1, drawdown: -1.8 },
    { date: '2024-03', strategy: 18.2, benchmark: 10.5, drawdown: -3.2 },
    { date: '2024-04', strategy: 22.1, benchmark: 12.1, drawdown: -2.8 },
    { date: '2024-05', strategy: 25.4, benchmark: 13.8, drawdown: -4.1 },
    { date: '2024-06', strategy: 28.9, benchmark: 15.2, drawdown: -3.5 },
  ];

  const riskMetrics = [
    { metric: 'VaR (95%)', value: '-2.8%', status: 'good' },
    { metric: 'Beta', value: '0.85', status: 'good' },
    { metric: 'Alpha', value: '4.2%', status: 'excellent' },
    { metric: 'Correlation (SPY)', value: '0.72', status: 'moderate' },
    { metric: 'Volatility', value: '16.8%', status: 'moderate' },
    { metric: 'Information Ratio', value: '1.35', status: 'good' },
  ];

  const monteCarloData = [
    { scenario: 'P10', return: -5.2, probability: 10 },
    { scenario: 'P25', return: 2.8, probability: 25 },
    { scenario: 'P50', return: 8.7, probability: 50 },
    { scenario: 'P75', return: 14.2, probability: 75 },
    { scenario: 'P90', return: 19.8, probability: 90 },
  ];

  const correlationData = [
    { asset: 'SPY', correlation: 0.72, color: '#ef4444' },
    { asset: 'QQQ', correlation: 0.68, color: '#f97316' },
    { asset: 'IWM', correlation: 0.45, color: '#eab308' },
    { asset: 'TLT', correlation: -0.23, color: '#22c55e' },
    { asset: 'GLD', correlation: 0.12, color: '#3b82f6' },
    { asset: 'VIX', correlation: -0.58, color: '#8b5cf6' },
  ];

  const walkForwardData = [
    { period: 'Q1 2024', inSample: 15.2, outSample: 14.8, efficiency: 97.4 },
    { period: 'Q2 2024', inSample: 18.5, outSample: 16.9, efficiency: 91.4 },
    { period: 'Q3 2024', inSample: 22.1, outSample: 21.3, efficiency: 96.4 },
    { period: 'Q4 2024', inSample: 25.4, outSample: 23.7, efficiency: 93.3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'moderate': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-warning" />
              <div>
                <DialogTitle className="text-xl">{strategy.name} - Approval Review</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analysis for strategy approval decision
                </p>
              </div>
            </div>
            <Badge className="bg-warning/10 text-warning border-warning">
              Pending Approval
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="trading-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Proposed Allocation</div>
                    <div className="text-lg font-bold financial-data">{formatCurrency(strategy.allocation)}</div>
                  </div>
                  <Target className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Backtest Return</div>
                    <div className="text-lg font-bold text-success">{strategy.performance}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-lg font-bold">{strategy.sharpe}</div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-bold text-destructive">{strategy.maxDrawdown}</div>
                  </div>
                  <TrendingDown className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
              <TabsTrigger value="walkforward">Walk Forward</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance vs Benchmark (SPY)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={performanceData}>
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
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.2}
                        stroke="hsl(var(--destructive))"
                        name="Drawdown %"
                      />
                      <Line
                        type="monotone"
                        dataKey="strategy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name="Strategy Return %"
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="SPY Benchmark %"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Return</span>
                      <span className="font-semibold text-success">+28.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annualized Return</span>
                      <span className="font-semibold">+22.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volatility</span>
                      <span className="font-semibold">16.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calmar Ratio</span>
                      <span className="font-semibold">2.65</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate</span>
                      <span className="font-semibold">68.4%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Risk-Adjusted Returns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Sharpe Ratio</span>
                      <span className="font-semibold">{strategy.sharpe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sortino Ratio</span>
                      <span className="font-semibold">2.8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Information Ratio</span>
                      <span className="font-semibold">1.35</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Treynor Ratio</span>
                      <span className="font-semibold">0.26</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jensen's Alpha</span>
                      <span className="font-semibold text-success">+4.2%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Risk Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {riskMetrics.map((risk, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{risk.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getStatusColor(risk.status)}`}>
                            {risk.value}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(risk.status)}`}
                          >
                            {risk.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Asset Correlations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={correlationData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[-1, 1]} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="asset" stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="correlation" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="montecarlo" className="space-y-4">
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Monte Carlo Simulation Results (10,000 scenarios)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monteCarloData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="scenario" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="return" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Worst Case (5%)</div>
                      <div className="font-semibold text-destructive">-5.2%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Expected (50%)</div>
                      <div className="font-semibold">+8.7%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Best Case (5%)</div>
                      <div className="font-semibold text-success">+19.8%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="walkforward" className="space-y-4">
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle>Walk-Forward Optimization Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={walkForwardData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="inSample" fill="hsl(var(--primary))" name="In-Sample %" />
                      <Bar dataKey="outSample" fill="hsl(var(--secondary))" name="Out-Sample %" />
                      <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--accent))" strokeWidth={3} name="Efficiency %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 text-center">
                    <div className="text-sm text-muted-foreground">Average Out-of-Sample Efficiency</div>
                    <div className="text-2xl font-bold text-success">94.6%</div>
                    <div className="text-xs text-muted-foreground">
                      Indicates strong strategy robustness and minimal overfitting
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Approval Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Review
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                onReject(strategy.id);
                onClose();
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reject Strategy
            </Button>
            <Button 
              className="bg-success hover:bg-success/90"
              onClick={() => {
                onApprove(strategy.id);
                onClose();
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Strategy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};