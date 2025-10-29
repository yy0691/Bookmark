// pages/newtab/newtab.js
// MV3-compliant: no inline scripts. This file orchestrates page interactions.

import { BookmarkService } from '../../modules/bookmarkService.js';
import { VisualizationService } from '../../modules/visualizationService.js';
import { SettingsPanel } from '../../components/UI/SettingsPanel.js';

const bookmarkService = new BookmarkService();
const visualizationService = new VisualizationService();
const settingsPanel = new SettingsPanel();

const folderListEl = document.getElementById('folder-list');
const bookmarksGridEl = document.getElementById('bookmarks-grid');
const tagsContainerEl = document.getElementById('tags-container');
const contextMenu = document.getElementById('context-menu');

let currentBookmarks = [];
let allBookmarks = []; // Cache all bookmarks for tag filtering
let currentView = 'grid'; // 'grid' or 'list'
let activeTags = new Set(); // Currently selected tags
let contextMenuTarget = null; // Currently right-clicked bookmark

// Initialize settings panel and get current settings
let settings = settingsPanel.getSettings();

// Analysis state management
let analysisState = {
  isProcessing: false,
  sessionId: null,
  currentBatch: 0,
  totalBatches: 0,
  results: {},
  startTime: null
};

// SVG图标系统 - 替代Lucide图标库
const icons = {
  'chevron-right': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"></polyline></svg>',
  'chevron-down': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"></polyline></svg>',
  'folder': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  'bookmark': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>',
  'tag': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
  'brain': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path><path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path><path d="M19.938 10.5a4 4 0 0 1 .585.396"></path><path d="M6 18a4 4 0 0 1-1.967-.516"></path><path d="M19.967 17.484A4 4 0 0 1 18 18"></path></svg>',
  'bar-chart': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
  'bar-chart-3': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
  'sticky-note': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path><path d="M15 3v5l5-5"></path></svg>',
  'settings': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  'grid': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  'list': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  'search': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
  'x': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  'download': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  'upload': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17,8 12,3 7,8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
  'external-link': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
  'trash-2': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2 2 0 0 1-2,2H7a2 2 0 0 1-2-2V6m3,0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  'edit': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
  'copy': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  'refresh-cw': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23,4 23,10 17,10"></polyline><polyline points="1,20 1,14 7,14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>',
  'file-text': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
  'scan': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>',
  'zap': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon></svg>',
  'folder-x': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9.5" y1="10.5" x2="14.5" y2="15.5"></line><line x1="14.5" y1="10.5" x2="9.5" y2="15.5"></line></svg>',
  'link': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>',
  'rotate-ccw': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,4 1,10 7,10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
  'user': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  'clock': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>',
  'layout-grid': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  'link-off': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" y1="11" x2="16" y2="11"></line><line x1="22" y1="2" x2="2" y2="22"></line></svg>',
  'folder-minus': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg>',
  'bar-chart-3': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
  'plus-square': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
  'moon': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  'sun': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  'monitor': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
  'folder-open': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M2 7h20"></path></svg>',
  'pin': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>',
  'folder-tree': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path><path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path><path d="M3 5a2 2 0 0 0 2 2h3"></path><path d="M3 3v13a2 2 0 0 0 2 2h3"></path></svg>'
};

function initIcons() {
  // 替换所有data-lucide属性的元素为内联SVG
  document.querySelectorAll('[data-lucide]').forEach(element => {
    const iconName = element.getAttribute('data-lucide');
    if (icons[iconName]) {
      element.innerHTML = icons[iconName];
      element.removeAttribute('data-lucide');
      console.log(`✅ 图标初始化成功: ${iconName}`);
    } else {
      console.warn(`⚠️ 图标定义缺失: ${iconName}`);
      // 提供一个默认的图标作为回退
      element.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      element.removeAttribute('data-lucide');
    }
  });
}

// Update folder toggle icon based on expanded state
function updateFolderToggleIcon(folderItem) {
  const toggleIcon = folderItem.querySelector('.folder-toggle-icon');
  if (toggleIcon) {
    const isExpanded = folderItem.classList.contains('expanded');
    toggleIcon.innerHTML = isExpanded ? icons['chevron-down'] : icons['chevron-right'];
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: '2-digit',
  });
}

function updateClock() {
  const now = new Date();
  const t = formatTime(now);
  const d = formatDate(now);
  const small = document.getElementById('current-time');
  const large = document.getElementById('current-time-large');
  const dateEl = document.getElementById('current-date');
  if (small) small.textContent = t;
  if (large) large.textContent = t;
  if (dateEl) dateEl.textContent = d;
}

// Extract tags from bookmark title
function extractTags(title) {
  const tagRegex = /^\[([^\]]+)\]/g;
  const tags = [];
  let match;
  while ((match = tagRegex.exec(title || '')) !== null) {
    tags.push(match[1]);
  }
  return tags;
}

