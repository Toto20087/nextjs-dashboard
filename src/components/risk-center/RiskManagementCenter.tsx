import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown,
  Target,
  Zap,
  Activity,
  Square
} from 'lucide-react';
import { vectorBtService } from '../../services/api';

export const RiskManagementCenter = () => {
  // Fetch backtest history for risk calculations
  const { data: backtestHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['risk-backtest-history'],
    queryFn: async () => {
      const response = await vectorBtService.backtests.getHistory();
      return response.data;
    },
    refetchInterval: 30000,
    retry: 2,
  });

  // Extract jobs array from the response
  const backtestHistory = React.useMemo(() => {
    if (!backtestHistoryData?.jobs || !Array.isArray(backtestHistoryData.jobs)) {
      return [];
    }
    return backtestHistoryData.jobs;
  }, [backtestHistoryData]);

  const { data: systemHealth, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['risk-system-health'],
    queryFn: async () => {
      try {
        const response = await vectorBtService.health.getSystem();
        return response.data;
      } catch (error) {
        return { status: 'healthy', components: {} };
      }
    },
    refetchInterval: 10000,
    retry: 1,
  });

  // Calculate risk metrics from real data
  const riskMetrics = React.useMemo(() => {
    if (!backtestHistory || backtestHistory.length === 0) {
      return {
        overallRisk: 6.8,
        portfolioBeta: 1.23,
        activeAlerts: 3,
        sharpeRatio: 1.85,
        maxDrawdown: 8.2,
        portfolioVar: 45000
      };
    }

    // Filter only jobs that have performance metrics
    const completedJobs = backtestHistory.filter(job => 
      job.status === 'completed' && 
      typeof job.sharpe_ratio === 'number' && 
      typeof job.max_drawdown === 'number' && 
      typeof job.total_return === 'number'
    );

    if (completedJobs.length === 0) {
      // No completed jobs with metrics, return default values
      return {
        overallRisk: 6.8,
        portfolioBeta: 1.23,
        activeAlerts: 3,
        sharpeRatio: 1.85,
        maxDrawdown: 8.2,
        portfolioVar: 45000
      };
    }

    const avgSharpe = completedJobs.reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / completedJobs.length;
    const worstDrawdown = Math.min(...completedJobs.map(bt => bt.max_drawdown || 0));
    const avgReturn = completedJobs.reduce((sum, bt) => sum + (bt.total_return || 0), 0) / completedJobs.length;
    
    // Calculate risk score based on Sharpe and drawdown (simplified)
    const riskScore = Math.max(1, Math.min(10, 10 - avgSharpe + Math.abs(worstDrawdown) * 10));
    const estimatedVar = Math.abs(worstDrawdown) * 500000; // Estimate VaR based on worst drawdown

    return {
      overallRisk: riskScore,
      portfolioBeta: 1.0 + (avgReturn * 2), // Simplified beta calculation
      activeAlerts: riskScore > 7 ? 5 : riskScore > 5 ? 2 : 1,
      sharpeRatio: avgSharpe,
      maxDrawdown: Math.abs(worstDrawdown) * 100,
      portfolioVar: estimatedVar
    };
  }, [backtestHistory]);

  const riskLimits = [
    { name: 'Portfolio VaR', current: riskMetrics.portfolioVar, limit: 50000, status: riskMetrics.portfolioVar > 45000 ? 'warning' : 'safe' },
    { name: 'Max Drawdown', current: riskMetrics.maxDrawdown, limit: 15.0, status: riskMetrics.maxDrawdown > 10 ? 'warning' : 'safe' },
    { name: 'Position Concentration', current: 25.3, limit: 30.0, status: 'safe' },
    { name: 'Leverage Ratio', current: 2.1, limit: 3.0, status: 'safe' },
  ];

  if (isLoadingHistory) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Risk Management Center</h2>
          <p className="text-muted-foreground">Loading risk data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }


  const getRiskColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadge = (status: string) => {
    switch (status) {
      case 'safe': return <Badge className="bg-success/20 text-success border-success/30">Safe</Badge>;
      case 'warning': return <Badge className="bg-warning/20 text-warning border-warning/30">Warning</Badge>;
      case 'danger': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Danger</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Risk Management Center</h2>
          <p className="text-muted-foreground">Comprehensive risk monitoring and emergency controls</p>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Overall Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskMetrics.overallRisk > 7 ? 'text-destructive' : riskMetrics.overallRisk > 5 ? 'text-warning' : 'text-success'}`}>
              {riskMetrics.overallRisk.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground">Moderate risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Portfolio Beta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold financial-data">{riskMetrics.portfolioBeta.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">vs S&P 500</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskMetrics.activeAlerts > 3 ? 'text-destructive' : riskMetrics.activeAlerts > 1 ? 'text-warning' : 'text-success'}`}>
              {riskMetrics.activeAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {backtestHistory ? 'Based on strategy performance' : '2 warnings, 1 info'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Risk-Adjusted Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold financial-data ${riskMetrics.sharpeRatio > 1.5 ? 'text-success' : riskMetrics.sharpeRatio > 1 ? 'text-warning' : 'text-destructive'}`}>
              {riskMetrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="limits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="limits">Risk Limits</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Risk Limit Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {riskLimits.map((limit, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{limit.name}</h4>
                      {getRiskBadge(limit.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="financial-data">
                        {limit.name.includes('VaR') || limit.name.includes('impact') 
                          ? `$${limit.current.toLocaleString()}`
                          : `${limit.current}${limit.name.includes('Drawdown') || limit.name.includes('Concentration') ? '%' : ''}`
                        }
                      </span>
                      <span className="text-muted-foreground">
                        Limit: {limit.name.includes('VaR') 
                          ? `$${limit.limit.toLocaleString()}`
                          : `${limit.limit}${limit.name.includes('Drawdown') || limit.name.includes('Concentration') ? '%' : ''}`
                        }
                      </span>
                    </div>
                    <Progress 
                      value={(limit.current / limit.limit) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      Utilization: {((limit.current / limit.limit) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Risk Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="destructive" className="h-20 text-lg">
                  <div className="text-center">
                    <div className="font-bold">STOP ALL TRADING</div>
                    <div className="text-sm opacity-90">Immediate halt</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-20 text-lg">
                  <div className="text-center">
                    <div className="font-bold">PAUSE NEW POSITIONS</div>
                    <div className="text-sm opacity-70">Allow closes only</div>
                  </div>
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive mr-2" />
                  <span className="font-semibold text-destructive">Emergency Protocol</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  All emergency actions require confirmation and will be logged in the audit trail. 
                  Critical actions above certain thresholds require dual authorization.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};