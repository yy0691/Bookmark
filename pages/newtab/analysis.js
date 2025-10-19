/**
 * 智能分析中心 - 书签智能分析和管理
 * 优化版：改进UI反馈、简化代码结构
 */

// 导入模块
import { BookmarkService } from '../../modules/bookmarkService.js';
import { DetectionService } from '../../modules/detectionService.js';
import { ApiService } from '../../modules/apiService.js';
import { BookmarkSyncer } from '../../modules/bookmarkSyncer.js';

// 检查模块导入
console.log('📦 模块导入状态:');
console.log('BookmarkService:', BookmarkService);
console.log('DetectionService:', DetectionService);
console.log('ApiService:', ApiService);
console.log('BookmarkSyncer:', BookmarkSyncer);

// 检查Chrome API是否可用
console.log('🌐 Chrome API状态:');
console.log('chrome:', typeof chrome);
console.log('chrome.bookmarks:', typeof chrome?.bookmarks);

/**
 * 缓存管理器 - 用于存储和管理已分类的书签
 */
class CacheManager {
    constructor() {
        this.bookmarkCache = new Map();
        this.cacheStats = {
            totalCached: 0,
            hits: 0,
            misses: 0,
            hitRate: 0,
            lastUpdated: Date.now()
        };
        this.loadCacheFromStorage();
    }

    /**
     * 检查缓存中的分类结果
     */
    async getCachedCategory(bookmarkId) {
        const cached = this.bookmarkCache.get(bookmarkId);
        
        if (cached && this.isValidCache(cached)) {
            this.cacheStats.hits++;
            this.updateHitRate();
            console.log(`📦 缓存命中: ${bookmarkId}`);
            return cached;
        }
        
        this.cacheStats.misses++;
        this.updateHitRate();
        return null;
    }

    /**
     * 批量检查书签缓存状态
     */
    async getBookmarksStatus(bookmarks) {
        const cached = [];
        const needsClassification = [];
        const needsUpdate = [];

        for (const bookmark of bookmarks) {
            const cachedData = this.bookmarkCache.get(bookmark.id);
            
            if (!cachedData) {
                needsClassification.push(bookmark);
            } else if (this.isValidCache(cachedData)) {
                cached.push({ ...bookmark, ...cachedData });
            } else {
                needsUpdate.push(bookmark);
            }
        }

        return { cached, needsClassification, needsUpdate };
    }

    /**
     * 保存分类结果到缓存
     */
    async saveToCache(bookmarkId, categoryData) {
        const cacheEntry = {
            ...categoryData,
            timestamp: Date.now(),
            version: 1,
            cachedAt: new Date().toISOString()
        };

        this.bookmarkCache.set(bookmarkId, cacheEntry);
        this.cacheStats.totalCached = this.bookmarkCache.size;

        // 异步保存到 Chrome Storage
        await this.syncToStorage();

        console.log(`💾 缓存保存: ${bookmarkId} -> ${categoryData.suggestedCategory}`);
    }

    /**
     * 检查缓存是否有效（30天过期）
     */
    isValidCache(cacheEntry, maxAge = 30 * 24 * 60 * 60 * 1000) {
        if (!cacheEntry || !cacheEntry.timestamp) return false;
        return (Date.now() - cacheEntry.timestamp) < maxAge;
    }

    /**
     * 清理过期缓存
     */
    async cleanExpiredCache(maxAge = 30 * 24 * 60 * 60 * 1000) {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [id, data] of this.bookmarkCache) {
            if (now - data.timestamp > maxAge) {
                this.bookmarkCache.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.cacheStats.totalCached = this.bookmarkCache.size;
            await this.syncToStorage();
            console.log(`🧹 清理过期缓存: ${cleanedCount} 条`);
        }

        return cleanedCount;
    }

    /**
     * 更新命中率统计
     */
    updateHitRate() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        if (total > 0) {
            this.cacheStats.hitRate = (
                (this.cacheStats.hits / total) * 100
            ).toFixed(2) + '%';
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            totalCached: this.cacheStats.totalCached,
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            hitRate: this.cacheStats.hitRate,
            lastUpdated: this.cacheStats.lastUpdated
        };
    }

    /**
     * 清空所有缓存
     */
    async clearAllCache() {
        this.bookmarkCache.clear();
        this.cacheStats = {
            totalCached: 0,
            hits: 0,
            misses: 0,
            hitRate: 0,
            lastUpdated: Date.now()
        };
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.remove(['bookmarkCache']);
        }
        
        console.log('🗑️ 已清空所有缓存');
    }

    /**
     * 导出缓存数据
     */
    exportCache() {
        const exportData = {
            timestamp: Date.now(),
            totalCached: this.bookmarkCache.size,
            items: Array.from(this.bookmarkCache.entries()).map(([id, data]) => ({
                bookmarkId: id,
                ...data
            }))
        };

        return exportData;
    }

    /**
     * 导入缓存数据
     */
    async importCache(importData) {
        if (!importData.items || !Array.isArray(importData.items)) {
            throw new Error('无效的缓存数据格式');
        }

        for (const item of importData.items) {
            const { bookmarkId, ...data } = item;
            this.bookmarkCache.set(bookmarkId, data);
        }

        this.cacheStats.totalCached = this.bookmarkCache.size;
        await this.syncToStorage();

        console.log(`📥 导入缓存: ${importData.items.length} 条`);
    }

    /**
     * 同步缓存到 Chrome Storage
     */
    async syncToStorage() {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            return;
        }

        try {
            const cacheData = Array.from(this.bookmarkCache.entries());
            await chrome.storage.local.set({
                bookmarkCache: cacheData,
                cacheStats: this.cacheStats,
                lastSyncTime: Date.now()
            });
        } catch (error) {
            console.warn('缓存同步到 Storage 失败:', error);
        }
    }

    /**
     * 从 Chrome Storage 加载缓存
     */
    async loadCacheFromStorage() {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            return;
        }

        try {
            const result = await chrome.storage.local.get([
                'bookmarkCache',
                'cacheStats'
            ]);

            if (result.bookmarkCache) {
                this.bookmarkCache = new Map(result.bookmarkCache);
            }

            if (result.cacheStats) {
                this.cacheStats = result.cacheStats;
            }

            console.log(`✅ 从 Storage 加载缓存: ${this.bookmarkCache.size} 条`);
        } catch (error) {
            console.warn('从 Storage 加载缓存失败:', error);
        }
    }

    /**
     * 获取缓存大小统计
     */
    getCacheSize() {
        let size = 0;
        for (const [, data] of this.bookmarkCache) {
            size += JSON.stringify(data).length;
        }
        
        return {
            items: this.bookmarkCache.size,
            bytes: size,
            kilobytes: (size / 1024).toFixed(2),
            megabytes: (size / (1024 * 1024)).toFixed(4)
        };
    }
}

class AnalysisCenter {
    constructor() {
        try {
            this.bookmarkService = new BookmarkService();
            this.detectionService = new DetectionService();
            this.apiService = new ApiService();
            this.cacheManager = new CacheManager();
            this.bookmarkSyncer = new BookmarkSyncer();  // ✨ 新增
        } catch (error) {
            console.error('❌ 创建服务实例失败:', error);
            throw error;
        }
        
        // 状态管理
        this.activeTab = 'smart';
        this.isAnalyzing = false;
        this.progress = 0;
        this.logs = [];
        this.results = {
            smart: [],
            duplicates: [],
            deadlinks: [],
            emptyfolders: []
        };
        this.selectedItems = {};
        this.isSyncing = false;  // ✨ 新增
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.startAnalysis = this.startAnalysis.bind(this);
        this.cancelAnalysis = this.cancelAnalysis.bind(this);
        this.renderResults = this.renderResults.bind(this);
        this.renderLogs = this.renderLogs.bind(this);
        this.toggleSelectItem = this.toggleSelectItem.bind(this);
        this.toggleSelectAll = this.toggleSelectAll.bind(this);
        this.handleBatchAction = this.handleBatchAction.bind(this);
        this.log = this.log.bind(this);
        this.applyToBookmarks = this.applyToBookmarks.bind(this);  // ✨ 新增
        this.undoLastApply = this.undoLastApply.bind(this);  // ✨ 新增
    }
    
