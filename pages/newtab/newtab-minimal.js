import { BookmarkService } from '../../modules/bookmarkService.js';

// ========================================
// 苹果极简风 NewTab 完整功能版
// ========================================

const bookmarkService = new BookmarkService();

// --- 设置管理 ---
const defaultSettings = {
  theme: 'light',
  accentColor: 'blue',
  shortcuts: [
    { title: 'Gmail', url: 'https://mail.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png' },
    { title: '云端硬盘', url: 'https://drive.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png' },
    { title: '日历', url: 'https://calendar.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png' },
    { title: 'YouTube', url: 'https://www.youtube.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#FF0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>' },
    { title: 'GitHub', url: 'https://github.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>' }
  ],
  preferredEngine: 'google'
};

let settings = { ...defaultSettings };

// --- 状态管理 ---
const state = {
  currentEngine: 'google',
  searchQuery: '',
  isEnginePopoverOpen: false,
  isSettingsOpen: false,
  isAddShortcutOpen: false
};

// --- 搜索引擎配置 ---
const engines = {
  google: { name: 'Google', template: 'https://www.google.com/search?q={query}', home: 'https://www.google.com/' },
  bing: { name: 'Bing', template: 'https://www.bing.com/search?q={query}', home: 'https://www.bing.com/' },
  duckduckgo: { name: 'DuckDuckGo', template: 'https://duckduckgo.com/?q={query}', home: 'https://duckduckgo.com/' },
  baidu: { name: '百度', template: 'https://www.baidu.com/s?wd={query}', home: 'https://www.baidu.com/' },
  yahoo: { name: 'Yahoo', template: 'https://sg.search.yahoo.com/search?p={query}', home: 'https://sg.search.yahoo.com/' },
  sogou: { name: '搜狗', template: 'https://www.sogou.com/web?query={query}', home: 'https://www.sogou.com/' },
  weixin: { name: '微信搜索', template: 'https://weixin.sogou.com/weixin?query={query}', home: 'https://weixin.sogou.com/' },
  wolfram: { name: 'WolframAlpha', template: 'https://www.wolframalpha.com/input?i={query}', home: 'https://www.wolframalpha.com/' }
};

// --- 工具函数 ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return null;
  }
}

function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'apple-toast active ' + type;
  setTimeout(() => {
    toast.classList.remove('active');
  }, 2500);
}

// --- 设置管理 ---
async function loadSettings() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['newtabSettings', 'pinnedBookmarks', 'pinnedOrder'], (data) => {
        if (data.newtabSettings) {
          settings = { ...defaultSettings, ...data.newtabSettings };
        }
        pinnedBookmarkIds = data.pinnedBookmarks || [];
        pinnedOrder = data.pinnedOrder || [];
        applySettings();
        resolve();
      });
    } else {
      applySettings();
      resolve();
    }
  });
}

async function saveSettings() {
  try {
    await chrome.storage?.local.set({ appleMinimalSettings: settings });
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

function applySettings() {
  // 应用主题
  document.documentElement.setAttribute('data-theme', settings.theme);
  updateThemeIcon(settings.theme);
  updateThemeSelector(settings.theme);

  // 应用主题色
  const accentColors = {
    blue: '#007AFF',
    purple: '#8B5CF6',
    green: '#34C759',
    orange: '#FF9500',
    red: '#FF3B30',
    pink: '#FF2D92'
  };
  document.documentElement.style.setProperty('--apple-accent', accentColors[settings.accentColor] || '#007AFF');
  updateAccentSelector(settings.accentColor);

  // 应用搜索引擎
  if (settings.preferredEngine) {
    selectEngine(settings.preferredEngine, false);
  }
}

function updateThemeSelector(theme) {
  document.querySelectorAll('#theme-selector .apple-theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });
}

function updateAccentSelector(color) {
  document.querySelectorAll('#accent-colors .apple-accent-color').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.color === color);
  });
}

