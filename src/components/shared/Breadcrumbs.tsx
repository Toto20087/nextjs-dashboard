'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeMapping: Record<string, string> = {
  'live-trading': 'Live Trading',
  'risk-center': 'Risk Center',
  'analytics': 'Analytics',
  'strategy-approval': 'Strategy Approval',
  'timing-lab': 'Timing Lab',
  'capital-mgmt': 'Capital Mgmt',
  'strategy-lab': 'Strategy Lab',
  'news-center': 'News Center',
  'control-center': 'Control Center',
  'infra': 'Infra',
  'audit-trail': 'Audit Trail',
  'sectorization': 'Trade Sectorization'
};

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  let currentPath = '';
  pathSegments.forEach(segment => {
    if (segment) {
      currentPath += `/${segment}`;
      const label = routeMapping[segment] || segment.replace('-', ' ');
      breadcrumbs.push({
        label,
        href: currentPath
      });
    }
  });

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
          {index === 0 ? (
            <Link 
              href={crumb.href}
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="w-3 h-3 mr-1" />
              {crumb.label}
            </Link>
          ) : index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};