// Favicon service for automatic icon detection
const faviconService = {
  cache: new Map(),
  
  // Get favicon URL for a given website URL
  getFaviconUrl(url) {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Check cache first
      if (this.cache.has(domain)) {
        return this.cache.get(domain);
      }
      
          // 渐进式尝试多个favicon源
      const tryFaviconSource = async (url) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) return url;
          return null;
        } catch {
          return null;
        }
      };

      // 按优先级排序的图标源
      const faviconSources = [
        `https://${domain}/favicon.ico`,
        `https://${domain}/favicon.png`,
        `https://${domain}/apple-touch-icon.png`,
        `https://${domain}/apple-touch-icon-precomposed.png`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`
      ];
      
      // 尝试第一个可用的图标源
      return new Promise(async (resolve) => {
        for (const source of faviconSources) {
          const result = await tryFaviconSource(source);
          if (result) {
            this.cache.set(domain, result);
            resolve(result);
            return;
          }
        }
        
        // 如果所有源都失败，使用 DuckDuckGo 的服务作为最后的备选
        const duckduckgoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        this.cache.set(domain, duckduckgoUrl);
        resolve(duckduckgoUrl);
      });
      
      // 如果所有源都失败,使用 DuckDuckGo 的服务作为最后的备选
      const duckduckgoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      this.cache.set(domain, duckduckgoUrl);
      return duckduckgoUrl;
    } catch (error) {
      console.warn('Failed to get favicon for URL:', url, error);
      return null;
    }
  },
  
  // Create favicon element with fallback
  createFaviconElement(url, title = '') {
    const favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.loading = 'lazy';
    favicon.alt = title || 'Website icon';
    
    const faviconUrl = this.getFaviconUrl(url);
    if (faviconUrl) {
      favicon.src = faviconUrl;
      
      // Fallback to generic icon if favicon fails to load
      // 添加加载状态指示
      favicon.classList.add('loading');
      
      // 错误处理和降级策略
      let retryCount = 0;
      const maxRetries = 2;
      
      favicon.onerror = async () => {
        retryCount++;
        favicon.classList.remove('loading');
        
        if (retryCount <= maxRetries) {
          // 重试使用 DuckDuckGo 的服务
          const domain = new URL(url).hostname;
          favicon.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        } else {
          // 使用本地备用图标
          favicon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48cGF0aCBkPSJNMTIgMmE5LjkgOS45IDAgMCAxIDggOHY0YTkuOSA5LjkgMCAwIDEtOCA4IDkuOSA5LjkgMCAwIDEtOC04di00YTkuOSA5LjkgMCAwIDEgOC04eiIvPjwvc3ZnPg==';
          favicon.classList.add('fallback');
          favicon.onerror = null; // 防止无限循环
        }
      };
    } else {
      // Use generic icon as fallback
      favicon.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSIjNjM2NjcwIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxMy43OTA5IDI0IDEyIDIyLjIwOTEgMTIgMjBIMjBDMjAgMjIuMjA5MSAxOC4yMDkxIDI0IDE2IDI0WiIgZmlsbD0iIzYzNjY3MCIvPgo8L3N2Zz4K';
    }
    
    return favicon;
  },
  
  // Preload favicons for better performance
  preloadFavicons(bookmarks) {
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        this.getFaviconUrl(bookmark.url);
      }
    });
  }
};

// Filter bookmarks by active tags
function filterBookmarksByTags(bookmarks) {
  if (activeTags.size === 0) return bookmarks;
  
  return bookmarks.filter(bookmark => {
    const bookmarkTags = extractTags(bookmark.title);
    return Array.from(activeTags).every(activeTag => 
      bookmarkTags.includes(activeTag)
    );
  });
}

async function loadAndRenderBookmarks(folderId) {
  bookmarksGridEl.innerHTML = '<div class="loading-spinner"></div>';
  let bookmarks = [];
  
  if (folderId) {
    const children = await new Promise(resolve => chrome.bookmarks.getChildren(folderId, resolve));
    bookmarks = children.filter(item => item.url);
  } else {
    bookmarks = await bookmarkService.getRecent(100);
  }
  
  // Get pinned bookmarks
  const pinnedBookmarks = await getPinnedBookmarks();
  const pinnedIds = new Set(pinnedBookmarks.map(b => b.id));
  
  // Separate pinned and unpinned bookmarks
  const unpinnedBookmarks = bookmarks.filter(b => !pinnedIds.has(b.id));
  
  // Combine: pinned first, then unpinned
  const allBookmarks = [...pinnedBookmarks, ...unpinnedBookmarks];
  
  // Apply tag filtering
  const filteredBookmarks = filterBookmarksByTags(allBookmarks);
  currentBookmarks = filteredBookmarks;
  
  // Mark pinned bookmarks for rendering
  currentBookmarks.forEach(bookmark => {
    bookmark.isPinned = pinnedIds.has(bookmark.id);
  });
  
  visualizationService.renderBookmarks(bookmarksGridEl, currentBookmarks, currentView);
}

function renderFolderNode(node) {
  if (!node.children) return null;

  const folderCount = node.children.filter(child => !child.url).length;
  const bookmarkCount = node.children.filter(child => child.url).length;

  // Skip empty folders except for root nodes
  if (bookmarkCount === 0 && folderCount === 0 && node.id !== '0' && node.id !== '1' && node.id !== '2') return null;

  const li = document.createElement('li');
  li.className = 'folder-item';
  li.dataset.folderId = node.id;

  const content = document.createElement('div');
  content.className = 'folder-content';
  let toggleIcon = '';
  if (folderCount > 0) {
    toggleIcon = '<i data-lucide="chevron-right" class="folder-toggle-icon"></i>';
  }

  content.innerHTML = `
    ${toggleIcon}
    <i data-lucide="folder" class="folder-icon"></i>
    <span class="folder-name">${node.title || '书签栏'}</span>
    <span class="bookmark-count">${bookmarkCount}</span>
  `;
  li.appendChild(content);

  if (folderCount > 0) {
    const subList = document.createElement('ul');
    subList.className = 'sub-folder-list';
    node.children.forEach(child => {
      if (!child.url) { // It's a folder
        const childLi = renderFolderNode(child);
        if (childLi) subList.appendChild(childLi);
      }
    });
    if (subList.hasChildNodes()) {
        li.appendChild(subList);
    }
  }

  return li;
}

async function loadAndRenderFolders() {
  console.log('Loading folders...');
  const [tree] = await bookmarkService.getTree();
  console.log('Bookmark tree:', tree);
  
  folderListEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  // Chrome书签树结构：根节点 -> 书签栏、其他书签等
  if (tree && tree.children) {
    console.log('Found', tree.children.length, 'root folders');
    tree.children.forEach(rootFolder => {
      console.log('Processing folder:', rootFolder.title, 'ID:', rootFolder.id);
      const folderNode = renderFolderNode(rootFolder);
      if (folderNode) {
        fragment.appendChild(folderNode);
        console.log('Added folder node for:', rootFolder.title);
      } else {
        console.log('Skipped folder node for:', rootFolder.title);
      }
    });
  } else {
    console.log('No tree or children found');
  }
  
  folderListEl.appendChild(fragment);
  console.log('Folders rendered, total nodes:', fragment.childNodes.length);
  initIcons(); // Re-initialize icons for newly added elements
}

// Load and render tags
async function loadAndRenderTags() {
  // Get all bookmarks to extract tags
  allBookmarks = await bookmarkService.getAllBookmarks();
  
  // Extract all tags and count them
  const tagCounts = new Map();
  allBookmarks.forEach(bookmark => {
    const tags = extractTags(bookmark.title);
    tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  // Sort tags by count (descending)
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  // Render tags
  const fragment = document.createDocumentFragment();
  sortedTags.forEach(([tag, count]) => {
    const tagEl = document.createElement('div');
    tagEl.className = 'filter-tag';
    tagEl.dataset.tag = tag;
    tagEl.innerHTML = `${tag}<span class="tag-count">${count}</span>`;
    fragment.appendChild(tagEl);
  });
  
  tagsContainerEl.innerHTML = '';
  tagsContainerEl.appendChild(fragment);
  
  console.log('Tags rendered:', sortedTags.length);
}

// Show context menu
async function showContextMenu(e, bookmarkData) {
  e.preventDefault();
  contextMenuTarget = bookmarkData;
  
  // Check if bookmark is pinned and update menu item
  const pinnedBookmarks = await getPinnedBookmarks();
  const isPinned = pinnedBookmarks.some(b => b.id === bookmarkData.id);
  const pinMenuItem = document.getElementById('pin-menu-item');
  if (pinMenuItem) {
    const pinText = pinMenuItem.querySelector('span');
    if (pinText) {
      pinText.textContent = isPinned ? '取消置顶' : '置顶';
    }
  }
  
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.classList.remove('hidden');
  
  // Adjust position if menu goes off screen
  const rect = contextMenu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (rect.right > viewportWidth) {
    contextMenu.style.left = `${e.clientX - rect.width}px`;
  }
  if (rect.bottom > viewportHeight) {
    contextMenu.style.top = `${e.clientY - rect.height}px`;
  }
}

// Hide context menu
function hideContextMenu() {
  contextMenu.classList.add('hidden');
  contextMenuTarget = null;
}

// Handle context menu actions
async function handleContextMenuAction(action) {
  if (!contextMenuTarget) return;
  
  const bookmark = contextMenuTarget;
  
  switch (action) {
    case 'open':
      window.open(bookmark.url, '_self');
      break;
      
    case 'open-new-tab':
      window.open(bookmark.url, '_blank');
      break;
      
    case 'pin':
      await togglePinBookmark(bookmark);
      await loadAndRenderBookmarks(); // Refresh bookmark list
      break;
      
    case 'copy-url':
      try {
        await navigator.clipboard.writeText(bookmark.url);
        // Show temporary success message
        const statusEl = document.getElementById('notes-status');
        if (statusEl) {
          const originalText = statusEl.textContent;
          statusEl.textContent = 'URL Copied!';
          statusEl.style.color = 'var(--accent-green)';
          setTimeout(() => {
            statusEl.textContent = originalText;
            statusEl.style.color = 'var(--accent-green)';
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
      break;
      
    case 'edit':
      const newTitle = prompt('Edit bookmark title:', bookmark.title);
      if (newTitle && newTitle !== bookmark.title) {
        chrome.bookmarks.update(bookmark.id, { title: newTitle });
      }
      break;
      
    case 'delete':
      if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
        chrome.bookmarks.remove(bookmark.id);
      }
      break;
  }
  
  hideContextMenu();
}

// AI Tools functionality
function updateAIStatus(status, className = '') {
  const statusEl = document.getElementById('ai-status');
  const statusText = statusEl?.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = status;
    statusText.className = `status-text ${className}`;
  }
}

// Analysis progress management
async function saveAnalysisProgress() {
  if (!analysisState.sessionId) return;
  
  const progressData = {
    sessionId: analysisState.sessionId,
    timestamp: Date.now(),
    currentBatch: analysisState.currentBatch,
    totalBatches: analysisState.totalBatches,
    results: analysisState.results,
    startTime: analysisState.startTime
  };
  
  try {
    await chrome.storage.local.set({ workbenchAnalysisProgress: progressData });
    console.log('Analysis progress saved');
  } catch (error) {
    console.error('Failed to save analysis progress:', error);
  }
}

async function loadAnalysisProgress() {
  try {
    const result = await chrome.storage.local.get(['workbenchAnalysisProgress']);
    if (result.workbenchAnalysisProgress) {
      const progress = result.workbenchAnalysisProgress;
      
      // Check if progress is within 24 hours
      const hoursSinceLastSave = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
      if (hoursSinceLastSave > 24) {
        await clearAnalysisProgress();
        return null;
      }
      
      return progress;
    }
  } catch (error) {
    console.error('Failed to load analysis progress:', error);
  }
  return null;
}

async function clearAnalysisProgress() {
  try {
    await chrome.storage.local.remove(['workbenchAnalysisProgress']);
    analysisState = {
      isProcessing: false,
      sessionId: null,
      currentBatch: 0,
      totalBatches: 0,
      results: {},
      startTime: null
    };
  } catch (error) {
    console.error('Failed to clear analysis progress:', error);
  }
}

function cancelAnalysis() {
  if (analysisState.isProcessing) {
    analysisState.isProcessing = false;
    saveAnalysisProgress();
    updateAIStatus('Analysis cancelled, progress saved', 'warning');
    
    // Reset button state
    const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
    if (analyzeBtn) {
      analyzeBtn.innerHTML = '<i data-lucide="zap"></i><span>Smart Analysis</span>';
      analyzeBtn.disabled = false;
    }
  }
}

async function analyzeBookmarks() {
  // Check if analysis is already running
  if (analysisState.isProcessing) {
    cancelAnalysis();
    return;
  }
  
  try {
    // Check for saved progress
    const savedProgress = await loadAnalysisProgress();
    let shouldResume = false;
    
    if (savedProgress) {
      const resumeConfirm = confirm(
        `Found incomplete analysis progress:\n` +
        `Processed: ${savedProgress.currentBatch}/${savedProgress.totalBatches} batches\n` +
        `Saved: ${new Date(savedProgress.timestamp).toLocaleString()}\n\n` +
        `Continue previous analysis?`
      );
      
      if (resumeConfirm) {
        shouldResume = true;
        analysisState = { ...savedProgress, isProcessing: true };
        updateAIStatus(`Resuming analysis... (${savedProgress.currentBatch}/${savedProgress.totalBatches})`, 'processing');
      } else {
        await clearAnalysisProgress();
      }
    }
    
    if (!shouldResume) {
      // Start new analysis
      updateAIStatus('Starting analysis...', 'processing');
      
      const bookmarks = await bookmarkService.getAllBookmarks();
      
      if (bookmarks.length === 0) {
        updateAIStatus('No bookmarks to analyze', 'error');
        return;
      }
      
      analysisState = {
        isProcessing: true,
        sessionId: Date.now().toString(),
        currentBatch: 0,
        totalBatches: Math.ceil(bookmarks.length / 50),
        results: {},
        startTime: Date.now()
      };
    }
    
    // Update button to show cancel option
    const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
    if (analyzeBtn) {
      analyzeBtn.innerHTML = '<i data-lucide="square"></i><span>Cancel Analysis</span>';
      analyzeBtn.disabled = false;
    }
    
    // 打开智能分析中心页面（带恢复能力）
    const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
    window.open(analysisUrl, '_blank');
    
    updateAIStatus('Analysis page opened with resume capability', 'success');
    
    // Reset state after opening
    setTimeout(() => {
      analysisState.isProcessing = false;
      updateAIStatus('Ready');
      if (analyzeBtn) {
        analyzeBtn.innerHTML = '<i data-lucide="zap"></i><span>Smart Analysis</span>';
      }
    }, 3000);
    
  } catch (error) {
    console.error('Analysis failed:', error);
    updateAIStatus('Analysis failed', 'error');
    analysisState.isProcessing = false;
    
    const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
    if (analyzeBtn) {
      analyzeBtn.innerHTML = '<i data-lucide="zap"></i><span>Smart Analysis</span>';
    }
    
    setTimeout(() => updateAIStatus('Ready'), 3000);
  }
}

async function detectDuplicates() {
  updateAIStatus('Detecting duplicates...', 'processing');
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const duplicates = new Map();
    const duplicateGroups = [];
    
    // Group bookmarks by URL
    bookmarks.forEach(bookmark => {
      if (duplicates.has(bookmark.url)) {
        duplicates.get(bookmark.url).push(bookmark);
      } else {
        duplicates.set(bookmark.url, [bookmark]);
      }
    });
    
    // Find groups with more than one bookmark
    duplicates.forEach((group, url) => {
      if (group.length > 1) {
        duplicateGroups.push({ url, bookmarks: group });
      }
    });
    
    if (duplicateGroups.length === 0) {
      updateAIStatus('No duplicates found', 'success');
    } else {
      updateAIStatus(`Found ${duplicateGroups.length} duplicate groups`, 'success');
      
      // Show confirmation dialog for cleanup
      const shouldClean = confirm(`Found ${duplicateGroups.length} groups of duplicate bookmarks. Would you like to open the bookmark manager to review them?`);
      if (shouldClean) {
        const managerUrl = chrome.runtime.getURL('bookmark-manager.html');
        window.open(managerUrl, '_blank');
      }
    }
    
    setTimeout(() => updateAIStatus('Ready'), 3000);
    
  } catch (error) {
    console.error('Duplicate detection failed:', error);
    updateAIStatus('Detection failed', 'error');
    setTimeout(() => updateAIStatus('Ready'), 3000);
  }
}

async function checkBrokenLinks() {
  updateAIStatus('Checking links...', 'processing');
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    let brokenCount = 0;
    let checkedCount = 0;
    
    // Check links in batches to avoid overwhelming the browser
    const batchSize = 10;
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (bookmark) => {
        try {
          const response = await fetch(bookmark.url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          });
          checkedCount++;
        } catch (error) {
          brokenCount++;
          checkedCount++;
        }
      }));
      
      updateAIStatus(`Checked ${checkedCount}/${bookmarks.length} links...`, 'processing');
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (brokenCount === 0) {
      updateAIStatus('All links are working', 'success');
    } else {
      updateAIStatus(`Found ${brokenCount} broken links`, 'success');
      
      const shouldOpen = confirm(`Found ${brokenCount} potentially broken links. Would you like to open the bookmark manager to review them?`);
      if (shouldOpen) {
        const managerUrl = chrome.runtime.getURL('bookmark-manager.html');
        window.open(managerUrl, '_blank');
      }
    }
    
    setTimeout(() => updateAIStatus('Ready'), 3000);
    
  } catch (error) {
    console.error('Link checking failed:', error);
    updateAIStatus('Link check failed', 'error');
    setTimeout(() => updateAIStatus('Ready'), 3000);
  }
}

async function cleanEmptyFolders() {
  updateAIStatus('Cleaning folders...', 'processing');
  
  try {
    const [tree] = await bookmarkService.getTree();
    const emptyFolders = [];
    
    function findEmptyFolders(node) {
      if (!node.children) return;
      
      // Check if folder is empty (no bookmarks and no non-empty subfolders)
      const hasBookmarks = node.children.some(child => child.url);
      const hasNonEmptySubfolders = node.children.some(child => 
        !child.url && child.children && child.children.length > 0
      );
      
      if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0) {
        emptyFolders.push(node);
      }
      
      // Recursively check subfolders
      node.children.forEach(child => {
        if (!child.url) {
          findEmptyFolders(child);
        }
      });
    }
    
    if (tree && tree.children) {
      tree.children.forEach(rootFolder => findEmptyFolders(rootFolder));
    }
    
    if (emptyFolders.length === 0) {
      updateAIStatus('No empty folders found', 'success');
    } else {
      updateAIStatus(`Found ${emptyFolders.length} empty folders`, 'success');
      
      const shouldClean = confirm(`Found ${emptyFolders.length} empty folders. Would you like to delete them?`);
      if (shouldClean) {
        let deletedCount = 0;
        for (const folder of emptyFolders) {
          try {
            await new Promise(resolve => chrome.bookmarks.remove(folder.id, resolve));
            deletedCount++;
          } catch (error) {
            console.error('Failed to delete folder:', folder.title, error);
          }
        }
        updateAIStatus(`Deleted ${deletedCount} empty folders`, 'success');
      }
    }
    
    setTimeout(() => updateAIStatus('Ready'), 3000);
    
  } catch (error) {
    console.error('Folder cleaning failed:', error);
    updateAIStatus('Cleaning failed', 'error');
    setTimeout(() => updateAIStatus('Ready'), 3000);
  }
}

// Theme management functions
function applyTheme(theme) {
  const body = document.body;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  
  body.setAttribute('data-theme', theme);
  currentTheme = theme;
}

function applyAccentColor(color) {
  document.body.setAttribute('data-accent', color);
  currentAccent = color;
}

function loadSettings() {
  chrome.storage?.local.get(['userSettings'], ({ userSettings }) => {
    if (userSettings) {
      settings = { ...settings, ...userSettings };
    }
    
    // Apply loaded settings
    applyTheme(settings.theme);
    applyAccentColor(settings.accentColor);
    
    // Update UI elements with loaded settings
    document.getElementById('recent-count').value = settings.recentCount;
    document.getElementById('auto-refresh').checked = settings.autoRefresh;
    document.getElementById('show-favicons').checked = settings.showFavicons;
    document.getElementById('group-by-domain').checked = settings.groupByDomain;
    document.getElementById('default-view').value = settings.defaultView;
    document.getElementById('blur-intensity').value = settings.blurIntensity;
    document.getElementById('opacity-level').value = settings.opacityLevel;
    document.getElementById('enable-animations').checked = settings.enableAnimations;
    document.getElementById('compact-mode').checked = settings.compactMode;
    
    // Update slider value displays
    document.getElementById('blur-value').textContent = `${settings.blurIntensity}px`;
    document.getElementById('opacity-value').textContent = `${Math.round(settings.opacityLevel * 100)}%`;
    
    // Apply advanced settings
    applyBackgroundStyle(settings.backgroundStyle);
    applyBlurIntensity(settings.blurIntensity);
    applyOpacityLevel(settings.opacityLevel);
    applyAnimationSettings(settings.enableAnimations);
    applyCompactMode(settings.compactMode);
    
    const themeSelect = document.getElementById('theme-select');
    const recentCountInput = document.getElementById('recent-count');
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    
    if (themeSelect) themeSelect.value = settings.theme;
    if (recentCountInput) recentCountInput.value = settings.recentCount;
    if (autoRefreshCheckbox) autoRefreshCheckbox.checked = settings.autoRefresh;
    
    // Update active color option
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.toggle('active', option.dataset.color === settings.accentColor);
    });
  });
}

function saveSettings() {
  chrome.storage?.local.set({ userSettings: settings });
}

function wireInteractions() {
  // Enhanced keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Search shortcut (Ctrl/Cmd + K)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const el = document.querySelector('.search-input');
      if (el) el.focus();
      return;
    }

    // Settings shortcut (Ctrl/Cmd + ,)
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
      }
      return;
    }

    // Focus notes shortcut (Ctrl/Cmd + N)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      const notesTextarea = document.getElementById('quick-notes');
      if (notesTextarea) {
        notesTextarea.focus();
      }
      return;
    }

    // Toggle view shortcut (Ctrl/Cmd + Shift + V)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      const inactiveBtn = document.querySelector('.toggle-btn:not(.active)');
      if (inactiveBtn) {
        inactiveBtn.click();
      }
      return;
    }

    // Clear search shortcut (Escape when search is focused)
    if (e.key === 'Escape') {
      const searchInput = document.querySelector('.search-input');
      if (searchInput && document.activeElement === searchInput) {
        searchInput.value = '';
        searchInput.blur();
        // Reload recent bookmarks
        loadAndRenderBookmarks();
        return;
      }
    }
  });

  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === currentView) return; // Do nothing if view is already active

      currentView = view;

      // Update button active state
      document.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Re-render with the new view using cached bookmarks
      visualizationService.renderBookmarks(bookmarksGridEl, currentBookmarks, currentView);
    });
  });

  // Enhanced notes functionality
  const notes = document.getElementById('quick-notes');
  const charCount = document.getElementById('notes-char-count');
  const notesStatus = document.getElementById('notes-status');
  const clearNotesBtn = document.getElementById('clear-notes-btn');
  const exportNotesBtn = document.getElementById('export-notes-btn');

  function updateCharCount() {
    if (notes && charCount) {
      const count = notes.value.length;
      charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }
  }

  function updateNotesStatus(status) {
    if (notesStatus) {
      notesStatus.textContent = status;
      notesStatus.style.color = status === 'Saved' ? 'var(--accent-green)' : 'var(--text-muted)';
    }
  }

  if (notes) {
    // Load saved notes
    chrome.storage?.local.get(['quickNotes'], ({ quickNotes }) => {
      if (quickNotes) {
        notes.value = quickNotes;
        updateCharCount();
      }
    });

    let timer = null;
    notes.addEventListener('input', () => {
      updateCharCount();
      updateNotesStatus('Saving...');
      clearTimeout(timer);
      timer = setTimeout(() => {
        chrome.storage?.local.set({ quickNotes: notes.value });
        updateNotesStatus('Saved');
      }, 300);
    });

    // Initialize character count
    updateCharCount();
  }

  // Clear notes button
  if (clearNotesBtn && notes) {
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all notes?')) {
        notes.value = '';
        chrome.storage?.local.set({ quickNotes: '' });
        updateCharCount();
        updateNotesStatus('Saved');
      }
    });
  }

  // Export notes button
  if (exportNotesBtn && notes) {
    exportNotesBtn.addEventListener('click', () => {
      const content = notes.value;
      if (!content.trim()) {
        alert('No notes to export.');
        return;
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quick-notes-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Search input
  const searchInput = document.querySelector('.search-input');
  const handleSearch = debounce(async (query) => {
    bookmarksGridEl.innerHTML = '<div class="loading-spinner"></div>';
    if (query.trim() === '') {
      await loadAndRenderBookmarks(); // Load recents if query is empty
      return;
    }
    const results = await bookmarkService.search(query);
    const filteredResults = filterBookmarksByTags(results); // Apply tag filtering to search results
    currentBookmarks = filteredResults;
    visualizationService.renderBookmarks(bookmarksGridEl, currentBookmarks, currentView);
  }, 300);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  // Settings modal and theme controls
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const themeSelect = document.getElementById('theme-select');
  const recentCountInput = document.getElementById('recent-count');
  const autoRefreshCheckbox = document.getElementById('auto-refresh');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('hidden');
    });
  }

  if (modalCloseBtn && settingsModal) {
    modalCloseBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });

    // Close modal when clicking on overlay
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      }
    });
  }

  // Theme selection
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      settings.theme = e.target.value;
      applyTheme(settings.theme);
      saveSettings();
    });
  }

  // Color picker
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      const color = option.dataset.color;
      settings.accentColor = color;
      applyAccentColor(color);
      saveSettings();
    });
  });

  // Settings inputs
  if (recentCountInput) {
    recentCountInput.addEventListener('change', (e) => {
      settings.recentCount = parseInt(e.target.value);
      saveSettings();
    });
  }

  if (autoRefreshCheckbox) {
    autoRefreshCheckbox.addEventListener('change', (e) => {
      settings.autoRefresh = e.target.checked;
      saveSettings();
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'auto') {
      applyTheme('auto');
    }
  });

  // 打开智能分析中心（顶部导航按钮）
  const analysisCenterBtn = document.getElementById('analysis-btn');
  if (analysisCenterBtn) {
    analysisCenterBtn.addEventListener('click', () => {
      const url = chrome.runtime.getURL('pages/newtab/analysis.html');
      window.open(url, '_blank');
    });
  }

  // 打开文件夹可视化管理（顶部导航按钮）
  const folderManagerBtn = document.getElementById('folder-manager-btn');
  if (folderManagerBtn) {
    folderManagerBtn.addEventListener('click', () => {
      const url = chrome.runtime.getURL('pages/newtab/folder-manager.html');
      window.open(url, '_blank');
    });
  }

  // 统计常用书签容器点击，累计点击频率
  const frequentListEl = document.getElementById('frequent-bookmarks-list');
  if (frequentListEl) {
    frequentListEl.addEventListener('click', (e) => {
      const link = e.target.closest('a.bookmark-item');
      if (!link) return;
      const title = link.querySelector('.bookmark-title')?.textContent || link.href;
      trackBookmarkClick(link.href, title);
    });
  }

  // 主列表点击统计
  if (bookmarksGridEl) {
    bookmarksGridEl.addEventListener('click', (e) => {
      const link = e.target.closest('a.bookmark-item');
      if (!link) return;
      const title = link.querySelector('.bookmark-title')?.textContent || link.href;
      trackBookmarkClick(link.href, title);
    });
  }

  // AI Tools event listeners
  const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
  const duplicatesBtn = document.getElementById('detect-duplicates-btn');
  const brokenLinksBtn = document.getElementById('check-broken-btn');
  const cleanFoldersBtn = document.getElementById('clean-folders-btn');

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeBookmarks);
  }

  if (duplicatesBtn) {
    duplicatesBtn.addEventListener('click', detectDuplicates);
  }

  if (brokenLinksBtn) {
    brokenLinksBtn.addEventListener('click', checkBrokenLinks);
  }

  if (cleanFoldersBtn) {
    cleanFoldersBtn.addEventListener('click', cleanEmptyFolders);
  }

  const generateReportBtn = document.getElementById('generate-report-btn');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', generateDetectionReport);
  }

  // Statistics event listeners
  const viewDetailedStatsBtn = document.getElementById('view-detailed-stats');
  if (viewDetailedStatsBtn) {
    viewDetailedStatsBtn.addEventListener('click', () => {
      const visualizationUrl = chrome.runtime.getURL('visualization-enhanced.html');
      window.open(visualizationUrl, '_blank');
    });
  }

  // Bookmark management event listeners
  const openManagerBtn = document.getElementById('open-manager-btn');
  const exportBookmarksBtn = document.getElementById('export-bookmarks-btn');
  const importBookmarksBtn = document.getElementById('import-bookmarks-btn');
  const showFaviconsCheckbox = document.getElementById('show-favicons');
  const groupByDomainCheckbox = document.getElementById('group-by-domain');
  const defaultViewSelect = document.getElementById('default-view');

  if (openManagerBtn) {
    openManagerBtn.addEventListener('click', () => {
      const managerUrl = chrome.runtime.getURL('bookmark-manager.html');
      window.open(managerUrl, '_blank');
    });
  }

  if (exportBookmarksBtn) {
    exportBookmarksBtn.addEventListener('click', exportBookmarks);
  }

  if (importBookmarksBtn) {
    importBookmarksBtn.addEventListener('click', importBookmarks);
  }

  if (showFaviconsCheckbox) {
    showFaviconsCheckbox.addEventListener('change', (e) => {
      settings.showFavicons = e.target.checked;
      saveSettings();
      refreshBookmarks();
    });
  }

  if (groupByDomainCheckbox) {
    groupByDomainCheckbox.addEventListener('change', (e) => {
      settings.groupByDomain = e.target.checked;
      saveSettings();
      refreshBookmarks();
    });
  }

  if (defaultViewSelect) {
    defaultViewSelect.addEventListener('change', (e) => {
      settings.defaultView = e.target.value;
      saveSettings();
      // Update current view
      currentView = e.target.value;
      refreshBookmarks();
    });
  }

  // Advanced theme customization event listeners
  const backgroundOptions = document.querySelectorAll('.background-option');
  const blurSlider = document.getElementById('blur-intensity');
  const opacitySlider = document.getElementById('opacity-level');
  const animationsCheckbox = document.getElementById('enable-animations');
  const compactModeCheckbox = document.getElementById('compact-mode');
  const resetBtn = document.getElementById('reset-settings');

  backgroundOptions.forEach(option => {
    option.addEventListener('click', () => {
      const bgStyle = option.dataset.bg;
      settings.backgroundStyle = bgStyle;
      saveSettings();
      applyBackgroundStyle(bgStyle);
    });
  });

  if (blurSlider) {
    blurSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      settings.blurIntensity = value;
      document.getElementById('blur-value').textContent = `${value}px`;
      applyBlurIntensity(value);
      saveSettings();
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      settings.opacityLevel = value;
      document.getElementById('opacity-value').textContent = `${Math.round(value * 100)}%`;
      applyOpacityLevel(value);
      saveSettings();
    });
  }

  if (animationsCheckbox) {
    animationsCheckbox.addEventListener('change', (e) => {
      settings.enableAnimations = e.target.checked;
      saveSettings();
      applyAnimationSettings(e.target.checked);
    });
  }

  if (compactModeCheckbox) {
    compactModeCheckbox.addEventListener('change', (e) => {
      settings.compactMode = e.target.checked;
      saveSettings();
      applyCompactMode(e.target.checked);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }

  // Context menu event listeners
  document.addEventListener('bookmarkContextMenu', (e) => {
    showContextMenu(e.detail.event, e.detail.bookmark);
  });

  // Context menu item clicks
  contextMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (item) {
      const action = item.dataset.action;
      handleContextMenuAction(action);
    }
  });

  // Hide context menu on outside click
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // Tag filtering
  const clearTagsBtn = document.getElementById('clear-tags-btn');
  if (clearTagsBtn) {
    clearTagsBtn.addEventListener('click', () => {
      activeTags.clear();
      document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
      // Reload current view with no tag filters
      const activeFolder = folderListEl.querySelector('.folder-item.active');
      const folderId = activeFolder ? activeFolder.dataset.folderId : null;
      loadAndRenderBookmarks(folderId);
    });
  }

  // Tag clicks
  tagsContainerEl.addEventListener('click', (e) => {
    const tagEl = e.target.closest('.filter-tag');
    if (tagEl) {
      const tag = tagEl.dataset.tag;
      
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        tagEl.classList.remove('active');
      } else {
        activeTags.add(tag);
        tagEl.classList.add('active');
      }
      
      // Reload current view with tag filters
      const activeFolder = folderListEl.querySelector('.folder-item.active');
      const folderId = activeFolder ? activeFolder.dataset.folderId : null;
      loadAndRenderBookmarks(folderId);
    }
  });

  // Folder clicks
  folderListEl.addEventListener('click', (e) => {
    const toggleIcon = e.target.closest('.folder-toggle-icon');
    const folderContent = e.target.closest('.folder-content');
    const folderItem = e.target.closest('.folder-item');

    // Handle toggle icon click (expand/collapse)
    if (toggleIcon) {
      e.stopPropagation(); // Prevent folder from loading
      if (folderItem) {
        folderItem.classList.toggle('expanded');
        updateFolderToggleIcon(folderItem);
      }
      return;
    }

    // Handle folder content click (expand/collapse + load bookmarks)
    if (folderContent) {
      if (folderItem) {
        // Toggle expanded state
        folderItem.classList.toggle('expanded');
        updateFolderToggleIcon(folderItem);
        
        // Clear active state from all folders
        document.querySelectorAll('.folder-item').forEach(item => item.classList.remove('active'));
        // Set current folder to active
        folderItem.classList.add('active');
        const folderId = folderItem.dataset.folderId;
        loadAndRenderBookmarks(folderId);
      }
    }
  });
}

function subscribeToBookmarkChanges() {
  const refreshAll = async () => {
    console.log('Bookmark change detected, refreshing UI.');
    await loadAndRenderFolders();
    await loadAndRenderTags(); // Refresh tags when bookmarks change
    const activeFolder = folderListEl.querySelector('.folder-item.active');
    const folderId = activeFolder ? activeFolder.dataset.folderId : null;
    await loadAndRenderBookmarks(folderId);
    await updateStatistics();
    await updateFrequentBookmarks();
  };

  chrome.bookmarks.onCreated.addListener(refreshAll);
  chrome.bookmarks.onRemoved.addListener(refreshAll);
  chrome.bookmarks.onChanged.addListener(refreshAll);
  chrome.bookmarks.onMoved.addListener(refreshAll);
}

async function bootstrap() {
  // Initialize settings panel callback to update local settings
  settingsPanel.onSettingsChange((newSettings) => {
    settings = newSettings;
    // Update current view if changed
    if (currentView !== settings.defaultView) {
      currentView = settings.defaultView;
      refreshBookmarks();
    }
  });
  
  // Settings are now handled by the SettingsPanel module
  initIcons(); // 初始化静态图标
  updateClock();
  setInterval(updateClock, 1000);
  wireInteractions();
  await loadAndRenderFolders();
  await loadAndRenderTags();
  await loadAndRenderBookmarks();
  subscribeToBookmarkChanges();
  await updateStatistics(); // Update statistics display
  await updateFrequentBookmarks(); // 更新常用书签区域
  
  // 确保所有图标都已正确初始化
  setTimeout(() => {
    initIcons();
  }, 100);
}

// Bookmark import/export functionality
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
    
    console.log('Bookmarks exported successfully');
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export bookmarks');
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
          await importFromJSON(importData.bookmarks);
        }
      } else if (file.name.endsWith('.html')) {
        await importFromHTML(text);
      }
      
      alert('Bookmarks imported successfully!');
      refreshBookmarks();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import bookmarks');
    }
  };
  
  input.click();
}

async function importFromJSON(bookmarks) {
  const bookmarksBar = await new Promise(resolve => 
    chrome.bookmarks.getSubTree('1', resolve)
  );
  
  for (const bookmark of bookmarks) {
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

async function importFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
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

// Statistics calculation and display
async function updateStatistics() {
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const [tree] = await bookmarkService.getTree();
    
    // Calculate basic stats
    const totalBookmarks = bookmarks.length;
    const totalFolders = countFolders(tree);
    const uniqueDomains = new Set(bookmarks.map(b => new URL(b.url).hostname)).size;
    
    // Calculate recent additions (last 7 days)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentAdded = bookmarks.filter(b => b.dateAdded && b.dateAdded > oneWeekAgo).length;
    
    // Update UI
    document.getElementById('total-bookmarks').textContent = totalBookmarks;
    document.getElementById('total-folders').textContent = totalFolders;
    document.getElementById('unique-domains').textContent = uniqueDomains;
    document.getElementById('recent-added').textContent = recentAdded;
    
    // Calculate and display top domains
    const domainCounts = {};
    bookmarks.forEach(bookmark => {
      try {
        const domain = new URL(bookmark.url).hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    displayTopDomains(topDomains);
    
  } catch (error) {
    console.error('Failed to update statistics:', error);
  }
}

function countFolders(node) {
  if (!node || !node.children) return 0;
  
  let count = 0;
  for (const child of node.children) {
    if (!child.url) { // It's a folder
      count += 1 + countFolders(child);
    }
  }
  return count;
}

function displayTopDomains(topDomains) {
  const container = document.getElementById('top-domains-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (topDomains.length === 0) {
    // 修改(1): 同样为空状态更新CSS类，保持样式一致
    container.innerHTML = '<div class="stat-item domain-item-layout" style="justify-content: center;"><span class="domain-name">No bookmarks yet</span></div>';
    return;
  }
  
  topDomains.forEach(([domain, count]) => {
    const domainItem = document.createElement('div');
    
    // 修改(2): 【核心】将旧的 class 替换为新的 class 组合
    domainItem.className = 'stat-item domain-item-layout';
    
    // 内部结构保持不变，因为我们写的CSS就是针对这两个span的
    domainItem.innerHTML = `
      <span class="domain-name">${domain}</span>
      <span class="domain-count">${count}</span>
    `;
    container.appendChild(domainItem);
  });
}

// ==========================
// 常用书签：点击频率 + 历史访问综合
// ==========================
const CLICK_STATS_KEY = 'bookmarkClickStats';
const PINNED_BOOKMARKS_KEY = 'pinnedBookmarks';

// Pin/Unpin bookmark functions
async function getPinnedBookmarks() {
  try {
    const result = await chrome.storage.local.get([PINNED_BOOKMARKS_KEY]);
    return result[PINNED_BOOKMARKS_KEY] || [];
  } catch (error) {
    console.error('Failed to get pinned bookmarks:', error);
    return [];
  }
}

async function togglePinBookmark(bookmark) {
  try {
    const pinnedBookmarks = await getPinnedBookmarks();
    const existingIndex = pinnedBookmarks.findIndex(b => b.id === bookmark.id);
    
    if (existingIndex >= 0) {
      // Unpin
      pinnedBookmarks.splice(existingIndex, 1);
      console.log(`Unpinned bookmark: ${bookmark.title}`);
    } else {
      // Pin - add to beginning
      pinnedBookmarks.unshift({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        dateAdded: bookmark.dateAdded,
        pinnedAt: Date.now()
      });
      console.log(`Pinned bookmark: ${bookmark.title}`);
    }
    
    await chrome.storage.local.set({ [PINNED_BOOKMARKS_KEY]: pinnedBookmarks });
  } catch (error) {
    console.error('Failed to toggle pin bookmark:', error);
  }
}

async function trackBookmarkClick(url, title) {
  try {
    if (!chrome?.storage?.local || !url) return;
    const result = await chrome.storage.local.get([CLICK_STATS_KEY]);
    const stats = result[CLICK_STATS_KEY] || {};
    const now = Date.now();
    const prev = stats[url] || { count: 0 };
    stats[url] = {
      title: title || prev.title || url,
      count: (prev.count || 0) + 1,
      lastClick: now
    };
    await chrome.storage.local.set({ [CLICK_STATS_KEY]: stats });
    // 点击后刷新常用列表
    await updateFrequentBookmarks();
  } catch (e) {
    console.warn('trackBookmarkClick failed:', e);
  }
}

async function updateFrequentBookmarks(limit = 8) {
  const container = document.getElementById('frequent-bookmarks-list');
  if (!container) return;
  try {
    container.innerHTML = '<div class="loading-spinner"></div>';

    const bookmarks = await bookmarkService.getAllBookmarks();
    const urlSet = new Set();
    const urlToTitle = new Map();
    bookmarks.forEach(b => { if (b.url) { urlSet.add(b.url); urlToTitle.set(b.url, b.title || b.url); } });

    // 本地点击统计
    const result = await chrome.storage?.local.get([CLICK_STATS_KEY]);
    const clickStats = (result && result[CLICK_STATS_KEY]) ? result[CLICK_STATS_KEY] : {};

    // 浏览历史统计（如果有权限）
    const historyCounts = {};
    const historyLastVisit = {};
    if (chrome?.history && typeof chrome.history.search === 'function') {
      try {
        const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000; // 最近90天
        const historyItems = await new Promise(resolve => chrome.history.search({ text: '', maxResults: 5000, startTime }, resolve));
        historyItems.forEach(item => {
          if (urlSet.has(item.url)) {
            historyCounts[item.url] = (historyCounts[item.url] || 0) + (item.visitCount || 0);
            historyLastVisit[item.url] = Math.max(historyLastVisit[item.url] || 0, item.lastVisitTime || 0);
          }
        });
      } catch (e) {
        console.warn('history.search failed:', e);
      }
    }

    // 综合评分：历史访问 + 本地点击*2
    const scores = [];
    urlSet.forEach(url => {
      const visits = historyCounts[url] || 0;
      const clicks = (clickStats[url]?.count) || 0;
      const score = visits + clicks * 2;
      const lastTime = Math.max(historyLastVisit[url] || 0, clickStats[url]?.lastClick || 0);
      if (score > 0) {
        scores.push({ url, title: urlToTitle.get(url) || clickStats[url]?.title || url, visits, clicks, score, lastTime });
      }
    });

    // 兜底：如果没有数据，展示最近书签
    if (scores.length === 0) {
      const recents = await bookmarkService.getRecent(limit);
      container.innerHTML = recents.map(b => renderFrequentItem({ url: b.url, title: b.title || b.url, visits: 0, clicks: 0 })).join('');
      return;
    }

    scores.sort((a, b) => b.score - a.score || b.lastTime - a.lastTime);
    const top = scores.slice(0, limit);
    container.innerHTML = top.map(renderFrequentItem).join('');
  } catch (e) {
    console.warn('updateFrequentBookmarks failed:', e);
    container.innerHTML = '<div class="empty-state"><div class="empty-title">暂无数据</div><div class="empty-desc">还没有足够的使用记录</div></div>';
  }
}

function renderFrequentItem(item) {
  try {
    const safeUrl = item.url || '#';
    const href = escapeHtml(safeUrl);
    const visitsRaw = Number(item.visits ?? 0);
    const clicksRaw = Number(item.clicks ?? 0);
    const visits = Number.isFinite(visitsRaw) ? Math.max(Math.round(visitsRaw), 0) : 0;
    const clicks = Number.isFinite(clicksRaw) ? Math.max(Math.round(clicksRaw), 0) : 0;
    const usageTotal = visits + clicks;
    const displayTitle = escapeHtml(item.title || safeUrl);
    const detailParts = [];
    if (visits) detailParts.push(`历史访问 ${visits}`);
    if (clicks) detailParts.push(`快捷点击 ${clicks}`);
    const tooltipSource = detailParts.length ? detailParts.join(' / ') : (item.url || item.title || safeUrl);
    const accessibleDetailParts = [...detailParts, `访问次数 ${usageTotal}`];
    const accessibleLabel = `${item.title || safeUrl}，${accessibleDetailParts.join('，')}`;

    return `
      <a class="bookmark-item frequent-compact-item" data-count="${usageTotal}" href="${href}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(tooltipSource)}" aria-label="${escapeHtml(accessibleLabel)}">
        <span class="bookmark-title">${displayTitle}</span>
      </a>
    `;
  } catch (e) {
    return '';
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Detection report generation
async function generateDetectionReport() {
  updateAIStatus('Generating report...', 'processing');
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const [tree] = await bookmarkService.getTree();
    
    // Run all detection checks
    const duplicates = findDuplicateBookmarks(bookmarks);
    const emptyFolders = findEmptyFolders(tree);
    const invalidBookmarks = findInvalidBookmarks(bookmarks);
    const statistics = calculateDetailedStatistics(bookmarks, tree);
    
    // Generate report data
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBookmarks: bookmarks.length,
        totalFolders: statistics.totalFolders,
        duplicatesFound: duplicates.length,
        emptyFoldersFound: emptyFolders.length,
        invalidBookmarksFound: invalidBookmarks.length
      },
      details: {
        duplicates,
        emptyFolders,
        invalidBookmarks,
        statistics
      }
    };
    
    // Create and download report
    const reportHtml = generateReportHTML(reportData);
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmark-detection-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateAIStatus('Report generated successfully', 'success');
    setTimeout(() => updateAIStatus('Ready'), 3000);
    
  } catch (error) {
    console.error('Report generation failed:', error);
    updateAIStatus('Report generation failed', 'error');
    setTimeout(() => updateAIStatus('Ready'), 3000);
  }
}

function findDuplicateBookmarks(bookmarks) {
  const duplicates = new Map();
  const duplicateGroups = [];
  
  bookmarks.forEach(bookmark => {
    if (duplicates.has(bookmark.url)) {
      duplicates.get(bookmark.url).push(bookmark);
    } else {
      duplicates.set(bookmark.url, [bookmark]);
    }
  });
  
  duplicates.forEach((group, url) => {
    if (group.length > 1) {
      duplicateGroups.push({ url, bookmarks: group });
    }
  });
  
  return duplicateGroups;
}

function findEmptyFolders(tree) {
  const emptyFolders = [];
  
  function checkFolder(node) {
    if (!node.children) return;
    
    const hasBookmarks = node.children.some(child => child.url);
    const hasNonEmptySubfolders = node.children.some(child => 
      !child.url && child.children && child.children.length > 0
    );
    
    if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0) {
      emptyFolders.push({
        id: node.id,
        title: node.title,
        parentId: node.parentId
      });
    }
    
    node.children.forEach(child => {
      if (!child.url) {
        checkFolder(child);
      }
    });
  }
  
  if (tree && tree.children) {
    tree.children.forEach(rootFolder => checkFolder(rootFolder));
  }
  
  return emptyFolders;
}

function findInvalidBookmarks(bookmarks) {
  const invalid = [];
  
  bookmarks.forEach(bookmark => {
    try {
      new URL(bookmark.url);
    } catch (error) {
      invalid.push({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        reason: 'Invalid URL format'
      });
    }
    
    if (!bookmark.title || bookmark.title.trim() === '') {
      invalid.push({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        reason: 'Empty title'
      });
    }
  });
  
  return invalid;
}

function calculateDetailedStatistics(bookmarks, tree) {
  const domains = {};
  const categories = {};
  
  bookmarks.forEach(bookmark => {
    try {
      const domain = new URL(bookmark.url).hostname;
      domains[domain] = (domains[domain] || 0) + 1;
      
      // Simple categorization based on domain
      const category = categorizeByDomain(domain);
      categories[category] = (categories[category] || 0) + 1;
    } catch (error) {
      // Skip invalid URLs
    }
  });
  
  return {
    totalFolders: countFolders(tree),
    uniqueDomains: Object.keys(domains).length,
    topDomains: Object.entries(domains).sort(([,a], [,b]) => b - a).slice(0, 10),
    categories: Object.entries(categories).sort(([,a], [,b]) => b - a)
  };
}

function categorizeByDomain(domain) {
  const socialMedia = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com'];
  const news = ['cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com', 'guardian.com'];
  const tech = ['github.com', 'stackoverflow.com', 'medium.com', 'dev.to', 'hackernews.com'];
  const shopping = ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com'];
  
  if (socialMedia.some(site => domain.includes(site))) return 'Social Media';
  if (news.some(site => domain.includes(site))) return 'News';
  if (tech.some(site => domain.includes(site))) return 'Technology';
  if (shopping.some(site => domain.includes(site))) return 'Shopping';
  
  return 'Other';
}

function generateReportHTML(data) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bookmark Detection Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #007acc; }
    .stat-label { color: #666; margin-top: 5px; }
    .issue { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
    .issue.error { background: #f8d7da; border-color: #f5c6cb; }
    .issue-title { font-weight: bold; color: #856404; }
    .issue.error .issue-title { color: #721c24; }
    .bookmark-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; }
    .bookmark-url { color: #666; font-size: 0.9em; word-break: break-all; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: 600; }
    .timestamp { color: #666; font-size: 0.9em; text-align: right; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Bookmark Detection Report</h1>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${data.summary.totalBookmarks}</div>
        <div class="stat-label">Total Bookmarks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.summary.totalFolders}</div>
        <div class="stat-label">Total Folders</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.summary.duplicatesFound}</div>
        <div class="stat-label">Duplicates Found</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.summary.emptyFoldersFound}</div>
        <div class="stat-label">Empty Folders</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.summary.invalidBookmarksFound}</div>
        <div class="stat-label">Invalid Bookmarks</div>
      </div>
    </div>

    ${data.details.duplicates.length > 0 ? `
    <h2>🔄 Duplicate Bookmarks</h2>
    ${data.details.duplicates.map(group => `
      <div class="issue">
        <div class="issue-title">Duplicate URL: ${group.url}</div>
        ${group.bookmarks.map(bookmark => `
          <div class="bookmark-item">
            <strong>${bookmark.title}</strong><br>
            <span class="bookmark-url">${bookmark.url}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
    ` : ''}

    ${data.details.emptyFolders.length > 0 ? `
    <h2>📁 Empty Folders</h2>
    ${data.details.emptyFolders.map(folder => `
      <div class="issue">
        <div class="issue-title">Empty Folder: ${folder.title}</div>
        <p>This folder contains no bookmarks or subfolders.</p>
      </div>
    `).join('')}
    ` : ''}

    ${data.details.invalidBookmarks.length > 0 ? `
    <h2>⚠️ Invalid Bookmarks</h2>
    ${data.details.invalidBookmarks.map(bookmark => `
      <div class="issue error">
        <div class="issue-title">${bookmark.reason}: ${bookmark.title}</div>
        <div class="bookmark-url">${bookmark.url}</div>
      </div>
    `).join('')}
    ` : ''}

    <h2>📈 Statistics</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Unique Domains</td><td>${data.details.statistics.uniqueDomains}</td></tr>
      <tr><td>Total Folders</td><td>${data.details.statistics.totalFolders}</td></tr>
    </table>

    <h2>🏆 Top Domains</h2>
    <table>
      <tr><th>Domain</th><th>Count</th></tr>
      ${data.details.statistics.topDomains.map(([domain, count]) => `
        <tr><td>${domain}</td><td>${count}</td></tr>
      `).join('')}
    </table>

    <div class="timestamp">
      Report generated on ${new Date(data.timestamp).toLocaleString()}
    </div>
  </div>
</body>
</html>
  `;
}

// Advanced theme customization functions
function applyBackgroundStyle(style) {
  document.body.setAttribute('data-bg', style);
  
  // Update active background option
  document.querySelectorAll('.background-option').forEach(option => {
    option.classList.toggle('active', option.dataset.bg === style);
  });
  
  // Apply background based on style
  switch (style) {
    case 'gradient':
      document.body.style.background = 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)';
      document.body.style.backgroundAttachment = 'fixed';
      break;
    case 'solid':
      document.body.style.background = '#0f0f0f';
      document.body.style.backgroundAttachment = 'initial';
      break;
    case 'pattern':
      document.body.style.background = '#0f0f0f';
      document.body.style.backgroundImage = 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)';
      document.body.style.backgroundSize = '20px 20px';
      document.body.style.backgroundAttachment = 'fixed';
      break;
  }
}

