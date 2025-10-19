/**
 * 用户反馈学习模块 - 记录用户决策以改进分类规则
 * 通过学习用户的接受/拒绝行为来优化本地分类算法
 */

class FeedbackLearner {
  constructor() {
    this.feedbackHistory = [];          // 反馈历史
    this.categoryPatterns = new Map();  // 分类 -> 模式集合
    this.urlDomainStats = new Map();    // 域名 -> 分类统计
    this.keywordStats = new Map();      // 关键词 -> 分类统计
    this.logCallback = null;
    this.loadFromStorage();
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
    console.log(`[FeedbackLearner] ${message}`);
  }

  /**
   * 记录用户反馈 - 用户接受分类
   */
  recordAcceptance(bookmark, suggestedCategory) {
    try {
      const feedback = {
        bookmarkId: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        suggestedCategory: suggestedCategory,
        userAction: 'accept',
        timestamp: Date.now()
      };

      this.feedbackHistory.push(feedback);
      this.updatePatterns(bookmark, suggestedCategory, 'accept');
      this.syncToStorage();

      this.log(`✅ 记录接受: "${bookmark.title}" → "${suggestedCategory}"`, 'info');
      return feedback;

    } catch (error) {
      this.log(`❌ 记录接受失败: ${error.message}`, 'error');
    }
  }

  /**
   * 记录用户反馈 - 用户拒绝分类
   */
  recordRejection(bookmark, suggestedCategory, userCategory = null) {
    try {
      const feedback = {
        bookmarkId: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        suggestedCategory: suggestedCategory,
        userCategory: userCategory,  // 用户修正后的分类
        userAction: 'reject',
        timestamp: Date.now()
      };

      this.feedbackHistory.push(feedback);
      
      // 如果用户提供了正确分类，记录为学习数据
      if (userCategory) {
        this.updatePatterns(bookmark, userCategory, 'correct');
      }
      
      this.syncToStorage();

      const msg = userCategory 
        ? `⚠️ 记录拒绝: "${bookmark.title}" (建议:${suggestedCategory} → 正确:${userCategory})`
        : `⚠️ 记录拒绝: "${bookmark.title}" (原建议:${suggestedCategory})`;
      
      this.log(msg, 'warning');
      return feedback;

    } catch (error) {
      this.log(`❌ 记录拒绝失败: ${error.message}`, 'error');
    }
  }

  /**
   * 更新分类模式
   */
  updatePatterns(bookmark, category, action) {
    // 1. 提取域名
    const domain = this.extractDomain(bookmark.url);
    if (domain) {
      this.updateDomainStats(domain, category, action);
    }

    // 2. 提取关键词
    const keywords = this.extractKeywords(bookmark.title);
    for (const keyword of keywords) {
      this.updateKeywordStats(keyword, category, action);
    }

    // 3. 更新分类模式
    if (!this.categoryPatterns.has(category)) {
      this.categoryPatterns.set(category, {
        domains: {},
        keywords: {},
        count: 0
      });
    }

    const pattern = this.categoryPatterns.get(category);
    pattern.count++;

    // 记录域名在该分类中的出现
    if (domain) {
      pattern.domains[domain] = (pattern.domains[domain] || 0) + 1;
    }

    // 记录关键词在该分类中的出现
    for (const keyword of keywords) {
      pattern.keywords[keyword] = (pattern.keywords[keyword] || 0) + 1;
    }
  }

  /**
   * 更新域名统计
   */
  updateDomainStats(domain, category, action) {
    if (!this.urlDomainStats.has(domain)) {
      this.urlDomainStats.set(domain, {});
    }

    const stats = this.urlDomainStats.get(domain);
    if (!stats[category]) {
      stats[category] = { accept: 0, reject: 0, correct: 0 };
    }

    if (action === 'accept') {
      stats[category].accept++;
    } else if (action === 'reject') {
      stats[category].reject++;
    } else if (action === 'correct') {
      stats[category].correct++;
    }
  }

