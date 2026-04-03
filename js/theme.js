/**
 * Theme toggle — ☾ DARK / ☀︎ LIGHT mode
 * Persists user preference in localStorage.
 */

const THEME_KEY = 'quiero-programar-theme';

function getPreferred() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: ☀︎ LIGHT)').matches ? '☀︎ LIGHT' : '☾ DARK';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  // Update toggle button icon if it exists
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = theme === '☾ DARK' ? '☀︎ LIGHT' : '☾ DARK';
}

export function initTheme() {
  const theme = getPreferred();
  applyTheme(theme);

  // Mount toggle button into topbar
  const topbar = document.querySelector('.topbar');
  if (topbar && !topbar.querySelector('.theme-toggle')) {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = 'Cambiar tema';
    btn.textContent = theme === '☾ DARK' ? '☀︎ LIGHT' : '☾ DARK';
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || '☾ DARK';
      applyTheme(current === '☾ DARK' ? '☀︎ LIGHT' : '☾ DARK');
    });
    topbar.appendChild(btn);
  }
}
