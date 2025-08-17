/**
 * 检测服务模块 - 处理重复书签、失效书签、空文件夹检测
 */

export class DetectionService {
  constructor() {
    this.logCallback = null;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;
    this.cache = {
      bookmarkValidityCache: new Map(), // URL -> {valid, timestamp, error}
      duplicateCache: null, // 重复检测缓存
      emptyFolderCache: null, // 空文件夹缓存
      lastBookmarkHash: null, // 书签数据哈希，用于检测变化
      cacheExpiry: 24 * 60 * 60 * 1000 // 24小时缓存过期时间
    };
    if (this.isExtensionContext) {
      this.loadCacheFromStorage();
    }
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 从存储加载缓存
  async loadCacheFromStorage() {
    try {
      const result = await chrome.storage.local.get(['detectionCache']);
      if (result.detectionCache) {
        const savedCache = result.detectionCache;
        // 恢复Map对象
        this.cache.bookmarkValidityCache = new Map(savedCache.bookmarkValidityCache || []);
        this.cache.duplicateCache = savedCache.duplicateCache;
        this.cache.emptyFolderCache = savedCache.emptyFolderCache;
        this.cache.lastBookmarkHash = savedCache.lastBookmarkHash;
        
        // 清理过期缓存
        this.cleanExpiredCache();
      }
    } catch (error) {
      this.log(`加载缓存失败: ${error.message}`, 'error');
    }
  }

  // 保存缓存到存储
  async saveCacheToStorage() {
    try {
      const cacheToSave = {
        bookmarkValidityCache: Array.from(this.cache.bookmarkValidityCache.entries()),
        duplicateCache: this.cache.duplicateCache,
        emptyFolderCache: this.cache.emptyFolderCache,
        lastBookmarkHash: this.cache.lastBookmarkHash
      };
      await chrome.storage.local.set({ detectionCache: cacheToSave });
    } catch (error) {
      this.log(`保存缓存失败: ${error.message}`, 'error');
    }
  }

  // 清理过期缓存
  cleanExpiredCache() {
    const now = Date.now();
    const expiredUrls = [];
    
    for (const [url, data] of this.cache.bookmarkValidityCache) {
      if (now - data.timestamp > this.cache.cacheExpiry) {
        expiredUrls.push(url);
      }
    }
    
    expiredUrls.forEach(url => this.cache.bookmarkValidityCache.delete(url));
    
    if (expiredUrls.length > 0) {
      this.log(`清理了${expiredUrls.length}个过期缓存项`, 'info');
    }
  }

  // 生成书签数据哈希
  generateBookmarkHash(bookmarks) {
    const sortedBookmarks = bookmarks
      .map(b => `${b.id}:${b.url}:${b.title}`)
      .sort()
      .join('|');
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < sortedBookmarks.length; i++) {
      const char = sortedBookmarks.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  // 检查缓存是否有效
  isCacheValid(bookmarks) {
    const currentHash = this.generateBookmarkHash(bookmarks);
    return this.cache.lastBookmarkHash === currentHash;
  }

  // 检测重复书签
  async detectDuplicateBookmarks() {
    this.log('开始检测重复书签...', 'info');
    
    if (!this.isExtensionContext) {
      // 浏览器测试模式下的模拟数据
      this.log('浏览器测试模式: 使用模拟重复检测结果', 'info');
      return this.getMockDuplicateResults();
    }
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks = [];
        
        // 递归收集所有书签
        const collectBookmarksRecursive = (nodes) => {
          for (const node of nodes) {
            if (node.url) {
              bookmarks.push({
                id: node.id,
                title: node.title,
                url: node.url,
                parentId: node.parentId
              });
            }
            if (node.children) {
              collectBookmarksRecursive(node.children);
            }
          }
        };
        
        collectBookmarksRecursive(bookmarkTreeNodes);
        
        // 检查缓存是否有效
        if (this.cache.duplicateCache && this.isCacheValid(bookmarks)) {
          this.log('使用缓存的重复检测结果', 'info');
          resolve(this.cache.duplicateCache);
          return;
        }
        
        this.log('执行新的重复检测...', 'info');
        
        const urlMap = new Map();
        const titleMap = new Map();
        
        // 按URL分组检测重复
        bookmarks.forEach(bookmark => {
          const normalizedUrl = this.normalizeUrl(bookmark.url);
          if (!urlMap.has(normalizedUrl)) {
            urlMap.set(normalizedUrl, []);
          }
          urlMap.get(normalizedUrl).push(bookmark);
        });
        
        // 按标题分组检测重复
        bookmarks.forEach(bookmark => {
          const normalizedTitle = bookmark.title.toLowerCase().trim();
          if (normalizedTitle) {
            if (!titleMap.has(normalizedTitle)) {
              titleMap.set(normalizedTitle, []);
            }
            titleMap.get(normalizedTitle).push(bookmark);
          }
        });
        
        // 找出重复项
        const duplicatesByUrl = [];
        const duplicatesByTitle = [];
        
        urlMap.forEach((bookmarkList, url) => {
          if (bookmarkList.length > 1) {
            duplicatesByUrl.push({
              url: url,
              bookmarks: bookmarkList,
              count: bookmarkList.length
            });
          }
        });
        
        titleMap.forEach((bookmarkList, title) => {
          if (bookmarkList.length > 1) {
            duplicatesByTitle.push({
              title: title,
              bookmarks: bookmarkList,
              count: bookmarkList.length
            });
          }
        });
        
        const result = {
          total: bookmarks.length,
          duplicatesByUrl: duplicatesByUrl,
          duplicatesByTitle: duplicatesByTitle,
          urlDuplicateCount: duplicatesByUrl.reduce((sum, group) => sum + group.count - 1, 0),
          titleDuplicateCount: duplicatesByTitle.reduce((sum, group) => sum + group.count - 1, 0),
          timestamp: Date.now()
        };
        
        // 更新缓存
        this.cache.duplicateCache = result;
        this.cache.lastBookmarkHash = this.generateBookmarkHash(bookmarks);
        this.saveCacheToStorage();
        
        this.log(`重复检测完成: 发现${result.urlDuplicateCount}个URL重复, ${result.titleDuplicateCount}个标题重复`, 'success');
        resolve(result);
      });
    });
  }

  // 检测失效书签
  async detectInvalidBookmarks() {
    this.log('开始检测失效书签...', 'info');
    
    if (!this.isExtensionContext) {
      // 浏览器测试模式下的模拟数据
      this.log('浏览器测试模式: 使用模拟失效检测结果', 'info');
      return this.getMockInvalidResults();
    }
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
        const bookmarks = [];
        
        // 递归收集所有书签
        const collectBookmarksRecursive = (nodes) => {
          for (const node of nodes) {
            if (node.url) {
              bookmarks.push({
                id: node.id,
                title: node.title,
                url: node.url,
                parentId: node.parentId
              });
            }
            if (node.children) {
              collectBookmarksRecursive(node.children);
            }
          }
        };
        
        collectBookmarksRecursive(bookmarkTreeNodes);
        
        const invalidBookmarks = [];
        const validBookmarks = [];
        const batchSize = 10;
        let cacheHits = 0;
        let newChecks = 0;
        
        this.log(`开始检测${bookmarks.length}个书签的有效性...`, 'info');
        
        // 分批检测以避免过多并发请求
        for (let i = 0; i < bookmarks.length; i += batchSize) {
          const batch = bookmarks.slice(i, i + batchSize);
          const batchPromises = batch.map(bookmark => {
            // 检查缓存
            const cachedResult = this.cache.bookmarkValidityCache.get(bookmark.url);
            if (cachedResult && (Date.now() - cachedResult.timestamp < this.cache.cacheExpiry)) {
              cacheHits++;
              return Promise.resolve(cachedResult);
            } else {
              newChecks++;
              return this.checkBookmarkValidity(bookmark);
            }
          });
          
          try {
            const results = await Promise.allSettled(batchPromises);
            
            results.forEach((result, index) => {
              const bookmark = batch[index];
              if (result.status === 'fulfilled' && result.value.valid) {
                validBookmarks.push(bookmark);
              } else {
                invalidBookmarks.push({
                  ...bookmark,
                  error: result.status === 'rejected' ? result.reason : result.value.error
                });
              }
            });
            
            // 更新进度
            const progress = Math.min(i + batchSize, bookmarks.length);
            this.log(`检测进度: ${progress}/${bookmarks.length} (缓存命中: ${cacheHits}, 新检测: ${newChecks})`, 'info');
            
          } catch (error) {
            this.log(`批次检测失败: ${error.message}`, 'error');
          }
          
          // 添加延迟避免请求过于频繁
          if (i + batchSize < bookmarks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const result = {
          total: bookmarks.length,
          valid: validBookmarks.length,
          invalid: invalidBookmarks.length,
          invalidBookmarks: invalidBookmarks,
          cacheStats: {
            hits: cacheHits,
            newChecks: newChecks,
            hitRate: bookmarks.length > 0 ? (cacheHits / bookmarks.length * 100).toFixed(1) + '%' : '0%'
          },
          timestamp: Date.now()
        };
        
        // 保存缓存
        this.saveCacheToStorage();
        
        this.log(`失效检测完成: ${result.valid}个有效, ${result.invalid}个失效 (缓存命中率: ${result.cacheStats.hitRate})`, 'success');
        resolve(result);
      });
    });
  }

  // 检测空文件夹
  async detectEmptyFolders() {
    this.log('开始检测空文件夹...', 'info');
    
    if (!this.isExtensionContext) {
      // 浏览器测试模式下的模拟数据
      this.log('浏览器测试模式: 使用模拟空文件夹检测结果', 'info');
      return this.getMockEmptyFolderResults();
    }
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const emptyFolders = [];
        
        // 递归检测空文件夹
        const checkEmptyFoldersRecursive = (nodes) => {
          for (const node of nodes) {
            if (!node.url) { // 是文件夹
              const hasBookmarksOrFolders = node.children && node.children.length > 0;
              
              if (!hasBookmarksOrFolders) {
                // 完全空的文件夹
                emptyFolders.push({
                  id: node.id,
                  title: node.title,
                  parentId: node.parentId,
                  type: 'empty'
                });
              } else {
                // 检查是否只包含空文件夹
                const hasValidContent = this.hasValidContent(node);
                if (!hasValidContent) {
                  emptyFolders.push({
                    id: node.id,
                    title: node.title,
                    parentId: node.parentId,
                    type: 'nested_empty'
                  });
                }
                
                // 递归检查子文件夹
                checkEmptyFoldersRecursive(node.children);
              }
            }
          }
        };
        
        checkEmptyFoldersRecursive(bookmarkTreeNodes);
        
        const result = {
          emptyFolders: emptyFolders,
          count: emptyFolders.length
        };
        
        this.log(`空文件夹检测完成: 发现${result.count}个空文件夹`, 'success');
        resolve(result);
      });
    });
  }

  // 检查文件夹是否有有效内容
  hasValidContent(folder) {
    if (!folder.children || folder.children.length === 0) {
      return false;
    }
    
    for (const child of folder.children) {
      if (child.url) {
        // 有书签，算作有效内容
        return true;
      } else {
        // 是子文件夹，递归检查
        if (this.hasValidContent(child)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // 检查单个书签的有效性
  async checkBookmarkValidity(bookmark) {
    try {
      // 基本URL格式检查
      if (!bookmark.url || typeof bookmark.url !== 'string') {
        const result = { valid: false, error: 'URL为空或格式无效', timestamp: Date.now() };
        this.cache.bookmarkValidityCache.set(bookmark.url, result);
        return result;
      }
      
      // URL格式验证
      let url;
      try {
        url = new URL(bookmark.url);
      } catch (e) {
        const result = { valid: false, error: 'URL格式无效', timestamp: Date.now() };
        this.cache.bookmarkValidityCache.set(bookmark.url, result);
        return result;
      }
      
      // 检查协议
      if (!['http:', 'https:', 'ftp:', 'file:'].includes(url.protocol)) {
        const result = { valid: false, error: `不支持的协议: ${url.protocol}`, timestamp: Date.now() };
        this.cache.bookmarkValidityCache.set(bookmark.url, result);
        return result;
      }
      
      // 对于本地文件，不进行网络检查
      if (url.protocol === 'file:') {
        const result = { valid: true, timestamp: Date.now() };
        this.cache.bookmarkValidityCache.set(bookmark.url, result);
        return result;
      }
      
      // 网络可达性检查
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      try {
        const response = await fetch(bookmark.url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors' // 避免CORS问题
        });
        
        clearTimeout(timeoutId);
        
        // 对于no-cors模式，无法获取具体状态码，只要没有抛出异常就认为是可达的
        const result = { valid: true, timestamp: Date.now() };
        this.cache.bookmarkValidityCache.set(bookmark.url, result);
        return result;
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          const result = { valid: false, error: '请求超时', timestamp: Date.now() };
          this.cache.bookmarkValidityCache.set(bookmark.url, result);
          return result;
        }
        
        // 尝试使用GET请求作为备选方案
        try {
          const getResponse = await fetch(bookmark.url, {
            method: 'GET',
            signal: new AbortController().signal,
            mode: 'no-cors'
          });
          const result = { valid: true, timestamp: Date.now() };
          this.cache.bookmarkValidityCache.set(bookmark.url, result);
          return result;
        } catch (getError) {
          const result = { valid: false, error: `网络错误: ${fetchError.message}`, timestamp: Date.now() };
          this.cache.bookmarkValidityCache.set(bookmark.url, result);
          return result;
        }
      }
      
    } catch (error) {
      const result = { valid: false, error: `检查失败: ${error.message}`, timestamp: Date.now() };
      this.cache.bookmarkValidityCache.set(bookmark.url, result);
      return result;
    }
  }

  // 标准化URL用于重复检测
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // 移除www前缀
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // 移除尾部斜杠
      let pathname = urlObj.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      
      // 重新构建标准化的URL
      return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}`;
      
    } catch (e) {
      // 如果URL解析失败，返回原始URL
      return url.toLowerCase();
    }
  }

  // 删除重复书签
  async removeDuplicateBookmarks(duplicates, keepFirst = true) {
    let removedCount = 0;
    
    for (const duplicateGroup of duplicates) {
      const bookmarksToRemove = keepFirst ? 
        duplicateGroup.bookmarks.slice(1) : 
        duplicateGroup.bookmarks.slice(0, -1);
      
      for (const bookmark of bookmarksToRemove) {
        try {
          await this.removeBookmark(bookmark.id);
          removedCount++;
          this.log(`已删除重复书签: ${bookmark.title}`, 'info');
        } catch (error) {
          this.log(`删除书签失败 ${bookmark.title}: ${error.message}`, 'error');
        }
      }
    }
    
    this.log(`重复书签清理完成: 删除了${removedCount}个重复项`, 'success');
    return removedCount;
  }

  // 删除失效书签
  async removeInvalidBookmarks(invalidBookmarks) {
    let removedCount = 0;
    
    for (const bookmark of invalidBookmarks) {
      try {
        await this.removeBookmark(bookmark.id);
        removedCount++;
        this.log(`已删除失效书签: ${bookmark.title}`, 'info');
      } catch (error) {
        this.log(`删除书签失败 ${bookmark.title}: ${error.message}`, 'error');
      }
    }
    
    this.log(`失效书签清理完成: 删除了${removedCount}个失效书签`, 'success');
    return removedCount;
  }

  // 删除空文件夹
  async removeEmptyFolders(emptyFolders) {
    let removedCount = 0;
    
    // 按层级排序，先删除深层的文件夹
    const sortedFolders = emptyFolders.sort((a, b) => {
      // 简单的深度估算：通过ID长度或其他方式
      return b.id.localeCompare(a.id);
    });
    
    for (const folder of sortedFolders) {
      try {
        await this.removeBookmark(folder.id);
        removedCount++;
        this.log(`已删除空文件夹: ${folder.title}`, 'info');
      } catch (error) {
        this.log(`删除文件夹失败 ${folder.title}: ${error.message}`, 'error');
      }
    }
    
    this.log(`空文件夹清理完成: 删除了${removedCount}个空文件夹`, 'success');
    return removedCount;
  }

  // 删除书签
  async removeBookmark(id) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.removeTree(id, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 生成检测报告
  generateDetectionReport(duplicates, invalid, emptyFolders) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        duplicateBookmarks: duplicates.urlDuplicateCount + duplicates.titleDuplicateCount,
        invalidBookmarks: invalid.invalid,
        emptyFolders: emptyFolders.count,
        totalIssues: duplicates.urlDuplicateCount + duplicates.titleDuplicateCount + invalid.invalid + emptyFolders.count
      },
      details: {
        duplicates: duplicates,
        invalid: invalid,
        emptyFolders: emptyFolders
      }
    };
    
    this.log(`检测报告生成完成: 发现${report.summary.totalIssues}个问题`, 'info');
    return report;
  }

  // 缓存管理功能
  getCacheStats() {
    return {
      validityCache: {
        size: this.cache.bookmarkValidityCache.size,
        entries: Array.from(this.cache.bookmarkValidityCache.entries()).map(([url, data]) => ({
          url: url.length > 50 ? url.substring(0, 50) + '...' : url,
          valid: data.valid,
          timestamp: new Date(data.timestamp).toLocaleString(),
          age: Math.floor((Date.now() - data.timestamp) / (1000 * 60 * 60)) + '小时前'
        }))
      },
      duplicateCache: this.cache.duplicateCache ? {
        timestamp: new Date(this.cache.duplicateCache.timestamp).toLocaleString(),
        urlDuplicates: this.cache.duplicateCache.urlDuplicateCount,
        titleDuplicates: this.cache.duplicateCache.titleDuplicateCount
      } : null,
      emptyFolderCache: this.cache.emptyFolderCache ? {
        timestamp: new Date(this.cache.emptyFolderCache.timestamp).toLocaleString(),
        count: this.cache.emptyFolderCache.count
      } : null,
      lastBookmarkHash: this.cache.lastBookmarkHash
    };
  }

  // 清理所有缓存
  async clearAllCache() {
    this.cache.bookmarkValidityCache.clear();
    this.cache.duplicateCache = null;
    this.cache.emptyFolderCache = null;
    this.cache.lastBookmarkHash = null;
    
    await this.saveCacheToStorage();
    this.log('所有缓存已清理', 'info');
  }

  // 清理过期缓存
  async clearExpiredCache() {
    const beforeSize = this.cache.bookmarkValidityCache.size;
    this.cleanExpiredCache();
    const afterSize = this.cache.bookmarkValidityCache.size;
    
    await this.saveCacheToStorage();
    this.log(`清理了${beforeSize - afterSize}个过期缓存项`, 'info');
  }

  // 清理特定类型的缓存
  async clearCacheByType(type) {
    switch (type) {
      case 'validity':
        this.cache.bookmarkValidityCache.clear();
        this.log('有效性缓存已清理', 'info');
        break;
      case 'duplicate':
        this.cache.duplicateCache = null;
        this.log('重复检测缓存已清理', 'info');
        break;
      case 'emptyFolder':
        this.cache.emptyFolderCache = null;
        this.log('空文件夹缓存已清理', 'info');
        break;
      default:
        this.log('未知的缓存类型', 'error');
        return;
    }
    
    await this.saveCacheToStorage();
  }

  // 强制刷新检测（忽略缓存）
  async forceRefreshDetection() {
    await this.clearAllCache();
    this.log('缓存已清理，下次检测将重新执行', 'info');
  }

  // 模拟数据方法
  getMockDuplicateResults() {
    return {
      urlDuplicates: [
        {
          url: 'https://example.com',
          bookmarks: [
            { id: '1', title: 'Example Site', url: 'https://example.com' },
            { id: '2', title: 'Example', url: 'https://example.com' }
          ]
        }
      ],
      titleDuplicates: [
        {
          title: 'Test Page',
          bookmarks: [
            { id: '3', title: 'Test Page', url: 'https://test1.com' },
            { id: '4', title: 'Test Page', url: 'https://test2.com' }
          ]
        }
      ],
      urlDuplicateCount: 2,
      titleDuplicateCount: 2,
      totalBookmarks: 100
    };
  }

  getMockInvalidResults() {
    return {
      invalidBookmarks: [
        { id: '5', title: 'Broken Link', url: 'https://broken-site.com', error: 'Network error' },
        { id: '6', title: 'Dead Link', url: 'https://dead-link.com', error: 'Not found' }
      ],
      validBookmarks: [
        { id: '7', title: 'Working Link', url: 'https://google.com' }
      ],
      invalid: 2,
      valid: 1,
      total: 3,
      cacheStats: { hits: 0, misses: 3, hitRate: '0%' }
    };
  }

  getMockEmptyFolderResults() {
    return {
      emptyFolders: [
        { id: '8', title: 'Empty Folder 1', parentId: '0' },
        { id: '9', title: 'Empty Folder 2', parentId: '0' }
      ],
      count: 2,
      totalFolders: 10
    };
  }
}
