// 全局变量
let apiStatus = false;

// 初始化弹出窗口
document.addEventListener('DOMContentLoaded', () => {
  // 获取API状态
  checkApiStatus();
  
  // 书签管理分类
  document.getElementById('bookmark-manager').addEventListener('click', openBookmarkManager);
  document.getElementById('organize-bookmarks').addEventListener('click', () => openAnalyzePage('organize'));
  
  // 书签分析分类
  document.getElementById('analyze-bookmarks').addEventListener('click', () => openAnalyzePage('analyze'));
  document.getElementById('export-csv').addEventListener('click', () => openAnalyzePage('export'));
  
  // 书签检测分类
  document.getElementById('detect-duplicates').addEventListener('click', () => openAnalyzePage('duplicates'));
  document.getElementById('detect-invalid').addEventListener('click', () => openAnalyzePage('invalid'));
  document.getElementById('cleanup-bookmarks').addEventListener('click', () => openAnalyzePage('cleanup'));
  
  // 设置分类
  document.getElementById('setup-api').addEventListener('click', openOptions);
});

// 检查API连接状态
function checkApiStatus() {
  chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
    const apiStatusElement = document.getElementById('api-status');
    
    if (result.apiProvider && result.apiKey) {
      apiStatus = true;
      apiStatusElement.textContent = '已连接';
      apiStatusElement.className = 'api-connected';
    } else {
      apiStatus = false;
      apiStatusElement.textContent = '未连接';
      apiStatusElement.className = 'api-not-connected';
    }
  });
}

// 打开选项页面
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// 打开书签管理器（新的独立页面）
function openBookmarkManager() {
  chrome.tabs.create({ url: 'bookmark-manager.html' });
}

// 打开分析页面并执行特定操作
function openAnalyzePage(action = null) {
  let url = 'analyze.html';
  if (action) {
    url += `?action=${action}`;
  }
  chrome.tabs.create({ url: url });
}