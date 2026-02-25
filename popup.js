// 全局变量
let apiStatus = false;
let bookmarkStats = {
  totalBookmarks: 0,
  totalFolders: 0,
  duplicateCount: 0,
  invalidCount: 0
};

// 性能优化：防抖函数
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

// 性能优化：节流函数
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 初始化弹出窗口
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 书签助手 Popup 初始化...');

  // 初始化动画优化器
  initializeAnimationOptimizer();

  // 初始化统计数据
  loadBookmarkStats();

  // 检查API状态
  checkApiStatus();

  // AI智能中枢
  document.getElementById('open-ai-hub').addEventListener('click', openAIHub);
  document.getElementById('quick-analysis').addEventListener('click', startQuickAnalysis);

  // 主要功能分类
  document.getElementById('open-visualization').addEventListener('click', openVisualization);
  document.getElementById('open-manager').addEventListener('click', openBookmarkManager);

  // 智能分析分类
  document.getElementById('ai-analysis').addEventListener('click', openAIAnalysis);
  document.getElementById('data-visualization').addEventListener('click', openDataVisualization);
  document.getElementById('export-data').addEventListener('click', openExportData);

  // 数据管理分类
  document.getElementById('batch-operations').addEventListener('click', openBatchOperations);
  document.getElementById('import-export').addEventListener('click', openImportExport);
  document.getElementById('backup-restore').addEventListener('click', openBackupRestore);

  // 检测清理分类
  document.getElementById('detect-duplicates').addEventListener('click', detectDuplicates);
  document.getElementById('detect-invalid').addEventListener('click', detectInvalidBookmarks);
  document.getElementById('cleanup-bookmarks').addEventListener('click', cleanupBookmarks);

  // 设置分类
  document.getElementById('personalization').addEventListener('click', openPersonalization);
  document.getElementById('api-settings').addEventListener('click', openAPISettings);

  // 添加按钮加载状态（优化版本）
  addOptimizedLoadingStates();

  // 性能优化：预加载关键资源
  preloadCriticalResources();
});

// 预加载关键资源
function preloadCriticalResources() {
  // 预加载图标
  const icon = new Image();
  icon.src = 'images/icon.png';

  // 预加载常用页面
  const links = [
    'visualization.html',
    'bookmark-manager.html',
    'options.html'
  ];

  links.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

// 加载书签统计数据（优化版本）
const loadBookmarkStats = debounce(async function () {
  try {
    console.log('📊 加载书签统计数据...');

    // 使用 requestIdleCallback 在空闲时间执行
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        await performBookmarkStatsCalculation();
      });
    } else {
      // 降级到 setTimeout
      setTimeout(async () => {
        await performBookmarkStatsCalculation();
      }, 0);
    }

  } catch (error) {
    console.error('❌ 加载统计数据失败:', error);
    showError('加载统计数据失败');
  }
}, 100);

// 执行书签统计计算
async function performBookmarkStatsCalculation() {
  try {
    // 获取书签树
    const bookmarks = await chrome.bookmarks.getTree();

    // 统计书签和文件夹数量
    let totalBookmarks = 0;
    let totalFolders = 0;

    const countBookmarks = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          totalBookmarks++;
        } else {
          totalFolders++;
          if (node.children) {
            countBookmarks(node.children);
          }
        }
      }
    };

    countBookmarks(bookmarks);

    // 更新统计数据
    bookmarkStats.totalBookmarks = totalBookmarks;
    bookmarkStats.totalFolders = totalFolders;

    // 使用 requestAnimationFrame 更新UI
    requestAnimationFrame(() => {
      updateStatsUI();
    });

    // 检测重复书签数量（异步执行）
    setTimeout(() => {
      detectDuplicateCount();
    }, 50);

    console.log('✅ 统计数据加载完成:', bookmarkStats);

  } catch (error) {
    console.error('❌ 统计数据计算失败:', error);
  }
}

