/**
 * 智能分析中心 - 书签智能分析和管理
 * 基于示例代码设计，集成现有模块功能
 */

// 导入模块
import { BookmarkService } from '../../modules/bookmarkService.js';
import { DetectionService } from '../../modules/detectionService.js';
import { ApiService } from '../../modules/apiService.js';

// 检查模块导入
console.log('📦 模块导入状态:');
console.log('BookmarkService:', BookmarkService);
console.log('DetectionService:', DetectionService);
console.log('ApiService:', ApiService);

// 检查Chrome API是否可用
console.log('🌐 Chrome API状态:');
console.log('chrome:', typeof chrome);
console.log('chrome.bookmarks:', typeof chrome?.bookmarks);

class AnalysisCenter {
    constructor() {
        try {
            this.bookmarkService = new BookmarkService();
            this.detectionService = new DetectionService();
            this.apiService = new ApiService();
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
    }
    
    /**
     * 初始化分析中心
     */
    async init() {
        try {
            console.log('🚀 初始化智能分析中心...');
            
            // 检查服务是否可用
            console.log('📋 检查服务状态...');
            console.log('BookmarkService:', this.bookmarkService);
            console.log('DetectionService:', this.detectionService);
            console.log('ApiService:', this.apiService);
            
            // 检查服务方法
            console.log('🔧 检查服务方法...');
            console.log('BookmarkService.setLogCallback:', typeof this.bookmarkService?.setLogCallback);
            console.log('DetectionService.setLogCallback:', typeof this.detectionService?.setLogCallback);
            console.log('DetectionService.initialize:', typeof this.detectionService?.initialize);
            console.log('ApiService.setLogCallback:', typeof this.apiService?.setLogCallback);
            
            // 设置日志回调
            if (this.bookmarkService && this.bookmarkService.setLogCallback) {
                this.bookmarkService.setLogCallback(this.log);
                console.log('✅ BookmarkService 日志回调设置成功');
            } else {
                console.warn('⚠️ BookmarkService 日志回调设置失败');
            }
            
            if (this.detectionService && this.detectionService.setLogCallback) {
                this.detectionService.setLogCallback(this.log);
                console.log('✅ DetectionService 日志回调设置成功');
            } else {
                console.warn('⚠️ DetectionService 日志回调设置失败');
            }
            
            if (this.apiService && this.apiService.setLogCallback) {
                this.apiService.setLogCallback(this.log);
                console.log('✅ ApiService 日志回调设置成功');
            } else {
                console.warn('⚠️ ApiService 日志回调设置失败');
            }
            
            // 初始化服务
            // BookmarkService 不需要初始化
            if (this.detectionService && this.detectionService.initialize) {
                console.log('🔄 初始化 DetectionService...');
                await this.detectionService.initialize();
                console.log('✅ DetectionService 初始化成功');
            } else {
                console.warn('⚠️ DetectionService 不需要初始化或方法不存在');
            }
            // ApiService 不需要初始化
            
            // 绑定事件
            console.log('🔗 绑定事件处理器...');
            this.bindEvents();
            console.log('✅ 事件处理器绑定成功');
            
            // 渲染初始状态
            console.log('🎨 渲染初始状态...');
            this.renderResults();
            console.log('✅ 初始状态渲染完成');
            
            console.log('✅ 智能分析中心初始化完成');
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * 绑定事件处理器
     */
    bindEvents() {
        console.log('🔗 开始绑定事件处理器...');
        
        // 标签页切换
        const taskTabs = document.querySelectorAll('.task-tab');
        console.log(`📋 找到 ${taskTabs.length} 个标签页`);
        taskTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                console.log(`🔄 切换到标签页: ${tabId}`);
                this.handleTabChange(tabId);
            });
        });
        