// --- 时间更新 ---
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  document.getElementById('clock-time').textContent = timeStr;

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
  document.getElementById('clock-date').textContent = dateStr;

  let greeting = '你好';
  if (hours >= 5 && hours < 12) greeting = '早上好';
  else if (hours >= 12 && hours < 14) greeting = '中午好';
  else if (hours >= 14 && hours < 18) greeting = '下午好';
  else if (hours >= 18 && hours < 22) greeting = '晚上好';
  else greeting = '夜深了';
  document.getElementById('greeting').textContent = greeting;
}

// --- 搜索引擎管理 ---
function getCurrentEngine() {
  const activeOption = document.querySelector('.engine-option.active');
  if (activeOption) {
    return {
      id: activeOption.dataset.engine,
      name: activeOption.querySelector('.engine-name').textContent,
      template: activeOption.dataset.template,
      home: activeOption.dataset.home
    };
  }
  return engines.google;
}

function buildSearchUrl(query) {
  const engine = getCurrentEngine();
  if (!query) return engine.home;
  return engine.template.replace('{query}', encodeURIComponent(query));
}

function selectEngine(engineId, save = true) {
  document.querySelectorAll('.engine-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.engine === engineId);
  });
  const engine = engines[engineId] || engines.google;
  document.getElementById('engine-label').textContent = engine.name;
  state.currentEngine = engineId;
  if (save) {
    settings.preferredEngine = engineId;
    saveSettings();
  }
  closeEnginePopover();
}

function toggleEnginePopover() {
  const popover = document.getElementById('engine-popover');
  state.isEnginePopoverOpen = !state.isEnginePopoverOpen;
  popover.classList.toggle('hidden', !state.isEnginePopoverOpen);
}

function closeEnginePopover() {
  const popover = document.getElementById('engine-popover');
  state.isEnginePopoverOpen = false;
  popover.classList.add('hidden');
}

// --- 搜索功能 ---
async function performSearch(query, type = 'bookmark') {
  const trimmed = query.trim();
  if (!trimmed) return;

  if (type === 'web') {
    window.location.href = buildSearchUrl(trimmed);
  } else {
    const results = await searchBookmarks(trimmed);
    if (results.length === 1) {
      window.open(results[0].url, '_blank');
    } else if (results.length > 0) {
      updateSuggestions(trimmed);
    } else {
      window.location.href = buildSearchUrl(trimmed);
    }
  }
}

async function searchBookmarks(query) {
  if (!query) return [];
  try {
    const results = await bookmarkService.search(query);
    return results.slice(0, 10);
  } catch {
    return [];
  }
}

async function searchFolders(query) {
  if (!query) return [];
  try {
    const tree = await new Promise(resolve => chrome.bookmarks.getTree(resolve));
    const folders = [];

    const walk = (node, path = '') => {
      if (!node || node.url) return;
      const title = node.title || '未命名';
      const nextPath = path ? `${path} / ${title}` : title;
      if (node.id && node.id !== '0' && title.toLowerCase().includes(query.toLowerCase())) {
        folders.push({ id: node.id, title, path: nextPath });
      }
      if (node.children) {
        node.children.forEach(child => walk(child, nextPath));
      }
    };

    tree[0]?.children?.forEach(child => walk(child));
    return folders.slice(0, 5);
  } catch {
    return [];
  }
}

async function getRecentBookmarks(limit = 5) {
  try {
    return await bookmarkService.getRecent(limit);
  } catch {
    return [];
  }
}