function applyBlurIntensity(intensity) {
  document.documentElement.style.setProperty('--blur-intensity', `${intensity}px`);
  
  // Update all backdrop-filter elements
  const elements = document.querySelectorAll('.ai-tools-widget, .stats-widget, .notes-widget, .ai-tool-btn, .stat-item');
  elements.forEach(el => {
    el.style.backdropFilter = `blur(${intensity}px)`;
    el.style.webkitBackdropFilter = `blur(${intensity}px)`;
  });
}

function applyOpacityLevel(opacity) {
  document.documentElement.style.setProperty('--glass-opacity', opacity);
  
  // Update CSS variables for glass effects
  document.documentElement.style.setProperty('--bg-card', `rgba(26, 26, 26, ${opacity})`);
  document.documentElement.style.setProperty('--bg-glass', `rgba(255, 255, 255, ${opacity * 0.1})`);
  document.documentElement.style.setProperty('--bg-glass-hover', `rgba(255, 255, 255, ${opacity * 0.15})`);
}

function applyAnimationSettings(enabled) {
  document.body.setAttribute('data-animations', enabled);
}

function applyCompactMode(compact) {
  document.body.setAttribute('data-compact', compact);
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    // Reset to default settings
    settings = {
      theme: 'dark',
      accentColor: 'blue',
      recentCount: 20,
      autoRefresh: true,
      showFavicons: true,
      groupByDomain: false,
      defaultView: 'grid',
      backgroundStyle: 'gradient',
      blurIntensity: 20,
      opacityLevel: 0.7,
      enableAnimations: true,
      compactMode: false
    };
    
    // Save and apply settings
    saveSettings();
    loadSettings();
    
    // Refresh the page to ensure all changes take effect
    setTimeout(() => location.reload(), 500);
  }
}

// Wait DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// 事件订阅函数
function subscribe(elementId, handler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener('click', handler);
    console.log(`✅ 事件订阅成功: ${elementId}`);
  } else {
    console.warn(`⚠️ 元素未找到: ${elementId}`);
  }
}

//打开dashbord页面
function openDashboard() {
  // 在新标签页中打开Dashboard页面
  const dashboardUrl = chrome.runtime.getURL('pages/newtab/dashbord.html');
  chrome.tabs.create({ url: dashboardUrl });
}

//打开智能分析中心页面
function openAnalysisCenter() {
  // 在新标签页中打开智能分析中心页面
  const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
  chrome.tabs.create({ url: analysisUrl });
}

//打开文件夹可视化管理页面
function openFolderManager() {
  // 在新标签页中打开文件夹可视化管理页面
  const folderManagerUrl = chrome.runtime.getURL('pages/newtab/folder-manager.html');
  chrome.tabs.create({ url: folderManagerUrl });
}

// 订阅Dashboard按钮事件
subscribe('dashboard-btn', openDashboard);

// 订阅智能分析中心按钮事件
subscribe('analysis-btn', openAnalysisCenter);

// 订阅文件夹可视化管理按钮事件
subscribe('folder-manager-btn', openFolderManager);