/**
 * 书签服务模块 - 处理书签获取、分析、分类等核心功能
 */

export class BookmarkService {
  constructor() {
    this.logCallback = null;
    this.bookmarks = [];
    this.categories = {};
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 获取所有书签
  // 获取完整的书签树
  async getTree() {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree(resolve);
    });
  }

  // 获取最近的书签
  // 搜索书签
  async search(query) {
    if (!query) return [];
    return new Promise((resolve) => {
      chrome.bookmarks.search(query, resolve);
    });
  }

  // 获取最近的书签
  async getRecent(count) {
    return new Promise((resolve) => {
      chrome.bookmarks.getRecent(count, resolve);
    });
  }

  // 获取所有书签
  async getAllBookmarks() {
    if (!this.isExtensionContext) {
      // 浏览器测试环境下的模拟数据
      const mockBookmarks = this.getMockBookmarks();
      this.log(`浏览器测试模式: 使用模拟书签数据 (${mockBookmarks.length}个书签)`, 'info');
      this.bookmarks = mockBookmarks;
      return Promise.resolve(mockBookmarks);
    }

    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks = [];

        this.log(`开始获取书签树...`, 'info');

        // 递归函数，遍历书签树
        const processNode = (node) => {
          if (node.url) {
            // 验证并处理标题
            let processedTitle = node.title || '';
            if (!processedTitle || /^\d+$/.test(processedTitle)) {
              try {
                const url = new URL(node.url);
                processedTitle = url.hostname.replace(/^www\./, '');
                this.log(`发现无效书签标题(${node.title})，已自动替换为: ${processedTitle}`, 'warning');
              } catch (e) {
                processedTitle = node.title || '未命名书签';
              }
            }

            bookmarks.push({
              id: node.id,
              title: processedTitle,
              url: node.url,
              parentId: node.parentId,
              originalTitle: node.title,
              dateAdded: node.dateAdded
            });
          }

          if (node.children) {
            for (const child of node.children) {
              processNode(child);
            }
          }
        };

        // 从根节点开始处理
        for (const node of bookmarkTreeNodes) {
          processNode(node);
        }

        // 统计信息
        const emptyTitles = bookmarks.filter(b => !b.title).length;
        const numericTitles = bookmarks.filter(b => /^\d+$/.test(b.title)).length;
        this.log(`书签获取完成: 总计${bookmarks.length}个书签, ${emptyTitles}个空标题, ${numericTitles}个纯数字标题`, 'info');

        // 域名统计
        const domainMap = {};
        bookmarks.forEach(bookmark => {
          try {
            const url = new URL(bookmark.url);
            const domain = url.hostname.replace(/^www\./, '');
            domainMap[domain] = (domainMap[domain] || 0) + 1;
          } catch (e) {
            // 忽略无效URL
          }
        });

        const topDomains = Object.entries(domainMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        if (topDomains.length > 0) {
          this.log(`最常见的域名:`, 'info');
          topDomains.forEach(([domain, count]) => {
            this.log(`  - ${domain}: ${count}个书签`, 'info');
          });
        }

        this.bookmarks = bookmarks;
        resolve(bookmarks);
      });
    });
  }

  // 获取所有书签（扁平化数组，包含文件夹）
  async getAllBookmarksFlat() {
    if (!this.isExtensionContext) {
      return this.getMockBookmarks();
    }

    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const items = [];

        const processNode = (node) => {
          if (node.id !== '0') { // 跳过根节点
            items.push({
              id: node.id,
              title: node.title || '未命名',
              url: node.url || '',
              parentId: node.parentId,
              dateAdded: node.dateAdded,
              isFolder: !node.url && !!node.children
            });
          }
          if (node.children) {
            for (const child of node.children) {
              processNode(child);
            }
          }
        };

        for (const node of bookmarkTreeNodes) {
          processNode(node);
        }

        resolve(items);
      });
    });
  }

  // 读取浏览器已有的书签文件夹名（顶层2级）
  async getExistingFolderNames() {
    if (!this.isExtensionContext) return [];
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const folderNames = [];
        const systemIds = new Set(['0', '1', '2']); // 根节点、书签栏、其他书签

        const walk = (nodes, depth) => {
          if (depth > 2) return; // 只读前2层
          for (const node of nodes) {
            // 跳过系统根节点，只收集用户创建的文件夹
            if (!node.url && node.children && !systemIds.has(node.id)) {
              folderNames.push(node.title);
            }
            if (node.children) walk(node.children, depth + 1);
          }
        };

        walk(tree, 0);
        resolve(folderNames);
      });
    });
  }

  // 使用AI对书签进行分类（支持分批处理）
  async categorizeBookmarks(bookmarks, settings, apiService, progressCallback, abortSignal, preferences = {}) {
    this.log(`开始预处理书签数据...`, 'info');

    // 如果不在扩展环境中，使用模拟分类结果
    if (!this.isExtensionContext) {
      return this.getMockCategorizedResults(bookmarks);
    }

    // 检查网络连接
    this.log(`检查网络连接状态...`, 'info');
    try {
      const networkConnected = await apiService.checkNetworkConnection();
      if (!networkConnected) {
        this.log(`网络连接检测失败，将使用预分类作为备用方案`, 'warning');
        const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
          title: b.title || '未命名书签', url: b.url || '', domain: this.extractDomain(b.url)
        })));
        this.log(`预分类完成，共生成${Object.keys(preCategorized).length}个分类`, 'success');
        return preCategorized;
      } else {
        this.log(`网络连接正常，可以调用AI服务`, 'success');
      }
    } catch (networkError) {
      this.log(`网络连接检测异常: ${networkError.message}`, 'error');
      const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
        title: b.title || '未命名书签', url: b.url || '', domain: this.extractDomain(b.url)
      })));
      this.log(`预分类完成，共生成${Object.keys(preCategorized).length}个分类`, 'success');
      return preCategorized;
    }

    // 验证API密钥格式
    const keyValidation = apiService.validateApiKey(settings.apiKey, settings.provider);
    if (!keyValidation.valid) {
      this.log(`API密钥验证失败: ${keyValidation.error}`, 'error');
      const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
        title: b.title || '未命名书签', url: b.url || '', domain: this.extractDomain(b.url)
      })));
      return preCategorized;
    }

    // 统计有效书签数量
    const validBookmarks = bookmarks.filter(b => b.title && b.url).length;
    if (validBookmarks < bookmarks.length) {
      this.log(`警告: 检测到${bookmarks.length - validBookmarks}个无效书签 (无标题或URL)`, 'warning');
    }

    // 预处理：创建更友好的数据集
    const bookmarkData = bookmarks.map(b => {
      let domain = '';
      try {
        if (b.url) { domain = new URL(b.url).hostname.replace(/^www\./, ''); }
      } catch (e) { /* ignore */ }
      return { title: b.title || domain || '未命名书签', url: b.url || '', domain };
    });

    // 预分类
    const preCategorized = this.performPreCategorization(bookmarkData);

    // 读取浏览器已有的文件夹名作为初始分类种子（仅用户勾选时）
    let existingFolderNames = [];
    if (preferences.useExistingFolders) {
      try {
        existingFolderNames = await this.getExistingFolderNames();
        if (existingFolderNames.length > 0) {
          this.log(`读取到 ${existingFolderNames.length} 个已有文件夹: ${existingFolderNames.join(', ')}`, 'info');
        }
      } catch (e) {
        this.log(`读取已有文件夹失败: ${e.message}`, 'warning');
      }
    }

    // ── 分批处理逻辑 ──
    const BATCH_SIZE = 50;
    const needsBatching = bookmarkData.length > BATCH_SIZE;

    if (needsBatching) {
      this.log(`书签数量 ${bookmarkData.length} > ${BATCH_SIZE}，启用分批分析`, 'info');
      return this._batchCategorize(bookmarkData, preCategorized, settings, apiService, progressCallback, abortSignal, preferences, existingFolderNames);
    }

    // ── 单批处理（≤50 条） ──
    return this._singleCategorize(bookmarkData, preCategorized, settings, apiService, progressCallback, preferences, existingFolderNames);
  }

  // 单批 AI 分类
  async _singleCategorize(bookmarkData, preCategorized, settings, apiService, progressCallback, preferences = {}, existingFolderNames = []) {
    const prompt = this.buildCategorizePrompt(bookmarkData, preCategorized, preferences, existingFolderNames);

    let categoryResult;
    try {
      this.log(`开始调用AI进行书签分类...`, 'info');
      if (progressCallback) progressCallback(30, 'AI 分析中...');

      categoryResult = await this._callAi(prompt, settings, apiService);

      this.log(`AI分类完成，获得${Object.keys(categoryResult).length}个分类`, 'success');
      if (progressCallback) progressCallback(90, '验证结果...');

      if (!categoryResult || Object.keys(categoryResult).length === 0) {
        this.log('API返回的分类结果为空，尝试使用预分类结果', 'warning');
        categoryResult = Object.keys(preCategorized).length > 0 ? preCategorized : { "未分类": bookmarkData };
      }

      return this.validateAndOptimizeCategories(categoryResult, bookmarkData.length);
    } catch (error) {
      this.log(`分类处理失败: ${error.message}，使用备用方案`, 'error');
      return this._fallbackCategorize(bookmarkData, preCategorized);
    }
  }

  // 分批 AI 分类
  async _batchCategorize(bookmarkData, preCategorized, settings, apiService, progressCallback, abortSignal, preferences = {}, existingFolderNames = []) {
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < bookmarkData.length; i += BATCH_SIZE) {
      batches.push(bookmarkData.slice(i, i + BATCH_SIZE));
    }

    this.log(`共 ${bookmarkData.length} 条书签，分为 ${batches.length} 批处理（每批 ${BATCH_SIZE} 条）`, 'info');
    const mergedCategories = {};

    // 处理单个批次的辅助函数（支持重试拆分）
    const processBatch = async (batch, label, existingCats = []) => {
      const batchPreCat = this.performPreCategorization(batch);
      const prompt = this.buildCategorizePrompt(batch, batchPreCat, preferences, existingCats);
      const batchResult = await this._callAi(prompt, settings, apiService);
      return batchResult;
    };

    // 将结果合并到主结果
    const mergeResult = (result) => {
      for (const [cat, items] of Object.entries(result)) {
        if (!mergedCategories[cat]) mergedCategories[cat] = [];
        mergedCategories[cat] = mergedCategories[cat].concat(items);
      }
    };

    // 失败时回退到预分类
    const fallbackBatch = (batch) => {
      const batchPreCat = this.performPreCategorization(batch);
      mergeResult(batchPreCat);
      const categorized = new Set(Object.values(batchPreCat).flat().map(i => i.url));
      const uncategorized = batch.filter(b => !categorized.has(b.url));
      if (uncategorized.length > 0) {
        if (!mergedCategories["其他"]) mergedCategories["其他"] = [];
        mergedCategories["其他"] = mergedCategories["其他"].concat(uncategorized);
      }
    };

    // 跨批次累积的分类名列表（以已有文件夹名为种子）
    let accumulatedCategoryNames = [...existingFolderNames];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      if (abortSignal?.aborted) {
        this.log('分析已被用户中断', 'warning');
        break;
      }

      const batch = batches[batchIdx];
      const batchNum = batchIdx + 1;
      const pct = Math.round((batchIdx / batches.length) * 100);

      this.log(`处理第 ${batchNum}/${batches.length} 批 (${batch.length} 条)...`, 'info');
      if (progressCallback) progressCallback(pct, `分析第 ${batchNum}/${batches.length} 批...`);

      try {
        // 第一次尝试
        const result = await processBatch(batch, `${batchNum}`, accumulatedCategoryNames);
        mergeResult(result);
        // 累积本批次的分类名
        const newCats = Object.keys(result).filter(c => !accumulatedCategoryNames.includes(c));
        accumulatedCategoryNames = accumulatedCategoryNames.concat(newCats);
        this.log(`第 ${batchNum} 批完成: ${Object.keys(result).length} 个分类 (累计 ${accumulatedCategoryNames.length} 个)`, 'success');
      } catch (error) {
        this.log(`第 ${batchNum} 批失败: ${error.message}，尝试拆分重试...`, 'warning');

        // 拆分成两半重试
        const mid = Math.ceil(batch.length / 2);
        const halfA = batch.slice(0, mid);
        const halfB = batch.slice(mid);
        let anySuccess = false;

        for (const [idx, half] of [[0, halfA], [1, halfB]]) {
          try {
            const result = await processBatch(half, `${batchNum}-${idx + 1}`, accumulatedCategoryNames);
            mergeResult(result);
            const newCats = Object.keys(result).filter(c => !accumulatedCategoryNames.includes(c));
            accumulatedCategoryNames = accumulatedCategoryNames.concat(newCats);
            this.log(`第 ${batchNum} 批拆分 ${idx + 1}/2 成功: ${Object.keys(result).length} 个分类`, 'success');
            anySuccess = true;
          } catch (retryErr) {
            this.log(`第 ${batchNum} 批拆分 ${idx + 1}/2 也失败: ${retryErr.message}，使用预分类`, 'warning');
            fallbackBatch(half);
          }
          // 拆分之间短暂延迟
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // 批次间延迟避免限速
      if (batchIdx < batches.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (progressCallback) progressCallback(95, '验证合并结果...');

    if (Object.keys(mergedCategories).length === 0) {
      return this._fallbackCategorize(bookmarkData, preCategorized);
    }

    return this.validateAndOptimizeCategories(mergedCategories, bookmarkData.length);
  }

  async _callAi(prompt, settings, apiService) {
    this.log(`▶ 调用 AI API: provider=${settings.provider}, model=${settings.model}, prompt长度=${prompt.length}字符`, 'info');
    this.log(`▶ API Key: ${settings.apiKey ? (settings.apiKey.substring(0, 6) + '...已设置') : '❌ 未设置!'}`, 'info');
    if (settings.provider === 'custom') {
      this.log(`▶ 自定义 API URL: ${settings.customApiUrl || '❌ 未设置!'}`, 'info');
    }
    const startTime = Date.now();
    try {
      let result;
      switch (settings.provider) {
        case 'gemini':
          result = await apiService.callGeminiApi(prompt, settings.apiKey, settings.model);
          break;
        case 'openai':
          result = await apiService.callOpenAiApi(prompt, settings.apiKey, settings.model);
          break;
        case 'custom':
          result = await apiService.callCustomApi(settings.apiKey, settings.customApiUrl, settings.model, prompt);
          break;
        default:
          throw new Error('不支持的API提供商');
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.log(`✅ AI 返回成功 (${elapsed}秒): ${Object.keys(result).length} 个分类`, 'success');
      return result;
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.log(`❌ AI 调用失败 (${elapsed}秒): ${err.message}`, 'error');
      throw err;
    }
  }

  // 备用分类方案
  _fallbackCategorize(bookmarkData, preCategorized) {
    if (Object.keys(preCategorized).length > 0) {
      const uncategorized = bookmarkData.filter(b =>
        !Object.values(preCategorized).some(items => items.some(item => item.url === b.url))
      );
      if (uncategorized.length > 0) preCategorized["其他"] = uncategorized;
      this.log(`使用预分类作为备用方案: ${Object.keys(preCategorized).length}个分类`, 'info');
      return preCategorized;
    }
    this.log(`无法进行分类，使用基本分类方案`, 'warning');
    return {
      "常用网站": bookmarkData.slice(0, Math.min(20, bookmarkData.length)),
      "其他书签": bookmarkData.slice(Math.min(20, bookmarkData.length))
    };
  }


  // 执行预分类
  performPreCategorization(bookmarkData) {
    const preCategorized = {};

    // 域名模式匹配
    const domainPatterns = {
      'AI工具': [/gemini\.google\.com/, /openai\.com/, /chat\.openai\.com/, /perplexity\.ai/, /claude\.ai/, /poe\.com/],
      'AI开发平台': [/aistudio\.google\.com/, /platform\.openai\.com/, /colab\.research\.google/, /huggingface\.co/],
      'UI设计工具': [/figma\.com/, /sketch\.com/, /adobe\.com/, /canva\.com/, /framer\.com/],
      '代码托管': [/github\.com/, /gitlab\.com/, /gitee\.com/, /bitbucket\.org/],
      '技术问答': [/stackoverflow\.com/, /stackexchange\.com/, /zhihu\.com/],
      '视频娱乐': [/youtube\.com/, /bilibili\.com/, /netflix\.com/, /youku\.com/, /iqiyi\.com/],
      '社交媒体': [/twitter\.com/, /facebook\.com/, /instagram\.com/, /weibo\.com/, /linkedin\.com/, /reddit\.com/],
      '电商购物': [/taobao\.com/, /jd\.com/, /amazon\.com/, /tmall\.com/, /pinduoduo\.com/],
      '新闻资讯': [/news\./, /sina\.com/, /qq\.com/, /163\.com/, /bbc\./, /cnn\./]
    };

    // 基于书签标题的关键词匹配
    const titleKeywords = {
      'AI工具教程': ['AI教程', 'ChatGPT教程', 'Gemini使用', '人工智能教程', 'AI学习', 'machine learning'],
      'UI设计素材': ['设计素材', 'UI素材', '图标', 'icon', '配色', 'color', '字体', 'font'],
      'UI设计案例': ['设计案例', 'UI案例', '界面设计', '交互设计', 'UX案例', '设计灵感'],
      'Figma教程': ['Figma', 'figma教程', '组件库', 'design system'],
      '前端开发': ['前端', 'frontend', 'Vue', 'React', 'Angular', 'JavaScript'],
      '后端开发': ['后端', 'backend', 'API', 'Node.js', 'Python', 'Java']
    };

    // 尝试预分类
    bookmarkData.forEach(bookmark => {
      let categorized = false;

      // 首先尝试域名匹配
      for (const [category, patterns] of Object.entries(domainPatterns)) {
        if (patterns.some(pattern => pattern.test(bookmark.domain || bookmark.url))) {
          if (!preCategorized[category]) {
            preCategorized[category] = [];
          }
          preCategorized[category].push(bookmark);
          categorized = true;
          break;
        }
      }

      // 如果域名没有匹配到，尝试标题关键词匹配
      if (!categorized && bookmark.title) {
        const title = bookmark.title.toLowerCase();
        for (const [category, keywords] of Object.entries(titleKeywords)) {
          if (keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
            if (!preCategorized[category]) {
              preCategorized[category] = [];
            }
            preCategorized[category].push(bookmark);
            break;
          }
        }
      }
    });

    // 输出预分类结果
    this.log(`预分类结果:`, 'info');
    Object.entries(preCategorized).forEach(([category, items]) => {
      this.log(`  - ${category}: ${items.length}个书签`, 'info');
    });

    const preCategorizedCount = Object.values(preCategorized).reduce((sum, items) => sum + items.length, 0);
    const uncategorizedCount = bookmarkData.length - preCategorizedCount;
    this.log(`预分类统计: 已分类${preCategorizedCount}个 (${((preCategorizedCount / bookmarkData.length) * 100).toFixed(1)}%), 未分类${uncategorizedCount}个`, 'info');

    return preCategorized;
  }

  // 构建分类提示词（支持用户偏好）
  buildCategorizePrompt(bookmarkData, preCategorized, preferences = {}, existingCategories = []) {
    const preCategorizedInfo = Object.entries(preCategorized)
      .map(([category, items]) => `- ${category}: ${items.length}个书签，例如: ${items.slice(0, 3).map(b => b.title).join(', ')}...`)
      .join('\n');

    // 根据粒度设置分类数量
    const granularity = preferences.granularity || 'medium';
    const granularityMap = {
      fine: { min: 15, max: 30, desc: '精细分类，创建尽可能多的具体分类' },
      medium: { min: 10, max: 20, desc: '适中分类，平衡分类数量与粒度' },
      coarse: { min: 5, max: 12, desc: '简洁分类，合并相似类别为更大的分组' }
    };
    const g = granularityMap[granularity] || granularityMap.medium;

    // 用户自定义分类
    const userCategories = preferences.customCategories || '';
    const userCatSection = userCategories.trim()
      ? `\n## 用户指定的分类（请优先使用这些分类名，但可以根据实际内容增补新分类）\n${userCategories.split(/[,，、]/).map(c => `- ${c.trim()}`).join('\n')}\n`
      : '';

    // 语言
    const lang = preferences.language || 'zh';
    const langInstruction = lang === 'en'
      ? '所有分类名请使用英文。'
      : '所有分类名请使用简洁的中文词汇。';

    // 已有分类约束（跨批次）
    const existingCatSection = existingCategories.length > 0
      ? `
## ⚠️ 已有分类（必须优先使用）
以下是之前批次已建立的 ${existingCategories.length} 个分类名。**你必须将书签归入这些已有分类中**，只有当某个书签确实与所有已有分类都不相关时，才可以创建新分类。新分类名不可与已有分类含义重复。
${existingCategories.map(c => `- ${c}`).join('\n')}
`
      : '';

    return `# 角色
你是一名高级数字信息管理员和分类策略专家。你擅长分析大量无序的信息（如浏览器书签），并根据其核心内容和潜在用途，设计出逻辑清晰、分类精细且命名专业的层级结构。

# 核心目标
你的任务是接收一个包含多个书签的JSON数组，并将其智能地、自动地分类。最终输出一个结构化的JSON对象，其中键（key）是分类名称，值（value）是属于该分类的书签对象数组。

# ⚠️ 重要约束
- **必须将所有书签都分配到合适的分类中**，不要遗漏任何书签
- **严禁创建"其他"或"未分类"之类的兜底分类**，每个书签都应该有明确的归属
- 如果某个书签实在难以归类，将它放入最接近的现有分类中

# 关键指令与工作流程
1. **分析内容**: 仔细阅读每个书签的title和url，深刻理解其代表的核心主题、领域和用途。
2. **确定分类策略**: 
   * **分类粒度**: ${g.desc}。总分类数建议在 ${g.min} 到 ${g.max} 个之间。
   * **合并同类**: 将语义上高度相似或关联紧密的书签合并到同一分类下。避免为单个书签创建分类。
   * **确保覆盖**: 确保每个书签都被分到某个分类中，不要遗漏。
3. **命名规范 (分类标签)**:
   * ${langInstruction}
   * 使用简洁、专业、且能精确概括组内书签内容的词汇作为分类名。
4. **生成输出**:
   * 严格按照指定的JSON格式输出结果。
   * 除了JSON代码块本身，不要添加任何额外的解释、注释或说明性文字。

# 参考信息
${existingCatSection}
${preCategorizedInfo ? `## 可选的预分类参考 (你可以基于此进行调整或细分)\n${preCategorizedInfo}\n` : ''}
${userCatSection}
## 分类示例 (示范分类风格和命名规范)
- **AI与智能工具**: AI对话工具、AI开发平台、AI图像生成、AI写作工具
- **设计与创意**: UI设计工具、设计素材、设计灵感、原型工具、配色字体
- **软件开发**: 代码托管、前端框架、后端技术、数据库工具、API文档
- **技术学习**: 技术博客、在线课程、技术文档、编程教程、技术社区
- **效率工具**: 笔记应用、项目管理、在线办公、时间管理、团队协作
- **媒体娱乐**: 视频平台、音乐平台、游戏、在线阅读、播客
- **社交传播**: 社交媒体、论坛社区、即时通讯、个人博客
- **商业金融**: 电商购物、在线支付、投资理财、商业资讯
- **新闻资讯**: 科技新闻、行业资讯、综合新闻、数据统计
- **生活服务**: 地图导航、外卖餐饮、旅行住宿、健康医疗

# 最终输出格式 (必须严格遵守)
\`\`\`json
{
  "分类名A": [
    { "title": "书签标题1", "url": "https://..."},
    { "title": "书签标题2", "url": "https://..."}
  ],
  "分类名B": [
    { "title": "书签标题3", "url": "https://..."}
  ]
}
\`\`\`

# 待分类的书签数据 (共 ${bookmarkData.length} 个)
${JSON.stringify(bookmarkData, null, 2)}`;
  }

  // 验证并优化分类结果
  validateAndOptimizeCategories(categories, totalBookmarks) {
    const MAX_CATEGORIES = 30;
    let categoriesCount = Object.keys(categories).length;

    // 只有在分类数量严重超标时才进行合并
    if (categoriesCount > MAX_CATEGORIES) {
      this.log(`分类数量(${categoriesCount})超过最大限制(${MAX_CATEGORIES})，正在适度优化...`, 'warning');

      const categoriesWithCount = Object.entries(categories)
        .map(([name, items]) => ({ name, count: items.length }))
        .sort((a, b) => b.count - a.count);

      const mainCategories = categoriesWithCount.slice(0, MAX_CATEGORIES - 5);
      const smallCategories = categoriesWithCount.slice(MAX_CATEGORIES - 5);

      const verySmallCategories = smallCategories.filter(cat => cat.count <= 1);
      const keepCategories = smallCategories.filter(cat => cat.count > 1);

      const optimizedCategories = {};

      mainCategories.forEach(cat => {
        optimizedCategories[cat.name] = categories[cat.name];
      });

      keepCategories.forEach(cat => {
        optimizedCategories[cat.name] = categories[cat.name];
      });

      if (verySmallCategories.length > 0) {
        optimizedCategories["其他"] = optimizedCategories["其他"] || [];
        verySmallCategories.forEach(cat => {
          optimizedCategories["其他"] = optimizedCategories["其他"].concat(categories[cat.name]);
        });
        this.log(`已将${verySmallCategories.length}个单书签分类合并到"其他"`, 'info');
      }

      return optimizedCategories;
    }

    // 验证分类名称，修复纯数字或无意义的分类名
    const optimizedCategories = {};
    const numericPattern = /^[\d]+$/;

    Object.entries(categories).forEach(([categoryName, items]) => {
      let newName = categoryName;

      if (numericPattern.test(categoryName) || categoryName.length < 2) {
        newName = this.inferCategoryName(items) || "其他";
        this.log(`已修正无效的分类名"${categoryName}"为"${newName}"`, 'warning');
      }

      if (!optimizedCategories[newName]) {
        optimizedCategories[newName] = [];
      }
      optimizedCategories[newName] = optimizedCategories[newName].concat(items);
    });

    this.log(`分类验证完成，保留${Object.keys(optimizedCategories).length}个分类`, 'success');

    return optimizedCategories;
  }

  // 尝试根据书签内容推断分类名称
  inferCategoryName(bookmarks) {
    const domainCategories = {
      'github.com': '程序开发',
      'youtube.com': '视频娱乐',
      'bilibili.com': '视频娱乐',
      'zhihu.com': '问答社区',
      'taobao.com': '网上购物',
      'jd.com': '网上购物',
      'weibo.com': '社交媒体',
      'twitter.com': '社交媒体',
      'stackoverflow.com': '技术问答',
      'docs.google.com': '在线办公',
      'notion.so': '在线办公'
    };

    const domains = bookmarks.map(bm => {
      try {
        if (!bm.url) return '';
        const urlObj = new URL(bm.url);
        return urlObj.hostname;
      } catch {
        return '';
      }
    }).filter(Boolean);

    const categoryMatches = {};

    domains.forEach(domain => {
      for (const [pattern, category] of Object.entries(domainCategories)) {
        if (domain.includes(pattern)) {
          categoryMatches[category] = (categoryMatches[category] || 0) + 1;
        }
      }
    });

    let bestCategory = null;
    let maxMatches = 0;

    for (const [category, matches] of Object.entries(categoryMatches)) {
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    if (bestCategory && maxMatches >= domains.length * 0.2) {
      return bestCategory;
    }

    return null;
  }

  // 提取域名
  extractDomain(url) {
    try {
      if (url) {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
      }
    } catch (e) {
      // URL解析失败，忽略
    }
    return '';
  }

  // 获取模拟书签数据用于浏览器测试
  getMockBookmarks() {
    return [
      {
        id: "1",
        title: "GitHub",
        url: "https://github.com",
        parentId: "0"
      },
      {
        id: "2",
        title: "ChatGPT",
        url: "https://chat.openai.com",
        parentId: "0"
      },
      {
        id: "3",
        title: "Figma",
        url: "https://figma.com",
        parentId: "0"
      },
      {
        id: "4",
        title: "Vue.js 官方文档",
        url: "https://vuejs.org",
        parentId: "0"
      },
      {
        id: "5",
        title: "Stack Overflow",
        url: "https://stackoverflow.com",
        parentId: "0"
      },
      {
        id: "6",
        title: "YouTube",
        url: "https://youtube.com",
        parentId: "0"
      },
      {
        id: "7",
        title: "淘宝网",
        url: "https://taobao.com",
        parentId: "0"
      },
      {
        id: "8",
        title: "知乎",
        url: "https://zhihu.com",
        parentId: "0"
      },
      {
        id: "9",
        title: "Gemini",
        url: "https://gemini.google.com",
        parentId: "0"
      },
      {
        id: "10",
        title: "React 文档",
        url: "https://react.dev",
        parentId: "0"
      }
    ];
  }

  // 获取模拟分类结果用于浏览器测试
  getMockCategorizedResults(bookmarks) {
    this.log('浏览器测试模式: 使用模拟AI分类结果', 'info');

    // 模拟AI分类结果
    const categories = {
      "AI工具": [
        { title: "ChatGPT", url: "https://chat.openai.com", domain: "chat.openai.com" },
        { title: "Gemini", url: "https://gemini.google.com", domain: "gemini.google.com" }
      ],
      "代码托管": [
        { title: "GitHub", url: "https://github.com", domain: "github.com" }
      ],
      "UI设计工具": [
        { title: "Figma", url: "https://figma.com", domain: "figma.com" }
      ],
      "前端开发": [
        { title: "Vue.js 官方文档", url: "https://vuejs.org", domain: "vuejs.org" },
        { title: "React 文档", url: "https://react.dev", domain: "react.dev" }
      ],
      "技术问答": [
        { title: "Stack Overflow", url: "https://stackoverflow.com", domain: "stackoverflow.com" }
      ],
      "视频娱乐": [
        { title: "YouTube", url: "https://youtube.com", domain: "youtube.com" }
      ],
      "电商购物": [
        { title: "淘宝网", url: "https://taobao.com", domain: "taobao.com" }
      ],
      "问答社区": [
        { title: "知乎", url: "https://zhihu.com", domain: "zhihu.com" }
      ]
    };

    // 模拟处理延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        this.log(`模拟AI分类完成，生成${Object.keys(categories).length}个分类`, 'success');
        resolve(categories);
      }, 1500);
    });
  }

  // 合并分类结果
  mergeCategoryResults(batchCategories) {
    for (const [category, items] of Object.entries(batchCategories)) {
      if (!this.categories[category]) {
        this.categories[category] = [];
      }
      this.categories[category] = this.categories[category].concat(items);
    }
  }

  // 创建书签文件夹
  async createBookmarkFolder(title, parentId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.getChildren(parentId, (children) => {
        const existingFolder = children.find(child =>
          child.title === title && !child.url
        );

        if (existingFolder) {
          resolve(existingFolder);
        } else {
          chrome.bookmarks.create({
            parentId: parentId,
            title: title
          }, (newFolder) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(newFolder);
            }
          });
        }
      });
    });
  }

  // 移动书签
  async moveBookmark(bookmarkId, newParentId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.move(bookmarkId, { parentId: newParentId }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 提取域名
  extractDomain(url) {
    try {
      if (url) {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
      }
    } catch (e) {
      // URL解析失败，忽略
    }
    return '';
  }
}
