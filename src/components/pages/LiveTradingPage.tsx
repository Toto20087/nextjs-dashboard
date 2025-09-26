'use client';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { TradingDashboard } from '../live-trading/TradingDashboard';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

export const LiveTradingPage = () => {
  const { collapsed } = useNavigationState();

  // Fetch real Alpaca account data for Daily P&L
  const { data: accountData } = useQuery({
    queryKey: ['account-data'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/portfolio/account');
        if (!response.ok) throw new Error('Failed to fetch account data');
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.log('No account data available:', error);
        return null;
      }
    },
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  // Fetch real positions data for Active Positions count
  const { data: positionsData } = useQuery({
    queryKey: ['positions-data'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/portfolio/positions');
        if (!response.ok) throw new Error('Failed to fetch positions data');
        const result = await response.json();
        return result.data?.positions || [];
      } catch (error) {
        console.log('No positions data available:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  // Calculate real-time values
  const activePositionsCount = positionsData ? positionsData.length : 0;
  
  const dailyPnL = (() => {
    if (!accountData?.equity || !accountData?.lastEquity) return { amount: 0, formatted: '$0', isPositive: false };
    const pnl = parseFloat(accountData.equity) - parseFloat(accountData.lastEquity);
    return {
      amount: pnl,
      formatted: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString()}`,
      isPositive: pnl >= 0
    };
  })();
  
  return (
    <div className="min-h-screen bg-background flex">
      <HierarchicalNavigation />
      <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
        <div className="border-b border-border bg-surface/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="status-dot online"></div>
                <span className="text-sm font-medium">Live Trading Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Active Positions: <span className="financial-data">{activePositionsCount}</span></div>
              <div>Daily P&L: <span className={`financial-data ${dailyPnL.isPositive ? 'profit' : 'loss'}`}>{dailyPnL.formatted}</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          <TradingDashboard />
        </div>
      </main>
    </div>
  );
};