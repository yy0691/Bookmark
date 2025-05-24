/**
 * 书签处理Web Worker
 * 用于在后台线程处理书签数据，避免阻塞主线程UI
 */

// 监听主线程消息
self.addEventListener('message', function(e) {
  const { action, data } = e.data;
  
  switch (action) {
    case 'process-bookmarks':
      processBookmarks(data);
      break;
    case 'merge-categories':
      mergeCategories(data);
      break;
    case 'filter-bookmarks':
      filterBookmarks(data);
      break;
    default:
      self.postMessage({
        action: 'error',
        error: `未知操作: ${action}`
      });
  }
});

/**
 * 预处理书签数据
 * 提前进行数据处理和格式化，减轻主线程负担
 */
function processBookmarks(bookmarks) {
  try {
    // 克隆数据避免引用问题
    const processedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      title: bookmark.title || '',
      url: bookmark.url || '',
      parentId: bookmark.parentId,
      // 预处理：提取域名，用于后续分类
      domain: extractDomain(bookmark.url || '')
    }));
    
    // 返回处理后的数据
    self.postMessage({
      action: 'process-bookmarks-result',
      processedBookmarks
    });
  } catch (error) {
    self.postMessage({
      action: 'error',
      error: error.message
    });
  }
}

/**
 * 合并分类结果
 * 在Worker中处理分类合并，减轻主线程负担
 */
function mergeCategories({ existingCategories, newCategories }) {
  try {
    const mergedCategories = { ...existingCategories };
    
    // 合并新分类
    for (const [category, items] of Object.entries(newCategories)) {
      if (!mergedCategories[category]) {
        mergedCategories[category] = [];
      }
      
      mergedCategories[category] = mergedCategories[category].concat(items);
    }
    
    // 返回合并后的分类
    self.postMessage({
      action: 'merge-categories-result',
      mergedCategories
    });
  } catch (error) {
    self.postMessage({
      action: 'error',
      error: error.message
    });
  }
}

/**
 * 根据条件过滤书签
 */
function filterBookmarks({ bookmarks, filterText }) {
  try {
    const lowerFilter = filterText.toLowerCase();
    
    // 过滤书签
    const filteredBookmarks = bookmarks.filter(bookmark => {
      return bookmark.title.toLowerCase().includes(lowerFilter) || 
             bookmark.url.toLowerCase().includes(lowerFilter);
    });
    
    // 返回过滤结果
    self.postMessage({
      action: 'filter-bookmarks-result',
      filteredBookmarks
    });
  } catch (error) {
    self.postMessage({
      action: 'error',
      error: error.message
    });
  }
}

/**
 * 从URL中提取域名
 */
function extractDomain(url) {
  try {
    if (!url) return '';
    
    // 移除协议
    let domain = url.replace(/(https?:\/\/)?(www\.)?/i, '');
    
    // 获取域名部分
    domain = domain.split('/')[0];
    
    return domain;
  } catch (e) {
    return '';
  }
} 