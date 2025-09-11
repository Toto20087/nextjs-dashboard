'use client';

import { useState } from 'react';
import { HierarchicalNavigation } from '../shared/HierarchicalNavigation';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { StrategyTestingLab } from '../strategy-lab/StrategyTestingLab';
import { NewBacktestModal } from '../strategy-lab/NewBacktestModal';
import { Button } from '../ui/button';
import { useNavigationState } from '../../hooks/useNavigationState';
import { cn } from '../../lib/utils';
import { TestTube } from 'lucide-react';

export const StrategyLabPage = () => {
  const { collapsed } = useNavigationState();
  const [showNewBacktestModal, setShowNewBacktestModal] = useState(false);
  
  return (
    <div className="min-h-screen bg-background flex">
      <HierarchicalNavigation />
      <main className={cn("flex-1 overflow-auto transition-all duration-300 content-with-dots", collapsed ? "ml-16" : "ml-64")}>
        <div className="border-b border-border bg-surface/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="status-dot online"></div>
                <span className="text-sm font-medium">Strategy Lab Active</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>Active Tests: <span className="financial-data">3</span></div>
              <div>Queue: <span className="financial-data">1</span></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Breadcrumbs />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Strategy Testing Lab</h2>
              <p className="text-muted-foreground">Browse backtest runs and send profitable strategies for approval</p>
            </div>
            <Button variant="outline" onClick={() => setShowNewBacktestModal(true)}>
              <TestTube className="w-4 h-4 mr-2" />
              New Backtest
            </Button>
          </div>
          <StrategyTestingLab />
          <NewBacktestModal 
            open={showNewBacktestModal}
            onOpenChange={setShowNewBacktestModal}
          />
        </div>
      </main>
    </div>
  );
};