/**
 * 书签可视化 - 改进版
 * 方案一：渐进式重构实现
 */

class BookmarkVisualizer {
    constructor() {
        this.bookmarks = [];
        this.filteredBookmarks = [];
        this.currentFolder = null;
        this.currentView = 'cards'; // 'cards' | 'list'
        this.currentGroup = 'none'; // 'none' | 'domain' | 'date' | 'folder'
        this.searchQuery = '';
        this.settings = this.loadSettings();
        
        this.init();
    }

    async init() {
        console.log('🚀 初始化书签可视化器...');
        
        // 应用主题
        this.applyTheme();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载书签数据
        await this.loadBookmarks();
        
        // 初始化图标
        this.initializeIcons();
        
        console.log('✅ 初始化完成');
    }

    // --- 数据加载 ---
    async loadBookmarks() {
        try {
            this.showLoading(true);
            
            if (typeof chrome !== 'undefined' && chrome.bookmarks) {
                const tree = await new Promise(resolve => {
                    chrome.bookmarks.getTree(resolve);
                });
                
                this.bookmarks = this.flattenBookmarks(tree[0]);
                this.currentFolder = tree[0];
            } else {
                // 开发环境模拟数据
                this.bookmarks = this.generateMockBookmarks();
                this.currentFolder = { id: '0', title: '书签栏', children: [] };
            }
            
            this.filteredBookmarks = [...this.bookmarks];
            this.renderFolderTree();
            this.renderBookmarks();
            this.updateStats();
            
        } catch (error) {
            console.error('❌ 加载书签失败:', error);
            this.showNotification('加载书签失败', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    flattenBookmarks(node, parentPath = []) {
        let bookmarks = [];
        
        if (node.children) {
            const currentPath = [...parentPath, node.title || '根目录'];
            
            for (const child of node.children) {
                if (child.url) {
                    // 这是一个书签
                    bookmarks.push({
                        ...child,
                        parentPath: currentPath,
                        domain: this.extractDomain(child.url),
                        addedDate: child.dateAdded ? new Date(child.dateAdded) : new Date(),
                        frequency: this.getBookmarkFrequency(child.url)
                    });
                } else {
                    // 这是一个文件夹，递归处理
                    bookmarks = bookmarks.concat(
                        this.flattenBookmarks(child, currentPath)
                    );
                }
            }
        }
        
        return bookmarks;
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'unknown';
        }
    }

    getBookmarkFrequency(url) {
        // 模拟访问频率，实际应该从浏览器历史记录获取
        const frequencies = ['low', 'medium', 'high'];
        return frequencies[Math.floor(Math.random() * frequencies.length)];
    }

    // --- 渲染方法 ---
    renderFolderTree() {
        const treeContainer = document.getElementById('folder-tree');
        if (!treeContainer) return;

        // 构建文件夹树结构
        const folderStats = this.calculateFolderStats();
        const treeHTML = this.buildFolderTreeHTML(folderStats);
        
        treeContainer.innerHTML = treeHTML;
    }

    calculateFolderStats() {
        const stats = new Map();
        
        this.bookmarks.forEach(bookmark => {
            bookmark.parentPath.forEach((folderName, index) => {
                const path = bookmark.parentPath.slice(0, index + 1).join('/');
                if (!stats.has(path)) {
                    stats.set(path, {
                        name: folderName,
                        path: path,
                        count: 0,
                        level: index
                    });
                }
                stats.get(path).count++;
            });
        });
        
        return Array.from(stats.values()).sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }

    buildFolderTreeHTML(folderStats) {
        return folderStats.map(folder => `
            <div class="folder-item ${folder.path === this.getCurrentFolderPath() ? 'active' : ''}" 
                 data-path="${folder.path}"
                 style="padding-left: ${folder.level * 16 + 12}px">
                <i class="folder-icon" data-lucide="folder"></i>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-count">${folder.count}</span>
            </div>
        `).join('');
    }

    getCurrentFolderPath() {
        return this.currentFolder?.title || '书签栏';
    }

    renderBookmarks() {
        const container = document.getElementById('bookmark-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        if (this.filteredBookmarks.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        // 应用视图模式
        container.className = `bookmark-grid ${this.currentView === 'list' ? 'list-view' : ''}`;
        
        // 根据分组模式渲染
        const groupedBookmarks = this.groupBookmarks(this.filteredBookmarks);
        container.innerHTML = this.renderGroupedBookmarks(groupedBookmarks);
    }

    groupBookmarks(bookmarks) {
        switch (this.currentGroup) {
            case 'domain':
                return this.groupByDomain(bookmarks);
            case 'date':
                return this.groupByDate(bookmarks);
            case 'folder':
                return this.groupByFolder(bookmarks);
            default:
                return { '所有书签': bookmarks };
        }
    }

    groupByDomain(bookmarks) {
        const groups = {};
        bookmarks.forEach(bookmark => {
            const domain = bookmark.domain;
            if (!groups[domain]) groups[domain] = [];
            groups[domain].push(bookmark);
        });
        
        // 按书签数量排序
        return Object.fromEntries(
            Object.entries(groups).sort(([,a], [,b]) => b.length - a.length)
        );
    }

    groupByDate(bookmarks) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const groups = {
            '今天': [],
            '本周': [],
            '本月': [],
            '更早': []
        };
        
        bookmarks.forEach(bookmark => {
            const date = bookmark.addedDate;
            if (date >= today) {
                groups['今天'].push(bookmark);
            } else if (date >= thisWeek) {
                groups['本周'].push(bookmark);
            } else if (date >= thisMonth) {
                groups['本月'].push(bookmark);
            } else {
                groups['更早'].push(bookmark);
            }
        });
        
        // 移除空分组
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) delete groups[key];
        });
        
