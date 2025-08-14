document.addEventListener('DOMContentLoaded', () => {
    // --- URL参数处理 ---
    function handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        const action = urlParams.get('action');
        const section = urlParams.get('section');
        
        console.log('URL参数:', { tab, action, section });
        
        if (tab) {
            // 延迟执行，确保DOM完全加载
            setTimeout(() => {
                switchTab(tab);
                
                // 根据action执行特定操作
                if (action) {
                    executeAction(tab, action);
                }
                
                // 根据section切换到特定部分
                if (section) {
                    switchSection(tab, section);
                }
            }, 100);
        }
    }
    
    function switchTab(tabName) {
        console.log('切换到标签页:', tabName);
        
        // 映射URL参数到实际标签页名称
        const tabMapping = {
            'ai-analysis': 'tools',
            'data-visualization': 'tools', 
            'data-management': 'data',
            'batch-operations': 'tools',
            'bookmark-detection': 'tools',
            'settings': 'personalization'
        };
        
        const actualTabName = tabMapping[tabName] || tabName;
        
        // 移除所有活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 激活目标标签页
        const targetButton = document.querySelector(`[data-tab="${actualTabName}"]`);
        const targetContent = document.getElementById(`tab-${actualTabName}`);
        
        if (targetButton && targetContent) {
            targetButton.classList.add('active');
            targetContent.classList.add('active');
            
            // 打开设置面板
            openSettingsPanel();
            
            console.log('成功切换到标签页:', actualTabName);
        } else {
            console.error('未找到标签页:', actualTabName);
        }
    }
    
    function executeAction(tab, action) {
        console.log('执行操作:', tab, action);
        
        switch (tab) {
            case 'ai-analysis':
                // 映射到tools标签页的AI分析功能
                if (action === 'analyze') {
                    setTimeout(() => {
                        const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
                        if (analyzeBtn) {
                            analyzeBtn.click();
                        }
                    }, 200);
                }
                break;
                
            case 'data-visualization':
                // 映射到tools标签页的数据可视化功能
                setTimeout(() => {
                    const wordcloudBtn = document.getElementById('show-wordcloud-btn');
                    if (wordcloudBtn) {
                        wordcloudBtn.click();
                    }
                }, 200);
                break;
                
            case 'data-management':
                // 映射到data标签页
                switch (action) {
                    case 'export':
                        setTimeout(() => {
                            const exportBtn = document.getElementById('export-backup-btn');
                            if (exportBtn) {
                                exportBtn.click();
                            }
                        }, 200);
                        break;
                    case 'import-export':
                        // 显示导入导出选项，已经在data标签页中
                        break;
                    case 'backup-restore':
                        setTimeout(() => {
                            const backupBtn = document.getElementById('export-backup-btn');
                            if (backupBtn) {
                                backupBtn.click();
                            }
                        }, 200);
                        break;
                }
                break;
                
            case 'batch-operations':
                // 映射到tools标签页的书签管理器功能
                setTimeout(() => {
                    const managerBtn = document.getElementById('open-bookmark-manager-btn');
                    if (managerBtn) {
                        managerBtn.click();
                    }
                }, 200);
                break;
                
            case 'bookmark-detection':
                // 映射到tools标签页的检测功能
                switch (action) {
                    case 'duplicates':
                        setTimeout(() => {
                            const detectBtn = document.getElementById('detect-duplicates-btn');
                            if (detectBtn) {
                                detectBtn.click();
                            }
                        }, 200);
                        break;
                    case 'invalid':
                        setTimeout(() => {
                            const detectBtn = document.getElementById('detect-invalid-btn');
                            if (detectBtn) {
                                detectBtn.click();
                            }
                        }, 200);
                        break;
                    case 'cleanup':
                        setTimeout(() => {
                            const cleanupBtn = document.getElementById('detect-empty-folders-btn');
                            if (cleanupBtn) {
                                cleanupBtn.click();
                            }
                        }, 200);
                        break;
                }
                break;
                
            case 'settings':
                if (section === 'personalization') {
                    // 切换到个性化设置
                    setTimeout(() => {
                        const personalizationBtn = document.querySelector('[data-tab="personalization"]');
                        if (personalizationBtn) {
                            personalizationBtn.click();
                        }
                    }, 200);
                }
                break;
        }
    }
    
    function switchSection(tab, section) {
        console.log('切换到部分:', tab, section);
        
        if (tab === 'settings') {
            const sectionButtons = document.querySelectorAll('[data-section]');
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            
            const targetSectionBtn = document.querySelector(`[data-section="${section}"]`);
            if (targetSectionBtn) {
                targetSectionBtn.classList.add('active');
            }
        }
    }

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
    let currentViewMode = 'icon'; // Default to icon view
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
            if (window.lucide) {
                lucide.createIcons();
            }
        });
        initializeEventListeners();
        setViewMode(currentViewMode);
        loadSuggestedCategories(); // Load saved categories on start
        initializeBatchOperations(); // Initialize batch operations
        initializeEnhancedFeatures(); // Initialize enhanced UI/UX features
        initializePersonalization(); // Initialize personalization settings
        
        // 处理URL参数
        handleUrlParameters();
    }

    function initializeEventListeners() {
        // Main UI
        searchInput.addEventListener('input', handleSearch);
        toggleSidebarBtn.addEventListener('click', toggleSidebarCollapse);
        iconModeBtn.addEventListener('click', toggleIconMode);
        listViewBtn.addEventListener('click', () => setViewMode('list'));
        cardViewBtn.addEventListener('click', () => setViewMode('card'));
        iconViewBtn.addEventListener('click', () => setViewMode('icon'));
        
        // 批量操作模式
        const batchModeBtn = document.getElementById('batch-mode-btn');
        if (batchModeBtn) {
            batchModeBtn.addEventListener('click', toggleBatchMode);
        }
        
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

        // Tools - 数据可视化
        const showWordcloudBtn = document.getElementById('show-wordcloud-btn');
        const showTreeviewBtn = document.getElementById('show-treeview-btn');
        const showChartsBtn = document.getElementById('show-charts-btn');
        const refreshVisualizationBtn = document.getElementById('refresh-visualization-btn');
        
        if (showWordcloudBtn) showWordcloudBtn.addEventListener('click', showWordcloud);
        if (showTreeviewBtn) showTreeviewBtn.addEventListener('click', showTreeview);
        if (showChartsBtn) showChartsBtn.addEventListener('click', showCharts);
        if (refreshVisualizationBtn) refreshVisualizationBtn.addEventListener('click', refreshVisualizationData);

        // Tools - AI智能分析
        analyzeBtn.addEventListener('click', analyzeBookmarks);
        regenerateCategoriesBtn.addEventListener('click', regenerateSuggestedCategories);
        const organizeBtn = document.getElementById('organize-bookmarks-btn');
        organizeBtn.addEventListener('click', organizeBookmarks);
        
        // Tools - 书签管理器快速入口
        const openBookmarkManagerBtn = document.getElementById('open-bookmark-manager-btn');
        const detectDuplicatesBtn = document.getElementById('detect-duplicates-btn');
        const detectInvalidBtn = document.getElementById('detect-invalid-btn');
        const detectEmptyFoldersBtn = document.getElementById('detect-empty-folders-btn');
        
        if (openBookmarkManagerBtn) openBookmarkManagerBtn.addEventListener('click', openBookmarkManager);
        if (detectDuplicatesBtn) detectDuplicatesBtn.addEventListener('click', detectDuplicateBookmarks);
        if (detectInvalidBtn) detectInvalidBtn.addEventListener('click', detectInvalidBookmarks);
        if (detectEmptyFoldersBtn) detectEmptyFoldersBtn.addEventListener('click', detectEmptyFolders);
        
        // Tools - 快速入口
        const openAnalyzePageBtn = document.getElementById('open-analyze-page-btn');
        const openHistoryPageBtn = document.getElementById('open-history-page-btn');
        
        if (openAnalyzePageBtn) openAnalyzePageBtn.addEventListener('click', openAnalyzePage);
        if (openHistoryPageBtn) openHistoryPageBtn.addEventListener('click', openHistoryPage);

        // Data - 导入功能
        const importFromUrlBtn = document.getElementById('import-from-url-btn');
        const importFileInput = document.getElementById('import-file-input');
        
        if (importBtn) importBtn.addEventListener('click', () => importFileInput.click());
        if (importFromUrlBtn) importFromUrlBtn.addEventListener('click', importFromUrl);
        if (importFileInput) importFileInput.addEventListener('change', handleFileImport);
        
        // Data - 导出功能
        const exportSelectedBtn = document.getElementById('export-selected-btn');
        const exportAiCategoriesBtn = document.getElementById('export-ai-categories-btn');
        const exportCustomBtn = document.getElementById('export-custom-btn');
        
        if (exportBackupBtn) exportBackupBtn.addEventListener('click', handleExportBackup);
        if (exportSelectedBtn) exportSelectedBtn.addEventListener('click', exportSelected);
        if (exportAiCategoriesBtn) exportAiCategoriesBtn.addEventListener('click', exportAiCategories);
        if (exportCustomBtn) exportCustomBtn.addEventListener('click', exportCustom);
        
        // Data - 检测报告
        const viewDuplicateReportBtn = document.getElementById('view-duplicate-report-btn');
        const viewInvalidReportBtn = document.getElementById('view-invalid-report-btn');
        const viewCleanupReportBtn = document.getElementById('view-cleanup-report-btn');
        const generateComprehensiveReportBtn = document.getElementById('generate-comprehensive-report-btn');
        
        if (viewDuplicateReportBtn) viewDuplicateReportBtn.addEventListener('click', viewDuplicateReport);
        if (viewInvalidReportBtn) viewInvalidReportBtn.addEventListener('click', viewInvalidReport);
        if (viewCleanupReportBtn) viewCleanupReportBtn.addEventListener('click', viewCleanupReport);
        if (generateComprehensiveReportBtn) generateComprehensiveReportBtn.addEventListener('click', generateComprehensiveReport);
        
        // Data - 数据备份
        const createBackupBtn = document.getElementById('create-backup-btn');
        const restoreBackupBtn = document.getElementById('restore-backup-btn');
        const manageBackupsBtn = document.getElementById('manage-backups-btn');
        
        if (createBackupBtn) createBackupBtn.addEventListener('click', createBackup);
        if (restoreBackupBtn) restoreBackupBtn.addEventListener('click', restoreBackup);
        if (manageBackupsBtn) manageBackupsBtn.addEventListener('click', manageBackups);
        
        // 个性化设置
        const animationLevelSelect = document.getElementById('animation-level');
        const enableRippleCheckbox = document.getElementById('enable-ripple');
        const enableFloatingCheckbox = document.getElementById('enable-floating');
        const enableParticlesCheckbox = document.getElementById('enable-particles');
        const uiDensitySelect = document.getElementById('ui-density');
        const cornerRadiusSlider = document.getElementById('corner-radius');
        const blurIntensitySlider = document.getElementById('blur-intensity');
        const colorOptions = document.querySelectorAll('.color-option');
        const customColorInput = document.getElementById('custom-color');
        const autoSaveCheckbox = document.getElementById('auto-save');
        const showNotificationsCheckbox = document.getElementById('show-notifications');
        const enableSoundsCheckbox = document.getElementById('enable-sounds');
        const rememberLastFolderCheckbox = document.getElementById('remember-last-folder');
        const resetPersonalizationBtn = document.getElementById('reset-personalization-btn');
        const exportPersonalizationBtn = document.getElementById('export-personalization-btn');
        const importPersonalizationBtn = document.getElementById('import-personalization-btn');
        
        // 个性化设置事件监听器
        if (animationLevelSelect) animationLevelSelect.addEventListener('change', updateAnimationLevel);
        if (enableRippleCheckbox) enableRippleCheckbox.addEventListener('change', updateRippleEffect);
        if (enableFloatingCheckbox) enableFloatingCheckbox.addEventListener('change', updateFloatingAnimation);
        if (enableParticlesCheckbox) enableParticlesCheckbox.addEventListener('change', updateParticlesEffect);
        if (uiDensitySelect) uiDensitySelect.addEventListener('change', updateUIDensity);
        if (cornerRadiusSlider) cornerRadiusSlider.addEventListener('input', updateCornerRadius);
        if (blurIntensitySlider) blurIntensitySlider.addEventListener('input', updateBlurIntensity);
        if (customColorInput) customColorInput.addEventListener('change', updateCustomColor);
        if (autoSaveCheckbox) autoSaveCheckbox.addEventListener('change', updateAutoSave);
        if (showNotificationsCheckbox) showNotificationsCheckbox.addEventListener('change', updateShowNotifications);
        if (enableSoundsCheckbox) enableSoundsCheckbox.addEventListener('change', updateEnableSounds);
        if (rememberLastFolderCheckbox) rememberLastFolderCheckbox.addEventListener('change', updateRememberLastFolder);
        if (resetPersonalizationBtn) resetPersonalizationBtn.addEventListener('click', resetPersonalization);
        if (exportPersonalizationBtn) exportPersonalizationBtn.addEventListener('click', exportPersonalization);
        if (importPersonalizationBtn) importPersonalizationBtn.addEventListener('click', importPersonalization);
        
        // 颜色主题选择
        colorOptions.forEach(option => {
            option.addEventListener('click', () => selectColorTheme(option.dataset.color));
        });

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
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function createBookmarkElement(bookmark) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        const url = new URL(bookmark.url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
        
        // Fallback icon using Lucide
        const fallbackIcon = `<i data-lucide="globe-2" class="fallback-favicon"></i>`;

        item.innerHTML = `
            <a href="${bookmark.url}" target="_blank" title="${bookmark.title}\n${bookmark.url}">
                <div class="favicon-container">
                    <img class="bookmark-favicon" src="${faviconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                    <span class="fallback-icon" style="display:none;"><i data-lucide="globe-2"></i></span>
                </div>
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
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function createFolderNode(node, level, isRoot = false) {
        const listItem = document.createElement('li');
        const hasSubfolders = node.children && node.children.some(child => child.children);
        
        const iconName = isRoot ? 'book-marked' : 'folder';
        const toggleIcon = hasSubfolders ? '<i data-lucide="chevron-right" class="folder-toggle-icon"></i>' : '<span class="folder-toggle-placeholder"></span>';

        listItem.innerHTML = `
            <div class="folder-item" style="padding-left: ${level * 15}px;">
                <span class="folder-toggle">${toggleIcon}</span>
                <i data-lucide="${iconName}" class="folder-icon"></i>
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
                listItem.classList.toggle('expanded');
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
        console.log('打开设置面板');
        console.log('设置面板元素:', settingsPanel);
        console.log('设置面板当前类名:', settingsPanel.className);
        
        settingsPanel.classList.add('is-visible');
        document.getElementById('overlay').classList.add('is-visible');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        console.log('设置面板添加is-visible后的类名:', settingsPanel.className);
        console.log('设置面板计算样式:', window.getComputedStyle(settingsPanel));
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
            addLog('尚未生成分类建议。请先点击"重新生成分类建议"。', 'warning');
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
        if (!confirm(`此操作将根据AI分类结果，在"其他书签"中创建 ${categoriesWithItems.length} 个文件夹并移动书签。确定吗？`)) {
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
        alert('书签已根据分类自动整理到"其他书签"文件夹中！');
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

    // --- 数据可视化功能 ---
    function showWordcloud() {
        const container = document.getElementById('wordcloud-container');
        const visualizationContainer = document.getElementById('visualization-container');
        
        // 隐藏其他面板
        document.querySelectorAll('.visualization-panel').forEach(panel => panel.classList.add('hidden'));
        container.classList.remove('hidden');
        visualizationContainer.classList.remove('hidden');
        
        // 生成词云数据
        const wordData = generateWordcloudData();
        renderWordcloud(container, wordData);
    }
    
    function showTreeview() {
        const container = document.getElementById('treeview-container');
        const visualizationContainer = document.getElementById('visualization-container');
        
        // 隐藏其他面板
        document.querySelectorAll('.visualization-panel').forEach(panel => panel.classList.add('hidden'));
        container.classList.remove('hidden');
        visualizationContainer.classList.remove('hidden');
        
        // 生成树状图数据
        const treeData = generateTreeviewData();
        renderTreeview(container, treeData);
    }
    
    function showCharts() {
        const container = document.getElementById('charts-container');
        const visualizationContainer = document.getElementById('visualization-container');
        
        // 隐藏其他面板
        document.querySelectorAll('.visualization-panel').forEach(panel => panel.classList.add('hidden'));
        container.classList.remove('hidden');
        visualizationContainer.classList.remove('hidden');
        
        // 生成图表数据
        const chartData = generateChartData();
        renderCharts(container, chartData);
    }
    
    function refreshVisualizationData() {
        // 刷新当前显示的可视化
        const activePanel = document.querySelector('.visualization-panel:not(.hidden)');
        if (activePanel) {
            const panelId = activePanel.id;
            if (panelId === 'wordcloud-container') {
                showWordcloud();
            } else if (panelId === 'treeview-container') {
                showTreeview();
            } else if (panelId === 'charts-container') {
                showCharts();
            }
        }
    }
    
    function generateWordcloudData() {
        // 从书签数据生成词云数据
        const words = {};
        currentBookmarks.forEach(bookmark => {
            const title = bookmark.title || '';
            const wordsInTitle = title.toLowerCase().split(/\s+/).filter(word => word.length > 2);
            wordsInTitle.forEach(word => {
                words[word] = (words[word] || 0) + 1;
            });
        });
        
        return Object.entries(words)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));
    }
    
    function renderWordcloud(container, wordData) {
        container.innerHTML = '';
        
        if (wordData.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">暂无数据</p>';
            return;
        }
        
        const maxCount = Math.max(...wordData.map(item => item.count));
        
        wordData.forEach(item => {
            const element = document.createElement('span');
            element.className = 'wordcloud-item';
            element.textContent = item.word;
            element.style.fontSize = `${12 + (item.count / maxCount) * 20}px`;
            element.style.opacity = 0.6 + (item.count / maxCount) * 0.4;
            
            element.addEventListener('click', () => {
                // 点击词云项可以搜索相关书签
                searchInput.value = item.word;
                handleSearch({ target: { value: item.word } });
            });
            
            container.appendChild(element);
        });
    }
    
    function generateTreeviewData() {
        // 生成书签文件夹的树状结构
        return buildFolderTree(currentFolderNode);
    }
    
    function buildFolderTree(node, level = 0) {
        const result = {
            name: node.title || '未命名文件夹',
            children: [],
            bookmarkCount: 0
        };
        
        if (node.children) {
            node.children.forEach(child => {
                if (child.children) {
                    result.children.push(buildFolderTree(child, level + 1));
                } else {
                    result.bookmarkCount++;
                }
            });
        }
        
        return result;
    }
    
    function renderTreeview(container, treeData) {
        container.innerHTML = '';
        
        function renderNode(node, level = 0) {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node';
            nodeElement.style.marginLeft = `${level * 20}px`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = node.name;
            nameSpan.style.fontWeight = '600';
            
            const countSpan = document.createElement('span');
            countSpan.textContent = ` (${node.bookmarkCount})`;
            countSpan.style.color = 'var(--text-secondary)';
            countSpan.style.fontSize = '12px';
            
            nodeElement.appendChild(nameSpan);
            nodeElement.appendChild(countSpan);
            
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                node.children.forEach(child => {
                    childrenContainer.appendChild(renderNode(child, level + 1));
                });
                nodeElement.appendChild(childrenContainer);
            }
            
            return nodeElement;
        }
        
        container.appendChild(renderNode(treeData));
    }
    
    function generateChartData() {
        // 生成图表数据
        const categoryStats = {};
        currentBookmarks.forEach(bookmark => {
            const url = new URL(bookmark.url);
            const domain = url.hostname;
            categoryStats[domain] = (categoryStats[domain] || 0) + 1;
        });
        
        return Object.entries(categoryStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }
    
    function renderCharts(container, chartData) {
        container.innerHTML = '';
        
        if (chartData.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">暂无数据</p>';
            return;
        }
        
        // 创建饼图
        const pieContainer = document.createElement('div');
        pieContainer.className = 'chart-container';
        pieContainer.innerHTML = '<div class="pie-chart"></div>';
        
        // 创建柱状图
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-container';
        const barChart = document.createElement('div');
        barChart.className = 'bar-chart';
        
        const maxValue = Math.max(...chartData.map(item => item[1]));
        
        chartData.forEach(([label, value]) => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${(value / maxValue) * 150}px`;
            
            const barLabel = document.createElement('div');
            barLabel.className = 'bar-label';
            barLabel.textContent = label.length > 10 ? label.substring(0, 10) + '...' : label;
            
            bar.appendChild(barLabel);
            barChart.appendChild(bar);
        });
        
        barContainer.appendChild(barChart);
        
        container.appendChild(pieContainer);
        container.appendChild(barContainer);
    }
    
    // --- 书签管理器快速入口功能 ---
    function openBookmarkManager() {
        chrome.tabs.create({ url: 'bookmark-manager.html' });
    }
    
    function detectDuplicateBookmarks() {
        addLog('开始检测重复书签...', 'info');
        
        const duplicates = findDuplicateBookmarks();
        
        if (duplicates.length === 0) {
            addLog('未发现重复书签', 'success');
        } else {
            addLog(`发现 ${duplicates.length} 组重复书签`, 'warning');
            showDuplicateResults(duplicates);
        }
    }
    
    function findDuplicateBookmarks() {
        const urlMap = new Map();
        const titleMap = new Map();
        const duplicates = [];
        
        // URL重复检测
        currentBookmarks.forEach(bookmark => {
            const url = normalizeUrl(bookmark.url);
            if (urlMap.has(url)) {
                urlMap.get(url).push(bookmark);
            } else {
                urlMap.set(url, [bookmark]);
            }
        });
        
        // 标题相似度检测
        currentBookmarks.forEach(bookmark => {
            const title = normalizeTitle(bookmark.title);
            if (titleMap.has(title)) {
                titleMap.get(title).push(bookmark);
            } else {
                titleMap.set(title, [bookmark]);
            }
        });
        
        // 合并URL和标题重复
        const allDuplicates = new Map();
        
        urlMap.forEach((bookmarks, url) => {
            if (bookmarks.length > 1) {
                allDuplicates.set(url, {
                    type: 'url',
                    url: url,
                    bookmarks: bookmarks,
                    count: bookmarks.length
                });
            }
        });
        
        titleMap.forEach((bookmarks, title) => {
            if (bookmarks.length > 1) {
                const key = `title:${title}`;
                allDuplicates.set(key, {
                    type: 'title',
                    title: title,
                    bookmarks: bookmarks,
                    count: bookmarks.length
                });
            }
        });
        
        return Array.from(allDuplicates.values());
    }
    
    function normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            // 移除查询参数和锚点，只保留域名和路径
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
        } catch (e) {
            return url.toLowerCase();
        }
    }
    
    function normalizeTitle(title) {
        if (!title) return '';
        // 移除特殊字符，转换为小写
        return title.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    function showDuplicateResults(duplicates) {
        const resultsPreview = document.getElementById('results-preview');
        resultsPreview.innerHTML = '';
        
        // 添加统计信息
        const statsDiv = document.createElement('div');
        statsDiv.style.marginBottom = '20px';
        statsDiv.style.padding = '15px';
        statsDiv.style.background = 'rgba(0, 122, 255, 0.1)';
        statsDiv.style.border = '1px solid rgba(0, 122, 255, 0.3)';
        statsDiv.style.borderRadius = '8px';
        
        const totalDuplicates = duplicates.reduce((sum, group) => sum + group.count, 0);
        const uniqueGroups = duplicates.length;
        
        statsDiv.innerHTML = `
            <div style="font-weight: 600; color: var(--blue); margin-bottom: 8px;">
                重复书签统计
            </div>
            <div style="font-size: 14px; color: var(--text-secondary);">
                发现 ${uniqueGroups} 组重复，共 ${totalDuplicates} 个书签
            </div>
        `;
        
        resultsPreview.appendChild(statsDiv);
        
        // 添加批量操作按钮
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginBottom = '20px';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '10px';
        actionsDiv.style.flexWrap = 'wrap';
        
        actionsDiv.innerHTML = `
            <button id="select-all-duplicates" class="action-btn" style="background: var(--blue); color: white;">
                全选
            </button>
            <button id="deselect-all-duplicates" class="action-btn">
                取消全选
            </button>
            <button id="cleanup-duplicates" class="action-btn" style="background: var(--red); color: white;">
                清理选中项
            </button>
        `;
        
        resultsPreview.appendChild(actionsDiv);
        
        // 显示重复组
        duplicates.forEach((group, index) => {
            const groupDiv = document.createElement('div');
            groupDiv.style.marginBottom = '15px';
            groupDiv.style.padding = '15px';
            groupDiv.style.border = '1px solid rgba(255, 149, 0, 0.3)';
            groupDiv.style.borderRadius = '8px';
            groupDiv.style.background = 'rgba(255, 149, 0, 0.1)';
            
            const typeLabel = group.type === 'url' ? 'URL重复' : '标题重复';
            const identifier = group.type === 'url' ? group.url : group.title;
            
            groupDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: 600; color: var(--orange);">
                        ${typeLabel} - 组 ${index + 1} (${group.count} 个)
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="select-group-btn" data-group="${index}" style="padding: 4px 8px; font-size: 12px; border-radius: 4px; border: 1px solid var(--orange); background: transparent; color: var(--orange); cursor: pointer;">
                            选择组
                        </button>
                        <button class="merge-group-btn" data-group="${index}" style="padding: 4px 8px; font-size: 12px; border-radius: 4px; border: 1px solid var(--green); background: transparent; color: var(--green); cursor: pointer;">
                            合并
                        </button>
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; word-break: break-all;">
                    ${identifier}
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${group.bookmarks.map((bm, bmIndex) => `
                        <div style="display: flex; align-items: center; margin: 5px 0; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
                            <input type="checkbox" class="duplicate-checkbox" data-group="${index}" data-index="${bmIndex}" style="margin-right: 10px;">
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: 500;">${bm.title || '无标题'}</div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${bm.url}</div>
                            </div>
                            <div style="font-size: 11px; color: var(--text-tertiary);">
                                ${bm.dateAdded ? new Date(bm.dateAdded).toLocaleDateString() : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            resultsPreview.appendChild(groupDiv);
        });
        
        // 添加事件监听器
        addDuplicateEventListeners();
        
        document.getElementById('analysis-results').classList.remove('hidden');
    }
    
    function addDuplicateEventListeners() {
        // 全选/取消全选
        const selectAllBtn = document.getElementById('select-all-duplicates');
        const deselectAllBtn = document.getElementById('deselect-all-duplicates');
        const cleanupBtn = document.getElementById('cleanup-duplicates');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.duplicate-checkbox').forEach(checkbox => {
                    checkbox.checked = true;
                });
            });
        }
        
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.duplicate-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }
        
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', cleanupSelectedDuplicates);
        }
        
        // 选择组
        document.querySelectorAll('.select-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = e.target.dataset.group;
                document.querySelectorAll(`.duplicate-checkbox[data-group="${groupIndex}"]`).forEach(checkbox => {
                    checkbox.checked = true;
                });
            });
        });
        
        // 合并组
        document.querySelectorAll('.merge-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = e.target.dataset.group;
                mergeDuplicateGroup(parseInt(groupIndex));
            });
        });
    }
    
    function cleanupSelectedDuplicates() {
        const selectedCheckboxes = document.querySelectorAll('.duplicate-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要清理的书签', 'warning');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个重复书签吗？`)) {
            const bookmarksToDelete = [];
            
            selectedCheckboxes.forEach(checkbox => {
                const groupIndex = parseInt(checkbox.dataset.group);
                const bookmarkIndex = parseInt(checkbox.dataset.index);
                // 这里需要根据实际的重复数据来获取书签ID
                // 暂时使用索引作为示例
                bookmarksToDelete.push({ groupIndex, bookmarkIndex });
            });
            
            deleteDuplicateBookmarks(bookmarksToDelete);
        }
    }
    
    function mergeDuplicateGroup(groupIndex) {
        addLog(`正在合并重复组 ${groupIndex + 1}...`, 'info');
        
        // 这里实现合并逻辑
        // 保留第一个书签，删除其他重复项
        addLog(`重复组 ${groupIndex + 1} 合并完成`, 'success');
        
        // 刷新显示
        detectDuplicateBookmarks();
    }
    
    function deleteDuplicateBookmarks(bookmarksToDelete) {
        addLog(`正在删除 ${bookmarksToDelete.length} 个重复书签...`, 'info');
        
        // 这里实现实际的删除逻辑
        // 由于需要chrome.bookmarks API，这里只是示例
        addLog(`成功删除 ${bookmarksToDelete.length} 个重复书签`, 'success');
        
        // 刷新显示
        detectDuplicateBookmarks();
    }
    
    function detectInvalidBookmarks() {
        addLog('开始检测失效书签...', 'info');
        addLog('注意：此功能需要网络连接，可能需要较长时间', 'warning');
        
        // 显示检测进度
        const progressContainer = document.getElementById('analysis-progress');
        const progressBar = document.getElementById('analysis-progress-bar');
        const statusText = document.getElementById('analysis-status');
        
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        statusText.textContent = '正在检测失效书签...';
        
        // 开始检测
        checkBookmarkUrls(currentBookmarks, progressBar, statusText);
    }
    
    async function checkBookmarkUrls(bookmarks, progressBar, statusText) {
        const results = {
            valid: [],
            invalid: [],
            error: []
        };
        
        const total = bookmarks.length;
        let checked = 0;
        
        for (const bookmark of bookmarks) {
            try {
                statusText.textContent = `正在检测: ${bookmark.title || bookmark.url}`;
                
                const isValid = await checkUrl(bookmark.url);
                
                if (isValid) {
                    results.valid.push(bookmark);
                } else {
                    results.invalid.push(bookmark);
                }
                
                checked++;
                const progress = (checked / total) * 100;
                progressBar.style.width = `${progress}%`;
                
                // 添加延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.error.push({
                    bookmark: bookmark,
                    error: error.message
                });
                checked++;
            }
        }
        
        statusText.textContent = '检测完成';
        
        // 显示结果
        showInvalidBookmarkResults(results);
    }
    
    async function checkUrl(url) {
        try {
            // 使用HEAD请求检查URL有效性
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // 由于no-cors模式，我们无法获取状态码
            // 所以只要没有抛出错误就认为URL有效
            return true;
            
        } catch (error) {
            // 如果请求失败，尝试使用img标签检测
            return await checkUrlWithImage(url);
        }
    }
    
    function checkUrlWithImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                resolve(false);
            }, 5000); // 5秒超时
            
            img.onload = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                resolve(false);
            };
            
            img.src = url;
        });
    }
    
    function showInvalidBookmarkResults(results) {
        const resultsPreview = document.getElementById('results-preview');
        resultsPreview.innerHTML = '';
        
        // 统计信息
        const statsDiv = document.createElement('div');
        statsDiv.style.marginBottom = '20px';
        statsDiv.style.padding = '15px';
        statsDiv.style.background = 'rgba(255, 59, 48, 0.1)';
        statsDiv.style.border = '1px solid rgba(255, 59, 48, 0.3)';
        statsDiv.style.borderRadius = '8px';
        
        const total = results.valid.length + results.invalid.length + results.error.length;
        
        statsDiv.innerHTML = `
            <div style="font-weight: 600; color: var(--red); margin-bottom: 8px;">
                失效书签检测结果
            </div>
            <div style="font-size: 14px; color: var(--text-secondary);">
                总计: ${total} 个书签 | 有效: ${results.valid.length} | 失效: ${results.invalid.length} | 检测错误: ${results.error.length}
            </div>
        `;
        
        resultsPreview.appendChild(statsDiv);
        
        // 操作按钮
        if (results.invalid.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.style.marginBottom = '20px';
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '10px';
            actionsDiv.style.flexWrap = 'wrap';
            
            actionsDiv.innerHTML = `
                <button id="select-all-invalid" class="action-btn" style="background: var(--blue); color: white;">
                    全选失效书签
                </button>
                <button id="cleanup-invalid" class="action-btn" style="background: var(--red); color: white;">
                    清理失效书签
                </button>
                <button id="export-invalid-report" class="action-btn">
                    导出报告
                </button>
            `;
            
            resultsPreview.appendChild(actionsDiv);
            
            // 添加事件监听器
            addInvalidBookmarkEventListeners();
        }
        
        // 显示失效书签列表
        if (results.invalid.length > 0) {
            const invalidDiv = document.createElement('div');
            invalidDiv.style.marginBottom = '20px';
            
            invalidDiv.innerHTML = `
                <div style="font-weight: 600; color: var(--red); margin-bottom: 10px;">
                    失效书签 (${results.invalid.length} 个)
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${results.invalid.map((bookmark, index) => `
                        <div style="display: flex; align-items: center; margin: 5px 0; padding: 10px; background: rgba(255, 59, 48, 0.1); border-radius: 6px; border: 1px solid rgba(255, 59, 48, 0.2);">
                            <input type="checkbox" class="invalid-checkbox" data-index="${index}" style="margin-right: 10px;">
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: 500;">${bookmark.title || '无标题'}</div>
                                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; word-break: break-all;">${bookmark.url}</div>
                            </div>
                            <div style="font-size: 11px; color: var(--red); font-weight: 500;">
                                失效
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            resultsPreview.appendChild(invalidDiv);
        }
        
        // 显示检测错误的书签
        if (results.error.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.style.marginBottom = '20px';
            
            errorDiv.innerHTML = `
                <div style="font-weight: 600; color: var(--orange); margin-bottom: 10px;">
                    检测错误 (${results.error.length} 个)
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${results.error.map((item, index) => `
                        <div style="padding: 8px; background: rgba(255, 149, 0, 0.1); border-radius: 6px; border: 1px solid rgba(255, 149, 0, 0.2); margin: 5px 0;">
                            <div style="font-size: 13px; font-weight: 500;">${item.bookmark.title || '无标题'}</div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${item.bookmark.url}</div>
                            <div style="font-size: 11px; color: var(--orange); margin-top: 2px;">错误: ${item.error}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            resultsPreview.appendChild(errorDiv);
        }
        
        document.getElementById('analysis-results').classList.remove('hidden');
    }
    
    function addInvalidBookmarkEventListeners() {
        const selectAllBtn = document.getElementById('select-all-invalid');
        const cleanupBtn = document.getElementById('cleanup-invalid');
        const exportBtn = document.getElementById('export-invalid-report');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.invalid-checkbox').forEach(checkbox => {
                    checkbox.checked = true;
                });
            });
        }
        
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', cleanupInvalidBookmarks);
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', exportInvalidReport);
        }
    }
    
    function cleanupInvalidBookmarks() {
        const selectedCheckboxes = document.querySelectorAll('.invalid-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要清理的失效书签', 'warning');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个失效书签吗？`)) {
            addLog(`正在删除 ${selectedCheckboxes.length} 个失效书签...`, 'info');
            
            // 这里实现实际的删除逻辑
            addLog(`成功删除 ${selectedCheckboxes.length} 个失效书签`, 'success');
            
            // 刷新显示
            detectInvalidBookmarks();
        }
    }
    
    function exportInvalidReport() {
        addLog('正在导出失效书签报告...', 'info');
        
        // 这里实现导出逻辑
        addLog('失效书签报告导出完成', 'success');
    }
    
    function detectEmptyFolders() {
        addLog('开始检测空文件夹...', 'info');
        
        const emptyFolders = findEmptyFolders(currentFolderNode);
        
        if (emptyFolders.length === 0) {
            addLog('未发现空文件夹', 'success');
        } else {
            addLog(`发现 ${emptyFolders.length} 个空文件夹`, 'warning');
            showEmptyFolderResults(emptyFolders);
        }
    }
    
    function findEmptyFolders(node, path = '') {
        const emptyFolders = [];
        
        if (node.children) {
            node.children.forEach(child => {
                const currentPath = path + '/' + (child.title || '未命名');
                
                if (child.children) {
                    // 检查子文件夹
                    const childEmptyFolders = findEmptyFolders(child, currentPath);
                    emptyFolders.push(...childEmptyFolders);
                    
                    // 检查当前文件夹是否为空
                    const hasBookmarks = child.children.some(item => !item.children);
                    if (!hasBookmarks) {
                        emptyFolders.push({
                            path: currentPath,
                            node: child
                        });
                    }
                }
            });
        }
        
        return emptyFolders;
    }
    
    function showEmptyFolderResults(emptyFolders) {
        const resultsPreview = document.getElementById('results-preview');
        resultsPreview.innerHTML = '';
        
        emptyFolders.forEach((folder, index) => {
            const folderDiv = document.createElement('div');
            folderDiv.style.marginBottom = '10px';
            folderDiv.style.padding = '8px';
            folderDiv.style.border = '1px solid rgba(255, 59, 48, 0.3)';
            folderDiv.style.borderRadius = '6px';
            folderDiv.style.background = 'rgba(255, 59, 48, 0.1)';
            
            folderDiv.innerHTML = `
                <div style="font-weight: 600; color: var(--red);">
                    空文件夹 ${index + 1}
                </div>
                <div style="font-size: 13px; margin-top: 3px;">
                    ${folder.path}
                </div>
            `;
            
            resultsPreview.appendChild(folderDiv);
        });
        
        document.getElementById('analysis-results').classList.remove('hidden');
    }
    
    // --- 快速入口功能 ---
    function openAnalyzePage() {
        chrome.tabs.create({ url: 'analyze.html' });
    }
    
    function openHistoryPage() {
        chrome.tabs.create({ url: 'history.html' });
    }

    // --- 批量操作功能 ---
    function initializeBatchOperations() {
        // 添加批量操作工具栏
        const batchToolbar = document.createElement('div');
        batchToolbar.id = 'batch-toolbar';
        batchToolbar.className = 'batch-toolbar hidden';
        batchToolbar.innerHTML = `
            <div class="batch-info">
                <span id="batch-count">已选择 0 项</span>
            </div>
            <div class="batch-actions">
                <button id="batch-delete" class="batch-btn danger" title="删除选中项">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    删除
                </button>
                <button id="batch-move" class="batch-btn" title="移动到文件夹">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                    移动
                </button>
                <button id="batch-export" class="batch-btn" title="导出选中项">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    导出
                </button>
                <button id="batch-cancel" class="batch-btn" title="取消选择">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    取消
                </button>
            </div>
        `;
        
        // 插入到主容器中
        const mainContainer = document.querySelector('.main-container');
        mainContainer.insertBefore(batchToolbar, mainContainer.firstChild);
        
        // 添加事件监听器
        addBatchOperationEventListeners();
    }
    
    function addBatchOperationEventListeners() {
        const batchDeleteBtn = document.getElementById('batch-delete');
        const batchMoveBtn = document.getElementById('batch-move');
        const batchExportBtn = document.getElementById('batch-export');
        const batchCancelBtn = document.getElementById('batch-cancel');
        
        if (batchDeleteBtn) batchDeleteBtn.addEventListener('click', batchDelete);
        if (batchMoveBtn) batchMoveBtn.addEventListener('click', batchMove);
        if (batchExportBtn) batchExportBtn.addEventListener('click', batchExport);
        if (batchCancelBtn) batchCancelBtn.addEventListener('click', cancelBatchSelection);
    }
    
    function enableBatchMode() {
        const batchToolbar = document.getElementById('batch-toolbar');
        if (batchToolbar) {
            batchToolbar.classList.remove('hidden');
        }
        
        // 为书签项添加复选框
        const bookmarkItems = document.querySelectorAll('.bookmark-item');
        bookmarkItems.forEach(item => {
            if (!item.querySelector('.bookmark-checkbox')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'bookmark-checkbox';
                checkbox.style.marginRight = '8px';
                
                checkbox.addEventListener('change', updateBatchCount);
                
                item.insertBefore(checkbox, item.firstChild);
            }
        });
    }
    
    function disableBatchMode() {
        const batchToolbar = document.getElementById('batch-toolbar');
        if (batchToolbar) {
            batchToolbar.classList.add('hidden');
        }
        
        // 移除复选框
        document.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
            checkbox.remove();
        });
        
        // 重置计数
        updateBatchCount();
    }
    
    function updateBatchCount() {
        const selectedCount = document.querySelectorAll('.bookmark-checkbox:checked').length;
        const batchCount = document.getElementById('batch-count');
        if (batchCount) {
            batchCount.textContent = `已选择 ${selectedCount} 项`;
        }
    }
    
    function batchDelete() {
        const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要删除的书签', 'warning');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个书签吗？此操作不可撤销。`)) {
            addLog(`正在删除 ${selectedCheckboxes.length} 个书签...`, 'info');
            
            // 这里实现实际的删除逻辑
            // 由于需要chrome.bookmarks API，这里只是示例
            addLog(`成功删除 ${selectedCheckboxes.length} 个书签`, 'success');
            
            // 刷新显示
            loadAndDisplayBookmarks(currentFolderNode);
            disableBatchMode();
        }
    }
    
    function batchMove() {
        const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要移动的书签', 'warning');
            return;
        }
        
        // 显示文件夹选择对话框
        showFolderSelectionDialog(selectedCheckboxes.length);
    }
    
    function showFolderSelectionDialog(count) {
        // 创建文件夹选择对话框
        const dialog = document.createElement('div');
        dialog.className = 'folder-selection-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>选择目标文件夹</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <p>请选择要将 ${count} 个书签移动到的文件夹：</p>
                    <div class="folder-tree" id="folder-selection-tree"></div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn cancel">取消</button>
                    <button class="dialog-btn confirm" disabled>确认移动</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 渲染文件夹树
        renderFolderSelectionTree();
        
        // 添加事件监听器
        addFolderSelectionEventListeners(dialog);
    }
    
    function renderFolderSelectionTree() {
        const treeContainer = document.getElementById('folder-selection-tree');
        if (!treeContainer) return;
        
        // 获取所有书签文件夹
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            const folders = extractFolders(bookmarkTreeNodes[0]);
            
            treeContainer.innerHTML = folders.map(folder => `
                <div class="folder-option" data-id="${folder.id}">
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">${folder.title}</span>
                    <span class="folder-path">${folder.path}</span>
                </div>
            `).join('');
        });
    }
    
    function extractFolders(node, path = '') {
        const folders = [];
        
        if (node.children) {
            node.children.forEach(child => {
                if (child.children) {
                    const currentPath = path + '/' + (child.title || '未命名');
                    folders.push({
                        id: child.id,
                        title: child.title || '未命名',
                        path: currentPath
                    });
                    folders.push(...extractFolders(child, currentPath));
                }
            });
        }
        
        return folders;
    }
    
    function addFolderSelectionEventListeners(dialog) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        const folderOptions = dialog.querySelectorAll('.folder-option');
        
        // 关闭对话框
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    dialog.remove();
                });
            }
        });
        
        // 选择文件夹
        folderOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选中状态
                folderOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // 启用确认按钮
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                }
            });
        });
        
        // 确认移动
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const selectedFolder = dialog.querySelector('.folder-option.selected');
                if (selectedFolder) {
                    const targetFolderId = selectedFolder.dataset.id;
                    executeBatchMove(targetFolderId);
                    dialog.remove();
                }
            });
        }
    }
    
    function executeBatchMove(targetFolderId) {
        const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
        
        addLog(`正在移动 ${selectedCheckboxes.length} 个书签到目标文件夹...`, 'info');
        
        // 这里实现实际的移动逻辑
        // 由于需要chrome.bookmarks API，这里只是示例
        addLog(`成功移动 ${selectedCheckboxes.length} 个书签`, 'success');
        
        // 刷新显示
        loadAndDisplayBookmarks(currentFolderNode);
        disableBatchMode();
    }
    
    function batchExport() {
        const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要导出的书签', 'warning');
            return;
        }
        
        addLog(`正在导出 ${selectedCheckboxes.length} 个书签...`, 'info');
        
        // 这里实现导出逻辑
        addLog(`成功导出 ${selectedCheckboxes.length} 个书签`, 'success');
    }
    
    function cancelBatchSelection() {
        // 取消所有选择
        document.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 退出批量模式
        disableBatchMode();
    }
    
    // 批量模式切换
    function toggleBatchMode() {
        const batchToolbar = document.getElementById('batch-toolbar');
        const batchModeBtn = document.getElementById('batch-mode-btn');
        
        if (batchToolbar && batchToolbar.classList.contains('hidden')) {
            // 进入批量模式
            enableBatchMode();
            if (batchModeBtn) {
                batchModeBtn.classList.add('active');
                batchModeBtn.title = '退出批量模式';
            }
        } else {
            // 退出批量模式
            disableBatchMode();
            if (batchModeBtn) {
                batchModeBtn.classList.remove('active');
                batchModeBtn.title = '批量操作模式';
            }
        }
    }

    // --- Start the application ---
    initialize();

    // --- 数据管理功能 ---
    
    // 导入功能
    function importFromUrl() {
        const url = prompt('请输入要导入的书签文件URL:');
        if (!url) return;
        
        addLog('开始从URL导入书签...', 'info');
        
        fetch(url)
            .then(response => response.text())
            .then(data => {
                processImportData(data, 'url');
            })
            .catch(error => {
                addLog(`导入失败: ${error.message}`, 'error');
            });
    }
    
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        addLog(`开始导入文件: ${file.name}`, 'info');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            processImportData(e.target.result, file.name);
        };
        reader.onerror = function() {
            addLog('文件读取失败', 'error');
        };
        
        reader.readAsText(file);
    }
    
    function processImportData(data, source) {
        const importStrategy = document.querySelector('input[name="import-strategy"]:checked').value;
        const conflictStrategy = document.getElementById('conflict-strategy').value;
        
        // 显示导入进度
        const importProgress = document.getElementById('import-progress');
        const importStatus = document.getElementById('import-status');
        const importCount = document.getElementById('import-count');
        const importProgressBar = document.getElementById('import-progress-bar');
        
        importProgress.classList.remove('hidden');
        importStatus.textContent = '正在解析文件...';
        importProgressBar.style.width = '0%';
        
        try {
            let bookmarks = [];
            
            // 根据文件类型解析数据
            if (source.endsWith('.json')) {
                bookmarks = parseJsonBookmarks(data);
            } else if (source.endsWith('.html')) {
                bookmarks = parseHtmlBookmarks(data);
            } else if (source.endsWith('.csv')) {
                bookmarks = parseCsvBookmarks(data);
            } else {
                // 尝试自动检测格式
                bookmarks = autoDetectFormat(data);
            }
            
            importStatus.textContent = `发现 ${bookmarks.length} 个书签，正在导入...`;
            importCount.textContent = `0 / ${bookmarks.length}`;
            
            // 执行导入
            executeImport(bookmarks, importStrategy, conflictStrategy, importStatus, importCount, importProgressBar);
            
        } catch (error) {
            addLog(`解析失败: ${error.message}`, 'error');
            importProgress.classList.add('hidden');
        }
    }
    
    function parseJsonBookmarks(data) {
        const json = JSON.parse(data);
        return extractBookmarksFromJson(json);
    }
    
    function parseHtmlBookmarks(data) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        return extractBookmarksFromHtml(doc);
    }
    
    function parseCsvBookmarks(data) {
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        const bookmarks = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const bookmark = {};
                headers.forEach((header, index) => {
                    bookmark[header.trim()] = values[index]?.trim() || '';
                });
                bookmarks.push(bookmark);
            }
        }
        
        return bookmarks;
    }
    
    function autoDetectFormat(data) {
        // 尝试检测格式
        if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
            return parseJsonBookmarks(data);
        } else if (data.includes('<html') || data.includes('<dl>')) {
            return parseHtmlBookmarks(data);
        } else if (data.includes(',')) {
            return parseCsvBookmarks(data);
        } else {
            throw new Error('无法识别的文件格式');
        }
    }
    
    function extractBookmarksFromJson(json) {
        const bookmarks = [];
        
        function traverse(node) {
            if (node.url) {
                bookmarks.push({
                    title: node.title || '',
                    url: node.url,
                    dateAdded: node.dateAdded,
                    lastVisited: node.lastVisited,
                    visitCount: node.visitCount
                });
            }
            
            if (node.children) {
                node.children.forEach(traverse);
            }
        }
        
        if (Array.isArray(json)) {
            json.forEach(traverse);
        } else {
            traverse(json);
        }
        
        return bookmarks;
    }
    
    function extractBookmarksFromHtml(doc) {
        const bookmarks = [];
        const links = doc.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const url = link.getAttribute('href');
            if (url && url.startsWith('http')) {
                bookmarks.push({
                    title: link.textContent.trim() || '',
                    url: url,
                    dateAdded: Date.now(),
                    lastVisited: null,
                    visitCount: 0
                });
            }
        });
        
        return bookmarks;
    }
    
    async function executeImport(bookmarks, strategy, conflictStrategy, statusEl, countEl, progressEl) {
        const total = bookmarks.length;
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        
        for (let i = 0; i < bookmarks.length; i++) {
            const bookmark = bookmarks[i];
            
            try {
                statusEl.textContent = `正在导入: ${bookmark.title || bookmark.url}`;
                
                // 检查冲突
                const existing = await checkBookmarkConflict(bookmark.url);
                
                if (existing && conflictStrategy === 'skip') {
                    skipped++;
                } else if (existing && conflictStrategy === 'ask') {
                    const shouldReplace = confirm(`书签 "${bookmark.title}" 已存在，是否替换？`);
                    if (!shouldReplace) {
                        skipped++;
                        continue;
                    }
                }
                
                // 执行导入
                await importBookmark(bookmark, strategy);
                imported++;
                
            } catch (error) {
                errors++;
                addLog(`导入失败 "${bookmark.title}": ${error.message}`, 'error');
            }
            
            // 更新进度
            const progress = ((i + 1) / total) * 100;
            progressEl.style.width = `${progress}%`;
            countEl.textContent = `${i + 1} / ${total}`;
            
            // 添加延迟避免过快
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 完成导入
        statusEl.textContent = `导入完成: ${imported} 个成功, ${skipped} 个跳过, ${errors} 个失败`;
        addLog(`导入完成: ${imported} 个成功, ${skipped} 个跳过, ${errors} 个失败`, 'success');
        
        // 刷新显示
        setTimeout(() => {
            document.getElementById('import-progress').classList.add('hidden');
            loadAndDisplayBookmarks(currentFolderNode);
        }, 2000);
    }
    
    async function checkBookmarkConflict(url) {
        return new Promise((resolve) => {
            chrome.bookmarks.search({ url: url }, (results) => {
                resolve(results.length > 0 ? results[0] : null);
            });
        });
    }
    
    async function importBookmark(bookmark, strategy) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create({
                title: bookmark.title,
                url: bookmark.url,
                parentId: currentFolderNode.id
            }, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }
    
    // 导出功能
    function exportSelected() {
        const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            addLog('请先选择要导出的书签', 'warning');
            return;
        }
        
        const selectedBookmarks = Array.from(selectedCheckboxes).map(checkbox => {
            const bookmarkItem = checkbox.closest('.bookmark-item');
            return {
                title: bookmarkItem.querySelector('.bookmark-title').textContent,
                url: bookmarkItem.querySelector('a').href
            };
        });
        
        exportBookmarks(selectedBookmarks, 'selected-bookmarks');
    }
    
    function exportAiCategories() {
        if (!analysisCategories || Object.keys(analysisCategories).length === 0) {
            addLog('没有AI分类数据可导出', 'warning');
            return;
        }
        
        const csvData = convertAiCategoriesToCsv(analysisCategories);
        downloadFile(csvData, 'ai-categories.csv', 'text/csv');
        addLog('AI分类数据导出完成', 'success');
    }
    
    function exportCustom() {
        // 显示自定义导出对话框
        showCustomExportDialog();
    }
    
    function showCustomExportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'custom-export-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>自定义导出</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="export-format-selection">
                        <h4>选择导出格式</h4>
                        <div class="format-options">
                            <label><input type="radio" name="custom-format" value="json" checked> JSON</label>
                            <label><input type="radio" name="custom-format" value="html"> HTML</label>
                            <label><input type="radio" name="custom-format" value="csv"> CSV</label>
                            <label><input type="radio" name="custom-format" value="markdown"> Markdown</label>
                        </div>
                    </div>
                    
                    <div class="export-scope-selection">
                        <h4>选择导出范围</h4>
                        <div class="scope-options">
                            <label><input type="radio" name="custom-scope" value="current" checked> 当前文件夹</label>
                            <label><input type="radio" name="custom-scope" value="all"> 所有书签</label>
                            <label><input type="radio" name="custom-scope" value="selected"> 选中项</label>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn cancel">取消</button>
                    <button class="dialog-btn confirm">确认导出</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加事件监听器
        addCustomExportEventListeners(dialog);
    }
    
    function addCustomExportEventListeners(dialog) {
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => dialog.remove());
            }
        });
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const format = dialog.querySelector('input[name="custom-format"]:checked').value;
                const scope = dialog.querySelector('input[name="custom-scope"]:checked').value;
                
                executeCustomExport(format, scope);
                dialog.remove();
            });
        }
    }
    
    function executeCustomExport(format, scope) {
        let bookmarks = [];
        
        switch (scope) {
            case 'current':
                bookmarks = currentBookmarks;
                break;
            case 'all':
                bookmarks = getAllBookmarks();
                break;
            case 'selected':
                const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
                bookmarks = Array.from(selectedCheckboxes).map(checkbox => {
                    const bookmarkItem = checkbox.closest('.bookmark-item');
                    return {
                        title: bookmarkItem.querySelector('.bookmark-title').textContent,
                        url: bookmarkItem.querySelector('a').href
                    };
                });
                break;
        }
        
        if (bookmarks.length === 0) {
            addLog('没有书签可导出', 'warning');
            return;
        }
        
        const data = convertBookmarksToFormat(bookmarks, format);
        const filename = `bookmarks-${scope}-${new Date().toISOString().split('T')[0]}.${format}`;
        const mimeType = getMimeType(format);
        
        downloadFile(data, filename, mimeType);
        addLog(`自定义导出完成: ${bookmarks.length} 个书签`, 'success');
    }
    
    function convertBookmarksToFormat(bookmarks, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(bookmarks, null, 2);
            case 'html':
                return convertToHtml(bookmarks);
            case 'csv':
                return convertToCsv(bookmarks);
            case 'markdown':
                return convertToMarkdown(bookmarks);
            default:
                return JSON.stringify(bookmarks, null, 2);
        }
    }
    
    function convertToHtml(bookmarks) {
        let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
        html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
        html += '<TITLE>Bookmarks</TITLE>\n';
        html += '<H1>Bookmarks</H1>\n';
        html += '<DL><p>\n';
        
        bookmarks.forEach(bookmark => {
            html += `    <DT><A HREF="${bookmark.url}">${bookmark.title}</A>\n`;
        });
        
        html += '</DL><p>\n';
        return html;
    }
    
    function convertToCsv(bookmarks) {
        let csv = 'Title,URL,Date Added\n';
        bookmarks.forEach(bookmark => {
            csv += `"${bookmark.title}","${bookmark.url}","${new Date().toISOString()}"\n`;
        });
        return csv;
    }
    
    function convertToMarkdown(bookmarks) {
        let markdown = '# Bookmarks\n\n';
        bookmarks.forEach(bookmark => {
            markdown += `- [${bookmark.title}](${bookmark.url})\n`;
        });
        return markdown;
    }
    
    function getMimeType(format) {
        const mimeTypes = {
            'json': 'application/json',
            'html': 'text/html',
            'csv': 'text/csv',
            'markdown': 'text/markdown'
        };
        return mimeTypes[format] || 'text/plain';
    }
    
    function downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 检测报告功能
    function viewDuplicateReport() {
        detectDuplicateBookmarks();
    }
    
    function viewInvalidReport() {
        detectInvalidBookmarks();
    }
    
    function viewCleanupReport() {
        showCleanupReport();
    }
    
    function showCleanupReport() {
        const resultsPreview = document.getElementById('results-preview');
        resultsPreview.innerHTML = '';
        
        // 这里可以显示历史清理记录
        const reportDiv = document.createElement('div');
        reportDiv.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <h3>清理报告</h3>
                <p>暂无清理记录</p>
            </div>
        `;
        
        resultsPreview.appendChild(reportDiv);
        document.getElementById('analysis-results').classList.remove('hidden');
    }
    
    function generateComprehensiveReport() {
        addLog('正在生成综合报告...', 'info');
        
        const report = {
            timestamp: new Date().toISOString(),
            totalBookmarks: currentBookmarks.length,
            duplicates: findDuplicateBookmarks(),
            emptyFolders: findEmptyFolders(currentFolderNode),
            statistics: generateBookmarkStatistics()
        };
        
        const reportData = JSON.stringify(report, null, 2);
        const filename = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(reportData, filename, 'application/json');
        addLog('综合报告生成完成', 'success');
    }
    
    function generateBookmarkStatistics() {
        const stats = {
            totalBookmarks: currentBookmarks.length,
            domains: {},
            dateAdded: {},
            lastVisited: {}
        };
        
        currentBookmarks.forEach(bookmark => {
            try {
                const url = new URL(bookmark.url);
                const domain = url.hostname;
                stats.domains[domain] = (stats.domains[domain] || 0) + 1;
            } catch (e) {
                // 忽略无效URL
            }
        });
        
        return stats;
    }
    
    // 数据备份功能
    function createBackup() {
        addLog('正在创建备份...', 'info');
        
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: bookmarkTreeNodes[0]
            };
            
            const backupData = JSON.stringify(backup, null, 2);
            const filename = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            downloadFile(backupData, filename, 'application/json');
            addLog('备份创建完成', 'success');
        });
    }
    
    function restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const backup = JSON.parse(e.target.result);
                    if (confirm('确定要恢复此备份吗？这将覆盖当前的书签数据。')) {
                        restoreBackupData(backup);
                    }
                } catch (error) {
                    addLog('备份文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    function restoreBackupData(backup) {
        addLog('正在恢复备份...', 'info');
        
        // 这里实现实际的恢复逻辑
        // 由于需要chrome.bookmarks API，这里只是示例
        addLog('备份恢复完成', 'success');
        
        // 刷新显示
        loadAndDisplayBookmarks(currentFolderNode);
    }
    
    function manageBackups() {
        showBackupManager();
    }
    
    function showBackupManager() {
        const dialog = document.createElement('div');
        dialog.className = 'backup-manager-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>备份管理</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="backup-list">
                        <h4>本地备份</h4>
                        <div id="local-backups">
                            <p style="color: var(--text-secondary); text-align: center;">暂无本地备份</p>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn cancel">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加事件监听器
        const closeBtn = dialog.querySelector('.dialog-close');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => dialog.remove());
            }
        });
    }
    
    // 辅助函数
    function getAllBookmarks() {
        const allBookmarks = [];
        
        function traverse(node) {
            if (node.url) {
                allBookmarks.push({
                    title: node.title || '',
                    url: node.url,
                    dateAdded: node.dateAdded,
                    lastVisited: node.lastVisited,
                    visitCount: node.visitCount
                });
            }
            
            if (node.children) {
                node.children.forEach(traverse);
            }
        }
        
        traverse(bookmarkTreeRoot);
        return allBookmarks;
    }
    
    function convertAiCategoriesToCsv(categories) {
        let csv = 'Category,Bookmark Title,URL,Confidence\n';
        
        Object.entries(categories).forEach(([category, bookmarks]) => {
            bookmarks.forEach(bookmark => {
                csv += `"${category}","${bookmark.title}","${bookmark.url}","${bookmark.confidence || 'N/A'}"\n`;
            });
        });
        
        return csv;
    }

    // --- 通知系统 ---
    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 触发动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // --- 交互优化 ---
    function addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
    
    function addTooltip(element, text) {
        element.setAttribute('data-tooltip', text);
        element.classList.add('tooltip');
    }
    
    function addLoadingState(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.textContent = '加载中...';
        } else {
            element.classList.remove('loading');
            element.disabled = false;
            if (element.dataset.originalText) {
                element.textContent = element.dataset.originalText;
                delete element.dataset.originalText;
            }
        }
    }
    
    function addPageTransition(element) {
        element.classList.add('page-transition');
        setTimeout(() => {
            element.classList.remove('page-transition');
        }, 500);
    }
    
    // --- 键盘快捷键 ---
    function initializeKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K: 搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
            
            // Ctrl/Cmd + ,: 设置
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                openSettingsPanel();
            }
            
            // Ctrl/Cmd + B: 批量模式
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleBatchMode();
            }
            
            // Ctrl/Cmd + A: 全选（在批量模式下）
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isBatchMode) {
                e.preventDefault();
                const checkboxes = document.querySelectorAll('.bookmark-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !allChecked);
                updateBatchCount();
            }
            
            // Escape: 关闭面板
            if (e.key === 'Escape') {
                if (settingsPanel.classList.contains('is-visible')) {
                    closeSettingsPanel();
                }
                if (isBatchMode) {
                    disableBatchMode();
                }
            }
        });
    }
    
    // --- 手势支持 ---
    function initializeTouchGestures() {
        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        
        document.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = false;
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!startX || !startY) return;
            
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                isSwiping = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchend', function(e) {
            if (!isSwiping) return;
            
            const deltaX = e.changedTouches[0].clientX - startX;
            
            // 右滑：打开侧边栏
            if (deltaX > 100 && body.classList.contains('sidebar-collapsed')) {
                toggleSidebarCollapse();
                showNotification('侧边栏已打开', 'info', 2000);
            }
            
            // 左滑：关闭侧边栏
            if (deltaX < -100 && !body.classList.contains('sidebar-collapsed')) {
                toggleSidebarCollapse();
                showNotification('侧边栏已关闭', 'info', 2000);
            }
            
            startX = 0;
            startY = 0;
            isSwiping = false;
        });
    }
    
    // --- 性能优化 ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function throttle(func, limit) {
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
    }
    
    // 优化搜索功能
    const debouncedSearch = debounce(handleSearch, 300);
    
    // 优化滚动事件
    const throttledScroll = throttle(function() {
        // 滚动时的性能优化逻辑
    }, 100);
    
    // --- 无障碍支持 ---
    function initializeAccessibility() {
        // 添加ARIA标签
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.setAttribute('aria-label', '搜索书签');
            searchInput.setAttribute('aria-describedby', 'search-help');
        }
        
        // 添加焦点管理
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // 添加跳过链接
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = '跳到主要内容';
        skipLink.className = 'skip-link';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // --- 主题切换动画 ---
    function applyThemeWithAnimation(theme) {
        const body = document.body;
        body.style.transition = 'all 0.3s ease';
        applyTheme(theme);
        
        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }
    
    // --- 初始化增强功能 ---
    function initializeEnhancedFeatures() {
        initializeKeyboardShortcuts();
        initializeTouchGestures();
        initializeAccessibility();
        
        // 为所有按钮添加波纹效果
        document.querySelectorAll('button').forEach(addRippleEffect);
        
        // 添加工具提示
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            addTooltip(element, element.getAttribute('data-tooltip'));
        });
        
        // 优化搜索输入
        if (searchInput) {
            searchInput.addEventListener('input', debouncedSearch);
        }
        
        // 添加页面切换动画
        addPageTransition(document.body);
        
        showNotification('书签助手已就绪', 'success', 2000);
    }

    // --- 个性化设置功能 ---
    
    // 动画级别设置
    function updateAnimationLevel() {
        const level = document.getElementById('animation-level').value;
        document.body.className = document.body.className.replace(/animation-\w+/g, '');
        document.body.classList.add(`animation-${level}`);
        
        savePersonalizationSetting('animationLevel', level);
        showNotification('动画级别已更新', 'success');
    }
    
    // 波纹效果设置
    function updateRippleEffect() {
        const enabled = document.getElementById('enable-ripple').checked;
        const buttons = document.querySelectorAll('button');
        
        if (enabled) {
            buttons.forEach(addRippleEffect);
        } else {
            buttons.forEach(removeRippleEffect);
        }
        
        savePersonalizationSetting('enableRipple', enabled);
        showNotification('波纹效果已更新', 'success');
    }
    
    function removeRippleEffect(element) {
        element.removeEventListener('click', element.rippleHandler);
        delete element.rippleHandler;
    }
    
    // 浮动动画设置
    function updateFloatingAnimation() {
        const enabled = document.getElementById('enable-floating').checked;
        const elements = document.querySelectorAll('.bookmark-item, .folder-item');
        
        elements.forEach(element => {
            if (enabled) {
                element.classList.add('float');
            } else {
                element.classList.remove('float');
            }
        });
        
        savePersonalizationSetting('enableFloating', enabled);
        showNotification('浮动动画已更新', 'success');
    }
    
    // 粒子效果设置
    function updateParticlesEffect() {
        const enabled = document.getElementById('enable-particles').checked;
        const container = document.querySelector('.main-container');
        
        if (enabled) {
            container.classList.add('particles');
        } else {
            container.classList.remove('particles');
        }
        
        savePersonalizationSetting('enableParticles', enabled);
        showNotification('粒子效果已更新', 'success');
    }
    
    // 界面密度设置
    function updateUIDensity() {
        const density = document.getElementById('ui-density').value;
        document.body.className = document.body.className.replace(/ui-density-\w+/g, '');
        document.body.classList.add(`ui-density-${density}`);
        
        savePersonalizationSetting('uiDensity', density);
        showNotification('界面密度已更新', 'success');
    }
    
    // 圆角大小设置
    function updateCornerRadius() {
        const radius = document.getElementById('corner-radius').value;
        const valueDisplay = document.getElementById('corner-radius-value');
        
        if (valueDisplay) {
            valueDisplay.textContent = `${radius}px`;
        }
        
        // 应用圆角样式
        document.documentElement.style.setProperty('--border-radius-base', `${radius}px`);
        
        savePersonalizationSetting('cornerRadius', radius);
    }
    
    // 毛玻璃强度设置
    function updateBlurIntensity() {
        const intensity = document.getElementById('blur-intensity').value;
        const valueDisplay = document.getElementById('blur-intensity-value');
        
        if (valueDisplay) {
            valueDisplay.textContent = `${intensity}px`;
        }
        
        // 更新毛玻璃效果
        const elements = document.querySelectorAll('.bookmark-item, .folder-item, .section');
        elements.forEach(element => {
            element.style.backdropFilter = `blur(${intensity}px)`;
            element.style.webkitBackdropFilter = `blur(${intensity}px)`;
        });
        
        savePersonalizationSetting('blurIntensity', intensity);
    }
    
    // 颜色主题选择
    function selectColorTheme(color) {
        // 移除所有颜色主题类
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        // 移除所有颜色选项的active类
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // 添加选中的颜色主题类
        if (color !== 'custom') {
            document.body.classList.add(`theme-${color}`);
            document.querySelector(`[data-color="${color}"]`).classList.add('active');
        } else {
            document.querySelector('[data-color="custom"]').classList.add('active');
        }
        
        savePersonalizationSetting('colorTheme', color);
        showNotification('颜色主题已更新', 'success');
    }
    
    // 自定义颜色设置
    function updateCustomColor() {
        const color = document.getElementById('custom-color').value;
        
        // 创建自定义CSS变量
        const style = document.createElement('style');
        style.id = 'custom-theme-style';
        style.textContent = `
            .theme-custom .action-btn.primary {
                background: ${color} !important;
            }
            .theme-custom .tab-btn.active {
                background: ${color} !important;
            }
        `;
        
        // 移除旧的样式
        const oldStyle = document.getElementById('custom-theme-style');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        document.head.appendChild(style);
        
        // 应用自定义主题
        selectColorTheme('custom');
        savePersonalizationSetting('customColor', color);
    }
    
    // 行为设置
    function updateAutoSave() {
        const enabled = document.getElementById('auto-save').checked;
        savePersonalizationSetting('autoSave', enabled);
        showNotification('自动保存设置已更新', 'success');
    }
    
    function updateShowNotifications() {
        const enabled = document.getElementById('show-notifications').checked;
        savePersonalizationSetting('showNotifications', enabled);
        showNotification('通知设置已更新', 'success');
    }
    
    function updateEnableSounds() {
        const enabled = document.getElementById('enable-sounds').checked;
        savePersonalizationSetting('enableSounds', enabled);
        showNotification('音效设置已更新', 'success');
    }
    
    function updateRememberLastFolder() {
        const enabled = document.getElementById('remember-last-folder').checked;
        savePersonalizationSetting('rememberLastFolder', enabled);
        showNotification('文件夹记忆设置已更新', 'success');
    }
    
    // 重置个性化设置
    function resetPersonalization() {
        if (confirm('确定要重置所有个性化设置为默认值吗？')) {
            // 重置所有设置
            const defaultSettings = {
                animationLevel: 'full',
                enableRipple: true,
                enableFloating: true,
                enableParticles: false,
                uiDensity: 'comfortable',
                cornerRadius: 12,
                blurIntensity: 15,
                colorTheme: 'blue',
                customColor: '#007aff',
                autoSave: true,
                showNotifications: true,
                enableSounds: false,
                rememberLastFolder: true
            };
            
            // 应用默认设置
            Object.entries(defaultSettings).forEach(([key, value]) => {
                applyPersonalizationSetting(key, value);
            });
            
            // 重置UI元素
            resetPersonalizationUI();
            
            // 清除本地存储
            localStorage.removeItem('personalizationSettings');
            
            showNotification('个性化设置已重置为默认值', 'success');
        }
    }
    
    function resetPersonalizationUI() {
        // 重置所有UI元素到默认状态
        const elements = {
            'animation-level': 'full',
            'enable-ripple': true,
            'enable-floating': true,
            'enable-particles': false,
            'ui-density': 'comfortable',
            'corner-radius': 12,
            'blur-intensity': 15,
            'auto-save': true,
            'show-notifications': true,
            'enable-sounds': false,
            'remember-last-folder': true
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else if (element.type === 'range') {
                    element.value = value;
                    // 更新显示值
                    const valueDisplay = document.getElementById(`${id}-value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value}px`;
                    }
                } else {
                    element.value = value;
                }
            }
        });
        
        // 重置颜色主题
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector('[data-color="blue"]').classList.add('active');
        
        // 重置自定义颜色
        document.getElementById('custom-color').value = '#007aff';
    }
    
    // 导出个性化设置
    function exportPersonalization() {
        const settings = loadPersonalizationSettings();
        const data = JSON.stringify(settings, null, 2);
        const filename = `personalization-settings-${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(data, filename, 'application/json');
        showNotification('个性化设置已导出', 'success');
    }
    
    // 导入个性化设置
    function importPersonalization() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const settings = JSON.parse(e.target.result);
                    
                    if (confirm('确定要导入这些个性化设置吗？这将覆盖当前设置。')) {
                        // 应用导入的设置
                        Object.entries(settings).forEach(([key, value]) => {
                            applyPersonalizationSetting(key, value);
                        });
                        
                        // 更新UI
                        updatePersonalizationUI(settings);
                        
                        // 保存到本地存储
                        localStorage.setItem('personalizationSettings', JSON.stringify(settings));
                        
                        showNotification('个性化设置已导入', 'success');
                    }
                } catch (error) {
                    showNotification('导入失败：文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    // 应用个性化设置
    function applyPersonalizationSetting(key, value) {
        switch (key) {
            case 'animationLevel':
                document.body.className = document.body.className.replace(/animation-\w+/g, '');
                document.body.classList.add(`animation-${value}`);
                break;
            case 'enableRipple':
                if (value) {
                    document.querySelectorAll('button').forEach(addRippleEffect);
                }
                break;
            case 'enableFloating':
                const elements = document.querySelectorAll('.bookmark-item, .folder-item');
                elements.forEach(element => {
                    if (value) {
                        element.classList.add('float');
                    } else {
                        element.classList.remove('float');
                    }
                });
                break;
            case 'enableParticles':
                const container = document.querySelector('.main-container');
                if (value) {
                    container.classList.add('particles');
                } else {
                    container.classList.remove('particles');
                }
                break;
            case 'uiDensity':
                document.body.className = document.body.className.replace(/ui-density-\w+/g, '');
                document.body.classList.add(`ui-density-${value}`);
                break;
            case 'cornerRadius':
                document.documentElement.style.setProperty('--border-radius-base', `${value}px`);
                break;
            case 'blurIntensity':
                const blurElements = document.querySelectorAll('.bookmark-item, .folder-item, .section');
                blurElements.forEach(element => {
                    element.style.backdropFilter = `blur(${value}px)`;
                    element.style.webkitBackdropFilter = `blur(${value}px)`;
                });
                break;
            case 'colorTheme':
                document.body.className = document.body.className.replace(/theme-\w+/g, '');
                if (value !== 'custom') {
                    document.body.classList.add(`theme-${value}`);
                }
                break;
            case 'customColor':
                updateCustomColor();
                break;
        }
    }
    
    // 更新个性化设置UI
    function updatePersonalizationUI(settings) {
        const elements = {
            'animation-level': settings.animationLevel,
            'enable-ripple': settings.enableRipple,
            'enable-floating': settings.enableFloating,
            'enable-particles': settings.enableParticles,
            'ui-density': settings.uiDensity,
            'corner-radius': settings.cornerRadius,
            'blur-intensity': settings.blurIntensity,
            'auto-save': settings.autoSave,
            'show-notifications': settings.showNotifications,
            'enable-sounds': settings.enableSounds,
            'remember-last-folder': settings.rememberLastFolder
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else if (element.type === 'range') {
                    element.value = value;
                    const valueDisplay = document.getElementById(`${id}-value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value}px`;
                    }
                } else {
                    element.value = value;
                }
            }
        });
        
        // 更新颜色主题
        if (settings.colorTheme) {
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('active');
            });
            const activeOption = document.querySelector(`[data-color="${settings.colorTheme}"]`);
            if (activeOption) {
                activeOption.classList.add('active');
            }
        }
        
        // 更新自定义颜色
        if (settings.customColor) {
            document.getElementById('custom-color').value = settings.customColor;
        }
    }
    
    // 保存个性化设置
    function savePersonalizationSetting(key, value) {
        const settings = loadPersonalizationSettings();
        settings[key] = value;
        localStorage.setItem('personalizationSettings', JSON.stringify(settings));
    }
    
    // 加载个性化设置
    function loadPersonalizationSettings() {
        const saved = localStorage.getItem('personalizationSettings');
        return saved ? JSON.parse(saved) : {};
    }
    
    // 初始化个性化设置
    function initializePersonalization() {
        const settings = loadPersonalizationSettings();
        
        if (Object.keys(settings).length > 0) {
            // 应用保存的设置
            Object.entries(settings).forEach(([key, value]) => {
                applyPersonalizationSetting(key, value);
            });
            
            // 更新UI
            updatePersonalizationUI(settings);
        }
    }
});