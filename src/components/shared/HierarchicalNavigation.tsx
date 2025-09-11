'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Shield, 
  TestTube, 
  Activity, 
  Settings, 
  Users, 
  TrendingUp,
  Database,
  Newspaper,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  PieChart,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useNavigationState } from '../../hooks/useNavigationState';
import { UserConfigDropdown } from '../user/UserConfigDropdown';

interface NavigationProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  route: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'live-trading',
    label: 'Live Trading',
    icon: TrendingUp,
    description: 'Trading operations & monitoring',
    route: '/live-trading',
    children: [
      { id: 'risk-center', label: 'Risk Center', icon: Shield, description: 'Risk management & controls', route: '/live-trading/risk-center' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance analysis', route: '/live-trading/analytics' },
      { id: 'strategy-approval', label: 'Strategy Center', icon: Users, description: 'Strategy management & approval', route: '/live-trading/strategy-approval' },
      { id: 'capital-mgmt', label: 'Capital Mgmt', icon: DollarSign, description: 'Capital reallocation center', route: '/live-trading/capital-mgmt' },
    ]
  },
  {
    id: 'strategy-lab',
    label: 'Strategy Lab',
    icon: TestTube,
    description: 'Strategy development & testing',
    route: '/strategy-lab'
  },
  {
    id: 'news-center',
    label: 'News Center',
    icon: Newspaper,
    description: 'News & sentiment analysis',
    route: '/news-center'
  },
  {
    id: 'control-center',
    label: 'Control Center',
    icon: Settings,
    description: 'System administration',
    route: '/control-center'
  }
];

export const HierarchicalNavigation = ({ className }: NavigationProps) => {
  const { collapsed, setCollapsed } = useNavigationState();
  const [expandedItems, setExpandedItems] = useState<string[]>(['live-trading', 'control-center']);
  const router = useRouter();
  const pathname = usePathname();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (route: string) => {
    return pathname === route || (pathname.startsWith(route + '/') && route !== '/');
  };

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.route));
  };

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.route);
    const childActive = isChildActive(item.children);

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
            handleNavigation(item.route);
          }}
          className={cn(
            "w-full flex items-center rounded-lg text-left transition-all duration-200 mb-1",
            level === 0 ? "gap-3 px-3 py-2 pr-4 font-medium mx-2" : "gap-2 px-2 py-1.5 mx-3 ml-8 text-sm font-normal",
            active || (level === 0 && childActive)
              ? "bg-primary text-primary-foreground shadow-lg" 
              : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className={cn("flex-shrink-0 text-foreground", level === 0 ? "w-4 h-4" : "w-3 h-3")} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className={cn(level === 0 ? "text-sm font-medium" : "text-xs font-normal")}>
                  {item.label}
                </div>
                {level === 0 && (
                  <div className="text-xs opacity-75 truncate">{item.description}</div>
                )}
              </div>
              {hasChildren && (
                <div className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              )}
            </>
          )}
        </button>

        {hasChildren && isExpanded && !collapsed && (
          <div className="w-full">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 bg-surface border-r border-border transition-all duration-300 flex flex-col h-screen z-50",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">Trading Platform</h1>
              <p className="text-xs text-muted-foreground">Algorithmic Trading System</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>
      </ScrollArea>

      <div className="mt-auto">
        <div className="p-2 border-b-[0.5px] border-white">
          <UserConfigDropdown />
        </div>
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", collapsed ? "justify-center" : "")}>
            <div className="status-dot online"></div>
            {!collapsed && <>System Status: Online</>}
          </div>
        </div>
      </div>
    </div>
  );
};