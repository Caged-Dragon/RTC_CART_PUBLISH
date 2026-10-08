import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { loadThemePage, applyThemeVars, applyComponentStyles } from '../themeDatabase';

type Theme = 'light' | 'dark';
interface ThemeContextType { theme: Theme; toggleTheme: () => void; setTheme: (theme: Theme) => void; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('redthunder_theme');
      return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch { return 'light'; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('redthunder_theme', theme);
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.classList.toggle('light', theme === 'light');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(theme);
    } catch (error) { console.error(error); }
  }, [theme]);

  useEffect(() => {
    let active = true;
    const load = async (page: string) => {
      const target = page || 'home';
      const t = await loadThemePage('cart', target);
      if (!active) return;
      applyThemeVars(t);
      // Same table, same website scope. This is read-only and page-local.
      try {
        const rows = await dbSelect<any>(
          'theme_page_settings',
          `select=component_tokens,custom_css&website_key=eq.cart&page_key=eq.${encodeURIComponent(target)}&is_active=eq.true&limit=1`,
        );
        if (active) applyComponentStyles({ ...t, ...(rows[0] || {}) });
      } catch {
        if (active) applyComponentStyles(t);
      }
    };
    load(document.documentElement.dataset.rtcPage || 'home');
    const handler = (event: Event) => load((event as CustomEvent<string>).detail || 'home');
    window.addEventListener('rt-theme-page', handler);
    return () => { active = false; window.removeEventListener('rt-theme-page', handler); };
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setThemeState((prev) => prev === 'dark' ? 'light' : 'dark'), setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
