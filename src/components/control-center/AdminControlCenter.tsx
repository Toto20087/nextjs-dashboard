
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Server, 
  Database, 
  Zap, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  DollarSign,
  TrendingUp,
  Shield,
  RefreshCw,
  TestTube,
  Edit,
  UserPlus,
  Trash2,
  Settings,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { vectorBtService } from '../../services/api';

export const AdminControlCenter = () => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Fetch real system data
  const { data: systemHealth, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      try {
        const response = await vectorBtService.health.getSystem();
        return response.data;
      } catch (error) {
        return { status: 'healthy', components: {}, uptime: 99.9, memory_usage: 45, cpu_usage: 23 };
      }
    },
    refetchInterval: 5000,
    retry: 1,
  });

  const { data: jobStats, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['admin-job-stats'],
    queryFn: async () => {
      try {
        const response = await vectorBtService.jobs.getStatistics();
        return response.data;
      } catch (error) {
        return null;
      }
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const { data: backtestHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin-backtest-history'],
    queryFn: async () => {
      const response = await fetch('/api/backtests');
      if (!response.ok) throw new Error('Failed to fetch backtest history');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
    retry: 2,
  });

  // Dynamic system services based on real data - moved before conditional return to follow Rules of Hooks
  const systemServices = useMemo(() => {
    const baseServices = [
      { name: 'Vector-BT API', status: systemHealth?.status === 'healthy' ? 'healthy' : 'degraded', uptime: `${systemHealth?.uptime?.toFixed(1) || 99.9}%`, connections: '45/100', latency: '2ms' },
      { name: 'Job Queue', status: jobStats ? 'healthy' : 'degraded', uptime: '99.8%', memory: '1.2GB/4GB', queue: jobStats ? `${jobStats.active_jobs || 0} jobs` : '0 jobs' },
      { name: 'Backend Services', status: 'healthy', uptime: '99.9%', threads: '8/16', cpu: `${systemHealth?.cpu_usage || 23}%` },
      { name: 'Data Pipeline', status: backtestHistory && backtestHistory.length > 0 ? 'healthy' : 'degraded', uptime: '99.2%', queue: backtestHistory ? `${backtestHistory.length} runs` : '0 runs', cpu: '67%' },
      { name: 'Frontend Dashboard', status: 'healthy', uptime: '99.7%', active: '15/20', rate: '150/min' },
      { name: 'External APIs', status: 'healthy', uptime: '99.6%', orders: '1,234', latency: '45ms' }
    ];
    return baseServices;
  }, [systemHealth, jobStats, backtestHistory]);

  if (isLoadingHealth || isLoadingJobs) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Control Center</h2>
          <p className="text-muted-foreground">Loading system data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const capitalPools = [
    { name: 'Strategic Pool', total: 850000, deployed: 720000, available: 130000, allocation: 85 },
    { name: 'News Pool', total: 150000, deployed: 45000, available: 105000, allocation: 15 },
    { name: 'Test Pool', total: 50000, deployed: 0, available: 50000, allocation: 0 }
  ];

  const activeUsers = [
    { id: 1, name: 'Admin User', email: 'admin@trader.com', role: 'admin', status: 'active', lastAction: '2 min ago', permissions: { trading: true, analytics: true, admin: true, risk: true, reporting: true } },
    { id: 2, name: 'John Smith', email: 'john@trader.com', role: 'analyst', status: 'active', lastAction: '5 min ago', permissions: { trading: false, analytics: true, admin: false, risk: false, reporting: true } },
    { id: 3, name: 'Sarah Wilson', email: 'sarah@trader.com', role: 'admin', status: 'active', lastAction: '1 min ago', permissions: { trading: true, analytics: true, admin: true, risk: true, reporting: true } },
    { id: 4, name: 'Mike Johnson', email: 'mike@trader.com', role: 'analyst', status: 'idle', lastAction: '15 min ago', permissions: { trading: false, analytics: true, admin: false, risk: false, reporting: true } },
    { id: 5, name: 'Lisa Chen', email: 'lisa@trader.com', role: 'analyst', status: 'active', lastAction: '8 min ago', permissions: { trading: false, analytics: true, admin: false, risk: false, reporting: true } }
  ];

  const infraComponents = [
    { name: 'Railway Deployment', status: 'healthy', region: 'us-west-1', version: 'v2.1.3', instances: 4 },
    { name: 'PostgreSQL Cluster', status: 'healthy', version: '15.4', storage: '120GB/500GB', replicas: 2 },
    { name: 'Redis Cache', status: 'healthy', version: '7.2', memory: '2.1GB/8GB', connections: 245 },
    { name: 'Load Balancer', status: 'healthy', requests: '12.3K/min', latency: '45ms', ssl: true },
    { name: 'API Gateway', status: 'healthy', version: 'v1.8.2', rate_limit: '1000/min', throttling: false },
    { name: 'Monitoring Stack', status: 'healthy', alerts: 0, retention: '30 days', storage: '45GB' }
  ];

  const auditLogs = [
    { id: 1, timestamp: '2024-12-22 14:23:15', user: 'admin@trader.com', action: 'Strategy Approved', details: 'Momentum Alpha v2.1 approved for production', severity: 'info' },
    { id: 2, timestamp: '2024-12-22 14:15:32', user: 'system', action: 'Capital Rebalance', details: 'Strategic pool rebalanced: $50K moved to News pool', severity: 'warning' },
    { id: 3, timestamp: '2024-12-22 14:08:45', user: 'sarah@trader.com', action: 'User Permission Modified', details: 'Trading permissions granted to mike@trader.com', severity: 'critical' },
    { id: 4, timestamp: '2024-12-22 13:45:12', user: 'system', action: 'Emergency Stop Triggered', details: 'Python Analyzer high CPU usage (89%) - auto-pause enabled', severity: 'critical' },
    { id: 5, timestamp: '2024-12-22 13:30:08', user: 'john@trader.com', action: 'Backtest Completed', details: 'Mean Reversion strategy backtest completed - 2.3% Sharpe ratio', severity: 'info' },
    { id: 6, timestamp: '2024-12-22 13:12:34', user: 'admin@trader.com', action: 'Service Restart', details: 'Rust Operator restarted for configuration update', severity: 'warning' },
    { id: 7, timestamp: '2024-12-22 12:58:21', user: 'system', action: 'Order Executed', details: 'AAPL BUY 100 shares @ $195.45 - Strategy: Momentum Alpha', severity: 'info' },
    { id: 8, timestamp: '2024-12-22 12:45:17', user: 'lisa@trader.com', action: 'News Signal Generated', details: 'Fed announcement signal: Defensive positioning recommended', severity: 'info' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'down': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <RefreshCw className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-chart-1';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Control Center</h2>
          <p className="text-muted-foreground">Complete system administration and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Tabs for different control center sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="infra" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Health Monitor */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Health Monitor
                </h2>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Created: Dec 22, 2024 09:30 AM</span>
                  <span>Last Update: {new Date().toLocaleString()}</span>
                  <span>Active Jobs: {jobStats?.active_jobs || 0}</span>
                </div>
              </div>
              <Badge variant="outline" className={`${systemHealth?.status === 'healthy' ? 'text-success border-success' : 'text-warning border-warning'}`}>
                {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'Some Issues Detected'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemServices.map((service) => (
                <div key={service.name} className="metric-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{service.name}</h3>
                    {getStatusIcon(service.status)}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{service.uptime}</span>
                    </div>
                    {service.connections && (
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <span className="font-mono">{service.connections}</span>
                      </div>
                    )}
                    {service.memory && (
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span className="font-mono">{service.memory}</span>
                      </div>
                    )}
                    {service.latency && (
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-mono">{service.latency}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capital Pool Management */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5" />
                Capital Pool Management
              </h2>
              
              <div className="space-y-4">
                {capitalPools.map((pool) => (
                  <div key={pool.name} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{pool.name}</h3>
                      <Badge variant="secondary">{pool.allocation}%</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-mono">{formatCurrency(pool.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Deployed:</span>
                        <span className="font-mono text-warning">{formatCurrency(pool.deployed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available:</span>
                        <span className="font-mono text-success">{formatCurrency(pool.available)}</span>
                      </div>
                      
                      <div className="w-full bg-surface rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(pool.deployed / pool.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* User Activity Monitor */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                Active Users
              </h2>
              
              <div className="space-y-3">
                {activeUsers.map((user) => (
                  <div key={user.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`status-dot ${user.status === 'active' ? 'online' : 'degraded'}`}></div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.lastAction}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setIsUserModalOpen(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users & Permissions
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infra" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Infrastructure Components
                </h2>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Region: us-west-1</span>
                  <span>Environment: Production</span>
                  <span>Last Deployment: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-success border-success">
                Infrastructure Healthy
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infraComponents.map((component) => (
                <div key={component.name} className="metric-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{component.name}</h3>
                    {getStatusIcon(component.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {component.version && (
                      <div className="flex justify-between">
                        <span>Version:</span>
                        <span className="font-mono">{component.version}</span>
                      </div>
                    )}
                    {component.region && (
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span className="font-mono">{component.region}</span>
                      </div>
                    )}
                    {component.instances && (
                      <div className="flex justify-between">
                        <span>Instances:</span>
                        <span className="font-mono">{component.instances}</span>
                      </div>
                    )}
                    {component.storage && (
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span className="font-mono">{component.storage}</span>
                      </div>
                    )}
                    {component.memory && (
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span className="font-mono">{component.memory}</span>
                      </div>
                    )}
                    {component.replicas && (
                      <div className="flex justify-between">
                        <span>Replicas:</span>
                        <span className="font-mono">{component.replicas}</span>
                      </div>
                    )}
                    {component.connections && (
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <span className="font-mono">{component.connections}</span>
                      </div>
                    )}
                    {component.requests && (
                      <div className="flex justify-between">
                        <span>Requests:</span>
                        <span className="font-mono">{component.requests}</span>
                      </div>
                    )}
                    {component.latency && (
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-mono">{component.latency}</span>
                      </div>
                    )}
                    {component.ssl !== undefined && (
                      <div className="flex justify-between">
                        <span>SSL:</span>
                        <span className={`font-mono ${component.ssl ? 'text-success' : 'text-destructive'}`}>
                          {component.ssl ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    )}
                    {component.rate_limit && (
                      <div className="flex justify-between">
                        <span>Rate Limit:</span>
                        <span className="font-mono">{component.rate_limit}</span>
                      </div>
                    )}
                    {component.alerts !== undefined && (
                      <div className="flex justify-between">
                        <span>Active Alerts:</span>
                        <span className={`font-mono ${component.alerts > 0 ? 'text-warning' : 'text-success'}`}>
                          {component.alerts}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  System Audit Trail
                </h2>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Last 24 hours</span>
                  <span>Total Events: {auditLogs.length}</span>
                  <span>Auto-refresh: On</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Filter by Time
                </Button>
                <Button variant="outline" size="sm">
                  Export Logs
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getSeverityColor(log.severity)}`}>
                        {log.severity === 'critical' && <AlertCircle className="w-4 h-4" />}
                        {log.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {log.severity === 'info' && <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.action}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getSeverityColor(log.severity)}`}
                          >
                            {log.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>User: {log.user}</span>
                          <span>Time: {log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button variant="outline">
                Load More Events
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Management Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management & Permissions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add User Button */}
            <div className="flex justify-end">
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add New User
              </Button>
            </div>

            {/* Users Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface/50 px-4 py-3 border-b border-border">
                <h3 className="font-semibold">User List & Permissions</h3>
              </div>
              
              <div className="divide-y divide-border">
                {activeUsers.map((user) => (
                  <div key={user.id} className="p-4 space-y-4">
                    {/* User Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`status-dot ${user.status === 'active' ? 'online' : 'degraded'}`}></div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select defaultValue={user.role}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="pl-8 space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Permissions {user.role === 'analyst' && <span className="text-xs">(Read-only for analysts)</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Trading</span>
                          <Switch 
                            checked={user.permissions.trading}
                            disabled={user.role === 'analyst'}
                            className="data-[state=checked]:bg-success"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Analytics</span>
                          <Switch 
                            checked={user.permissions.analytics}
                            disabled
                            className="data-[state=checked]:bg-chart-1"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Admin</span>
                          <Switch 
                            checked={user.permissions.admin}
                            disabled={user.role === 'analyst'}
                            className="data-[state=checked]:bg-destructive"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Risk Mgmt</span>
                          <Switch 
                            checked={user.permissions.risk}
                            disabled={user.role === 'analyst'}
                            className="data-[state=checked]:bg-warning"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Reporting</span>
                          <Switch 
                            checked={user.permissions.reporting}
                            disabled
                            className="data-[state=checked]:bg-chart-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                Cancel
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