// --- 搜索建议 ---
const updateSuggestions = debounce(async (query) => {
  const suggestionsEl = document.getElementById('search-suggestions');
  const trimmed = query.trim();

  if (!trimmed) {
    const recent = await getRecentBookmarks(5);
    if (recent.length > 0) {
      suggestionsEl.innerHTML = `
        <div class="suggestion-group">
          <div class="suggestion-title">最近访问</div>
          ${recent.map(b => `
            <div class="apple-suggestion-item" data-type="bookmark" data-url="${escapeHtml(b.url)}" data-id="${b.id}">
              <img class="suggestion-favicon" src="${getFaviconUrl(b.url)}" onerror="this.style.display='none'" />
              <div class="suggestion-content">
                <span class="apple-suggestion-text">${escapeHtml(b.title || b.url)}</span>
                <span class="suggestion-url">${escapeHtml(getHostname(b.url))}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      suggestionsEl.classList.add('active');
    } else {
      suggestionsEl.classList.remove('active');
    }
    return;
  }

  const [bookmarks, folders] = await Promise.all([
    searchBookmarks(trimmed),
    searchFolders(trimmed)
  ]);

  const engine = getCurrentEngine();

  let html = '';

  if (bookmarks.length > 0) {
    html += `
      <div class="suggestion-group">
        <div class="suggestion-title">书签</div>
        ${bookmarks.slice(0, 5).map(b => `
          <div class="apple-suggestion-item" data-type="bookmark" data-url="${escapeHtml(b.url)}" data-id="${b.id}">
            <img class="suggestion-favicon" src="${getFaviconUrl(b.url)}" onerror="this.style.display='none'" />
            <div class="suggestion-content">
              <span class="apple-suggestion-text">${escapeHtml(b.title || b.url)}</span>
              <span class="suggestion-url">${escapeHtml(getHostname(b.url))}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (folders.length > 0) {
    html += `
      <div class="suggestion-group">
        <div class="suggestion-title">文件夹</div>
        ${folders.map(f => `
          <div class="apple-suggestion-item" data-type="folder" data-id="${f.id}">
            <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <div class="suggestion-content">
              <span class="apple-suggestion-text">${escapeHtml(f.title)}</span>
              <span class="suggestion-url">${escapeHtml(f.path)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  html += `
    <div class="suggestion-group">
      <div class="suggestion-title">Web 搜索</div>
      <div class="apple-suggestion-item suggestion-web" data-type="web" data-query="${escapeHtml(trimmed)}">
        <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M2 12h20"></path>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <div class="suggestion-content">
          <span class="apple-suggestion-text">用 ${engine.name} 搜索 "${escapeHtml(trimmed)}"</span>
          <span class="suggestion-url">Shift+Enter</span>
        </div>
      </div>
    </div>
  `;

  suggestionsEl.innerHTML = html;
  suggestionsEl.classList.add('active');
}, 150);

function hideSuggestions() {
  const suggestionsEl = document.getElementById('search-suggestions');
  suggestionsEl.classList.remove('active');
}

// --- 快捷方式 ---
function loadShortcuts() {
  const grid = document.getElementById('shortcuts-grid');
  const shortcuts = settings.shortcuts || defaultSettings.shortcuts;

  grid.innerHTML = shortcuts.map(s => `
    <a class="apple-shortcut" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
      <div class="apple-shortcut-icon">
        ${s.icon ? `<img src="${escapeHtml(s.icon)}" alt="" onerror="this.parentElement.innerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'></circle></svg>'" />` : (s.svg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>')}
      </div>
      <span class="apple-shortcut-label">${escapeHtml(s.title)}</span>
    </a>
  `).join('') + `
    <button class="apple-shortcut apple-shortcut-add" id="add-shortcut-btn" type="button" aria-label="添加快捷方式">
      <div class="apple-shortcut-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
      </div>
      <span class="apple-shortcut-label">添加</span>
    </button>
  `;

  // 绑定添加快捷方式按钮
  document.getElementById('add-shortcut-btn')?.addEventListener('click', openAddShortcutModal);
}

// --- 主题切换 ---
function toggleTheme() {
  const themes = ['light', 'dark'];
  const currentIndex = themes.indexOf(settings.theme);
  settings.theme = themes[(currentIndex + 1) % themes.length];
  saveSettings();
  applySettings();
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-btn');
  const svg = btn.querySelector('svg');
  if (theme === 'dark') {
    svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  } else {
    svg.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
  }
}

// --- 模态框管理 ---
function openSettingsModal() {
  document.getElementById('settings-modal').classList.add('active');
  state.isSettingsOpen = true;
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('active');
  state.isSettingsOpen = false;
}

function openAddShortcutModal() {
  document.getElementById('add-shortcut-modal').classList.add('active');
  state.isAddShortcutOpen = true;
  document.getElementById('shortcut-name').value = '';
  document.getElementById('shortcut-url').value = '';
  document.getElementById('shortcut-name').focus();
}

function closeAddShortcutModal() {
  document.getElementById('add-shortcut-modal').classList.remove('active');
  state.isAddShortcutOpen = false;
}

function saveShortcut() {
  const name = document.getElementById('shortcut-name').value.trim();
  const url = document.getElementById('shortcut-url').value.trim();

  if (!name || !url) {
    showToast('请填写名称和网址', 'error');
    return;
  }

  try {
    new URL(url);
  } catch {
    showToast('请输入有效的网址', 'error');
    return;
  }

  settings.shortcuts = settings.shortcuts || [...defaultSettings.shortcuts];
  settings.shortcuts.push({ title: name, url, icon: null });
  saveSettings();
  loadShortcuts();
  closeAddShortcutModal();
  showToast('快捷方式已添加', 'success');
}

// --- 导入导出功能 ---
async function exportBookmarks() {
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      bookmarks: bookmarks
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('书签已导出', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('导出失败', 'error');
  }
}

function importBookmarks() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.html';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importData;

      if (file.name.endsWith('.json')) {
        importData = JSON.parse(text);
        if (importData.bookmarks) {
          for (const bookmark of importData.bookmarks) {
            try {
              await new Promise(resolve =>
                chrome.bookmarks.create({
                  parentId: '1',
                  title: bookmark.title,
                  url: bookmark.url
                }, resolve)
              );
            } catch (error) {
              console.error('Failed to import bookmark:', bookmark.title, error);
            }
          }
        }
      } else if (file.name.endsWith('.html')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a[href]');

        for (const link of links) {
          try {
            await new Promise(resolve =>
              chrome.bookmarks.create({
                parentId: '1',
                title: link.textContent || link.href,
                url: link.href
              }, resolve)
            );
          } catch (error) {
            console.error('Failed to import bookmark:', link.href, error);
          }
        }
      }

      showToast('书签已导入', 'success');
    } catch (error) {
      console.error('Import failed:', error);
      showToast('导入失败', 'error');
    }
  };

  input.click();
}

