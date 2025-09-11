import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ColorPalette = 'default' | 'colorblind';

interface ThemeContextType {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  user: {
    name: string;
    email: string;
    role: 'admin' | 'analyst';
  } | null;
  setUser: (user: ThemeContextType['user']) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [palette, setPalette] = useState<ColorPalette>('default');
  const [user, setUser] = useState<ThemeContextType['user']>({
    name: 'John Trader',
    email: 'john@tradingfirm.com',
    role: 'admin'
  });

  useEffect(() => {
    try {
      const savedPalette = localStorage.getItem('color-palette') as ColorPalette;
      if (savedPalette && (savedPalette === 'default' || savedPalette === 'colorblind')) {
        setPalette(savedPalette);
      }
    } catch (error) {
      console.warn('Failed to load palette preference:', error);
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-palette', palette);
      localStorage.setItem('color-palette', palette);
    } catch (error) {
      console.warn('Failed to save palette preference:', error);
    }
  }, [palette]);

  return (
    <ThemeContext.Provider value={{ palette, setPalette, user, setUser }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};