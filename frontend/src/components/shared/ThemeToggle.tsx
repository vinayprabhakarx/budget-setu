import React, { useState, useEffect } from 'react';
import { getActiveTheme, setThemeOverride } from '../../utils/themeManager';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(getActiveTheme());

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(getActiveTheme());
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeOverride(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};
