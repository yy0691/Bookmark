/**
 * 书签同步模块 - 将分类结果同步到浏览器书签
 * 支持自动创建分类文件夹、批量移动书签、撤销操作
 */

export class BookmarkSyncer {
  constructor() {
    this.syncHistory = [];  // 操作历史，用于撤销
    this.categoryFolders = new Map();  // 分类名称 -> 文件夹ID 映射
    this.logCallback = null;
  }

  /**
   * 设置日志回调
   */
  setLogCallback(callback) {
    this.logCallback = callback;
  }

  /**
   * 日志输出
   */
  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
    console.log(`[BookmarkSyncer] ${message}`);
  }

  /**
   * 主同步方法 - 将分类结果应用到书签
   * @param {Array} suggestions - 分类建议数组
   * @param {Object} options - 选项 { parentFolderId, overwrite }
   */
  async syncCategorizedBookmarks(suggestions, options = {}) {
    const startTime = Date.now();
    const result = {
      success: [],
      failed: [],
      skipped: [],
      syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      this.log(`🚀 开始同步 ${suggestions.length} 个书签到分类...`, 'info');

      // 1. 验证输入
      if (!suggestions || suggestions.length === 0) {
        this.log('⚠️ 没有要同步的书签', 'warning');
        return result;
      }

      // 2. 准备分类文件夹结构
      this.log('📁 准备分类文件夹结构...', 'info');
      const categories = [...new Set(suggestions.map(s => s.suggestedCategory))];
      await this.prepareFolders(categories, options.parentFolderId);

      // 3. 批量移动书签
      this.log(`📊 开始批量移动书签到各分类...`, 'info');
      for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        
        try {
          // 获取书签原始位置（用于撤销）
          const bookmark = await this.getBookmark(suggestion.originalId);
          
          if (!bookmark) {
            result.skipped.push({
              id: suggestion.originalId,
              reason: '书签不存在'
            });
            continue;
          }

          // 获取目标文件夹
          const targetFolderId = this.categoryFolders.get(suggestion.suggestedCategory);

          // 移动书签
          await new Promise((resolve, reject) => {
            chrome.bookmarks.move(suggestion.originalId, {
              parentId: targetFolderId
            }, (node) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(node);
            });
          });

          // 记录成功
          result.success.push({
            id: suggestion.originalId,
            title: bookmark.title,
            url: bookmark.url,
            category: suggestion.suggestedCategory,
            originalParentId: bookmark.parentId,
            targetParentId: targetFolderId,
            timestamp: Date.now()
          });

          // 显示进度
          const progress = Math.round((i + 1) / suggestions.length * 100);
          if ((i + 1) % Math.max(1, Math.floor(suggestions.length / 10)) === 0) {
            this.log(`📊 同步进度: ${i + 1}/${suggestions.length} (${progress}%)`, 'info');
          }

        } catch (error) {
          result.failed.push({
            id: suggestion.originalId,
            title: suggestion.title,
            reason: error.message,
            timestamp: Date.now()
          });
          this.log(`❌ 同步失败: ${suggestion.title} - ${error.message}`, 'error');
        }
      }

      // 4. 记录操作历史（用于撤销）
      const duration = Date.now() - startTime;
      this.syncHistory.push({
        ...result,
        duration,
        timestamp: Date.now()
      });

      // 5. 显示统计结果
      this.log(`✅ 同步完成!`, 'success');
      this.log(`  ✓ 成功: ${result.success.length}`, 'info');
      this.log(`  ✗ 失败: ${result.failed.length}`, 'info');
      this.log(`  ⏭️ 跳过: ${result.skipped.length}`, 'info');
      this.log(`  ⏱️ 耗时: ${(duration / 1000).toFixed(2)}秒`, 'info');

      return result;

    } catch (error) {
      this.log(`💥 同步过程出错: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 准备分类文件夹（如果不存在则创建）
   */
  async prepareFolders(categories, parentFolderId = null) {
    try {
      // 获取根文件夹（通常是"其他"）
      if (!parentFolderId) {
        const root = await new Promise((resolve, reject) => {
          try {
            chrome.bookmarks.getTree(resolve);
          } catch (e) {
            reject(e);
          }
        });
        const otherNode = root[0].children && root[0].children.find(node => !node.url && node.title === '其他');
        parentFolderId = otherNode ? otherNode.id : root[0].id;
      }

      // 获取现有文件夹列表
      const existingFolders = await this.getExistingFolders(parentFolderId);

      // 对每个分类创建或获取文件夹
      for (const category of categories) {
        const existing = existingFolders.find(f => f.title === category);

        if (existing) {
          this.categoryFolders.set(category, existing.id);
          this.log(`📂 使用现有文件夹: "${category}"`, 'info');
        } else {
          // 创建新文件夹
          const newFolder = await new Promise((resolve, reject) => {
            chrome.bookmarks.create({
              title: category,
              parentId: parentFolderId
            }, (node) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(node);
            });
          });
          this.categoryFolders.set(category, newFolder.id);
          this.log(`✨ 创建新文件夹: "${category}"`, 'info');
        }
      }

    } catch (error) {
      this.log(`❌ 准备文件夹失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取现有文件夹列表
   */
  async getExistingFolders(parentFolderId) {
    try {
      const node = await new Promise((resolve, reject) => {
        chrome.bookmarks.getSubTree(parentFolderId, (nodes) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(nodes);
        });
      });
      return (node[0].children || []).filter(child => !child.url); // 过滤掉书签，只保留文件夹
    } catch (error) {
      this.log(`⚠️ 获取现有文件夹失败: ${error.message}`, 'warning');
      return [];
    }
  }

  /**
   * 获取单个书签信息
   */
  async getBookmark(bookmarkId) {
    try {
      const bookmarks = await new Promise((resolve, reject) => {
        chrome.bookmarks.get(bookmarkId, (nodes) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(nodes);
        });
      });
      return bookmarks[0] || null;
    } catch (error) {
      this.log(`⚠️ 获取书签信息失败: ${bookmarkId}`, 'warning');
      return null;
    }
  }

  /**
   * 撤销最后一次同步操作
   */
  async undoLastSync() {
    try {
      if (this.syncHistory.length === 0) {
        this.log('⚠️ 没有可撤销的操作', 'warning');
        return null;
      }

      const lastOperation = this.syncHistory.pop();
      this.log(`↩️ 正在撤销最后的同步操作...`, 'info');

      let undoCount = 0;
      for (const item of lastOperation.success) {
        try {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.move(item.id, {
              parentId: item.originalParentId
            }, (node) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(node);
            });
          });
          undoCount++;
        } catch (error) {
          this.log(`❌ 撤销失败: ${item.title} - ${error.message}`, 'error');
        }
      }

      this.log(`✅ 撤销完成! 已恢复 ${undoCount} 个书签`, 'success');
      return undoCount;

    } catch (error) {
      this.log(`💥 撤销过程出错: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取同步历史
   */
  getSyncHistory() {
    return this.syncHistory;
  }

  /**
   * 清空同步历史
   */
  clearHistory() {
    this.syncHistory = [];
  }

  /**
   * 获取上次同步的统计信息
   */
  getLastSyncStats() {
    if (this.syncHistory.length === 0) {
      return null;
    }
    
    const last = this.syncHistory[this.syncHistory.length - 1];
    return {
      success: last.success.length,
      failed: last.failed.length,
      skipped: last.skipped.length,
      duration: last.duration,
      timestamp: last.timestamp
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookmarkSyncer;
}