// 更新统计UI（优化版本）
function updateStatsUI() {
  const elements = {
    totalBookmarks: document.getElementById('total-bookmarks'),
    totalFolders: document.getElementById('total-folders'),
    duplicateCount: document.getElementById('duplicate-count')
  };

  // 批量更新DOM，减少重绘
  if (elements.totalBookmarks) {
    elements.totalBookmarks.textContent = bookmarkStats.totalBookmarks.toLocaleString();
  }
  if (elements.totalFolders) {
    elements.totalFolders.textContent = bookmarkStats.totalFolders.toLocaleString();
  }
  if (elements.duplicateCount) {
    elements.duplicateCount.textContent = bookmarkStats.duplicateCount.toLocaleString();
  }
}

// 检测重复书签数量（优化版本）
const detectDuplicateCount = throttle(async function () {
  try {
    const bookmarks = await chrome.bookmarks.getTree();
    const urlMap = new Map();
    let duplicateCount = 0;

    const findDuplicates = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          const normalizedUrl = normalizeUrl(node.url);
          if (urlMap.has(normalizedUrl)) {
            duplicateCount++;
          } else {
            urlMap.set(normalizedUrl, true);
          }
        }
        if (node.children) {
          findDuplicates(node.children);
        }
      }
    };

    findDuplicates(bookmarks);
    bookmarkStats.duplicateCount = duplicateCount;

    // 使用 requestAnimationFrame 更新UI
    requestAnimationFrame(() => {
      // 更新重复书签徽章
      const duplicateBadge = document.getElementById('duplicate-badge');
      if (duplicateBadge) {
        if (duplicateCount > 0) {
          duplicateBadge.textContent = duplicateCount;
          duplicateBadge.style.display = 'inline';
        } else {
          duplicateBadge.style.display = 'none';
        }
      }

      updateStatsUI();
    });

  } catch (error) {
    console.error('❌ 检测重复书签失败:', error);
  }
}, 200);

// 标准化URL
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

// 检查API连接状态
function checkApiStatus() {
  chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
    const apiStatusElement = document.getElementById('api-status-text');
    const apiStatusContainer = document.getElementById('api-status-container');

    if (result.apiProvider && result.apiKey) {
      apiStatus = true;
      apiStatusElement.textContent = '已连接';
      apiStatusContainer.className = 'api-status api-connected';
    } else {
      apiStatus = false;
      apiStatusElement.textContent = '未连接';
      apiStatusContainer.className = 'api-status api-not-connected';
    }
  });
}

// 初始化动画优化器
function initializeAnimationOptimizer() {
  // 加载动画优化器脚本
  const script = document.createElement('script');
  script.src = 'animation-optimizer.js';
  script.onload = () => {
    console.log('✅ 动画优化器加载完成');
    // 优化现有动画
    optimizeExistingAnimations();
  };
  document.head.appendChild(script);
}

// 优化现有动画
function optimizeExistingAnimations() {
  // 为所有动画元素添加硬件加速
  const animatedElements = document.querySelectorAll('.btn, .stat-card, .category');

  animatedElements.forEach(element => {
    element.style.willChange = 'transform, opacity';
    element.style.transform = 'translateZ(0)';
  });

  // 优化CSS动画
  optimizeCSSAnimations();
}

// 优化CSS动画
function optimizeCSSAnimations() {
  const optimizedStyles = `
    /* 动画性能优化 */
    .btn, .stat-card, .category {
      will-change: transform, opacity;
      transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    /* 移除默认过渡效果，只保留必要的动画 */
    .btn {
      transition: none; /* 移除默认过渡效果 */
    }
    
    /* 优化悬停效果 - 只保留进入动画 */
    .btn:hover {
      transform: translateZ(0) translateY(-1px);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); /* 只设置进入动画 */
    }
    
    /* 优化点击效果 - 只保留点击动画 */
    .btn:active {
      transform: translateZ(0) scale(0.98);
      transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1); /* 只设置点击动画 */
    }
    
    /* 移除其他元素的默认过渡效果 */
    .bookmark-item, .folder-item, .action-btn {
      transition: none;
    }
  `;

  const style = document.createElement('style');
  style.textContent = optimizedStyles;
  document.head.appendChild(style);
}

