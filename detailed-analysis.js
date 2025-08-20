/**
 * 智能分析工作台 - 现代化重构版本
 * 基于 Nextab 工作台设计理念的模块化架构
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

// 现代化工作台应用类
class AnalysisWorkbench {
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
        
        // 工作台状态
        this.currentPanel = 'overview';
        this.isProcessing = false;
        this.analysisResults = {};
        this.systemStats = {};
        
        // 实时日志系统
        this.logContainer = null;
        this.maxLogEntries = 100;
        
        // 绑定服务回调
        this.setupServiceCallbacks();
    }
    
    // 设置服务回调
    setupServiceCallbacks() {
        const logCallback = (message, type) => this.addRealtimeLog(message, type);
        
        this.apiService.setLogCallback(logCallback);
        this.bookmarkService.setLogCallback(logCallback);
        this.visualizationService.setLogCallback(logCallback);
        this.importExportService.setLogCallback(logCallback);
        this.bookmarkManager.setLogCallback(logCallback);
        this.detectionService.setLogCallback(logCallback);
    }
    
    // 实时日志系统
    addRealtimeLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('zh-CN', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const logEntry = {
            timestamp,
            message,
            type,
            id: Date.now()
        };
        
        this.displayLogEntry(logEntry);
        
        // 限制日志条数
        this.cleanupOldLogs();
    }
    
    // 显示日志条目
    displayLogEntry(entry) {
        if (!this.logContainer) {
            this.logContainer = document.getElementById('realtime-log');
        }
        
        if (!this.logContainer) return;
        
        // 创建日志元素
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        logElement.innerHTML = `
            <div class="log-timestamp">${entry.timestamp}</div>
            <div class="log-level ${entry.type}">${entry.type.toUpperCase()}</div>
            <div class="log-message">${entry.message}</div>
        `;
        
        // 添加到日志容器
        this.logContainer.appendChild(logElement);
        
        // 自动滚动到底部
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    // 清理旧日志
    cleanupOldLogs() {
        if (!this.logContainer) return;
        
        const logEntries = this.logContainer.querySelectorAll('.log-entry');
        if (logEntries.length > this.maxLogEntries) {
            const toRemove = logEntries.length - this.maxLogEntries;
            for (let i = 0; i < toRemove; i++) {
                logEntries[i].remove();
            }
        }
    }
    
    // 清空日志
    clearRealtimeLog() {
        if (this.logContainer) {
            // 保留初始化日志
            this.logContainer.innerHTML = `
                <div class="log-entry">
                    <div class="log-timestamp">${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <div class="log-level info">INFO</div>
                    <div class="log-message">日志已清空</div>
                </div>
            `;
        }
    }
    
    // URL参数处理
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const panel = urlParams.get('panel') || urlParams.get('section');
        
        if (panel) {
            setTimeout(() => {
                this.switchPanel(panel);
            }, 100);
        }
    }
    
    // 初始化工作台
    async initialize() {
        try {
            console.log('🚀 智能分析工作台初始化...');
            
            // 显示系统状态
            this.updateSystemStatus('processing', '系统初始化中');
            this.addRealtimeLog('智能分析工作台启动', 'info');
            
            // 初始化UI管理器
            await this.uiManager.initialize();
            
            // 处理URL参数
            this.handleUrlParameters();
            
            // 初始化标签导航
            this.initializeTabNavigation();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 检查API状态
            await this.checkApiStatus();
            
            // 初始化各个功能模块
            await this.initializeServices();
            
            // 加载系统统计
            await this.loadSystemStats();
            
            // 显示就绪状态
            this.updateSystemStatus('online', '系统在线');
            this.addRealtimeLog('工作台初始化完成，所有功能可用', 'success');
            
        } catch (error) {
            console.error('工作台初始化失败:', error);
            this.updateSystemStatus('offline', '初始化失败');
            this.addRealtimeLog(`初始化失败: ${error.message}`, 'error');
        }
    }
    
    // 初始化服务模块
    async initializeServices() {
        try {
            this.addRealtimeLog('初始化服务模块...', 'info');
            
            // 初始化检测服务
            if (this.detectionService.initialize) {
                await this.detectionService.initialize();
            }
            
            // 初始化可视化服务
            if (this.visualizationService.initialize) {
                await this.visualizationService.initialize();
            }
            
            // 初始化导入导出服务
            if (this.importExportService.initialize) {
                await this.importExportService.initialize();
            }
            
            // 初始化书签管理器
            if (this.bookmarkManager.initialize) {
                await this.bookmarkManager.initialize();
            }
            
            this.addRealtimeLog('所有服务模块初始化完成', 'success');
        } catch (error) {
            this.addRealtimeLog(`服务模块初始化失败: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 系统状态更新
    updateSystemStatus(status, message) {
        const statusIndicator = document.getElementById('system-status');
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`;
            statusIndicator.innerHTML = `
                <div class="status-dot"></div>
                ${message}
            `;
        }
    }
    
    // --- 标签导航系统 ---
    initializeTabNavigation() {
        // 绑定标签切换事件
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                if (panel) {
                    this.switchPanel(panel);
                }
            });
        });
        
        // 默认显示概览面板
        this.switchPanel('overview');
    }
    
    // 切换到指定面板
    switchPanel(panelName) {
        // 隐藏所有面板
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 移除所有标签的激活状态
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 显示目标面板
        const targetPanel = document.getElementById(`${panelName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        
        // 激活对应的标签
        const targetTab = document.querySelector(`[data-panel="${panelName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 更新当前面板
        this.currentPanel = panelName;
        
        // 根据面板初始化特定功能
        this.initializePanelFeatures(panelName);
        
        this.addRealtimeLog(`切换到 ${panelName} 面板`, 'info');
    }
    
    // 初始化面板特定功能
    async initializePanelFeatures(panelName) {
        try {
            switch (panelName) {
                case 'overview':
                    // 概览面板 - 加载统计数据
                    await this.loadSystemStats();
                    break;
                    
                case 'ai-analysis':
                    // AI分析面板 - 检查API状态
                    await this.checkApiStatus();
                    break;
                    
                case 'visualization':
                    // 数据可视化面板
                    this.addRealtimeLog('数据可视化面板就绪', 'info');
                    break;
                    
                case 'detection':
                    // 质量检测面板
                    this.addRealtimeLog('质量检测面板就绪', 'info');
                    break;
                    
                case 'management':
                    // 书签管理面板
                    this.addRealtimeLog('书签管理面板就绪', 'info');
                    break;
                    
                case 'data-hub':
                    // 数据中心面板
                    this.addRealtimeLog('数据中心面板就绪', 'info');
                    break;
            }
        } catch (error) {
            this.addRealtimeLog(`面板初始化失败: ${error.message}`, 'error');
        }
    }
    
    // 加载系统统计数据
    async loadSystemStats() {
        try {
            this.addRealtimeLog('加载系统统计数据...', 'info');
            
            // 获取书签数据
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            const bookmarkTree = await this.bookmarkService.getTree();
            
            // 计算统计数据
            this.systemStats = {
                totalBookmarks: bookmarks.length,
                totalFolders: this.countFolders(bookmarkTree),
                duplicateCount: 0, // 将通过检测获得
                invalidCount: 0,   // 将通过检测获得
                emptyFoldersCount: 0, // 将通过检测获得
                analysisScore: this.calculateHealthScore(bookmarks)
            };
            
            // 更新UI显示
            this.updateStatsDisplay();
            
            this.addRealtimeLog('系统统计数据加载完成', 'success');
            
        } catch (error) {
            this.addRealtimeLog(`统计数据加载失败: ${error.message}`, 'error');
        }
    }
    
    // 更新统计显示
    updateStatsDisplay() {
        const statElements = {
            'total-bookmarks': this.systemStats.totalBookmarks,
            'total-folders': this.systemStats.totalFolders,
            'duplicate-count': this.systemStats.duplicateCount,
            'invalid-count': this.systemStats.invalidCount,
            'empty-folders-count': this.systemStats.emptyFoldersCount,
            'analysis-score': this.systemStats.analysisScore
        };
        
        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // 计算文件夹数量
    countFolders(node) {
        if (!node || !node.children) return 0;
        
        let count = 0;
        for (const child of node.children) {
            if (!child.url) { // 文件夹没有url属性
                count++;
                count += this.countFolders(child);
            }
        }
        return count;
    }
    
    // 计算健康评分
    calculateHealthScore(bookmarks) {
        if (bookmarks.length === 0) return 100;
        
        // 基础评分算法
        let score = 100;
        
        // 根据重复、失效等情况扣分（暂时使用模拟数据）
        const duplicateRatio = this.systemStats.duplicateCount / bookmarks.length;
        const invalidRatio = this.systemStats.invalidCount / bookmarks.length;
        
        score -= duplicateRatio * 30; // 重复书签扣分
        score -= invalidRatio * 40;   // 失效书签扣分
        
        return Math.max(0, Math.round(score));
    }
    
    // --- API状态检查 ---
    async checkApiStatus() {
        try {
            this.addRealtimeLog('检查API连接状态...', 'info');
            
            const settings = await this.apiService.getApiSettings();
            const isAvailable = await this.apiService.checkAvailability();
            
            // 更新API状态指示器
            const apiStatusIndicator = document.getElementById('api-status-indicator');
            if (apiStatusIndicator) {
                if (settings && settings.apiKey && isAvailable) {
                    apiStatusIndicator.className = 'status-indicator online';
                    apiStatusIndicator.innerHTML = '<div class="status-dot"></div>API已连接';
                    this.addRealtimeLog('API连接正常', 'success');
                    return true;
                } else if (settings && settings.apiKey) {
                    apiStatusIndicator.className = 'status-indicator processing';
                    apiStatusIndicator.innerHTML = '<div class="status-dot"></div>API已配置';
                    this.addRealtimeLog('API已配置但连接异常', 'warning');
                    return false;
                } else {
                    apiStatusIndicator.className = 'status-indicator offline';
                    apiStatusIndicator.innerHTML = '<div class="status-dot"></div>API未配置';
                    this.addRealtimeLog('API未配置，请在设置中配置', 'warning');
                    return false;
                }
            }
            
        } catch (error) {
            console.error('API状态检查失败:', error);
            this.addRealtimeLog(`API状态检查失败: ${error.message}`, 'error');
            
            const apiStatusIndicator = document.getElementById('api-status-indicator');
            if (apiStatusIndicator) {
                apiStatusIndicator.className = 'status-indicator offline';
                apiStatusIndicator.innerHTML = '<div class="status-dot"></div>API连接错误';
            }
            return false;
        }
    }
    
    // 设置API
    async setupApi() {
        try {
            this.addRealtimeLog('打开API设置...', 'info');
            
            // 获取当前设置
            const currentSettings = await this.apiService.getApiSettings() || {};
            
            // 创建设置对话框
            const modal = this.createApiSettingsModal(currentSettings);
            document.body.appendChild(modal);
            
            // 显示模态框
            modal.style.display = 'flex';
            
        } catch (error) {
            this.addRealtimeLog(`打开API设置失败: ${error.message}`, 'error');
        }
    }
    
    // 创建API设置模态框
    createApiSettingsModal(currentSettings) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content api-settings-modal">
                <div class="modal-header">
                    <h3>API设置</h3>
                    <button class="modal-close" data-action="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="api-settings-form">
                        <div class="form-group">
                            <label for="api-provider">API提供商</label>
                            <select id="api-provider" name="provider">
                                <option value="openai" ${currentSettings.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                                <option value="claude" ${currentSettings.provider === 'claude' ? 'selected' : ''}>Claude</option>
                                <option value="gemini" ${currentSettings.provider === 'gemini' ? 'selected' : ''}>Gemini</option>
                                <option value="custom" ${currentSettings.provider === 'custom' ? 'selected' : ''}>自定义</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="api-key">API密钥</label>
                            <input type="password" id="api-key" name="apiKey" 
                                   value="${currentSettings.apiKey || ''}" 
                                   placeholder="请输入API密钥">
                        </div>
                        <div class="form-group">
                            <label for="api-url">API地址 (可选)</label>
                            <input type="url" id="api-url" name="apiUrl" 
                                   value="${currentSettings.apiUrl || ''}" 
                                   placeholder="https://api.openai.com/v1">
                        </div>
                        <div class="form-group">
                            <label for="model-name">模型名称</label>
                            <input type="text" id="model-name" name="model" 
                                   value="${currentSettings.model || 'gpt-3.5-turbo'}" 
                                   placeholder="gpt-3.5-turbo">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="enable-proxy" name="enableProxy" 
                                       ${currentSettings.enableProxy ? 'checked' : ''}>
                                启用代理
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-action="close-modal">取消</button>
                    <button type="button" class="btn btn-primary" data-action="test-api">测试连接</button>
                    <button type="button" class="btn btn-success" data-action="save-api-settings">保存设置</button>
                </div>
            </div>
        `;
        
        // 绑定事件
        modal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'close-modal':
                    this.closeModal(modal);
                    break;
                case 'test-api':
                    this.testApiConnection(modal);
                    break;
                case 'save-api-settings':
                    this.saveApiSettings(modal);
                    break;
            }
        });
        
        return modal;
    }
    
    // 关闭模态框
    closeModal(modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    // 测试API连接
    async testApiConnection(modal) {
        try {
            const formData = new FormData(modal.querySelector('#api-settings-form'));
            const settings = Object.fromEntries(formData.entries());
            settings.enableProxy = formData.has('enableProxy');
            
            this.addRealtimeLog('测试API连接...', 'info');
            
            // 临时设置API配置进行测试
            const isConnected = await this.apiService.testConnection(settings);
            
            if (isConnected) {
                this.addRealtimeLog('API连接测试成功', 'success');
                this.showNotification('API连接测试成功', 'success');
            } else {
                this.addRealtimeLog('API连接测试失败', 'error');
                this.showNotification('API连接测试失败，请检查配置', 'error');
            }
            
        } catch (error) {
            this.addRealtimeLog(`API连接测试失败: ${error.message}`, 'error');
            this.showNotification(`连接测试失败: ${error.message}`, 'error');
        }
    }
    
    // 保存API设置
    async saveApiSettings(modal) {
        try {
            const formData = new FormData(modal.querySelector('#api-settings-form'));
            const settings = Object.fromEntries(formData.entries());
            settings.enableProxy = formData.has('enableProxy');
            
            // 验证必填字段
            if (!settings.apiKey) {
                this.showNotification('请输入API密钥', 'error');
                return;
            }
            
            this.addRealtimeLog('保存API设置...', 'info');
            
            // 保存设置
            await this.apiService.saveApiSettings(settings);
            
            // 重新检查API状态
            await this.checkApiStatus();
            
            this.addRealtimeLog('API设置保存成功', 'success');
            this.showNotification('API设置保存成功', 'success');
            
            // 关闭模态框
            this.closeModal(modal);
            
        } catch (error) {
            this.addRealtimeLog(`保存API设置失败: ${error.message}`, 'error');
            this.showNotification(`保存失败: ${error.message}`, 'error');
        }
    }
    
    // --- AI智能分析功能 ---
    async analyzeBookmarks() {
        if (this.isProcessing) {
            this.uiManager.addLog('分析正在进行中...', 'warning');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.uiManager.showLoading('正在进行AI分析...');
            this.uiManager.addLog('开始AI智能分析...', 'info');
            
            // 获取所有书签
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            if (bookmarks.length === 0) {
                this.uiManager.addLog('没有找到书签', 'warning');
                return;
            }
            
            // 获取API设置
            const settings = await this.apiService.getApiSettings();
            if (!settings || !settings.apiKey) {
                this.uiManager.addLog('请先配置API设置', 'error');
                return;
            }
            
            // 批量处理书签分析
            const results = await this.bookmarkService.categorizeBookmarks(bookmarks, settings, this.apiService);
            
            // 显示分析结果
            this.displayAnalysisResults(results);
            
            this.uiManager.addLog('AI分析完成', 'success');
            
        } catch (error) {
            console.error('分析失败:', error);
            this.uiManager.addLog(`分析失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
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
    
    // --- 现代化事件绑定系统 ---
    bindEventListeners() {
        console.log('🔧 开始绑定工作台事件...');
        
        // 工具栏按钮
        this.bindToolbarEvents();
        
        // 概览面板事件
        this.bindOverviewEvents();
        
        // AI分析面板事件
        this.bindAIAnalysisEvents();
        
        // 数据可视化面板事件
        this.bindVisualizationEvents();
        
        // 质量检测面板事件
        this.bindDetectionEvents();
        
        // 书签管理面板事件
        this.bindManagementEvents();
        
        // 数据中心面板事件
        this.bindDataHubEvents();
        
        // 全局事件委托
        this.bindGlobalEvents();
        
        // 键盘快捷键
        this.bindKeyboardShortcuts();

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
        
        // 生成图表事件
        document.getElementById('generate-charts-btn')?.addEventListener('click', () => {
            console.log('生成图表按钮被点击');
            this.generateCharts();
        });
        
        // 重新生成分类事件
        document.getElementById('regenerate-categories-btn')?.addEventListener('click', () => {
            console.log('重新生成分类按钮被点击');
            this.regenerateCategories();
        });
        
        // 整理到文件夹事件
        document.getElementById('organize-folders-btn')?.addEventListener('click', () => {
            console.log('整理到文件夹按钮被点击');
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
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            // 设置专用日志容器
            this.uiManager.setLogContainer('duplicates-log');
            
            this.uiManager.showLoading('正在检测重复书签...');
            this.uiManager.addLog('开始检测重复书签...', 'info');
            
            // 获取所有书签
            this.uiManager.addLog('正在获取书签数据...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            this.uiManager.updateProgress(1, 3, '书签数据获取完成');
            
            // 执行重复检测
            this.uiManager.addLog('正在分析重复书签...', 'info');
            const duplicates = await this.detectionService.detectDuplicateBookmarks();
            this.uiManager.updateProgress(2, 3, '重复检测完成');
            
            // 显示结果
            this.displayDuplicateResults(duplicates);
            this.switchSection('duplicates');
            this.uiManager.updateProgress(3, 3, '结果显示完成');
            
            this.uiManager.addLog(`检测完成，发现 ${duplicates.urlDuplicateCount + duplicates.titleDuplicateCount} 个重复书签`, 'success');
        } catch (error) {
            this.uiManager.addLog(`检测重复书签失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
            this.uiManager.resetProgress();
            // 恢复默认日志容器
            this.uiManager.setLogContainer('analysis-log');
        }
    }
    
    async detectInvalidBookmarks() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            // 设置专用日志容器
            this.uiManager.setLogContainer('invalid-log');
            
            this.uiManager.showLoading('正在检测失效书签...');
            this.uiManager.addLog('开始检测失效书签...', 'info');
            
            // 获取所有书签
            this.uiManager.addLog('正在获取书签数据...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            this.uiManager.updateProgress(1, 4, '书签数据获取完成');
            
            // 执行失效检测
            this.uiManager.addLog('正在检测失效链接...', 'info');
            const invalid = await this.detectionService.detectInvalidBookmarks();
            this.uiManager.updateProgress(3, 4, '失效检测完成');
            
            // 显示结果
            this.displayInvalidResults(invalid);
            this.switchSection('invalid');
            this.uiManager.updateProgress(4, 4, '结果显示完成');
            
            this.uiManager.addLog(`检测完成，发现 ${invalid.invalid} 个失效书签`, 'success');
        } catch (error) {
            this.uiManager.addLog(`检测失效书签失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
            this.uiManager.resetProgress();
            // 恢复默认日志容器
            this.uiManager.setLogContainer('analysis-log');
        }
    }
    
    async detectEmptyFolders() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            // 设置专用日志容器
            this.uiManager.setLogContainer('empty-folders-log');
            
            this.uiManager.showLoading('正在检测空文件夹...');
            this.uiManager.addLog('开始检测空文件夹...', 'info');
            
            // 获取书签树结构
            this.uiManager.addLog('正在获取书签树结构...', 'info');
            const bookmarkTree = await this.bookmarkService.getTree();
            this.uiManager.updateProgress(1, 3, '书签树获取完成');
            
            // 执行空文件夹检测
            this.uiManager.addLog('正在分析空文件夹...', 'info');
            const emptyFolders = await this.detectionService.detectEmptyFolders();
            this.uiManager.updateProgress(2, 3, '空文件夹检测完成');
            
            // 显示结果
            this.displayEmptyFolderResults(emptyFolders);
            this.switchSection('empty-folders');
            this.uiManager.updateProgress(3, 3, '结果显示完成');
            
            this.uiManager.addLog(`检测完成，发现 ${emptyFolders.count} 个空文件夹`, 'success');
        } catch (error) {
            this.uiManager.addLog(`检测空文件夹失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
            this.uiManager.resetProgress();
            // 恢复默认日志容器
            this.uiManager.setLogContainer('analysis-log');
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
    
    async generateCharts() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.uiManager.showLoading('正在生成图表...');
            this.uiManager.addLog('开始生成分析图表...', 'info');
            
            if (!this.analysisResults.categories || Object.keys(this.analysisResults.categories).length === 0) {
                this.uiManager.addLog('请先进行AI分析', 'warning');
                return;
            }
            
            // 准备图表数据
            this.uiManager.addLog('正在准备图表数据...', 'info');
            this.uiManager.updateProgress(1, 3, '数据准备完成');
            
            // 生成图表
            this.uiManager.addLog('正在渲染图表...', 'info');
            await this.visualizationService.generateCharts(this.analysisResults.categories);
            this.uiManager.updateProgress(2, 3, '图表生成完成');
            
            // 切换到图表页面
            this.switchSection('charts');
            this.uiManager.updateProgress(3, 3, '图表显示完成');
            
            this.uiManager.addLog('图表生成完成', 'success');
        } catch (error) {
            this.uiManager.addLog(`生成图表失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
            this.uiManager.resetProgress();
        }
    }
    
    async regenerateCategories() {
        if (this.isProcessing) return;
        
        if (!this.analysisResults.categories || Object.keys(this.analysisResults.categories).length === 0) {
            this.uiManager.addLog('请先进行AI分析', 'warning');
            return;
        }
        
        const confirm = window.confirm('确定要重新生成分类吗？这将覆盖当前的分类结果。');
        if (confirm) {
            try {
                this.isProcessing = true;
                this.uiManager.showLoading('正在重新生成分类...');
                this.uiManager.addLog('开始重新生成分类...', 'info');
                
                this.analysisResults = {};
                await this.analyzeBookmarks();
                
                this.uiManager.addLog('重新生成分类完成', 'success');
            } catch (error) {
                this.uiManager.addLog(`重新生成分类失败: ${error.message}`, 'error');
            } finally {
                this.isProcessing = false;
                this.uiManager.hideLoading();
            }
        }
    }
    
    async organizeBookmarksToFolders() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.uiManager.showLoading('正在整理书签到文件夹...');
            this.uiManager.addLog('开始整理书签到文件夹...', 'info');
            
            if (!this.analysisResults.categories) {
                this.uiManager.addLog('请先进行AI分析', 'warning');
                return;
            }
            
            // 创建文件夹并整理书签
            this.uiManager.addLog('正在创建分类文件夹...', 'info');
            this.uiManager.updateProgress(1, 3, '创建文件夹中');
            
            this.uiManager.addLog('正在移动书签到对应文件夹...', 'info');
            await this.bookmarkService.organizeToFolders(this.analysisResults.categories);
            this.uiManager.updateProgress(2, 3, '书签移动完成');
            
            this.uiManager.updateProgress(3, 3, '整理完成');
            this.uiManager.addLog('书签整理完成', 'success');
        } catch (error) {
            this.uiManager.addLog(`书签整理失败: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.uiManager.hideLoading();
            this.uiManager.resetProgress();
        }
    }
    
    // 显示检测结果
    displayDuplicateResults(duplicates) {
        const container = document.getElementById('duplicates-results');
        if (!container) return;
        
        // 更新统计信息
        this.systemStats.duplicateCount = duplicates.urlDuplicateCount + duplicates.titleDuplicateCount;
        this.updateStatsDisplay();
        
        container.innerHTML = `
            <div class="results-header">
                <h3>重复书签检测结果</h3>
                <div class="results-stats">
                    <span class="stat-item">URL重复: ${duplicates.urlDuplicateCount}</span>
                    <span class="stat-item">标题重复: ${duplicates.titleDuplicateCount}</span>
                    <span class="stat-item">总计: ${duplicates.urlDuplicateCount + duplicates.titleDuplicateCount}</span>
                </div>
                <div class="results-actions">
                    <button class="btn btn-danger" id="remove-selected-duplicates">删除选中</button>
                    <button class="btn btn-secondary" id="select-all-duplicates">全选</button>
                    <button class="btn btn-secondary" id="deselect-all-duplicates">取消全选</button>
                </div>
            </div>
            <div class="results-content">
                ${duplicates.urlDuplicates.map(group => `
                    <div class="duplicate-group">
                        <h4 class="group-header">URL重复组: ${group.url}</h4>
                        <div class="group-items">
                            ${group.bookmarks.map((bookmark, index) => `
                                <div class="bookmark-item ${index === 0 ? 'keep' : 'duplicate'}">
                                    <input type="checkbox" class="bookmark-checkbox" 
                                           data-id="${bookmark.id}" 
                                           ${index > 0 ? 'checked' : 'disabled'}>
                                    <div class="bookmark-content">
                                        <div class="bookmark-title">${bookmark.title}</div>
                                        <div class="bookmark-url">${bookmark.url}</div>
                                        <div class="bookmark-meta">
                                            <span class="bookmark-folder">${bookmark.parentTitle || '根目录'}</span>
                                            <span class="bookmark-date">${new Date(bookmark.dateAdded).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    ${index === 0 ? '<span class="keep-label">保留</span>' : '<span class="remove-label">删除</span>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                ${duplicates.titleDuplicates.map(group => `
                    <div class="duplicate-group">
                        <h4 class="group-header">标题重复组: ${group.title}</h4>
                        <div class="group-items">
                            ${group.bookmarks.map((bookmark, index) => `
                                <div class="bookmark-item ${index === 0 ? 'keep' : 'duplicate'}">
                                    <input type="checkbox" class="bookmark-checkbox" 
                                           data-id="${bookmark.id}" 
                                           ${index > 0 ? 'checked' : 'disabled'}>
                                    <div class="bookmark-content">
                                        <div class="bookmark-title">${bookmark.title}</div>
                                        <div class="bookmark-url">${bookmark.url}</div>
                                        <div class="bookmark-meta">
                                            <span class="bookmark-folder">${bookmark.parentTitle || '根目录'}</span>
                                            <span class="bookmark-date">${new Date(bookmark.dateAdded).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    ${index === 0 ? '<span class="keep-label">保留</span>' : '<span class="remove-label">删除</span>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 绑定批量操作事件
        this.bindDuplicateResultsEvents();
    }
    
    displayInvalidResults(invalid) {
        const container = document.getElementById('invalid-results');
        if (!container) return;
        
        // 更新统计信息
        this.systemStats.invalidCount = invalid.invalid;
        this.updateStatsDisplay();
        
        container.innerHTML = `
            <div class="results-header">
                <h3>失效书签检测结果</h3>
                <div class="results-stats">
                    <span class="stat-item">失效: ${invalid.invalid}</span>
                    <span class="stat-item">正常: ${invalid.valid}</span>
                    <span class="stat-item">跳过: ${invalid.skipped}</span>
                </div>
                <div class="results-actions">
                    <button class="btn btn-danger" id="remove-selected-invalid">删除选中</button>
                    <button class="btn btn-secondary" id="select-all-invalid">全选</button>
                    <button class="btn btn-secondary" id="deselect-all-invalid">取消全选</button>
                </div>
            </div>
            <div class="results-content">
                ${invalid.invalidBookmarks.map(bookmark => `
                    <div class="bookmark-item invalid">
                        <input type="checkbox" class="bookmark-checkbox" data-id="${bookmark.id}" checked>
                        <div class="bookmark-content">
                            <div class="bookmark-title">${bookmark.title}</div>
                            <div class="bookmark-url">${bookmark.url}</div>
                            <div class="bookmark-error">错误: ${bookmark.error}</div>
                            <div class="bookmark-meta">
                                <span class="bookmark-folder">${bookmark.parentTitle || '根目录'}</span>
                                <span class="bookmark-date">${new Date(bookmark.dateAdded).toLocaleDateString()}</span>
                                <span class="status-code">状态码: ${bookmark.statusCode || 'N/A'}</span>
                            </div>
                        </div>
                        <span class="remove-label">删除</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 绑定批量操作事件
        this.bindInvalidResultsEvents();
    }
    
    displayEmptyFolderResults(emptyFolders) {
        const container = document.getElementById('empty-folders-results');
        if (!container) return;
        
        // 更新统计信息
        this.systemStats.emptyFoldersCount = emptyFolders.count;
        this.updateStatsDisplay();
        
        container.innerHTML = `
            <div class="results-header">
                <h3>空文件夹检测结果</h3>
                <div class="results-stats">
                    <span class="stat-item">空文件夹: ${emptyFolders.count}</span>
                </div>
                <div class="results-actions">
                    <button class="btn btn-danger" id="remove-selected-folders">删除选中</button>
                    <button class="btn btn-secondary" id="select-all-folders">全选</button>
                    <button class="btn btn-secondary" id="deselect-all-folders">取消全选</button>
                </div>
            </div>
            <div class="results-content">
                ${emptyFolders.folders.map(folder => `
                    <div class="folder-item empty">
                        <input type="checkbox" class="folder-checkbox" data-id="${folder.id}" checked>
                        <div class="folder-content">
                            <div class="folder-title">${folder.title}</div>
                            <div class="folder-path">${folder.path}</div>
                            <div class="folder-meta">
                                <span class="folder-parent">${folder.parentTitle || '根目录'}</span>
                                <span class="folder-date">${new Date(folder.dateAdded).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <span class="remove-label">删除</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 绑定批量操作事件
        this.bindEmptyFolderResultsEvents();
    }
    
    // 绑定重复书签结果事件
    bindDuplicateResultsEvents() {
        const container = document.getElementById('duplicates-results');
        if (!container) return;
        
        // 删除选中
        const removeBtn = container.querySelector('#remove-selected-duplicates');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeSelectedDuplicates());
        }
        
        // 全选
        const selectAllBtn = container.querySelector('#select-all-duplicates');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllDuplicates(true));
        }
        
        // 取消全选
        const deselectAllBtn = container.querySelector('#deselect-all-duplicates');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.selectAllDuplicates(false));
        }
    }
    
    // 绑定失效书签结果事件
    bindInvalidResultsEvents() {
        const container = document.getElementById('invalid-results');
        if (!container) return;
        
        // 删除选中
        const removeBtn = container.querySelector('#remove-selected-invalid');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeSelectedInvalid());
        }
        
        // 全选
        const selectAllBtn = container.querySelector('#select-all-invalid');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllInvalid(true));
        }
        
        // 取消全选
        const deselectAllBtn = container.querySelector('#deselect-all-invalid');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.selectAllInvalid(false));
        }
    }
    
    // 绑定空文件夹结果事件
    bindEmptyFolderResultsEvents() {
        const container = document.getElementById('empty-folders-results');
        if (!container) return;
        
        // 删除选中
        const removeBtn = container.querySelector('#remove-selected-folders');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeSelectedEmptyFolders());
        }
        
        // 全选
        const selectAllBtn = container.querySelector('#select-all-folders');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllEmptyFolders(true));
        }
        
        // 取消全选
        const deselectAllBtn = container.querySelector('#deselect-all-folders');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.selectAllEmptyFolders(false));
        }
    }
    // --- 新增的事件绑定方法 ---
    
    // 工具栏事件绑定
    bindToolbarEvents() {
        this.bindEvent('refresh-btn', () => this.refreshWorkbench());
        this.bindEvent('settings-btn', () => this.openSettings());
        this.bindEvent('back-btn', () => window.history.back());
    }
    
    // 概览面板事件
    bindOverviewEvents() {
        this.bindEvent('quick-analyze-btn', () => this.runQuickAnalysis());
        this.bindDataAction('detect-duplicates', () => this.detectDuplicateBookmarks());
        this.bindDataAction('detect-invalid', () => this.detectInvalidBookmarks());
        this.bindDataAction('detect-empty', () => this.detectEmptyFolders());
        this.bindDataAction('ai-categorize', () => this.analyzeBookmarks());
    }
    
    // AI分析面板事件
    bindAIAnalysisEvents() {
        this.bindEvent('setup-api-btn', () => this.setupApi());
        this.bindEvent('analyze-bookmarks-btn', () => this.analyzeBookmarks());
        this.bindEvent('regenerate-categories-btn', () => this.regenerateCategories());
    }
    
    // 数据可视化面板事件
    bindVisualizationEvents() {
        this.bindEvent('generate-charts-btn', () => this.generateCharts());
        this.bindDataAttribute('data-viz', (type) => this.switchVisualization(type));
    }
    
    // 质量检测面板事件
    bindDetectionEvents() {
        this.bindEvent('detect-duplicates-btn', () => this.detectDuplicateBookmarks());
        this.bindEvent('detect-invalid-btn', () => this.detectInvalidBookmarks());
        this.bindEvent('detect-empty-folders-btn', () => this.detectEmptyFolders());
        this.bindEvent('export-detection-results', () => this.exportDetectionResults());
    }
    
    // 书签管理面板事件
    bindManagementEvents() {
        this.bindDataAction('batch-operations', () => this.showMessage('批量操作功能开发中'));
        this.bindDataAction('organize-folders', () => this.showMessage('文件夹整理功能开发中'));
        this.bindDataAction('merge-folders', () => this.showMessage('文件夹合并功能开发中'));
        this.bindDataAction('sort-bookmarks', () => this.showMessage('书签排序功能开发中'));
    }
    
    // 数据中心面板事件
    bindDataHubEvents() {
        this.bindEvent('export-backup-btn', () => this.importExportService.exportBookmarksBackup());
        this.bindEvent('import-backup-btn', () => this.showMessage('导入功能开发中'));
        this.bindEvent('export-csv-btn', () => this.exportCsv());
        this.bindEvent('generate-report-btn', () => this.generateReport());
        this.bindEvent('view-history-btn', () => this.showMessage('历史报告功能开发中'));
        this.bindEvent('schedule-report-btn', () => this.showMessage('定时报告功能开发中'));
    }
    
    // 全局事件委托
    bindGlobalEvents() {
        document.addEventListener('click', (event) => {
            this.handleDynamicButtonClick(event);
        });
    }
    
    // 通用事件绑定辅助方法
    bindEvent(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
            console.log(`✅ ${elementId} 事件已绑定`);
        } else {
            console.warn(`❌ 找不到元素: ${elementId}`);
        }
    }
    
    bindDataAction(action, handler) {
        document.addEventListener('click', (e) => {
            if (e.target.closest(`[data-action="${action}"]`)) {
                handler();
            }
        });
    }
    
    bindDataAttribute(attribute, handler) {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(`[${attribute}]`);
            if (target) {
                const value = target.getAttribute(attribute);
                if (value) {
                    handler(value);
                }
            }
        });
    }
    
    // --- 新增的工作台功能方法 ---
    
    // 刷新工作台
    async refreshWorkbench() {
        this.addRealtimeLog('刷新工作台数据...', 'info');
        await this.loadSystemStats();
        await this.checkApiStatus();
        this.addRealtimeLog('工作台数据刷新完成', 'success');
    }
    
    // 快速分析
    async runQuickAnalysis() {
        this.addRealtimeLog('开始快速分析...', 'info');
        
        try {
            // 并行执行基础检测
            const [duplicates, invalids, emptyFolders] = await Promise.all([
                this.detectionService.detectDuplicates(),
                this.detectionService.detectInvalid(),
                this.detectionService.detectEmptyFolders()
            ]);
            
            // 更新统计数据
            this.systemStats.duplicateCount = duplicates?.length || 0;
            this.systemStats.invalidCount = invalids?.length || 0;
            this.systemStats.emptyFoldersCount = emptyFolders?.length || 0;
            this.systemStats.analysisScore = this.calculateHealthScore({ length: this.systemStats.totalBookmarks });
            
            this.updateStatsDisplay();
            this.addRealtimeLog('快速分析完成', 'success');
            
        } catch (error) {
            this.addRealtimeLog(`快速分析失败: ${error.message}`, 'error');
        }
    }
    
    // 切换可视化类型
    switchVisualization(type) {
        this.addRealtimeLog(`切换到 ${type} 可视化`, 'info');
        // 这里可以集成可视化服务
        this.visualizationService.generateVisualization(type);
    }
    
    // 导出检测结果
    exportDetectionResults() {
        this.addRealtimeLog('导出检测结果...', 'info');
        this.importExportService.exportDetectionResults({
            duplicates: this.systemStats.duplicateCount,
            invalid: this.systemStats.invalidCount,
            emptyFolders: this.systemStats.emptyFoldersCount
        });
    }
    
    // 生成报告
    generateReport() {
        this.addRealtimeLog('生成系统报告...', 'info');
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.systemStats,
            analysis: this.analysisResults
        };
        
        this.importExportService.exportReport(report);
        this.addRealtimeLog('报告生成完成', 'success');
    }
    
    // 显示消息
    showMessage(message) {
        this.addRealtimeLog(message, 'info');
    }
    
    // 打开设置
    openSettings() {
        this.addRealtimeLog('打开设置页面...', 'info');
        window.open('options.html', '_blank');
    }
    
    // --- 批量操作功能 ---
    
    // 删除选中的重复书签
    async removeSelectedDuplicates() {
        const checkboxes = document.querySelectorAll('#duplicates-results .bookmark-checkbox:checked:not(:disabled)');
        const bookmarkIds = Array.from(checkboxes).map(cb => cb.dataset.id);
        
        if (bookmarkIds.length === 0) {
            this.showNotification('请选择要删除的书签', 'warning');
            return;
        }
        
        const confirmed = confirm(`确定要删除 ${bookmarkIds.length} 个重复书签吗？`);
        if (!confirmed) return;
        
        try {
            this.addRealtimeLog(`开始删除 ${bookmarkIds.length} 个重复书签...`, 'info');
            
            for (const id of bookmarkIds) {
                await this.bookmarkService.removeBookmark(id);
            }
            
            this.addRealtimeLog('重复书签删除完成', 'success');
            this.showNotification('重复书签删除完成', 'success');
            
            // 重新检测
            await this.detectDuplicateBookmarks();
            
        } catch (error) {
            this.addRealtimeLog(`删除重复书签失败: ${error.message}`, 'error');
            this.showNotification(`删除失败: ${error.message}`, 'error');
        }
    }
    
    // 删除选中的失效书签
    async removeSelectedInvalid() {
        const checkboxes = document.querySelectorAll('#invalid-results .bookmark-checkbox:checked');
        const bookmarkIds = Array.from(checkboxes).map(cb => cb.dataset.id);
        
        if (bookmarkIds.length === 0) {
            this.showNotification('请选择要删除的书签', 'warning');
            return;
        }
        
        const confirmed = confirm(`确定要删除 ${bookmarkIds.length} 个失效书签吗？`);
        if (!confirmed) return;
        
        try {
            this.addRealtimeLog(`开始删除 ${bookmarkIds.length} 个失效书签...`, 'info');
            
            for (const id of bookmarkIds) {
                await this.bookmarkService.removeBookmark(id);
            }
            
            this.addRealtimeLog('失效书签删除完成', 'success');
            this.showNotification('失效书签删除完成', 'success');
            
            // 重新检测
            await this.detectInvalidBookmarks();
            
        } catch (error) {
            this.addRealtimeLog(`删除失效书签失败: ${error.message}`, 'error');
            this.showNotification(`删除失败: ${error.message}`, 'error');
        }
    }
    
    // 删除选中的空文件夹
    async removeSelectedEmptyFolders() {
        const checkboxes = document.querySelectorAll('#empty-folders-results .folder-checkbox:checked');
        const folderIds = Array.from(checkboxes).map(cb => cb.dataset.id);
        
        if (folderIds.length === 0) {
            this.showNotification('请选择要删除的文件夹', 'warning');
            return;
        }
        
        const confirmed = confirm(`确定要删除 ${folderIds.length} 个空文件夹吗？`);
        if (!confirmed) return;
        
        try {
            this.addRealtimeLog(`开始删除 ${folderIds.length} 个空文件夹...`, 'info');
            
            for (const id of folderIds) {
                await this.bookmarkService.removeFolder(id);
            }
            
            this.addRealtimeLog('空文件夹删除完成', 'success');
            this.showNotification('空文件夹删除完成', 'success');
            
            // 重新检测
            await this.detectEmptyFolders();
            
        } catch (error) {
            this.addRealtimeLog(`删除空文件夹失败: ${error.message}`, 'error');
            this.showNotification(`删除失败: ${error.message}`, 'error');
        }
    }
    
    // 全选/取消全选重复书签
    selectAllDuplicates(select) {
        const checkboxes = document.querySelectorAll('#duplicates-results .bookmark-checkbox:not(:disabled)');
        checkboxes.forEach(cb => cb.checked = select);
    }
    
    // 全选/取消全选失效书签
    selectAllInvalid(select) {
        const checkboxes = document.querySelectorAll('#invalid-results .bookmark-checkbox');
        checkboxes.forEach(cb => cb.checked = select);
    }
    
    // 全选/取消全选空文件夹
    selectAllEmptyFolders(select) {
        const checkboxes = document.querySelectorAll('#empty-folders-results .folder-checkbox');
        checkboxes.forEach(cb => cb.checked = select);
    }
    
    // --- 通知系统 ---
    
    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // 添加到页面
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // 绑定关闭事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        // 添加动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }
    
    // 移除通知
    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // --- 导出功能增强 ---
    
    // 导出CSV
    async exportCsv() {
        try {
            this.addRealtimeLog('开始导出CSV...', 'info');
            
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            await this.importExportService.exportBookmarksAsCSV(bookmarks);
            
            this.addRealtimeLog('CSV导出完成', 'success');
            this.showNotification('CSV导出完成', 'success');
            
        } catch (error) {
            this.addRealtimeLog(`CSV导出失败: ${error.message}`, 'error');
            this.showNotification(`导出失败: ${error.message}`, 'error');
        }
    }
    
    // --- 面板切换增强 ---
    
    // 切换到指定区域（兼容旧版本）
    switchSection(sectionName) {
        // 兼容旧的switchSection调用
        this.switchPanel(sectionName);
    }
    
    // --- 错误处理增强 ---
    
    // 全局错误处理
    handleGlobalError(error, context = '') {
        console.error(`全局错误 [${context}]:`, error);
        this.addRealtimeLog(`系统错误 ${context}: ${error.message}`, 'error');
        this.showNotification(`系统错误: ${error.message}`, 'error');
    }
    
    // --- 性能监控 ---
    
    // 开始性能监控
    startPerformanceMonitor(operation) {
        const startTime = performance.now();
        return {
            end: () => {
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                this.addRealtimeLog(`${operation} 耗时: ${duration}ms`, 'info');
                return duration;
            }
        };
    }
}

// 初始化应用
let workbenchApp;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 显示加载状态
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        // 创建工作台实例
        workbenchApp = new AnalysisWorkbench();
        
        // 设置全局错误处理
        window.addEventListener('error', (event) => {
            if (workbenchApp) {
                workbenchApp.handleGlobalError(event.error, '全局异常');
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            if (workbenchApp) {
                workbenchApp.handleGlobalError(event.reason, 'Promise异常');
            }
        });
        
        // 初始化工作台
        await workbenchApp.initialize();
        
        // 初始化Lucide图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 隐藏加载状态
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        console.log('🎉 智能分析工作台初始化完成');
        
    } catch (error) {
        console.error('工作台初始化失败:', error);
        
        // 显示错误信息
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <h3>工作台初始化失败</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">重新加载</button>
                </div>
            `;
            errorContainer.style.display = 'flex';
        }
        
        // 隐藏加载状态
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
});

// 导出全局函数供 HTML 调用
window.workbenchApp = workbenchApp;

// 导出工作台类供其他模块使用
window.AnalysisWorkbench = AnalysisWorkbench;

// 页面卸载时的清理工作
window.addEventListener('beforeunload', () => {
    if (workbenchApp) {
        // 保存当前状态
        try {
            localStorage.setItem('workbench_last_panel', workbenchApp.currentPanel);
            localStorage.setItem('workbench_last_session', Date.now().toString());
        } catch (error) {
            console.warn('保存会话状态失败:', error);
        }
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (workbenchApp) {
        if (document.hidden) {
            // 页面隐藏时暂停某些操作
            workbenchApp.addRealtimeLog('页面已隐藏，暂停后台操作', 'info');
        } else {
            // 页面重新可见时恢复操作
            workbenchApp.addRealtimeLog('页面已激活，恢复操作', 'info');
            // 可以在这里刷新数据或重新检查状态
        }
    }
});

// --- 扩展功能方法 ---

// 键盘快捷键绑定
AnalysisWorkbench.prototype.bindKeyboardShortcuts = function() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + 数字键切换面板
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const panels = ['overview', 'ai-analysis', 'visualization', 'detection', 'management', 'data-hub'];
            const panelIndex = parseInt(e.key) - 1;
            if (panels[panelIndex]) {
                this.switchPanel(panels[panelIndex]);
            }
        }
        
        // Ctrl/Cmd + R 刷新
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshWorkbench();
        }
        
        // Ctrl/Cmd + S 保存设置
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentState();
        }
        
        // Esc 关闭模态框
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    this.closeModal(modal);
                }
            });
        }
    });
};

// 保存当前状态
AnalysisWorkbench.prototype.saveCurrentState = function() {
    try {
        const state = {
            currentPanel: this.currentPanel,
            systemStats: this.systemStats,
            analysisResults: this.analysisResults,
            timestamp: Date.now()
        };
        
        localStorage.setItem('workbench_state', JSON.stringify(state));
        this.addRealtimeLog('工作台状态已保存', 'success');
        this.showNotification('状态保存成功', 'success');
        
    } catch (error) {
        this.addRealtimeLog(`保存状态失败: ${error.message}`, 'error');
        this.showNotification('状态保存失败', 'error');
    }
};

// 恢复状态
AnalysisWorkbench.prototype.restoreState = function() {
    try {
        const savedState = localStorage.getItem('workbench_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // 检查状态是否过期（24小时）
            const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
            if (isExpired) {
                localStorage.removeItem('workbench_state');
                return false;
            }
            
            // 恢复状态
            this.currentPanel = state.currentPanel || 'overview';
            this.systemStats = state.systemStats || {};
            this.analysisResults = state.analysisResults || {};
            
            this.addRealtimeLog('工作台状态已恢复', 'info');
            return true;
        }
    } catch (error) {
        this.addRealtimeLog(`恢复状态失败: ${error.message}`, 'warning');
        localStorage.removeItem('workbench_state');
    }
    return false;
};

// 数据验证
AnalysisWorkbench.prototype.validateData = function(data, schema) {
    // 简单的数据验证逻辑
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['数据格式无效'] };
    }
    
    const errors = [];
    
    // 根据schema验证数据
    for (const [key, rules] of Object.entries(schema)) {
        if (rules.required && !(key in data)) {
            errors.push(`缺少必需字段: ${key}`);
        }
        
        if (key in data && rules.type && typeof data[key] !== rules.type) {
            errors.push(`字段 ${key} 类型错误，期望 ${rules.type}`);
        }
    }
    
    return { valid: errors.length === 0, errors };
};

// 数据清理
AnalysisWorkbench.prototype.cleanupData = function() {
    // 清理过期的缓存数据
    const keys = Object.keys(localStorage);
    const expiredKeys = keys.filter(key => {
        if (key.startsWith('workbench_cache_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                return Date.now() - data.timestamp > 60 * 60 * 1000; // 1小时过期
            } catch {
                return true; // 无效数据也清理
            }
        }
        return false;
    });
    
    expiredKeys.forEach(key => localStorage.removeItem(key));
    
    if (expiredKeys.length > 0) {
        this.addRealtimeLog(`清理了 ${expiredKeys.length} 个过期缓存`, 'info');
    }
};

// 获取系统信息
AnalysisWorkbench.prototype.getSystemInfo = function() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        timestamp: Date.now()
    };
};

// 性能统计
AnalysisWorkbench.prototype.getPerformanceStats = function() {
    if (!window.performance) return null;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
        domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        memoryUsage: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
    };
};

// 缓存管理
AnalysisWorkbench.prototype.cacheManager = {
    set: function(key, data, ttl = 3600000) { // 默认1小时
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(`workbench_cache_${key}`, JSON.stringify(cacheData));
            return true;
        } catch (error) {
            console.warn('缓存设置失败:', error);
            return false;
        }
    },
    
    get: function(key) {
        try {
            const cached = localStorage.getItem(`workbench_cache_${key}`);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
            
            if (isExpired) {
                localStorage.removeItem(`workbench_cache_${key}`);
                return null;
            }
            
            return cacheData.data;
        } catch (error) {
            console.warn('缓存读取失败:', error);
            return null;
        }
    },
    
    remove: function(key) {
        localStorage.removeItem(`workbench_cache_${key}`);
    },
    
    clear: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('workbench_cache_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// 工具函数集合
AnalysisWorkbench.prototype.utils = {
    // 防抖函数
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 格式化文件大小
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化时间
    formatTime: function(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}min`;
    },
    
    // 生成UUID
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // 深拷贝
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
};