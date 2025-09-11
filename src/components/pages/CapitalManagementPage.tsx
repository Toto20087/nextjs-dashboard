'use client';

import { useState } from 'react';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export const CapitalManagementPage = () => {
  const { collapsed } = useNavigationState();
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tempAllocation, setTempAllocation] = useState(0);
  
  // Unified strategy list - no longer separated by pools
  const strategies = [
    { 
      name: 'Momentum Strategy A', 
      allocated: 350000, 
      deployed: 297500, 
      available: 52500, 
      performance: '+12.1%',
      managed_by: 'rust',
      positions: 8,
      status: 'active'
    },
    { 
      name: 'Mean Reversion B', 
      allocated: 250000, 
      deployed: 212500, 
      available: 37500, 
      performance: '+11.3%',
      managed_by: 'rust',
      positions: 6,
      status: 'active'
    },
    { 
      name: 'Pairs Trading C', 
      allocated: 200000, 
      deployed: 170000, 
      available: 30000, 
      performance: '+9.8%',
      managed_by: 'rust',
      positions: 4,
      status: 'active'
    },
    { 
      name: 'News Trading Strategy', 
      allocated: 150000, 
      deployed: 45000, 
      available: 105000, 
      performance: '+21.7%',
      managed_by: 'n8n',
      positions: 3,
      status: 'active'
    },
    { 
      name: 'GPT Analysis Strategy', 
      allocated: 50000, 
      deployed: 15000, 
      available: 35000, 
      performance: '-4.2%',
      managed_by: 'n8n',
      positions: 2,
      status: 'active'
    }
  ];

  // Calculate totals from strategies
  const totals = strategies.reduce((acc, strategy) => ({
    allocated: acc.allocated + strategy.allocated,
    deployed: acc.deployed + strategy.deployed,
    available: acc.available + strategy.available
  }), { allocated: 0, deployed: 0, available: 0 });

  const recentAllocations = [
    { strategy: 'Momentum Alpha', amount: 25000, type: 'increase', time: '2 hours ago' },
    { strategy: 'Mean Reversion Beta', amount: -15000, type: 'decrease', time: '4 hours ago' },
    { strategy: 'News Sentiment', amount: 30000, type: 'increase', time: '6 hours ago' },
    { strategy: 'Sector Rotation', amount: 20000, type: 'increase', time: '1 day ago' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const openManageModal = (strategy: any) => {
    setSelectedStrategy(strategy);
    setTempAllocation(strategy.allocated);
    setIsManageModalOpen(true);
  };

  const handleSaveChanges = () => {
    // In a real app, this would call an API to update the strategy allocation
    console.log(`Updating ${selectedStrategy?.name} allocation to ${tempAllocation}`);
    setIsManageModalOpen(false);
    setSelectedStrategy(null);
  };

  const getManagementBadge = (managed_by: string) => {
    return managed_by === 'rust' 
      ? <Badge variant="outline" className="text-xs">Rust</Badge>
      : <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">n8n</Badge>;
  };

  const getPerformanceColor = (performance: string) => {
    return performance.startsWith('+') ? 'text-success' : 'text-destructive';
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      <HierarchicalNavigation />
      <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
        <div className="border-b border-border bg-surface/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="status-dot online"></div>
                <span className="text-sm font-medium">Capital Management Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Total Capital: <span className="financial-data">{formatCurrency(1000000)}</span></div>
              <div>Deployed: <span className="financial-data">{formatCurrency(totals.deployed)}</span></div>
              <div>Available: <span className="financial-data profit">{formatCurrency(1000000 - totals.deployed)}</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Capital Management Center</h2>
                <p className="text-muted-foreground">Monitor and reallocate capital across all trading strategies</p>
              </div>
              <div className="flex gap-2">
                <Button>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Positions
                </Button>
              </div>
            </div>

            {/* Unified Strategy Management */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Strategy Capital Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <div key={strategy.name} className="p-4 border border-border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-lg">{strategy.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {getManagementBadge(strategy.managed_by)}
                              <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                                {strategy.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getPerformanceColor(strategy.performance)}`}>
                            {strategy.performance}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {strategy.positions} positions
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Capital Deployed</span>
                          <span className="font-mono">{((strategy.deployed / strategy.allocated) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(strategy.deployed / strategy.allocated) * 100} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Allocated</div>
                          <div className="font-semibold financial-data">{formatCurrency(strategy.allocated)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Deployed</div>
                          <div className="font-semibold financial-data">{formatCurrency(strategy.deployed)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Available</div>
                          <div className="font-semibold financial-data">{formatCurrency(strategy.available)}</div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => openManageModal(strategy)}
                      >
                        Manage {strategy.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Allocation Changes */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Capital Movements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAllocations.map((allocation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
                      <div className="flex items-center gap-3">
                        {allocation.type === 'increase' ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                        <div>
                          <div className="font-medium">{allocation.strategy}</div>
                          <div className="text-sm text-muted-foreground">{allocation.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-semibold financial-data",
                          allocation.type === 'increase' ? 'text-success' : 'text-warning'
                        )}>
                          {allocation.type === 'increase' ? '+' : ''}{formatCurrency(allocation.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {allocation.type === 'increase' ? 'Increased' : 'Decreased'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Strategy Management Modal */}
          <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manage {selectedStrategy?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Current Status */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Allocation:</span>
                    <span className="font-semibold">{formatCurrency(selectedStrategy?.allocated || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deployed:</span>
                    <span className="font-semibold">{formatCurrency(selectedStrategy?.deployed || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-semibold text-success">{formatCurrency(selectedStrategy?.available || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Management:</span>
                    <span className="font-semibold">{selectedStrategy?.managed_by === 'rust' ? 'Rust Engine' : 'n8n Workflow'}</span>
                  </div>
                </div>

                {/* Allocation Adjustment */}
                <div className="space-y-4">
                  <Label htmlFor="allocation">New Strategy Allocation</Label>
                  <div className="space-y-2">
                    <Input
                      id="allocation"
                      type="number"
                      value={tempAllocation}
                      onChange={(e) => setTempAllocation(Number(e.target.value))}
                      placeholder="Enter new allocation amount"
                    />
                    <div className="text-xs text-muted-foreground">
                      Change: {tempAllocation > (selectedStrategy?.allocated || 0) ? '+' : ''}{formatCurrency(tempAllocation - (selectedStrategy?.allocated || 0))}
                    </div>
                  </div>
                </div>

                {/* Allocation Slider */}
                <div className="space-y-4">
                  <Label>Quick Adjustments</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[tempAllocation]}
                      onValueChange={(value) => setTempAllocation(value[0])}
                      max={2000000}
                      min={0}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>$2M</span>
                    </div>
                  </div>
                </div>

                {/* Strategy Impact */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Impact Analysis</Label>
                  <div className="p-3 bg-surface/50 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Active Positions:</span>
                      <span>{selectedStrategy?.positions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance:</span>
                      <span className={getPerformanceColor(selectedStrategy?.performance || '+0%')}>
                        {selectedStrategy?.performance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Status:</span>
                      <span>{selectedStrategy?.status}</span>
                    </div>
                    {tempAllocation !== selectedStrategy?.allocated && (
                      <div className="text-xs text-warning mt-2">
                        ⚠️ Changes will affect this strategy's trading capacity
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsManageModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSaveChanges}
                    disabled={tempAllocation === selectedStrategy?.allocated}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};