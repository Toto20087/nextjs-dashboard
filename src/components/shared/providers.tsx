'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { NavigationProvider } from "@/hooks/useNavigationState";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReactNode, useState } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create query client in state to ensure it's stable across renders
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <NavigationProvider>
            {children}
            <Toaster />
            <Sonner />
          </NavigationProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}