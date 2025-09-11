'use client';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { TradingDashboard } from '../live-trading/TradingDashboard';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';

export const LiveTradingPage = () => {
  const { collapsed } = useNavigationState();
  
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
              <div>Active Positions: <span className="financial-data">12</span></div>
              <div>Daily P&L: <span className="financial-data profit">+$2,847.32</span></div>
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