// 全局变量
let apiStatus = false;

// 初始化弹出窗口
document.addEventListener('DOMContentLoaded', () => {
  // 获取API状态
  checkApiStatus();
  
  // 添加按钮事件监听
  document.getElementById('analyze-bookmarks').addEventListener('click', openAnalyzePage);
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

// 打开独立分析页面
function openAnalyzePage() {
  chrome.tabs.create({ url: 'analyze.html' });
}