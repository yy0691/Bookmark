// 书签工作台增强版 - 主要JavaScript文件
// 集成模块化后端，采用Nextab风格UI

// 导入模块化后端
import { BookmarkAnalyzer } from './analyze_modular.js';

class BookmarkWorkbench {
    constructor() {
        // 初始化模块化后端
        this.analyzer = new BookmarkAnalyzer();
        
        // UI状态管理
        this.bookmarkTreeRoot = null;
        this.currentFolderNode = null;
        this.allBookmarks = [];
        this.filteredBookmarks = [];
        this.currentView = 'grid';
        this.currentGrouping = 'none';
        this.currentSorting = 'name';
        this.searchQuery = '';
        this.settings = this.loadSettings();
        this.currentLayout = 'three-col';
        
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 等待模块化后端初始化完成
            await this.analyzer.initialize();
            
            this.initializeEventListeners();
            this.updateClock();
            this.updateGreeting();
            await this.loadBookmarks();
            this.loadNotes();
            this.applyLayout();
            
            // 每秒更新时钟
            setInterval(() => this.updateClock(), 1000);
            
            // 初始化Lucide图标
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            console.log('BookmarkWorkbench initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BookmarkWorkbench:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterAndRenderBookmarks();
            });
            
            // 快捷键支持
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        }
        
        // 导航按钮事件
        this.bindNavEvents();
        
        // 控制面板事件
        this.bindControlEvents();
        
        // 模态框事件
        this.bindModalEvents();
        
        // 工具按钮事件
        this.bindToolEvents();
    }
    
    // 绑定导航事件
    bindNavEvents() {
        // 布局切换
        const layoutBtn = document.getElementById('layout-btn');
        if (layoutBtn) {
            layoutBtn.addEventListener('click', () => this.showLayoutModal());
        }
        
        // 视图切换
        const viewBtn = document.getElementById('view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.toggleView());
        }
        
        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
    }
    
    // 绑定控制面板事件
    bindControlEvents() {
        // 分组选择
        const groupSelect = document.getElementById('group-select');
        if (groupSelect) {
            groupSelect.addEventListener('change', (e) => {
                this.currentGrouping = e.target.value;
                this.filterAndRenderBookmarks();
            });
        }
        
        // 排序选择
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSorting = e.target.value;
                this.filterAndRenderBookmarks();
            });
        }
        
        // 视图切换按钮
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.setView(view);
            });
        });
    }
    
    // 绑定模态框事件
    bindModalEvents() {
        // 关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
            if (e.target.classList.contains('modal-close')) {
                this.closeModal(e.target.closest('.modal-overlay'));
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeModal(activeModal);
                }
            }
        });
    }
    
    // 绑定工具按钮事件
    bindToolEvents() {
        // 分析按钮
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.startAnalysis());
        }
        
        // 管理按钮
        const manageBtn = document.getElementById('manage-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => this.openBookmarkManager());
        }
        
        // 导出按钮
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportOptions());
        }
        
        // 设置按钮
        const settingsBtn = document.getElementById('quick-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
    }

    // 时钟更新
    updateClock() {
        const now = new Date();
        const timeDisplay = document.getElementById('time-display');
        const dateDisplay = document.getElementById('date-display');
        
        if (timeDisplay) {
            timeDisplay.textContent = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        if (dateDisplay) {
            dateDisplay.textContent = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
    }

    // 更新问候语
    updateGreeting() {
        const greetingText = document.getElementById('greeting-text');
        if (!greetingText) return;

        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 6) {
            greeting = '深夜好';
        } else if (hour < 12) {
            greeting = '早上好';
        } else if (hour < 18) {
            greeting = '下午好';
        } else {
            greeting = '晚上好';
        }
        
        greetingText.textContent = `${greeting}，欢迎使用书签工作台`;
    }

    // 加载书签数据
    async loadBookmarks() {
        try {
            this.showLoading('正在加载书签...');
            
            // 使用模块化后端获取书签
            const bookmarks = await this.analyzer.bookmarkService.getAllBookmarks();
            this.allBookmarks = bookmarks;
            this.filteredBookmarks = [...bookmarks];
            
            // 更新文件夹树
            await this.updateFolderTree();
            
            // 更新统计信息
            this.updateStats();
            
            // 渲染书签
            this.filterAndRenderBookmarks();
            
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.showError('加载书签失败');
            this.hideLoading();
        }
    }

    // 更新文件夹树
    async updateFolderTree() {
        const folderTree = document.getElementById('folder-tree');
        if (!folderTree) return;

        try {
            const tree = await this.analyzer.bookmarkService.getBookmarkTree();
            this.bookmarkTreeRoot = tree;
            
            folderTree.innerHTML = this.renderFolderTree(tree);
        } catch (error) {
            console.error('Failed to update folder tree:', error);
        }
    }

    // 渲染文件夹树
    renderFolderTree(node, level = 0) {
        if (!node.children) return '';
        
        return node.children.map(child => {
            if (child.url) return ''; // 跳过书签，只显示文件夹
            
            const count = this.countBookmarksInFolder(child);
            
            return `
                <div class="folder-item" data-folder-id="${child.id}" style="padding-left: ${level * 16}px">
                    <i data-lucide="folder" class="folder-icon"></i>
                    <span class="folder-name">${child.title || '未命名文件夹'}</span>
                    <span class="folder-count">${count}</span>
                </div>
                ${this.renderFolderTree(child, level + 1)}
            `;
        }).join('');
    }

    // 统计文件夹中的书签数量
    countBookmarksInFolder(folder) {
        let count = 0;
        
        function traverse(node) {
            if (node.url) {
                count++;
            } else if (node.children) {
                node.children.forEach(traverse);
            }
        }
        
        if (folder.children) {
            folder.children.forEach(traverse);
        }
        
        return count;
    }

    // 更新统计信息
    updateStats() {
        const totalBookmarks = this.allBookmarks.length;
        const totalFolders = this.countFolders(this.bookmarkTreeRoot);
        
        const totalStat = document.getElementById('total-bookmarks');
        const foldersStat = document.getElementById('total-folders');
        
        if (totalStat) totalStat.textContent = totalBookmarks;
        if (foldersStat) foldersStat.textContent = totalFolders;
    }

    // 统计文件夹数量
    countFolders(node) {
        if (!node || !node.children) return 0;
        
        let count = 0;
        node.children.forEach(child => {
            if (!child.url) { // 是文件夹
                count++;
                count += this.countFolders(child);
            }
        });
        
        return count;
    }

    // 过滤和渲染书签
    filterAndRenderBookmarks() {
        let filtered = [...this.allBookmarks];
        
        // 搜索过滤
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(bookmark => 
                bookmark.title.toLowerCase().includes(query) ||
                bookmark.url.toLowerCase().includes(query)
            );
        }
        
        // 排序
        filtered.sort((a, b) => {
            switch (this.currentSorting) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'url':
                    return a.url.localeCompare(b.url);
                case 'date':
                    return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
                default:
                    return 0;
            }
        });
        
        this.filteredBookmarks = filtered;
        this.renderBookmarks();
    }

    // 渲染书签
    renderBookmarks() {
        const container = document.getElementById('bookmarks-container');
        if (!container) return;

        if (this.filteredBookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="bookmark" style="width: 48px; height: 48px; color: var(--text-tertiary); margin-bottom: 16px;"></i>
                    <p style="color: var(--text-secondary);">没有找到书签</p>
                </div>
            `;
            return;
        }

        const bookmarksHtml = this.filteredBookmarks.map(bookmark => 
            this.renderBookmarkCard(bookmark)
        ).join('');

        container.innerHTML = `
            <div class="bookmarks-${this.currentView}">
                ${bookmarksHtml}
            </div>
        `;

        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // 渲染单个书签卡片
    renderBookmarkCard(bookmark) {
        const favicon = bookmark.url ? `https://icons.duckduckgo.com/ip3/${new URL(bookmark.url).hostname}.ico` : '';
        
        return `
            <div class="bookmark-card" data-bookmark-id="${bookmark.id}" onclick="window.open('${bookmark.url}', '_blank')">
                <img class="bookmark-favicon" src="${favicon}" alt="" onerror="this.style.display='none'">
                <div class="bookmark-title">${bookmark.title || '未命名书签'}</div>
                <div class="bookmark-url">${bookmark.url || ''}</div>
            </div>
        `;
    }

    // 设置视图模式
    setView(view) {
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderBookmarks();
    }

    // 应用布局
    applyLayout() {
        const grid = document.querySelector('.dashboard-grid');
        if (!grid) return;

        grid.className = `dashboard-grid layout-${this.currentLayout}`;
        
        // 根据布局调整组件可见性
        const leftSidebar = document.querySelector('.left-sidebar');
        const rightSidebar = document.querySelector('.right-sidebar');
        
        if (leftSidebar && rightSidebar) {
            switch (this.currentLayout) {
                case 'single':
                    leftSidebar.style.display = 'none';
                    rightSidebar.style.display = 'none';
                    break;
                case 'two-col':
                    leftSidebar.style.display = 'flex';
                    rightSidebar.style.display = 'none';
                    break;
                case 'three-col':
                default:
                    leftSidebar.style.display = 'flex';
                    rightSidebar.style.display = 'flex';
                    break;
            }
        }
    }

    // 显示布局选择模态框
    showLayoutModal() {
        const modal = document.getElementById('layout-modal');
        if (modal) {
            modal.classList.add('active');
            
            // 绑定布局选择事件
            const options = modal.querySelectorAll('.layout-option');
            options.forEach(option => {
                option.classList.toggle('active', option.dataset.layout === this.currentLayout);
                
                option.onclick = () => {
                    this.currentLayout = option.dataset.layout;
                    this.applyLayout();
                    this.saveSettings();
                    this.closeModal(modal);
                };
            });
        }
    }

    // 显示设置模态框
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            this.loadSettingsToModal();
        }
    }

    // 关闭模态框
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 加载笔记
    loadNotes() {
        const textarea = document.getElementById('notes-textarea');
        if (textarea) {
            const savedNotes = localStorage.getItem('bookmark-notes') || '';
            textarea.value = savedNotes;
            
            textarea.addEventListener('input', () => {
                localStorage.setItem('bookmark-notes', textarea.value);
            });
        }
    }

    // 加载设置
    loadSettings() {
        const defaultSettings = {
            layout: 'three-col',
            view: 'grid',
            grouping: 'none',
            sorting: 'name'
        };
        
        try {
            const saved = localStorage.getItem('bookmark-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    // 保存设置
    saveSettings() {
        const settings = {
            layout: this.currentLayout,
            view: this.currentView,
            grouping: this.currentGrouping,
            sorting: this.currentSorting
        };
        
        localStorage.setItem('bookmark-settings', JSON.stringify(settings));
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (overlay) {
            overlay.classList.add('active');
        }
        if (text) {
            text.textContent = message;
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // 显示错误信息
    showError(message) {
        // 简单的错误提示，可以后续改进为更好的UI
        alert(message);
    }

    // 启动分析
    async startAnalysis() {
        try {
            this.showLoading('正在分析书签...');
            await this.analyzer.startAnalysis();
            this.hideLoading();
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError('分析失败');
            this.hideLoading();
        }
    }

    // 打开书签管理器
    openBookmarkManager() {
        // 调用模块化后端的书签管理器
        if (this.analyzer.bookmarkManager) {
            this.analyzer.bookmarkManager.openManager();
        }
    }

    // 显示导出选项
    showExportOptions() {
        // 简单实现，可以后续改进
        const options = ['JSON', 'HTML', 'CSV'];
        const choice = prompt('选择导出格式:\n' + options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'));
        
        if (choice && choice >= 1 && choice <= options.length) {
            const format = options[choice - 1].toLowerCase();
            this.exportBookmarks(format);
        }
    }

    // 导出书签
    async exportBookmarks(format) {
        try {
            this.showLoading('正在导出...');
            await this.analyzer.importExportService.exportBookmarks(format);
            this.hideLoading();
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('导出失败');
            this.hideLoading();
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.bookmarkWorkbench = new BookmarkWorkbench();
});

// 导出类供其他脚本使用
export { BookmarkWorkbench };