// --- 事件绑定 ---
function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const suggestionsEl = document.getElementById('search-suggestions');
  const engineBtn = document.getElementById('engine-btn');
  const enginePopover = document.getElementById('engine-popover');

  // 搜索输入
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    updateSuggestions(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    updateSuggestions(searchInput.value);
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      hideSuggestions();
      closeEnginePopover();
    }, 200);
  });

  // 键盘事件
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query, e.shiftKey ? 'web' : 'bookmark');
      }
    } else if (e.key === 'Escape') {
      searchInput.blur();
      hideSuggestions();
      closeEnginePopover();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      toggleEnginePopover();
    }
  });

  // 清除按钮
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    hideSuggestions();
  });

  // 搜索引擎切换
  engineBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleEnginePopover();
  });

  // 搜索引擎选项点击
  enginePopover.addEventListener('click', (e) => {
    const option = e.target.closest('.engine-option');
    if (option) {
      selectEngine(option.dataset.engine);
      searchInput.focus();
    }
  });

  // 建议点击
  suggestionsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.apple-suggestion-item');
    if (item) {
      const type = item.dataset.type;
      if (type === 'bookmark') {
        window.open(item.dataset.url, '_blank');
      } else if (type === 'folder') {
        window.location.href = `./index.html?folderId=${item.dataset.id}`;
      } else if (type === 'web') {
        window.location.href = buildSearchUrl(item.dataset.query);
      }
      hideSuggestions();
    }
  });

  // 搜索语法提示
  document.querySelectorAll('.hint-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const insert = chip.dataset.insert;
      const input = searchInput;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const value = input.value;

      if (insert === '""') {
        const selected = value.substring(start, end);
        input.value = value.substring(0, start) + '"' + selected + '"' + value.substring(end);
        input.setSelectionRange(start + 1, end + 1);
      } else {
        input.value = value.substring(0, start) + insert + value.substring(end);
        input.setSelectionRange(start + insert.length, start + insert.length);
      }

      input.focus();
      updateSuggestions(input.value);
    });
  });

  // 底部按钮
  document.getElementById('analysis-center-btn').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('pages/newtab/dashbord.html') });
    } else {
      window.location.href = './dashbord.html';
    }
  });

  document.getElementById('manager-btn').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('enhanced-bookmark-manager.html') });
    } else {
      window.location.href = '../../enhanced-bookmark-manager.html';
    }
  });

  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('settings-btn').addEventListener('click', openSettingsModal);

  // 设置面板
  document.getElementById('settings-close').addEventListener('click', closeSettingsModal);
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettingsModal();
  });

  // 主题选择
  document.querySelectorAll('#theme-selector .apple-theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      settings.theme = opt.dataset.theme;
      saveSettings();
      applySettings();
    });
  });

  // 主题色选择
  document.querySelectorAll('#accent-colors .apple-accent-color').forEach(opt => {
    opt.addEventListener('click', () => {
      settings.accentColor = opt.dataset.color;
      saveSettings();
      applySettings();
    });
  });

  // 设置面板按钮
  document.getElementById('export-btn').addEventListener('click', exportBookmarks);
  document.getElementById('import-btn').addEventListener('click', importBookmarks);

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('确定要重置所有设置吗？')) {
      settings = { ...defaultSettings };
      saveSettings();
      applySettings();
      loadShortcuts();
      showToast('设置已重置', 'success');
    }
  });

  document.getElementById('about-btn').addEventListener('click', () => {
    showToast('BookmarkHub v1.0 - 极简新标签页', 'default');
  });

  // 添加快捷方式弹窗
  document.getElementById('add-shortcut-close').addEventListener('click', closeAddShortcutModal);
  document.getElementById('shortcut-cancel').addEventListener('click', closeAddShortcutModal);
  document.getElementById('shortcut-save').addEventListener('click', saveShortcut);
  document.getElementById('add-shortcut-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-shortcut-modal') closeAddShortcutModal();
  });

  // 点击外部关闭弹出层
  document.addEventListener('click', (e) => {
    if (!enginePopover.contains(e.target) && !engineBtn.contains(e.target)) {
      closeEnginePopover();
    }
  });

  // ESC 键关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.isSettingsOpen) closeSettingsModal();
      if (state.isAddShortcutOpen) closeAddShortcutModal();
    }
  });
}

