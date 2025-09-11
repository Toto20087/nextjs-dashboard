'use client';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { PerformanceAnalytics } from '../live-trading/components/PerformanceAnalytics';
import { LiveTradingInspector } from '../live-trading/LiveTradingInspector';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';
import { useSearchParams } from 'next/navigation';

export const AnalyticsPage = () => {
  const { collapsed } = useNavigationState();
  const searchParams = useSearchParams();
  const selectedStrategy = searchParams.get('strategy');
  
  return (
    <div className="min-h-screen bg-background flex">
      <HierarchicalNavigation />
      <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
        <div className="border-b border-border bg-surface/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="status-dot online"></div>
                <span className="text-sm font-medium">Analytics Engine Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Sharpe Ratio: <span className="financial-data">1.42</span></div>
              <div>Win Rate: <span className="financial-data profit">68.3%</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          <LiveTradingInspector selectedStrategy={selectedStrategy} />
          <div className="mt-8">
            <PerformanceAnalytics selectedStrategy={selectedStrategy} />
          </div>
        </div>
      </main>
    </div>
  );
};