/**
 * 详细分析页面 - 模块化重构版本
 * 基于功能整合文档的混合整合方案
 */

// 导入功能模块
import { ApiService } from './modules/apiService.js';
import { BookmarkService } from './modules/bookmarkService.js';
import { UIManager } from './modules/uiManager.js';
import { DetectionService } from './modules/detectionService.js';
import { VisualizationService } from './modules/visualizationService.js';
import { ImportExportService } from './modules/importExportService.js';
import { BookmarkManager } from './modules/bookmarkManager.js';
import { Utils } from './modules/utils.js';

// 分析页面主应用类
class DetailedAnalysisApp {
    constructor() {
        // 初始化服务模块
        this.apiService = new ApiService();
        this.bookmarkService = new BookmarkService();
        this.uiManager = new UIManager();
        this.detectionService = new DetectionService();
        this.visualizationService = new VisualizationService();
        this.importExportService = new ImportExportService();
        this.bookmarkManager = new BookmarkManager();
        this.utils = new Utils();
        
        // 应用状态
        this.currentSection = 'ai-analysis';
        this.isProcessing = false;
        this.analysisResults = {};
        
        // 绑定日志回调
        this.setupLogCallbacks();
    }
    
    // 设置日志回调
    setupLogCallbacks() {
        const logCallback = (message, type) => this.uiManager.addLogEntry(message, type);
        
        this.apiService.setLogCallback(logCallback);
        this.bookmarkService.setLogCallback(logCallback);
        this.detectionService.setLogCallback(logCallback);
        this.visualizationService.setLogCallback(logCallback);
        this.importExportService.setLogCallback(logCallback);
        this.bookmarkManager.setLogCallback(logCallback);
    }
    
    // URL参数处理
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        
        console.log('URL参数:', { section });
        
