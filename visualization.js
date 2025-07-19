document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const bookmarkContainer = document.getElementById('bookmark-container');
    const searchInput = document.getElementById('search-input');
    const folderListContainer = document.getElementById('folder-list-container');
    const sidebar = document.getElementById('folder-sidebar');
    const resizer = document.getElementById('sidebar-resizer');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const iconModeBtn = document.getElementById('icon-mode-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const cardViewBtn = document.getElementById('card-view-btn');
    const iconViewBtn = document.getElementById('icon-view-btn');

    // --- Settings Panel Elements ---
    const settingsBtn = document.getElementById('theme-settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsPanelBtn = document.getElementById('close-settings-panel-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const bgUploadInput = document.getElementById('bg-upload-input');
    const bgUploadBtn = document.getElementById('bg-upload-btn');
    const clearBgBtn = document.getElementById('clear-bg-btn');
    const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
    const regenerateCategoriesBtn = document.getElementById('regenerate-categories-btn');
    const analysisProgress = document.getElementById('analysis-progress');
    const analysisProgressBar = document.getElementById('analysis-progress-bar');
    const analysisStatus = document.getElementById('analysis-status');
    const analysisLogContainer = document.getElementById('analysis-log-container');
    const analysisLog = document.getElementById('analysis-log');
    const importBtn = document.getElementById('import-bookmarks-btn');
    const exportBackupBtn = document.getElementById('export-backup-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const apiProviderSelect = document.getElementById('api-provider');
    const apiKeyInput = document.getElementById('api-key');
    const geminiFields = document.getElementById('gemini-fields');
    const openaiFields = document.getElementById('openai-fields');
    const customApiFields = document.getElementById('custom-api-fields');
    const saveApiSettingsBtn = document.getElementById('save-api-settings-btn');
    const testApiBtn = document.getElementById('test-api-btn');
    const apiStatusMessage = document.getElementById('api-status-message');

    // --- State ---
    let bookmarkTreeRoot = null;
    let currentFolderNode = null;
    let currentBookmarks = [];
    let currentViewMode = 'card';
    let analysisCategories = {};
    let suggestedCategories = []; // New state for suggested categories

    // --- Initialization ---
    function initialize() {
        loadAndApplySettings();
        chrome.bookmarks.getTree(tree => {
            bookmarkTreeRoot = tree[0];
            currentFolderNode = bookmarkTreeRoot;
            renderFolderTree(bookmarkTreeRoot);
            loadAndDisplayBookmarks(currentFolderNode);
        });
        initializeEventListeners();
        setViewMode(currentViewMode);
        loadSuggestedCategories(); // Load saved categories on start
    }

    function initializeEventListeners() {
        // Main UI
        searchInput.addEventListener('input', handleSearch);
        toggleSidebarBtn.addEventListener('click', toggleSidebarCollapse);
        iconModeBtn.addEventListener('click', toggleIconMode);
        listViewBtn.addEventListener('click', () => setViewMode('list'));
        cardViewBtn.addEventListener('click', () => setViewMode('card'));
        iconViewBtn.addEventListener('click', () => setViewMode('icon'));
        initResizer(sidebar, resizer);

        // Settings Panel
        if (settingsBtn) {
            console.log('设置按钮找到，添加事件监听器');
            settingsBtn.addEventListener('click', (e) => {
                console.log('设置按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                openSettingsPanel();
            });
        } else {
            console.error('设置按钮未找到');
        }
        
        if (closeSettingsPanelBtn) {
            closeSettingsPanelBtn.addEventListener('click', closeSettingsPanel);
        } else {
            console.error('关闭设置按钮未找到');
        }
        
        if (settingsPanel) {
            settingsPanel.addEventListener('click', (e) => {
                if (e.target === settingsPanel) {
                    closeSettingsPanel();
                }
            });
        } else {
            console.error('设置面板未找到');
        }
        
        // Overlay click to close
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', closeSettingsPanel);
        } else {
            console.error('Overlay元素未找到');
        }
        
        // Tabs
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
            });
        });

        // Appearance
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.dataset.theme;
                applyTheme(theme);
                localStorage.setItem('selectedTheme', theme);
            });
        });
        bgUploadBtn.addEventListener('click', () => bgUploadInput.click());
        bgUploadInput.addEventListener('change', handleBackgroundUpload);
        clearBgBtn.addEventListener('click', clearCustomBackground);

        // Tools
        analyzeBtn.addEventListener('click', analyzeBookmarks);
        regenerateCategoriesBtn.addEventListener('click', regenerateSuggestedCategories);
        const organizeBtn = document.getElementById('organize-bookmarks-btn');
        organizeBtn.addEventListener('click', organizeBookmarks);

        // Data
        importBtn.addEventListener('click', handleImport);
        exportBackupBtn.addEventListener('click', handleExportBackup);
        exportCsvBtn.addEventListener('click', handleExportCsv);

        // API Settings
        apiProviderSelect.addEventListener('change', toggleApiFields);
        saveApiSettingsBtn.addEventListener('click', saveApiSettings);
        testApiBtn.addEventListener('click', testApiConnection);
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && settingsPanel.classList.contains('is-visible')) {
                closeSettingsPanel();
            }
        });
    }

    // --- Bookmark & Folder Logic ---
    function loadAndDisplayBookmarks(node) {
        currentBookmarks = flattenBookmarks(node);
        displayBookmarks(currentBookmarks);
        searchInput.value = '';
    }

    function displayBookmarks(bookmarks) {
        bookmarkContainer.innerHTML = '';
        if (bookmarks.length === 0) {
            bookmarkContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">此文件夹为空或无匹配结果。</p>';
            return;
        }
        bookmarks.forEach(bookmark => bookmarkContainer.appendChild(createBookmarkElement(bookmark)));
    }

    function createBookmarkElement(bookmark) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        const url = new URL(bookmark.url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
        item.innerHTML = `
            <a href="${bookmark.url}" target="_blank" title="${bookmark.title}\n${bookmark.url}">
                <img class="bookmark-favicon" src="${faviconUrl}" onerror="this.src='images/icon.png'">
                <span class="bookmark-title">${bookmark.title || url.hostname}</span>
            </a>`;
        return item;
    }

    function flattenBookmarks(node) {
        const bookmarks = [];
        function traverse(n) {
            if (n.url) bookmarks.push({ title: n.title, url: n.url, id: n.id });
            if (n.children) n.children.forEach(traverse);
        }
        traverse(node);
        return bookmarks;
    }

    function renderFolderTree(rootNode) {
        const folderList = document.createElement('ul');
        folderList.className = 'folder-list';
        const allBookmarksNode = createFolderNode(rootNode, 0, true);
        allBookmarksNode.classList.add('active');
        folderList.appendChild(allBookmarksNode);
        rootNode.children.forEach(node => {
            if (node.children) folderList.appendChild(createFolderNode(node, 0));
        });
        folderListContainer.innerHTML = '';
        folderListContainer.appendChild(folderList);
    }

    function createFolderNode(node, level, isRoot = false) {
        const listItem = document.createElement('li');
        const hasSubfolders = node.children && node.children.some(child => child.children);
        listItem.innerHTML = `
            <div class="folder-item" style="padding-left: ${level * 15}px;">
                <span class="folder-toggle ${hasSubfolders ? '' : 'hidden'}">▸</span>
                <span class="folder-icon">${isRoot ? '📚' : '📁'}</span>
                <span class="folder-name">${isRoot ? '所有书签' : node.title || '未命名文件夹'}</span>
                <div class="folder-tooltip">${isRoot ? '所有书签' : node.title || '未命名文件夹'}</div>
            </div>`;
        const folderItemDiv = listItem.querySelector('.folder-item');
        folderItemDiv.addEventListener('click', () => {
            currentFolderNode = node;
            document.querySelectorAll('.folder-item.active').forEach(item => item.classList.remove('active'));
            folderItemDiv.classList.add('active');
            loadAndDisplayBookmarks(node);
        });
        if (hasSubfolders) {
            const toggle = listItem.querySelector('.folder-toggle');
            const subFoldersContainer = document.createElement('ul');
            subFoldersContainer.className = 'sub-folders';
            toggle.addEventListener('click', e => {
                e.stopPropagation();
                toggle.classList.toggle('expanded');
                subFoldersContainer.classList.toggle('expanded');
            });
            node.children.forEach(child => {
                if (child.children) subFoldersContainer.appendChild(createFolderNode(child, level + 1));
            });
            listItem.appendChild(subFoldersContainer);
        }
        return listItem;
    }

    // --- UI & Layout ---
    function setViewMode(mode) {
        currentViewMode = mode;
        bookmarkContainer.className = 'bookmark-container';
        bookmarkContainer.classList.add(`${mode}-view`);
        [listViewBtn, cardViewBtn, iconViewBtn].forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-view-btn`).classList.add('active');
        displayBookmarks(currentBookmarks);
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const bookmarksInScope = flattenBookmarks(currentFolderNode);
        currentBookmarks = bookmarksInScope.filter(bm => 
            (bm.title && bm.title.toLowerCase().includes(searchTerm)) ||
            (bm.url && bm.url.toLowerCase().includes(searchTerm))
        );
        displayBookmarks(currentBookmarks);
    }

    function toggleSidebarCollapse() { body.classList.toggle('sidebar-collapsed'); }
    function toggleIconMode() { body.classList.toggle('sidebar-icon-mode'); }

    function initResizer(sidebarEl, resizerEl) {
        let startX, startWidth;
        function onMouseDown(e) {
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(sidebarEl).width, 10);
            document.documentElement.addEventListener('mousemove', onMouseMove);
            document.documentElement.addEventListener('mouseup', onMouseUp);
        }
        function onMouseMove(e) {
            const newWidth = startWidth + e.clientX - startX;
            if (newWidth > 200 && newWidth < 500) sidebarEl.style.width = `${newWidth}px`;
        }
        function onMouseUp() {
            document.documentElement.removeEventListener('mousemove', onMouseMove);
            document.documentElement.removeEventListener('mouseup', onMouseUp);
        }
        resizerEl.addEventListener('mousedown', onMouseDown);
    }

    // --- Settings Panel ---
    function openSettingsPanel() { 
        settingsPanel.classList.add('is-visible');
        document.getElementById('overlay').classList.add('is-visible');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
    function closeSettingsPanel() { 
        settingsPanel.classList.remove('is-visible');
        document.getElementById('overlay').classList.remove('is-visible');
        document.body.style.overflow = ''; // 恢复滚动
    }

    function loadAndApplySettings() {
        const theme = localStorage.getItem('selectedTheme') || 'theme-default';
        const customBg = localStorage.getItem('customBackground');
        applyTheme(theme);
        if (customBg) body.style.backgroundImage = `url(${customBg})`;
        loadApiSettings();
    }

    function applyTheme(theme) {
        body.className = 'visualization-page';
        body.classList.add(theme);
        themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
    }

    function handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            const imageDataUrl = e.target.result;
            body.style.backgroundImage = `url(${imageDataUrl})`;
            try {
                localStorage.setItem('customBackground', imageDataUrl);
            } catch (error) {
                alert("无法保存背景图片，可能已超出存储限制。");
            }
        };
        reader.readAsDataURL(file);
    }

    function clearCustomBackground() {
        body.style.backgroundImage = '';
        localStorage.removeItem('customBackground');
    }

    // --- Data Management ---
    function handleImport() {
        chrome.bookmarks.import();
    }

    function handleExportBackup() {
        chrome.bookmarks.export(downloadUrl => {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `bookmarks_backup_${new Date().toISOString().split('T')[0]}.html`;
            a.click();
        });
    }

    function handleExportCsv() {
        if (Object.keys(analysisCategories).length === 0) {
            alert('请先运行AI分析，才能导出分类结果。');
            return;
        }
        let csvContent = '类别,标题,URL\n';
        for (const [category, items] of Object.entries(analysisCategories)) {
            for (const item of items) {
                const safeTitle = `"${(item.title || '').replace(/"/g, '""')}"`;
                const safeUrl = `"${(item.url || '').replace(/"/g, '""')}"`;
                csvContent += `"${category}",${safeTitle},${safeUrl}\n`;
            }
        }
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_bookmark_categories_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- API Settings ---
    function loadApiSettings() {
        chrome.storage.sync.get(['apiProvider', 'apiKey', 'geminiModel', 'openaiModel', 'customApiUrl', 'customModel', 'batchSize'], (result) => {
            if (result.apiProvider) apiProviderSelect.value = result.apiProvider;
            if (result.apiKey) apiKeyInput.value = result.apiKey;
            if (result.geminiModel) document.getElementById('gemini-model').value = result.geminiModel;
            if (result.openaiModel) document.getElementById('openai-model').value = result.openaiModel;
            if (result.customApiUrl) document.getElementById('custom-api-url').value = result.customApiUrl;
            if (result.customModel) document.getElementById('custom-model').value = result.customModel;
            if (result.batchSize) document.getElementById('batch-size').value = result.batchSize;
            toggleApiFields();
        });
    }

    function toggleApiFields() {
        const provider = apiProviderSelect.value;
        geminiFields.classList.toggle('hidden', provider !== 'gemini');
        openaiFields.classList.toggle('hidden', provider !== 'openai');
        customApiFields.classList.toggle('hidden', provider !== 'custom');
    }

    function saveApiSettings() {
        const settings = {
            apiProvider: apiProviderSelect.value,
            apiKey: apiKeyInput.value.trim(),
            geminiModel: document.getElementById('gemini-model').value,
            openaiModel: document.getElementById('openai-model').value,
            customApiUrl: document.getElementById('custom-api-url').value.trim(),
            customModel: document.getElementById('custom-model').value.trim(),
            batchSize: parseInt(document.getElementById('batch-size').value, 10) || 50
        };
        chrome.storage.sync.set(settings, () => {
            showApiStatus('设置已保存!', 'success');
        });
    }

    async function testApiConnection() {
        const provider = apiProviderSelect.value;
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showApiStatus('请输入API密钥', 'error');
            return;
        }
        showApiStatus('正在测试连接...', '');

        let url, body;
        const testPrompt = '测试连接，请回复"连接成功"';

        if (provider === 'gemini') {
            const model = document.getElementById('gemini-model').value;
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            body = { contents: [{ parts: [{ text: testPrompt }] }] };
        } else if (provider === 'openai') {
            const model = document.getElementById('openai-model').value;
            url = 'https://api.openai.com/v1/chat/completions';
            body = { model: model, messages: [{ role: 'user', content: testPrompt }], max_tokens: 10 };
        } else { // custom
            url = document.getElementById('custom-api-url').value.trim();
            const model = document.getElementById('custom-model').value.trim();
            if (!url || !model) {
                showApiStatus('自定义API需要填写URL和模型', 'error');
                return;
            }
            body = { model: model, messages: [{ role: 'user', content: testPrompt }] };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(provider === 'openai' && { 'Authorization': `Bearer ${apiKey}` }) },
                body: JSON.stringify(body)
            });
            if (response.ok) {
                showApiStatus('API连接成功!', 'success');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
            }
        } catch (error) {
            showApiStatus(`连接失败: ${error.message}`, 'error');
        }
    }

    function showApiStatus(message, type) {
        apiStatusMessage.textContent = message;
        apiStatusMessage.className = `api-status-message ${type}`;
    }

    // --- AI Analysis Tools ---
    function addLog(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        analysisLog.appendChild(entry);
        analysisLog.scrollTop = analysisLog.scrollHeight;
    }

    function loadSuggestedCategories() {
        chrome.storage.local.get('suggestedCategories', (result) => {
            if (result.suggestedCategories) {
                suggestedCategories = result.suggestedCategories;
                addLog('已加载之前保存的分类建议。');
            }
        });
    }

    async function regenerateSuggestedCategories() {
        addLog('正在请求AI生成新的分类建议...');
        analysisProgress.classList.remove('hidden');
        analysisLogContainer.classList.remove('hidden');
        analysisStatus.textContent = '正在生成分类建议...';
        analysisProgressBar.style.width = '50%';

        const settings = await new Promise(resolve => chrome.storage.sync.get(['apiKey', 'apiProvider', 'geminiModel', 'openaiModel', 'customApiUrl', 'customModel']));
        if (!settings.apiKey) {
            addLog('API密钥未配置，操作中止。', 'error');
            analysisStatus.textContent = '错误：请先配置API密钥。';
            return;
        }

        try {
            const prompt = `你是一位信息架构专家和资深网民。请为书签管理器设计一个通用、清晰、全面的分类体系。\n- 目标是方便用户快速定位书签，避免分类过于宽泛或冗余。\n- 请参考主流导航网站（如hao123、360导航）和技术社区的分类方法。\n- 涵盖常见领域：如新闻、社交、购物、娱乐、学习、工作、技术、设计、金融、生活等。\n- 技术分类可以更细致，例如：前端开发、后端开发、数据库、人工智能、云计算等。\n- 请以JSON格式返回一个只包含分类名称字符串的数组。例如：["新闻资讯", "社交媒体", "开发工具", "设计资源"]。不要添加任何其他说明文字。`;
            
            const result = await callApi(prompt, settings, true); // true to expect array
            
            if (Array.isArray(result)) {
                suggestedCategories = result;
                chrome.storage.local.set({ suggestedCategories });
                addLog(`成功生成 ${suggestedCategories.length} 个分类建议。`, 'success');
                analysisStatus.textContent = '分类建议已更新！';
                addLog('建议列表: ' + suggestedCategories.join(', '));
            } else {
                throw new Error('API返回的不是一个有效的数组。');
            }
        } catch (error) {
            addLog(`生成分类建议失败: ${error.message}`, 'error');
            analysisStatus.textContent = '生成建议失败。';
        } finally {
            analysisProgressBar.style.width = '100%';
            setTimeout(() => { analysisProgress.classList.add('hidden'); }, 2000);
        }
    }

    async function analyzeBookmarks() {
        if (suggestedCategories.length === 0) {
            addLog('尚未生成分类建议。请先点击“重新生成分类建议”。', 'warning');
            if (!confirm('尚未生成分类建议。是否现在生成？')) return;
            await regenerateSuggestedCategories();
            if (suggestedCategories.length === 0) {
                addLog('无法在没有分类建议的情况下继续分析。', 'error');
                return;
            }
        }

        addLog('开始书签分析...');
        analysisProgress.classList.remove('hidden');
        analysisLogContainer.classList.remove('hidden');
        const organizeBtn = document.getElementById('organize-bookmarks-btn');
        organizeBtn.classList.add('hidden');
        analysisStatus.textContent = '正在获取所有书签...';
        analysisProgressBar.style.width = '0%';
        
        const allBookmarks = flattenBookmarks(bookmarkTreeRoot);
        const totalCount = allBookmarks.length;
        addLog(`共找到 ${totalCount} 个书签。将按照预设的 ${suggestedCategories.length} 个分类进行整理。`);

        const settings = await new Promise(resolve => chrome.storage.sync.get(['apiKey', 'apiProvider', 'geminiModel', 'openaiModel', 'customApiUrl', 'customModel', 'batchSize'], resolve));
        if (!settings.apiKey) {
            addLog('API密钥未配置，分析中止。', 'error');
            analysisStatus.textContent = '错误：请先配置API密钥。';
            return;
        }

        const batchSize = settings.batchSize || 50;
        let processedCount = 0;
        analysisCategories = {};
        // Initialize categories to ensure all suggested categories are present
        suggestedCategories.forEach(cat => analysisCategories[cat] = []);

        for (let i = 0; i < totalCount; i += batchSize) {
            const batch = allBookmarks.slice(i, i + batchSize);
            const statusText = `正在处理 ${i + 1}-${Math.min(i + batchSize, totalCount)} / ${totalCount}...`;
            analysisStatus.textContent = statusText;
            addLog(statusText);

            try {
                const prompt = `你是一个严格的书签分类助手。请将以下书签精确地分配到【一个】最合适的预设分类中。\n- 必须从下面提供的分类列表中选择，不允许创建新分类。\n- 如果一个书签不属于任何预设分类，请将其归入 "未分类"。\n\n预设分类列表:\n${JSON.stringify(suggestedCategories)}\n\n需要分类的书签：\n${JSON.stringify(batch.map(b => ({title: b.title, url: b.url})), null, 2)}\n\n严格以JSON格式返回，格式为 {"分类名称": [{"title": "书签标题", "url": "书签URL"}]}。不要添加任何其他说明文字。`;
                
                const result = await callApi(prompt, settings);
                
                for (const [category, items] of Object.entries(result)) {
                    if (analysisCategories[category]) {
                         const itemsWithIds = items.map(item => {
                            return allBookmarks.find(bm => bm.url === item.url && bm.title === item.title) || item;
                        });
                        analysisCategories[category].push(...itemsWithIds);
                    } else {
                        addLog(`警告：API返回了未预设的分类 "${category}"，已忽略。`, 'warning');
                    }
                }

            } catch (error) {
                addLog(`批次 ${i / batchSize + 1} 处理失败: ${error.message}`, 'error');
            }

            processedCount += batch.length;
            analysisProgressBar.style.width = `${(processedCount / totalCount) * 100}%`;
        }

        analysisStatus.textContent = `分析完成！`;
        addLog('所有批次处理完毕。', 'success');
        exportCsvBtn.classList.remove('hidden');
        organizeBtn.classList.remove('hidden');
    }

    async function organizeBookmarks() {
        const categoriesWithItems = Object.keys(analysisCategories).filter(cat => analysisCategories[cat].length > 0);
        if (categoriesWithItems.length === 0) {
            addLog('没有可用的分类结果来整理书签。', 'warning');
            return;
        }
        if (!confirm(`此操作将根据AI分类结果，在“其他书签”中创建 ${categoriesWithItems.length} 个文件夹并移动书签。确定吗？`)) {
            return;
        }

        addLog('开始整理书签到文件夹...');
        const otherBookmarksId = '2'; // 'Other Bookmarks' folder ID
        let organizedCount = 0;
        const totalToOrganize = categoriesWithItems.reduce((sum, cat) => sum + analysisCategories[cat].length, 0);
        analysisStatus.textContent = '正在整理书签...';

        for (const category of categoriesWithItems) {
            const items = analysisCategories[category];
            if (items.length === 0) continue;

            try {
                addLog(`正在为分类 "${category}" 创建文件夹...`);
                const categoryFolder = await createBookmarkFolder(category, otherBookmarksId);
                addLog(`文件夹 "${category}" 已就绪 (ID: ${categoryFolder.id})`, 'success');

                for (const bookmark of items) {
                    if (bookmark.id && bookmark.parentId !== categoryFolder.id) {
                        await moveBookmark(bookmark.id, categoryFolder.id);
                        organizedCount++;
                        const progress = (organizedCount / totalToOrganize) * 100;
                        analysisProgressBar.style.width = `${progress}%`;
                        analysisStatus.textContent = `正在整理: ${organizedCount}/${totalToOrganize}`;
                    }
                }
                addLog(`已将 ${items.length} 个书签移动到 "${category}"`);
            } catch (error) {
                addLog(`处理分类 "${category}" 时出错: ${error.message}`, 'error');
            }
        }
        analysisStatus.textContent = `整理完成！共移动 ${organizedCount} 个书签。`;
        addLog('书签整理完毕。', 'success');
        alert('书签已根据分类自动整理到“其他书签”文件夹中！');
    }

    function createBookmarkFolder(title, parentId) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getChildren(parentId, (children) => {
                const existingFolder = children.find(child => child.title === title && !child.url);
                if (existingFolder) {
                    resolve(existingFolder);
                } else {
                    chrome.bookmarks.create({ parentId, title }, (newFolder) => {
                        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                        else resolve(newFolder);
                    });
                }
            });
        });
    }

    function moveBookmark(bookmarkId, newParentId) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.move(bookmarkId, { parentId: newParentId }, (result) => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(result);
            });
        });
    }

    async function callApi(prompt, settings, expectArray = false) {
        let url, body, headers = {'Content-Type': 'application/json'};
        
        if (settings.apiProvider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${settings.apiKey}`;
            body = { contents: [{ parts: [{ text: prompt }] }] };
        } else if (settings.apiProvider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${settings.apiKey}`;
            body = { model: settings.openaiModel, messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" } };
        } else { // custom
            url = settings.customApiUrl;
            headers['Authorization'] = `Bearer ${settings.apiKey}`;
            body = { model: settings.customModel, messages: [{ role: 'user', content: prompt }] };
        }

        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown'}`);
        }
        const data = await response.json();
        const responseText = data.candidates?.[0].content.parts[0].text || data.choices?.[0].message.content || JSON.stringify(data);
        
        const jsonMatch = responseText.match(expectArray ? /\[[\s\S]*\]/ : /{[\s\S]*}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error(`API did not return valid ${expectArray ? 'array' : 'JSON'}.`);
    }

    // --- Start the application ---
    initialize();
});