// 添加优化的按钮加载状态
function addOptimizedLoadingStates() {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', function (e) {
      // 防止重复点击
      if (this.classList.contains('loading')) {
        e.preventDefault();
        return;
      }

      // 添加加载状态
      this.classList.add('loading');

      // 使用 requestAnimationFrame 确保状态更新
      requestAnimationFrame(() => {
        // 1.5秒后移除加载状态（进一步减少等待时间）
        setTimeout(() => {
          this.classList.remove('loading');
        }, 1500);
      });
    });
  });
}

// 显示错误信息（优化版本）
function showError(message) {
  console.error('❌ 错误:', message);
  showNotification(message, 'error');
}

// 主要功能 - 打开可视化页面
function openVisualization() {
  console.log('打开书签可视化页面');
  chrome.tabs.create({ url: 'pages/newtab/dashbord.html#overview' });
}

// 主要功能 - 打开书签管理器
function openBookmarkManager() {
  console.log('打开书签管理器');
  chrome.tabs.create({ url: 'enhanced-bookmark-manager.html' });
}

// 智能分析 - AI分析
function openAIAnalysis() {
  console.log('🤖 打开AI智能分析');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#ai-analysis'
  });
}

// 智能分析 - 数据可视化
function openDataVisualization() {
  console.log('📊 打开数据可视化');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#overview'
  });
}

// 智能分析 - 导出数据
function openExportData() {
  console.log('📤 打开数据导出');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#data-mgmt'
  });
}

// 数据管理 - 批量操作
function openBatchOperations() {
  console.log('⚡ 打开批量操作');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#detection'
  });
}

// 数据管理 - 导入导出
function openImportExport() {
  console.log('🔄 打开导入导出');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#data-mgmt'
  });
}

// 数据管理 - 备份恢复
function openBackupRestore() {
  console.log('💾 打开备份恢复');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#data-mgmt'
  });
}

// 检测清理 - 检测重复书签（优化版本）
const detectDuplicates = throttle(async function () {
  console.log('🔄 检测重复书签');

  try {
    // 显示加载状态
    const button = document.getElementById('detect-duplicates');
    if (button) {
      button.classList.add('loading');
    }

    // 打开检测页面
    chrome.tabs.create({
      url: 'pages/newtab/dashbord.html#detection'
    });

    // 移除加载状态
    setTimeout(() => {
      if (button) {
        button.classList.remove('loading');
      }
    }, 800);

  } catch (error) {
    console.error('❌ 检测重复书签失败:', error);
    showError('检测重复书签失败');
  }
}, 300);

// 检测清理 - 检测失效书签（优化版本）
const detectInvalidBookmarks = throttle(async function () {
  console.log('❌ 检测失效书签');

  try {
    // 显示加载状态
    const button = document.getElementById('detect-invalid');
    if (button) {
      button.classList.add('loading');
    }

    // 打开检测页面
    chrome.tabs.create({
      url: 'pages/newtab/dashbord.html#detection'
    });

    // 移除加载状态
    setTimeout(() => {
      if (button) {
        button.classList.remove('loading');
      }
    }, 800);

  } catch (error) {
    console.error('❌ 检测失效书签失败:', error);
    showError('检测失效书签失败');
  }
}, 300);

// 检测清理 - 清理书签
function cleanupBookmarks() {
  console.log('🧹 清理书签');
  chrome.tabs.create({
    url: 'pages/newtab/dashbord.html#detection'
  });
}

