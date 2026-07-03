const STORAGE_KEY = 'budgetsetu_theme_override';

/**
 * Returns 'dark' or 'light' based on:
 * 1. Manual override in localStorage
 * 2. System OS preference via matchMedia
 * 3. Defaults to 'dark' if detection fails
 */
export function resolveTheme(): 'dark' | 'light' {
  const override = localStorage.getItem(STORAGE_KEY);
  if (override === 'dark' || override === 'light') return override as 'dark' | 'light';

  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'dark';
}

/**
 * Applies the resolved theme to the document root.
 * Sets data-theme="dark" or data-theme="light" on <html>, and also class="dark" / class="light".
 */
export function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Saves a manual user override.
 * Pass null to clear the override and return to automatic OS system resolution.
 */
export function setThemeOverride(theme: 'dark' | 'light' | null) {
  if (theme === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  applyTheme(resolveTheme());
  window.dispatchEvent(new Event('themechange'));
}

/**
 * Returns the current active theme ('dark' or 'light').
 */
export function getActiveTheme(): 'dark' | 'light' {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark' || current === 'light') {
    return current;
  }
  return resolveTheme();
}

// Automatically listen for OS system theme changes in real-time
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    // Only auto-switch if the user has not set a manual override in localStorage
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(resolveTheme());
      window.dispatchEvent(new Event('themechange'));
    }
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemChange);
  }
}
