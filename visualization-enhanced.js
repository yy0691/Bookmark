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
            const indent = '  '.repeat(level);
            
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
        const favicon = bookmark.url ? `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32` : '';
        
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
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchSettingsTab(tab);
            });
        });

        // 工具按钮
        const toolItems = document.querySelectorAll('.tool-item');
        toolItems.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleToolAction(action);
            });
        });

        // 笔记保存
        const saveNotesBtn = document.getElementById('save-notes');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', () => this.saveNotes());
        }

        // 笔记自动保存
        const notesTextarea = document.getElementById('notes-textarea');
        if (notesTextarea) {
            notesTextarea.addEventListener('input', () => {
                clearTimeout(this.notesTimeout);
                this.notesTimeout = setTimeout(() => this.saveNotes(), 2000);
            });
        }
    }

    // 加载书签
    loadBookmarks() {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
            chrome.bookmarks.getTree((tree) => {
                this.bookmarkTreeRoot = tree[0];
                this.currentFolderNode = this.bookmarkTreeRoot;
                this.flattenBookmarks();
                this.renderFolders();
                this.filterAndRenderBookmarks();
                this.updateStats();
            });
        } else {
            // 开发环境模拟数据
            this.loadMockData();
        }
    }

    // 扁平化书签数据
    flattenBookmarks() {
        this.allBookmarks = [];
        this.flattenBookmarksRecursive(this.bookmarkTreeRoot);
    }

    flattenBookmarksRecursive(node) {
        if (node.children) {
            node.children.forEach(child => {
                if (child.url) {
                    // 这是一个书签
                    this.allBookmarks.push({
                        ...child,
                        parentId: node.id,
                        parentTitle: node.title || 'Root',
                        domain: this.extractDomain(child.url),
                        addedDate: child.dateAdded || Date.now(),
                        visitCount: Math.floor(Math.random() * 100), // 模拟访问次数
                        tags: this.generateTags(child.title, child.url)
                    });
                } else {
                    // 这是一个文件夹，递归处理
                    this.flattenBookmarksRecursive(child);
                }
            });
        }
    }

    // 提取域名
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    // 生成标签
    generateTags(title, url) {
        const tags = [];
        const domain = this.extractDomain(url);
        
        // 基于域名的标签
        if (domain.includes('github')) tags.push('开发');
        if (domain.includes('stackoverflow')) tags.push('编程');
        if (domain.includes('youtube')) tags.push('视频');
        if (domain.includes('twitter') || domain.includes('x.com')) tags.push('社交');
        if (domain.includes('news') || domain.includes('blog')) tags.push('阅读');
        
        // 基于标题的标签
        if (title.toLowerCase().includes('tutorial')) tags.push('教程');
        if (title.toLowerCase().includes('doc')) tags.push('文档');
        
        return tags.slice(0, 3); // 最多3个标签
    }

    // 渲染文件夹列表
    renderFolders() {
        const folderList = document.getElementById('folder-list');
        if (!folderList || !this.bookmarkTreeRoot) return;

        const folders = this.collectFolders(this.bookmarkTreeRoot);
        
        folderList.innerHTML = folders.map(folder => `
            <div class="folder-item ${folder.id === this.currentFolderNode.id ? 'active' : ''}" 
                 data-folder-id="${folder.id}">
                <i data-lucide="folder" class="folder-icon"></i>
                <span class="folder-name">${folder.title || '根目录'}</span>
                <span class="folder-count">${folder.bookmarkCount}</span>
            </div>
        `).join('');

        // 重新创建图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // 添加点击事件
        folderList.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = item.dataset.folderId;
                this.switchFolder(folderId);
            });
        });
    }

    // 收集所有文件夹
    collectFolders(node, folders = []) {
        if (node.title !== undefined) { // 排除根节点
            const bookmarkCount = this.countBookmarksInFolder(node);
            folders.push({
                id: node.id,
                title: node.title,
                bookmarkCount: bookmarkCount
            });
        }

        if (node.children) {
            node.children.forEach(child => {
                if (!child.url) { // 只处理文件夹
                    this.collectFolders(child, folders);
                }
            });
        }

        return folders;
    }

    // 计算文件夹中的书签数量
    countBookmarksInFolder(folder) {
        let count = 0;
        if (folder.children) {
            folder.children.forEach(child => {
                if (child.url) {
                    count++;
                } else {
                    count += this.countBookmarksInFolder(child);
                }
            });
        }
        return count;
    }

    // 切换文件夹
    switchFolder(folderId) {
        const folder = this.findFolderById(this.bookmarkTreeRoot, folderId);
        if (folder) {
            this.currentFolderNode = folder;
            this.renderFolders();
            this.filterAndRenderBookmarks();
            
            // 更新标题
            const title = document.getElementById('current-folder-title');
            if (title) {
                title.textContent = folder.title || '根目录';
            }
        }
    }

    // 根据ID查找文件夹
    findFolderById(node, targetId) {
        if (node.id === targetId) {
            return node;
        }
        
        if (node.children) {
            for (const child of node.children) {
                const found = this.findFolderById(child, targetId);
                if (found) return found;
            }
        }
        
        return null;
    }

    // 过滤和渲染书签
    filterAndRenderBookmarks() {
        let bookmarks = [...this.allBookmarks];

        // 如果选择了特定文件夹，只显示该文件夹的书签
        if (this.currentFolderNode && this.currentFolderNode.id !== this.bookmarkTreeRoot.id) {
            bookmarks = bookmarks.filter(bookmark => 
                bookmark.parentId === this.currentFolderNode.id
            );
        }

        // 搜索过滤
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            bookmarks = bookmarks.filter(bookmark =>
                bookmark.title.toLowerCase().includes(query) ||
                bookmark.url.toLowerCase().includes(query) ||
                bookmark.domain.toLowerCase().includes(query)
            );
        }

        this.filteredBookmarks = bookmarks;
        this.renderBookmarks();
    }

    // 渲染书签
    renderBookmarks() {
        const grid = document.getElementById('bookmarks-grid');
        if (!grid) return;

        // 根据分组方式组织书签
        const groupedBookmarks = this.groupBookmarks(this.filteredBookmarks);
        
        grid.innerHTML = '';
        grid.className = `bookmarks-grid ${this.currentView === 'list' ? 'list-view' : ''}`;

        Object.entries(groupedBookmarks).forEach(([groupName, bookmarks]) => {
            if (this.currentGrouping !== 'none' && Object.keys(groupedBookmarks).length > 1) {
                // 添加分组标题
                const groupHeader = document.createElement('div');
                groupHeader.className = 'group-header';
                groupHeader.innerHTML = `
                    <h3 style="grid-column: 1 / -1; color: var(--text-secondary); font-size: 0.875rem; margin: 1rem 0 0.5rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-primary);">
                        ${groupName} (${bookmarks.length})
                    </h3>
                `;
                grid.appendChild(groupHeader);
            }

            bookmarks.forEach(bookmark => {
                const card = this.createBookmarkCard(bookmark);
                grid.appendChild(card);
            });
        });
    }

    // 分组书签
    groupBookmarks(bookmarks) {
        if (this.currentGrouping === 'none') {
            return { '所有书签': bookmarks };
        }

        const groups = {};

        bookmarks.forEach(bookmark => {
            let groupKey;
            
            switch (this.currentGrouping) {
                case 'domain':
                    groupKey = bookmark.domain;
                    break;
                case 'date':
                    const date = new Date(bookmark.addedDate);
                    groupKey = date.toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    break;
                case 'folder':
                    groupKey = bookmark.parentTitle;
                    break;
                default:
                    groupKey = '未分组';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(bookmark);
        });

        return groups;
    }

    // 创建书签卡片
    createBookmarkCard(bookmark) {
        const card = document.createElement('div');
        card.className = `bookmark-card ${this.currentView === 'list' ? 'list-view' : ''}`;
        
        const favicon = this.getFaviconUrl(bookmark.url);
        const frequencyClass = this.getFrequencyClass(bookmark.visitCount);
        
        card.innerHTML = `
            <div class="bookmark-header">
                <div class="bookmark-favicon">
                    <img src="${favicon}" alt="" onerror="this.style.display='none'">
                </div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
                    <div class="bookmark-description">${bookmark.domain}</div>
                </div>
            </div>
            ${this.currentView === 'grid' ? `
                <div class="bookmark-url">${this.escapeHtml(bookmark.url)}</div>
                <div class="bookmark-meta">
                    <div class="bookmark-tags">
                        ${bookmark.tags.map(tag => `<span class="bookmark-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="bookmark-frequency ${frequencyClass}"></div>
                </div>
            ` : ''}
        `;

        // 添加点击事件
        card.addEventListener('click', () => {
            window.open(bookmark.url, '_blank');
        });

        return card;
    }

    // 获取网站图标URL
    getFaviconUrl(url) {
        try {
            const domain = new URL(url).origin;
            return `${domain}/favicon.ico`;
        } catch {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
        }
    }

    // 获取访问频率样式类
    getFrequencyClass(visitCount) {
        if (visitCount > 50) return 'high';
        if (visitCount > 10) return 'medium';
        return 'low';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 切换视图
    switchView(view) {
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`view-${view}`).classList.add('active');
        
        this.renderBookmarks();
        this.saveSettings();
    }

    // 更新时钟
    updateClock() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // 更新问候语
    updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        let greeting;
        
        if (hour < 6) greeting = 'Good night! 🌙';
        else if (hour < 12) greeting = 'Good morning! ☀️';
        else if (hour < 18) greeting = 'Good afternoon! 🌤️';
        else greeting = 'Good evening! 🌆';
        
        const greetingElement = document.getElementById('greeting-text');
        const timeElement = document.getElementById('greeting-time');
        
        if (greetingElement) {
            greetingElement.textContent = greeting;
        }
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleDateString('zh-CN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) + ' • ' + now.toLocaleTimeString('zh-CN', {
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // 更新统计信息
    updateStats() {
        const totalBookmarks = document.getElementById('total-bookmarks');
        const totalFolders = document.getElementById('total-folders');
        
        if (totalBookmarks) {
            totalBookmarks.textContent = this.allBookmarks.length;
        }
        
        if (totalFolders && this.bookmarkTreeRoot) {
            const folders = this.collectFolders(this.bookmarkTreeRoot);
            totalFolders.textContent = folders.length;
        }
    }

    // 处理工具操作
    handleToolAction(action) {
        switch (action) {
            case 'ai-analyze':
                this.startAIAnalysis();
                break;
            case 'detect-duplicates':
                this.detectDuplicates();
                break;
            case 'broken-links':
                this.checkBrokenLinks();
                break;
            case 'export-data':
                this.exportData();
                break;
        }
    }

    // AI分析功能
    startAIAnalysis() {
        alert('AI分析功能正在开发中...');
        // TODO: 实现AI分析功能
    }

    // 重复检测功能
    detectDuplicates() {
        const duplicates = [];
        const urlMap = new Map();
        
        this.allBookmarks.forEach(bookmark => {
            const url = bookmark.url.toLowerCase();
            if (urlMap.has(url)) {
                duplicates.push(bookmark);
            } else {
                urlMap.set(url, bookmark);
            }
        });
        
        if (duplicates.length > 0) {
            alert(`发现 ${duplicates.length} 个重复书签`);
        } else {
            alert('未发现重复书签');
        }
    }

    // 失效链接检测
    checkBrokenLinks() {
        alert('失效链接检测功能正在开发中...');
        // TODO: 实现失效链接检测
    }

    // 导出数据
    exportData() {
        const data = {
            bookmarks: this.allBookmarks,
            exportDate: new Date().toISOString(),
            totalCount: this.allBookmarks.length
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // 设置相关方法
    openSettings() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.loadSettingsContent('appearance');
        }
    }

    closeSettings() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    switchSettingsTab(tab) {
        // 更新导航状态
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // 更新标题
        const titles = {
            appearance: '外观设置',
            tools: '工具设置',
            data: '数据管理',
            personalization: '个性化设置',
            api: 'API设置'
        };
        
        const titleElement = document.getElementById('settings-title');
        if (titleElement) {
            titleElement.textContent = titles[tab] || '设置';
        }
        
        this.loadSettingsContent(tab);
    }

    loadSettingsContent(tab) {
        const contentArea = document.getElementById('settings-content-area');
        if (!contentArea) return;
        
        const content = this.getSettingsContent(tab);
        contentArea.innerHTML = content;
        
        // 重新创建图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getSettingsContent(tab) {
        switch (tab) {
            case 'appearance':
                return `
                    <div class="setting-group">
                        <h3>主题设置</h3>
                        <p class="description">自定义界面外观和主题</p>
                        <div class="setting-item">
                            <span class="setting-label">深色主题</span>
                            <button class="action-btn">已启用</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">动画效果</span>
                            <button class="action-btn">启用</button>
                        </div>
                    </div>
                `;
            case 'tools':
                return `
                    <div class="setting-group">
                        <h3>工具设置</h3>
                        <p class="description">配置各种分析和管理工具</p>
                        <div class="setting-item">
                            <span class="setting-label">AI智能分析</span>
                            <button class="action-btn primary">启动分析</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">重复书签检测</span>
                            <button class="action-btn">开始检测</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">失效链接检测</span>
                            <button class="action-btn">开始检测</button>
                        </div>
                    </div>
                `;
            case 'data':
                return `
                    <div class="setting-group">
                        <h3>数据管理</h3>
                        <p class="description">导入、导出和备份你的书签数据</p>
                        <div class="setting-item">
                            <span class="setting-label">导出书签</span>
                            <button class="action-btn primary">导出</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">导入书签</span>
                            <button class="action-btn">选择文件</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">清理数据</span>
                            <button class="action-btn danger">清理</button>
                        </div>
                    </div>
                `;
            case 'personalization':
                return `
                    <div class="setting-group">
                        <h3>个性化设置</h3>
                        <p class="description">自定义你的工作台布局和行为</p>
                        <div class="setting-item">
                            <span class="setting-label">默认视图</span>
                            <button class="action-btn">网格视图</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">自动保存笔记</span>
                            <button class="action-btn">已启用</button>
                        </div>
                    </div>
                `;
            case 'api':
                return `
                    <div class="setting-group">
                        <h3>API设置</h3>
                        <p class="description">配置外部服务和API密钥</p>
                        <div class="setting-item">
                            <span class="setting-label">AI服务提供商</span>
                            <button class="action-btn">OpenAI</button>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">API密钥</span>
                            <button class="action-btn">配置</button>
                        </div>
                    </div>
                `;
            default:
                return '<p>设置内容加载中...</p>';
        }
    }

    // 笔记相关方法
    loadNotes() {
        const textarea = document.getElementById('notes-textarea');
        if (textarea) {
            const savedNotes = localStorage.getItem('bookmark-notes');
            if (savedNotes) {
                textarea.value = savedNotes;
            }
        }
    }

    saveNotes() {
        const textarea = document.getElementById('notes-textarea');
        if (textarea) {
            localStorage.setItem('bookmark-notes', textarea.value);
        }
    }

    // 设置相关方法
    loadSettings() {
        const defaultSettings = {
            view: 'grid',
            grouping: 'none',
            theme: 'dark',
            animations: true
        };
        
        const saved = localStorage.getItem('bookmark-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        this.settings.view = this.currentView;
        this.settings.grouping = this.currentGrouping;
        localStorage.setItem('bookmark-settings', JSON.stringify(this.settings));
    }

    // 模拟数据（开发环境）
    loadMockData() {
        this.bookmarkTreeRoot = {
            id: '0',
            title: 'Root',
            children: [
                {
                    id: '1',
                    title: '工作',
                    children: [
                        {
                            id: '11',
                            title: 'GitHub',
                            url: 'https://github.com',
                            dateAdded: Date.now() - 86400000
                        },
                        {
                            id: '12',
                            title: 'Stack Overflow',
                            url: 'https://stackoverflow.com',
                            dateAdded: Date.now() - 172800000
                        }
                    ]
                },
                {
                    id: '2',
                    title: '学习',
                    children: [
                        {
                            id: '21',
                            title: 'MDN Web Docs',
                            url: 'https://developer.mozilla.org',
                            dateAdded: Date.now() - 259200000
                        }
                    ]
                }
            ]
        };
        
        this.currentFolderNode = this.bookmarkTreeRoot;
        this.flattenBookmarks();
        this.renderFolders();
        this.filterAndRenderBookmarks();
        this.updateStats();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BookmarkWorkbench();
});