        return groups;
    }

    groupByFolder(bookmarks) {
        const groups = {};
        bookmarks.forEach(bookmark => {
            const folder = bookmark.parentPath[bookmark.parentPath.length - 1] || '根目录';
            if (!groups[folder]) groups[folder] = [];
            groups[folder].push(bookmark);
        });
        return groups;
    }

    renderGroupedBookmarks(groupedBookmarks) {
        let html = '';
        
        Object.entries(groupedBookmarks).forEach(([groupName, bookmarks]) => {
            if (this.currentGroup !== 'none') {
                html += `
                    <div class="group-header">
                        <span>${groupName}</span>
                        <span class="group-count">${bookmarks.length}</span>
                    </div>
                `;
            }
            
            html += bookmarks.map(bookmark => this.renderBookmarkCard(bookmark)).join('');
        });
        
        return html;
    }

    renderBookmarkCard(bookmark) {
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=32`;
        
        return `
            <div class="bookmark-card ${this.currentView === 'list' ? 'list-view' : ''}" 
                 data-id="${bookmark.id}"
                 data-url="${bookmark.url}">
                <div class="bookmark-header">
                    <div class="bookmark-favicon">
                        <img src="${faviconUrl}" 
                             alt="${bookmark.domain}" 
                             onerror="this.style.display='none'">
                    </div>
                    <div class="bookmark-info">
                        <div class="bookmark-title" title="${bookmark.title}">
                            ${bookmark.title}
                        </div>
                        <div class="bookmark-url" title="${bookmark.url}">
                            ${bookmark.url}
                        </div>
                        <div class="bookmark-domain">${bookmark.domain}</div>
                    </div>
                </div>
                <div class="bookmark-meta">
                    <div class="bookmark-tags">
                        ${bookmark.parentPath.slice(-2).map(path => 
                            `<span class="bookmark-tag">${path}</span>`
                        ).join('')}
                    </div>
                    <div class="bookmark-frequency ${bookmark.frequency}"></div>
                </div>
            </div>
        `;
    }

    // --- 搜索功能 ---
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (!query) {
            this.filteredBookmarks = [...this.bookmarks];
        } else {
            this.filteredBookmarks = this.bookmarks.filter(bookmark => 
                bookmark.title.toLowerCase().includes(this.searchQuery) ||
                bookmark.url.toLowerCase().includes(this.searchQuery) ||
                bookmark.domain.toLowerCase().includes(this.searchQuery)
            );
        }
        
        this.renderBookmarks();
        this.updateStats();
    }

    // --- 事件绑定 ---
    bindEvents() {
        // 搜索功能
        const searchInput = document.getElementById('search-input');
        const searchClear = document.getElementById('search-clear');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                this.handleSearch(query);
                
                if (searchClear) {
                    searchClear.style.display = query ? 'block' : 'none';
                }
            });
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearch('');
                searchClear.style.display = 'none';
                searchInput.focus();
            });
        }

        // 视图切换
        document.getElementById('view-cards')?.addEventListener('click', () => {
            this.setView('cards');
        });
        
        document.getElementById('view-list')?.addEventListener('click', () => {
            this.setView('list');
        });

        // 分组切换
        document.getElementById('group-select')?.addEventListener('change', (e) => {
            this.setGroup(e.target.value);
        });

        // 侧边栏切换
        document.getElementById('toggle-sidebar-btn')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 设置面板
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });
        
        document.getElementById('close-settings-btn')?.addEventListener('click', () => {
            this.closeSettings();
        });

        // 文件夹导航
        document.addEventListener('click', (e) => {
            if (e.target.closest('.folder-item')) {
                const folderPath = e.target.closest('.folder-item').dataset.path;
                this.navigateToFolder(folderPath);
            }
            
            if (e.target.closest('.bookmark-card')) {
                const url = e.target.closest('.bookmark-card').dataset.url;
                this.openBookmark(url);
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        searchInput?.focus();
                        break;
                    case ',':
                        e.preventDefault();
                        this.openSettings();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeSettings();
            }
        });
    }

    // --- 交互方法 ---
    setView(view) {
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`view-${view}`)?.classList.add('active');
        
        this.renderBookmarks();
        this.saveSettings();
    }

    setGroup(group) {
        this.currentGroup = group;
        this.renderBookmarks();
        this.saveSettings();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            
            // 在移动端使用不同的类
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('open');
            }
        }
    }

    navigateToFolder(folderPath) {
        // 更新活动状态
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-path="${folderPath}"]`)?.classList.add('active');
        
        // 过滤书签
        if (folderPath === '书签栏') {
            this.filteredBookmarks = [...this.bookmarks];
        } else {
            this.filteredBookmarks = this.bookmarks.filter(bookmark => 
                bookmark.parentPath.join('/').includes(folderPath)
            );
        }
        
        // 更新标题
        const folderName = folderPath.split('/').pop();
        document.getElementById('current-folder-title').textContent = folderName;
        
        this.renderBookmarks();
        this.updateStats();
    }

    openBookmark(url) {
        if (url) {
            window.open(url, '_blank');
        }
    }

    // --- 设置管理 ---
    openSettings() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeSettings() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    applyTheme() {
        const theme = this.settings.theme || 'auto';
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    // --- 工具方法 ---
    updateStats() {
        const statsElement = document.getElementById('display-stats');
        if (statsElement) {
            const count = this.filteredBookmarks.length;
            statsElement.innerHTML = `<span class="bookmark-count">${count} 个书签</span>`;
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const bookmarkGrid = document.getElementById('bookmark-grid');
        
        if (loadingState && bookmarkGrid) {
            loadingState.style.display = show ? 'flex' : 'none';
            bookmarkGrid.style.display = show ? 'none' : 'grid';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initializeIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // --- 数据持久化 ---
    loadSettings() {
        try {
            const saved = localStorage.getItem('bookmark-visualizer-settings');
            return saved ? JSON.parse(saved) : {
                theme: 'auto',
                view: 'cards',
                group: 'none',
                animations: true
            };
        } catch {
            return {
                theme: 'auto',
                view: 'cards',
                group: 'none',
                animations: true
            };
        }
    }

    saveSettings() {
        this.settings = {
            ...this.settings,
            view: this.currentView,
            group: this.currentGroup
        };
        
        try {
            localStorage.setItem('bookmark-visualizer-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('保存设置失败:', error);
        }
    }

    // --- 模拟数据（开发用） ---
    generateMockBookmarks() {
        const domains = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'css-tricks.com', 'codepen.io'];
        const folders = ['开发工具', '学习资源', '设计灵感', '技术博客'];
        
        return Array.from({ length: 50 }, (_, i) => {
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const folder = folders[Math.floor(Math.random() * folders.length)];
            
            return {
                id: `bookmark-${i}`,
                title: `示例书签 ${i + 1}`,
                url: `https://${domain}/example-${i}`,
                domain: domain,
                parentPath: ['书签栏', folder],
                addedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                frequency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
            };
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.bookmarkVisualizer = new BookmarkVisualizer();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkVisualizer;
}
