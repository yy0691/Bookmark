/**
 * 历史版本详情查看
 * 用于显示单个历史版本的详细内容
 */

// 全局变量
let historyVersion = null;

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 添加按钮事件监听
  document.getElementById('back-to-history').addEventListener('click', backToHistory);
  document.getElementById('restore-version').addEventListener('click', restoreVersion);
  document.getElementById('export-version').addEventListener('click', exportVersion);
  document.getElementById('search-input').addEventListener('input', searchCategories);
  
  // 从URL获取版本ID
  const params = new URLSearchParams(window.location.search);
  const historyId = params.get('id');
  
  if (historyId) {
    loadVersionDetails(historyId);
  } else {
    showError('未指定历史版本ID');
  }
});

// 返回历史列表页面
function backToHistory() {
  window.location.href = 'history.html';
}

// 加载版本详情
async function loadVersionDetails(historyId) {
  try {
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 查找指定版本
    const version = history.find(entry => entry.id === historyId);
    
    if (!version) {
      showError('未找到指定的历史版本');
      return;
    }
    
    // 保存到全局变量
    historyVersion = version;
    
    // 更新版本信息
    document.getElementById('version-date').textContent = `创建时间: ${version.dateString}`;
    document.getElementById('version-desc').textContent = `描述: ${version.description}`;
    
    // 显示分类列表
    displayCategories(version.categories);
  } catch (error) {
    console.error('加载历史版本详情失败:', error);
    showError('加载历史版本详情失败: ' + error.message);
  }
}

// 显示分类列表
function displayCategories(categories) {
  const container = document.getElementById('categories-container');
  container.innerHTML = '';
  
  // 对分类进行排序（按书签数量降序）
  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1].length - a[1].length);
  
  if (sortedCategories.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center;">此版本没有分类数据</div>';
    return;
  }
  
  // 创建分类项
  sortedCategories.forEach(([categoryName, bookmarks]) => {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.dataset.category = categoryName.toLowerCase();
    
    // 创建分类头部
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.onclick = () => toggleCategory(categoryElement);
    
    const categoryNameElement = document.createElement('div');
    categoryNameElement.className = 'category-name';
    categoryNameElement.textContent = categoryName;
    
    const categoryCount = document.createElement('div');
    categoryCount.className = 'category-count';
    categoryCount.textContent = `${bookmarks.length}`;
    
    const expandIcon = document.createElement('div');
    expandIcon.className = 'category-expand-icon';
    expandIcon.innerHTML = '▼';
    
    categoryHeader.appendChild(categoryNameElement);
    categoryHeader.appendChild(categoryCount);
    categoryHeader.appendChild(expandIcon);
    
    // 创建书签列表
    const bookmarkList = document.createElement('div');
    bookmarkList.className = 'bookmark-list';
    
    // 添加书签项
    bookmarks.forEach(bookmark => {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';
      bookmarkItem.dataset.title = bookmark.title?.toLowerCase() || '';
      bookmarkItem.dataset.url = bookmark.url?.toLowerCase() || '';
      
      const bookmarkTitle = document.createElement('div');
      bookmarkTitle.className = 'bookmark-title';
      bookmarkTitle.textContent = bookmark.title || '无标题';
      
      const bookmarkUrl = document.createElement('div');
      bookmarkUrl.className = 'bookmark-url';
      bookmarkUrl.textContent = bookmark.url;
      
      bookmarkItem.appendChild(bookmarkTitle);
      bookmarkItem.appendChild(bookmarkUrl);
      
      bookmarkList.appendChild(bookmarkItem);
    });
    
    categoryElement.appendChild(categoryHeader);
    categoryElement.appendChild(bookmarkList);
    
    container.appendChild(categoryElement);
  });
}

// 切换分类展开/折叠
function toggleCategory(categoryElement) {
  categoryElement.classList.toggle('category-expanded');
}