  /**
   * 更新关键词统计
   */
  updateKeywordStats(keyword, category, action) {
    if (!this.keywordStats.has(keyword)) {
      this.keywordStats.set(keyword, {});
    }

    const stats = this.keywordStats.get(keyword);
    if (!stats[category]) {
      stats[category] = { accept: 0, reject: 0, correct: 0 };
    }

    if (action === 'accept') {
      stats[category].accept++;
    } else if (action === 'reject') {
      stats[category].reject++;
    } else if (action === 'correct') {
      stats[category].correct++;
    }
  }

  /**
   * 提取域名
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || null;
    } catch {
      return null;
    }
  }

  /**
   * 提取关键词（从标题中）
   */
  extractKeywords(title) {
    if (!title) return [];

    // 分割标题并提取关键词
    const keywords = title
      .toLowerCase()
      .split(/[\s\-_\|\/·,]+/)
      .filter(word => word.length > 2 && word.length < 20);

    return [...new Set(keywords)];  // 去重
  }

  /**
   * 获取反馈统计
   */
  getFeedbackStats() {
    const total = this.feedbackHistory.length;
    const accepts = this.feedbackHistory.filter(f => f.userAction === 'accept').length;
    const rejects = this.feedbackHistory.filter(f => f.userAction === 'reject').length;
    const acceptRate = total > 0 ? (accepts / total * 100).toFixed(1) : 0;

    return {
      total,
      accepts,
      rejects,
      acceptRate: `${acceptRate}%`,
      lastFeedback: this.feedbackHistory[this.feedbackHistory.length - 1]?.timestamp || null
    };
  }

  /**
   * 获取分类准确率
   */
  getCategoryAccuracyRate(category) {
    const feedback = this.feedbackHistory.filter(f => f.suggestedCategory === category);
    if (feedback.length === 0) return null;

    const accepts = feedback.filter(f => f.userAction === 'accept').length;
    return {
      category,
      total: feedback.length,
      accepts,
      accuracy: `${(accepts / feedback.length * 100).toFixed(1)}%`
    };
  }