        if (section) {
            setTimeout(() => {
                this.switchSection(section);
            }, 100);
        }
    }
    
    // 初始化应用
    async initialize() {
        try {
            console.log('🚀 详细分析页面初始化...');
            console.log('当前URL:', window.location.href);
            console.log('DOM加载状态:', document.readyState);
            
            // 初始化UI管理器
            this.uiManager.initialize();
            
            // 处理URL参数
            this.handleUrlParameters();
            
            // 初始化导航
            this.initializeNavigation();
            
            // 绑定事件
            this.bindEvents();
            
            // 检查API状态
            await this.checkApiStatus();
            
            // 初始化各个功能模块
            await this.initializeModules();
            
            this.uiManager.addLogEntry('详细分析页面初始化完成', 'success');
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.uiManager.addLogEntry(`初始化失败: ${error.message}`, 'error');
        }
    }
    
    // 初始化功能模块
    async initializeModules() {
        // 初始化检测服务
        await this.detectionService.initialize();
        
        // 初始化可视化服务
        await this.visualizationService.initialize();
        
        // 初始化导入导出服务
        await this.importExportService.initialize();
        
        // 初始化书签管理器
        await this.bookmarkManager.initialize();
    }
    
    // --- 导航功能 ---
    initializeNavigation() {
        // 绑定侧边栏导航事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        
        // 默认显示AI分析区域
        this.switchSection('ai-analysis');
    }
    
    // 切换到指定区域
    switchSection(sectionName) {
        // 隐藏所有内容区域
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 移除所有导航项的激活状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 显示目标区域
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // 激活对应的导航项
        const targetNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }
        
        // 更新当前区域
        this.currentSection = sectionName;
        
        // 根据区域初始化特定功能
        this.initializeSectionFeatures(sectionName);
    }
    
    // 初始化区域特定功能
    async initializeSectionFeatures(sectionName) {
        switch (sectionName) {
            case 'ai-analysis':
                // AI分析区域
                break;
                
            case 'wordcloud':
                // 词云可视化
                await this.visualizationService.generateWordcloud();
                break;
                
            case 'treeview':
                // 树状图可视化
                await this.visualizationService.generateTreeview();
                break;
                
            case 'charts':
                // 统计图表
                await this.visualizationService.generateCharts();
                break;
                
            case 'bookmark-manager':
                // 书签管理器
                await this.bookmarkManager.loadBookmarks();
                break;
                
            case 'duplicates':
                // 重复检测
                break;
                
            case 'invalid':
                // 失效检测
                break;
                
            case 'empty-folders':
                // 空文件夹检测
                break;
                
            case 'export':
                // 导出功能
                break;
        }
    }
    
    // --- API状态检查 ---
    async checkApiStatus() {
        try {
            const settings = await this.apiService.getApiSettings();
            const statusElement = document.getElementById('api-status-text');
            
            if (settings && settings.apiKey) {
                if (statusElement) {
                    statusElement.textContent = 'API已配置';
                    statusElement.parentElement.className = 'api-status-display connected';
                }
                this.uiManager.addLogEntry('API配置检查成功', 'success');
                return true;
            } else {
                if (statusElement) {
                    statusElement.textContent = 'API未配置';
                    statusElement.parentElement.className = 'api-status-display';
                }
                this.uiManager.addLogEntry('API未配置，请在设置中配置', 'warning');
                return false;
            }
        } catch (error) {
            console.error('API状态检查失败:', error);
            this.uiManager.addLogEntry(`API状态检查失败: ${error.message}`, 'error');
            return false;
        }
    }
    
    // --- AI智能分析功能 ---
    async analyzeBookmarks() {
        if (this.isProcessing) {
            this.uiManager.addLogEntry('分析正在进行中...', 'warning');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.uiManager.showProgress(true);
            this.uiManager.addLogEntry('开始AI智能分析...', 'info');
            
            // 获取所有书签
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            if (bookmarks.length === 0) {
                this.uiManager.addLogEntry('没有找到书签', 'warning');
                return;
            }
            
            // 获取API设置
            const settings = await this.apiService.getApiSettings();
            if (!settings || !settings.apiKey) {
                this.uiManager.addLogEntry('请先配置API设置', 'error');
                return;
            }
            
            // 批量处理书签分析
            const results = await this.bookmarkService.analyzeBookmarks(bookmarks, settings);
            
            // 显示分析结果
            this.displayAnalysisResults(results);
            
            this.uiManager.addLogEntry('AI分析完成', 'success');
            
        } catch (error) {
            console.error('分析失败:', error);
            this.uiManager.addLogEntry(`分析失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.showProgress(false);
        }
    }
    
    // 显示分析结果
    displayAnalysisResults(results) {
        const resultsContainer = document.getElementById('analysis-results');
        if (!resultsContainer) return;
        
        this.analysisResults = results;
        
        // 清空现有内容
        resultsContainer.innerHTML = '';
        
        // 显示分类结果
        if (results.categories) {
            this.displayCategories(results.categories);
        }
        
        // 切换到结果页面
        this.switchSection('analysis-results');
    }
    
    // 显示分类结果
    displayCategories(categories) {
        const resultsContainer = document.getElementById('results-preview');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        Object.entries(categories).forEach(([category, items]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-group';
            categoryDiv.innerHTML = `
                <div class="category-header">
                    <h3 class="category-title">${category} (${items.length}个书签)</h3>
                    <button class="category-toggle" data-action="toggle-category" data-category="${category}">
                        展开/收起
                    </button>
                </div>
                <div class="category-items" id="category-${category}">
                    ${items.map(item => `
                        <div class="bookmark-item">
                            <div class="bookmark-title">${item.title}</div>
                            <div class="bookmark-url">${item.url}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            resultsContainer.appendChild(categoryDiv);
        });
    }
    
    // --- 事件绑定 ---
    bindEvents() {
        console.log('🔧 开始绑定事件...');
        
        // 顶部导航栏事件
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('刷新按钮被点击');
                location.reload();
            });
            console.log('✅ 刷新按钮事件已绑定');
        } else {
            console.warn('❌ 找不到刷新按钮');
        }
        
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('导出按钮被点击');
                this.switchSection('export');
            });
            console.log('✅ 导出按钮事件已绑定');
        } else {
            console.warn('❌ 找不到导出按钮');
        }
        
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('返回按钮被点击');
                window.history.back();
            });
            console.log('✅ 返回按钮事件已绑定');
        } else {
            console.warn('❌ 找不到返回按钮');
        }
        
        // AI分析相关事件
        const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                console.log('AI分析按钮被点击');
                this.analyzeBookmarks();
            });
            console.log('✅ AI分析按钮事件已绑定');
        } else {
            console.warn('❌ 找不到AI分析按钮');
        }
        
        document.getElementById('regenerate-categories-btn')?.addEventListener('click', () => {
            this.regenerateCategories();
        });
        
        document.getElementById('regenerate-categories-alt-btn')?.addEventListener('click', () => {
            this.regenerateCategories();
        });
        
        document.getElementById('organize-bookmarks-btn')?.addEventListener('click', () => {
            this.organizeBookmarksToFolders();
        });
        
        const setupApiBtn = document.getElementById('setup-api-btn');
        if (setupApiBtn) {
            setupApiBtn.addEventListener('click', () => {
                console.log('设置API按钮被点击');
                this.setupApi();
            });
            console.log('✅ 设置API按钮事件已绑定');
        } else {
            console.warn('❌ 找不到设置API按钮');
        }
        
        // 重复检测事件
        const detectDuplicatesBtn = document.getElementById('detect-duplicates-btn');
        if (detectDuplicatesBtn) {
            detectDuplicatesBtn.addEventListener('click', () => {
                console.log('检测重复书签按钮被点击');
                this.detectDuplicateBookmarks();
            });
            console.log('✅ 检测重复书签按钮事件已绑定');
        } else {
            console.warn('❌ 找不到检测重复书签按钮');
        }
        
        document.getElementById('remove-duplicates-btn')?.addEventListener('click', () => {
            this.detectionService.removeSelectedDuplicates();
        });
        
        // 失效检测事件
        document.getElementById('detect-invalid-btn')?.addEventListener('click', () => {
            this.detectInvalidBookmarks();
        });
        
        document.getElementById('remove-invalid-btn')?.addEventListener('click', () => {
            this.detectionService.removeSelectedInvalid();
        });
        
        // 空文件夹检测事件
        document.getElementById('detect-empty-folders-btn')?.addEventListener('click', () => {
            this.detectEmptyFolders();
        });
        
        document.getElementById('remove-empty-folders-btn')?.addEventListener('click', () => {
            this.detectionService.removeSelectedEmptyFolders();
        });
        
        // 导出功能事件
        document.getElementById('export-backup-btn')?.addEventListener('click', () => {
            this.importExportService.exportBookmarksBackup();
        });
        
        document.getElementById('export-ai-categories-btn')?.addEventListener('click', () => {
            this.importExportService.exportAiCategoriesAsCSV(this.analysisResults.categories);
        });
        
        // 全局事件委托 - 处理动态生成的按钮
        document.addEventListener('click', (event) => {
            this.handleDynamicButtonClick(event);
        });
        
        console.log('✅ 所有事件绑定完成');
    }
    
    // 处理动态按钮点击事件
    handleDynamicButtonClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch (action) {
            case 'switch-section':
                const targetSection = target.dataset.target;
                if (targetSection) {
                    this.switchSection(targetSection);
                }
                break;
                
            case 'toggle-category':
                const category = target.dataset.category;
                if (category) {
                    this.toggleCategoryItems(category);
                }
                break;
                
            case 'open-bookmark':
                const url = target.dataset.url;
                if (url) {
                    this.openBookmark(url);
                }
                break;
                
            default:
                console.warn('未知的动作:', action);
        }
    }
    
    // --- 书签检测功能 ---
    async detectDuplicateBookmarks() {
        try {
            this.uiManager.addLogEntry('开始检测重复书签...', 'info');
            const duplicates = await this.detectionService.detectDuplicates();
            this.displayDuplicateResults(duplicates);
            this.switchSection('duplicates');
            this.uiManager.addLogEntry(`检测完成，发现 ${duplicates.length} 组重复书签`, 'success');
        } catch (error) {
            this.uiManager.addLogEntry(`检测重复书签失败: ${error.message}`, 'error');
        }
    }
    
    async detectInvalidBookmarks() {
        try {
            this.uiManager.addLogEntry('开始检测失效书签...', 'info');
            const invalid = await this.detectionService.detectInvalid();
            this.displayInvalidResults(invalid);
            this.switchSection('invalid');
            this.uiManager.addLogEntry(`检测完成，发现 ${invalid.length} 个失效书签`, 'success');
        } catch (error) {
            this.uiManager.addLogEntry(`检测失效书签失败: ${error.message}`, 'error');
        }
    }
    
    async detectEmptyFolders() {
        try {
            this.uiManager.addLogEntry('开始检测空文件夹...', 'info');
            const emptyFolders = await this.detectionService.detectEmptyFolders();
            this.displayEmptyFolderResults(emptyFolders);
            this.switchSection('empty-folders');
            this.uiManager.addLogEntry(`检测完成，发现 ${emptyFolders.length} 个空文件夹`, 'success');
        } catch (error) {
            this.uiManager.addLogEntry(`检测空文件夹失败: ${error.message}`, 'error');
        }
    }
    
    // --- 工具函数 ---
    toggleCategoryItems(category) {
        const categoryItems = document.getElementById(`category-${category}`);
        if (categoryItems) {
            categoryItems.style.display = categoryItems.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    openBookmark(url) {
        window.open(url, '_blank');
    }
    
    setupApi() {
        window.open('options.html', '_blank');
    }
    
    async regenerateCategories() {
        if (!this.analysisResults.categories || Object.keys(this.analysisResults.categories).length === 0) {
            this.uiManager.addLogEntry('请先进行AI分析', 'warning');
            return;
        }
        
        const confirm = window.confirm('确定要重新生成分类吗？这将覆盖当前的分类结果。');
        if (confirm) {
            this.analysisResults = {};
            await this.analyzeBookmarks();
        }
    }
    
    async organizeBookmarksToFolders() {
        if (!this.analysisResults.categories) {
            this.uiManager.addLogEntry('请先进行AI分析', 'warning');
            return;
        }
        
        try {
            await this.bookmarkService.organizeToFolders(this.analysisResults.categories);
            this.uiManager.addLogEntry('书签整理完成', 'success');
        } catch (error) {
            this.uiManager.addLogEntry(`书签整理失败: ${error.message}`, 'error');
        }
    }
    
    // 显示检测结果
    displayDuplicateResults(duplicates) {
        const container = document.getElementById('duplicates-results');
        if (!container) return;
        
        container.innerHTML = duplicates.map(group => `
            <div class="duplicate-group">
                <h4>重复组: ${group.key}</h4>
                ${group.bookmarks.map(bookmark => `
                    <div class="bookmark-item">
                        <div class="bookmark-title">${bookmark.title}</div>
                        <div class="bookmark-url">${bookmark.url}</div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    displayInvalidResults(invalid) {
        const container = document.getElementById('invalid-results');
        if (!container) return;
        
        container.innerHTML = invalid.map(bookmark => `
            <div class="bookmark-item invalid">
                <div class="bookmark-title">${bookmark.title}</div>
                <div class="bookmark-url">${bookmark.url}</div>
                <div class="bookmark-error">${bookmark.error}</div>
            </div>
        `).join('');
    }
    
    displayEmptyFolderResults(emptyFolders) {
        const container = document.getElementById('empty-folders-results');
        if (!container) return;
        
        container.innerHTML = emptyFolders.map(folder => `
            <div class="folder-item empty">
                <div class="folder-title">${folder.title}</div>
                <div class="folder-path">${folder.path}</div>
            </div>
        `).join('');
    }
}

// 初始化应用
let detailedAnalysisApp;

document.addEventListener('DOMContentLoaded', async () => {
    detailedAnalysisApp = new DetailedAnalysisApp();
    await detailedAnalysisApp.initialize();
    
    // 初始化Lucide图标
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
});

// 导出全局函数供 HTML 调用
window.detailedAnalysisApp = detailedAnalysisApp;
