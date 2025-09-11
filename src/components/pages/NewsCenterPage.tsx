'use client';

import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { NewsCenter } from '../news-center/components/NewsCenter';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';

export const NewsCenterPage = () => {
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
                <span className="text-sm font-medium">News Feed Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Active Sources: <span className="financial-data">12</span></div>
              <div>Signal Queue: <span className="financial-data">5</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          <NewsCenter />
        </div>
      </main>
    </div>
  );
};