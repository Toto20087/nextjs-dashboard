'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { StrategyApprovalModal } from '../strategy-lab/StrategyApprovalModal';
import { StrategyConfigurationModal } from '../strategy-lab/StrategyConfigurationModal';
import { StrategyComparisonModal } from '../strategy-lab/StrategyComparisonModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Play,
  Pause,
  Settings,
  GitCompare
} from 'lucide-react';

// Time formatting utility
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Less than an hour ago';
};

export const StrategyCenterPage = () => {
  const { collapsed } = useNavigationState();
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConfigStrategy, setSelectedConfigStrategy] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedStrategy1, setSelectedStrategy1] = useState<string>('');
  const [selectedStrategy2, setSelectedStrategy2] = useState<string>('');
  const [actionLoadingStates, setActionLoadingStates] = useState<Record<number, string>>({});

  // Fetch strategy center data from API
  const { data: strategyCenterData, isLoading, refetch } = useQuery({
    queryKey: ['strategy-center-data'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/strategy-center');
      if (!response.ok) throw new Error('Failed to fetch strategy data');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 2,
  });

  // Transform API data to component format
  const strategies = useMemo(() => {
    if (!strategyCenterData?.strategies) return [];
    
    return strategyCenterData.strategies.map((apiStrategy: any) => ({
      id: apiStrategy.id,
      name: apiStrategy.name,
      status: apiStrategy.isActive ? 'approved' : 'pending',
      allocation: apiStrategy.allocation,
      performance: `${apiStrategy.performance >= 0 ? '+' : ''}${apiStrategy.performance.toFixed(1)}%`,
      sharpe: apiStrategy.sharpe,
      maxDrawdown: `-${Math.abs(apiStrategy.maxDrawdown).toFixed(1)}%`,
      positions: apiStrategy.positions,
      lastUpdate: formatTimeAgo(apiStrategy.lastUpdate || apiStrategy.createdAt),
      approver: 'Admin User', // Default value
      isActive: apiStrategy.isActive
    }));
  }, [strategyCenterData]);

  // Use real summary statistics from API
  const summaryStats = strategyCenterData?.summary || {
    totalStrategies: 0,
    activeStrategies: 0,
    totalCapital: 0
  };

  const pendingApprovals = strategies.filter(s => s.status === 'pending').length;
  const activeStrategies = summaryStats.activeStrategies;
  const totalAllocation = summaryStats.totalCapital;

  // Generic strategy action function
  const executeStrategyAction = async (strategyId: number, action: string, rejectionReason?: string) => {
    setActionLoadingStates(prev => ({ ...prev, [strategyId]: action }));
    
    try {
      const response = await fetch('/api/dashboard/strategy-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          strategyId, 
          action, 
          rejectionReason: rejectionReason || null 
        })
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} strategy`);
      
      // Refresh strategy data after successful action
      await refetch();
      
      // Close any open modals
      setIsModalOpen(false);
      
      return true;
    } catch (error) {
      console.error(`Failed to ${action} strategy:`, error);
      return false;
    } finally {
      setActionLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[strategyId];
        return newState;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/10 text-success border-success">Approved</Badge>;
      case 'pending': return <Badge className="bg-warning/10 text-warning border-warning">Pending</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
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

  const handleStrategyClick = (strategy) => {
    if (strategy.status === 'pending') {
      setSelectedStrategy(strategy);
      setIsModalOpen(true);
    }
  };

  const handleApprove = async (strategyId: number) => {
    await executeStrategyAction(strategyId, 'approve');
  };

  const handleReject = async (strategyId: number, rejectionReason?: string) => {
    await executeStrategyAction(strategyId, 'reject', rejectionReason);
  };

  const handlePause = async (strategyId: number) => {
    await executeStrategyAction(strategyId, 'pause');
  };

  const handleActivate = async (strategyId: number) => {
    await executeStrategyAction(strategyId, 'activate');
  };

  const handleConfigure = (strategy) => {
    setSelectedConfigStrategy(strategy);
    setIsConfigModalOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <HierarchicalNavigation />
        <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading strategies...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex">
      <HierarchicalNavigation />
      <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
        <div className="border-b border-border bg-surface/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="status-dot online"></div>
                <span className="text-sm font-medium">Strategy Center Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Active Strategies: <span className="financial-data">{activeStrategies}</span></div>
              <div>Pending Approval: <span className="financial-data warning">{pendingApprovals}</span></div>
              <div>Total Allocation: <span className="financial-data">{formatCurrency(totalAllocation)}</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Strategy Management Center</h1>
                <p className="text-muted-foreground">Approve, monitor, and manage trading strategies</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare Strategies
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Strategy Performance Comparison</DialogTitle>
                    </DialogHeader>
                    <StrategyComparisonModal 
                      strategies={strategies.map(s => ({
                        id: s.name.replace(/\s+/g, '_').toUpperCase(),
                        name: s.name,
                        return: parseFloat(s.performance.replace(/[+%]/g, '')),
                        sharpe: s.sharpe,
                        drawdown: parseFloat(s.maxDrawdown.replace(/[-%]/g, '')),
                        trades: s.positions * 10, // Mock trades count
                        status: s.status === 'approved' ? 'live' : s.status,
                        winRate: s.sharpe > 1.5 ? 72.1 : 65.3, // Mock win rate
                        profitFactor: s.sharpe > 1.5 ? 1.65 : 1.28 // Mock profit factor
                      }))}
                      selectedStrategy1={selectedStrategy1}
                      selectedStrategy2={selectedStrategy2}
                      onStrategy1Change={setSelectedStrategy1}
                      onStrategy2Change={setSelectedStrategy2}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="trading-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Strategies</div>
                      <div className="text-2xl font-bold">{summaryStats.totalStrategies}</div>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="trading-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Active</div>
                      <div className="text-2xl font-bold text-success">{activeStrategies}</div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="trading-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                      <div className="text-2xl font-bold text-warning">{pendingApprovals}</div>
                    </div>
                    <Clock className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="trading-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Capital</div>
                      <div className="text-lg font-bold financial-data">{formatCurrency(totalAllocation)}</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Management Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All Strategies</TabsTrigger>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <Card 
                      key={strategy.id} 
                      className={cn(
                        "trading-card",
                        strategy.status === 'pending' && "cursor-pointer hover:shadow-md transition-shadow"
                      )}
                      onClick={() => handleStrategyClick(strategy)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(strategy.status)}
                            <div>
                              <CardTitle className="text-lg">{strategy.name}</CardTitle>
                              <div className="text-sm text-muted-foreground">
                                Last updated {strategy.lastUpdate}
                                {strategy.approver && ` • Approved by ${strategy.approver}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(strategy.status)}
                            {strategy.isActive && (
                              <Badge className="bg-success/10 text-success border-success">
                                <Play className="w-3 h-3 mr-1" />
                                Live
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                          <div>
                            <div className="text-muted-foreground">Allocation</div>
                            <div className="font-semibold financial-data">{formatCurrency(strategy.allocation)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Performance</div>
                            <div className={cn(
                              "font-semibold",
                              strategy.performance.startsWith('+') ? 'text-success' : 'text-destructive'
                            )}>
                              {strategy.performance}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Sharpe Ratio</div>
                            <div className="font-semibold">{strategy.sharpe}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Max Drawdown</div>
                            <div className="font-semibold text-destructive">{strategy.maxDrawdown}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Positions</div>
                            <div className="font-semibold">{strategy.positions}</div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          {strategy.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-success hover:bg-success/90 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(strategy.id);
                                }}
                                disabled={!!actionLoadingStates[strategy.id]}
                              >
                                {actionLoadingStates[strategy.id] === 'approve' ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                {actionLoadingStates[strategy.id] === 'approve' ? 'Approving...' : 'Approve'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(strategy.id);
                                }}
                                disabled={!!actionLoadingStates[strategy.id]}
                              >
                                {actionLoadingStates[strategy.id] === 'reject' ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                )}
                                {actionLoadingStates[strategy.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </>
                          )}
                          {strategy.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => strategy.isActive 
                                ? handlePause(strategy.id) 
                                : handleActivate(strategy.id)
                              }
                              disabled={!!actionLoadingStates[strategy.id]}
                            >
                              {actionLoadingStates[strategy.id] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                              ) : strategy.isActive ? (
                                <Pause className="w-3 h-3 mr-1" />
                              ) : (
                                <Play className="w-3 h-3 mr-1" />
                              )}
                              {actionLoadingStates[strategy.id] 
                                ? 'Processing...' 
                                : strategy.isActive ? 'Pause' : 'Start'
                              }
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleConfigure(strategy)}>
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="pending">
                <div className="space-y-4">
                  {strategies.filter(s => s.status === 'pending').map((strategy) => (
                    <Card 
                      key={strategy.id} 
                      className="trading-card border-warning cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleStrategyClick(strategy)}
                    >
                      {/* Same strategy card content but filtered for pending */}
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-warning" />
                            <div>
                              <CardTitle className="text-lg">{strategy.name}</CardTitle>
                              <div className="text-sm text-muted-foreground">
                                Awaiting approval • Last updated {strategy.lastUpdate}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-warning/10 text-warning border-warning">Pending Approval</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Proposed Allocation</div>
                              <div className="font-semibold financial-data">{formatCurrency(strategy.allocation)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Backtest Performance</div>
                              <div className="font-semibold text-success">{strategy.performance}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Sharpe Ratio</div>
                              <div className="font-semibold">{strategy.sharpe}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Max Drawdown</div>
                              <div className="font-semibold text-destructive">{strategy.maxDrawdown}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="bg-success hover:bg-success/90"
                              onClick={() => handleApprove(strategy.id)}
                              disabled={!!actionLoadingStates[strategy.id]}
                            >
                              {actionLoadingStates[strategy.id] === 'approve' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              {actionLoadingStates[strategy.id] === 'approve' ? 'Approving...' : 'Approve Strategy'}
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleReject(strategy.id)}
                              disabled={!!actionLoadingStates[strategy.id]}
                            >
                              {actionLoadingStates[strategy.id] === 'reject' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 mr-2" />
                              )}
                              {actionLoadingStates[strategy.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="active">
                <div className="space-y-4">
                  {strategies.filter(s => s.isActive).map((strategy) => (
                    <Card key={strategy.id} className="trading-card border-success">
                      {/* Active strategies content */}
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <div>
                              <CardTitle className="text-lg">{strategy.name}</CardTitle>
                              <div className="text-sm text-muted-foreground">
                                Active • {strategy.positions} positions • Updated {strategy.lastUpdate}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-success/10 text-success border-success">
                              <Play className="w-3 h-3 mr-1" />
                              Live Trading
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="grid grid-cols-5 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Current Allocation</div>
                              <div className="font-semibold financial-data">{formatCurrency(strategy.allocation)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Live Performance</div>
                              <div className="font-semibold text-success">{strategy.performance}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Active Positions</div>
                              <div className="font-semibold">{strategy.positions}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Sharpe Ratio</div>
                              <div className="font-semibold">{strategy.sharpe}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Max Drawdown</div>
                              <div className="font-semibold text-destructive">{strategy.maxDrawdown}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              onClick={() => handlePause(strategy.id)}
                              disabled={!!actionLoadingStates[strategy.id]}
                            >
                              {actionLoadingStates[strategy.id] === 'pause' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                              ) : (
                                <Pause className="w-4 h-4 mr-2" />
                              )}
                              {actionLoadingStates[strategy.id] === 'pause' ? 'Pausing...' : 'Pause Strategy'}
                            </Button>
                            <Button variant="outline" onClick={() => handleConfigure(strategy)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="rejected">
                <div className="space-y-4">
                  {strategies.filter(s => s.status === 'rejected').map((strategy) => (
                    <Card key={strategy.id} className="trading-card border-destructive">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <div>
                              <CardTitle className="text-lg">{strategy.name}</CardTitle>
                              <div className="text-sm text-muted-foreground">
                                Rejected by {strategy.approver} • {strategy.lastUpdate}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-destructive/10 text-destructive border-destructive">Rejected</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                          Strategy rejected due to insufficient risk-adjusted returns and high drawdown metrics.
                        </div>
                        <Button variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Resubmit with Changes
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Strategy Approval Modal */}
        <StrategyApprovalModal
          strategy={selectedStrategy}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
        <StrategyConfigurationModal
          strategy={selectedConfigStrategy}
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
    </div>
  );
};