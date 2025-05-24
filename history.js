/**
 * 书签历史版本管理
 * 用于显示和管理书签分类的历史版本记录
 */

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 添加按钮事件监听
  document.getElementById('back-to-analyze').addEventListener('click', backToAnalyze);
  document.getElementById('delete-all-history').addEventListener('click', confirmDeleteAllHistory);
  document.getElementById('close-compare').addEventListener('click', closeCompare);
  
  // 加载历史版本记录
  loadHistory();
});

// 返回分析页面
function backToAnalyze() {
  chrome.tabs.update({ url: 'analyze.html' });
}

// 加载历史版本记录
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="no-history">暂无历史版本记录</div>';
      return;
    }
    
    // 清空容器
    historyList.innerHTML = '';
    
    // 创建历史项目
    history.forEach((entry, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.id = entry.id;
      
      const historyInfo = document.createElement('div');
      historyInfo.className = 'history-info';
      
      const historyDate = document.createElement('div');
      historyDate.className = 'history-date';
      historyDate.textContent = entry.dateString;
      
      const historyDesc = document.createElement('div');
      historyDesc.className = 'history-desc';
      historyDesc.textContent = entry.description;
      
      historyInfo.appendChild(historyDate);
      historyInfo.appendChild(historyDesc);
      
      const historyActions = document.createElement('div');
      historyActions.className = 'history-actions';
      
      // 查看按钮
      const viewButton = document.createElement('button');
      viewButton.className = 'history-action-btn';
      viewButton.textContent = '查看';
      viewButton.addEventListener('click', () => viewHistory(entry.id));
      
      // 恢复按钮
      const restoreButton = document.createElement('button');
      restoreButton.className = 'history-action-btn';
      restoreButton.textContent = '恢复';
      restoreButton.addEventListener('click', () => restoreHistory(entry.id));
      
      // 比较按钮（如果不是第一个版本）
      if (index < history.length - 1) {
        const compareButton = document.createElement('button');
        compareButton.className = 'history-action-btn';
        compareButton.textContent = '比较';
        compareButton.addEventListener('click', () => compareHistory(entry.id, history[index + 1].id));
        historyActions.appendChild(compareButton);
      }
      
      // 删除按钮
      const deleteButton = document.createElement('button');
      deleteButton.className = 'history-action-btn';
      deleteButton.textContent = '删除';
      deleteButton.addEventListener('click', () => deleteHistory(entry.id));
      
      historyActions.appendChild(viewButton);
      historyActions.appendChild(restoreButton);
      historyActions.appendChild(deleteButton);
      
      historyItem.appendChild(historyInfo);
      historyItem.appendChild(historyActions);
      
      historyList.appendChild(historyItem);
    });
    
    // 更新状态
    updateStatus(`已加载 ${history.length} 条历史记录`);
  } catch (error) {
    console.error('加载历史记录失败:', error);
    updateStatus('加载历史记录失败: ' + error.message, 'error');
  }
}

// 查看历史版本详情
async function viewHistory(historyId) {
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 查找指定版本
    const version = history.find(entry => entry.id === historyId);
    
    if (!version) {
      updateStatus('未找到指定的历史版本', 'error');
      return;
    }
    
    // 跳转到临时查看页面
    chrome.tabs.create({ 
      url: `view-history.html?id=${historyId}` 
    });
  } catch (error) {
    console.error('查看历史版本失败:', error);
    updateStatus('查看历史版本失败: ' + error.message, 'error');
  }
}

