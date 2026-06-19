// Light / dark theme handling for the dashboard.
// We toggle the `dark` class on <html>; Tailwind's class dark mode does the rest.
// The choice is mirrored to localStorage so it applies instantly on reload,
// and persisted in Supabase (on the onboarding row) so it follows the user.

export type Theme = 'light' | 'dark';

const KEY = 'kernel_theme';

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
}

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

// Apply the saved theme at app startup (defaults to dark).
export function initTheme() {
  applyTheme(getStoredTheme());
}