// --- 初始化 ---
async function init() {
  await loadSettings();

  updateClock();
  setInterval(updateClock, 1000);

  loadShortcuts();
  loadPinnedBookmarks();
  initEventListeners();


  setTimeout(() => {
    document.getElementById('search-input').focus();
  }, 300);
}

// ═══════════════════════════════════
// Bookmark Display System — Icon Grid
// ═══════════════════════════════════

let pinnedBookmarkIds = [];
let pinnedOrder = [];
let allFlatBookmarks = [];
let folderTree = [];

const ICON_COLORS = ['#007aff', '#5856d6', '#af52de', '#ff2d55', '#ff9500', '#34c759', '#5ac8fa', '#ff6482', '#30b0c7', '#a2845e'];

async function loadPinnedBookmarks() {
  const grid = document.getElementById('bookmarks-grid');
  if (!grid) return;

  // Load persisted state from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const stored = await new Promise(r => chrome.storage.local.get(['pinnedBookmarks', 'pinnedOrder', 'favoriteFolders'], r));
      if (stored.pinnedBookmarks) pinnedBookmarkIds = stored.pinnedBookmarks;
      if (stored.pinnedOrder) pinnedOrder = stored.pinnedOrder;
      if (stored.favoriteFolders) favoriteFolders = stored.favoriteFolders;
    } catch (e) { /* ignore */ }
  }

  try {
    // Load raw tree for folder picker (has folder nodes with children)
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      folderTree = await bookmarkService.getTree();
    }
    // Load flat bookmarks for display
    const allBookmarks = await bookmarkService.getAllBookmarks();
    allFlatBookmarks = flattenBookmarks(allBookmarks);

    renderFolderTabs();
    bindBookmarkControls();
    refreshBookmarkGrid();
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    grid.innerHTML = '<div class="bookmarks-empty"><div>加载书签失败</div></div>';
  }
}

