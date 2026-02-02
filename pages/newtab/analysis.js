// pages/newtab/analysis.js
// MV3-compliant module script for the Analysis Center page

const DEFAULT_SETTINGS = {
  theme: 'light',
  accentColor: 'blue',
  enableAnimations: true,
  compactMode: false,
};

function applyThemeFromSettings(settings) {
  const html = document.documentElement;
  const body = document.body;

  const theme = settings.theme || 'light';
  const accent = settings.accentColor || 'blue';

  const setTheme = (value) => {
    html.setAttribute('data-theme', value);
  };

  if (theme === 'auto') {
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mq && mq.matches;
    setTheme(isDark ? 'dark' : 'light');
    if (mq) {
      // Listen for system theme changes
      try {
        mq.addEventListener('change', (e) => setTheme(e.matches ? 'dark' : 'light'));
      } catch (err) {
        // Safari fallback
        if (typeof mq.addListener === 'function') {
          mq.addListener((e) => setTheme(e.matches ? 'dark' : 'light'));
        }
      }
    }
  } else {
    setTheme(theme);
  }

  html.setAttribute('data-accent', accent);

  // Optional: keep these consistent with other pages
  if (settings.compactMode) body.classList.add('compact-mode');
  else body.classList.remove('compact-mode');

  if (settings.enableAnimations === false) body.classList.add('no-animations');
  else body.classList.remove('no-animations');
}

function loadNewtabSettings() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('newtabSettings', (result) => {
        const settings = { ...DEFAULT_SETTINGS, ...(result?.newtabSettings || {}) };
        resolve(settings);
      });
    } else {
      // Fallback for non-extension environments
      try {
        const raw = localStorage.getItem('newtabSettings');
        const parsed = raw ? JSON.parse(raw) : {};
        resolve({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        resolve({ ...DEFAULT_SETTINGS });
      }
    }
  });
}

function initStorageSync() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.newtabSettings) {
        const newSettings = { ...DEFAULT_SETTINGS, ...(changes.newtabSettings.newValue || {}) };
        applyThemeFromSettings(newSettings);
      }
    });
  }
}

function initNavActions() {
  // 返回首页按钮
  const backBtn = Array.from(document.querySelectorAll('.nav-btn')).find((btn) => btn.title === '返回首页');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const url = chrome.runtime.getURL('pages/newtab/index.html');
        window.location.href = url;
      } catch (err) {
        // Fallback
        window.history.back();
      }
    });
  }

  // 刷新按钮
  const refreshBtn = Array.from(document.querySelectorAll('.nav-btn')).find((btn) => btn.title === '刷新');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => window.location.reload());
  }
}

async function bootstrap() {
  const settings = await loadNewtabSettings();
  applyThemeFromSettings(settings);

  // Initialize icons if lucide is present
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch (e) {
      // ignore
    }
  }

  initStorageSync();
  initNavActions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