// 比较两个历史版本
async function compareHistory(newId, oldId) {
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 查找两个版本
    const newVersion = history.find(entry => entry.id === newId);
    const oldVersion = history.find(entry => entry.id === oldId);
    
    if (!newVersion || !oldVersion) {
      updateStatus('未找到需要比较的历史版本', 'error');
      return;
    }
    
    // 显示比较容器
    const compareContainer = document.getElementById('compare-container');
    compareContainer.style.display = 'block';
    
    // 更新比较标题
    document.querySelector('.compare-title').textContent = 
      `版本比较: ${new Date(oldVersion.timestamp).toLocaleString()} → ${new Date(newVersion.timestamp).toLocaleString()}`;
    
    // 清空内容区域
    const oldContent = document.getElementById('compare-old-content');
    const newContent = document.getElementById('compare-new-content');
    oldContent.innerHTML = '';
    newContent.innerHTML = '';
    
    // 获取所有分类
    const allCategories = new Set([
      ...Object.keys(oldVersion.categories),
      ...Object.keys(newVersion.categories)
    ]);
    
    // 对比每个分类
    allCategories.forEach(category => {
      const oldItems = oldVersion.categories[category] || [];
      const newItems = newVersion.categories[category] || [];
      
      // 创建旧版本分类
      if (oldItems.length > 0) {
        const categoryElement = document.createElement('div');
        categoryElement.className = newItems.length === 0 ? 
          'compare-category compare-removed' : 'compare-category compare-unchanged';
        
        const categoryName = document.createElement('div');
        categoryName.className = 'compare-category-name';
        categoryName.textContent = category;
        
        const bookmarkCount = document.createElement('div');
        bookmarkCount.className = 'compare-bookmark-count';
        bookmarkCount.textContent = `${oldItems.length} 个书签`;
        
        categoryElement.appendChild(categoryName);
        categoryElement.appendChild(bookmarkCount);
        oldContent.appendChild(categoryElement);
      }
      
      // 创建新版本分类
      if (newItems.length > 0) {
        const categoryElement = document.createElement('div');
        categoryElement.className = oldItems.length === 0 ? 
          'compare-category compare-added' : 'compare-category compare-unchanged';
        
        const categoryName = document.createElement('div');
        categoryName.className = 'compare-category-name';
        categoryName.textContent = category;
        
        const bookmarkCount = document.createElement('div');
        bookmarkCount.className = 'compare-bookmark-count';
        bookmarkCount.textContent = `${newItems.length} 个书签`;
        
        categoryElement.appendChild(categoryName);
        categoryElement.appendChild(bookmarkCount);
        newContent.appendChild(categoryElement);
      }
    });
    
    // 显示变化统计
    const addedCategories = [...allCategories].filter(cat => 
      !oldVersion.categories[cat] && newVersion.categories[cat]
    ).length;
    
    const removedCategories = [...allCategories].filter(cat => 
      oldVersion.categories[cat] && !newVersion.categories[cat]
    ).length;
    
    updateStatus(`版本比较结果: 新增 ${addedCategories} 个分类, 删除 ${removedCategories} 个分类`);
    
    // 滚动到比较区域
    compareContainer.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('比较历史版本失败:', error);
    updateStatus('比较历史版本失败: ' + error.message, 'error');
  }
}

// 关闭比较视图
function closeCompare() {
  document.getElementById('compare-container').style.display = 'none';
}

// 恢复历史版本
async function restoreHistory(historyId) {
  if (!confirm('确定要恢复此历史版本吗？当前分类将被覆盖。')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 查找指定版本
    const version = history.find(entry => entry.id === historyId);
    
    if (!version) {
      updateStatus('未找到指定的历史版本', 'error');
      return;
    }
    
    // 保存为当前分类数据
    const storageData = {
      'currentCategories': version.categories,
      'lastRestore': {
        timestamp: Date.now(),
        fromVersion: version.id,
        fromTimestamp: version.timestamp
      }
    };
    
    await chrome.storage.local.set(storageData);
    
    updateStatus(`已恢复 ${version.dateString} 的分类结果`, 'success');
    
    // 提示用户
    if (confirm('历史版本已恢复。是否立即返回分析页面查看？')) {
      backToAnalyze();
    }
  } catch (error) {
    console.error('恢复历史版本失败:', error);
    updateStatus('恢复历史版本失败: ' + error.message, 'error');
  }
}

// 删除单个历史版本
async function deleteHistory(historyId) {
  if (!confirm('确定要删除此历史版本吗？此操作无法撤销。')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 过滤掉要删除的版本
    const updatedHistory = history.filter(entry => entry.id !== historyId);
    
    // 保存更新后的历史
    await chrome.storage.local.set({ 'bookmarkHistory': updatedHistory });
    
    // 重新加载历史列表
    loadHistory();
    
    updateStatus('历史版本已删除');
  } catch (error) {
    console.error('删除历史版本失败:', error);
    updateStatus('删除历史版本失败: ' + error.message, 'error');
  }
}

// 确认删除所有历史
function confirmDeleteAllHistory() {
  if (confirm('确定要删除所有历史版本记录吗？此操作无法撤销。')) {
    deleteAllHistory();
  }
}

// 删除所有历史版本
async function deleteAllHistory() {
  try {
    await chrome.storage.local.remove('bookmarkHistory');
    loadHistory();
    updateStatus('所有历史版本记录已删除');
  } catch (error) {
    console.error('删除所有历史版本失败:', error);
    updateStatus('删除所有历史版本失败: ' + error.message, 'error');
  }
}

// 更新状态信息
function updateStatus(message, type = '') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  
  // 清除所有类
  statusElement.className = 'status';
  
  // 添加类型类
  if (type === 'error') {
    statusElement.style.backgroundColor = '#fce8e6';
    statusElement.style.color = '#c5221f';
  } else if (type === 'success') {
    statusElement.style.backgroundColor = '#e6f4ea';
    statusElement.style.color = '#137333';
  } else {
    statusElement.style.backgroundColor = '#f8f9fa';
    statusElement.style.color = '#202124';
  }
} 