// Favorite folders — persisted to storage
let favoriteFolders = []; // [{id, title}]
let activeFolder = 'recent';

function renderFolderTabs() {
  const tabs = document.getElementById('bm-folder-tabs');
  if (!tabs) return;

  // Remove old custom tabs (keep built-in recent + pinned + add button)
  tabs.querySelectorAll('.bm-tab-custom').forEach(t => t.remove());

  const addBtn = document.getElementById('bm-add-folder-btn');

  for (const f of favoriteFolders) {
    const btn = document.createElement('button');
    btn.className = `bm-tab bm-tab-custom ${activeFolder === 'folder:' + f.id ? 'active' : ''}`;
    btn.dataset.folder = 'folder:' + f.id;
    btn.innerHTML = `${escapeHtml(f.title)}<span class="bm-tab-remove" data-remove-id="${f.id}" title="移除">✕</span>`;
    tabs.insertBefore(btn, addBtn);
  }

  // Update active state for built-in tabs
  tabs.querySelectorAll('.bm-tab:not(.bm-tab-add)').forEach(t => {
    t.classList.toggle('active', t.dataset.folder === activeFolder);
  });

  bindTabClicks();
}

function bindTabClicks() {
  const tabs = document.getElementById('bm-folder-tabs');
  if (!tabs) return;

  tabs.querySelectorAll('.bm-tab:not(.bm-tab-add)').forEach(btn => {
    btn.onclick = (e) => {
      if (e.target.classList.contains('bm-tab-remove')) {
        removeFavoriteFolder(e.target.dataset.removeId);
        return;
      }
      activeFolder = btn.dataset.folder;
      tabs.querySelectorAll('.bm-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      refreshBookmarkGrid();
    };
  });

  // Add folder button
  document.getElementById('bm-add-folder-btn').onclick = openFolderPicker;

  // Close picker
  document.getElementById('folder-picker-close').onclick = closeFolderPicker;
  document.getElementById('folder-picker-overlay').onclick = (e) => {
    if (e.target === e.currentTarget) closeFolderPicker();
  };
}

function openFolderPicker() {
  const overlay = document.getElementById('folder-picker-overlay');
  const list = document.getElementById('folder-picker-list');
  if (!overlay || !list) return;

  const favIds = new Set(favoriteFolders.map(f => f.id));
  let html = '';

  const walk = (nodes, depth = 0) => {
    if (!nodes) return;
    for (const n of nodes) {
      if (!n.url && n.children && n.title) {
        const count = countBookmarksInFolder(n);
        const selected = favIds.has(n.id) ? 'selected' : '';
        const indent = depth * 16;
        html += `
          <div class="bm-picker-item ${selected}" data-fid="${n.id}" data-ftitle="${escapeHtml(n.title)}" style="padding-left:${12 + indent}px">
            <span class="bm-picker-icon">📁</span>
            <span class="bm-picker-name">${escapeHtml(n.title)}</span>
            <span class="bm-picker-count">${count}</span>
            <span class="bm-picker-check"></span>
          </div>
        `;
        walk(n.children, depth + 1);
      }
    }
  };

  if (Array.isArray(folderTree)) {
    for (const root of folderTree) {
      if (root.children) walk(root.children);
    }
  }

  list.innerHTML = html || '<div class="bookmarks-empty">没有找到文件夹</div>';
  overlay.classList.add('show');

  // Bind clicks
  list.querySelectorAll('.bm-picker-item').forEach(item => {
    item.onclick = () => {
      const fid = item.dataset.fid;
      const ftitle = item.dataset.ftitle;
      if (item.classList.contains('selected')) {
        // Remove
        favoriteFolders = favoriteFolders.filter(f => f.id !== fid);
        item.classList.remove('selected');
      } else {
        // Add
        favoriteFolders.push({ id: fid, title: ftitle });
        item.classList.add('selected');
      }
      saveFavoriteFolders();
      renderFolderTabs();
    };
  });
}

function closeFolderPicker() {
  document.getElementById('folder-picker-overlay')?.classList.remove('show');
}

function removeFavoriteFolder(folderId) {
  favoriteFolders = favoriteFolders.filter(f => f.id !== folderId);
  if (activeFolder === 'folder:' + folderId) {
    activeFolder = 'recent';
  }
  saveFavoriteFolders();
  renderFolderTabs();
  refreshBookmarkGrid();
}

function countBookmarksInFolder(node) {
  let count = 0;
  const walk = (n) => {
    if (n.url) count++;
    if (n.children) n.children.forEach(walk);
  };
  if (node.children) node.children.forEach(walk);
  return count;
}

function saveFavoriteFolders() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ favoriteFolders });
  }
}

