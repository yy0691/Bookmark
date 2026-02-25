import { BookmarkService } from '../../modules/bookmarkService.js';

// ========================================
// 苹果极简风 NewTab 完整功能版
// ========================================

const bookmarkService = new BookmarkService();

const MODE_PRESETS = {
  work: {
    label: 'Work',
    schedule: '14:30 团队同步',
    todos: ['整理收件箱', '处理重点任务', '回顾代码审查'],
    shortcuts: [
      { title: 'Gmail', url: 'https://mail.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png' },
      { title: '云端硬盘', url: 'https://drive.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png' },
      { title: '日历', url: 'https://calendar.google.com/', icon: 'https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png' },
      { title: 'Notion', url: 'https://www.notion.so/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5 6.8 2h11.1L20 4.1v15.3L17.1 22H6.8L4 19.9V4.5Zm3 1.1v12.8h1.7V9.2l4.2 9.2h1.8V5.6H13v9.3L8.8 5.6H7Z"/></svg>' },
      { title: 'GitHub', url: 'https://github.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>' }
    ]
  },
  life: {
    label: 'Life',
    schedule: '20:00 健身计划',
    todos: ['查看私人邮箱', '家庭事项安排', '放松 30 分钟'],
    shortcuts: [
      { title: 'YouTube', url: 'https://www.youtube.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#FF0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>' },
      { title: 'Spotify', url: 'https://open.spotify.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#1DB954"><path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.5 10.5 0 0 0 12 1.5Zm4.8 15.1a.8.8 0 0 1-1.1.3 8.4 8.4 0 0 0-8.4-.4.8.8 0 1 1-.7-1.4 10 10 0 0 1 10 .5.8.8 0 0 1 .2 1Zm1.5-2.7a1 1 0 0 1-1.4.3 10.4 10.4 0 0 0-10.2-.5 1 1 0 0 1-.9-1.8 12.4 12.4 0 0 1 12.2.6 1 1 0 0 1 .3 1.4Zm.1-2.9a12.8 12.8 0 0 0-12.9-.5 1.2 1.2 0 1 1-1.1-2.1 15.2 15.2 0 0 1 15.4.6 1.2 1.2 0 0 1-1.4 2Z"/></svg>' },
      { title: '小红书', url: 'https://www.xiaohongshu.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#fe2c55"><path d="M4 5h16v14H4z"/><path d="M8.1 9.1h2.2v1.2h2.1V9.1h2.2V15h-2.2v-2.5h-2.1V15H8.1z" fill="#fff"/></svg>' },
      { title: 'Bilibili', url: 'https://www.bilibili.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#00A1D6"><path d="M6 6h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Zm3 4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-5.5 5.2h5a.7.7 0 0 0 0-1.4h-5a.7.7 0 0 0 0 1.4Z"/></svg>' },
      { title: '豆瓣', url: 'https://www.douban.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#42bd56"><path d="M4 4h16v16H4z"/><path d="M8 9h8v2H8zm0 4h8v2H8z" fill="#fff"/></svg>' }
    ]
  },
  study: {
    label: 'Study',
    schedule: '21:00 深度学习',
    todos: ['阅读 1 篇文章', '整理学习笔记', '复盘今日收获'],
    shortcuts: [
      { title: 'Wikipedia', url: 'https://www.wikipedia.org/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="m7 9 2 6 3-8 3 8 2-6"></path></svg>' },
      { title: 'MDN', url: 'https://developer.mozilla.org/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#111"><path d="M3 5h18v14H3z"/><path d="M6 9h2l2 3 2-3h2v6h-2v-3l-2 3-2-3v3H6zM16 9h2v6h-2z" fill="#fff"/></svg>' },
      { title: 'arXiv', url: 'https://arxiv.org/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#b31b1b"><path d="M4 18 10.5 6h3L20 18h-3l-1.4-2.8H8.4L7 18H4zm5.2-5h5.6L12 7.4 9.2 13z"/></svg>' },
      { title: 'Coursera', url: 'https://www.coursera.org/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#2A73CC"><path d="M12 3a9 9 0 1 0 0 18c3.3 0 6.1-1.8 7.6-4.5h-3.1a6 6 0 1 1 0-9h3.1A8.9 8.9 0 0 0 12 3Z"/></svg>' },
      { title: 'Google Scholar', url: 'https://scholar.google.com/', icon: null, svg: '<svg viewBox="0 0 24 24" fill="#4285f4"><path d="m12 3 10 5-10 5L2 8l10-5Zm0 12 6.5-3.2V16L12 21l-6.5-5v-4.2L12 15Z"/></svg>' }
    ]
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// --- 设置管理 ---
const defaultSettings = {
  theme: 'light',
  accentColor: 'blue',
  currentMode: 'work',
  modeShortcuts: {
    work: clone(MODE_PRESETS.work.shortcuts),
    life: clone(MODE_PRESETS.life.shortcuts),
    study: clone(MODE_PRESETS.study.shortcuts)
  },
  preferredEngine: 'google',
  modeTodos: {
    work: clone(MODE_PRESETS.work.todos),
    life: clone(MODE_PRESETS.life.todos),
    study: clone(MODE_PRESETS.study.todos)
  },
  modeSchedule: {
    work: MODE_PRESETS.work.schedule,
    life: MODE_PRESETS.life.schedule,
    study: MODE_PRESETS.study.schedule
  },
  funSettings: {
    offWorkTime: '18:30',
    customHolidayName: '下一次假期',
    customHolidayDate: '',
    holidayCountry: 'CN',
    aiSuggestLimit: 8,
    backgroundImageUrl: '',
    backgroundMaskOpacity: 0.35,
    backgroundBlur: true
  }
};

let settings = { ...defaultSettings };

// --- 状态管理 ---
const state = {
  currentEngine: 'google',
  searchQuery: '',
  isEnginePopoverOpen: false,
  isSettingsOpen: false,
  isAddShortcutOpen: false,
  isHolidayCalendarOpen: false,
  currentMode: 'work',
  weather: '天气待更新'
};

let shortcutRecentMap = new Map();
let weatherCache = { text: '天气待更新', ts: 0 };
let holidayCache = new Map();
const holidayState = {
  upcoming: null,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth()
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

function formatRelativeTime(timestamp) {
  if (!timestamp) return '暂无记录';
  const diff = Date.now() - Number(timestamp);
  if (diff < 60 * 1000) return '刚刚访问';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
  return '一周前';
}

function isTextInputElement(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
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
      chrome.storage.local.get(['appleMinimalSettings', 'newtabSettings', 'pinnedBookmarks', 'pinnedOrder'], (data) => {
        const saved = data.appleMinimalSettings || data.newtabSettings;
        if (saved) {
          settings = normalizeSettings(saved);
        } else {
          settings = normalizeSettings(defaultSettings);
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
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise((resolve) => {
        chrome.storage.local.set({
          appleMinimalSettings: settings,
          newtabSettings: settings
        }, resolve);
      });
    }
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

function normalizeSettings(rawSettings = {}) {
  const rawModeShortcuts = rawSettings.modeShortcuts || {};
  const rawModeTodos = rawSettings.modeTodos || {};
  const merged = {
    ...defaultSettings,
    ...rawSettings,
    modeShortcuts: {
      work: clone(rawModeShortcuts.work || defaultSettings.modeShortcuts.work),
      life: clone(rawModeShortcuts.life || defaultSettings.modeShortcuts.life),
      study: clone(rawModeShortcuts.study || defaultSettings.modeShortcuts.study)
    },
    modeTodos: {
      work: clone(rawModeTodos.work || defaultSettings.modeTodos.work),
      life: clone(rawModeTodos.life || defaultSettings.modeTodos.life),
      study: clone(rawModeTodos.study || defaultSettings.modeTodos.study)
    },
    modeSchedule: {
      ...defaultSettings.modeSchedule,
      ...(rawSettings.modeSchedule || {})
    },
    funSettings: {
      ...defaultSettings.funSettings,
      ...(rawSettings.funSettings || {})
    }
  };

  // 兼容旧版本 shortcuts，迁移到 work 模式
  if (Array.isArray(rawSettings.shortcuts) && rawSettings.shortcuts.length > 0 && !rawSettings.modeShortcuts) {
    merged.modeShortcuts.work = clone(rawSettings.shortcuts);
  }

  if (!MODE_PRESETS[merged.currentMode]) {
    merged.currentMode = 'work';
  }
  return merged;
}

function resolveTheme(theme) {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

function getCurrentMode() {
  return MODE_PRESETS[state.currentMode] ? state.currentMode : 'work';
}

function getCurrentModeShortcuts() {
  const mode = getCurrentMode();
  return settings.modeShortcuts?.[mode] || [];
}

function getCurrentModeTodos() {
  const mode = getCurrentMode();
  return settings.modeTodos?.[mode] || MODE_PRESETS[mode].todos;
}

function getCurrentModeSchedule() {
  const mode = getCurrentMode();
  return settings.modeSchedule?.[mode] || MODE_PRESETS[mode].schedule;
}

function getFunSettings() {
  return settings.funSettings || defaultSettings.funSettings;
}

function formatDate(date, withWeekday = false) {
  if (!(date instanceof Date)) return '';
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  if (!withWeekday) return `${yyyy}-${mm}-${dd}`;
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  return `${yyyy}-${mm}-${dd} ${weekday}`;
}

function applySettings() {
  const resolvedTheme = resolveTheme(settings.theme);
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  updateThemeIcon(resolvedTheme);
  updateThemeSelector(settings.theme);

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

  state.currentMode = settings.currentMode || 'work';
  document.body.dataset.mode = state.currentMode;
  renderModeSwitch();

  if (settings.preferredEngine) {
    selectEngine(settings.preferredEngine, false);
  }

  renderTodayCard();
  updateStatusBar();
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

  const inlineDate = document.getElementById('today-date-inline');
  if (inlineDate) {
    inlineDate.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
  }
}

function formatDuration(ms) {
  if (ms <= 0) return '已到时间';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

function getOffWorkCountdownText() {
  const fun = getFunSettings();
  const now = new Date();
  const [hourStr, minuteStr] = (fun.offWorkTime || '18:30').split(':');
  const hour = Number(hourStr) || 18;
  const minute = Number(minuteStr) || 30;

  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (now <= target) {
    return `还有 ${formatDuration(target - now)}`;
  }

  const tomorrow = new Date(target);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `已下班 · 距明天下班 ${formatDuration(tomorrow - now)}`;
}

function getDayProgressText() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const percent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  return `${percent}%`;
}

function getDefaultCnHolidays(year) {
  return [
    { date: `${year}-01-01`, localName: '元旦' },
    { date: `${year}-05-01`, localName: '劳动节' },
    { date: `${year}-10-01`, localName: '国庆节' }
  ];
}

async function getPublicHolidays(year, country = 'CN') {
  const key = `${country}-${year}`;
  if (holidayCache.has(key)) return holidayCache.get(key);

  let holidays = [];
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    if (!response.ok) throw new Error('holiday api failed');
    const json = await response.json();
    holidays = (Array.isArray(json) ? json : []).map(item => ({
      date: item.date,
      localName: item.localName || item.name || '节假日',
      name: item.name || item.localName || 'Holiday'
    }));
  } catch {
    if (country === 'CN') holidays = getDefaultCnHolidays(year);
  }

  holidayCache.set(key, holidays);
  return holidays;
}

async function getUpcomingHoliday() {
  const fun = getFunSettings();
  const country = fun.holidayCountry || 'CN';
  const today = new Date();
  const todayStr = formatDate(today);
  const candidates = [];

  const currentYearHolidays = await getPublicHolidays(today.getFullYear(), country);
  const nextYearHolidays = await getPublicHolidays(today.getFullYear() + 1, country);
  const all = [...currentYearHolidays, ...nextYearHolidays];

  for (const holiday of all) {
    if (holiday.date >= todayStr) {
      candidates.push({
        date: holiday.date,
        name: holiday.localName || holiday.name || '节假日',
        source: 'official'
      });
    }
  }

  if (fun.customHolidayDate) {
    const customDate = new Date(fun.customHolidayDate);
    if (!Number.isNaN(customDate.getTime()) && formatDate(customDate) >= todayStr) {
      candidates.push({
        date: formatDate(customDate),
        name: fun.customHolidayName || '自定义假期',
        source: 'custom'
      });
    }
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date));
  holidayState.upcoming = candidates[0] || null;
  return holidayState.upcoming;
}

async function renderTodayCard() {
  const list = document.getElementById('today-list');
  if (!list) return;

  const now = new Date();
  const nextHoliday = await getUpcomingHoliday();
  const holidayDate = nextHoliday ? new Date(nextHoliday.date) : null;
  if (holidayDate) holidayDate.setHours(0, 0, 0, 0);
  const holidayDiff = holidayDate ? holidayDate.getTime() - now.getTime() : null;
  const holidayCountdown = holidayDate
    ? (holidayDiff <= 0 && formatDate(holidayDate) === formatDate(now)
      ? '今天就是假期'
      : `还有 ${formatDuration(holidayDiff)}`)
    : '暂无假期数据';

  list.innerHTML = `
    <div class="info-row"><span>下班倒计时</span><span>${escapeHtml(getOffWorkCountdownText())}</span></div>
    <div class="info-row"><span>假期倒计时</span><span>${escapeHtml(holidayCountdown)}</span></div>
    <div class="info-row"><span>下个节假日</span><span>${escapeHtml(nextHoliday ? `${nextHoliday.name} (${nextHoliday.date})` : '暂无数据')}</span></div>
    <div class="info-row"><span>今日进度</span><span>${escapeHtml(getDayProgressText())}</span></div>
  `;
  updateStatusBar();
}

function updateStatusBar() {
  const weatherEl = document.getElementById('status-weather');
  const todosEl = document.getElementById('status-todos');
  const scheduleEl = document.getElementById('status-schedule');
  const upcoming = holidayState.upcoming;
  const holidayShort = upcoming ? `${upcoming.name} ${upcoming.date.slice(5)}` : '暂无数据';
  const offWorkShort = getOffWorkCountdownText()
    .replace('还有 ', '')
    .replace('已下班 · ', '');

  if (weatherEl) weatherEl.textContent = state.weather || '天气待更新';
  if (todosEl) todosEl.textContent = offWorkShort;
  if (scheduleEl) scheduleEl.textContent = holidayShort;
}

function renderModeSwitch() {
  document.querySelectorAll('#mode-switch .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
  });
}

async function setMode(mode, save = true) {
  if (!MODE_PRESETS[mode]) return;
  state.currentMode = mode;
  settings.currentMode = mode;
  document.body.dataset.mode = mode;
  renderModeSwitch();
  await loadShortcuts();
  await renderTodayCard();
  updateStatusBar();
  await loadAiSuggestions();
  if (save) await saveSettings();
}

async function updateWeather(force = false) {
  const now = Date.now();
  const cacheValid = now - weatherCache.ts < 30 * 60 * 1000;
  if (!force && cacheValid) {
    state.weather = weatherCache.text;
    renderTodayCard();
    updateStatusBar();
    return;
  }

  try {
    const weatherRes = await fetch('https://wttr.in/?format=j1');
    const weatherData = await weatherRes.json();
    const current = weatherData?.current_condition?.[0];
    const area = weatherData?.nearest_area?.[0]?.areaName?.[0]?.value;
    const desc = current?.weatherDesc?.[0]?.value || '未知';
    const temp = current?.temp_C ? `${current.temp_C}°C` : '';
    const label = [area, `${desc}${temp ? ` ${temp}` : ''}`].filter(Boolean).join(' · ');
    state.weather = label || '天气待更新';
  } catch {
    state.weather = '天气服务不可用';
  }

  weatherCache = { text: state.weather, ts: now };
  renderTodayCard();
  updateStatusBar();
}

async function loadAiSuggestions() {
  const list = document.getElementById('ai-suggest-list');
  if (!list) return;
  const suggestMeta = document.getElementById('ai-suggest-meta');
  const fun = getFunSettings();
  const limit = Math.min(20, Math.max(4, Number(fun.aiSuggestLimit) || 8));

  let items = [];
  if (typeof chrome !== 'undefined' && chrome.history) {
    try {
      const historyItems = await new Promise((resolve) => {
        chrome.history.search({
          text: '',
          startTime: Date.now() - 45 * 24 * 60 * 60 * 1000,
          maxResults: 800
        }, resolve);
      });

      const byHost = new Map();
      for (const item of historyItems) {
        if (!item.url || !/^https?:\/\//.test(item.url)) continue;
        const host = getHostname(item.url);
        const existing = byHost.get(host);
        if (!existing) {
          byHost.set(host, {
            title: item.title || host,
            url: item.url,
            host,
            visitCount: item.visitCount || 0,
            lastVisitTime: item.lastVisitTime || 0
          });
          continue;
        }

        const betterTitle = (item.title && item.title.length > existing.title.length) ? item.title : existing.title;
        byHost.set(host, {
          title: betterTitle,
          url: existing.visitCount >= (item.visitCount || 0) ? existing.url : item.url,
          host,
          visitCount: Math.max(existing.visitCount, item.visitCount || 0),
          lastVisitTime: Math.max(existing.lastVisitTime, item.lastVisitTime || 0)
        });
      }

      const merged = Array.from(byHost.values());
      const frequent = [...merged]
        .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
        .slice(0, limit)
        .map(item => ({
          ...item,
          badge: '高频',
          subtitle: `访问 ${item.visitCount || 1} 次 · ${item.host}`
        }));

      const recent = [...merged]
        .sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0))
        .slice(0, limit * 2)
        .map(item => ({
          ...item,
          badge: '最近',
          subtitle: `${formatRelativeTime(item.lastVisitTime)} · ${item.host}`
        }));

      const dedup = new Map();
      [...frequent, ...recent].forEach(item => {
        if (!dedup.has(item.host)) dedup.set(item.host, item);
      });
      items = Array.from(dedup.values()).slice(0, limit);
    } catch {
      items = [];
    }
  }

  if (items.length === 0) {
    const modeShortcuts = getCurrentModeShortcuts().slice(0, limit);
    items = modeShortcuts.map(item => ({
      title: item.title,
      subtitle: '常用入口',
      url: item.url,
      badge: '常用'
    }));
  }

  if (suggestMeta) suggestMeta.textContent = `高频 + 最近访问 · ${items.length} 条`;

  list.innerHTML = `
    <div class="ai-suggest-scroll">
      ${items.map(item => `
        <button class="ai-suggest-item" type="button" data-url="${escapeHtml(item.url)}">
          <span class="ai-suggest-chip">${escapeHtml(item.badge || '推荐')}</span>
          <span class="ai-suggest-title">${escapeHtml(item.title)}</span>
          <span class="ai-suggest-subtitle">${escapeHtml(item.subtitle)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function openHolidayCalendarModal() {
  document.getElementById('holiday-calendar-modal')?.classList.add('active');
  state.isHolidayCalendarOpen = true;
  renderHolidayCalendar();
}

function closeHolidayCalendarModal() {
  document.getElementById('holiday-calendar-modal')?.classList.remove('active');
  state.isHolidayCalendarOpen = false;
}

function shiftHolidayMonth(step) {
  holidayState.calendarMonth += step;
  if (holidayState.calendarMonth > 11) {
    holidayState.calendarMonth = 0;
    holidayState.calendarYear += 1;
  } else if (holidayState.calendarMonth < 0) {
    holidayState.calendarMonth = 11;
    holidayState.calendarYear -= 1;
  }
  renderHolidayCalendar();
}

async function renderHolidayCalendar() {
  const label = document.getElementById('holiday-month-label');
  const daysGrid = document.getElementById('holiday-calendar-days');
  const monthList = document.getElementById('holiday-month-holidays');
  if (!label || !daysGrid || !monthList) return;

  const year = holidayState.calendarYear;
  const month = holidayState.calendarMonth;
  label.textContent = `${year}年${month + 1}月`;

  const country = getFunSettings().holidayCountry || 'CN';
  const holidays = await getPublicHolidays(year, country);
  const monthHolidays = holidays.filter(h => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const holidayByDay = new Map(monthHolidays.map(h => [new Date(h.date).getDate(), h]));

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlank = (firstDay.getDay() + 6) % 7;
  const todayStr = formatDate(new Date());

  let html = '';
  for (let i = 0; i < leadingBlank; i++) {
    html += '<div class="holiday-day is-empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateKey = formatDate(dateObj);
    const isToday = dateKey === todayStr;
    const holiday = holidayByDay.get(day);
    const classes = ['holiday-day'];
    if (isToday) classes.push('is-today');
    if (holiday) classes.push('is-holiday');
    html += `
      <div class="${classes.join(' ')}" title="${holiday ? escapeHtml(holiday.localName || holiday.name) : ''}">
        <span>${day}</span>
        ${holiday ? '<i></i>' : ''}
      </div>
    `;
  }
  daysGrid.innerHTML = html;

  if (monthHolidays.length === 0) {
    monthList.innerHTML = '<div class="holiday-empty">本月暂无法定节假日</div>';
  } else {
    monthList.innerHTML = monthHolidays.map(h => `
      <div class="holiday-list-item">
        <span>${escapeHtml(h.localName || h.name || '节假日')}</span>
        <span>${escapeHtml(h.date)}</span>
      </div>
    `).join('');
  }
}

function syncFunSettingsInputs() {
  const fun = getFunSettings();
  const offWorkInput = document.getElementById('offwork-time-input');
  const holidayNameInput = document.getElementById('custom-holiday-name-input');
  const holidayDateInput = document.getElementById('custom-holiday-date-input');
  const holidayCountryInput = document.getElementById('holiday-country-input');
  const aiLimitInput = document.getElementById('ai-suggest-limit-input');

  if (offWorkInput) offWorkInput.value = fun.offWorkTime || '18:30';
  if (holidayNameInput) holidayNameInput.value = fun.customHolidayName || '';
  if (holidayDateInput) holidayDateInput.value = fun.customHolidayDate || '';
  if (holidayCountryInput) holidayCountryInput.value = fun.holidayCountry || 'CN';
  if (aiLimitInput) aiLimitInput.value = String(fun.aiSuggestLimit || 8);
}

async function saveFunSettingsFromPanel() {
  const offWorkInput = document.getElementById('offwork-time-input');
  const holidayNameInput = document.getElementById('custom-holiday-name-input');
  const holidayDateInput = document.getElementById('custom-holiday-date-input');
  const holidayCountryInput = document.getElementById('holiday-country-input');
  const aiLimitInput = document.getElementById('ai-suggest-limit-input');

  settings.funSettings = settings.funSettings || { ...defaultSettings.funSettings };
  settings.funSettings.offWorkTime = offWorkInput?.value || '18:30';
  settings.funSettings.customHolidayName = holidayNameInput?.value?.trim() || '下一次假期';
  settings.funSettings.customHolidayDate = holidayDateInput?.value || '';
  settings.funSettings.holidayCountry = holidayCountryInput?.value || 'CN';
  settings.funSettings.aiSuggestLimit = Math.min(20, Math.max(4, Number(aiLimitInput?.value || 8)));
  holidayCache = new Map();

  await saveSettings();
  await renderTodayCard();
  await loadAiSuggestions();
  await renderHolidayCalendar();
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
async function collectShortcutRecency(shortcuts) {
  shortcutRecentMap = new Map();
  if (typeof chrome === 'undefined' || !chrome.history) return;

  await Promise.all(shortcuts.map(shortcut => new Promise((resolve) => {
    chrome.history.getVisits({ url: shortcut.url }, (visits) => {
      const latest = visits?.[0]?.visitTime;
      shortcutRecentMap.set(shortcut.url, latest ? formatRelativeTime(latest) : '首次使用');
      resolve();
    });
  })));
}

async function loadShortcuts() {
  const grid = document.getElementById('shortcuts-grid');
  const shortcuts = getCurrentModeShortcuts();

  await collectShortcutRecency(shortcuts);

  grid.innerHTML = shortcuts.map(s => `
    <a class="apple-shortcut" href="${escapeHtml(s.url)}" target="_blank" rel="noopener"
      title="${escapeHtml(s.title)} · ${escapeHtml(shortcutRecentMap.get(s.url) || '最近未访问')}">
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
  syncFunSettingsInputs();
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

async function saveShortcut() {
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

  const mode = getCurrentMode();
  settings.modeShortcuts[mode] = settings.modeShortcuts[mode] || [];
  settings.modeShortcuts[mode].push({ title: name, url, icon: null });
  await saveSettings();
  await loadShortcuts();
  closeAddShortcutModal();
  showToast(`已添加到 ${MODE_PRESETS[mode].label} 模式（已保存）`, 'success');
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

function focusCommandBar(selectAll = false) {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  searchInput.focus();
  if (selectAll) searchInput.select();
}

// --- 事件绑定 ---
function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const suggestionsEl = document.getElementById('search-suggestions');
  const engineBtn = document.getElementById('engine-btn');
  const enginePopover = document.getElementById('engine-popover');
  const aiSuggestList = document.getElementById('ai-suggest-list');
  const commandKbd = document.querySelector('.apple-command-kbd');
  const openHolidayBtn = document.getElementById('open-holiday-calendar-btn');
  const editFunBtn = document.getElementById('edit-fun-settings-btn');
  const holidayModal = document.getElementById('holiday-calendar-modal');

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

  commandKbd?.addEventListener('click', () => focusCommandBar(true));

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

  // 模式切换
  document.querySelectorAll('#mode-switch .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
    });
  });

  // AI 推荐点击
  aiSuggestList?.addEventListener('click', (e) => {
    const item = e.target.closest('.ai-suggest-item[data-url]');
    if (!item) return;
    window.location.href = item.dataset.url;
  });
  aiSuggestList?.addEventListener('wheel', (e) => {
    const track = aiSuggestList.querySelector('.ai-suggest-scroll');
    if (!track) return;
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    track.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  // 趣味卡片按钮
  openHolidayBtn?.addEventListener('click', openHolidayCalendarModal);
  editFunBtn?.addEventListener('click', () => {
    openSettingsModal();
    document.getElementById('offwork-time-input')?.focus();
  });

  // 节假日日历弹窗
  document.getElementById('holiday-calendar-close')?.addEventListener('click', closeHolidayCalendarModal);
  document.getElementById('holiday-prev-btn')?.addEventListener('click', () => shiftHolidayMonth(-1));
  document.getElementById('holiday-next-btn')?.addEventListener('click', () => shiftHolidayMonth(1));
  holidayModal?.addEventListener('click', (e) => {
    if (e.target.id === 'holiday-calendar-modal') closeHolidayCalendarModal();
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
    opt.addEventListener('click', async () => {
      settings.theme = opt.dataset.theme;
      await saveSettings();
      applySettings();
    });
  });

  // 主题色选择
  document.querySelectorAll('#accent-colors .apple-accent-color').forEach(opt => {
    opt.addEventListener('click', async () => {
      settings.accentColor = opt.dataset.color;
      await saveSettings();
      applySettings();
    });
  });

  // 趣味设置
  ['offwork-time-input', 'custom-holiday-name-input', 'custom-holiday-date-input', 'holiday-country-input', 'ai-suggest-limit-input']
    .forEach(id => {
      const node = document.getElementById(id);
      if (!node) return;
      node.addEventListener('change', saveFunSettingsFromPanel);
    });
  document.getElementById('open-calendar-from-settings')?.addEventListener('click', openHolidayCalendarModal);

  // 设置面板按钮
  document.getElementById('export-btn').addEventListener('click', exportBookmarks);
  document.getElementById('import-btn').addEventListener('click', importBookmarks);

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('确定要重置所有设置吗？')) {
      settings = normalizeSettings(defaultSettings);
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

  // 全局键盘
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && key === 'k') {
      e.preventDefault();
      focusCommandBar(true);
      return;
    }

    if (e.key === 'Escape') {
      if (state.isSettingsOpen) closeSettingsModal();
      if (state.isAddShortcutOpen) closeAddShortcutModal();
      if (state.isHolidayCalendarOpen) closeHolidayCalendarModal();
      return;
    }

    if (state.isSettingsOpen || state.isAddShortcutOpen) return;
    if (isTextInputElement(document.activeElement)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return;

    e.preventDefault();
    focusCommandBar();
    searchInput.value = e.key;
    state.searchQuery = e.key;
    updateSuggestions(e.key);
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  });

  // 搜索框双击全选，强化命令中心感
  searchInput.addEventListener('dblclick', () => {
    searchInput.select();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'auto') {
      applySettings();
    }
  });
}

// --- 初始化 ---
async function init() {
  await loadSettings();
  syncFunSettingsInputs();

  updateClock();
  setInterval(updateClock, 1000);
  setInterval(() => renderTodayCard(), 60 * 1000);
  updateWeather(true);
  setInterval(() => updateWeather(false), 30 * 60 * 1000);

  await loadShortcuts();
  loadPinnedBookmarks();
  await loadAiSuggestions();
  await renderTodayCard();
  renderHolidayCalendar();
  updateStatusBar();
  initEventListeners();


  setTimeout(() => {
    focusCommandBar();
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
  let html = items.map((b) => {
    const hostname = getHostname(b.url);
    const favicon = getFaviconUrl(b.url);
    const title = b.title || hostname;
    const shortTitle = title.length > 8 ? title.slice(0, 7) + '…' : title;
    const pinnedClass = b.isPinned ? 'pinned' : '';
    const letter = (title[0] || '?').toUpperCase();
    const color = ICON_COLORS[letter.charCodeAt(0) % ICON_COLORS.length];
    const meta = formatRelativeTime(b.dateAdded || b.dateGroupModified);

    return `
      <div class="bm-icon-item ${pinnedClass}" data-id="${b.id}" data-url="${escapeHtml(b.url)}" title="${escapeHtml(title)}">
        <div class="bm-icon-wrap" style="--fallback-bg:${color}">
          <img src="${favicon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="bm-letter" style="display:none;background:${color};width:100%;height:100%;align-items:center;justify-content:center">${letter}</span>
        </div>
        <span class="bm-icon-label">${escapeHtml(shortTitle)}</span>
        <span class="bm-icon-meta">${escapeHtml(meta)}</span>
        <span class="bm-pin-dot"></span>
        <div class="bm-actions">
          <button class="bm-pin-action" data-pin-id="${b.id}" title="${b.isPinned ? '取消置顶' : '置顶'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
            </svg>
          </button>
          <button class="bm-edit-action" data-edit-id="${b.id}" title="编辑">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" width="12" height="12">
              <path d="M12 20h9"></path>
              <path d="m16.5 3.5 4 4L8 20H4v-4z"></path>
            </svg>
          </button>
          <button class="bm-delete-action" data-delete-id="${b.id}" title="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" width="12" height="12">
              <path d="M3 6h18"></path>
              <path d="M8 6V4h8v2"></path>
              <path d="m19 6-1 14H6L5 6"></path>
            </svg>
          </button>
        </div>
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
      if (e.target.closest('.bm-actions')) return;
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

  // Bind edit buttons
  grid.querySelectorAll('.bm-edit-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editBookmark(btn.dataset.editId);
    });
  });

  // Bind delete buttons
  grid.querySelectorAll('.bm-delete-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBookmark(btn.dataset.deleteId);
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

async function editBookmark(bookmarkId) {
  if (typeof chrome === 'undefined' || !chrome.bookmarks) return;
  const current = allFlatBookmarks.find(item => item.id === bookmarkId);
  if (!current) return;

  const nextTitle = prompt('编辑标题', current.title || '');
  if (nextTitle === null) return;
  const nextUrl = prompt('编辑网址', current.url || '');
  if (nextUrl === null) return;

  const title = nextTitle.trim();
  const url = nextUrl.trim();
  if (!title || !url) {
    showToast('标题和网址不能为空', 'error');
    return;
  }

  try {
    new URL(url);
  } catch {
    showToast('网址格式不正确', 'error');
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      chrome.bookmarks.update(bookmarkId, { title, url }, (result) => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result);
      });
    });
    showToast('书签已更新', 'success');
    await loadPinnedBookmarks();
  } catch (error) {
    console.error('Failed to update bookmark:', error);
    showToast('更新失败', 'error');
  }
}

async function removeBookmark(bookmarkId) {
  if (typeof chrome === 'undefined' || !chrome.bookmarks) return;
  const current = allFlatBookmarks.find(item => item.id === bookmarkId);
  if (!current) return;

  const ok = confirm(`确认删除「${current.title || getHostname(current.url)}」？`);
  if (!ok) return;

  try {
    await new Promise((resolve, reject) => {
      chrome.bookmarks.remove(bookmarkId, () => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });

    pinnedBookmarkIds = pinnedBookmarkIds.filter(id => id !== bookmarkId);
    pinnedOrder = pinnedOrder.filter(id => id !== bookmarkId);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ pinnedBookmarks: pinnedBookmarkIds, pinnedOrder });
    }

    showToast('已删除书签', 'default');
    await loadPinnedBookmarks();
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
    showToast('删除失败', 'error');
  }
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