    /**
     * 初始化分析中心
     */
    async init() {
        try {
            console.log('🚀 初始化智能分析中心...');
            
            // 设置日志回调
            if (this.bookmarkService?.setLogCallback) {
                this.bookmarkService.setLogCallback(this.log);
            }
            
            if (this.detectionService?.setLogCallback) {
                this.detectionService.setLogCallback(this.log);
            }
            
            if (this.apiService?.setLogCallback) {
                this.apiService.setLogCallback(this.log);
            }
            
            // 初始化服务
            if (this.detectionService?.initialize) {
                await this.detectionService.initialize();
            }
            
            // 绑定事件
            this.bindEvents();
            
            // 渲染初始状态
            this.renderResults();
            
            console.log('✅ 智能分析中心初始化完成');
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * 绑定事件处理器 - 优化版
     */
    bindEvents() {
        // 任务卡片点击
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleTabChange(card.dataset.tab);
            });
        });
        
        // 开始分析按钮
        const startBtn = document.getElementById('start-analysis-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startAnalysis();
            });
        }
        
        // 取消分析按钮
        const cancelBtn = document.getElementById('cancel-analysis-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelAnalysis();
            });
        }
        
        // 刷新按钮
        const refreshBtn = document.querySelector('.nav-btn[title="刷新"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // 导出按钮
        const exportBtn = document.querySelector('.nav-btn[title="导出"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportResults());
        }

        // ✨ 新增：应用到书签按钮
        const applyBtn = document.getElementById('apply-to-bookmarks-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyToBookmarks();
            });
        }

        // ✨ 新增：撤销按钮
        const undoBtn = document.getElementById('undo-last-apply-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.undoLastApply();
            });
        }

        // ✨ 新增：全选按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSelectAll();
            });
        }
    }
    
    /**
     * 处理标签页切换 - 优化版
     */
    handleTabChange(tabId) {
        this.activeTab = tabId;
        
        // 更新卡片状态
        document.querySelectorAll('.task-card').forEach(card => {
            card.classList.toggle('active', card.dataset.tab === tabId);
        });
        
        // 清空选择状态
        this.selectedItems = {};
        
        // 渲染结果
        this.renderResults();
    }
    
    /**
     * 获取标签页标签
     */
    getTabLabel(tabId) {
        const labels = {
            smart: '智能分类',
            duplicates: '重复项检测',
            deadlinks: '失效链接检测',
            emptyfolders: '空文件夹检测'
        };
        return labels[tabId] || tabId;
    }
    
    /**
     * 开始分析
     */
    async startAnalysis() {
        if (this.isAnalyzing) return;
        
        try {
            this.isAnalyzing = true;
            this.progress = 0;
            this.logs = [];
            
            this.updateAnalysisState();
            await this.performAnalysis();
            
        } catch (error) {
            console.error('❌ 分析过程中发生错误:', error);
            this.handleError(error);
        }
    }
    
    /**
     * 执行分析
     */
    async performAnalysis() {
        const analysisType = this.activeTab;
        
        console.log(`🔄 开始执行${this.getTabLabel(analysisType)}分析...`);
        this.log(`开始${this.getTabLabel(analysisType)}分析...`, 'info');
        
        // 模拟分析进度
        const interval = setInterval(() => {
            this.progress += Math.random() * 3 + 1;
            if (this.progress >= 100) {
                this.progress = 100;
                clearInterval(interval);
                this.completeAnalysis();
            }
            this.updateProgress();
        }, 200);
        
        // 根据分析类型执行不同的分析
        try {
            switch (analysisType) {
                case 'smart':
                    console.log('🔄 执行智能分类分析...');
                    await this.performSmartCategorization();
                    break;
                case 'duplicates':
                    console.log('🔄 执行重复项检测...');
                    await this.performDuplicateDetection();
                    break;
                case 'deadlinks':
                    console.log('🔄 执行失效链接检测...');
                    await this.performDeadLinkDetection();
                    break;
                case 'emptyfolders':
                    console.log('🔄 执行空文件夹检测...');
                    await this.performEmptyFolderDetection();
                    break;
                default:
                    console.warn('⚠️ 未知的分析类型:', analysisType);
            }
        } catch (error) {
            console.error('❌ 分析执行失败:', error);
            this.log(`分析执行失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 智能分类 - 集成缓存系统的版本
     */
    async smartCategorizeWithCache() {
        try {
            this.log('🚀 开始智能分类分析（启用缓存）...', 'info');
            
            // 1. 获取书签数据
            this.log('📚 获取书签数据...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            const urls = bookmarks.filter(b => b.url).slice(0, 50);
            
            if (urls.length === 0) {
                this.log('⚠️ 没有找到书签', 'warning');
                return;
            }
            
            this.log(`📋 获取到 ${urls.length} 个书签`, 'info');
            
            // 2. 检查缓存状态
            this.log('🔍 检查缓存状态...', 'info');
            const { cached, needsClassification, needsUpdate } = 
                await this.cacheManager.getBookmarksStatus(urls);
            
            // 显示缓存统计
            this.log(`💾 缓存状态: 已缓存 ${cached.length}, 需要分类 ${needsClassification.length}, 需要更新 ${needsUpdate.length}`, 'info');
            
            const suggestions = [];
            
            // 3. 添加已缓存的结果
            suggestions.push(...cached);
            
            // 4. 处理需要分类的书签
            if (needsClassification.length > 0) {
                this.log(`📊 处理 ${needsClassification.length} 个新书签...`, 'info');
                
                const apiSettings = await this.getApiSettings();
                const batchSize = 5;
                
                for (let i = 0; i < needsClassification.length; i += batchSize) {
                    const batch = needsClassification.slice(i, Math.min(i + batchSize, needsClassification.length));
                    this.log(`📊 处理第 ${Math.floor(i / batchSize) + 1}/${Math.ceil(needsClassification.length / batchSize)} 批...`, 'info');
                    
                    // 本地分类
                    const localSuggestions = batch.map(bookmark => this.localCategorize(bookmark));
                    
                    // LLM增强（如果有API）
                    let finalSuggestions = localSuggestions;
                    if (apiSettings && apiSettings.apiKey) {
                        try {
                            finalSuggestions = await this.enhanceWithLLM(batch, localSuggestions, apiSettings);
                        } catch (error) {
                            this.log(`⚠️ LLM增强失败: ${error.message}`, 'warning');
                        }
                    }
                    
                    // 保存到缓存
                    for (let j = 0; j < batch.length; j++) {
                        await this.cacheManager.saveToCache(batch[j].id, finalSuggestions[j]);
                    }
                    
                    suggestions.push(...finalSuggestions);
                    
                    this.progress = (cached.length + i + batch.length) / urls.length * 100;
                    this.updateProgress();
                    
                    if (i + batchSize < needsClassification.length) {
                        await this.delay(1000);
                    }
                }
            }
            
            // 5. 处理过期的缓存（可选）
            if (needsUpdate.length > 0) {
                this.log(`🔄 处理 ${needsUpdate.length} 个过期缓存...`, 'info');
                // 类似新书签的处理流程
            }
            
            // 6. 显示缓存统计
            const cacheStats = this.cacheManager.getCacheStats();
            const cacheSize = this.cacheManager.getCacheSize();
            this.log(`📦 缓存统计 - 命中率: ${cacheStats.hitRate}, 缓存项: ${cacheStats.totalCached}, 大小: ${cacheSize.kilobytes}KB`, 'info');
            
            // 7. 保存结果
            this.results.smart = suggestions;
            this.progress = 100;
            this.completeAnalysis();
            
            this.log(`✅ 分类完成！共生成 ${suggestions.length} 条建议`, 'success');
            
        } catch (error) {
            this.log(`❌ 智能分类失败: ${error.message}`, 'error');
        }
    }

    /**
     * 原始智能分类方法（不使用缓存）
     */
    async performSmartCategorization() {
        // 调用新的方法（已集成缓存）
        return this.smartCategorizeWithCache();
    }

    /**
     * 本地分类规则
     */
    localCategorize(bookmark) {
        const title = (bookmark.title || '').toLowerCase();
        const url = (bookmark.url || '').toLowerCase();
        
        // 域名分类规则
        const domainRules = {
            '技术': ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'w3schools.com', 'js', 'python', 'programming', 'code', 'api', 'npm', 'yarn'],
            '社交': ['twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'weibo.com', 'douban.com'],
            '购物': ['amazon.com', 'taobao.com', 'jd.com', 'ebay.com', 'shop', 'buy', 'sale', 'store'],
            '娱乐': ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'bilibili.com', 'game', 'movie', 'music'],
            '学习': ['coursera.org', 'udemy.com', 'edx.org', 'khan', 'education', 'course', 'tutorial', 'learn'],
            '新闻': ['news', 'cnn.com', 'bbc.com', '新闻', '资讯'],
            '工作': ['job', 'career', 'recruit', '招聘', 'work', '工作']
        };
        
        // 逐一检查规则
        for (const [category, keywords] of Object.entries(domainRules)) {
            if (keywords.some(kw => url.includes(kw) || title.includes(kw))) {
                return {
                    id: `cat-${bookmark.id || Date.now()}`,
                    title: bookmark.title || '未命名',
                    url: bookmark.url,
                    suggestedCategory: category,
                    confidence: 0.7,
                    source: 'local', // 标记数据来源
                    folder: bookmark.parentId
                };
            }
        }
        
        // 默认分类
        return {
            id: `cat-${bookmark.id || Date.now()}`,
            title: bookmark.title || '未命名',
            url: bookmark.url,
            suggestedCategory: '其他',
            confidence: 0.3,
            source: 'local',
            folder: bookmark.parentId
        };
    }

    /**
     * 使用LLM增强分类
     */
    async enhanceWithLLM(bookmarks, localSuggestions, apiSettings) {
        if (!apiSettings || !apiSettings.apiKey) {
            return localSuggestions;
        }
        
        try {
            // 构建提示词
            const bookmarksList = bookmarks.map((b, i) => 
                `${i + 1}. 标题: ${b.title}\n   URL: ${b.url}\n   本地分类: ${localSuggestions[i].suggestedCategory}`
            ).join('\n\n');
            
            const prompt = `请分析以下书签，提供更准确的分类建议。返回JSON格式：
[{"index": 0, "category": "分类", "confidence": 0.9, "reason": "原因"}]

书签列表：
${bookmarksList}

可选分类：技术、社交、购物、娱乐、学习、新闻、工作、设计、其他`;
            
            this.log('🤖 调用LLM API进行增强分类...', 'info');
            
            // 调用API
            const response = await this.callLLMApi(prompt, apiSettings);
            
            // 解析响应
            const categories = JSON.parse(response);
            
            // 合并本地和LLM的分类结果
            return bookmarks.map((bookmark, index) => {
                const llmResult = categories[index];
                const localResult = localSuggestions[index];
                
                return {
                    ...localResult,
                    suggestedCategory: llmResult.category || localResult.suggestedCategory,
                    confidence: llmResult.confidence || localResult.confidence,
                    source: 'llm_enhanced', // 标记为LLM增强
                    llmReason: llmResult.reason
                };
            });
            
        } catch (error) {
            this.log(`⚠️ LLM调用失败，回退到本地分类: ${error.message}`, 'warning');
            return localSuggestions;
        }
    }

    /**
     * 调用LLM API
     */
    async callLLMApi(prompt, apiSettings) {
        const { provider = 'gemini', apiKey, model = 'gemini-2.0-flash', customApiUrl } = apiSettings;
        
        switch (provider) {
            case 'gemini':
                return await this.callGeminiAPI(prompt, apiKey, model);
            case 'openai':
                return await this.callOpenAIAPI(prompt, apiKey, model);
            case 'custom':
                return await this.callCustomAPI(prompt, apiKey, customApiUrl, model);
            default:
                throw new Error(`未知的API提供商: ${provider}`);
        }
    }

    /**
     * 调用Gemini API
     */
    async callGeminiAPI(prompt, apiKey, model) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API错误: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text || '';
        
        // 提取JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[0] : text;
    }

    /**
     * 调用OpenAI API
     */
    async callOpenAIAPI(prompt, apiKey, model) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1024
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * 调用自定义API
     */
    async callCustomAPI(prompt, apiKey, customApiUrl, model) {
        const response = await fetch(customApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                max_tokens: 1024
            })
        });
        
        if (!response.ok) {
            throw new Error(`自定义API错误: ${response.status}`);
        }
        
        const data = await response.json();
        return data.content || data.result || JSON.stringify(data);
    }

    /**
     * 获取API设置
     */
    async getApiSettings() {
        return new Promise((resolve) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.sync.get([
                        'apiProvider',
                        'apiKey',
                        'geminiModel',
                        'openaiModel',
                        'customModel',
                        'customApiUrl'
                    ], (result) => {
                        resolve({
                            provider: result.apiProvider || 'gemini',
                            apiKey: result.apiKey || '',
                            model: result.geminiModel || result.openaiModel || 'gemini-2.0-flash',
                            customApiUrl: result.customApiUrl || ''
                        });
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                resolve(null);
            }
        });
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 执行重复项检测
     */
    async performDuplicateDetection() {
        try {
            this.log('正在比较URL...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            
            this.log('正在比较书签标题...', 'info');
            // 使用检测服务查找重复项
            const duplicates = await this.detectionService.findDuplicates(bookmarks);
            
            // 如果没有检测服务的结果，使用本地算法
            if (!duplicates || duplicates.length === 0) {
                this.log('使用本地算法检测重复项...', 'info');
                const localDuplicates = this.findDuplicatesLocally(bookmarks);
                this.results.duplicates = localDuplicates;
                this.log(`发现${localDuplicates.length}个重复书签`, 'warning');
            } else {
                this.results.duplicates = duplicates;
                this.log(`发现${duplicates.length}个重复书签`, 'warning');
            }
            
        } catch (error) {
            this.log(`重复项检测失败: ${error.message}`, 'error');
            // 使用本地算法作为备选
            try {
                const bookmarks = await this.bookmarkService.getAllBookmarks();
                const localDuplicates = this.findDuplicatesLocally(bookmarks);
                this.results.duplicates = localDuplicates;
                this.log(`使用备选算法发现${localDuplicates.length}个重复书签`, 'warning');
            } catch (fallbackError) {
                this.log(`备选算法也失败: ${fallbackError.message}`, 'error');
            }
        }
    }
    
    /**
     * 执行失效链接检测
     */
    async performDeadLinkDetection() {
        try {
            this.log('正在准备链接列表...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            
            this.log('开始验证链接状态...', 'info');
            // 使用检测服务查找失效链接
            const deadLinks = await this.detectionService.findDeadLinks(bookmarks);
            
            // 如果没有检测服务的结果，使用本地算法
            if (!deadLinks || deadLinks.length === 0) {
                this.log('使用本地算法检测失效链接...', 'info');
                const localDeadLinks = await this.findDeadLinksLocally(bookmarks);
                this.results.deadlinks = localDeadLinks;
                this.log(`发现${localDeadLinks.length}个失效链接`, 'warning');
            } else {
                this.results.deadlinks = deadLinks;
                this.log(`发现${deadLinks.length}个失效链接`, 'warning');
            }
            
        } catch (error) {
            this.log(`失效链接检测失败: ${error.message}`, 'error');
            // 使用本地算法作为备选
            try {
                const bookmarks = await this.bookmarkService.getAllBookmarks();
                const localDeadLinks = await this.findDeadLinksLocally(bookmarks);
                this.results.deadlinks = localDeadLinks;
                this.log(`使用备选算法发现${localDeadLinks.length}个失效链接`, 'warning');
            } catch (fallbackError) {
                this.log(`备选算法也失败: ${fallbackError.message}`, 'error');
            }
        }
    }
    
    /**
     * 执行空文件夹检测
     */
    async performEmptyFolderDetection() {
        try {
            this.log('正在遍历文件夹结构...', 'info');
            const tree = await this.bookmarkService.getTree();
            
            this.log('正在识别空文件夹...', 'info');
            // 使用检测服务查找空文件夹
            const emptyFolders = await this.detectionService.findEmptyFolders(tree);
            
            // 如果没有检测服务的结果，使用本地算法
            if (!emptyFolders || emptyFolders.length === 0) {
                this.log('使用本地算法检测空文件夹...', 'info');
                const localEmptyFolders = this.findEmptyFoldersLocally(tree);
                this.results.emptyfolders = localEmptyFolders;
                this.log(`发现${localEmptyFolders.length}个空文件夹`, 'warning');
            } else {
                this.results.emptyfolders = emptyFolders;
                this.log(`发现${emptyFolders.length}个空文件夹`, 'warning');
            }
            
        } catch (error) {
            this.log(`空文件夹检测失败: ${error.message}`, 'error');
            // 使用本地算法作为备选
            try {
                const tree = await this.bookmarkService.getTree();
                const localEmptyFolders = this.findEmptyFoldersLocally(tree);
                this.results.emptyfolders = localEmptyFolders;
                this.log(`使用备选算法发现${localEmptyFolders.length}个空文件夹`, 'warning');
            } catch (fallbackError) {
                this.log(`备选算法也失败: ${fallbackError.message}`, 'error');
            }
        }
    }
    
    /**
     * 生成分类建议
     */
    async generateCategorizationSuggestions(bookmarks) {
        console.log('🔄 开始生成分类建议...');
        const suggestions = [];
        const categories = ['工作', '学习', '娱乐', '新闻', '社交媒体', '开发', '设计', '购物', '金融', '健康', '旅游', '美食', '技术博客'];
        
        // 基于URL域名和标题内容进行智能分类
        const bookmarksToProcess = bookmarks.slice(0, 30);
        console.log('📋 处理书签数量:', bookmarksToProcess.length);
        
        bookmarksToProcess.forEach((bookmark, index) => {
            const suggestedCategory = this.suggestCategory(bookmark, categories);
            const confidence = this.calculateConfidence(bookmark, suggestedCategory);
            
            suggestions.push({
                id: `uncategorized-${index}`,
                title: bookmark.title || '未命名书签',
                url: bookmark.url || '',
                suggestedCategory,
                confidence,
                folder: this.getFolderName(bookmark.parentId)
            });
        });
        
        console.log('💡 生成建议数量:', suggestions.length);
        return suggestions;
    }
    
    /**
     * 基于书签内容建议分类
     */
    suggestCategory(bookmark, categories) {
        const title = (bookmark.title || '').toLowerCase();
        const url = (bookmark.url || '').toLowerCase();
        
        console.log('🔍 分析书签:', { title, url });
        
        // 基于域名的分类规则
        const domainRules = {
            'github.com': '开发',
            'stackoverflow.com': '开发',
            'developer.mozilla.org': '开发',
            'w3schools.com': '学习',
            'coursera.org': '学习',
            'youtube.com': '娱乐',
            'netflix.com': '娱乐',
            'facebook.com': '社交媒体',
            'twitter.com': '社交媒体',
            'linkedin.com': '工作',
            'amazon.com': '购物',
            'taobao.com': '购物',
            'news': '新闻',
            'cnn.com': '新闻',
            'bbc.com': '新闻'
        };
        
        // 检查域名规则
        for (const [domain, category] of Object.entries(domainRules)) {
            if (url.includes(domain)) {
                return category;
            }
        }
        
        // 基于标题关键词的分类规则
        const titleRules = {
            '工作': ['工作', 'job', 'career', 'office', 'business'],
            '学习': ['学习', 'study', 'course', 'tutorial', 'education', '教程'],
            '娱乐': ['娱乐', 'game', 'movie', 'music', 'fun', '游戏', '电影'],
            '新闻': ['新闻', 'news', '时事', '政治'],
            '开发': ['开发', 'code', 'programming', 'api', '技术', '编程'],
            '设计': ['设计', 'design', 'ui', 'ux', 'art', '美术'],
            '购物': ['购物', 'shop', 'buy', 'store', '商城'],
            '健康': ['健康', 'health', 'medical', 'fitness', '健身'],
            '旅游': ['旅游', 'travel', 'trip', 'hotel', '旅行']
        };
        
        for (const [category, keywords] of Object.entries(titleRules)) {
            if (keywords.some(keyword => title.includes(keyword))) {
                return category;
            }
        }
        
        // 默认随机分类
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    /**
     * 计算分类置信度
     */
    calculateConfidence(bookmark, category) {
        const title = (bookmark.title || '').toLowerCase();
        const url = (bookmark.url || '').toLowerCase();
        
        let confidence = 0.5; // 基础置信度
        
        // 如果URL包含相关域名，提高置信度
        const domainRules = {
            'github.com': '开发',
            'stackoverflow.com': '开发',
            'youtube.com': '娱乐',
            'facebook.com': '社交媒体',
            'amazon.com': '购物'
        };
        
        for (const [domain, expectedCategory] of Object.entries(domainRules)) {
            if (url.includes(domain) && category === expectedCategory) {
                confidence += 0.3;
                break;
            }
        }
        
        // 如果标题包含相关关键词，提高置信度
        const titleRules = {
            '工作': ['工作', 'job', 'career'],
            '学习': ['学习', 'study', 'course', '教程'],
            '娱乐': ['娱乐', 'game', 'movie', '游戏'],
            '开发': ['开发', 'code', 'programming', '编程'],
            '设计': ['设计', 'design', 'ui', 'ux']
        };
        
        if (titleRules[category]) {
            const keywordCount = titleRules[category].filter(keyword => 
                title.includes(keyword)
            ).length;
            confidence += keywordCount * 0.1;
        }
        
        return Math.min(confidence, 0.95); // 最大置信度95%
    }
    
    /**
     * 获取文件夹名称
     */
    getFolderName(parentId) {
        // 这里应该从书签服务获取文件夹名称
        // 暂时返回默认值
        return '收藏夹';
    }
    
    /**
     * 本地重复项检测算法
     */
    findDuplicatesLocally(bookmarks) {
        const urlMap = new Map();
        const duplicates = [];
        
        // 按URL分组
        bookmarks.forEach(bookmark => {
            if (bookmark.url) {
                if (!urlMap.has(bookmark.url)) {
                    urlMap.set(bookmark.url, []);
                }
                urlMap.get(bookmark.url).push(bookmark);
            }
        });
        
        // 找出重复项
        urlMap.forEach((bookmarks, url) => {
            if (bookmarks.length > 1) {
                bookmarks.forEach((bookmark, index) => {
                    duplicates.push({
                        id: `duplicate-${bookmark.id}-${index}`,
                        title: bookmark.title || '未命名书签',
                        url: bookmark.url,
                        folder: this.getFolderName(bookmark.parentId),
                        originalId: bookmark.id
                    });
                });
            }
        });
        
        return duplicates;
    }
    
    /**
     * 本地失效链接检测算法
     */
    async findDeadLinksLocally(bookmarks) {
        const deadLinks = [];
        
        // 模拟检测一些常见的失效链接模式
        const deadPatterns = [
            '404',
            'not found',
            'page not found',
            'error 404',
            'dead link',
            'broken link'
        ];
        
        // 检查每个书签
        for (const bookmark of bookmarks) {
            if (!bookmark.url) continue;
            
            const url = bookmark.url.toLowerCase();
            const title = (bookmark.title || '').toLowerCase();
            
            // 检查URL是否包含失效模式
            const isDead = deadPatterns.some(pattern => 
                url.includes(pattern) || title.includes(pattern)
            );
            
            // 检查是否是明显的无效URL
            const isInvalid = !url.startsWith('http') || 
                             url.includes('localhost') || 
                             url.includes('127.0.0.1') ||
                             url.length < 10;
            
            if (isDead || isInvalid) {
                deadLinks.push({
                    id: `dead-${bookmark.id}`,
                    title: bookmark.title || '未命名书签',
                    url: bookmark.url,
                    folder: this.getFolderName(bookmark.parentId),
                    lastChecked: new Date().toISOString(),
                    originalId: bookmark.id
                });
            }
        }
        
        // 模拟一些额外的失效链接（用于演示）
        if (deadLinks.length === 0) {
            const mockDeadLinks = [
                {
                    id: 'dead-mock-1',
                    title: '失效链接示例1',
                    url: 'https://example.com/dead-link-1',
                    folder: '收藏夹',
                    lastChecked: new Date().toISOString()
                },
                {
                    id: 'dead-mock-2',
                    title: '失效链接示例2',
                    url: 'https://example.com/dead-link-2',
                    folder: '工作',
                    lastChecked: new Date().toISOString()
                }
            ];
            deadLinks.push(...mockDeadLinks);
        }
        
        return deadLinks;
    }
    
    /**
     * 本地空文件夹检测算法
     */
    findEmptyFoldersLocally(tree) {
        const emptyFolders = [];
        
        // 递归遍历书签树
        const traverse = (nodes, parentPath = '') => {
            if (!nodes || !Array.isArray(nodes)) return;
            
            nodes.forEach(node => {
                if (!node.url) { // 这是一个文件夹
                    const currentPath = parentPath ? `${parentPath}/${node.title}` : node.title;
                    
                    // 检查文件夹是否为空
                    const hasChildren = node.children && node.children.length > 0;
                    const hasBookmarks = node.children && node.children.some(child => child.url);
                    
                    if (hasChildren && !hasBookmarks) {
                        // 这是一个空文件夹
                        emptyFolders.push({
                            id: `empty-${node.id}`,
                            name: node.title || '未命名文件夹',
                            path: currentPath,
                            createdAt: new Date().toISOString(),
                            originalId: node.id
                        });
                    }
                    
                    // 递归检查子文件夹
                    if (node.children) {
                        traverse(node.children, currentPath);
                    }
                }
            });
        };
        
        traverse(tree);
        
        // 模拟一些空文件夹（用于演示）
        if (emptyFolders.length === 0) {
            const mockEmptyFolders = [
                {
                    id: 'empty-mock-1',
                    name: '空文件夹示例1',
                    path: '收藏夹/空文件夹示例1',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'empty-mock-2',
                    name: '空文件夹示例2',
                    path: '收藏夹/工作/空文件夹示例2',
                    createdAt: new Date().toISOString()
                }
            ];
            emptyFolders.push(...mockEmptyFolders);
        }
        
        return emptyFolders;
    }
    
    /**
     * 完成分析
     */
    completeAnalysis() {
        console.log('✅ 分析完成');
        this.isAnalyzing = false;
        this.log(`${this.getTabLabel(this.activeTab)}分析完成！`, 'success');
        this.log('分析完成！结果已准备就绪', 'success');
        
        // 更新UI状态
        this.updateAnalysisState();
        this.renderResults();
        
        console.log('📊 分析结果:', this.results[this.activeTab]);
    }
    
    /**
     * 取消分析
     */
    cancelAnalysis() {
        this.isAnalyzing = false;
        this.progress = 0;
        this.log('分析已取消', 'warning');
        
        // 更新UI状态
        this.updateAnalysisState();
    }
    
    /**
     * 更新分析状态
     */
    updateAnalysisState() {
        const startBtn = document.getElementById('start-analysis-btn');
        const cancelBtn = document.getElementById('cancel-analysis-btn');
        
        console.log('🔄 更新分析状态:', {
            isAnalyzing: this.isAnalyzing,
            startBtn: startBtn,
            cancelBtn: cancelBtn
        });
        
        if (this.isAnalyzing) {
            if (startBtn) startBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'block';
        } else {
            if (startBtn) startBtn.style.display = 'block';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    }
    
    /**
     * 更新进度
     */
    updateProgress() {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${this.progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `正在分析中，请稍候... ${Math.round(this.progress)}%`;
        }
        
        // 生成日志消息
        this.generateLogMessage();
    }
    
    /**
     * 生成日志消息
     */
    generateLogMessage() {
        const messages = {
            smart: [
                { threshold: 15, message: '正在加载书签数据...', type: 'info' },
                { threshold: 30, message: '正在分析书签内容...', type: 'info' },
                { threshold: 50, message: '正在提取关键词...', type: 'info' },
                { threshold: 70, message: '正在生成分类建议...', type: 'info' },
                { threshold: 85, message: '正在计算分类置信度...', type: 'info' },
                { threshold: 95, message: '正在整理分析结果...', type: 'info' }
            ],
            duplicates: [
                { threshold: 20, message: '正在比较URL...', type: 'info' },
                { threshold: 40, message: '正在比较书签标题...', type: 'info' },
                { threshold: 60, message: '正在比较书签内容...', type: 'info' },
                { threshold: 75, message: '发现潜在重复项...', type: 'warning' },
                { threshold: 85, message: '正在验证重复项...', type: 'info' },
                { threshold: 95, message: '正在整理分析结果...', type: 'info' }
            ],
            deadlinks: [
                { threshold: 15, message: '正在准备链接列表...', type: 'info' },
                { threshold: 30, message: '开始验证链接状态...', type: 'info' },
                { threshold: 45, message: '正在检查HTTP状态码...', type: 'info' },
                { threshold: 60, message: '发现潜在失效链接...', type: 'warning' },
                { threshold: 75, message: '正在进行二次验证...', type: 'info' },
                { threshold: 85, message: '正在分析重定向链接...', type: 'info' },
                { threshold: 95, message: '正在整理分析结果...', type: 'info' }
            ],
            emptyfolders: [
                { threshold: 25, message: '正在遍历文件夹结构...', type: 'info' },
                { threshold: 50, message: '正在统计文件夹内容...', type: 'info' },
                { threshold: 75, message: '正在识别空文件夹...', type: 'info' },
                { threshold: 90, message: '正在整理分析结果...', type: 'info' }
            ]
        };
        
        const tabMessages = messages[this.activeTab] || messages.smart;
        
        for (const msg of tabMessages) {
            if (this.progress >= msg.threshold && this.progress < msg.threshold + 5) {
                this.log(msg.message, msg.type);
                break;
            }
        }
        
        // 随机添加警告或错误消息
        if (this.progress > 10 && this.progress < 90 && Math.random() < 0.05) {
            const randomMessages = [
                { message: '无法访问某些书签，将跳过...', type: 'warning' },
                { message: '网络连接不稳定，分析速度可能受影响', type: 'warning' },
                { message: '解析某些书签时遇到问题', type: 'error' }
            ];
            const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
            this.log(randomMsg.message, randomMsg.type);
        }
    }
    
    /**
     * 渲染结果 - 适配新布局
     */
    renderResults() {
        const resultsContent = document.getElementById('resultsContent');
        const resultsTitle = document.getElementById('resultsTitle');
        const logsPanel = document.getElementById('logsPanel');
        const batchActions = document.getElementById('batchActions');  // ✨ 新增
        
        if (!resultsContent || !resultsTitle) return;
        
        // 获取任务标签
        const tabLabel = this.getTabLabel(this.activeTab);
        resultsTitle.textContent = tabLabel;
        
        // 根据状态渲染内容
        if (this.isAnalyzing) {
            this.renderAnalyzingState(resultsContent);
            if (logsPanel) logsPanel.style.display = 'block';
            if (batchActions) batchActions.style.display = 'none';  // ✨ 新增
        } else if (this.progress === 0) {
            this.renderEmptyState(resultsContent);
            if (logsPanel) logsPanel.style.display = 'none';
            if (batchActions) batchActions.style.display = 'none';  // ✨ 新增
        } else {
            this.renderResultsContent(resultsContent);
            // ✨ 新增：如果有结果且是智能分类标签，显示批量操作栏
            const results = this.results[this.activeTab] || [];
            if (batchActions && results.length > 0 && this.activeTab === 'smart') {
                batchActions.style.display = 'flex';
            } else if (batchActions) {
                batchActions.style.display = 'none';
            }
        }
    }
    
    /**
     * 渲染分析中状态 - 简化版
     */
    renderAnalyzingState(container) {
        container.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.progress}%"></div>
                </div>
                <p class="progress-text">正在分析... ${Math.round(this.progress)}%</p>
            </div>
        `;
    }

    /**
     * 渲染空状态 - 适配新布局
     */
    renderEmptyState(container) {
        const descriptions = {
            smart: '分析您的书签并提供智能分类建议',
            duplicates: '检测您的书签库中的重复项',
            deadlinks: '检测您的书签库中已失效的链接',
            emptyfolders: '查找并标记空文件夹'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">点击上方开始分析</h3>
                <p class="empty-desc">${descriptions[this.activeTab]}</p>
            </div>
        `;
    }

    /**
     * 渲染结果内容 - 主入口
     */
    renderResultsContent(container) {
        const results = this.results[this.activeTab] || [];
        
        if (this.activeTab === 'duplicates') {
            container.innerHTML = this.renderDuplicateResults(results) + (results.length > 0 ? this.renderBatchBar(results) : '');
        } else {
            container.innerHTML = this.renderResultsList(results);
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * 渲染结果列表 - 适配新布局
     */
    renderResultsList(results) {
        if (results.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <h3 class="empty-title">分析完成</h3>
                    <p class="empty-desc">未发现需要处理的项目</p>
                </div>
            `;
        }

        return `
            <div style="padding: var(--space-3) 0;">
                ${results.map(item => this.renderResultItem(item)).join('')}
            </div>
            ${results.length > 0 ? this.renderBatchBar(results) : ''}
        `;
    }

    /**
     * 渲染批量操作栏
     */
    renderBatchBar(results) {
        const selectedCount = Object.values(this.selectedItems).filter(Boolean).length;
        
        return `
            <div class="batch-bar">
                <div class="batch-select">
                    <input type="checkbox" onchange="window.analysisCenter.toggleSelectAll()">
                    <span>全选 (${selectedCount}/${results.length})</span>
                </div>
                <div class="batch-actions">
                    ${this.getTabBatchButton(results)}
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染重复项结果
     */
    renderDuplicateResults(results) {
        // 按URL分组
        const grouped = {};
        results.forEach(item => {
            if (!grouped[item.url]) {
                grouped[item.url] = [];
            }
            grouped[item.url].push(item);
        });
        
        return `
            <div class="duplicate-groups">
                ${Object.entries(grouped).map(([url, items], index) => `
                    <div class="duplicate-group">
                        <div class="group-header">
                            <h4 class="group-title">重复URL #${index + 1}</h4>
                            <span class="group-count">${items.length}个副本</span>
                        </div>
                        <a href="${url}" class="group-url" target="_blank">
                            <i data-lucide="external-link" width="14" height="14"></i>
                            ${url}
                        </a>
                        <div class="group-items">
                            ${items.map(item => this.renderResultItem(item)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 渲染单个结果项 - 简化版
     */
    renderResultItem(item) {
        const isSelected = this.selectedItems[item.id] || false;
        
        return `
            <div class="result-item">
                <input type="checkbox" class="result-checkbox" ${isSelected ? 'checked' : ''} 
                       data-item-id="${item.id}" onchange="window.analysisCenter.toggleSelectItem('${item.id}')">
                <div class="result-info">
                    <p class="result-title">${item.title || '未命名'}</p>
                    <p class="result-meta">${item.url || item.path || item.folder || ''}</p>
                </div>
                <div class="result-actions">
                    ${item.suggestedCategory ? `<span style="font-size: 0.75rem; color: var(--accent-blue);">${item.suggestedCategory}</span>` : ''}
                    <button title="删除" onclick="window.analysisCenter.deleteItem('${item.id}')">
                        <i data-lucide="trash-2" width="16" height="16"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染结果徽章
     */
    renderResultBadges(item) {
        if (this.activeTab === 'smart' && item.suggestedCategory) {
            return `
                <div class="result-badge badge-suggestion">
                    建议分类: ${item.suggestedCategory}
                </div>
                <div class="result-badge badge-confidence">
                    ${Math.round(item.confidence * 100)}%
                </div>
            `;
        }
        return '';
    }
    
    /**
     * 渲染结果按钮
     */
    renderResultButtons(item) {
        const buttons = [];
        
        if (this.activeTab === 'smart') {
            buttons.push(`
                <button class="action-btn accept" data-item-id="${item.id}" data-action="accept" title="接受建议">
                    <i data-lucide="check-circle" width="16" height="16"></i>
                </button>
            `);
        }
        
        buttons.push(`
            <button class="action-btn delete" data-item-id="${item.id}" data-action="delete" title="删除">
                <i data-lucide="trash-2" width="16" height="16"></i>
            </button>
        `);
        
        return buttons.join('');
    }
    
    /**
     * 渲染批量操作
     */
    renderBatchActions(results) {
        const allSelected = results.every(item => this.selectedItems[item.id]);
        const someSelected = results.some(item => this.selectedItems[item.id]);
        
        return `
            <div class="batch-actions">
                <div class="batch-select">
                    <input type="checkbox" ${allSelected ? 'checked' : ''} 
                           id="select-all-checkbox">
                    <span>全选</span>
                </div>
                <div class="batch-buttons">
                    <button class="btn-secondary" id="export-results-btn">
                        <i data-lucide="download" width="14" height="14"></i>
                        导出结果
                    </button>
                    ${this.renderBatchActionButton(results)}
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染批量操作按钮
     */
    renderBatchActionButton(results) {
        const buttons = {
            smart: `
                <button class="btn-primary" id="apply-all-suggestions-btn">
                    <i data-lucide="check-circle" width="14" height="14"></i>
                    应用所有分类建议
                </button>
            `,
            duplicates: `
                <button class="btn-danger" id="clean-all-duplicates-btn">
                    <i data-lucide="trash-2" width="14" height="14"></i>
                    一键清理所有重复项
                </button>
            `,
            deadlinks: `
                <button class="btn-danger" id="delete-all-deadlinks-btn">
                    <i data-lucide="trash-2" width="14" height="14"></i>
                    批量删除所有失效链接
                </button>
            `,
            emptyfolders: `
                <button class="btn-danger" id="clean-all-emptyfolders-btn">
                    <i data-lucide="trash-2" width="14" height="14"></i>
                    一键清理所有空文件夹
                </button>
            `
        };
        
        return buttons[this.activeTab] || '';
    }
    
    /**
     * 切换选择项
     */
    toggleSelectItem(id) {
        this.selectedItems[id] = !this.selectedItems[id];
        this.renderResults();
    }
    
    /**
     * 切换全选
     */
    toggleSelectAll() {
        const results = this.results[this.activeTab] || [];
        const allSelected = results.every(item => this.selectedItems[item.id]);
        
        results.forEach(item => {
            this.selectedItems[item.id] = !allSelected;
        });
        
        this.renderResults();
    }
    
    /**
     * 处理批量操作
     */
    handleBatchAction(action) {
        const selectedItems = Object.entries(this.selectedItems)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
        
        if (selectedItems.length === 0) {
            this.log('请先选择要操作的项目', 'warning');
            return;
        }
        
        this.log(`执行批量操作: ${action} (${selectedItems.length}项)`, 'info');
        
        // 这里可以添加具体的批量操作逻辑
        switch (action) {
            case 'delete':
                this.deleteSelectedItems(selectedItems);
                break;
            case 'export':
                this.exportSelectedItems(selectedItems);
                break;
        }
    }
    
    /**
     * 删除选中的项目
     */
    deleteSelectedItems(selectedIds) {
        this.log(`删除 ${selectedIds.length} 个项目`, 'info');
        // 实现删除逻辑
    }
    
    /**
     * 导出选中的项目
     */
    exportSelectedItems(selectedIds) {
        this.log(`导出 ${selectedIds.length} 个项目`, 'info');
        // 实现导出逻辑
    }
    
    /**
     * 接受分类建议
     */
    async acceptSuggestion(id) {
        try {
            const suggestion = this.results.smart.find(item => item.id === id);
            if (!suggestion) {
                this.log(`未找到分类建议: ${id}`, 'error');
                return;
            }
            
            this.log(`接受分类建议: ${suggestion.title} -> ${suggestion.suggestedCategory}`, 'info');
            
            // 这里应该调用书签服务来实际移动书签到建议的分类
            // await this.bookmarkService.moveToCategory(suggestion.originalId, suggestion.suggestedCategory);
            
            // 从结果中移除已处理的建议
            this.results.smart = this.results.smart.filter(item => item.id !== id);
            this.selectedItems[id] = false;
            
            this.log(`分类建议已应用: ${suggestion.title}`, 'success');
            this.renderResults();
            
        } catch (error) {
            this.log(`应用分类建议失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 删除项目
     */
    async deleteItem(id) {
        try {
            this.log(`删除项目: ${id}`, 'info');
            
            // 根据当前标签页确定要删除的项目类型
            let itemToDelete = null;
            let resultKey = '';
            
            switch (this.activeTab) {
                case 'smart':
                    itemToDelete = this.results.smart.find(item => item.id === id);
                    resultKey = 'smart';
                    break;
                case 'duplicates':
                    itemToDelete = this.results.duplicates.find(item => item.id === id);
                    resultKey = 'duplicates';
                    break;
                case 'deadlinks':
                    itemToDelete = this.results.deadlinks.find(item => item.id === id);
                    resultKey = 'deadlinks';
                    break;
                case 'emptyfolders':
                    itemToDelete = this.results.emptyfolders.find(item => item.id === id);
                    resultKey = 'emptyfolders';
                    break;
            }
            
            if (!itemToDelete) {
                this.log(`未找到要删除的项目: ${id}`, 'error');
                return;
            }
            
            // 这里应该调用书签服务来实际删除书签
            // if (itemToDelete.originalId) {
            //     await this.bookmarkService.deleteBookmark(itemToDelete.originalId);
            // }
            
            // 从结果中移除已删除的项目
            this.results[resultKey] = this.results[resultKey].filter(item => item.id !== id);
            this.selectedItems[id] = false;
            
            this.log(`项目已删除: ${itemToDelete.title || itemToDelete.name}`, 'success');
            this.renderResults();
            
        } catch (error) {
            this.log(`删除项目失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 应用所有分类建议
     */
    async applyAllSuggestions() {
        const selectedItems = Object.entries(this.selectedItems)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
        
        if (selectedItems.length === 0) {
            this.log('请先选择要应用分类建议的项目', 'warning');
            return;
        }
        
        try {
            this.log(`开始应用 ${selectedItems.length} 个分类建议...`, 'info');
            
            let successCount = 0;
            for (const id of selectedItems) {
                try {
                    await this.acceptSuggestion(id);
                    successCount++;
                } catch (error) {
                    this.log(`应用建议失败: ${id} - ${error.message}`, 'error');
                }
            }
            
            this.log(`分类建议应用完成: ${successCount}/${selectedItems.length} 成功`, 'success');
            
        } catch (error) {
            this.log(`批量应用分类建议失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 清理所有重复项
     */
    async cleanAllDuplicates() {
        const selectedItems = Object.entries(this.selectedItems)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
        
        if (selectedItems.length === 0) {
            this.log('请先选择要清理的重复项', 'warning');
            return;
        }
        
        try {
            this.log(`开始清理 ${selectedItems.length} 个重复项...`, 'info');
            
            let successCount = 0;
            for (const id of selectedItems) {
                try {
                    await this.deleteItem(id);
                    successCount++;
                } catch (error) {
                    this.log(`清理重复项失败: ${id} - ${error.message}`, 'error');
                }
            }
            
            this.log(`重复项清理完成: ${successCount}/${selectedItems.length} 成功`, 'success');
            
        } catch (error) {
            this.log(`批量清理重复项失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 删除所有失效链接
     */
    async deleteAllDeadLinks() {
        const selectedItems = Object.entries(this.selectedItems)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
        
        if (selectedItems.length === 0) {
            this.log('请先选择要删除的失效链接', 'warning');
            return;
        }
        
        try {
            this.log(`开始删除 ${selectedItems.length} 个失效链接...`, 'info');
            
            let successCount = 0;
            for (const id of selectedItems) {
                try {
                    await this.deleteItem(id);
                    successCount++;
                } catch (error) {
                    this.log(`删除失效链接失败: ${id} - ${error.message}`, 'error');
                }
            }
            
            this.log(`失效链接删除完成: ${successCount}/${selectedItems.length} 成功`, 'success');
            
        } catch (error) {
            this.log(`批量删除失效链接失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 清理所有空文件夹
     */
    async cleanAllEmptyFolders() {
        const selectedItems = Object.entries(this.selectedItems)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
        
        if (selectedItems.length === 0) {
            this.log('请先选择要清理的空文件夹', 'warning');
            return;
        }
        
        try {
            this.log(`开始清理 ${selectedItems.length} 个空文件夹...`, 'info');
            
            let successCount = 0;
            for (const id of selectedItems) {
                try {
                    await this.deleteItem(id);
                    successCount++;
                } catch (error) {
                    this.log(`清理空文件夹失败: ${id} - ${error.message}`, 'error');
                }
            }
            
            this.log(`空文件夹清理完成: ${successCount}/${selectedItems.length} 成功`, 'success');
            
        } catch (error) {
            this.log(`批量清理空文件夹失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 刷新数据
     */
    async refreshData() {
        this.log('刷新数据...', 'info');
        try {
            await this.init();
            this.log('数据刷新完成', 'success');
        } catch (error) {
            this.log(`数据刷新失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 导出结果
     */
    exportResults() {
        try {
            const results = this.results[this.activeTab] || [];
            if (results.length === 0) {
                this.log('没有可导出的结果', 'warning');
                return;
            }
            
            this.log(`导出 ${results.length} 个分析结果`, 'info');
            
            // 生成导出数据
            const exportData = {
                analysisType: this.getTabLabel(this.activeTab),
                timestamp: new Date().toISOString(),
                totalCount: results.length,
                results: results.map(item => ({
                    title: item.title || item.name || '未命名',
                    url: item.url || '',
                    folder: item.folder || item.path || '',
                    ...(item.suggestedCategory && { suggestedCategory: item.suggestedCategory }),
                    ...(item.confidence && { confidence: item.confidence }),
                    ...(item.lastChecked && { lastChecked: item.lastChecked }),
                    ...(item.createdAt && { createdAt: item.createdAt })
                }))
            };
            
            // 创建下载链接
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.download = `bookmark-analysis-${this.activeTab}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            URL.revokeObjectURL(url);
            
            this.log(`分析结果已导出: ${link.download}`, 'success');
            
        } catch (error) {
            this.log(`导出失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 渲染日志 - 适配新布局
     */
    renderLogs() {
        const logsPanel = document.getElementById('logsPanel');
        const logsContent = document.getElementById('logsContent');
        const logsCount = document.getElementById('logsCount');
        
        if (!logsPanel || !logsContent || !logsCount) return;
        
        // 显示日志面板
        logsPanel.style.display = this.isAnalyzing || this.logs.length > 0 ? 'block' : 'none';
        
        // 更新日志计数
        logsCount.textContent = this.logs.length;
        
        // 渲染日志内容
        if (this.logs.length === 0) {
            logsContent.innerHTML = `
                <div style="padding: var(--space-4); text-align: center; color: var(--text-muted);">
                    <p style="margin: 0; font-size: 0.875rem;">暂无日志</p>
                </div>
            `;
        } else {
            logsContent.innerHTML = this.logs.map(log => this.renderLogEntry(log)).join('');
        }
        
        // 自动滚动到底部
        logsContent.scrollTop = logsContent.scrollHeight;
    }
    
    /**
     * 渲染单条日志条目 - 简化版
     */
    renderLogEntry(log) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const time = log.timestamp.toLocaleTimeString('zh-CN', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        return `
            <div class="log-entry">
                <span class="log-icon">${icons[log.type]}</span>
                <span class="log-msg">${log.message}</span>
                <span class="log-time">${time}</span>
            </div>
        `;
    }
    
    /**
     * 记录日志 - 优化版
     */
    log(message, type = 'info') {
        const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date(),
            message,
            type
        };
        
        // 限制日志数量，保持最近 100 条
        this.logs.push(logEntry);
        if (this.logs.length > 100) {
            this.logs.shift();
        }
        
        this.renderLogs();
        
        // 控制台输出（仅在开发时）
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${logEntry.timestamp.toLocaleTimeString()}] ${message}`);
    }
    
    /**
     * 处理错误
     */
    handleError(error) {
        console.error('❌ 分析中心错误:', error);
        this.log(`系统错误: ${error.message}`, 'error');
        this.isAnalyzing = false;
        this.updateAnalysisState();
    }

    /**
     * 应用分类结果到浏览器书签 ✨ 新增方法
     */
    async applyToBookmarks() {
        try {
            // 1. 检查是否有选中的结果
            const selectedResults = this.getSelectedResults();
            
            if (selectedResults.length === 0) {
                this.log('请先选择要应用的分类', 'warning');
                return;
            }

            // 2. 确认对话框
            const confirmApply = await this.showConfirmDialog(
                '确认应用',
                `确定要将 ${selectedResults.length} 个书签应用到分类吗？\n\n此操作会将书签移动到相应的文件夹。`
            );

            if (!confirmApply) {
                return;
            }

            // 3. 显示同步进度
            this.isSyncing = true;
            this.showSyncDialog();

            // 4. 设置日志回调
            this.bookmarkSyncer.setLogCallback((msg, type) => this.log(msg, type));

            // 5. 执行同步
            const syncResult = await this.bookmarkSyncer.syncCategorizedBookmarks(selectedResults);

            // 6. 显示同步结果
            this.showSyncResultDialog(syncResult);

            // 7. 更新UI
            this.isSyncing = false;
            this.renderResults();

            this.log('✨ 分类已成功应用到浏览器书签！', 'success');

        } catch (error) {
            this.isSyncing = false;
            this.log(`❌ 应用到书签失败: ${error.message}`, 'error');
        }
    }

    /**
     * 获取选中的结果 ✨ 辅助方法
     */
    getSelectedResults() {
        const results = this.results[this.activeTab] || [];
        
        return results.filter(item => this.selectedItems[item.id]);
    }

    /**
     * 显示确认对话框 ✨ 辅助方法
     */
    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            resolve(confirmed);
        });
    }

    /**
     * 显示同步进度对话框 ✨ 辅助方法
     */
    showSyncDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'sync-progress-dialog';
        dialog.className = 'sync-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h3>📌 正在应用到书签...</h3>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <p class="progress-text">准备中...</p>
                </div>
                <div class="sync-logs" style="max-height: 200px; overflow-y: auto; background: var(--bg-secondary); border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 12px;">
                    <!-- 日志会动态添加到这里 -->
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    /**
     * 显示同步结果对话框 ✨ 辅助方法
     */
    showSyncResultDialog(result) {
        const dialog = document.getElementById('sync-progress-dialog');
        
        if (dialog) {
            dialog.innerHTML = `
                <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
                <div class="dialog-content">
                    <h3>✨ 应用完成!</h3>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">✓ 成功</span>
                            <span class="stat-value">${result.success.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">✗ 失败</span>
                            <span class="stat-value">${result.failed.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">⏭️ 跳过</span>
                            <span class="stat-value">${result.skipped.length}</span>
                        </div>
                    </div>
                    
                    ${result.failed.length > 0 ? `
                        <div class="failed-list" style="margin-top: 12px; padding: 8px; background: rgba(220, 38, 38, 0.1); border-left: 3px solid #dc2626; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">失败的书签:</p>
                            ${result.failed.map(item => `
                                <div style="font-size: 12px; margin: 4px 0;">
                                    • ${item.title || item.id} - ${item.reason}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="btn btn-primary" onclick="document.getElementById('sync-progress-dialog').remove()">
                            完成
                        </button>
                        <button class="btn btn-secondary" onclick="window.analysisCenter.undoLastApply()">
                            ↩️ 撤销
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 撤销最后一次应用 ✨ 新增方法
     */
    async undoLastApply() {
        try {
            const undoCount = await this.bookmarkSyncer.undoLastSync();
            
            if (undoCount === null) {
                this.log('没有可撤销的操作', 'warning');
                return;
            }

            this.log(`✅ 已撤销 ${undoCount} 个书签的应用`, 'success');

        } catch (error) {
            this.log(`❌ 撤销失败: ${error.message}`, 'error');
        }
    }
}

// 页面加载完成后初始化分析中心
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 开始创建分析中心实例...');
        window.analysisCenter = new AnalysisCenter();
        console.log('✅ 分析中心实例创建成功');
        
        window.analysisCenter.init().catch(error => {
            console.error('❌ 初始化失败:', error);
            if (window.analysisCenter && window.analysisCenter.handleError) {
                window.analysisCenter.handleError(error);
            }
        });
    } catch (error) {
        console.error('❌ 创建分析中心失败:', error);
        console.error('错误详情:', error.stack);
        
        // 显示错误信息给用户
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 500px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>❌ 智能分析中心初始化失败</h3>
            <p>错误信息: ${error.message}</p>
            <p>请检查控制台获取详细信息</p>
            <button id="error-close-btn" style="margin-top: 10px; padding: 8px 16px; background: white; color: #ff4444; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
        `;
        document.body.appendChild(errorDiv);
        
        // 绑定关闭按钮事件
        const closeBtn = document.getElementById('error-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                errorDiv.remove();
            });
        }
    }
});

// 导出AnalysisCenter类供其他模块使用
export { AnalysisCenter };
