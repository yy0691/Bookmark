// 详细分析页面 JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 详细分析页面初始化...');
    
    // --- URL参数处理 ---
    function handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        
        console.log('URL参数:', { section });
        
        if (section) {
            // 延迟执行，确保DOM完全加载
            setTimeout(() => {
                switchSection(section);
            }, 100);
        }
    }
    
    // --- 全局变量 ---
    let currentSection = 'wordcloud';
    let bookmarkData = null;
    let analysisResults = {};
    let visualizationData = {};
    
    // 特殊部分定义
    const specialSections = [
        'regenerate', 'analysis-log', 'analysis-results', 'export-csv', 
        'history', 'organize', 'batch-operations'
    ];
    
    // --- DOM 元素 ---
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const backBtn = document.getElementById('back-btn');
    
    // --- 初始化 ---
    function initialize() {
        loadBookmarkData();
        initializeEventListeners();
        updateStatistics();
        checkApiStatus();
        
        // 处理URL参数
        handleUrlParameters();
        
        console.log('✅ 详细分析页面初始化完成');
    }
    
    // 启动初始化
    initialize();
    
    // --- 事件监听器 ---
    function initializeEventListeners() {
        // 导航项点击事件
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                switchSection(section);
            });
        });
        
        // 顶部按钮事件
        if (refreshBtn) refreshBtn.addEventListener('click', refreshData);
        if (exportBtn) exportBtn.addEventListener('click', exportData);
        if (backBtn) backBtn.addEventListener('click', goBack);
        
        // 词云相关按钮
        const generateWordcloudBtn = document.getElementById('generate-wordcloud-btn');
        const exportWordcloudBtn = document.getElementById('export-wordcloud-btn');
        const refreshWordcloudBtn = document.getElementById('refresh-wordcloud-btn');
        
        if (generateWordcloudBtn) {
            generateWordcloudBtn.addEventListener('click', () => {
                // 复用visualization.js中的词云功能
                if (typeof window.generateWordcloud === 'function') {
                    window.generateWordcloud();
                } else {
                    showNotification('词云功能加载中...', 'info');
                }
            });
        }
        if (exportWordcloudBtn) {
            exportWordcloudBtn.addEventListener('click', () => {
                if (typeof window.exportWordcloud === 'function') {
                    window.exportWordcloud();
                } else {
                    showNotification('导出功能加载中...', 'info');
                }
            });
        }
        if (refreshWordcloudBtn) {
            refreshWordcloudBtn.addEventListener('click', () => {
                if (typeof window.refreshWordcloudData === 'function') {
                    window.refreshWordcloudData();
                } else {
                    showNotification('刷新功能加载中...', 'info');
                }
            });
        }
        
        // 树状图相关按钮
        const expandAllTreeBtn = document.getElementById('expand-all-tree-btn');
        const collapseAllTreeBtn = document.getElementById('collapse-all-tree-btn');
        const refreshTreeBtn = document.getElementById('refresh-tree-btn');
        
        if (expandAllTreeBtn) {
            expandAllTreeBtn.addEventListener('click', () => {
                if (typeof window.expandAllFolders === 'function') {
                    window.expandAllFolders(true);
                } else {
                    showNotification('展开功能加载中...', 'info');
                }
            });
        }
        if (collapseAllTreeBtn) {
            collapseAllTreeBtn.addEventListener('click', () => {
                if (typeof window.expandAllFolders === 'function') {
                    window.expandAllFolders(false);
                } else {
                    showNotification('折叠功能加载中...', 'info');
                }
            });
        }
        if (refreshTreeBtn) {
            refreshTreeBtn.addEventListener('click', () => {
                if (typeof window.generateTreeview === 'function') {
                    window.generateTreeview();
                } else {
                    showNotification('树状图功能加载中...', 'info');
                }
            });
        }
        
        // 图表相关按钮
        const generateChartsBtn = document.getElementById('generate-charts-btn');
        const exportChartsBtn = document.getElementById('export-charts-btn');
        const refreshChartsBtn = document.getElementById('refresh-charts-btn');
        
        if (generateChartsBtn) {
            generateChartsBtn.addEventListener('click', () => {
                if (typeof window.generateCharts === 'function') {
                    window.generateCharts();
                } else {
                    showNotification('图表功能加载中...', 'info');
                }
            });
        }
        if (exportChartsBtn) {
            exportChartsBtn.addEventListener('click', () => {
                if (typeof window.exportCharts === 'function') {
                    window.exportCharts();
                } else {
                    showNotification('导出功能加载中...', 'info');
                }
            });
        }
        if (refreshChartsBtn) {
            refreshChartsBtn.addEventListener('click', () => {
                if (typeof window.generateCharts === 'function') {
                    window.generateCharts();
                } else {
                    showNotification('图表功能加载中...', 'info');
                }
            });
        }
        
        // AI分析相关按钮 - 复用analyze.js中的功能
        const analyzeBookmarksBtn = document.getElementById('analyze-bookmarks-btn');
        const cancelAnalyzeBtn = document.getElementById('cancel-analyze-btn');
        const regenerateCategoriesBtn = document.getElementById('regenerate-categories-btn');
        const organizeBookmarksBtn = document.getElementById('organize-bookmarks-btn');
        const setupApiBtn = document.getElementById('setup-api-btn');
        const clearLogBtn = document.getElementById('clear-log-btn');
        const toggleLogBtn = document.getElementById('toggle-log-btn');
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const viewHistoryBtn = document.getElementById('view-history-btn');
        
        if (analyzeBookmarksBtn) analyzeBookmarksBtn.addEventListener('click', () => {
            if (typeof window.analyzeBookmarks === 'function') {
                window.analyzeBookmarks();
            } else {
                showNotification('AI分析功能加载中...', 'info');
            }
        });
        if (cancelAnalyzeBtn) cancelAnalyzeBtn.addEventListener('click', () => {
            if (typeof window.cancelAnalyze === 'function') {
                window.cancelAnalyze();
            } else {
                showNotification('取消功能加载中...', 'info');
            }
        });
        if (regenerateCategoriesBtn) regenerateCategoriesBtn.addEventListener('click', () => {
            if (typeof window.regenerateCategories === 'function') {
                window.regenerateCategories();
            } else {
                showNotification('重新生成功能加载中...', 'info');
            }
        });
        if (organizeBookmarksBtn) organizeBookmarksBtn.addEventListener('click', () => {
            if (typeof window.organizeBookmarks === 'function') {
                window.organizeBookmarks();
            } else {
                showNotification('整理功能加载中...', 'info');
            }
        });
        if (setupApiBtn) setupApiBtn.addEventListener('click', () => {
            if (typeof window.openOptions === 'function') {
                window.openOptions();
            } else {
                showNotification('设置功能加载中...', 'info');
            }
        });
        if (clearLogBtn) clearLogBtn.addEventListener('click', () => {
            if (typeof window.clearLog === 'function') {
                window.clearLog();
            } else {
                showNotification('清空日志功能加载中...', 'info');
            }
        });
        if (toggleLogBtn) toggleLogBtn.addEventListener('click', () => {
            if (typeof window.toggleLogVisibility === 'function') {
                window.toggleLogVisibility();
            } else {
                showNotification('日志显示功能加载中...', 'info');
            }
        });
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
            if (typeof window.exportBookmarks === 'function') {
                window.exportBookmarks();
            } else {
                showNotification('导出功能加载中...', 'info');
            }
        });
        if (viewHistoryBtn) viewHistoryBtn.addEventListener('click', () => {
            if (typeof window.openHistoryPage === 'function') {
                window.openHistoryPage();
            } else {
                showNotification('历史功能加载中...', 'info');
            }
        });
        
        // 书签管理器相关按钮 - 复用analyze.js中的功能
        const expandAllFoldersBtn = document.getElementById('expand-all-folders-btn');
        const collapseAllFoldersBtn = document.getElementById('collapse-all-folders-btn');
        const createFolderBtn = document.getElementById('create-folder-btn');
        const refreshManagerBtn = document.getElementById('refresh-manager-btn');
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const batchRenameBtn = document.getElementById('batch-rename-btn');
        const batchMoveBtn = document.getElementById('batch-move-btn');
        const batchExportBtn = document.getElementById('batch-export-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        
        if (expandAllFoldersBtn) expandAllFoldersBtn.addEventListener('click', () => {
            if (typeof window.expandAllFolders === 'function') {
                window.expandAllFolders(true);
            } else {
                showNotification('展开功能加载中...', 'info');
            }
        });
        if (collapseAllFoldersBtn) collapseAllFoldersBtn.addEventListener('click', () => {
            if (typeof window.expandAllFolders === 'function') {
                window.expandAllFolders(false);
            } else {
                showNotification('折叠功能加载中...', 'info');
            }
        });
        if (createFolderBtn) createFolderBtn.addEventListener('click', () => {
            if (typeof window.createNewFolder === 'function') {
                window.createNewFolder();
            } else {
                showNotification('创建文件夹功能加载中...', 'info');
            }
        });
        if (refreshManagerBtn) refreshManagerBtn.addEventListener('click', () => {
            if (typeof window.refreshBookmarkManager === 'function') {
                window.refreshBookmarkManager();
            } else {
                showNotification('刷新功能加载中...', 'info');
            }
        });
        if (batchDeleteBtn) batchDeleteBtn.addEventListener('click', () => {
            if (typeof window.batchDeleteItems === 'function') {
                window.batchDeleteItems();
            } else {
                showNotification('批量删除功能加载中...', 'info');
            }
        });
        if (batchRenameBtn) batchRenameBtn.addEventListener('click', () => {
            if (typeof window.batchRenameItems === 'function') {
                window.batchRenameItems();
            } else {
                showNotification('批量重命名功能加载中...', 'info');
            }
        });
        if (batchMoveBtn) batchMoveBtn.addEventListener('click', () => {
            if (typeof window.batchMoveItems === 'function') {
                window.batchMoveItems();
            } else {
                showNotification('批量移动功能加载中...', 'info');
            }
        });
        if (batchExportBtn) batchExportBtn.addEventListener('click', () => {
            if (typeof window.batchExportItems === 'function') {
                window.batchExportItems();
            } else {
                showNotification('批量导出功能加载中...', 'info');
            }
        });
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => {
            if (typeof window.selectAllBookmarks === 'function') {
                window.selectAllBookmarks(true);
            } else {
                showNotification('全选功能加载中...', 'info');
            }
        });
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => {
            if (typeof window.selectAllBookmarks === 'function') {
                window.selectAllBookmarks(false);
            } else {
                showNotification('取消全选功能加载中...', 'info');
            }
        });
        
        // 检测相关按钮 - 复用analyze.js中的功能
        const detectDuplicatesBtn = document.getElementById('detect-duplicates-btn');
        const removeDuplicatesBtn = document.getElementById('remove-duplicates-btn');
        const selectAllDuplicatesBtn = document.getElementById('select-all-duplicates-btn');
        const deselectAllDuplicatesBtn = document.getElementById('deselect-all-duplicates-btn');
        
        const detectInvalidBtn = document.getElementById('detect-invalid-btn');
        const removeInvalidBtn = document.getElementById('remove-invalid-btn');
        const selectAllInvalidBtn = document.getElementById('select-all-invalid-btn');
        const deselectAllInvalidBtn = document.getElementById('deselect-all-invalid-btn');
        
        const detectEmptyFoldersBtn = document.getElementById('detect-empty-folders-btn');
        const removeEmptyFoldersBtn = document.getElementById('remove-empty-folders-btn');
        const selectAllEmptyFoldersBtn = document.getElementById('select-all-empty-folders-btn');
        const deselectAllEmptyFoldersBtn = document.getElementById('deselect-all-empty-folders-btn');
        
        if (detectDuplicatesBtn) detectDuplicatesBtn.addEventListener('click', () => {
            if (typeof window.detectDuplicateBookmarks === 'function') {
                window.detectDuplicateBookmarks();
            } else {
                showNotification('重复检测功能加载中...', 'info');
            }
        });
        if (removeDuplicatesBtn) removeDuplicatesBtn.addEventListener('click', () => {
            if (typeof window.removeDuplicateBookmarks === 'function') {
                window.removeDuplicateBookmarks();
            } else {
                showNotification('移除重复功能加载中...', 'info');
            }
        });
        if (selectAllDuplicatesBtn) selectAllDuplicatesBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('duplicates', true);
            } else {
                showNotification('全选功能加载中...', 'info');
            }
        });
        if (deselectAllDuplicatesBtn) deselectAllDuplicatesBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('duplicates', false);
            } else {
                showNotification('取消全选功能加载中...', 'info');
            }
        });
        
        if (detectInvalidBtn) detectInvalidBtn.addEventListener('click', () => {
            if (typeof window.detectInvalidBookmarks === 'function') {
                window.detectInvalidBookmarks();
            } else {
                showNotification('失效检测功能加载中...', 'info');
            }
        });
        if (removeInvalidBtn) removeInvalidBtn.addEventListener('click', () => {
            if (typeof window.removeInvalidBookmarks === 'function') {
                window.removeInvalidBookmarks();
            } else {
                showNotification('删除失效功能加载中...', 'info');
            }
        });
        if (selectAllInvalidBtn) selectAllInvalidBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('invalid', true);
            } else {
                showNotification('全选功能加载中...', 'info');
            }
        });
        if (deselectAllInvalidBtn) deselectAllInvalidBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('invalid', false);
            } else {
                showNotification('取消全选功能加载中...', 'info');
            }
        });
        
        if (detectEmptyFoldersBtn) detectEmptyFoldersBtn.addEventListener('click', () => {
            if (typeof window.cleanupBookmarks === 'function') {
                window.cleanupBookmarks();
            } else {
                showNotification('空文件夹检测功能加载中...', 'info');
            }
        });
        if (removeEmptyFoldersBtn) removeEmptyFoldersBtn.addEventListener('click', () => {
            if (typeof window.removeEmptyFolders === 'function') {
                window.removeEmptyFolders();
            } else {
                showNotification('删除空文件夹功能加载中...', 'info');
            }
        });
        if (selectAllEmptyFoldersBtn) selectAllEmptyFoldersBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('empty-folders', true);
            } else {
                showNotification('全选功能加载中...', 'info');
            }
        });
        if (deselectAllEmptyFoldersBtn) deselectAllEmptyFoldersBtn.addEventListener('click', () => {
            if (typeof window.selectAllDetectionItems === 'function') {
                window.selectAllDetectionItems('empty-folders', false);
            } else {
                showNotification('取消全选功能加载中...', 'info');
            }
        });
        
        // 导入导出相关按钮 - 复用analyze.js中的功能
        const importFileBtn = document.getElementById('import-file-btn');
        const importUrlBtn = document.getElementById('import-url-btn');
        const importFileInput = document.getElementById('import-file-input');
        const exportBackupBtn = document.getElementById('export-backup-btn');
        const exportAiCategoriesBtn = document.getElementById('export-ai-categories-btn');
        const exportCustomBtn = document.getElementById('export-custom-btn');
        
        if (importFileBtn) importFileBtn.addEventListener('click', () => importFileInput.click());
        if (importUrlBtn) importUrlBtn.addEventListener('click', () => {
            if (typeof window.importFromUrl === 'function') {
                window.importFromUrl();
            } else {
                showNotification('URL导入功能加载中...', 'info');
            }
        });
        if (importFileInput) importFileInput.addEventListener('change', (event) => {
            if (typeof window.handleFileImport === 'function') {
                window.handleFileImport(event);
            } else {
                showNotification('文件导入功能加载中...', 'info');
            }
        });
        if (exportBackupBtn) exportBackupBtn.addEventListener('click', () => {
            if (typeof window.backupBookmarks === 'function') {
                window.backupBookmarks();
            } else {
                showNotification('备份功能加载中...', 'info');
            }
        });
        if (exportAiCategoriesBtn) exportAiCategoriesBtn.addEventListener('click', () => {
            if (typeof window.exportAiCategories === 'function') {
                window.exportAiCategories();
            } else {
                showNotification('AI分类导出功能加载中...', 'info');
            }
        });
        if (exportCustomBtn) exportCustomBtn.addEventListener('click', () => {
            if (typeof window.showCustomExportDialog === 'function') {
                window.showCustomExportDialog();
            } else {
                showNotification('自定义导出功能加载中...', 'info');
            }
        });
        
        // 备份恢复相关按钮 - 复用analyze.js中的功能
        const createBackupBtn = document.getElementById('create-backup-btn');
        const restoreBackupBtn = document.getElementById('restore-backup-btn');
        const manageBackupsBtn = document.getElementById('manage-backups-btn');
        
        if (createBackupBtn) createBackupBtn.addEventListener('click', () => {
            if (typeof window.createBackup === 'function') {
                window.createBackup();
            } else {
                showNotification('创建备份功能加载中...', 'info');
            }
        });
        if (restoreBackupBtn) restoreBackupBtn.addEventListener('click', () => {
            if (typeof window.restoreBackup === 'function') {
                window.restoreBackup();
            } else {
                showNotification('恢复备份功能加载中...', 'info');
            }
        });
        if (manageBackupsBtn) manageBackupsBtn.addEventListener('click', () => {
            if (typeof window.manageBackups === 'function') {
                window.manageBackups();
            } else {
                showNotification('备份管理功能加载中...', 'info');
            }
        });
        
        // 报告相关按钮 - 复用analyze.js中的功能
        const viewDuplicateReportBtn = document.getElementById('view-duplicate-report-btn');
        const viewInvalidReportBtn = document.getElementById('view-invalid-report-btn');
        const viewCleanupReportBtn = document.getElementById('view-cleanup-report-btn');
        const generateComprehensiveReportBtn = document.getElementById('generate-comprehensive-report-btn');
        
        if (viewDuplicateReportBtn) viewDuplicateReportBtn.addEventListener('click', () => {
            if (typeof window.viewDuplicateReport === 'function') {
                window.viewDuplicateReport();
            } else {
                showNotification('重复报告功能加载中...', 'info');
            }
        });
        if (viewInvalidReportBtn) viewInvalidReportBtn.addEventListener('click', () => {
            if (typeof window.viewInvalidReport === 'function') {
                window.viewInvalidReport();
            } else {
                showNotification('失效报告功能加载中...', 'info');
            }
        });
        if (viewCleanupReportBtn) viewCleanupReportBtn.addEventListener('click', () => {
            if (typeof window.viewCleanupReport === 'function') {
                window.viewCleanupReport();
            } else {
                showNotification('清理报告功能加载中...', 'info');
            }
        });
        if (generateComprehensiveReportBtn) generateComprehensiveReportBtn.addEventListener('click', () => {
            if (typeof window.generateComprehensiveReport === 'function') {
                window.generateComprehensiveReport();
            } else {
                showNotification('综合报告功能加载中...', 'info');
            }
        });
    }
    
    // --- 数据加载 ---
    async function loadBookmarkData() {
        try {
            console.log('📊 加载书签数据...');
            
            // 检查是否在Chrome扩展环境中
            if (typeof chrome === 'undefined' || !chrome.bookmarks) {
                console.warn('⚠️ 不在Chrome扩展环境中，使用模拟数据');
                bookmarkData = getMockBookmarkData();
                processBookmarkData();
                return;
            }
            
            const bookmarks = await new Promise((resolve, reject) => {
                chrome.bookmarks.getTree((result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(result);
                    }
                });
            });
            
            bookmarkData = bookmarks[0];
            
            // 处理书签数据
            processBookmarkData();
            
            console.log('✅ 书签数据加载完成');
        } catch (error) {
            console.error('❌ 加载书签数据失败:', error);
            showNotification('加载书签数据失败', 'error');
        }
    }
    
    // 模拟书签数据（用于非扩展环境测试）
    function getMockBookmarkData() {
        return {
            id: '0',
            title: '书签栏',
            children: [{
                id: '1',
                title: 'Google',
                url: 'https://www.google.com',
                dateAdded: Date.now()
            }, {
                id: '2',
                title: 'GitHub',
                url: 'https://github.com',
                dateAdded: Date.now()
            }, {
                id: '3',
                title: '技术文档',
                children: [{
                    id: '4',
                    title: 'MDN Web Docs',
                    url: 'https://developer.mozilla.org',
                    dateAdded: Date.now()
                }]
            }]
        };
    }
    
    function processBookmarkData() {
        if (!bookmarkData) return;
        
        // 提取所有书签
        const allBookmarks = extractAllBookmarks(bookmarkData);
        
        // 生成可视化数据
        visualizationData = {
            wordcloud: generateWordcloudData(allBookmarks),
            treeview: generateTreeviewData(bookmarkData),
            charts: generateChartData(allBookmarks)
        };
        
        // 更新统计信息
        updateStatistics();
    }
    
    function extractAllBookmarks(node) {
        const bookmarks = [];
        
        function traverse(n) {
            if (n.url) {
                bookmarks.push(n);
            }
            if (n.children) {
                n.children.forEach(child => traverse(child));
            }
        }
        
        traverse(node);
        return bookmarks;
    }
    
    // --- 统计信息更新 ---
    function updateStatistics() {
        if (!bookmarkData) return;
        
        const allBookmarks = extractAllBookmarks(bookmarkData);
        const allFolders = extractAllFolders(bookmarkData);
        
        // 更新统计数字
        document.getElementById('total-bookmarks').textContent = allBookmarks.length.toLocaleString();
        document.getElementById('total-folders').textContent = allFolders.length.toLocaleString();
        
        // 计算唯一词汇数
        const uniqueWords = new Set();
        allBookmarks.forEach(bookmark => {
            const words = extractWords(bookmark.title);
            words.forEach(word => uniqueWords.add(word));
        });
        document.getElementById('unique-words').textContent = uniqueWords.size.toLocaleString();
        
        // 计算平均标题长度
        const avgLength = allBookmarks.length > 0 
            ? Math.round(allBookmarks.reduce((sum, b) => sum + b.title.length, 0) / allBookmarks.length)
            : 0;
        document.getElementById('avg-length').textContent = avgLength;
    }
    
    function extractAllFolders(node) {
        const folders = [];
        
        function traverse(n) {
            if (!n.url && n.title) {
                folders.push(n);
            }
            if (n.children) {
                n.children.forEach(child => traverse(child));
            }
        }
        
        traverse(node);
        return folders;
    }
    
    function extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 1);
    }
    
    // --- 数据生成函数（复用visualization.js的逻辑） ---
    function generateWordcloudData(bookmarks) {
        const wordCount = {};
        
        bookmarks.forEach(bookmark => {
            const words = extractWords(bookmark.title);
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });
        
        // 转换为词云数据格式，包含更多信息
        return Object.entries(wordCount)
            .map(([word, count]) => ({ 
                word: word, 
                count: count,
                size: Math.max(12, Math.min(48, count * 2)),
                color: getRandomColor()
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100); // 取前100个词
    }
    
    function generateTreeviewData(node) {
        function buildTree(n, level = 0) {
            const result = {
                id: n.id,
                title: n.title || n.url,
                url: n.url,
                level: level,
                children: [],
                bookmarkCount: 0
            };
            
            if (n.children) {
                n.children.forEach(child => {
                    if (child.children) {
                        result.children.push(buildTree(child, level + 1));
                    } else {
                        result.bookmarkCount++;
                    }
                });
            }
            
            return result;
        }
        
        return buildTree(node);
    }
    
    function generateChartData(bookmarks) {
        // 按域名统计
        const domainCount = {};
        bookmarks.forEach(bookmark => {
            try {
                const domain = new URL(bookmark.url).hostname;
                domainCount[domain] = (domainCount[domain] || 0) + 1;
            } catch (e) {
                // 忽略无效URL
            }
        });
        
        // 按时间统计（如果有dateAdded）
        const timeData = {};
        bookmarks.forEach(bookmark => {
            if (bookmark.dateAdded) {
                const date = new Date(bookmark.dateAdded);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const key = `${year}-${month.toString().padStart(2, '0')}`;
                timeData[key] = (timeData[key] || 0) + 1;
            }
        });
        
        return {
            domainCount: Object.entries(domainCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20),
            timeData: Object.entries(timeData)
                .sort((a, b) => a[0].localeCompare(b[0]))
        };
    }
    
    function getRandomColor() {
        const colors = [
            '#007aff', '#5856d6', '#ff2d92', '#ff3b30', '#ff9500',
            '#ffcc00', '#4cd964', '#34c759', '#5ac8fa', '#007aff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // --- 导航功能 ---
    function switchSection(section) {
        console.log('🔄 切换到部分:', section);
        
        // 更新导航状态
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
        
        // 隐藏所有内容区域（包括动态添加的）
        const allContentSections = document.querySelectorAll('.content-section');
        allContentSections.forEach(content => {
            content.classList.remove('active');
        });
        
        // 检查section是否有效
        const validSections = [
            'wordcloud', 'ai-analysis', 'bookmark-manager', 'duplicates', 
            'invalid', 'empty-folders', 'import', 'export', 'backup', 'reports',
            'treeview', 'charts', 'regenerate', 'analysis-log', 'analysis-results', 
            'export-csv', 'history', 'organize', 'batch-operations'
        ];
        
        if (validSections.includes(section)) {
            // 显示目标内容区域
            const targetSection = document.getElementById(`${section}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                currentSection = section;
                
                // 根据section加载特定内容
                loadSectionContent(section);
                return; // 成功找到并显示内容区域，直接返回
            } else {
                console.error('未找到内容区域:', section);
            }
        }
        
        // 如果到这里，说明section无效或找不到内容区域，显示开发中提示
        if (specialSections.includes(section) || !validSections.includes(section)) {
            showFeatureInDevelopment(section);
        }
    }
    
    function loadSectionContent(section) {
        console.log('📄 加载内容:', section);
        
        switch (section) {
            case 'wordcloud':
                // 复用visualization.js中的词云功能
                if (typeof window.generateWordcloud === 'function') {
                    window.generateWordcloud();
                } else {
                    showNotification('词云功能加载中...', 'info');
                }
                break;
            case 'treeview':
                // 复用visualization.js中的树状图功能
                if (typeof window.generateTreeview === 'function') {
                    window.generateTreeview();
                } else {
                    showNotification('树状图功能加载中...', 'info');
                }
                break;
            case 'charts':
                // 复用visualization.js中的图表功能
                if (typeof window.generateCharts === 'function') {
                    window.generateCharts();
                } else {
                    showNotification('图表功能加载中...', 'info');
                }
                break;
            case 'ai-analysis':
                // AI分析功能已在HTML中定义，复用analyze.js中的功能
                break;
            case 'bookmark-manager':
                // 复用analyze.js中的书签管理器功能
                if (typeof window.renderBookmarkTree === 'function') {
                    window.renderBookmarkTree();
                } else {
                    showNotification('书签管理器功能加载中...', 'info');
                }
                break;
            case 'duplicates':
            case 'invalid':
            case 'empty-folders':
            case 'import':
            case 'export':
            case 'backup':
            case 'reports':
            case 'regenerate':
            case 'analysis-log':
            case 'analysis-results':
            case 'export-csv':
            case 'history':
            case 'organize':
            case 'batch-operations':
                // 这些功能已在HTML中定义，复用analyze.js中的功能
                break;
            default:
                // 显示功能开发中提示
                showFeatureInDevelopment(section);
        }
    }
    
    function showFeatureInDevelopment(section) {
        // 隐藏所有内容区域（包括动态添加的）
        const allContentSections = document.querySelectorAll('.content-section');
        allContentSections.forEach(content => {
            content.classList.remove('active');
        });
        
        // 创建一个临时的开发中内容区域
        let devSection = document.getElementById('dev-section');
        if (!devSection) {
            devSection = document.createElement('div');
            devSection.id = 'dev-section';
            devSection.className = 'content-section';
            document.querySelector('.main-content').appendChild(devSection);
        }
        
        // 显示开发中提示
        devSection.innerHTML = `
            <div class="content-header">
                <div class="content-title">${getSectionTitle(section)}</div>
                <div class="content-description">此功能正在开发中，敬请期待...</div>
            </div>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🚧</div>
                        <div class="feature-title">开发中</div>
                    </div>
                    <div class="feature-description">
                        我们正在努力开发这个功能，它将提供强大的分析能力。
                    </div>
                    <div class="feature-actions">
                        <button class="feature-btn" onclick="switchSection('wordcloud')">返回词云</button>
                    </div>
                </div>
            </div>
        `;
        
        // 显示开发中区域
        devSection.classList.add('active');
    }
    
    function getSectionTitle(section) {
        const titles = {
            'wordcloud': '词云展示',
            'treeview': '树状图展示',
            'charts': '统计图表',
            'ai-analysis': 'AI智能分析',
            'regenerate': '重新生成分类建议',
            'analysis-log': '分析日志',
            'analysis-results': '分析结果',
            'export-csv': '导出CSV',
            'history': '历史版本',
            'organize': '整理到文件夹',
            'batch-operations': '批量处理',
            'duplicates': '重复书签整理',
            'invalid': '失效书签整理',
            'empty-folders': '空文件夹整理',
            'import': '导入功能',
            'export': '导出功能',
            'backup': '备份恢复',
            'reports': '检测报告'
        };
        return titles[section] || '未知功能';
    }
    
    // --- 工具函数 ---
    function refreshData() {
        console.log('🔄 刷新数据...');
        loadBookmarkData();
        showNotification('数据刷新完成', 'success');
    }
    
    function exportData() {
        console.log('📤 导出数据...');
        
        if (!bookmarkData) {
            showNotification('没有数据可导出', 'warning');
            return;
        }
        
        const data = {
            bookmarks: extractAllBookmarks(bookmarkData),
            statistics: {
                totalBookmarks: extractAllBookmarks(bookmarkData).length,
                totalFolders: extractAllFolders(bookmarkData).length,
                exportTime: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bookmarks-analysis-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showNotification('数据导出成功', 'success');
    }
    
    function goBack() {
        console.log('← 返回上一页...');
        window.history.back();
    }
    
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 500;
            color: #1d1d1f;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            border-left: 4px solid ${getNotificationColor(type)};
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function getNotificationColor(type) {
        const colors = {
            success: '#30d158',
            error: '#ff3b30',
            warning: '#ff9500',
            info: '#007aff'
        };
        return colors[type] || colors.info;
    }
    
    // 添加通知动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // --- API状态检查 ---
    function checkApiStatus() {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            console.warn('Chrome存储API不可用');
            return;
        }
        
        chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
            const apiStatusElement = document.getElementById('api-status-text');
            const apiProviderElement = document.getElementById('api-provider-text');
            const apiStatusDisplay = document.querySelector('.api-status-display');
            
            if (result.apiProvider && result.apiKey) {
                if (apiStatusElement) apiStatusElement.textContent = '已连接';
                if (apiProviderElement) apiProviderElement.textContent = `(${result.apiProvider})`;
                if (apiStatusDisplay) apiStatusDisplay.className = 'api-status-display connected';
            } else {
                if (apiStatusElement) apiStatusElement.textContent = '未连接';
                if (apiProviderElement) apiProviderElement.textContent = '';
                if (apiStatusDisplay) apiStatusDisplay.className = 'api-status-display not-connected';
            }
        });
    }
    
    // --- 启动应用 ---
    initialize();
}); 