function bindBookmarkControls() {
  const sortSel = document.getElementById('bookmark-sort-select');
  sortSel?.addEventListener('change', () => refreshBookmarkGrid());
}

const BOOKMARKS_PER_PAGE = 20;
let currentPage = 1;
let totalFilteredItems = [];

function refreshBookmarkGrid(resetPage = true) {
  const grid = document.getElementById('bookmarks-grid');
  if (!grid) return;

  if (resetPage) currentPage = 1;

  const folderVal = activeFolder;
  const sortVal = document.getElementById('bookmark-sort-select')?.value || 'dateDesc';

  let items = [];

  if (folderVal === 'pinned') {
    // Only pinned items, maintain pin order
    for (const id of pinnedOrder) {
      const bm = allFlatBookmarks.find(b => b.id === id);
      if (bm) items.push({ ...bm, isPinned: true });
    }
    for (const id of pinnedBookmarkIds) {
      if (!pinnedOrder.includes(id)) {
        const bm = allFlatBookmarks.find(b => b.id === id);
        if (bm) items.push({ ...bm, isPinned: true });
      }
    }
  } else if (folderVal === 'recent') {
    items = allFlatBookmarks.filter(b => b.url).map(b => ({
      ...b,
      isPinned: pinnedBookmarkIds.includes(b.id)
    }));
  } else if (folderVal.startsWith('folder:')) {
    const folderId = folderVal.replace('folder:', '');
    const folderItems = getBookmarksInFolder(folderId);
    items = folderItems.map(b => ({
      ...b,
      isPinned: pinnedBookmarkIds.includes(b.id)
    }));
  }

  // Sort: pinned items first, then apply sort within each group
  if (folderVal !== 'pinned') {
    const pinned = items.filter(b => b.isPinned);
    const unpinned = items.filter(b => !b.isPinned);
    items = [...sortBookmarks(pinned, sortVal), ...sortBookmarks(unpinned, sortVal)];
  }

  totalFilteredItems = items;
  const pageItems = items.slice(0, currentPage * BOOKMARKS_PER_PAGE);
  const hasMore = items.length > pageItems.length;

  if (items.length === 0) {
    grid.innerHTML = `<div class="bookmarks-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
      <div>${folderVal === 'pinned' ? '还没有置顶书签' : '没有找到书签'}</div>
    </div>`;
    return;
  }

  renderIconGrid(pageItems, grid, hasMore, items.length);
}