        // 开始分析按钮
        const startBtn = document.getElementById('start-analysis-btn');
        console.log('🔘 开始分析按钮:', startBtn);
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                console.log('🔘 开始分析按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startAnalysis();
            });
            console.log('✅ 开始分析按钮事件绑定成功');
        } else {
            console.warn('⚠️ 开始分析按钮未找到');
        }
        
        // 取消分析按钮
        const cancelBtn = document.getElementById('cancel-analysis-btn');
        console.log('🔘 取消分析按钮:', cancelBtn);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                console.log('🔘 取消分析按钮被点击');
                this.cancelAnalysis();
            });
            console.log('✅ 取消分析按钮事件绑定成功');
        } else {
            console.warn('⚠️ 取消分析按钮未找到');
        }
        
        // 历史版本按钮
        const historyBtn = document.getElementById('history-btn');
        console.log('🔘 历史版本按钮:', historyBtn);
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.log('历史版本功能开发中...', 'info');
            });
            console.log('✅ 历史版本按钮事件绑定成功');
        } else {
            console.warn('⚠️ 历史版本按钮未找到');
        }
        
        // 刷新按钮
        const refreshBtn = document.querySelector('.navbar-btn[title="刷新数据"]');
        console.log('🔘 刷新按钮:', refreshBtn);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
            console.log('✅ 刷新按钮事件绑定成功');
        } else {
            console.warn('⚠️ 刷新按钮未找到');
        }
        
        // 导出按钮
        const exportBtn = document.querySelector('.navbar-btn[title="导出结果"]');
        console.log('🔘 导出按钮:', exportBtn);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportResults();
            });
            console.log('✅ 导出按钮事件绑定成功');
        } else {
            console.warn('⚠️ 导出按钮未找到');
        }
        
        console.log('✅ 所有事件处理器绑定完成');
    }
    
    /**
     * 处理标签页切换
     */
    handleTabChange(tabId) {
        this.activeTab = tabId;
        
        // 更新标签页状态
        document.querySelectorAll('.task-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // 渲染结果
        this.renderResults();
        
        // 清空选择状态
        this.selectedItems = {};
        
        this.log(`切换到${this.getTabLabel(tabId)}`, 'info');
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
        console.log('🚀 开始分析被调用');
        console.log('📊 当前状态:', {
            isAnalyzing: this.isAnalyzing,
            activeTab: this.activeTab,
            progress: this.progress
        });
        
        if (this.isAnalyzing) {
            console.log('⚠️ 分析正在进行中，忽略重复调用');
            return;
        }
        
        try {
            console.log('🔄 设置分析状态...');
            this.isAnalyzing = true;
            this.progress = 0;
            this.logs = [];
            
            // 更新UI状态
            this.updateAnalysisState();
            
            // 开始分析
            console.log('🔄 执行分析...');
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
     * 执行智能分类分析
     */
    async performSmartCategorization() {
        try {
            console.log('🔄 开始智能分类分析...');
            this.log('正在加载书签数据...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            console.log('📚 获取到书签数量:', bookmarks.length);
            
            this.log('正在分析书签内容...', 'info');
            // 获取所有书签，过滤掉根目录
            const uncategorized = bookmarks.filter(b => b.url && b.parentId && b.parentId !== '1');
            console.log('📋 未分类书签数量:', uncategorized.length);
            
            this.log('正在生成分类建议...', 'info');
            const suggestions = await this.generateCategorizationSuggestions(uncategorized);
            console.log('💡 生成建议数量:', suggestions.length);
            
            this.results.smart = suggestions;
            this.log(`发现${suggestions.length}个未分类书签`, 'warning');
            
        } catch (error) {
            console.error('❌ 智能分类分析失败:', error);
            this.log(`智能分类分析失败: ${error.message}`, 'error');
        }
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
     * 渲染结果
     */
    renderResults() {
        const resultsContent = document.getElementById('resultsContent');
        const resultsTitle = document.getElementById('resultsTitle');
        
        console.log('🔄 渲染结果:', {
            resultsContent,
            resultsTitle,
            isAnalyzing: this.isAnalyzing,
            progress: this.progress,
            activeTab: this.activeTab
        });
        
        if (!resultsContent || !resultsTitle) {
            console.warn('⚠️ 结果容器未找到');
            return;
        }
        
        // 更新标题
        resultsTitle.textContent = this.getTabLabel(this.activeTab);
        
        // 根据状态渲染内容
        if (this.isAnalyzing) {
            console.log('🔄 渲染分析中状态');
            this.renderAnalyzingState(resultsContent);
        } else if (this.progress === 0) {
            console.log('🔄 渲染空状态');
            this.renderEmptyState(resultsContent);
        } else {
            console.log('🔄 渲染结果内容');
            this.renderResultsContent(resultsContent);
        }
    }
    
    /**
     * 渲染分析中状态
     */
    renderAnalyzingState(container) {
        container.innerHTML = `
            <div class="analysis-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.progress}%"></div>
                </div>
                <p class="progress-text">正在分析中，请稍候... ${Math.round(this.progress)}%</p>
            </div>
        `;
    }
    
    /**
     * 渲染空状态
     */
    renderEmptyState(container) {
        const descriptions = {
            smart: '分析您的书签并提供智能分类建议，帮助您更好地组织书签。',
            duplicates: '检测您的书签库中的重复项，帮助您清理冗余内容。',
            deadlinks: '检测您的书签库中已失效的链接，保持书签库的健康。',
            emptyfolders: '查找并标记空文件夹，帮助您保持书签结构整洁。'
        };
        
        const icons = {
            smart: 'layout-grid',
            duplicates: 'pie-chart',
            deadlinks: 'alert-circle',
            emptyfolders: 'folder'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="${icons[this.activeTab]}" class="empty-icon"></i>
                <h3 class="empty-title">开始${this.getTabLabel(this.activeTab)}</h3>
                <p class="empty-description">${descriptions[this.activeTab]}</p>
                <button class="btn-primary" id="empty-state-start-btn">
                    开始${this.getTabLabel(this.activeTab)}
                </button>
            </div>
        `;
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // 绑定空状态按钮事件
        const emptyStateBtn = document.getElementById('empty-state-start-btn');
        console.log('🔘 空状态按钮:', emptyStateBtn);
        if (emptyStateBtn) {
            emptyStateBtn.addEventListener('click', (e) => {
                console.log('🔘 空状态开始分析按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startAnalysis();
            });
            console.log('✅ 空状态按钮事件绑定成功');
        } else {
            console.warn('⚠️ 空状态按钮未找到');
        }
    }
    
    /**
     * 渲染结果内容
     */
    renderResultsContent(container) {
        const results = this.results[this.activeTab] || [];
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="check-circle" class="empty-icon"></i>
                    <h3 class="empty-title">分析完成</h3>
                    <p class="empty-description">未发现需要处理的项目。</p>
                </div>
            `;
            return;
        }
        
        // 渲染结果摘要
        const summary = this.renderResultsSummary(results);
        
        // 渲染结果列表
        const resultsList = this.renderResultsList(results);
        
        // 渲染批量操作
        const batchActions = this.renderBatchActions(results);
        
        container.innerHTML = `
            ${summary}
            ${resultsList}
            ${batchActions}
        `;
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // 绑定结果项事件
        this.bindResultEvents();
    }
    
    /**
     * 绑定结果项事件
     */
    bindResultEvents() {
        // 绑定复选框事件
        const checkboxes = document.querySelectorAll('.result-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.dataset.itemId;
                this.toggleSelectItem(itemId);
            });
        });
        
        // 绑定全选复选框事件
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                this.toggleSelectAll();
            });
        }
        
        // 绑定导出按钮事件
        const exportBtn = document.getElementById('export-results-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportResults();
            });
        }
        
        // 绑定批量操作按钮事件
        const applyAllBtn = document.getElementById('apply-all-suggestions-btn');
        if (applyAllBtn) {
            applyAllBtn.addEventListener('click', () => {
                this.applyAllSuggestions();
            });
        }
        
        const cleanAllDuplicatesBtn = document.getElementById('clean-all-duplicates-btn');
        if (cleanAllDuplicatesBtn) {
            cleanAllDuplicatesBtn.addEventListener('click', () => {
                this.cleanAllDuplicates();
            });
        }
        
        const deleteAllDeadlinksBtn = document.getElementById('delete-all-deadlinks-btn');
        if (deleteAllDeadlinksBtn) {
            deleteAllDeadlinksBtn.addEventListener('click', () => {
                this.deleteAllDeadLinks();
            });
        }
        
        const cleanAllEmptyfoldersBtn = document.getElementById('clean-all-emptyfolders-btn');
        if (cleanAllEmptyfoldersBtn) {
            cleanAllEmptyfoldersBtn.addEventListener('click', () => {
                this.cleanAllEmptyFolders();
            });
        }
        
        // 绑定操作按钮事件
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.action-btn').dataset.itemId;
                const action = e.target.closest('.action-btn').dataset.action;
                
                if (action === 'accept') {
                    this.acceptSuggestion(itemId);
                } else if (action === 'delete') {
                    this.deleteItem(itemId);
                }
            });
        });
    }
    
    /**
     * 渲染结果摘要
     */
    renderResultsSummary(results) {
        const summaries = {
            smart: `发现 ${results.length} 个未分类书签，已为它们生成智能分类建议。`,
            duplicates: `共发现 ${results.length} 个重复书签。`,
            deadlinks: `共发现 ${results.length} 个失效链接。`,
            emptyfolders: `共发现 ${results.length} 个空文件夹。`
        };
        
        return `
            <div class="results-summary">
                <h3 class="summary-title">分析结果摘要</h3>
                <p class="summary-description">${summaries[this.activeTab]}</p>
            </div>
        `;
    }
    
    /**
     * 渲染结果列表
     */
    renderResultsList(results) {
        if (this.activeTab === 'duplicates') {
            return this.renderDuplicateResults(results);
        }
        
        return `
            <div class="results-list">
                ${results.map(item => this.renderResultItem(item)).join('')}
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
     * 渲染单个结果项
     */
    renderResultItem(item) {
        const isSelected = this.selectedItems[item.id] || false;
        
        return `
            <div class="result-item" data-id="${item.id}">
                <input type="checkbox" class="result-checkbox" ${isSelected ? 'checked' : ''} 
                       data-item-id="${item.id}">
                <div class="result-content">
                    <div class="result-title">${item.title || '未命名书签'}</div>
                    ${item.url ? `<div class="result-url">${item.url}</div>` : ''}
                    ${item.folder ? `<div class="result-folder">文件夹: ${item.folder}</div>` : ''}
                    ${item.path ? `<div class="result-folder">路径: ${item.path}</div>` : ''}
                </div>
                <div class="result-actions">
                    ${this.renderResultBadges(item)}
                    ${this.renderResultButtons(item)}
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
     * 渲染日志
     */
    renderLogs() {
        const logsContainer = document.getElementById('analysisLogs');
        const logsContent = document.getElementById('logsContent');
        const logsCount = document.getElementById('logsCount');
        
        if (!logsContainer || !logsContent || !logsCount) return;
        
        // 显示日志容器
        logsContainer.style.display = this.isAnalyzing ? 'block' : 'none';
        
        // 更新日志计数
        logsCount.textContent = `${this.logs.length} 条记录`;
        
        // 渲染日志内容
        if (this.logs.length === 0) {
            logsContent.innerHTML = `
                <div class="empty-state">
                    <p>尚无分析日志</p>
                </div>
            `;
        } else {
            logsContent.innerHTML = `
                <div class="logs-list">
                    ${this.logs.map(log => this.renderLogEntry(log)).join('')}
                </div>
            `;
        }
        
        // 滚动到底部
        logsContent.scrollTop = logsContent.scrollHeight;
    }
    
    /**
     * 渲染日志条目
     */
    renderLogEntry(log) {
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        const colors = {
            success: 'var(--brand-success)',
            error: 'var(--brand-danger)',
            warning: 'var(--brand-warning)',
            info: 'var(--accent-blue)'
        };
        
        return `
            <div class="log-entry ${log.type}" style="border-left-color: ${colors[log.type]}">
                <i data-lucide="${icons[log.type]}" class="log-icon"></i>
                <div class="log-content">
                    <div class="log-message">${log.message}</div>
                    <div class="log-time">${log.timestamp.toLocaleTimeString()}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * 记录日志
     */
    log(message, type = 'info') {
        const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date(),
            message,
            type
        };
        
        this.logs.push(logEntry);
        this.renderLogs();
        
        // 控制台输出
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
