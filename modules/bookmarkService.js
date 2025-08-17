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
              originalTitle: node.title
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

  // 使用AI对书签进行分类
  async categorizeBookmarks(bookmarks, settings, apiService) {
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
        this.log(`备用方案说明：基于域名和常见关键词进行智能预分类`, 'info');
        
        const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
          title: b.title || '未命名书签',
          url: b.url || '',
          domain: this.extractDomain(b.url)
        })));
        
        this.log(`预分类完成，共生成${Object.keys(preCategorized).length}个分类`, 'success');
        return preCategorized;
      } else {
        this.log(`网络连接正常，可以调用AI服务`, 'success');
      }
    } catch (networkError) {
      this.log(`网络连接检测异常: ${networkError.message}`, 'error');
      this.log(`将使用预分类作为备用方案`, 'info');
      
      const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
        title: b.title || '未命名书签',
        url: b.url || '',
        domain: this.extractDomain(b.url)
      })));
      
      this.log(`预分类完成，共生成${Object.keys(preCategorized).length}个分类`, 'success');
      return preCategorized;
    }
    
    // 验证API密钥格式
    const keyValidation = apiService.validateApiKey(settings.apiKey, settings.provider);
    if (!keyValidation.valid) {
      this.log(`API密钥验证失败: ${keyValidation.error}`, 'error');
      this.log(`将使用预分类作为备用方案`, 'info');
      const preCategorized = this.performPreCategorization(bookmarks.map(b => ({
        title: b.title || '未命名书签',
        url: b.url || '',
        domain: this.extractDomain(b.url)
      })));
      return preCategorized;
    }
    
    // 统计有效书签数量
    const validBookmarks = bookmarks.filter(b => b.title && b.url).length;
    const totalBookmarks = bookmarks.length;
    if (validBookmarks < totalBookmarks) {
      this.log(`警告: 检测到${totalBookmarks - validBookmarks}个无效书签 (无标题或URL)`, 'warning');
    }
    
    // 预处理：创建更友好的数据集
    const bookmarkData = bookmarks.map(b => {
      let domain = '';
      try {
        if (b.url) {
          const urlObj = new URL(b.url);
          domain = urlObj.hostname.replace(/^www\./, '');
        }
      } catch (e) {
        // URL解析失败，忽略
      }
      
      return {
        title: b.title || domain || '未命名书签',
        url: b.url || '',
        domain: domain
      };
    });
    
    // 预分类
    const preCategorized = this.performPreCategorization(bookmarkData);
    
    // 构建提示词
    const prompt = this.buildCategorizePrompt(bookmarkData, preCategorized);
    
    // 根据API提供商选择合适的处理方法
    let categoryResult;
    try {
      this.log(`开始调用AI进行书签分类...`, 'info');
      
      switch (settings.provider) {
        case 'gemini':
          categoryResult = await apiService.callGeminiApi(prompt, settings.apiKey, settings.model);
          break;
        case 'openai':
          categoryResult = await apiService.callOpenAiApi(prompt, settings.apiKey, settings.model);
          break;
        case 'custom':
          categoryResult = await apiService.callCustomApi(settings.apiKey, settings.customApiUrl, settings.model, prompt);
          break;
        default:
          throw new Error('不支持的API提供商');
      }
      
      this.log(`AI分类完成，获得${Object.keys(categoryResult).length}个分类`, 'success');
      
      // 如果API返回空结果，使用预分类结果
      if (!categoryResult || Object.keys(categoryResult).length === 0) {
        this.log('API返回的分类结果为空，尝试使用预分类结果', 'warning');
        
        if (Object.keys(preCategorized).length > 0) {
          categoryResult = preCategorized;
          this.log(`使用预分类结果: ${Object.keys(preCategorized).length}个分类`, 'info');
        } else {
          categoryResult = { "未分类": bookmarkData };
          this.log(`无法获取有效分类，所有书签归为"未分类"`, 'error');
        }
      }
      
      // 验证并优化分类结果
      return this.validateAndOptimizeCategories(categoryResult, bookmarks.length);
    } catch (error) {
      this.log(`分类处理失败: ${error.message}，尝试使用备用方案`, 'error');
      
      // 出错时使用预分类作为备用方案
      if (Object.keys(preCategorized).length > 0) {
        const uncategorized = bookmarkData.filter(bookmark => {
          return !Object.values(preCategorized).some(items => 
            items.some(item => item.url === bookmark.url)
          );
        });
        
        if (uncategorized.length > 0) {
          preCategorized["其他"] = uncategorized;
        }
        
        this.log(`使用预分类作为备用方案: ${Object.keys(preCategorized).length}个分类`, 'info');
        return preCategorized;
      }
      
      // 如果没有预分类，使用基本分类
      const basicCategories = {
        "常用网站": bookmarkData.slice(0, Math.min(20, bookmarkData.length)),
        "其他书签": bookmarkData.slice(Math.min(20, bookmarkData.length))
      };
      
      this.log(`无法进行分类，使用基本分类方案`, 'warning');
      return basicCategories;
    }
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
    this.log(`预分类统计: 已分类${preCategorizedCount}个 (${((preCategorizedCount/bookmarkData.length)*100).toFixed(1)}%), 未分类${uncategorizedCount}个`, 'info');
    
    return preCategorized;
  }

  // 构建分类提示词
  buildCategorizePrompt(bookmarkData, preCategorized) {
    const preCategorizedInfo = Object.entries(preCategorized)
      .map(([category, items]) => `- ${category}: ${items.length}个书签，例如: ${items.slice(0, 3).map(b => b.title).join(', ')}...`)
      .join('\n');
    
    return `# 角色
你是一名高级数字信息管理员和分类策略专家。你擅长分析大量无序的信息（如浏览器书签），并根据其核心内容和潜在用途，设计出逻辑清晰、分类精细且命名专业的层级结构。

# 核心目标
你的任务是接收一个包含多个书签的JSON数组，并将其智能地、自动地分类。最终输出一个结构化的JSON对象，其中键（key）是分类名称，值（value）是属于该分类的书签对象数组。

# 关键指令与工作流程
1. **分析内容**: 仔细阅读每个书签的title和url，深刻理解其代表的核心主题、领域和用途。
2. **确定分类策略**: 
   * **分类粒度**: 优先创建具体、细致的专业分类，而不是宽泛的大类。例如，将"技术教程"进一步细分为"前端开发教程"、"AI模型训练教程"等。总分类数建议在10到25个之间，具体视内容丰富度而定。
   * **合并同类**: 将语义上高度相似或关联紧密的书签（如多个AI对话工具）合并到同一分类下。避免为单个书签创建分类，也避免过度细分导致分类冗余。
3. **命名规范 (分类标签)**:
   * **专业准确**: 使用简洁、专业、且能精确概括组内所有书签内容的中文词汇作为分类名。
   * **格式限制**: 分类名中严禁使用任何数字、字母或特殊符号。
4. **生成输出**:
   * 严格按照指定的JSON格式输出结果。
   * 除了JSON代码块本身，不要添加任何额外的解释、注释或说明性文字。

# 参考信息
${preCategorizedInfo ? `## 可选的预分类参考 (你可以基于此进行调整或细分)\n${preCategorizedInfo}\n` : ''}

## 分类示例 (用于理解期望的分类风格)
- **AI工具**: 通用AI工具、AI开发平台、AI笔记工具、AI工具教程
- **设计**: UI设计工具、原型设计、UI设计教程、UI设计素材、设计案例、Figma教程
- **开发**: 代码托管、技术教程、前端开发、后端开发、技术问答
- **实用工具**: 翻译工具、图片工具、在线办公
- **学习资源**: 在线课程、技术文档、设计学习

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

# 待分类的书签数据
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
