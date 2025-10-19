/**
 * 自定义分类编辑器 - 允许用户在分析结果中编辑分类
 * 支持编辑、合并、删除、重命名分类等操作
 */

class CategoryEditor {
  constructor() {
    this.editHistory = [];          // 编辑历史
    this.categoryMappings = new Map();  // 分类别名映射
    this.categoryAliases = new Map();   // 分类 -> 别名列表
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
    console.log(`[CategoryEditor] ${message}`);
  }

  /**
   * 创建新的编辑会话
   */
  createEditSession(categoryName, color = null) {
    const session = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      categoryName,
      color: color || this.generateCategoryColor(categoryName),
      isActive: true,
      createdAt: Date.now(),
      bookmarksInCategory: [],
      changes: []
    };

    this.log(`🎨 创建编辑会话: "${categoryName}"`, 'info');
    return session;
  }

  /**
   * 为分类生成颜色
   */
  generateCategoryColor(categoryName) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B88B', '#A8D5BA'
    ];
    
    // 根据分类名称生成稳定的颜色
    const hash = categoryName.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 重命名分类
   */
  renameCategory(oldName, newName, affectedBookmarkIds = []) {
    try {
      // 检查新名称是否已存在
      if (this.categoryMappings.has(newName)) {
        throw new Error(`分类 "${newName}" 已存在`);
      }

      const edit = {
        editId: `edit_${Date.now()}`,
        type: 'rename',
        timestamp: Date.now(),
        oldName,
        newName,
        affectedCount: affectedBookmarkIds.length,
        status: 'success'
      };

      // 更新映射
      if (this.categoryMappings.has(oldName)) {
        const mapping = this.categoryMappings.get(oldName);
        this.categoryMappings.delete(oldName);
        this.categoryMappings.set(newName, mapping);
      } else {
        this.categoryMappings.set(newName, newName);
      }

      this.editHistory.push(edit);

      this.log(`✏️ 重命名: "${oldName}" → "${newName}" (影响 ${affectedBookmarkIds.length} 个书签)`, 'success');
      return edit;

    } catch (error) {
      this.log(`❌ 重命名失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 合并分类
   */
  mergeCategories(sourceCategories, targetCategory, affectedBookmarkIds = []) {
    try {
      if (!Array.isArray(sourceCategories) || sourceCategories.length === 0) {
        throw new Error('必须至少提供一个源分类');
      }

      if (!targetCategory) {
        throw new Error('目标分类不能为空');
      }

      // 检查源分类是否包含目标分类
      if (sourceCategories.includes(targetCategory)) {
        throw new Error('源分类不能包含目标分类');
      }

      const edit = {
        editId: `edit_${Date.now()}`,
        type: 'merge',
        timestamp: Date.now(),
        sourceCategories,
        targetCategory,
        affectedCount: affectedBookmarkIds.length,
        status: 'success'
      };

      // 更新映射 - 所有源分类都映射到目标
      for (const source of sourceCategories) {
        this.categoryMappings.set(source, targetCategory);
      }

      // 添加别名
      if (!this.categoryAliases.has(targetCategory)) {
        this.categoryAliases.set(targetCategory, new Set());
      }
      const aliases = this.categoryAliases.get(targetCategory);
      for (const source of sourceCategories) {
        aliases.add(source);
      }

      this.editHistory.push(edit);

      this.log(`🔗 合并: [${sourceCategories.join(', ')}] → "${targetCategory}" (影响 ${affectedBookmarkIds.length} 个书签)`, 'success');
      return edit;

    } catch (error) {
      this.log(`❌ 合并失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 拆分分类
   */
  splitCategory(sourceCategory, newCategories, bookmarkAssignments) {
    try {
      if (!Array.isArray(newCategories) || newCategories.length < 2) {
        throw new Error('必须至少提供两个新分类');
      }

      // 验证新分类名称
      for (const cat of newCategories) {
        if (!cat || typeof cat !== 'string') {
          throw new Error('分类名称必须是非空字符串');
        }
      }

      const edit = {
        editId: `edit_${Date.now()}`,
        type: 'split',
        timestamp: Date.now(),
        sourceCategory,
        newCategories,
        assignments: bookmarkAssignments,
        affectedCount: Object.keys(bookmarkAssignments).length,
        status: 'success'
      };

      // 更新映射
      for (const newCat of newCategories) {
        if (!this.categoryMappings.has(newCat)) {
          this.categoryMappings.set(newCat, newCat);
        }
      }

      // 如果源分类曾经是别名的目标，需要更新
      if (this.categoryMappings.has(sourceCategory)) {
        this.categoryMappings.delete(sourceCategory);
      }

      this.editHistory.push(edit);

      this.log(`✂️ 拆分: "${sourceCategory}" → [${newCategories.join(', ')}]`, 'success');
      return edit;

    } catch (error) {
      this.log(`❌ 拆分失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 批量编辑分类
   */
  batchEditCategories(operations) {
    try {
      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('必须提供至少一个操作');
      }

      const results = [];
      const batch = {
        batchId: `batch_${Date.now()}`,
        timestamp: Date.now(),
        operationCount: operations.length,
        successCount: 0,
        failureCount: 0,
        operations: results
      };

      for (const operation of operations) {
        try {
          let result;

          switch (operation.type) {
            case 'rename':
              result = this.renameCategory(
                operation.oldName,
                operation.newName,
                operation.affectedIds || []
              );
              break;

            case 'merge':
              result = this.mergeCategories(
                operation.sourceCategories,
                operation.targetCategory,
                operation.affectedIds || []
              );
              break;

            case 'split':
              result = this.splitCategory(
                operation.sourceCategory,
                operation.newCategories,
                operation.assignments || {}
              );
              break;

            default:
              throw new Error(`未知的操作类型: ${operation.type}`);
          }

          result.batchId = batch.batchId;
          results.push(result);
          batch.successCount++;

        } catch (error) {
          results.push({
            type: operation.type,
            status: 'failed',
            error: error.message,
            batchId: batch.batchId
          });
          batch.failureCount++;
        }
      }

      this.log(`📦 批量编辑完成: ${batch.successCount}成功, ${batch.failureCount}失败`, 'info');
      return batch;

    } catch (error) {
      this.log(`❌ 批量编辑失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 应用编辑到分类结果
   */
  applyEditsToResults(results) {
    try {
      const updated = [];

      for (const result of results) {
        const updatedResult = { ...result };

        // 应用别名映射
        if (this.categoryMappings.has(result.suggestedCategory)) {
          updatedResult.originalCategory = result.suggestedCategory;
          updatedResult.suggestedCategory = this.categoryMappings.get(result.suggestedCategory);
          updatedResult.edited = true;
        }

        updated.push(updatedResult);
      }

      this.log(`📝 已将编辑应用到 ${updated.length} 个结果`, 'info');
      return updated;

    } catch (error) {
      this.log(`❌ 应用编辑失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取编辑建议（基于频率分析）
   */
  getEditSuggestions(results) {
    try {
      const suggestions = [];

      // 1. 检测相似分类名称
      const categorySet = new Set(results.map(r => r.suggestedCategory));
      const categoryArray = Array.from(categorySet);

      for (let i = 0; i < categoryArray.length; i++) {
        for (let j = i + 1; j < categoryArray.length; j++) {
          const similarity = this.calculateSimilarity(categoryArray[i], categoryArray[j]);
          
          if (similarity > 0.7) {
            suggestions.push({
              type: 'similar_names',
              category1: categoryArray[i],
              category2: categoryArray[j],
              similarity: (similarity * 100).toFixed(1),
              message: `分类 "${categoryArray[i]}" 和 "${categoryArray[j]}" 相似 (${(similarity * 100).toFixed(1)}%)，考虑合并？`,
              severity: 'medium'
            });
          }
        }
      }

      // 2. 检测单项分类（只有1个书签的分类）
      const categoryCounts = {};
      for (const result of results) {
        categoryCounts[result.suggestedCategory] = (categoryCounts[result.suggestedCategory] || 0) + 1;
      }

      for (const [category, count] of Object.entries(categoryCounts)) {
        if (count === 1) {
          suggestions.push({
            type: 'single_item',
            category,
            count,
            message: `分类 "${category}" 只有 1 个书签，考虑合并到其他分类？`,
            severity: 'low'
          });
        }
      }

      // 3. 检测太多分类
      if (categorySet.size > 15) {
        suggestions.push({
          type: 'too_many_categories',
          count: categorySet.size,
          message: `分类太多 (${categorySet.size} 个)，考虑合并相关分类以简化结构？`,
          severity: 'low'
        });
      }

      return suggestions;

    } catch (error) {
      this.log(`⚠️ 获取编辑建议失败: ${error.message}`, 'warning');
      return [];
    }
  }

  /**
   * 计算两个字符串的相似度（Levenshtein距离）
   */
  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxDistance = Math.max(len1, len2);
    return 1 - (matrix[len1][len2] / maxDistance);
  }

  /**
   * 撤销最后一次编辑
   */
  undoLastEdit() {
    try {
      if (this.editHistory.length === 0) {
        this.log('⚠️ 没有可撤销的编辑', 'warning');
        return null;
      }

      const lastEdit = this.editHistory.pop();

      // 撤销的逻辑（反向操作）
      if (lastEdit.type === 'rename') {
        // 恢复旧名称
        if (this.categoryMappings.has(lastEdit.newName)) {
          this.categoryMappings.delete(lastEdit.newName);
        }
        if (lastEdit.oldName) {
          this.categoryMappings.set(lastEdit.oldName, lastEdit.oldName);
        }
      } else if (lastEdit.type === 'merge') {
        // 恢复源分类映射
        for (const source of lastEdit.sourceCategories) {
          this.categoryMappings.set(source, source);
        }
        if (this.categoryAliases.has(lastEdit.targetCategory)) {
          for (const source of lastEdit.sourceCategories) {
            this.categoryAliases.get(lastEdit.targetCategory).delete(source);
          }
        }
      }

      this.log(`↩️ 已撤销 ${lastEdit.type} 操作`, 'info');
      return lastEdit;

    } catch (error) {
      this.log(`❌ 撤销失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 重做最后一次撤销的编辑
   */
  redoLastUndo() {
    try {
      // 需要维护一个重做栈
      // 当前简化实现不支持重做，未来可增强
      this.log('⚠️ 当前版本不支持重做操作', 'warning');
      return null;

    } catch (error) {
      this.log(`❌ 重做失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取编辑统计
   */
  getEditStatistics() {
    const stats = {
      totalEdits: this.editHistory.length,
      byType: {
        rename: 0,
        merge: 0,
        split: 0
      },
      totalAffected: 0,
      categoryCount: this.categoryMappings.size,
      aliasCount: 0
    };

    for (const edit of this.editHistory) {
      if (stats.byType.hasOwnProperty(edit.type)) {
        stats.byType[edit.type]++;
      }
      stats.totalAffected += edit.affectedCount || 0;
    }

    for (const aliases of this.categoryAliases.values()) {
      stats.aliasCount += aliases.size;
    }

    return stats;
  }

  /**
   * 导出编辑配置
   */
  exportEditConfig() {
    return {
      timestamp: Date.now(),
      editHistory: this.editHistory,
      categoryMappings: Object.fromEntries(this.categoryMappings),
      categoryAliases: Object.fromEntries(
        Array.from(this.categoryAliases.entries()).map(([key, value]) => [key, Array.from(value)])
      )
    };
  }

  /**
   * 导入编辑配置
   */
  importEditConfig(config) {
    try {
      if (config.editHistory) {
        this.editHistory = config.editHistory;
      }

      if (config.categoryMappings) {
        this.categoryMappings = new Map(Object.entries(config.categoryMappings));
      }

      if (config.categoryAliases) {
        this.categoryAliases = new Map(
          Object.entries(config.categoryAliases).map(([key, value]) => [key, new Set(value)])
        );
      }

      this.log(`📥 导入编辑配置: ${this.editHistory.length} 条编辑`, 'success');

    } catch (error) {
      this.log(`❌ 导入失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 清空所有编辑
   */
  clearAllEdits() {
    this.editHistory = [];
    this.categoryMappings.clear();
    this.categoryAliases.clear();
    this.log('🗑️ 已清空所有编辑', 'info');
  }

  /**
   * 获取分类建议（常见分类列表）
   */
  getCommonCategoryTemplates() {
    return {
      tech: ['编程', '开发', '框架', '工具', '数据库', '云计算'],
      content: ['文章', '博客', '新闻', '视频', '播客', '电子书'],
      entertainment: ['游戏', '电影', '音乐', '动画', '小说'],
      productivity: ['任务', '笔记', '文档', '项目管理', '日历'],
      reference: ['文档', '教程', '参考', '手册', '指南'],
      social: ['社交媒体', '论坛', '社区', '邮件', '聊天']
    };
  }

  /**
   * 根据模板快速创建分类结构
   */
  createCategoryStructure(templateName) {
    try {
      const templates = this.getCommonCategoryTemplates();

      if (!templates[templateName]) {
        throw new Error(`未知的模板: ${templateName}`);
      }

      const categories = templates[templateName];
      for (const category of categories) {
        this.categoryMappings.set(category, category);
      }

      this.log(`✨ 使用模板 "${templateName}" 创建分类结构: ${categories.join(', ')}`, 'success');
      return categories;

    } catch (error) {
      this.log(`❌ 创建分类结构失败: ${error.message}`, 'error');
      throw error;
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryEditor;
}
