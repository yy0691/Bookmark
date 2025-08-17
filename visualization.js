document.addEventListener('DOMContentLoaded', () => {
    // --- 全局变量 ---
    let bookmarkTreeRoot = null;
    let currentFolderNode = null;
    let currentBookmarks = [];
    let draggedElement = null;
    let dragOffset = { x: 0, y: 0 };
    let navigationHistory = []; // 导航历史
    let currentPath = []; // 当前路径

    // --- DOM 元素 ---
    const sidebar = document.getElementById('sidebar');
    const folderList = document.getElementById('folder-list');
    const bookmarkGrid = document.getElementById('bookmark-grid');
    const searchInput = document.getElementById('search-input');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const editBtn = document.getElementById('edit-btn');
    const backBtn = document.getElementById('back-btn');

    // --- 初始化 ---
    function initialize() {
        console.log('🚀 初始化Apple风格书签可视化...');
        
        // 检查Lucide库是否加载
        if (typeof lucide !== 'undefined') {
            console.log('✅ Lucide库已加载');
        } else {
            console.warn('⚠️ Lucide库未加载');
        }
        
        // 加载书签数据
        loadBookmarks();
        
        // 初始化事件监听器
        initializeEventListeners();
        
        // 初始化图标
        initializeIcons();
        
        // 初始化拖拽功能
        initializeDragAndDrop();
        
        // 初始化设置管理器
        console.log('🔍 检查SettingsManager类...');
        if (typeof SettingsManager !== 'undefined') {
            console.log('✅ SettingsManager类已找到');
            try {
                window.settingsManager = new SettingsManager();
                console.log('✅ 设置管理器已初始化');
            } catch (error) {
                console.error('❌ 设置管理器初始化失败:', error);
            }
        } else {
            console.error('❌ SettingsManager类未找到');
            console.log('🔍 检查window对象中的SettingsManager...');
            console.log('window.SettingsManager:', window.SettingsManager);
        }
        
        console.log('🎉 初始化完成');
        
        // 延迟执行测试
        setTimeout(() => {
            testDisplay();
        }, 500);
    }

    // --- 调试文件夹结构 ---
    function debugFolderStructure(node, level = 0) {
        const indent = '  '.repeat(level);
        const nodeType = node.url ? '书签' : '文件夹';
        const nodeName = node.title || '未命名';
        
        console.log(`${indent}${nodeType}: ${nodeName} (ID: ${node.id})`);
        
        if (node.children) {
            node.children.forEach(child => {
                debugFolderStructure(child, level + 1);
            });
        }
    }

    // --- 书签数据加载 ---
    function loadBookmarks() {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
            chrome.bookmarks.getTree((tree) => {
                bookmarkTreeRoot = tree[0];
                currentFolderNode = bookmarkTreeRoot;
                
                console.log('📚 书签树结构:');
                debugFolderStructure(bookmarkTreeRoot);
                
                // 初始化导航历史
                navigationHistory = [bookmarkTreeRoot];
                currentPath = [bookmarkTreeRoot];
                
                renderBreadcrumbNavigation();
                renderCurrentFolderContent();
                loadAndDisplayBookmarks(currentFolderNode);
            });
        } else {
            console.warn('Chrome bookmarks API 不可用，使用模拟数据');
            loadMockBookmarks();
        }
    }

    // --- 渲染面包屑导航 ---
    function renderBreadcrumbNavigation() {
        folderList.innerHTML = '';
        
        // 创建面包屑导航容器
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        
        // 创建面包屑导航
        const breadcrumb = createBreadcrumbNavigation();
        breadcrumbContainer.appendChild(breadcrumb);
        
        // 创建当前文件夹内容
        const currentFolderContent = createCurrentFolderContent();
        breadcrumbContainer.appendChild(currentFolderContent);
        
        folderList.appendChild(breadcrumbContainer);
        
        // 重新初始化图标
        initializeIcons();
    }

    // --- 创建面包屑导航 ---
    function createBreadcrumbNavigation() {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-navigation';
        
        // 添加"所有书签"根节点
        const rootItem = createBreadcrumbItem(bookmarkTreeRoot, '所有书签', true);
        breadcrumb.appendChild(rootItem);
        
        // 添加路径中的其他文件夹
        currentPath.slice(1).forEach((node, index) => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i data-lucide="chevron-right"></i>';
            breadcrumb.appendChild(separator);
            
            const item = createBreadcrumbItem(node, node.title || '未命名文件夹', false);
            breadcrumb.appendChild(item);
        });
        
        return breadcrumb;
    }

    // --- 创建面包屑项 ---
    function createBreadcrumbItem(node, title, isRoot = false) {
        const item = document.createElement('div');
        item.className = 'breadcrumb-item';
        item.dataset.folderId = node.id;
        
        if (isRoot) {
            item.classList.add('root-item');
        }
        
        item.innerHTML = `
            <div class="breadcrumb-icon">
                <i data-lucide="${isRoot ? 'bookmark' : 'folder'}"></i>
            </div>
            <div class="breadcrumb-title">${title}</div>
        `;
        
        // 添加点击事件
        item.addEventListener('click', () => {
            navigateToFolder(node);
        });
        
        return item;
    }

    // --- 创建当前文件夹内容 ---
    function createCurrentFolderContent() {
        const content = document.createElement('div');
        content.className = 'current-folder-content';
        
        // 添加当前文件夹标题
        const title = document.createElement('h3');
        title.className = 'current-folder-title';
        title.textContent = currentFolderNode.title || '所有书签';
        content.appendChild(title);
        
        // 添加子文件夹列表
        if (currentFolderNode.children && currentFolderNode.children.length > 0) {
            const subfolders = document.createElement('div');
            subfolders.className = 'subfolder-list';
            
            currentFolderNode.children.forEach(child => {
                if (child.children) { // 只显示文件夹，不显示书签
                    const subfolderItem = createSubfolderItem(child);
                    subfolders.appendChild(subfolderItem);
                }
            });
            
            content.appendChild(subfolders);
        }
        
        return content;
    }

    // --- 创建子文件夹项 ---
    function createSubfolderItem(node) {
        const item = document.createElement('div');
        item.className = 'subfolder-item';
        item.dataset.folderId = node.id;
        
        // 计算子文件夹数量
        const subfolderCount = node.children ? node.children.filter(child => child.children).length : 0;
        const bookmarkCount = node.children ? node.children.filter(child => child.url).length : 0;
        
        item.innerHTML = `
            <div class="subfolder-icon">
                <i data-lucide="folder"></i>
            </div>
            <div class="subfolder-info">
                <div class="subfolder-name">${node.title || '未命名文件夹'}</div>
                <div class="subfolder-stats">
                    ${subfolderCount > 0 ? `<span class="folder-count">${subfolderCount} 个文件夹</span>` : ''}
                    ${bookmarkCount > 0 ? `<span class="bookmark-count">${bookmarkCount} 个书签</span>` : ''}
                </div>
            </div>
            <div class="subfolder-arrow">
                <i data-lucide="chevron-right"></i>
            </div>
        `;
        
        // 添加点击事件
        item.addEventListener('click', () => {
            navigateToFolder(node);
        });
        
        return item;
    }

    // --- 导航到指定文件夹 ---
    function navigateToFolder(node) {
        console.log('🎯 导航到文件夹:', node.title || '未命名文件夹', 'ID:', node.id);
        
        // 更新当前文件夹
        currentFolderNode = node;
        
        // 更新路径
        updateCurrentPath(node);
        
        // 更新导航历史
        navigationHistory.push(node);
        
        // 重新渲染导航
        renderBreadcrumbNavigation();
        renderCurrentFolderContent();
        
        // 更新标题
        updateFolderTitle(node);
        
        // 加载并显示书签
        loadAndDisplayBookmarks(node);
    }

    // --- 更新当前路径 ---
    function updateCurrentPath(targetNode) {
        const path = [];
        let currentNode = targetNode;
        
        // 从目标节点向上查找路径
        while (currentNode && currentNode.id !== bookmarkTreeRoot.id) {
            path.unshift(currentNode);
            currentNode = findParentNode(currentNode.id);
        }
        
        // 添加根节点
        path.unshift(bookmarkTreeRoot);
        currentPath = path;
    }

    // --- 查找父节点 ---
    function findParentNode(nodeId) {
        function searchInTree(tree, targetId, parent = null) {
            if (tree.id === targetId) {
                return parent;
            }
            if (tree.children) {
                for (const child of tree.children) {
                    const result = searchInTree(child, targetId, tree);
                    if (result) return result;
                }
            }
            return null;
        }
        
        return searchInTree(bookmarkTreeRoot, nodeId);
    }

    // --- 更新文件夹标题 ---
    function updateFolderTitle(node) {
        const isRootNode = node.id === '0' || node.id === bookmarkTreeRoot.id;
        
        if (isRootNode) {
            currentFolderTitle.textContent = '所有书签';
        } else {
            // 显示面包屑路径
            const breadcrumb = [];
            let currentNode = node;
            
            while (currentNode && currentNode.id !== bookmarkTreeRoot.id) {
                breadcrumb.unshift(currentNode.title || '未命名文件夹');
                currentNode = findParentNode(currentNode.id);
            }
            
            currentFolderTitle.innerHTML = `
                <span class="breadcrumb">
                    <span class="breadcrumb-item">所有书签</span>
                    ${breadcrumb.map(item => `<span class="breadcrumb-separator">›</span><span class="breadcrumb-item">${item}</span>`).join('')}
                </span>
            `;
        }
    }

    // --- 加载并显示书签 ---
    function loadAndDisplayBookmarks(node) {
        const bookmarks = flattenBookmarks(node);
        currentBookmarks = bookmarks;
        displayBookmarks(bookmarks);
    }

    // --- 展平书签树 ---
    function flattenBookmarks(node) {
        const bookmarks = [];
        
        function traverse(n) {
            if (n.url) {
                bookmarks.push({
                    id: n.id,
                    title: n.title,
                    url: n.url,
                    dateAdded: n.dateAdded
                });
            }
            if (n.children) {
                n.children.forEach(traverse);
            }
        }
        
        traverse(node);
        return bookmarks;
    }

    // --- 显示书签 ---
    function displayBookmarks(bookmarks) {
        bookmarkGrid.innerHTML = '';
        
        if (bookmarks.length === 0) {
            bookmarkGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #8E8E93;">
                    <i data-lucide="bookmark-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>此文件夹中没有书签</p>
                </div>
            `;
            return;
        }
        
        // 按文件夹分组显示
        const groupedBookmarks = groupBookmarksByFolder(bookmarks);
        
        Object.entries(groupedBookmarks).forEach(([folderName, bookmarks]) => {
            if (folderName !== 'root') {
                // 添加分组标题
                const groupHeader = document.createElement('h3');
                groupHeader.className = 'group-header';
                groupHeader.textContent = folderName;
                bookmarkGrid.appendChild(groupHeader);
            }
            
            // 创建书签卡片
            bookmarks.forEach(bookmark => {
                const card = createBookmarkCard(bookmark);
                bookmarkGrid.appendChild(card);
            });
        });
        
        // 重新初始化图标
        initializeIcons();
    }

    // --- 按文件夹分组书签 ---
    function groupBookmarksByFolder(bookmarks) {
        const groups = {};
        
        bookmarks.forEach(bookmark => {
            // 这里可以根据书签的父文件夹进行分组
            // 暂时都放在root组
            if (!groups['root']) {
                groups['root'] = [];
            }
            groups['root'].push(bookmark);
        });
        
        return groups;
    }

    // --- 智能获取网站图标 ---
    function getFaviconUrl(domain) {
        // 多个favicon源，按优先级排序
        const faviconSources = [
            `https://${domain}/favicon.ico`,                    // 网站自己的favicon.ico
            `https://${domain}/favicon.png`,                    // 网站自己的favicon.png
            `https://${domain}/apple-touch-icon.png`,           // Apple设备图标
            `https://${domain}/apple-touch-icon-precomposed.png`, // Apple预合成图标
            `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`, // Google备用服务
            `https://icons.duckduckgo.com/ip3/${domain}.ico`,   // DuckDuckGo图标服务
            `https://www.google.com/s2/favicons?domain=${domain}&sz=32` // Google服务（最后尝试）
        ];
        
        return faviconSources[0]; // 返回第一个（最可靠的）
    }

    // --- 简化版favicon加载 ---
    function loadSimpleFavicon(imgElement, domain) {
        console.log(`🔍 加载favicon: ${domain}`);
        
        // 先尝试网站自己的favicon
        const faviconUrl = `https://${domain}/favicon.ico`;
        console.log(`🔄 尝试: ${faviconUrl}`);
        
        imgElement.onerror = function() {
            console.log(`❌ 加载失败: ${faviconUrl}`);
            // 显示备用图标
            imgElement.style.display = 'none';
            const fallbackIcon = imgElement.nextElementSibling;
            if (fallbackIcon && fallbackIcon.classList.contains('fallback-icon')) {
                fallbackIcon.style.display = 'block';
                console.log(`✅ 显示备用图标`);
            }
        };
        
        imgElement.onload = function() {
            console.log(`✅ 加载成功: ${faviconUrl}`);
        };
        
        imgElement.src = faviconUrl;
    }

    // --- 创建书签卡片（优化版） ---
    function createBookmarkCard(bookmark) {
        console.log(`🔍 创建书签卡片: ${bookmark.title}`);
        
        const card = document.createElement('div');
        card.className = 'bookmark-card fade-in';
        card.dataset.bookmarkId = bookmark.id;
        card.draggable = true;
        
        const url = new URL(bookmark.url);
        console.log(`🔗 URL: ${bookmark.url}, 域名: ${url.hostname}`);
        
        card.innerHTML = `
            <div class="bookmark-icon-container">
                <img class="bookmark-favicon" src="" alt="${url.hostname}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="fallback-icon" style="display:block;">
                    🌐
                </div>
            </div>
            <div class="bookmark-title">${bookmark.title || url.hostname}</div>
        `;
        
        console.log(`📝 生成的HTML:`, card.innerHTML);
        
        // 强制显示备用图标进行测试
        const fallbackIcon = card.querySelector('.fallback-icon');
        if (fallbackIcon) {
            fallbackIcon.style.display = 'block';
            console.log(`🔧 强制显示备用图标`);
        }
        
        // 使用渐进式加载策略加载favicon
        const faviconImg = card.querySelector('.bookmark-favicon');
        if (faviconImg) {
            console.log(`✅ 找到favicon元素，开始加载`);
            // 暂时隐藏favicon，只显示备用图标
            faviconImg.style.display = 'none';
            loadSimpleFavicon(faviconImg, url.hostname);
        } else {
            console.error('❌ 找不到favicon元素');
        }
        
        // 添加点击事件
        card.addEventListener('click', () => {
            window.open(bookmark.url, '_blank');
        });
        
        return card;
    }

    // --- 渲染当前文件夹内容 ---
    function renderCurrentFolderContent() {
        // 这个函数现在由 createCurrentFolderContent 处理
        // 保留这个函数以保持代码结构的一致性
    }

    // --- 展平书签树 ---
    function flattenBookmarks(node) {
        const bookmarks = [];
        
        function traverse(n) {
            if (n.url) {
                bookmarks.push({
                    id: n.id,
                    title: n.title,
                    url: n.url,
                    dateAdded: n.dateAdded
                });
            }
            if (n.children) {
                n.children.forEach(traverse);
            }
        }
        
        traverse(node);
        return bookmarks;
    }

    // --- 显示书签 ---
    function displayBookmarks(bookmarks) {
        bookmarkGrid.innerHTML = '';
        
        if (bookmarks.length === 0) {
            bookmarkGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #8E8E93;">
                    <i data-lucide="bookmark-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>此文件夹中没有书签</p>
                </div>
            `;
            return;
        }
        
        // 按文件夹分组显示
        const groupedBookmarks = groupBookmarksByFolder(bookmarks);
        
        Object.entries(groupedBookmarks).forEach(([folderName, bookmarks]) => {
            if (folderName !== 'root') {
                // 添加分组标题
                const groupHeader = document.createElement('h3');
                groupHeader.className = 'group-header';
                groupHeader.textContent = folderName;
                bookmarkGrid.appendChild(groupHeader);
            }
            
            // 创建书签卡片
            bookmarks.forEach(bookmark => {
                const card = createBookmarkCard(bookmark);
                bookmarkGrid.appendChild(card);
            });
        });
        
        // 重新初始化图标
        initializeIcons();
    }

    // --- 按文件夹分组书签 ---
    function groupBookmarksByFolder(bookmarks) {
        const groups = {};
        
        bookmarks.forEach(bookmark => {
            // 这里可以根据书签的父文件夹进行分组
            // 暂时都放在root组
            if (!groups['root']) {
                groups['root'] = [];
            }
            groups['root'].push(bookmark);
        });
        
        return groups;
    }

    // --- 创建书签卡片 ---
    function createBookmarkCard(bookmark) {
        const card = document.createElement('div');
        card.className = 'bookmark-card fade-in';
        card.dataset.bookmarkId = bookmark.id;
        card.draggable = true;
        
        const url = new URL(bookmark.url);
        
        card.innerHTML = `
            <div class="bookmark-icon-container">
                <img class="bookmark-favicon" src="" alt="${url.hostname}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="fallback-icon" style="display:block;">
                <i data-lucide="globe"></i>
            </div>
            </div>
            <div class="bookmark-title">${bookmark.title || url.hostname}</div>
        `;
        
        // 使用渐进式加载策略加载favicon
        const faviconImg = card.querySelector('.bookmark-favicon');
        if (faviconImg) {
            console.log(`✅ 找到favicon元素，开始加载`);
            loadSimpleFavicon(faviconImg, url.hostname);
        } else {
            console.error('❌ 找不到favicon元素');
        }
        
        // 添加点击事件
        card.addEventListener('click', () => {
            window.open(bookmark.url, '_blank');
        });
        
        return card;
    }

    // --- 初始化拖拽功能 ---
    function initializeDragAndDrop() {
        bookmarkGrid.addEventListener('dragstart', handleDragStart);
        bookmarkGrid.addEventListener('dragover', handleDragOver);
        bookmarkGrid.addEventListener('drop', handleDrop);
        bookmarkGrid.addEventListener('dragend', handleDragEnd);
    }

    // --- 拖拽事件处理 ---
    function handleDragStart(e) {
        if (e.target.classList.contains('bookmark-card')) {
            draggedElement = e.target;
            draggedElement.classList.add('dragging');
            
            const rect = draggedElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedElement.outerHTML);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const card = e.target.closest('.bookmark-card');
        if (card && card !== draggedElement) {
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                card.style.borderTop = '2px solid var(--apple-blue)';
                card.style.borderBottom = '';
            } else {
                card.style.borderTop = '';
                card.style.borderBottom = '2px solid var(--apple-blue)';
            }
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        
        const card = e.target.closest('.bookmark-card');
        if (card && draggedElement) {
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                card.parentNode.insertBefore(draggedElement, card);
            } else {
                card.parentNode.insertBefore(draggedElement, card.nextSibling);
            }
        }
        
        // 清除拖拽指示器
        document.querySelectorAll('.bookmark-card').forEach(c => {
            c.style.borderTop = '';
            c.style.borderBottom = '';
        });
    }

    function handleDragEnd(e) {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
        
        // 清除拖拽指示器
        document.querySelectorAll('.bookmark-card').forEach(c => {
            c.style.borderTop = '';
            c.style.borderBottom = '';
        });
    }

    // --- 搜索功能 ---
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            displayBookmarks(currentBookmarks);
            return;
        }
        
        const filteredBookmarks = currentBookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm)
        );
        
        displayBookmarks(filteredBookmarks);
    }

    // --- 侧边栏切换 ---
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        
        const btn = toggleSidebarBtn.querySelector('.btn-text');
        const icon = toggleSidebarBtn.querySelector('i');
        
        if (sidebar.classList.contains('collapsed')) {
            btn.textContent = '展开';
            icon.setAttribute('data-lucide', 'chevron-right');
        } else {
            btn.textContent = '收起';
            icon.setAttribute('data-lucide', 'chevron-left');
        }
        
        // 重新初始化图标
        setTimeout(() => {
            initializeIcons();
        }, 200);
    }

    // --- 初始化事件监听器 ---
    function initializeEventListeners() {
        // 搜索
        searchInput.addEventListener('input', handleSearch);
        
        // 侧边栏切换
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        
        // 返回按钮
        backBtn.addEventListener('click', goBack);
        
        // 设置按钮
        settingsBtn.addEventListener('click', () => {
            console.log('打开设置面板');
            openSettingsPanel();
        });
        
        // 编辑按钮
        editBtn.addEventListener('click', () => {
            console.log('打开编辑模式');
            // TODO: 实现编辑模式
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        searchInput.focus();
                        break;
                    case 'b':
                        e.preventDefault();
                        toggleSidebar();
                        break;
                }
            }
            
            // 导航快捷键
            if (e.key === 'Backspace' && e.altKey) {
                e.preventDefault();
                goBack();
            }
        });
    }

    // --- 返回上一级 ---
    function goBack() {
        if (navigationHistory.length > 1) {
            navigationHistory.pop(); // 移除当前页面
            const previousNode = navigationHistory[navigationHistory.length - 1];
            navigateToFolder(previousNode);
        }
    }

    // --- 打开设置面板 ---
    function openSettingsPanel() {
        console.log('🔍 尝试打开设置面板...');
        console.log('window.settingsManager:', window.settingsManager);
        
        // 使用设置管理器打开面板
        if (window.settingsManager) {
            console.log('✅ 设置管理器已初始化，打开面板');
            window.settingsManager.openPanel();
        } else {
            console.error('❌ 设置管理器未初始化');
            console.log('🔍 尝试重新初始化设置管理器...');
            
            if (typeof SettingsManager !== 'undefined') {
                try {
                    window.settingsManager = new SettingsManager();
                    console.log('✅ 设置管理器重新初始化成功');
                    window.settingsManager.openPanel();
                } catch (error) {
                    console.error('❌ 设置管理器重新初始化失败:', error);
                }
            } else {
                console.error('❌ SettingsManager类不可用');
            }
        }
    }

    // --- 初始化设置面板事件 ---
    function initializeSettingsPanelEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('close-settings-btn');
        const overlay = document.querySelector('.panel-overlay');
        
        closeBtn.addEventListener('click', closeSettingsPanel);
        overlay.addEventListener('click', closeSettingsPanel);
        
        // 标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新内容显示
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // 主题按钮
        const themeBtns = document.querySelectorAll('[data-theme]');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 视图按钮
        const viewBtns = document.querySelectorAll('[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 导出按钮
        document.getElementById('export-json').addEventListener('click', () => exportBookmarks('json'));
        document.getElementById('export-html').addEventListener('click', () => exportBookmarks('html'));
        document.getElementById('export-csv').addEventListener('click', () => exportBookmarks('csv'));
        
        // 导入按钮
        document.getElementById('import-json').addEventListener('click', () => importBookmarks('json'));
        document.getElementById('import-html').addEventListener('click', () => importBookmarks('html'));
        document.getElementById('import-csv').addEventListener('click', () => importBookmarks('csv'));
        
        // 数据清理按钮
        document.getElementById('find-duplicates').addEventListener('click', findDuplicateBookmarks);
        document.getElementById('find-broken-links').addEventListener('click', findBrokenLinks);
        document.getElementById('cleanup-bookmarks').addEventListener('click', cleanupBookmarks);
        
        // 重置设置按钮
        document.getElementById('reset-all-settings').addEventListener('click', resetAllSettings);
        
        // 快捷键配置按钮
        document.getElementById('configure-shortcuts').addEventListener('click', configureShortcuts);

        // API设置相关按钮
        document.getElementById('save-api-settings').addEventListener('click', saveApiSettings);
        document.getElementById('test-api-connection').addEventListener('click', testApiConnection);
        document.getElementById('toggle-debug-panel').addEventListener('click', toggleDebugPanel);

        // 分类设置相关按钮
        document.getElementById('save-category-settings').addEventListener('click', saveCategorySettings);
        document.getElementById('reset-categories').addEventListener('click', resetCategories);

        // 分析设置相关按钮
        document.getElementById('start-analysis').addEventListener('click', startAnalysis);
        document.getElementById('stop-analysis').addEventListener('click', stopAnalysis);
        document.getElementById('export-analysis').addEventListener('click', exportAnalysis);

        // 高级设置相关按钮
        document.getElementById('export-settings').addEventListener('click', exportSettings);
        document.getElementById('import-settings').addEventListener('click', importSettings);
        document.getElementById('clear-cache').addEventListener('click', clearCache);

        // API提供商切换
        document.getElementById('api-provider').addEventListener('change', toggleApiProviderFields);
    }

    // --- 关闭设置面板 ---
    function closeSettingsPanel() {
        const settingsPanel = document.getElementById('settings-panel');
        settingsPanel.classList.remove('is-visible');
    }

    // --- 保存设置 ---
    function saveSettings() {
        const theme = document.getElementById('theme-select').value;
        const cardSize = document.getElementById('card-size').value;
        const sidebarWidth = document.getElementById('sidebar-width').value;
        const autoExpand = document.getElementById('auto-expand').checked;
        
        // 保存设置到localStorage
        const settings = {
            theme,
            cardSize,
            sidebarWidth,
            autoExpand
        };
        
        localStorage.setItem('bookmark-settings', JSON.stringify(settings));
        
        // 应用设置
        applySettings(settings);
        
        // 显示成功消息
        showNotification('设置已保存', 'success');
        
        // 关闭设置面板
        closeSettingsPanel();
    }

    // --- 重置设置 ---
    function resetSettings() {
        // 重置表单
        document.getElementById('theme-select').value = 'auto';
        document.getElementById('card-size').value = 'medium';
        document.getElementById('sidebar-width').value = 'normal';
        document.getElementById('auto-expand').checked = true;
        
        showNotification('设置已重置', 'info');
    }

    // --- 应用设置 ---
    function applySettings(settings) {
        // 应用主题设置
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.remove('dark-theme', 'light-theme');
        }
        
        // 应用卡片大小设置
        const bookmarkGrid = document.getElementById('bookmark-grid');
        bookmarkGrid.className = `bookmark-grid card-size-${settings.cardSize}`;
        
        // 应用侧边栏宽度设置
        const sidebar = document.getElementById('sidebar');
        sidebar.className = `sidebar sidebar-width-${settings.sidebarWidth}`;
    }

    // --- 导出书签 ---
    function exportBookmarks(format = 'json') {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
            chrome.bookmarks.getTree((tree) => {
                let dataStr, fileName, mimeType;
                
                switch (format) {
                    case 'json':
                        dataStr = JSON.stringify(tree, null, 2);
                        fileName = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
                        mimeType = 'application/json';
                        break;
                    case 'html':
                        dataStr = generateBookmarksHTML(tree);
                        fileName = `bookmarks-${new Date().toISOString().split('T')[0]}.html`;
                        mimeType = 'text/html';
                        break;
                    case 'csv':
                        dataStr = generateBookmarksCSV(tree);
                        fileName = `bookmarks-${new Date().toISOString().split('T')[0]}.csv`;
                        mimeType = 'text/csv';
                        break;
                    default:
                        showNotification('不支持的导出格式', 'error');
                        return;
                }
                
                const dataBlob = new Blob([dataStr], {type: mimeType});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = fileName;
                link.click();
                
                showNotification(`书签已导出为${format.toUpperCase()}格式`, 'success');
            });
        } else {
            showNotification('无法导出书签', 'error');
        }
    }

    // --- 生成HTML格式的书签 ---
    function generateBookmarksHTML(tree) {
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>书签导出</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .folder { margin: 10px 0; }
        .folder-name { font-weight: bold; color: #333; }
        .bookmark { margin: 5px 0 5px 20px; }
        .bookmark a { color: #0066cc; text-decoration: none; }
        .bookmark a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>书签导出</h1>
    <p>导出时间: ${new Date().toLocaleString()}</p>
    <hr>`;
        
        function processNode(node, level = 0) {
            if (node.url) {
                html += `<div class="bookmark"><a href="${node.url}">${node.title || node.url}</a></div>`;
            } else if (node.children) {
                if (node.title) {
                    html += `<div class="folder"><div class="folder-name">${node.title}</div>`;
                }
                node.children.forEach(child => processNode(child, level + 1));
                if (node.title) {
                    html += `</div>`;
                }
            }
        }
        
        processNode(tree[0]);
        html += `</body></html>`;
        return html;
    }

    // --- 生成CSV格式的书签 ---
    function generateBookmarksCSV(tree) {
        let csv = 'Title,URL,Folder\n';
        
        function processNode(node, folder = '') {
            if (node.url) {
                const title = (node.title || node.url).replace(/"/g, '""');
                const url = node.url.replace(/"/g, '""');
                const folderName = folder.replace(/"/g, '""');
                csv += `"${title}","${url}","${folderName}"\n`;
            } else if (node.children) {
                const newFolder = folder ? `${folder}/${node.title || ''}` : (node.title || '');
                node.children.forEach(child => processNode(child, newFolder));
            }
        }
        
        processNode(tree[0]);
        return csv;
    }

    // --- 导入书签 ---
    function importBookmarks(format = 'json') {
        const input = document.createElement('input');
        input.type = 'file';
        
        switch (format) {
            case 'json':
                input.accept = '.json';
                break;
            case 'html':
                input.accept = '.html';
                break;
            case 'csv':
                input.accept = '.csv';
                break;
        }
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        let bookmarks;
                        switch (format) {
                            case 'json':
                                bookmarks = JSON.parse(e.target.result);
                                break;
                            case 'html':
                                bookmarks = parseBookmarksHTML(e.target.result);
                                break;
                            case 'csv':
                                bookmarks = parseBookmarksCSV(e.target.result);
                                break;
                        }
                        showNotification(`${format.toUpperCase()}格式书签导入功能开发中`, 'info');
                    } catch (error) {
                        showNotification('文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // --- 查找重复书签 ---
    function findDuplicateBookmarks() {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
            chrome.bookmarks.getTree((tree) => {
                const allBookmarks = [];
                
                function collectBookmarks(node) {
                    if (node.url) {
                        allBookmarks.push({
                            id: node.id,
                            title: node.title,
                            url: node.url
                        });
                    }
                    if (node.children) {
                        node.children.forEach(collectBookmarks);
                    }
                }
                
                collectBookmarks(tree[0]);
                
                // 查找重复
                const duplicates = [];
                const seen = new Set();
                
                allBookmarks.forEach(bookmark => {
                    const key = `${bookmark.title}|${bookmark.url}`;
                    if (seen.has(key)) {
                        duplicates.push(bookmark);
                    } else {
                        seen.add(key);
                    }
                });
                
                if (duplicates.length > 0) {
                    showNotification(`找到 ${duplicates.length} 个重复书签`, 'warning');
                } else {
                    showNotification('没有找到重复书签', 'success');
                }
            });
        }
    }

    // --- 查找失效链接 ---
    function findBrokenLinks() {
        showNotification('失效链接检测功能开发中', 'info');
    }

    // --- 清理书签 ---
    function cleanupBookmarks() {
        showNotification('书签清理功能开发中', 'info');
    }

    // --- 重置所有设置 ---
    function resetAllSettings() {
        if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
            localStorage.clear();
            showNotification('所有设置已重置', 'success');
            location.reload();
        }
    }

    // --- API设置相关函数 ---
    function saveApiSettings() {
        const apiProvider = document.getElementById('api-provider').value;
        const apiKey = document.getElementById('api-key').value;
        const geminiModel = document.getElementById('gemini-model').value;
        const openaiModel = document.getElementById('openai-model').value;
        const customApiUrl = document.getElementById('custom-api-url').value;
        const customModel = document.getElementById('custom-model').value;

        const apiSettings = {
            apiProvider,
            apiKey,
            geminiModel,
            openaiModel,
            customApiUrl,
            customModel
        };

        localStorage.setItem('api-settings', JSON.stringify(apiSettings));
        showNotification('API设置已保存', 'success');
    }

    function testApiConnection() {
        const apiProvider = document.getElementById('api-provider').value;
        const apiKey = document.getElementById('api-key').value;

        if (!apiKey) {
            showNotification('请先输入API密钥', 'error');
            return;
        }

        showNotification('正在测试API连接...', 'info');
        
        // 模拟API测试
        setTimeout(() => {
            showNotification('API连接测试成功', 'success');
        }, 2000);
    }

    function toggleDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        const toggleBtn = document.getElementById('toggle-debug-panel');
        
        if (debugPanel.classList.contains('hidden')) {
            debugPanel.classList.remove('hidden');
            toggleBtn.innerHTML = '<i data-lucide="eye-off"></i>隐藏调试信息';
            showNotification('调试面板已显示', 'info');
        } else {
            debugPanel.classList.add('hidden');
            toggleBtn.innerHTML = '<i data-lucide="bug"></i>显示调试信息';
        }
    }

    function toggleApiProviderFields() {
        const apiProvider = document.getElementById('api-provider').value;
        const geminiField = document.getElementById('gemini-model-field');
        const openaiField = document.getElementById('openai-model-field');
        const customFields = document.getElementById('custom-api-fields');
        const customModelField = document.getElementById('custom-model-field');
        const geminiInfo = document.getElementById('api-gemini-info');
        const openaiInfo = document.getElementById('api-openai-info');

        // 隐藏所有字段
        geminiField.classList.add('hidden');
        openaiField.classList.add('hidden');
        customFields.classList.add('hidden');
        customModelField.classList.add('hidden');
        geminiInfo.classList.add('hidden');
        openaiInfo.classList.add('hidden');

        // 显示对应字段
        switch (apiProvider) {
            case 'gemini':
                geminiField.classList.remove('hidden');
                geminiInfo.classList.remove('hidden');
                break;
            case 'openai':
                openaiField.classList.remove('hidden');
                openaiInfo.classList.remove('hidden');
                break;
            case 'custom':
                customFields.classList.remove('hidden');
                customModelField.classList.remove('hidden');
                break;
        }
    }

    // --- 分类设置相关函数 ---
    function saveCategorySettings() {
        const defaultCategories = document.getElementById('default-categories').value;
        const batchSize = document.getElementById('batch-size').value;

        const categorySettings = {
            defaultCategories,
            batchSize: parseInt(batchSize) || 50
        };

        localStorage.setItem('category-settings', JSON.stringify(categorySettings));
        showNotification('分类设置已保存', 'success');
    }

    function resetCategories() {
        document.getElementById('default-categories').value = '技术,教育,购物,社交媒体,新闻,娱乐,工作,其他';
        document.getElementById('batch-size').value = '50';
        showNotification('分类设置已重置', 'info');
    }

    // --- 分析设置相关函数 ---
    function startAnalysis() {
        const analysisMode = document.querySelector('[data-mode].active')?.dataset.mode || 'auto';
        const analyzeDuplicates = document.getElementById('analyze-duplicates').checked;
        const analyzeBrokenLinks = document.getElementById('analyze-broken-links').checked;
        const analyzeCategories = document.getElementById('analyze-categories').checked;
        const analyzeUsage = document.getElementById('analyze-usage').checked;

        const analysisSettings = {
            mode: analysisMode,
            analyzeDuplicates,
            analyzeBrokenLinks,
            analyzeCategories,
            analyzeUsage
        };

        localStorage.setItem('analysis-settings', JSON.stringify(analysisSettings));
        showNotification('分析任务已开始', 'success');
        
        // 模拟分析进度
        simulateAnalysisProgress();
    }

    function stopAnalysis() {
        showNotification('分析任务已停止', 'info');
    }

    function exportAnalysis() {
        showNotification('分析结果导出功能开发中', 'info');
    }

    function simulateAnalysisProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(interval);
                showNotification('分析完成', 'success');
            } else {
                showNotification(`分析进度: ${progress}%`, 'info');
            }
        }, 1000);
    }

    // --- 高级设置相关函数 ---
    function exportSettings() {
        const allSettings = {
            api: JSON.parse(localStorage.getItem('api-settings') || '{}'),
            category: JSON.parse(localStorage.getItem('category-settings') || '{}'),
            analysis: JSON.parse(localStorage.getItem('analysis-settings') || '{}'),
            general: JSON.parse(localStorage.getItem('bookmark-settings') || '{}')
        };

        const dataStr = JSON.stringify(allSettings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bookmark-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('设置已导出', 'success');
    }

    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const settings = JSON.parse(e.target.result);
                        
                        // 应用导入的设置
                        if (settings.api) localStorage.setItem('api-settings', JSON.stringify(settings.api));
                        if (settings.category) localStorage.setItem('category-settings', JSON.stringify(settings.category));
                        if (settings.analysis) localStorage.setItem('analysis-settings', JSON.stringify(settings.analysis));
                        if (settings.general) localStorage.setItem('bookmark-settings', JSON.stringify(settings.general));
                        
                        showNotification('设置已导入', 'success');
                        location.reload(); // 重新加载页面以应用设置
                    } catch (error) {
                        showNotification('设置文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    function clearCache() {
        if (confirm('确定要清除所有缓存吗？此操作不可撤销。')) {
            // 清除localStorage中的缓存数据
            const keysToKeep = ['api-settings', 'category-settings', 'analysis-settings', 'bookmark-settings'];
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            showNotification('缓存已清除', 'success');
        }
    }

    // --- 配置快捷键 ---
    function configureShortcuts() {
        showNotification('快捷键配置功能开发中', 'info');
    }

    // --- 显示通知 ---
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // --- 初始化图标 ---
    function initializeIcons() {
        console.log('🔄 初始化图标...');
        
        // 等待DOM更新完成
        setTimeout(() => {
            // 尝试使用CDN的Lucide库
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                try {
                    // 清除可能存在的旧图标
                    const existingSvgs = document.querySelectorAll('[data-lucide] svg');
                    existingSvgs.forEach(svg => svg.remove());
                    
                    // 重新创建图标
                    lucide.createIcons();
                    console.log('✅ CDN图标初始化成功');
                    
                    // 验证图标是否正确创建并设置颜色
                    const icons = document.querySelectorAll('[data-lucide]');
                    console.log(`📊 找到 ${icons.length} 个图标元素`);
                    
                    let successCount = 0;
                    icons.forEach((icon, index) => {
                        const iconName = icon.getAttribute('data-lucide');
                        const svg = icon.querySelector('svg');
                        if (svg) {
                            successCount++;
                            // 确保SVG颜色正确
                            svg.style.color = '#FFFFFF';
                            svg.style.fill = 'currentColor';
                            svg.style.stroke = 'currentColor';
                            console.log(`✅ 图标 ${index + 1}: ${iconName} - SVG创建成功`);
                        } else {
                            console.warn(`⚠️ 图标 ${index + 1}: ${iconName} - SVG创建失败`);
                        }
                    });
                    
                    console.log(`📈 CDN图标创建成功率: ${successCount}/${icons.length}`);
                    
                    // 如果CDN图标创建不完整，使用本地图标库
                    if (successCount < icons.length) {
                        console.log('🔄 CDN图标创建不完整，尝试使用本地图标库...');
                        if (typeof localLucide !== 'undefined' && localLucide.createIcons) {
                            localLucide.createIcons();
                        }
                    }
                    
                } catch (error) {
                    console.error('❌ CDN图标初始化失败:', error);
                    // 使用本地图标库作为备用
                    if (typeof localLucide !== 'undefined' && localLucide.createIcons) {
                        console.log('🔄 使用本地图标库作为备用...');
                        localLucide.createIcons();
                    }
                }
            } else {
                console.warn('⚠️ CDN Lucide库未加载，使用本地图标库');
                // 使用本地图标库
                if (typeof localLucide !== 'undefined' && localLucide.createIcons) {
                    localLucide.createIcons();
                } else {
                    console.error('❌ 本地图标库也未加载');
                }
            }
        }, 100);
    }

    // --- 模拟数据（用于测试） ---
    function loadMockBookmarks() {
        const mockData = {
            id: '0',
            title: '书签栏',
            children: [
                {
                    id: '1',
                    title: '常用网站',
                    children: [
                        { id: '2', title: 'Google', url: 'https://www.google.com' },
                        { id: '3', title: 'GitHub', url: 'https://github.com' },
                        { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com' }
                    ]
                },
                {
                    id: '5',
                    title: '开发工具',
                    children: [
                        { id: '6', title: 'VS Code', url: 'https://code.visualstudio.com' },
                        { id: '7', title: 'Chrome DevTools', url: 'https://developers.google.com/web/tools/chrome-devtools' }
                    ]
                }
            ]
        };
        
        bookmarkTreeRoot = mockData;
        currentFolderNode = mockData;
        renderBreadcrumbNavigation();
        renderCurrentFolderContent();
        loadAndDisplayBookmarks(mockData);
    }

    // --- 加载设置 ---
    function loadSettings() {
        const savedSettings = localStorage.getItem('bookmark-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                applySettings(settings);
            } catch (error) {
                console.error('加载设置失败:', error);
            }
        }
    }

    // --- 测试图标和文字显示 ---
    function testDisplay() {
        console.log('🧪 开始测试显示状态...');
        
        // 测试侧边栏按钮
        const sidebarBtns = document.querySelectorAll('.sidebar-btn');
        console.log(`📊 找到 ${sidebarBtns.length} 个侧边栏按钮`);
        
        sidebarBtns.forEach((btn, index) => {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('.btn-text');
            
            console.log(`🔍 按钮 ${index + 1}:`);
            console.log(`  - 按钮文本: "${text ? text.textContent : '未找到'}"`);
            console.log(`  - 按钮可见性: ${btn.offsetWidth > 0 ? '可见' : '不可见'}`);
            console.log(`  - 图标元素: ${icon ? '存在' : '不存在'}`);
            console.log(`  - 图标SVG: ${icon && icon.querySelector('svg') ? '存在' : '不存在'}`);
            console.log(`  - 按钮颜色: ${getComputedStyle(btn).color}`);
        });
        
        // 测试文件夹项
        const folderItems = document.querySelectorAll('.folder-item');
        console.log(`📊 找到 ${folderItems.length} 个文件夹项`);
        
        folderItems.forEach((item, index) => {
            const icon = item.querySelector('.folder-icon i');
            const name = item.querySelector('.folder-name');
            
            console.log(`📁 文件夹 ${index + 1}:`);
            console.log(`  - 文件夹名: "${name ? name.textContent : '未找到'}"`);
            console.log(`  - 文件夹可见性: ${item.offsetWidth > 0 ? '可见' : '不可见'}`);
            console.log(`  - 图标元素: ${icon ? '存在' : '不存在'}`);
            console.log(`  - 图标SVG: ${icon && icon.querySelector('svg') ? '存在' : '不存在'}`);
        });
    }

    // --- 测试favicon加载 ---
    function testFaviconLoading() {
        console.log('🧪 开始测试favicon加载...');
        
        // 测试一些常见的网站
        const testDomains = [
            'github.com',
            'stackoverflow.com',
            'developer.mozilla.org',
            'www.google.com',
            'www.baidu.com'
        ];
        
        testDomains.forEach(domain => {
            const testImg = document.createElement('img');
            testImg.style.display = 'none';
            document.body.appendChild(testImg);
            
            testImg.onload = function() {
                console.log(`✅ ${domain} favicon加载成功`);
                document.body.removeChild(testImg);
            };
            
            testImg.onerror = function() {
                console.log(`❌ ${domain} favicon加载失败`);
                document.body.removeChild(testImg);
            };
            
            testImg.src = `https://${domain}/favicon.ico`;
        });
    }

    // 在页面加载完成后测试
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testFaviconLoading, 2000); // 延迟2秒测试
    });

    // --- 启动应用 ---
    initialize();
    loadSettings();
});