  /**
   * 获取改进建议（基于反馈）
   */
  getImprovementSuggestions() {
    const suggestions = [];

    // 1. 查找准确率低的分类
    const categoryStats = new Map();
    for (const feedback of this.feedbackHistory) {
      const cat = feedback.suggestedCategory;
      if (!categoryStats.has(cat)) {
        categoryStats.set(cat, { accept: 0, total: 0 });
      }
      const stats = categoryStats.get(cat);
      stats.total++;
      if (feedback.userAction === 'accept') {
        stats.accept++;
      }
    }

    // 分析每个分类
    for (const [category, stats] of categoryStats) {
      const accuracy = stats.total > 0 ? stats.accept / stats.total : 0;
      
      if (accuracy < 0.6 && stats.total >= 5) {
        suggestions.push({
          type: 'low_accuracy',
          category,
          message: `分类 "${category}" 准确率仅 ${(accuracy * 100).toFixed(1)}%（${stats.accept}/${stats.total}）`,
          severity: accuracy < 0.4 ? 'high' : 'medium'
        });
      }
    }

    // 2. 查找常被拒绝的模式
    const rejectedPatterns = {};
    for (const feedback of this.feedbackHistory) {
      if (feedback.userAction === 'reject' && feedback.userCategory) {
        const key = `${feedback.suggestedCategory}_to_${feedback.userCategory}`;
        rejectedPatterns[key] = (rejectedPatterns[key] || 0) + 1;
      }
    }

    for (const [pattern, count] of Object.entries(rejectedPatterns)) {
      if (count >= 3) {
        const [from, to] = pattern.split('_to_');
        suggestions.push({
          type: 'confused_categories',
          message: `系统经常将 "${to.replace(/^/, '')}" 误分为 "${from}"（发生 ${count} 次）`,
          severity: count >= 5 ? 'high' : 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * 根据反馈优化分类建议（学习效果）
   */
  optimizeCategoryByFeedback(bookmark, currentSuggestion) {
    let optimizedCategory = currentSuggestion;
    let confidence = 0.5;

    // 1. 检查域名历史
    const domain = this.extractDomain(bookmark.url);
    if (domain && this.urlDomainStats.has(domain)) {
      const domainStats = this.urlDomainStats.get(domain);
      
      // 找最常关联的分类
      let bestCategory = null;
      let bestScore = 0;
      
      for (const [category, stats] of Object.entries(domainStats)) {
        const score = (stats.correct || 0) * 3 + (stats.accept || 0) * 2 - (stats.reject || 0);
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }

      if (bestCategory && bestScore > 2) {
        optimizedCategory = bestCategory;
        confidence = Math.min(0.95, 0.6 + (bestScore * 0.05));
      }
    }

    // 2. 检查关键词
    const keywords = this.extractKeywords(bookmark.title);
    const keywordVotes = {};
    
    for (const keyword of keywords) {
      if (this.keywordStats.has(keyword)) {
        const stats = this.keywordStats.get(keyword);
        for (const [category, categoryStats] of Object.entries(stats)) {
          const score = (categoryStats.correct || 0) * 3 + (categoryStats.accept || 0) * 2 - (categoryStats.reject || 0);
          keywordVotes[category] = (keywordVotes[category] || 0) + score;
        }
      }
    }

    // 找关键词投票最多的分类
    let bestKeywordCategory = null;
    let bestKeywordScore = 0;
    for (const [category, score] of Object.entries(keywordVotes)) {
      if (score > bestKeywordScore && score > 5) {
        bestKeywordScore = score;
        bestKeywordCategory = category;
      }
    }

    if (bestKeywordCategory) {
      optimizedCategory = bestKeywordCategory;
      confidence = Math.min(0.95, 0.5 + (bestKeywordScore * 0.02));
    }

    return {
      category: optimizedCategory,
      confidence: confidence,
      learnedFrom: bestKeywordCategory ? 'keyword_patterns' : (bestCategory ? 'domain_patterns' : 'current')
    };
  }

  /**
   * 获取学习报告
   */
  getLearningReport() {
    const stats = this.getFeedbackStats();
    const suggestions = this.getImprovementSuggestions();
    
    // 统计所有分类的准确率
    const categoryAccuracies = [];
    const categorySet = new Set();
    for (const feedback of this.feedbackHistory) {
      categorySet.add(feedback.suggestedCategory);
    }
    
    for (const category of categorySet) {
      const accuracy = this.getCategoryAccuracyRate(category);
      if (accuracy) {
        categoryAccuracies.push(accuracy);
      }
    }

    return {
      feedbackStats: stats,
      categoryAccuracies: categoryAccuracies.sort((a, b) => 
        parseFloat(b.accuracy) - parseFloat(a.accuracy)
      ),
      improvementSuggestions: suggestions,
      dominantPatterns: {
        topDomains: Array.from(this.urlDomainStats.entries())
          .map(([domain, stats]) => ({
            domain,
            categories: Object.keys(stats),
            topCategory: Object.entries(stats)
              .map(([cat, s]) => ({ cat, score: (s.correct || 0) * 3 + (s.accept || 0) * 2 }))
              .sort((a, b) => b.score - a.score)[0]
          }))
          .slice(0, 10),
        topKeywords: Array.from(this.keywordStats.entries())
          .map(([keyword, stats]) => ({
            keyword,
            topCategory: Object.entries(stats)
              .map(([cat, s]) => ({ cat, score: (s.correct || 0) * 3 + (s.accept || 0) * 2 }))
              .sort((a, b) => b.score - a.score)[0]
          }))
          .filter(item => item.topCategory?.score > 0)
          .slice(0, 10)
      }
    };
  }

  /**
   * 导出学习数据
   */
  exportLearningData() {
    return {
      timestamp: Date.now(),
      feedbackHistory: this.feedbackHistory,
      categoryPatterns: Object.fromEntries(this.categoryPatterns),
      urlDomainStats: Object.fromEntries(this.urlDomainStats),
      keywordStats: Object.fromEntries(this.keywordStats),
      report: this.getLearningReport()
    };
  }

  /**
   * 导入学习数据
   */
  async importLearningData(data) {
    try {
      if (data.feedbackHistory) {
        this.feedbackHistory = data.feedbackHistory;
      }
      if (data.categoryPatterns) {
        this.categoryPatterns = new Map(Object.entries(data.categoryPatterns));
      }
      if (data.urlDomainStats) {
        this.urlDomainStats = new Map(Object.entries(data.urlDomainStats));
      }
      if (data.keywordStats) {
        this.keywordStats = new Map(Object.entries(data.keywordStats));
      }

      await this.syncToStorage();
      this.log(`✅ 导入学习数据: ${this.feedbackHistory.length} 条反馈`, 'success');

    } catch (error) {
      this.log(`❌ 导入学习数据失败: ${error.message}`, 'error');
    }
  }

  /**
   * 清空学习数据
   */
  async clearLearningData() {
    this.feedbackHistory = [];
    this.categoryPatterns.clear();
    this.urlDomainStats.clear();
    this.keywordStats.clear();
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['feedbackHistory', 'categoryPatterns', 'urlDomainStats', 'keywordStats']);
    }
    
    this.log('🗑️ 已清空所有学习数据', 'info');
  }

  /**
   * 同步到 Chrome Storage
   */
  async syncToStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    try {
      await chrome.storage.local.set({
        feedbackHistory: this.feedbackHistory,
        categoryPatterns: Object.fromEntries(this.categoryPatterns),
        urlDomainStats: Object.fromEntries(this.urlDomainStats),
        keywordStats: Object.fromEntries(this.keywordStats),
        lastSyncTime: Date.now()
      });
    } catch (error) {
      this.log(`⚠️ 同步到 Storage 失败: ${error.message}`, 'warning');
    }
  }

  /**
   * 从 Chrome Storage 加载
   */
  async loadFromStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    try {
      const result = await chrome.storage.local.get([
        'feedbackHistory',
        'categoryPatterns',
        'urlDomainStats',
        'keywordStats'
      ]);

      if (result.feedbackHistory) {
        this.feedbackHistory = result.feedbackHistory;
      }
      if (result.categoryPatterns) {
        this.categoryPatterns = new Map(Object.entries(result.categoryPatterns));
      }
      if (result.urlDomainStats) {
        this.urlDomainStats = new Map(Object.entries(result.urlDomainStats));
      }
      if (result.keywordStats) {
        this.keywordStats = new Map(Object.entries(result.keywordStats));
      }

      console.log(`✅ 从 Storage 加载学习数据: ${this.feedbackHistory.length} 条反馈`);
    } catch (error) {
      console.warn('从 Storage 加载数据失败:', error);
    }
  }

  /**
   * 获取学习进度（用于UI显示）
   */
  getLearningProgress() {
    const stats = this.getFeedbackStats();
    return {
      totalFeedback: stats.total,
      learningLevel: this.calculateLearningLevel(stats.total),
      nextMilestone: this.getNextMilestone(stats.total),
      patternCount: this.categoryPatterns.size,
      domainCount: this.urlDomainStats.size,
      keywordCount: this.keywordStats.size
    };
  }

  /**
   * 计算学习等级
   */
  calculateLearningLevel(feedbackCount) {
    if (feedbackCount < 10) return 'beginner';
    if (feedbackCount < 50) return 'novice';
    if (feedbackCount < 100) return 'intermediate';
    if (feedbackCount < 200) return 'advanced';
    return 'expert';
  }

  /**
   * 获取下个里程碑
   */
  getNextMilestone(feedbackCount) {
    const milestones = [10, 50, 100, 200];
    for (const milestone of milestones) {
      if (feedbackCount < milestone) {
        return { target: milestone, remaining: milestone - feedbackCount };
      }
    }
    return { target: 500, remaining: Math.max(0, 500 - feedbackCount) };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackLearner;
}
