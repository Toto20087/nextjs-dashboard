'use client';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { RiskManagementCenter } from '../risk-center/RiskManagementCenter';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';

export const RiskCenterPage = () => {
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
                <span className="text-sm font-medium">Risk Monitoring Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Risk Score: <span className="financial-data">7.2/10</span></div>
              <div>Max Drawdown: <span className="financial-data">-2.1%</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          <RiskManagementCenter />
        </div>
      </main>
    </div>
  );
};