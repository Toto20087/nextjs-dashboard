'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NavigationContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationState = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationState must be used within a NavigationProvider');
  }
  return context;
};