function getBookmarksInFolder(folderId) {
  const result = [];
  const find = (nodes) => {
    if (!nodes) return null;
    for (const n of nodes) {
      if (n.id === folderId) return n;
      if (n.children) {
        const found = find(n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const folder = find(folderTree);
  if (folder && folder.children) {
    const walk = (children) => {
      for (const c of children) {
        if (c.url) result.push(c);
        if (c.children) walk(c.children);
      }
    };
    walk(folder.children);
  }
  return result;
}

function sortBookmarks(items, sortVal) {
  switch (sortVal) {
    case 'dateDesc': return items.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    case 'dateAsc': return items.sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0));
    case 'nameAsc': return items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'nameDesc': return items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    default: return items;
  }
}

function renderIconGrid(items, grid, hasMore = false, totalCount = 0) {
  let html = items.map((b, i) => {
    const hostname = getHostname(b.url);
    const favicon = getFaviconUrl(b.url);
    const title = b.title || hostname;
    const shortTitle = title.length > 8 ? title.slice(0, 7) + '…' : title;
    const pinnedClass = b.isPinned ? 'pinned' : '';
    const letter = (title[0] || '?').toUpperCase();
    const color = ICON_COLORS[letter.charCodeAt(0) % ICON_COLORS.length];

    return `
      <div class="bm-icon-item ${pinnedClass}" data-id="${b.id}" data-url="${escapeHtml(b.url)}" title="${escapeHtml(title)}">
        <div class="bm-icon-wrap" style="--fallback-bg:${color}">
          <img src="${favicon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="bm-letter" style="display:none;background:${color};width:100%;height:100%;align-items:center;justify-content:center">${letter}</span>
        </div>
        <span class="bm-icon-label">${escapeHtml(shortTitle)}</span>
        <span class="bm-pin-dot"></span>
        <button class="bm-pin-action" data-pin-id="${b.id}" title="${b.isPinned ? '取消置顶' : '置顶'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // Pagination: Load More button
  if (hasMore) {
    const remaining = totalCount - items.length;
    html += `
      <div class="bm-load-more-wrap">
        <button class="bm-load-more" id="bm-load-more-btn">
          加载更多 <span class="bm-load-more-count">(还有 ${remaining} 个)</span>
        </button>
      </div>
    `;
  } else if (totalCount > BOOKMARKS_PER_PAGE) {
    html += `<div class="bm-page-info">已显示全部 ${totalCount} 个书签</div>`;
  }

  grid.innerHTML = html;

  // Bind click to open
  grid.querySelectorAll('.bm-icon-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.bm-pin-action')) return;
      const url = item.dataset.url;
      if (url) window.open(url, '_blank');
    });
  });

  // Bind pin buttons
  grid.querySelectorAll('.bm-pin-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePin(btn.dataset.pinId);
    });
  });

  // Bind Load More
  document.getElementById('bm-load-more-btn')?.addEventListener('click', () => {
    currentPage++;
    refreshBookmarkGrid(false);
  });
}

function togglePin(bookmarkId) {
  const idx = pinnedBookmarkIds.indexOf(bookmarkId);
  if (idx >= 0) {
    pinnedBookmarkIds.splice(idx, 1);
    const oi = pinnedOrder.indexOf(bookmarkId);
    if (oi >= 0) pinnedOrder.splice(oi, 1);
    showToast('已取消置顶', 'default');
  } else {
    pinnedBookmarkIds.push(bookmarkId);
    pinnedOrder.push(bookmarkId);
    showToast('已置顶', 'success');
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ pinnedBookmarks: pinnedBookmarkIds, pinnedOrder });
  }

  refreshBookmarkGrid();
}

function flattenBookmarks(tree) {
  const flat = [];
  const walk = (nodes) => {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.url) flat.push(n);
      if (n.children) walk(n.children);
    }
  };
  if (Array.isArray(tree)) walk(tree);
  return flat;
}

init();