// 搜索分类和书签
function searchCategories() {
  const searchText = document.getElementById('search-input').value.trim().toLowerCase();
  const categories = document.querySelectorAll('.category');
  
  categories.forEach(category => {
    const categoryName = category.dataset.category;
    const bookmarkItems = category.querySelectorAll('.bookmark-item');
    
    // 移除所有现有高亮
    category.querySelectorAll('.highlight').forEach(el => {
      el.classList.remove('highlight');
    });
    
    let categoryVisible = false;
    
    // 分类名称匹配
    if (categoryName.includes(searchText)) {
      categoryVisible = true;
      // 高亮分类名称
      if (searchText) {
        const nameElement = category.querySelector('.category-name');
        if (nameElement.textContent.toLowerCase().includes(searchText)) {
          nameElement.classList.add('highlight');
        }
      }
    }
    
    // 检查书签是否匹配
    let bookmarkMatches = 0;
    
    bookmarkItems.forEach(item => {
      const titleMatch = item.dataset.title.includes(searchText);
      const urlMatch = item.dataset.url.includes(searchText);
      
      if (titleMatch || urlMatch) {
        bookmarkMatches++;
        // 高亮匹配部分
        if (searchText) {
          if (titleMatch) {
            item.querySelector('.bookmark-title').classList.add('highlight');
          }
          if (urlMatch) {
            item.querySelector('.bookmark-url').classList.add('highlight');
          }
        }
        item.style.display = 'block';
      } else {
        item.style.display = searchText ? 'none' : 'block';
      }
    });
    
    // 如果有书签匹配，显示分类并展开
    if (bookmarkMatches > 0) {
      categoryVisible = true;
      if (searchText) {
        category.classList.add('category-expanded');
      }
    }
    
    // 显示/隐藏分类
    category.style.display = categoryVisible || !searchText ? 'block' : 'none';
  });
}

// 恢复此版本
async function restoreVersion() {
  if (!historyVersion) {
    showError('没有可恢复的版本');
    return;
  }
  
  if (confirm('确定要恢复此历史版本吗？当前分类将被覆盖。')) {
    try {
      // 保存为当前分类数据
      const storageData = {
        'currentCategories': historyVersion.categories,
        'lastRestore': {
          timestamp: Date.now(),
          fromVersion: historyVersion.id,
          fromTimestamp: historyVersion.timestamp
        }
      };
      
      await chrome.storage.local.set(storageData);
      
      if (confirm('历史版本已恢复。是否返回分析页面查看？')) {
        chrome.tabs.update({ url: 'analyze.html' });
      }
    } catch (error) {
      console.error('恢复历史版本失败:', error);
      showError('恢复历史版本失败: ' + error.message);
    }
  }
}

// 导出为CSV
function exportVersion() {
  if (!historyVersion) {
    showError('没有可导出的数据');
    return;
  }
  
  try {
    // 创建CSV内容
    let csvContent = '类别,标题,URL\n';
    
    for (const [category, items] of Object.entries(historyVersion.categories)) {
      for (const item of items) {
        // 处理CSV特殊字符
        const safeTitle = item.title ? `"${item.title.replace(/"/g, '""')}"` : '';
        const safeUrl = `"${item.url.replace(/"/g, '""')}"`;
        
        csvContent += `"${category}",${safeTitle},${safeUrl}\n`;
      }
    }
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 设置下载属性
    const fileName = `书签分类_${historyVersion.dateString.replace(/[/:]/g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    // 添加到DOM, 触发下载, 然后移除
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出CSV失败:', error);
    showError('导出CSV失败: ' + error.message);
  }
}

// 显示错误信息
function showError(message) {
  const container = document.getElementById('categories-container');
  container.innerHTML = `<div style="padding: 20px; text-align: center; color: #ea4335;">${message}</div>`;
  
  // 更新版本信息
  document.getElementById('version-date').textContent = '创建时间: 未知';
  document.getElementById('version-desc').textContent = '描述: 未知';
} 