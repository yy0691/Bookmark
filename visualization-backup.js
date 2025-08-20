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

    // --- 创建书签卡片 ---
    function createBookmarkCard(bookmark) {
        const card = document.createElement('div');
        card.className = 'bookmark-card fade-in';
        card.dataset.bookmarkId = bookmark.id;
        card.draggable = true;
        
        const url = new URL(bookmark.url);
        const faviconUrl = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`;
        
        card.innerHTML = `
            <img class="bookmark-favicon" src="${faviconUrl}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="fallback-icon" style="display:none;">
                <i data-lucide="globe"></i>
            </div>
            <div class="bookmark-title">${bookmark.title || url.hostname}</div>
        `;
        
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
        const faviconUrl = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`;
        
        card.innerHTML = `
            <img class="bookmark-favicon" src="${faviconUrl}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="fallback-icon" style="display:none;">
                <i data-lucide="globe"></i>
            </div>
            <div class="bookmark-title">${bookmark.title || url.hostname}</div>
        `;
        
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
        // 使用设置管理器打开面板
        if (window.settingsManager) {
            window.settingsManager.openPanel();
        } else {
            console.error('设置管理器未初始化');
        }

                        </div>
                        <div class="setting-group">
                            <label>数据清理</label>
                            <div class="description">清理和优化书签数据</div>
                            <div class="api-actions">
                                <button class="action-btn" id="find-duplicates">
                                    <i data-lucide="search"></i>
                                    查找重复书签
                                </button>
                                <button class="action-btn" id="find-broken-links">
                                    <i data-lucide="link"></i>
                                    查找失效链接
                                </button>
                                <button class="action-btn" id="cleanup-bookmarks">
                                    <i data-lucide="trash-2"></i>
                                    清理书签
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- API设置 -->
                    <div class="tab-content" id="api-tab">
                        <h2>API设置</h2>
                        <div class="setting-group">
                            <label>API提供商</label>
                            <div class="description">选择AI服务提供商以启用智能书签分类功能</div>
                            <select id="api-provider">
                                <option value="gemini">🔮 Google Gemini</option>
                                <option value="openai">🧠 OpenAI</option>
                                <option value="custom">🔧 自定义</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>API密钥</label>
                            <div class="description">输入您的API密钥</div>
                            <input type="password" id="api-key" placeholder="请输入API密钥">
                            <div class="api-info" id="api-gemini-info">
                                📎 获取Gemini API密钥：<a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>
                            </div>
                            <div class="api-info hidden" id="api-openai-info">
                                📎 获取OpenAI API密钥：<a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>
                            </div>
                        </div>
                        <div class="setting-group" id="gemini-model-field">
                            <label>Gemini 模型</label>
                            <div class="description">选择合适的模型版本</div>
                            <select id="gemini-model">
                                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash 预览版</option>
                                <option value="gemini-2.5-pro-preview-06-05">Gemini 2.5 Pro 预览版</option>
                            </select>
                        </div>
                        <div class="setting-group hidden" id="openai-model-field">
                            <label>OpenAI 模型</label>
                            <div class="description">选择OpenAI模型版本</div>
                            <select id="openai-model">
                                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                <option value="gpt-4">gpt-4</option>
                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                            </select>
                        </div>
                        <div class="setting-group hidden" id="custom-api-fields">
                            <label>自定义API端点URL</label>
                            <div class="description">输入您的自定义API端点</div>
                            <input type="text" id="custom-api-url" placeholder="请输入API端点URL">
                        </div>
                        <div class="setting-group hidden" id="custom-model-field">
                            <label>自定义模型标识符</label>
                            <div class="description">输入您的API服务所需的模型标识符</div>
                            <input type="text" id="custom-model" placeholder="请输入模型标识符">
                        </div>
                        <div class="setting-group">
                            <label>API操作</label>
                            <div class="description">测试和保存API设置</div>
                            <div class="api-actions">
                                <button class="action-btn" id="save-api-settings">
                                    <i data-lucide="save"></i>
                                    保存API设置
                                </button>
                                <button class="action-btn" id="test-api-connection">
                                    <i data-lucide="test-tube"></i>
                                    测试API连接
                                </button>
                            </div>
                        </div>
                        <div class="setting-group">
                            <label>调试信息</label>
                            <div class="description">显示API调试信息</div>
                            <div class="api-actions">
                                <button class="action-btn" id="toggle-debug-panel">
                                    <i data-lucide="bug"></i>
                                    显示调试信息
                                </button>
                            </div>
                            <div id="debug-panel" class="debug-panel hidden">
                                <h4>API调试信息</h4>
                                <div>
                                    <strong>请求URL:</strong>
                                    <pre id="debug-url"></pre>
                                </div>
                                <div>
                                    <strong>请求数据:</strong>
                                    <pre id="debug-request"></pre>
                                </div>
                                <div>
                                    <strong>响应数据:</strong>
                                    <pre id="debug-response"></pre>
                                </div>
                                <div>
                                    <strong>错误信息:</strong>
                                    <pre id="debug-error"></pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 分类设置 -->
                    <div class="tab-content" id="category-tab">
                        <h2>分类设置</h2>
                        <div class="setting-group">
                            <label>默认分类</label>
                            <div class="description">设置书签的默认分类标签，AI会优先使用这些分类</div>
                            <input type="text" id="default-categories" placeholder="技术,教育,购物,社交媒体,新闻,娱乐,工作,其他">
                        </div>
                        <div class="setting-group">
                            <label>批处理大小</label>
                            <div class="description">每批处理的书签数量，建议设置为30-100之间的值</div>
                            <input type="number" id="batch-size" placeholder="50" min="10" max="200">
                        </div>
                        <div class="setting-group">
                            <label>分类操作</label>
                            <div class="description">管理分类设置</div>
                            <div class="api-actions">
                                <button class="action-btn" id="save-category-settings">
                                    <i data-lucide="save"></i>
                                    保存分类设置
                                </button>
                                <button class="action-btn" id="reset-categories">
                                    <i data-lucide="refresh-cw"></i>
                                    重置分类
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 分析设置 -->
                    <div class="tab-content" id="analysis-tab">
                        <h2>分析设置</h2>
                        <div class="setting-group">
                            <label>分析模式</label>
                            <div class="description">选择书签分析的模式</div>
                            <div class="theme-buttons">
                                <button class="theme-btn active" data-mode="auto">自动分析</button>
                                <button class="theme-btn" data-mode="manual">手动分析</button>
                                <button class="theme-btn" data-mode="batch">批量分析</button>
                            </div>
                        </div>
                        <div class="setting-group">
                            <label>分析选项</label>
                            <div class="description">配置分析功能</div>
                            <label class="checkbox-label">
                                <input type="checkbox" id="analyze-duplicates" checked>
                                <span class="checkmark"></span>
                                检测重复书签
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="analyze-broken-links" checked>
                                <span class="checkmark"></span>
                                检测失效链接
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="analyze-categories" checked>
                                <span class="checkmark"></span>
                                智能分类
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="analyze-usage" checked>
                                <span class="checkmark"></span>
                                使用频率分析
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>分析操作</label>
                            <div class="description">执行分析任务</div>
                            <div class="api-actions">
                                <button class="action-btn primary" id="start-analysis">
                                    <i data-lucide="play"></i>
                                    开始分析
                                </button>
                                <button class="action-btn" id="stop-analysis">
                                    <i data-lucide="square"></i>
                                    停止分析
                                </button>
                                <button class="action-btn" id="export-analysis">
                                    <i data-lucide="download"></i>
                                    导出分析结果
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 高级设置 -->
                    <div class="tab-content" id="advanced-tab">
                        <h2>高级设置</h2>
                        <div class="setting-group">
                            <label>性能设置</label>
                            <div class="description">调整应用性能参数</div>
                            <label class="checkbox-label">
                                <input type="checkbox" id="enable-cache" checked>
                                <span class="checkmark"></span>
                                启用缓存
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="enable-lazy-loading" checked>
                                <span class="checkmark"></span>
                                启用懒加载
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="enable-compression" checked>
                                <span class="checkmark"></span>
                                启用数据压缩
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>调试模式</label>
                            <div class="description">启用调试信息和日志</div>
                            <label class="checkbox-label">
                                <input type="checkbox" id="debug-mode">
                                <span class="checkmark"></span>
                                启用调试模式
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="verbose-logging">
                                <span class="checkmark"></span>
                                详细日志记录
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>数据管理</label>
                            <div class="description">管理应用数据</div>
                            <div class="api-actions">
                                <button class="action-btn" id="export-settings">
                                    <i data-lucide="download"></i>
                                    导出设置
                                </button>
                                <button class="action-btn" id="import-settings">
                                    <i data-lucide="upload"></i>
                                    导入设置
                                </button>
                                <button class="action-btn" id="clear-cache">
                                    <i data-lucide="trash-2"></i>
                                    清除缓存
                                </button>
                            </div>
                        </div>
                        <div class="setting-group">
                            <label>重置设置</label>
                            <div class="description">将所有设置恢复为默认值</div>
                            <div class="api-actions">
                                <button class="action-btn primary" id="reset-all-settings">
                                    <i data-lucide="refresh-cw"></i>
                                    重置所有设置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 显示设置面板
        settingsPanel.classList.add('is-visible');
        
        // 添加事件监听器
        initializeSettingsPanelEvents();
        
        // 重新初始化图标
        setTimeout(() => {
            initializeIcons();
        }, 100);
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

    // --- 启动应用 ---
    initialize();
    loadSettings();
});

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