// 设置 - 个性化设置
function openPersonalization() {
  console.log('打开个性化设置');
  chrome.runtime.openOptionsPage();
}

// 设置 - API设置
function openAPISettings() {
  console.log('🔑 打开API设置');
  chrome.runtime.openOptionsPage();
}

// 工具函数 - 格式化数字
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 工具函数 - 显示通知（优化版本）
function showNotification(message, type = 'info') {
  // 移除现有通知
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // 添加样式
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--apple-bg-tertiary, #fff);
    border: 1px solid var(--apple-border, rgba(0,0,0,0.06));
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 500;
    color: var(--apple-text, #1d1d1f);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    z-index: 1000;
    max-width: 300px;
  `;

  // 添加到页面
  document.body.appendChild(notification);

  // 使用 requestAnimationFrame 确保动画流畅
  requestAnimationFrame(() => {
    notification.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    notification.style.transform = 'translateZ(0) translateX(0)';
    notification.style.opacity = '1';
  });

  // 3秒后自动移除
  setTimeout(() => {
    notification.style.transform = 'translateZ(0) translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function openDashboard() {
  console.log('打开仪表盘');
  chrome.tabs.create({ url: 'pages/newtab/dashbord.html' });
}
if (document.getElementById('dashboard')) {
  document.getElementById('dashboard').addEventListener('click', openDashboard);
}

// 添加通知动画样式（优化版本）
const style = document.createElement('style');
style.textContent = `
  .notification {
    transform: translateZ(0) translateX(100%);
    opacity: 0;
  }
  
  .notification-success {
    border-left: 4px solid #30d158;
  }
  
  .notification-error {
    border-left: 4px solid #ff3b30;
  }
  
  .notification-warning {
    border-left: 4px solid #ff9500;
  }
  
  .notification-info {
    border-left: 4px solid #007aff;
  }
`;
document.head.appendChild(style);

// 定期刷新统计数据（优化版本）
const refreshStats = debounce(() => {
  loadBookmarkStats();
}, 1000);

// 使用更长的刷新间隔，减少性能影响
setInterval(refreshStats, 60000); // 每60秒刷新一次

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // API设置变化时重新检查状态
    if (changes.apiProvider || changes.apiKey) {
      checkApiStatus();
    }
  }
});

// 性能优化：页面可见性API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时暂停非关键操作
    console.log('页面隐藏，暂停非关键操作');
  } else {
    // 页面显示时恢复操作
    console.log('页面显示，恢复操作');
    loadBookmarkStats();
  }
});

// AI智能中枢函数
function openAIHub() {
  console.log('🚀 打开AI智能中枢...');
  showLoading('open-ai-hub');

  try {
    chrome.tabs.create({
      url: chrome.runtime.getURL('ai-analysis-center.html'),
      active: true
    }, () => {
      hideLoading('open-ai-hub');
      window.close(); // 关闭popup
    });
  } catch (error) {
    console.error('打开AI智能中枢失败:', error);
    showError('打开AI智能中枢失败');
    hideLoading('open-ai-hub');
  }
}

function startQuickAnalysis() {
  console.log('⚡ 开始快速AI分析...');
  showLoading('quick-analysis');

  try {
    // 检查API状态
    if (!apiStatus) {
      showError('请先配置API密钥');
      hideLoading('quick-analysis');
      // 打开设置页面
      setTimeout(() => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html'),
          active: true
        });
        window.close();
      }, 1000);
      return;
    }

    // 打开分析中心并自动开始分析
    chrome.tabs.create({
      url: chrome.runtime.getURL('ai-analysis-center.html?auto=true'),
      active: true
    }, () => {
      hideLoading('quick-analysis');
      window.close(); // 关闭popup
    });
  } catch (error) {
    console.error('快速分析启动失败:', error);
    showError('快速分析启动失败');
    hideLoading('quick-analysis');
  }
}

console.log('✅ 书签助手 Popup 初始化完成（性能优化版本）');