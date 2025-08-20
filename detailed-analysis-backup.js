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
    // Web Worker引用
    let bookmarkWorker = null;

    // AI分析相关变量
    let apiStatus = false;
    let categories = {};
    const MAX_LOG_ENTRIES = 500;
    let analysisResults = {};
    let visualizationData = {};
    
    // 分析状态管理
    let bookmarks = [];
    let processingBatch = false;
    let currentBatchIndex = 0;
    let batchSize = 50;
    let totalBookmarksCount = 0;
    let analysisSession = null;
    
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
    
    // --- 分析进度管理 ---
    async function saveAnalysisProgress() {
        if (!analysisSession) return;
        
        const progressData = {
            sessionId: analysisSession,
            timestamp: Date.now(),
            currentBatch: currentBatchIndex,
            categories: categories,
            bookmarks: bookmarks,
            startTime: Date.now()
        };
        
        try {
            await chrome.storage.local.set({ analysisProgress: progressData });
            console.log('分析进度已保存');
        } catch (error) {
            console.error('保存分析进度失败:', error);
        }
    }
    
    async function loadAnalysisProgress() {
        try {
            const result = await chrome.storage.local.get(['analysisProgress']);
            if (result.analysisProgress) {
                const progress = result.analysisProgress;
                
                // 检查进度是否在24小时内
                const hoursSinceLastSave = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
                if (hoursSinceLastSave > 24) {
                    await clearAnalysisProgress();
                    return null;
                }
                
                return progress;
            }
        } catch (error) {
            console.error('加载分析进度失败:', error);
        }
        return null;
    }
    
    async function clearAnalysisProgress() {
        try {
            await chrome.storage.local.remove(['analysisProgress']);
            console.log('分析进度已清除');
        } catch (error) {
            console.error('清除分析进度失败:', error);
        }
    }
    
    function cancelAnalyze() {
        processingBatch = false;
        
        // 保存当前进度
        saveAnalysisProgress();
        
        addLogEntry('用户请求取消分析，进度已保存...', 'warning');
        showStatus('分析已取消，进度已保存');
        
        // 更新按钮状态
        toggleAnalyzeButtons(false);
        showProgress(false);
    }
    
    // 添加日志条目
    function addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('log-entries');
        if (!logContainer) return;
        
        // 限制日志条目数量，避免内存占用过大
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length >= MAX_LOG_ENTRIES) {
            // 移除最早的20%日志条目
            const removeCount = Math.ceil(MAX_LOG_ENTRIES * 0.2);
            for (let i = 0; i < removeCount; i++) {
                if (logContainer.firstChild) {
                    logContainer.removeChild(logContainer.firstChild);
                }
            }
            // 添加一条提示信息
            if (!logContainer.querySelector('.log-entry-trimmed')) {
                const trimNotice = document.createElement('div');
                trimNotice.className = 'log-entry log-entry-trimmed log-warning';
                trimNotice.textContent = `为提高性能，已移除 ${removeCount} 条较早的日志...`;
                logContainer.insertBefore(trimNotice, logContainer.firstChild);
            }
        }
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        
        // 添加时间戳
        const timeStamp = new Date().toLocaleTimeString();
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-entry-time';
        timeSpan.textContent = `[${timeStamp}]`;
        
        entry.appendChild(timeSpan);
        entry.appendChild(document.createTextNode(` ${message}`));
        
        // 添加到日志容器
        logContainer.appendChild(entry);
        
        // 自动滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // 如果日志不可见且是重要信息，自动显示
        const logContainerParent = logContainer.closest('.log-container');
        if (logContainerParent && logContainerParent.classList.contains('hidden') && (type === 'error' || type === 'warning')) {
            logContainerParent.classList.remove('hidden');
        }
        
        // 同时在控制台记录
        console.log(`[${type}] ${message}`);
    }
    
    function showStatus(message, type = 'info') {
        const statusElement = document.getElementById('analysis-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `progress-status status-${type}`;
        }
    }
    
    function showProgress(show) {
        const progressContainer = document.getElementById('analysis-progress');
        if (progressContainer) {
            progressContainer.style.display = show ? 'block' : 'none';
        }
    }
    
    function updateProgress(current, total) {
        const progressBar = document.getElementById('analysis-progress-bar');
        const progressStatus = document.getElementById('analysis-status');
        
        if (progressBar && progressStatus) {
            const percentage = Math.round((current / total) * 100);
            progressBar.style.width = `${percentage}%`;
            progressStatus.textContent = `处理进度: ${current}/${total} (${percentage}%)`;
        }
    }
    
    function toggleAnalyzeButtons(analyzing) {
        const analyzeBtn = document.getElementById('analyze-bookmarks-btn');
        const cancelBtn = document.getElementById('cancel-analyze-btn');
        
        if (analyzeBtn) {
            analyzeBtn.style.display = analyzing ? 'none' : 'block';
            analyzeBtn.disabled = analyzing;
        }
        
        if (cancelBtn) {
            cancelBtn.style.display = analyzing ? 'block' : 'none';
        }
    }
    
    // --- 核心分析功能 ---
    async function analyzeBookmarks() {
        if (processingBatch) {
            cancelAnalyze();
            return;
        }
        
        try {
            // 检查是否有保存的进度
            const savedProgress = await loadAnalysisProgress();
            let shouldResume = false;
            
            if (savedProgress) {
                const resumeConfirm = confirm(
                    `发现未完成的分析进度:\n` +
                    `批次: ${savedProgress.currentBatch}\n` +
                    `保存时间: ${new Date(savedProgress.timestamp).toLocaleString()}\n\n` +
                    `是否继续之前的分析？`
                );
                
                if (resumeConfirm) {
                    shouldResume = true;
                    // 恢复状态
                    currentBatchIndex = savedProgress.currentBatch;
                    categories = savedProgress.categories || {};
                    bookmarks = savedProgress.bookmarks || [];
                    analysisSession = savedProgress.sessionId;
                    addLogEntry(`恢复分析进度: 批次 ${currentBatchIndex}`, 'info');
                } else {
                    await clearAnalysisProgress();
                }
            }
            
            if (!shouldResume) {
                // 开始新的分析
                addLogEntry('开始新的书签分析...', 'info');
                
                // 获取所有书签
                const allBookmarks = await chrome.bookmarks.getTree();
                bookmarks = extractBookmarks(allBookmarks);
                
                if (bookmarks.length === 0) {
                    addLogEntry('没有找到书签', 'warning');
                    showStatus('没有找到书签');
                    return;
                }
                
                // 重置状态
                categories = {};
                currentBatchIndex = 0;
                analysisSession = Date.now().toString();
                totalBookmarksCount = bookmarks.length;
                
                addLogEntry(`找到 ${totalBookmarksCount} 个书签，开始分析...`, 'info');
            }
            
            // 开始处理
            processingBatch = true;
            toggleAnalyzeButtons(true);
            showProgress(true);
            updateProgress(currentBatchIndex * batchSize, bookmarks.length);
            
            // 模拟批量处理
            await processBatches();
            
        } catch (error) {
            console.error('分析失败:', error);
            addLogEntry(`分析失败: ${error.message}`, 'error');
            showStatus('分析失败', 'error');
        } finally {
            processingBatch = false;
        }
    }
    
    function extractBookmarks(bookmarkTree) {
        const bookmarks = [];
        
        function traverse(nodes) {
            for (const node of nodes) {
                if (node.url) {
                    bookmarks.push({
                        id: node.id,
                        title: node.title,
                        url: node.url,
                        dateAdded: node.dateAdded
                    });
                }
                if (node.children) {
                    traverse(node.children);
                }
            }
        }
        
        traverse(bookmarkTree);
        return bookmarks;
    }
    
    async function processBatches() {
        const totalBatches = Math.ceil(bookmarks.length / batchSize);
        
        while (currentBatchIndex < totalBatches && processingBatch) {
            const startIdx = currentBatchIndex * batchSize;
            const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
            const currentBatch = bookmarks.slice(startIdx, endIdx);
            
            addLogEntry(`处理批次 ${currentBatchIndex + 1}/${totalBatches} (${currentBatch.length} 个书签)`, 'info');
            
            // 模拟处理时间
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 更新进度
            currentBatchIndex++;
            updateProgress(currentBatchIndex * batchSize, bookmarks.length);
            
            // 保存进度
            await saveAnalysisProgress();
        }
        
        if (processingBatch) {
            addLogEntry('所有书签分析完成！', 'success');
            showStatus('分析完成', 'success');
            await clearAnalysisProgress();
        }
    }
    
    // --- 初始化函数 ---
    async function initialize() {
        try {
            // 检查API状态
            await checkApiStatus();
            
            // 初始化页面导航
            initializeNavigation();
            
            // 绑定全局事件
            bindGlobalEvents();
            
            // 初始化日志
            addLogEntry('详细分析页面初始化完成', 'info');
            
        } catch (error) {
            console.error('初始化失败:', error);
            addLogEntry(`初始化失败: ${error.message}`, 'error');
        }
    }
    
    // 初始化页面导航
    function initializeNavigation() {
        // 绑定侧边栏导航事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    switchToSection(section);
                }
            });
        });
        
        // 默认显示第一个区域
        switchToSection('wordcloud');
    }
    
    // 切换到指定区域
    function switchToSection(sectionName) {
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
        
        // 根据区域初始化特定功能
        initializeSectionFeatures(sectionName);
    }
    
    // 初始化区域特定功能
    async function initializeSectionFeatures(sectionName) {
        switch (sectionName) {
            case 'batch-operations':
            case 'bookmark-manager':
                if (!isManagerInitialized) {
                    await initializeBookmarkManager();
                }
                break;
                
            case 'ai-analysis':
                // AI分析区域无需特殊初始化
                break;
                
            case 'duplicates':
                // 重复检测区域无需特殊初始化
                break;
                
            case 'invalid':
                // 失效检测区域无需特殊初始化
                break;
                
            case 'empty-folders':
                // 空文件夹检测区域无需特殊初始化
                break;
        }
    }
    
    // 绑定全局事件
    function bindGlobalEvents() {
        // 顶部导航栏事件
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('export-btn')?.addEventListener('click', () => {
            switchToSection('export');
        });
        
        document.getElementById('back-btn')?.addEventListener('click', () => {
            window.history.back();
        });
        
        // AI分析相关事件
        document.getElementById('analyze-bookmarks-btn')?.addEventListener('click', analyzeBookmarks);
        document.getElementById('cancel-analyze-btn')?.addEventListener('click', cancelAnalysis);
        document.getElementById('regenerate-categories-btn')?.addEventListener('click', regenerateCategories);
        document.getElementById('organize-bookmarks-btn')?.addEventListener('click', organizeBookmarksToFolders);
        document.getElementById('setup-api-btn')?.addEventListener('click', setupApi);
        
        // 日志控制事件
        document.getElementById('clear-log-btn')?.addEventListener('click', clearAnalysisLog);
        document.getElementById('toggle-log-btn')?.addEventListener('click', toggleAnalysisLog);
        document.getElementById('export-csv-btn')?.addEventListener('click', exportAiCategoriesAsCSV);
        document.getElementById('view-history-btn')?.addEventListener('click', viewAnalysisHistory);
        
        // 重复检测事件
        document.getElementById('detect-duplicates-btn')?.addEventListener('click', detectDuplicateBookmarks);
        document.getElementById('remove-duplicates-btn')?.addEventListener('click', removeSelectedDuplicates);
        document.getElementById('select-all-duplicates-btn')?.addEventListener('click', selectAllDuplicates);
        document.getElementById('deselect-all-duplicates-btn')?.addEventListener('click', deselectAllDuplicates);
        
        // 失效检测事件
        document.getElementById('detect-invalid-btn')?.addEventListener('click', detectInvalidBookmarks);
        document.getElementById('remove-invalid-btn')?.addEventListener('click', removeSelectedInvalid);
        document.getElementById('select-all-invalid-btn')?.addEventListener('click', selectAllInvalid);
        document.getElementById('deselect-all-invalid-btn')?.addEventListener('click', deselectAllInvalid);
        
        // 空文件夹检测事件
        document.getElementById('detect-empty-folders-btn')?.addEventListener('click', detectEmptyFolders);
        document.getElementById('remove-empty-folders-btn')?.addEventListener('click', removeSelectedEmptyFolders);
        document.getElementById('select-all-empty-folders-btn')?.addEventListener('click', selectAllEmptyFolders);
        document.getElementById('deselect-all-empty-folders-btn')?.addEventListener('click', deselectAllEmptyFolders);
        
        // 导出功能事件
        document.getElementById('export-backup-btn')?.addEventListener('click', exportBookmarksBackup);
        document.getElementById('export-ai-categories-btn')?.addEventListener('click', exportAiCategoriesAsCSV);
        document.getElementById('export-custom-btn')?.addEventListener('click', customExport);
        
        // 全局事件委托 - 处理动态生成的按钮
        document.addEventListener('click', handleDynamicButtonClick);
    }
    
    // 处理动态按钮点击事件
    function handleDynamicButtonClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch (action) {
            case 'switch-section':
                const targetSection = target.dataset.target;
                if (targetSection) {
                    switchToSection(targetSection);
                }
                break;
                
            case 'toggle-category':
                const category = target.dataset.category;
                if (category) {
                    toggleCategoryItems(category);
                }
                break;
                
            case 'select-duplicate-group':
                const duplicateIndex = target.dataset.index;
                if (duplicateIndex !== undefined) {
                    selectDuplicateGroup(parseInt(duplicateIndex));
                }
                break;
                
            case 'remove-duplicate-group':
                const removeIndex = target.dataset.index;
                if (removeIndex !== undefined) {
                    removeDuplicateGroup(parseInt(removeIndex));
                }
                break;
                
            case 'open-bookmark':
                const url = target.dataset.url;
                if (url) {
                    openBookmark(url);
                }
                break;
                
            case 'remove-single-duplicate':
                const duplicateId = target.dataset.id;
                if (duplicateId) {
                    removeSingleDuplicate(duplicateId);
                }
                break;
                
            case 'select-invalid-group':
                const invalidType = target.dataset.type;
                if (invalidType) {
                    selectInvalidGroup(invalidType);
                }
                break;
                
            case 'remove-invalid-group':
                const removeType = target.dataset.type;
                if (removeType) {
                    removeInvalidGroup(removeType);
                }
                break;
                
            case 'remove-single-invalid':
                const invalidId = target.dataset.id;
                if (invalidId) {
                    removeSingleInvalid(invalidId);
                }
                break;
                
            case 'remove-single-empty-folder':
                const folderId = target.dataset.id;
                if (folderId) {
                    removeSingleEmptyFolder(folderId);
                }
                break;
                
            default:
                console.warn('未知的动作:', action);
        }
    }
    
    // 取消分析
    function cancelAnalysis() {
        if (processingBatch) {
            processingBatch = false;
            addLogEntry('用户取消了分析', 'warning');
            showProgress(false);
            toggleAnalyzeButtons(false);
        }
    }
    
    // 重新生成分类
    async function regenerateCategories() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('请先进行AI分析', 'warning');
            return;
        }
        
        const confirm = window.confirm('确定要重新生成分类吗？这将覆盖当前的分类结果。');
        if (confirm) {
            // 清除当前结果并重新分析
            categories = {};
            await analyzeBookmarks();
        }
    }
    
    // 设置API
    function setupApi() {
        // 跳转到设置页面
        window.open('options.html', '_blank');
    }
    
    // 清空分析日志
    function clearAnalysisLog() {
        const logContainer = document.getElementById('analysis-log');
        if (logContainer) {
            logContainer.innerHTML = '';
            logEntries = [];
        }
    }
    
    // 切换日志显示
    function toggleAnalysisLog() {
        const logContainer = document.getElementById('analysis-log-container');
        if (logContainer) {
            logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // 查看分析历史
    function viewAnalysisHistory() {
        // 简化版：显示当前的分析结果
        if (categories && Object.keys(categories).length > 0) {
            displayCategories(categories);
            switchToSection('analysis-results');
        } else {
            showNotification('没有历史分析结果', 'info');
        }
    }
    
    // --- 备份恢复功能 ---
    
    // 创建备份
    async function createBackup() {
        try {
            addLogEntry('开始创建书签备份...', 'info');
            
            const bookmarkTree = await chrome.bookmarks.getTree();
            const backupData = {
                metadata: {
                    createTime: new Date().toISOString(),
                    version: '1.0',
                    type: 'manual_backup',
                    totalBookmarks: await countTotalBookmarks(bookmarkTree)
                },
                bookmarks: bookmarkTree
            };
            
            // 保存到本地存储
            const backupId = `backup_${Date.now()}`;
            await chrome.storage.local.set({ [backupId]: backupData });
            
            // 同时下载文件
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('书签备份创建成功', 'success');
            showNotification('备份创建成功', 'success');
            
        } catch (error) {
            addLogEntry(`创建备份失败: ${error.message}`, 'error');
            showNotification('创建备份失败', 'error');
        }
    }
    
    // 恢复备份
    async function restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const backupData = JSON.parse(text);
                
                if (!backupData.bookmarks || !backupData.metadata) {
                    throw new Error('无效的备份文件格式');
                }
                
                const confirm = window.confirm(
                    `确定要恢复备份吗？\n` +
                    `备份时间: ${new Date(backupData.metadata.createTime).toLocaleString()}\n` +
                    `书签数量: ${backupData.metadata.totalBookmarks}\n\n` +
                    `警告：这将替换当前所有书签！`
                );
                
                if (confirm) {
                    addLogEntry('开始恢复书签备份...', 'info');
                    
                    // 清除现有书签（除了根节点）
                    const currentTree = await chrome.bookmarks.getTree();
                    for (const rootChild of currentTree[0].children) {
                        await chrome.bookmarks.removeTree(rootChild.id);
                    }
                    
                    // 恢复备份的书签
                    await restoreBookmarkTree(backupData.bookmarks[0].children, '0');
                    
                    addLogEntry('书签备份恢复成功', 'success');
                    showNotification('备份恢复成功', 'success');
                }
                
            } catch (error) {
                addLogEntry(`恢复备份失败: ${error.message}`, 'error');
                showNotification('恢复备份失败', 'error');
            }
        };
        
        input.click();
    }
    
    // 递归恢复书签树
    async function restoreBookmarkTree(nodes, parentId) {
        for (const node of nodes) {
            if (node.children) {
                // 创建文件夹
                const folder = await chrome.bookmarks.create({
                    parentId: parentId,
                    title: node.title
                });
                
                // 递归处理子节点
                await restoreBookmarkTree(node.children, folder.id);
            } else {
                // 创建书签
                await chrome.bookmarks.create({
                    parentId: parentId,
                    title: node.title,
                    url: node.url
                });
            }
        }
    }
    
    // 管理备份
    async function manageBackups() {
        try {
            const storage = await chrome.storage.local.get();
            const backups = Object.entries(storage)
                .filter(([key]) => key.startsWith('backup_'))
                .map(([key, value]) => ({ id: key, ...value.metadata }))
                .sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
            
            if (backups.length === 0) {
                showNotification('没有找到本地备份', 'info');
                return;
            }
            
            let message = '本地备份列表:\n\n';
            backups.forEach((backup, index) => {
                message += `${index + 1}. ${new Date(backup.createTime).toLocaleString()} (${backup.totalBookmarks} 个书签)\n`;
            });
            
            message += '\n输入要删除的备份编号（留空取消）:';
            const choice = prompt(message);
            
            if (choice && !isNaN(choice)) {
                const index = parseInt(choice) - 1;
                if (index >= 0 && index < backups.length) {
                    const backupToDelete = backups[index];
                    await chrome.storage.local.remove(backupToDelete.id);
                    addLogEntry(`删除备份: ${new Date(backupToDelete.createTime).toLocaleString()}`, 'success');
                    showNotification('备份删除成功', 'success');
                }
            }
            
        } catch (error) {
            addLogEntry(`管理备份失败: ${error.message}`, 'error');
            showNotification('管理备份失败', 'error');
        }
    }
    
    // 计算总书签数
    async function countTotalBookmarks(tree) {
        let count = 0;
        function traverse(nodes) {
            for (const node of nodes) {
                if (node.url) count++;
                if (node.children) traverse(node.children);
            }
        }
        traverse(tree);
        return count;
    }
    
    // --- 报告生成功能 ---
    
    // 查看重复书签报告
    function viewDuplicateReport() {
        if (duplicateBookmarks.length === 0) {
            showNotification('请先检测重复书签', 'warning');
            return;
        }
        
        generateReport('duplicate', {
            title: '重复书签检测报告',
            data: duplicateBookmarks,
            summary: `发现 ${duplicateBookmarks.length} 组重复书签`
        });
    }
    
    // 查看失效书签报告
    function viewInvalidReport() {
        if (invalidBookmarks.length === 0) {
            showNotification('请先检测失效书签', 'warning');
            return;
        }
        
        generateReport('invalid', {
            title: '失效书签检测报告',
            data: invalidBookmarks,
            summary: `发现 ${invalidBookmarks.length} 个失效书签`
        });
    }
    
    // 查看清理报告
    function viewCleanupReport() {
        const report = {
            duplicates: duplicateBookmarks.length,
            invalid: invalidBookmarks.length,
            emptyFolders: emptyFolders.length
        };
        
        generateReport('cleanup', {
            title: '书签清理报告',
            data: report,
            summary: `重复: ${report.duplicates} 组, 失效: ${report.invalid} 个, 空文件夹: ${report.emptyFolders} 个`
        });
    }
    
    // 生成综合报告
    async function generateComprehensiveReport() {
        try {
            addLogEntry('开始生成综合报告...', 'info');
            
            const bookmarks = await getAllBookmarks();
            const bookmarkTree = await chrome.bookmarks.getTree();
            
            const report = {
                metadata: {
                    generateTime: new Date().toISOString(),
                    version: '1.0'
                },
                statistics: {
                    totalBookmarks: bookmarks.length,
                    totalFolders: countFolders(bookmarkTree),
                    duplicateGroups: duplicateBookmarks.length,
                    invalidBookmarks: invalidBookmarks.length,
                    emptyFolders: emptyFolders.length
                },
                details: {
                    duplicates: duplicateBookmarks,
                    invalid: invalidBookmarks,
                    emptyFolders: emptyFolders
                }
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('综合报告生成成功', 'success');
            showNotification('报告生成成功', 'success');
            
        } catch (error) {
            addLogEntry(`生成报告失败: ${error.message}`, 'error');
            showNotification('生成报告失败', 'error');
        }
    }
    
    // 生成报告
    function generateReport(type, options) {
        const reportWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${options.title}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
                    .item { margin: 10px 0; padding: 10px; border-left: 3px solid #007cba; }
                    .timestamp { color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${options.title}</h1>
                    <div class="timestamp">生成时间: ${new Date().toLocaleString()}</div>
                </div>
                <div class="summary">
                    <h2>摘要</h2>
                    <p>${options.summary}</p>
                </div>
                <div class="details">
                    <h2>详细信息</h2>
                    <pre>${JSON.stringify(options.data, null, 2)}</pre>
                </div>
            </body>
            </html>
        `;
        
        reportWindow.document.write(html);
        reportWindow.document.close();
    }
    
    // 计算文件夹数量
    function countFolders(tree) {
        let count = 0;
        function traverse(nodes) {
            for (const node of nodes) {
                if (node.children) {
                    count++;
                    traverse(node.children);
                }
            }
        }
        traverse(tree);
        return count;
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
        
        if (analyzeBookmarksBtn) analyzeBookmarksBtn.addEventListener('click', async () => {
            await analyzeBookmarks();
        });
        if (cancelAnalyzeBtn) cancelAnalyzeBtn.addEventListener('click', () => {
            cancelAnalyze();
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
                        <button class="feature-btn" data-action="switch-section" data-target="wordcloud">返回词云</button>
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
    
    // --- API状态检查 --- (移除重复定义，使用后面的async版本)
    
    // --- AI分析核心功能移植 ---
    
    // 获取所有书签
    async function getAllBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                const bookmarks = [];
                addLogEntry(`开始获取书签树...`, 'info');
                
                function processNode(node) {
                    if (node.url) {
                        let processedTitle = node.title || '';
                        if (!processedTitle || /^\d+$/.test(processedTitle)) {
                            try {
                                const url = new URL(node.url);
                                processedTitle = url.hostname.replace(/^www\./, '');
                                addLogEntry(`发现无效书签标题(${node.title})，已自动替换为: ${processedTitle}`, 'warning');
                            } catch (e) {
                                processedTitle = node.title || '未命名书签';
                            }
                        }
                        
                        bookmarks.push({
                            id: node.id,
                            title: processedTitle,
                            url: node.url,
                            parentId: node.parentId,
                            originalTitle: node.title
                        });
                    }
                    
                    if (node.children) {
                        for (const child of node.children) {
                            processNode(child);
                        }
                    }
                }
                
                for (const node of bookmarkTreeNodes) {
                    processNode(node);
                }
                
                addLogEntry(`书签获取完成: 总计${bookmarks.length}个书签`, 'info');
                resolve(bookmarks);
            });
        });
    }
    
    // 获取API设置
    function getApiSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([
                'apiProvider', 'apiKey', 'customApiUrl', 'geminiModel', 
                'openaiModel', 'customModel', 'defaultCategories', 'batchSize'
            ], (result) => {
                const apiProvider = result.apiProvider || 'gemini';
                let model = '';
                
                switch (apiProvider) {
                    case 'gemini':
                        model = result.geminiModel || 'gemini-2.0-flash';
                        break;
                    case 'openai':
                        model = result.openaiModel || 'gpt-3.5-turbo';
                        break;
                    case 'custom':
                        model = result.customModel || '';
                        break;
                }
                
                resolve({
                    provider: apiProvider,
                    apiKey: result.apiKey || '',
                    customApiUrl: result.customApiUrl || '',
                    model: model,
                    defaultCategories: result.defaultCategories || '技术,教育,购物,社交媒体,新闻,娱乐,工作,其他',
                    batchSize: result.batchSize || 50
                });
            });
        });
    }
    
    // 批量处理书签分析
    async function processBatchBookmarks(bookmarks, settings) {
        try {
            addLogEntry(`开始批量处理${bookmarks.length}个书签...`, 'info');
            
            // 设置批量处理参数
            const batchSize = settings.batchSize || 50;
            const totalBatches = Math.ceil(bookmarks.length / batchSize);
            
            addLogEntry(`批量处理配置: 每批${batchSize}个书签，共${totalBatches}批`, 'info');
            
            let allCategories = {};
            
            for (let i = 0; i < totalBatches; i++) {
                if (!processingBatch) {
                    addLogEntry('批处理被用户中断', 'warning');
                    break;
                }
                
                const startIndex = i * batchSize;
                const endIndex = Math.min(startIndex + batchSize, bookmarks.length);
                const batch = bookmarks.slice(startIndex, endIndex);
                
                addLogEntry(`处理第${i + 1}/${totalBatches}批: ${batch.length}个书签`, 'info');
                
                // 更新进度
                const progress = ((i + 1) / totalBatches) * 100;
                updateProgress(progress, `处理第${i + 1}批，共${totalBatches}批`);
                
                try {
                    // 使用模块化的AI分析功能
                    if (typeof window.aiAnalysisModule === 'undefined') {
                        // 如果模块未加载，创建临时实例
                        const batchCategories = await categorizeBookmarksBatch(batch, settings);
                        mergeCategoryResults(allCategories, batchCategories);
                    } else {
                        // 使用模块化的分析功能
                        const batchCategories = await window.aiAnalysisModule.categorizeBookmarks(batch, settings);
                        mergeCategoryResults(allCategories, batchCategories);
                    }
                    
                    addLogEntry(`第${i + 1}批处理完成`, 'success');
                    
                    // 保存进度
                    await saveAnalysisProgress({
                        currentBatch: i + 1,
                        totalBatches: totalBatches,
                        processedBookmarks: endIndex,
                        totalBookmarks: bookmarks.length,
                        categories: allCategories,
                        timestamp: Date.now()
                    });
                    
                } catch (batchError) {
                    addLogEntry(`第${i + 1}批处理失败: ${batchError.message}`, 'error');
                    
                    // 询问用户是否继续
                    const continueProcessing = confirm(`第${i + 1}批处理失败: ${batchError.message}\n\n是否继续处理下一批？`);
                    if (!continueProcessing) {
                        addLogEntry('用户选择停止批处理', 'warning');
                        break;
                    }
                }
                
                // 批次间短暂延迟，避免API限制
                if (i < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            addLogEntry(`批量处理完成，共获得${Object.keys(allCategories).length}个分类`, 'success');
            return allCategories;
            
        } catch (error) {
            addLogEntry(`批量处理出错: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 合并分类结果
    function mergeCategoryResults(existingCategories, newCategories) {
        for (const [category, items] of Object.entries(newCategories)) {
            if (!existingCategories[category]) {
                existingCategories[category] = [];
            }
            existingCategories[category] = existingCategories[category].concat(items);
        }
    }
    
    // 临时的书签分类函数（如果模块未加载）
    async function categorizeBookmarksBatch(bookmarks, settings) {
        // 简化版的分类逻辑
        const bookmarkData = bookmarks.map(b => ({
            title: b.title || '未命名书签',
            url: b.url || ''
        }));
        
        const prompt = `请将以下书签进行智能分类，返回JSON格式：\n${JSON.stringify(bookmarkData, null, 2)}`;
        
        try {
            let result;
            switch (settings.provider) {
                case 'gemini':
                    result = await callGeminiApiSimple(prompt, settings.apiKey, settings.model);
                    break;
                case 'openai':
                    result = await callOpenAiApiSimple(prompt, settings.apiKey, settings.model);
                    break;
                default:
                    throw new Error('不支持的API提供商');
            }
            return result || { '未分类': bookmarkData };
        } catch (error) {
            addLogEntry(`批次分类失败，使用默认分类: ${error.message}`, 'warning');
            return { '未分类': bookmarkData };
        }
    }
    
    // 简化的Gemini API调用
    async function callGeminiApiSimple(prompt, apiKey, model) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
            })
        });
        
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        
        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        
        // 简单的JSON提取和解析
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                throw new Error('JSON解析失败');
            }
        }
        throw new Error('未找到有效的JSON响应');
    }
    
    // 简化的OpenAI API调用
    async function callOpenAiApiSimple(prompt, apiKey, model) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });
        
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        
        const data = await response.json();
        const responseText = data.choices[0].message.content;
        
        // 简单的JSON提取和解析
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                throw new Error('JSON解析失败');
            }
        }
        throw new Error('未找到有效的JSON响应');
    }
    
    // 显示分类结果
    function displayCategories(categories, maxCategories = Infinity) {
        const resultsContainer = document.getElementById('results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        addLogEntry(`开始显示分类结果...`, 'info');
        addLogEntry(`总共有 ${Object.keys(categories).length} 个分类`, 'info');
        
        const allCategories = Object.entries(categories)
            .sort((a, b) => b[1].length - a[1].length);
        
        const totalCategories = allCategories.length;
        
        // 输出详细分类信息到日志
        addLogEntry(`分类详情:`, 'info');
        allCategories.forEach(([category, items], index) => {
            addLogEntry(`  ${index+1}. ${category}: ${items.length}个书签`, 'info');
        });
        
        // 显示分类到页面
        const displayCategories = allCategories.slice(0, Math.min(maxCategories, totalCategories));
        
        displayCategories.forEach(([category, items]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'data-section';
            
            const header = document.createElement('div');
            header.className = 'data-header';
            header.innerHTML = `
                <div class="data-title">${category} (${items.length}个书签)</div>
                <div class="data-controls">
                    <button class="data-control-btn" data-action="toggle-category" data-category="${category}">展开/收起</button>
                </div>
            `;
            
            const itemsList = document.createElement('div');
            itemsList.className = 'category-items';
            itemsList.id = `category-${category}`;
            itemsList.style.display = 'none';
            
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'bookmark-item';
                itemDiv.innerHTML = `
                    <div class="bookmark-title">${item.title}</div>
                    <div class="bookmark-url"><a href="${item.url}" target="_blank">${item.url}</a></div>
                `;
                itemsList.appendChild(itemDiv);
            });
            
            categoryDiv.appendChild(header);
            categoryDiv.appendChild(itemsList);
            resultsContainer.appendChild(categoryDiv);
        });
        
        if (totalCategories > maxCategories && maxCategories !== Infinity) {
            const showAllButton = document.createElement('button');
            showAllButton.className = 'feature-btn';
            showAllButton.textContent = `显示全部 ${totalCategories} 个分类`;
            showAllButton.onclick = () => displayCategories(categories);
            resultsContainer.appendChild(showAllButton);
        }
    }
    
    // 切换分类项目显示
    function toggleCategoryItems(category) {
        const itemsList = document.getElementById(`category-${category}`);
        if (itemsList) {
            itemsList.style.display = itemsList.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    
    // 导出AI分析结果
    function exportAiCategories() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('没有分析结果可导出', 'warning');
            return;
        }
        
        try {
            const exportData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    totalCategories: Object.keys(categories).length,
                    totalBookmarks: Object.values(categories).reduce((sum, items) => sum + items.length, 0),
                    version: '1.0'
                },
                categories: categories
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ai-bookmark-categories-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('AI分析结果导出成功', 'success');
            showNotification('导出成功', 'success');
        } catch (error) {
            addLogEntry(`导出失败: ${error.message}`, 'error');
            showNotification('导出失败', 'error');
        }
    }
    
    // 组织书签到文件夹
    async function organizeBookmarksToFolders() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('请先进行AI分析', 'warning');
            return;
        }
        
        try {
            addLogEntry('开始组织书签到文件夹...', 'info');
            
            // 创建主分类文件夹
            const mainFolder = await chrome.bookmarks.create({
                parentId: '1', // 书签栏
                title: `AI分类-${new Date().toLocaleDateString()}`
            });
            
            addLogEntry(`创建主文件夹: ${mainFolder.title}`, 'success');
            
            let organizedCount = 0;
            
            for (const [categoryName, bookmarks] of Object.entries(categories)) {
                if (bookmarks.length === 0) continue;
                
                // 创建分类文件夹
                const categoryFolder = await chrome.bookmarks.create({
                    parentId: mainFolder.id,
                    title: categoryName
                });
                
                addLogEntry(`创建分类文件夹: ${categoryName} (${bookmarks.length}个书签)`, 'info');
                
                // 移动书签到分类文件夹
                for (const bookmark of bookmarks) {
                    try {
                        // 查找原始书签
                        const searchResults = await chrome.bookmarks.search({ url: bookmark.url });
                        
                        if (searchResults.length > 0) {
                            const originalBookmark = searchResults[0];
                            
                            // 移动书签
                            await chrome.bookmarks.move(originalBookmark.id, {
                                parentId: categoryFolder.id
                            });
                            
                            organizedCount++;
                        }
                    } catch (moveError) {
                        addLogEntry(`移动书签失败: ${bookmark.title} - ${moveError.message}`, 'warning');
                    }
                }
            }
            
            addLogEntry(`书签组织完成！共组织了 ${organizedCount} 个书签`, 'success');
            showNotification(`组织完成，共处理 ${organizedCount} 个书签`, 'success');
            
        } catch (error) {
            addLogEntry(`组织书签失败: ${error.message}`, 'error');
            showNotification('组织失败', 'error');
        }
    }
    
    // --- 书签管理器功能 ---
    let bookmarkTree = null;
    let selectedBookmarks = new Set();
    let isManagerInitialized = false;
    
    // 初始化书签管理器
    async function initializeBookmarkManager() {
        if (isManagerInitialized) return;
        
        try {
            addLogEntry('初始化书签管理器...', 'info');
            
            // 获取完整书签树
            bookmarkTree = await chrome.bookmarks.getTree();
            
            // 渲染书签树
            renderBookmarkTree();
            
            // 绑定事件监听器
            bindManagerEvents();
            
            isManagerInitialized = true;
            addLogEntry('书签管理器初始化完成', 'success');
            
        } catch (error) {
            addLogEntry(`初始化书签管理器失败: ${error.message}`, 'error');
        }
    }
    
    // 渲染书签树
    function renderBookmarkTree() {
        const container = document.getElementById('bookmark-tree');
        if (!container || !bookmarkTree) return;
        
        container.innerHTML = '';
        
        // 渲染根节点（跳过第一层，直接显示书签栏等）
        bookmarkTree[0].children.forEach(rootFolder => {
            const folderElement = createFolderElement(rootFolder, 0);
            container.appendChild(folderElement);
        });
    }
    
    // 创建文件夹元素
    function createFolderElement(folder, depth) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'bookmark-folder';
        folderDiv.style.marginLeft = `${depth * 20}px`;
        folderDiv.dataset.folderId = folder.id;
        
        // 文件夹头部
        const headerDiv = document.createElement('div');
        headerDiv.className = 'folder-header';
        headerDiv.innerHTML = `
            <div class="folder-toggle" data-folder-id="${folder.id}">
                <i data-lucide="chevron-right"></i>
            </div>
            <div class="folder-icon">
                <i data-lucide="folder"></i>
            </div>
            <div class="folder-title" contenteditable="false">${folder.title}</div>
            <div class="folder-count">(${countBookmarksInFolder(folder)})</div>
            <div class="folder-actions">
                <button class="action-btn" data-action="rename" data-folder-id="${folder.id}">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="action-btn" data-action="delete" data-folder-id="${folder.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        folderDiv.appendChild(headerDiv);
        
        // 文件夹内容
        const contentDiv = document.createElement('div');
        contentDiv.className = 'folder-content';
        contentDiv.style.display = 'none';
        
        // 添加子文件夹
        if (folder.children) {
            folder.children.forEach(child => {
                if (child.children) {
                    // 子文件夹
                    const childFolder = createFolderElement(child, depth + 1);
                    contentDiv.appendChild(childFolder);
                } else {
                    // 书签
                    const bookmarkElement = createBookmarkElement(child, depth + 1);
                    contentDiv.appendChild(bookmarkElement);
                }
            });
        }
        
        folderDiv.appendChild(contentDiv);
        return folderDiv;
    }
    
    // 创建书签元素
    function createBookmarkElement(bookmark, depth) {
        const bookmarkDiv = document.createElement('div');
        bookmarkDiv.className = 'bookmark-item';
        bookmarkDiv.style.marginLeft = `${depth * 20}px`;
        bookmarkDiv.dataset.bookmarkId = bookmark.id;
        
        bookmarkDiv.innerHTML = `
            <div class="bookmark-checkbox">
                <input type="checkbox" data-bookmark-id="${bookmark.id}">
            </div>
            <div class="bookmark-favicon">
                <img src="https://icons.duckduckgo.com/ip3/${new URL(bookmark.url).hostname}.ico" alt="" onerror="this.style.display='none'">
            </div>
            <div class="bookmark-title" contenteditable="false">${bookmark.title}</div>
            <div class="bookmark-url">${bookmark.url}</div>
            <div class="bookmark-actions">
                <button class="action-btn" data-action="edit" data-bookmark-id="${bookmark.id}">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="action-btn" data-action="delete" data-bookmark-id="${bookmark.id}">
                    <i data-lucide="trash-2"></i>
                </button>
                <button class="action-btn" data-action="open" data-url="${bookmark.url}">
                    <i data-lucide="external-link"></i>
                </button>
            </div>
        `;
        
        return bookmarkDiv;
    }
    
    // 计算文件夹中的书签数量
    function countBookmarksInFolder(folder) {
        if (!folder.children) return 0;
        
        let count = 0;
        folder.children.forEach(child => {
            if (child.children) {
                count += countBookmarksInFolder(child);
            } else {
                count++;
            }
        });
        return count;
    }
    
    // 绑定管理器事件
    function bindManagerEvents() {
        const container = document.getElementById('bookmark-tree');
        if (!container) return;
        
        // 文件夹展开/折叠
        container.addEventListener('click', (e) => {
            if (e.target.closest('.folder-toggle')) {
                const folderId = e.target.closest('.folder-toggle').dataset.folderId;
                toggleFolder(folderId);
            }
            
            // 书签选择
            if (e.target.type === 'checkbox') {
                const bookmarkId = e.target.dataset.bookmarkId;
                if (e.target.checked) {
                    selectedBookmarks.add(bookmarkId);
                } else {
                    selectedBookmarks.delete(bookmarkId);
                }
                updateSelectionCount();
            }
            
            // 操作按钮
            if (e.target.closest('.action-btn')) {
                const btn = e.target.closest('.action-btn');
                const action = btn.dataset.action;
                
                if (action === 'rename') {
                    const folderId = btn.dataset.folderId;
                    renameFolder(folderId);
                } else if (action === 'delete') {
                    const folderId = btn.dataset.folderId;
                    const bookmarkId = btn.dataset.bookmarkId;
                    if (folderId) {
                        deleteFolder(folderId);
                    } else if (bookmarkId) {
                        deleteBookmark(bookmarkId);
                    }
                } else if (action === 'edit') {
                    const bookmarkId = btn.dataset.bookmarkId;
                    editBookmark(bookmarkId);
                } else if (action === 'open') {
                    const url = btn.dataset.url;
                    window.open(url, '_blank');
                }
            }
        });
        
        // 工具栏按钮
        document.getElementById('expand-all-folders-btn')?.addEventListener('click', expandAllFolders);
        document.getElementById('collapse-all-folders-btn')?.addEventListener('click', collapseAllFolders);
        document.getElementById('create-folder-btn')?.addEventListener('click', createNewFolder);
        document.getElementById('refresh-manager-btn')?.addEventListener('click', refreshManager);
        
        // 批量操作按钮
        document.getElementById('batch-delete-btn')?.addEventListener('click', batchDeleteBookmarks);
        document.getElementById('batch-rename-btn')?.addEventListener('click', batchRenameBookmarks);
        document.getElementById('batch-move-btn')?.addEventListener('click', batchMoveBookmarks);
        document.getElementById('batch-export-btn')?.addEventListener('click', batchExportBookmarks);
        document.getElementById('select-all-btn')?.addEventListener('click', selectAllBookmarks);
        document.getElementById('deselect-all-btn')?.addEventListener('click', deselectAllBookmarks);
    }
    
    // 切换文件夹展开状态
    function toggleFolder(folderId) {
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (!folderElement) return;
        
        const content = folderElement.querySelector('.folder-content');
        const toggle = folderElement.querySelector('.folder-toggle i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.setAttribute('data-lucide', 'chevron-down');
        } else {
            content.style.display = 'none';
            toggle.setAttribute('data-lucide', 'chevron-right');
        }
        
        // 重新创建图标
        lucide.createIcons();
    }
    
    // 展开所有文件夹
    function expandAllFolders() {
        document.querySelectorAll('.folder-content').forEach(content => {
            content.style.display = 'block';
        });
        document.querySelectorAll('.folder-toggle i').forEach(icon => {
            icon.setAttribute('data-lucide', 'chevron-down');
        });
        lucide.createIcons();
    }
    
    // 折叠所有文件夹
    function collapseAllFolders() {
        document.querySelectorAll('.folder-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelectorAll('.folder-toggle i').forEach(icon => {
            icon.setAttribute('data-lucide', 'chevron-right');
        });
        lucide.createIcons();
    }
    
    // 更新选择计数
    function updateSelectionCount() {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = `已选择 ${selectedBookmarks.size} 项`;
        }
        
        // 显示/隐藏批量操作工具栏
        const batchOps = document.getElementById('batch-operations');
        if (batchOps) {
            batchOps.style.display = selectedBookmarks.size > 0 ? 'block' : 'none';
        }
    }
    
    // 创建新文件夹
    async function createNewFolder() {
        const name = prompt('请输入文件夹名称:');
        if (!name) return;
        
        try {
            const folder = await chrome.bookmarks.create({
                parentId: '1', // 书签栏
                title: name
            });
            
            addLogEntry(`创建文件夹成功: ${name}`, 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`创建文件夹失败: ${error.message}`, 'error');
        }
    }
    
    // 刷新管理器
    async function refreshManager() {
        isManagerInitialized = false;
        selectedBookmarks.clear();
        await initializeBookmarkManager();
    }
    
    // 重命名文件夹
    async function renameFolder(folderId) {
        const newName = prompt('请输入新的文件夹名称:');
        if (!newName) return;
        
        try {
            await chrome.bookmarks.update(folderId, { title: newName });
            addLogEntry(`重命名文件夹成功: ${newName}`, 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`重命名文件夹失败: ${error.message}`, 'error');
        }
    }
    
    // 删除文件夹
    async function deleteFolder(folderId) {
        if (!confirm('确定要删除这个文件夹吗？这将删除其中的所有书签。')) return;
        
        try {
            await chrome.bookmarks.removeTree(folderId);
            addLogEntry('删除文件夹成功', 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`删除文件夹失败: ${error.message}`, 'error');
        }
    }
    
    // 编辑书签
    async function editBookmark(bookmarkId) {
        try {
            const bookmark = await chrome.bookmarks.get(bookmarkId);
            const newTitle = prompt('请输入新的书签标题:', bookmark[0].title);
            const newUrl = prompt('请输入新的书签URL:', bookmark[0].url);
            
            if (newTitle !== null && newUrl !== null) {
                await chrome.bookmarks.update(bookmarkId, {
                    title: newTitle,
                    url: newUrl
                });
                addLogEntry('编辑书签成功', 'success');
                refreshManager();
            }
        } catch (error) {
            addLogEntry(`编辑书签失败: ${error.message}`, 'error');
        }
    }
    
    // 删除书签
    async function deleteBookmark(bookmarkId) {
        if (!confirm('确定要删除这个书签吗？')) return;
        
        try {
            await chrome.bookmarks.remove(bookmarkId);
            addLogEntry('删除书签成功', 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`删除书签失败: ${error.message}`, 'error');
        }
    }
    
    // 批量删除书签
    async function batchDeleteBookmarks() {
        if (selectedBookmarks.size === 0) {
            showNotification('请先选择要删除的书签', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${selectedBookmarks.size} 个书签吗？`)) return;
        
        try {
            for (const bookmarkId of selectedBookmarks) {
                await chrome.bookmarks.remove(bookmarkId);
            }
            
            addLogEntry(`批量删除 ${selectedBookmarks.size} 个书签成功`, 'success');
            selectedBookmarks.clear();
            refreshManager();
        } catch (error) {
            addLogEntry(`批量删除失败: ${error.message}`, 'error');
        }
    }
    
    // 批量重命名书签
    async function batchRenameBookmarks() {
        if (selectedBookmarks.size === 0) {
            showNotification('请先选择要重命名的书签', 'warning');
            return;
        }
        
        const prefix = prompt('请输入要添加的前缀（留空则不添加）:') || '';
        const suffix = prompt('请输入要添加的后缀（留空则不添加）:') || '';
        
        if (!prefix && !suffix) return;
        
        try {
            for (const bookmarkId of selectedBookmarks) {
                const bookmark = await chrome.bookmarks.get(bookmarkId);
                const newTitle = prefix + bookmark[0].title + suffix;
                await chrome.bookmarks.update(bookmarkId, { title: newTitle });
            }
            
            addLogEntry(`批量重命名 ${selectedBookmarks.size} 个书签成功`, 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`批量重命名失败: ${error.message}`, 'error');
        }
    }
    
    // 批量移动书签
    async function batchMoveBookmarks() {
        if (selectedBookmarks.size === 0) {
            showNotification('请先选择要移动的书签', 'warning');
            return;
        }
        
        // 简化版：移动到书签栏
        if (!confirm(`确定要将选中的 ${selectedBookmarks.size} 个书签移动到书签栏吗？`)) return;
        
        try {
            for (const bookmarkId of selectedBookmarks) {
                await chrome.bookmarks.move(bookmarkId, { parentId: '1' });
            }
            
            addLogEntry(`批量移动 ${selectedBookmarks.size} 个书签成功`, 'success');
            refreshManager();
        } catch (error) {
            addLogEntry(`批量移动失败: ${error.message}`, 'error');
        }
    }
    
    // 批量导出书签
    async function batchExportBookmarks() {
        if (selectedBookmarks.size === 0) {
            showNotification('请先选择要导出的书签', 'warning');
            return;
        }
        
        try {
            const exportData = [];
            
            for (const bookmarkId of selectedBookmarks) {
                const bookmark = await chrome.bookmarks.get(bookmarkId);
                exportData.push({
                    title: bookmark[0].title,
                    url: bookmark[0].url,
                    dateAdded: bookmark[0].dateAdded
                });
            }
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `selected-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry(`导出 ${selectedBookmarks.size} 个书签成功`, 'success');
        } catch (error) {
            addLogEntry(`批量导出失败: ${error.message}`, 'error');
        }
    }
    
    // 全选书签
    function selectAllBookmarks() {
        document.querySelectorAll('[data-bookmark-id] input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
            selectedBookmarks.add(checkbox.dataset.bookmarkId);
        });
        updateSelectionCount();
    }
    
    // 取消全选
    function deselectAllBookmarks() {
        document.querySelectorAll('[data-bookmark-id] input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedBookmarks.clear();
        updateSelectionCount();
    }
    
    // --- 重复书签检测功能 ---
    let duplicateBookmarks = [];
    let isDuplicateDetectionRunning = false;
    
    // 检测重复书签
    async function detectDuplicateBookmarks() {
        if (isDuplicateDetectionRunning) {
            showNotification('检测已在进行中', 'warning');
            return;
        }
        
        try {
            isDuplicateDetectionRunning = true;
            addLogEntry('开始检测重复书签...', 'info');
            
            // 获取所有书签
            const bookmarks = await getAllBookmarks();
            if (!bookmarks || bookmarks.length === 0) {
                addLogEntry('未找到任何书签', 'warning');
                return;
            }
            
            addLogEntry(`开始分析 ${bookmarks.length} 个书签...`, 'info');
            
            // 检测重复
            duplicateBookmarks = findDuplicates(bookmarks);
            
            if (duplicateBookmarks.length > 0) {
                addLogEntry(`检测完成！发现 ${duplicateBookmarks.length} 组重复书签`, 'warning');
                displayDuplicateResults();
                updateDuplicateBadge(duplicateBookmarks.length);
            } else {
                addLogEntry('检测完成，未发现重复书签', 'success');
                updateDuplicateBadge(0);
            }
            
        } catch (error) {
            addLogEntry(`检测重复书签失败: ${error.message}`, 'error');
        } finally {
            isDuplicateDetectionRunning = false;
        }
    }
    
    // 查找重复书签
    function findDuplicates(bookmarks) {
        const duplicateGroups = [];
        const urlMap = new Map();
        const titleMap = new Map();
        
        // 按URL分组
        bookmarks.forEach(bookmark => {
            const url = normalizeUrl(bookmark.url);
            if (!urlMap.has(url)) {
                urlMap.set(url, []);
            }
            urlMap.get(url).push(bookmark);
        });
        
        // 找出URL重复的组
        urlMap.forEach((group, url) => {
            if (group.length > 1) {
                duplicateGroups.push({
                    type: 'url',
                    key: url,
                    bookmarks: group,
                    count: group.length
                });
            }
        });
        
        // 按标题分组（排除已经URL重复的）
        const nonUrlDuplicates = bookmarks.filter(bookmark => {
            const url = normalizeUrl(bookmark.url);
            return !urlMap.has(url) || urlMap.get(url).length === 1;
        });
        
        nonUrlDuplicates.forEach(bookmark => {
            const title = normalizeTitle(bookmark.title);
            if (title && title.length > 3) { // 只检测有意义的标题
                if (!titleMap.has(title)) {
                    titleMap.set(title, []);
                }
                titleMap.get(title).push(bookmark);
            }
        });
        
        // 找出标题重复的组
        titleMap.forEach((group, title) => {
            if (group.length > 1) {
                duplicateGroups.push({
                    type: 'title',
                    key: title,
                    bookmarks: group,
                    count: group.length
                });
            }
        });
        
        return duplicateGroups;
    }
    
    // 标准化URL
    function normalizeUrl(url) {
        if (!url) return '';
        
        try {
            const urlObj = new URL(url);
            // 移除常见的查询参数
            urlObj.searchParams.delete('utm_source');
            urlObj.searchParams.delete('utm_medium');
            urlObj.searchParams.delete('utm_campaign');
            urlObj.searchParams.delete('utm_content');
            urlObj.searchParams.delete('utm_term');
            urlObj.searchParams.delete('ref');
            urlObj.searchParams.delete('source');
            
            // 移除片段标识符
            urlObj.hash = '';
            
            // 标准化协议
            if (urlObj.protocol === 'https:') {
                urlObj.protocol = 'https:';
            } else if (urlObj.protocol === 'http:') {
                urlObj.protocol = 'http:';
            }
            
            return urlObj.toString().toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }
    
    // 标准化标题
    function normalizeTitle(title) {
        if (!title) return '';
        
        return title
            .toLowerCase()
            .trim()
            .replace(/[\s\-_]+/g, ' ') // 统一空格和分隔符
            .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 移除特殊字符，保留中文
            .replace(/\s+/g, ' '); // 合并多个空格
    }
    
    // 显示重复检测结果
    function displayDuplicateResults() {
        const resultsSection = document.getElementById('duplicate-results');
        const listContainer = document.getElementById('duplicate-list');
        
        if (!resultsSection || !listContainer) return;
        
        resultsSection.style.display = 'block';
        listContainer.innerHTML = '';
        
        duplicateBookmarks.forEach((group, index) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'duplicate-group';
            groupDiv.innerHTML = `
                <div class="duplicate-group-header">
                    <div class="duplicate-group-info">
                        <span class="duplicate-type">${group.type === 'url' ? 'URL重复' : '标题重复'}</span>
                        <span class="duplicate-count">${group.count} 个重复项</span>
                        <span class="duplicate-key">${group.key}</span>
                    </div>
                    <div class="duplicate-group-actions">
                        <button class="action-btn" data-action="select-duplicate-group" data-index="${index}">
                            <i data-lucide="check-square"></i> 全选
                        </button>
                        <button class="action-btn" data-action="remove-duplicate-group" data-index="${index}">
                            <i data-lucide="trash-2"></i> 删除组
                        </button>
                    </div>
                </div>
                <div class="duplicate-items">
                    ${group.bookmarks.map((bookmark, bookmarkIndex) => `
                        <div class="duplicate-item">
                            <div class="duplicate-checkbox">
                                <input type="checkbox" data-group="${index}" data-bookmark="${bookmarkIndex}" data-bookmark-id="${bookmark.id}">
                            </div>
                            <div class="duplicate-favicon">
                                <img src="https://icons.duckduckgo.com/ip3/${new URL(bookmark.url).hostname}.ico" alt="" onerror="this.style.display='none'">
                            </div>
                            <div class="duplicate-info">
                                <div class="duplicate-title">${bookmark.title}</div>
                                <div class="duplicate-url">${bookmark.url}</div>
                                <div class="duplicate-meta">添加时间: ${new Date(bookmark.dateAdded).toLocaleString()}</div>
                            </div>
                            <div class="duplicate-actions">
                                <button class="action-btn" data-action="open-bookmark" data-url="${bookmark.url}">
                                    <i data-lucide="external-link"></i>
                                </button>
                                <button class="action-btn" data-action="remove-single-duplicate" data-id="${bookmark.id}">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            listContainer.appendChild(groupDiv);
        });
        
        // 显示删除按钮
        const removeBtn = document.getElementById('remove-duplicates-btn');
        if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
        }
        
        // 重新创建图标
        lucide.createIcons();
    }
    
    // 更新重复书签徽章
    function updateDuplicateBadge(count) {
        const badge = document.getElementById('duplicate-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    // 选择重复组
    function selectDuplicateGroup(groupIndex) {
        const checkboxes = document.querySelectorAll(`input[data-group="${groupIndex}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // 删除重复组
    async function removeDuplicateGroup(groupIndex) {
        const group = duplicateBookmarks[groupIndex];
        if (!group) return;
        
        if (!confirm(`确定要删除这组 ${group.count} 个重复书签吗？将保留最新的一个。`)) return;
        
        try {
            // 按添加时间排序，保留最新的
            const sortedBookmarks = group.bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
            
            // 删除除了最新的之外的所有书签
            for (let i = 1; i < sortedBookmarks.length; i++) {
                await chrome.bookmarks.remove(sortedBookmarks[i].id);
            }
            
            addLogEntry(`删除重复组成功，保留了最新的书签: ${sortedBookmarks[0].title}`, 'success');
            
            // 重新检测
            await detectDuplicateBookmarks();
            
        } catch (error) {
            addLogEntry(`删除重复组失败: ${error.message}`, 'error');
        }
    }
    
    // 删除单个重复书签
    async function removeSingleDuplicate(bookmarkId) {
        if (!confirm('确定要删除这个书签吗？')) return;
        
        try {
            await chrome.bookmarks.remove(bookmarkId);
            addLogEntry('删除重复书签成功', 'success');
            
            // 重新检测
            await detectDuplicateBookmarks();
            
        } catch (error) {
            addLogEntry(`删除书签失败: ${error.message}`, 'error');
        }
    }
    
    // 批量删除选中的重复书签
    async function removeSelectedDuplicates() {
        const selectedCheckboxes = document.querySelectorAll('#duplicate-list input[type="checkbox"]:checked');
        
        if (selectedCheckboxes.length === 0) {
            showNotification('请先选择要删除的重复书签', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个重复书签吗？`)) return;
        
        try {
            for (const checkbox of selectedCheckboxes) {
                const bookmarkId = checkbox.dataset.bookmarkId;
                await chrome.bookmarks.remove(bookmarkId);
            }
            
            addLogEntry(`批量删除 ${selectedCheckboxes.length} 个重复书签成功`, 'success');
            
            // 重新检测
            await detectDuplicateBookmarks();
            
        } catch (error) {
            addLogEntry(`批量删除失败: ${error.message}`, 'error');
        }
    }
    
    // 全选重复书签
    function selectAllDuplicates() {
        document.querySelectorAll('#duplicate-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // 取消全选重复书签
    function deselectAllDuplicates() {
        document.querySelectorAll('#duplicate-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // 打开书签
    function openBookmark(url) {
        window.open(url, '_blank');
    }
    
    // --- 失效书签检测功能 ---
    let invalidBookmarks = [];
    let isInvalidDetectionRunning = false;
    
    // 检测失效书签
    async function detectInvalidBookmarks() {
        if (isInvalidDetectionRunning) {
            showNotification('检测已在进行中', 'warning');
            return;
        }
        
        try {
            isInvalidDetectionRunning = true;
            addLogEntry('开始检测失效书签...', 'info');
            
            // 获取所有书签
            const bookmarks = await getAllBookmarks();
            if (!bookmarks || bookmarks.length === 0) {
                addLogEntry('未找到任何书签', 'warning');
                return;
            }
            
            addLogEntry(`开始检测 ${bookmarks.length} 个书签...`, 'info');
            
            // 检测失效链接
            invalidBookmarks = [];
            const batchSize = 10; // 每次检测10个，避免过多并发请求
            
            for (let i = 0; i < bookmarks.length; i += batchSize) {
                const batch = bookmarks.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map(bookmark => checkBookmarkValidity(bookmark))
                );
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        invalidBookmarks.push(result.value);
                    }
                });
                
                // 更新进度
                const progress = Math.min(100, ((i + batchSize) / bookmarks.length) * 100);
                addLogEntry(`检测进度: ${Math.round(progress)}% (${Math.min(i + batchSize, bookmarks.length)}/${bookmarks.length})`, 'info');
                
                // 防止过快请求
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (invalidBookmarks.length > 0) {
                addLogEntry(`检测完成！发现 ${invalidBookmarks.length} 个失效书签`, 'warning');
                displayInvalidResults();
                updateInvalidBadge(invalidBookmarks.length);
            } else {
                addLogEntry('检测完成，所有书签都是有效的', 'success');
                updateInvalidBadge(0);
            }
            
        } catch (error) {
            addLogEntry(`检测失效书签失败: ${error.message}`, 'error');
        } finally {
            isInvalidDetectionRunning = false;
        }
    }
    
    // 检查单个书签的有效性
    async function checkBookmarkValidity(bookmark) {
        try {
            // 检查URL格式
            if (!bookmark.url || !isValidUrl(bookmark.url)) {
                return {
                    ...bookmark,
                    reason: 'URL格式无效',
                    status: 'invalid_format'
                };
            }
            
            // 检查是否为本地文件或特殊协议
            const url = bookmark.url.toLowerCase();
            if (url.startsWith('file://') || 
                url.startsWith('chrome://') || 
                url.startsWith('chrome-extension://') ||
                url.startsWith('about:') ||
                url.startsWith('data:')) {
                return null; // 跳过特殊协议
            }
            
            // HTTP检查
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            try {
                const response = await fetch(bookmark.url, {
                    method: 'HEAD',
                    signal: controller.signal,
                    mode: 'no-cors' // 避免CORS问题
                });
                
                clearTimeout(timeoutId);
                
                // 检查响应状态
                if (response.status >= 400) {
                    return {
                        ...bookmark,
                        reason: `HTTP ${response.status} ${response.statusText}`,
                        status: 'http_error'
                    };
                }
                
                return null; // 有效
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    return {
                        ...bookmark,
                        reason: '请求超时',
                        status: 'timeout'
                    };
                }
                
                // 网络错误或DNS解析失败
                return {
                    ...bookmark,
                    reason: '网络错误或域名无法解析',
                    status: 'network_error'
                };
            }
            
        } catch (error) {
            return {
                ...bookmark,
                reason: `检查失败: ${error.message}`,
                status: 'check_failed'
            };
        }
    }
    
    // 验证URL格式
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }
    
    // 显示失效检测结果
    function displayInvalidResults() {
        const resultsSection = document.getElementById('invalid-results');
        const listContainer = document.getElementById('invalid-list');
        
        if (!resultsSection || !listContainer) return;
        
        resultsSection.style.display = 'block';
        listContainer.innerHTML = '';
        
        // 按失效类型分组
        const groupedInvalid = invalidBookmarks.reduce((groups, bookmark) => {
            const type = bookmark.status || 'unknown';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(bookmark);
            return groups;
        }, {});
        
        Object.entries(groupedInvalid).forEach(([type, bookmarks]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'invalid-group';
            
            const typeNames = {
                'invalid_format': 'URL格式错误',
                'http_error': 'HTTP错误',
                'timeout': '请求超时',
                'network_error': '网络错误',
                'check_failed': '检查失败',
                'unknown': '未知错误'
            };
            
            groupDiv.innerHTML = `
                <div class="invalid-group-header">
                    <div class="invalid-group-info">
                        <span class="invalid-type">${typeNames[type] || type}</span>
                        <span class="invalid-count">${bookmarks.length} 个失效项</span>
                    </div>
                    <div class="invalid-group-actions">
                        <button class="action-btn" data-action="select-invalid-group" data-type="${type}">
                            <i data-lucide="check-square"></i> 全选
                        </button>
                        <button class="action-btn" data-action="remove-invalid-group" data-type="${type}">
                            <i data-lucide="trash-2"></i> 删除组
                        </button>
                    </div>
                </div>
                <div class="invalid-items">
                    ${bookmarks.map(bookmark => `
                        <div class="invalid-item">
                            <div class="invalid-checkbox">
                                <input type="checkbox" data-bookmark-id="${bookmark.id}" data-type="${type}">
                            </div>
                            <div class="invalid-favicon">
                                <img src="https://icons.duckduckgo.com/ip3/${new URL(bookmark.url).hostname}.ico" alt="" onerror="this.style.display='none'">
                            </div>
                            <div class="invalid-info">
                                <div class="invalid-title">${bookmark.title}</div>
                                <div class="invalid-url">${bookmark.url}</div>
                                <div class="invalid-reason">失效原因: ${bookmark.reason}</div>
                                <div class="invalid-meta">添加时间: ${new Date(bookmark.dateAdded).toLocaleString()}</div>
                            </div>
                            <div class="invalid-actions">
                                <button class="action-btn" data-action="open-bookmark" data-url="${bookmark.url}">
                                    <i data-lucide="external-link"></i>
                                </button>
                                <button class="action-btn" data-action="remove-single-invalid" data-id="${bookmark.id}">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            listContainer.appendChild(groupDiv);
        });
        
        // 显示删除按钮
        const removeBtn = document.getElementById('remove-invalid-btn');
        if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
        }
        
        // 重新创建图标
        lucide.createIcons();
    }
    
    // 更新失效书签徽章
    function updateInvalidBadge(count) {
        const badge = document.getElementById('invalid-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    // 选择失效组
    function selectInvalidGroup(type) {
        document.querySelectorAll(`input[data-type="${type}"]`).forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // 删除失效组
    async function removeInvalidGroup(type) {
        const bookmarksToRemove = invalidBookmarks.filter(b => b.status === type);
        
        if (!confirm(`确定要删除所有 "${type}" 类型的 ${bookmarksToRemove.length} 个失效书签吗？`)) return;
        
        try {
            for (const bookmark of bookmarksToRemove) {
                await chrome.bookmarks.remove(bookmark.id);
            }
            
            addLogEntry(`删除 ${bookmarksToRemove.length} 个失效书签成功`, 'success');
            
            // 重新检测
            await detectInvalidBookmarks();
            
        } catch (error) {
            addLogEntry(`删除失效组失败: ${error.message}`, 'error');
        }
    }
    
    // 删除单个失效书签
    async function removeSingleInvalid(bookmarkId) {
        if (!confirm('确定要删除这个失效书签吗？')) return;
        
        try {
            await chrome.bookmarks.remove(bookmarkId);
            addLogEntry('删除失效书签成功', 'success');
            
            // 重新检测
            await detectInvalidBookmarks();
            
        } catch (error) {
            addLogEntry(`删除书签失败: ${error.message}`, 'error');
        }
    }
    
    // 批量删除选中的失效书签
    async function removeSelectedInvalid() {
        const selectedCheckboxes = document.querySelectorAll('#invalid-list input[type="checkbox"]:checked');
        
        if (selectedCheckboxes.length === 0) {
            showNotification('请先选择要删除的失效书签', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个失效书签吗？`)) return;
        
        try {
            for (const checkbox of selectedCheckboxes) {
                const bookmarkId = checkbox.dataset.bookmarkId;
                await chrome.bookmarks.remove(bookmarkId);
            }
            
            addLogEntry(`批量删除 ${selectedCheckboxes.length} 个失效书签成功`, 'success');
            
            // 重新检测
            await detectInvalidBookmarks();
            
        } catch (error) {
            addLogEntry(`批量删除失败: ${error.message}`, 'error');
        }
    }
    
    // 全选失效书签
    function selectAllInvalid() {
        document.querySelectorAll('#invalid-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // 取消全选失效书签
    function deselectAllInvalid() {
        document.querySelectorAll('#invalid-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // --- 空文件夹检测功能 ---
    let emptyFolders = [];
    let isEmptyFolderDetectionRunning = false;
    
    // 检测空文件夹
    async function detectEmptyFolders() {
        if (isEmptyFolderDetectionRunning) {
            showNotification('检测已在进行中', 'warning');
            return;
        }
        
        try {
            isEmptyFolderDetectionRunning = true;
            addLogEntry('开始检测空文件夹...', 'info');
            
            // 获取完整书签树
            const bookmarkTree = await chrome.bookmarks.getTree();
            if (!bookmarkTree || bookmarkTree.length === 0) {
                addLogEntry('获取书签树失败', 'error');
                return;
            }
            
            emptyFolders = [];
            
            // 递归检查所有文件夹
            function checkFolderRecursively(folder, path = '') {
                if (!folder.children) return; // 不是文件夹
                
                const currentPath = path ? `${path}/${folder.title}` : folder.title;
                
                // 检查子文件夹
                folder.children.forEach(child => {
                    if (child.children) {
                        checkFolderRecursively(child, currentPath);
                    }
                });
                
                // 检查当前文件夹是否为空
                if (isEmpty(folder) && folder.id !== '0') { // 排除根节点
                    emptyFolders.push({
                        ...folder,
                        path: currentPath,
                        depth: path.split('/').length
                    });
                }
            }
            
            // 从根节点开始检查
            bookmarkTree[0].children?.forEach(rootFolder => {
                checkFolderRecursively(rootFolder);
            });
            
            if (emptyFolders.length > 0) {
                addLogEntry(`检测完成！发现 ${emptyFolders.length} 个空文件夹`, 'warning');
                displayEmptyFolderResults();
            } else {
                addLogEntry('检测完成，未发现空文件夹', 'success');
            }
            
        } catch (error) {
            addLogEntry(`检测空文件夹失败: ${error.message}`, 'error');
        } finally {
            isEmptyFolderDetectionRunning = false;
        }
    }
    
    // 检查文件夹是否为空
    function isEmpty(folder) {
        if (!folder.children || folder.children.length === 0) {
            return true;
        }
        
        // 检查是否只包含空文件夹
        return folder.children.every(child => {
            if (child.children) {
                return isEmpty(child); // 递归检查子文件夹
            }
            return false; // 包含书签，不为空
        });
    }
    
    // 显示空文件夹检测结果
    function displayEmptyFolderResults() {
        const resultsSection = document.getElementById('empty-folders-results');
        const listContainer = document.getElementById('empty-folders-list');
        
        if (!resultsSection || !listContainer) return;
        
        resultsSection.style.display = 'block';
        listContainer.innerHTML = '';
        
        // 按深度排序，从最深层开始显示
        const sortedFolders = emptyFolders.sort((a, b) => b.depth - a.depth);
        
        sortedFolders.forEach(folder => {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'empty-folder-item';
            folderDiv.innerHTML = `
                <div class="empty-folder-checkbox">
                    <input type="checkbox" data-folder-id="${folder.id}">
                </div>
                <div class="empty-folder-icon">
                    <i data-lucide="folder-x"></i>
                </div>
                <div class="empty-folder-info">
                    <div class="empty-folder-name">${folder.title}</div>
                    <div class="empty-folder-path">${folder.path}</div>
                    <div class="empty-folder-meta">添加时间: ${new Date(folder.dateAdded).toLocaleString()}</div>
                </div>
                <div class="empty-folder-actions">
                    <button class="action-btn" data-action="remove-single-empty-folder" data-id="${folder.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            
            listContainer.appendChild(folderDiv);
        });
        
        // 显示删除按钮
        const removeBtn = document.getElementById('remove-empty-folders-btn');
        if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
        }
        
        // 重新创建图标
        lucide.createIcons();
    }
    
    // 删除单个空文件夹
    async function removeSingleEmptyFolder(folderId) {
        if (!confirm('确定要删除这个空文件夹吗？')) return;
        
        try {
            await chrome.bookmarks.removeTree(folderId);
            addLogEntry('删除空文件夹成功', 'success');
            
            // 重新检测
            await detectEmptyFolders();
            
        } catch (error) {
            addLogEntry(`删除空文件夹失败: ${error.message}`, 'error');
        }
    }
    
    // 批量删除选中的空文件夹
    async function removeSelectedEmptyFolders() {
        const selectedCheckboxes = document.querySelectorAll('#empty-folders-list input[type="checkbox"]:checked');
        
        if (selectedCheckboxes.length === 0) {
            showNotification('请先选择要删除的空文件夹', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个空文件夹吗？`)) return;
        
        try {
            for (const checkbox of selectedCheckboxes) {
                const folderId = checkbox.dataset.folderId;
                await chrome.bookmarks.removeTree(folderId);
            }
            
            addLogEntry(`批量删除 ${selectedCheckboxes.length} 个空文件夹成功`, 'success');
            
            // 重新检测
            await detectEmptyFolders();
            
        } catch (error) {
            addLogEntry(`批量删除失败: ${error.message}`, 'error');
        }
    }
    
    // 全选空文件夹
    function selectAllEmptyFolders() {
        document.querySelectorAll('#empty-folders-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // 取消全选空文件夹
    function deselectAllEmptyFolders() {
        document.querySelectorAll('#empty-folders-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // --- 导入导出功能 ---
    
    // 导出全部书签为备份
    async function exportBookmarksBackup() {
        try {
            addLogEntry('开始导出书签备份...', 'info');
            
            const bookmarkTree = await chrome.bookmarks.getTree();
            const exportData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    version: '1.0',
                    type: 'full_backup'
                },
                bookmarks: bookmarkTree
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('书签备份导出成功', 'success');
            showNotification('导出成功', 'success');
            
        } catch (error) {
            addLogEntry(`导出失败: ${error.message}`, 'error');
            showNotification('导出失败', 'error');
        }
    }
    
    // 导出AI分类为CSV
    function exportAiCategoriesAsCSV() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('没有AI分类结果可导出', 'warning');
            return;
        }
        
        try {
            let csvContent = 'Category,Title,URL,Date Added\n';
            
            Object.entries(categories).forEach(([categoryName, bookmarks]) => {
                bookmarks.forEach(bookmark => {
                    const escapedTitle = `"${bookmark.title.replace(/"/g, '""')}"`;
                    const escapedCategory = `"${categoryName.replace(/"/g, '""')}"`;
                    csvContent += `${escapedCategory},${escapedTitle},${bookmark.url},${new Date(bookmark.dateAdded).toISOString()}\n`;
                });
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ai-categories-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('AI分类结果CSV导出成功', 'success');
            showNotification('导出成功', 'success');
            
        } catch (error) {
            addLogEntry(`导出失败: ${error.message}`, 'error');
            showNotification('导出失败', 'error');
        }
    }
    
    // 自定义导出
    async function customExport() {
        const format = prompt('请选择导出格式:\n1. JSON\n2. CSV\n3. HTML', '1');
        
        if (!format || !['1', '2', '3'].includes(format)) return;
        
        try {
            const bookmarks = await getAllBookmarks();
            if (!bookmarks || bookmarks.length === 0) {
                showNotification('没有书签可导出', 'warning');
                return;
            }
            
            let content, mimeType, extension;
            
            switch (format) {
                case '1': // JSON
                    content = JSON.stringify(bookmarks, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                    
                case '2': // CSV
                    content = 'Title,URL,Date Added\n';
                    bookmarks.forEach(bookmark => {
                        const escapedTitle = `"${bookmark.title.replace(/"/g, '""')}"`;
                        content += `${escapedTitle},${bookmark.url},${new Date(bookmark.dateAdded).toISOString()}\n`;
                    });
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;
                    
                case '3': // HTML
                    content = `<!DOCTYPE html>
<html>
<head>
    <title>Bookmarks Export</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Bookmarks (${bookmarks.length} items)</h1>
    <ul>
`;
                    bookmarks.forEach(bookmark => {
                        content += `        <li><a href="${bookmark.url}">${bookmark.title}</a></li>\n`;
                    });
                    content += '    </ul>\n</body>\n</html>';
                    mimeType = 'text/html';
                    extension = 'html';
                    break;
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.${extension}`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry(`自定义导出成功 (${extension.toUpperCase()})`, 'success');
            showNotification('导出成功', 'success');
            
        } catch (error) {
            addLogEntry(`自定义导出失败: ${error.message}`, 'error');
            showNotification('导出失败', 'error');
        }
    }
    
    // 导出页面导航函数
    window.switchToSection = switchToSection;
    
    // 导出备份恢复函数
    window.createBackup = createBackup;
    window.restoreBackup = restoreBackup;
    window.manageBackups = manageBackups;
    
    // 导出报告生成函数
    window.viewDuplicateReport = viewDuplicateReport;
    window.viewInvalidReport = viewInvalidReport;
    window.viewCleanupReport = viewCleanupReport;
    window.generateComprehensiveReport = generateComprehensiveReport;
    
    // --- 缺失的基础函数实现 ---
    
    // 检查API状态
    async function checkApiStatus() {
        try {
            const settings = await getApiSettings();
            const statusElement = document.getElementById('api-status');
            
            if (settings && settings.apiKey) {
                if (statusElement) {
                    statusElement.textContent = 'API已配置';
                    statusElement.className = 'status-success';
                }
                addLogEntry('API配置检查成功', 'success');
            } else {
                if (statusElement) {
                    statusElement.textContent = 'API未配置';
                    statusElement.className = 'status-warning';
                }
                addLogEntry('API未配置，请在设置中配置', 'warning');
            }
        } catch (error) {
            console.error('API状态检查失败:', error);
            addLogEntry(`API状态检查失败: ${error.message}`, 'error');
        }
    }
    
    // 打开书签
    function openBookmark(url) {
        if (url) {
            window.open(url, '_blank');
        }
    }
    
    // 切换分类项目显示
    function toggleCategoryItems(categoryName) {
        const itemsContainer = document.getElementById(`category-${categoryName}-items`);
        const toggleBtn = document.querySelector(`[data-category="${categoryName}"] .toggle-btn`);
        
        if (itemsContainer && toggleBtn) {
            const isVisible = itemsContainer.style.display !== 'none';
            itemsContainer.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? '▶' : '▼';
        }
    }
    
    // 导出AI分类
    function exportAiCategories() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('没有分类数据可导出', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(categories, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-categories-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        addLogEntry('AI分类导出成功', 'success');
        showNotification('导出成功', 'success');
    }
    
    // 导出AI分类为CSV
    function exportAiCategoriesAsCSV() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('没有分类数据可导出', 'warning');
            return;
        }
        
        let csvContent = '分类,书签标题,URL\n';
        
        for (const [categoryName, bookmarks] of Object.entries(categories)) {
            for (const bookmark of bookmarks) {
                csvContent += `"${categoryName}","${bookmark.title}","${bookmark.url}"\n`;
            }
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-categories-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        addLogEntry('AI分类CSV导出成功', 'success');
        showNotification('CSV导出成功', 'success');
    }
    
    // 导出书签备份
    async function exportBookmarksBackup() {
        try {
            const bookmarkTree = await chrome.bookmarks.getTree();
            const backupData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    version: '1.0',
                    type: 'full_backup'
                },
                bookmarks: bookmarkTree
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            addLogEntry('书签备份导出成功', 'success');
            showNotification('备份导出成功', 'success');
            
        } catch (error) {
            addLogEntry(`导出失败: ${error.message}`, 'error');
            showNotification('导出失败', 'error');
        }
    }
    
    // 组织书签到文件夹
    async function organizeBookmarksToFolders() {
        if (!categories || Object.keys(categories).length === 0) {
            showNotification('请先进行AI分析', 'warning');
            return;
        }
        
        const confirm = window.confirm('确定要根据AI分类结果组织书签吗？这将创建新的文件夹并移动书签。');
        if (!confirm) return;
        
        try {
            addLogEntry('开始组织书签到文件夹...', 'info');
            
            // 创建AI分类主文件夹
            const aiFolder = await chrome.bookmarks.create({
                parentId: '1', // 书签栏
                title: 'AI分类结果'
            });
            
            // 为每个分类创建子文件夹
            for (const [categoryName, bookmarks] of Object.entries(categories)) {
                const categoryFolder = await chrome.bookmarks.create({
                    parentId: aiFolder.id,
                    title: categoryName
                });
                
                // 移动书签到对应分类文件夹
                for (const bookmark of bookmarks) {
                    try {
                        await chrome.bookmarks.move(bookmark.id, {
                            parentId: categoryFolder.id
                        });
                    } catch (error) {
                        console.warn(`移动书签失败: ${bookmark.title}`, error);
                    }
                }
                
                addLogEntry(`分类 "${categoryName}" 组织完成 (${bookmarks.length} 个书签)`, 'success');
            }
            
            addLogEntry('书签组织完成', 'success');
            showNotification('书签组织成功', 'success');
            
        } catch (error) {
            addLogEntry(`组织书签失败: ${error.message}`, 'error');
            showNotification('组织失败', 'error');
        }
    }
    
    // 导出全局函数供HTML调用
    window.toggleCategoryItems = toggleCategoryItems;
    window.getAllBookmarks = getAllBookmarks;
    window.getApiSettings = getApiSettings;
    window.processBatchBookmarks = processBatchBookmarks;
    window.displayCategories = displayCategories;
    window.analyzeBookmarks = analyzeBookmarks;
    window.exportAiCategories = exportAiCategories;
    window.organizeBookmarksToFolders = organizeBookmarksToFolders;
    window.initializeBookmarkManager = initializeBookmarkManager;
    window.detectDuplicateBookmarks = detectDuplicateBookmarks;
    window.removeSelectedDuplicates = removeSelectedDuplicates;
    window.selectAllDuplicates = selectAllDuplicates;
    window.deselectAllDuplicates = deselectAllDuplicates;
    window.selectDuplicateGroup = selectDuplicateGroup;
    window.removeDuplicateGroup = removeDuplicateGroup;
    window.removeSingleDuplicate = removeSingleDuplicate;
    window.openBookmark = openBookmark;
    window.detectInvalidBookmarks = detectInvalidBookmarks;
    window.removeSelectedInvalid = removeSelectedInvalid;
    window.selectAllInvalid = selectAllInvalid;
    window.deselectAllInvalid = deselectAllInvalid;
    window.selectInvalidGroup = selectInvalidGroup;
    window.removeInvalidGroup = removeInvalidGroup;
    window.removeSingleInvalid = removeSingleInvalid;
    window.detectEmptyFolders = detectEmptyFolders;
    window.removeSelectedEmptyFolders = removeSelectedEmptyFolders;
    window.selectAllEmptyFolders = selectAllEmptyFolders;
    window.deselectAllEmptyFolders = deselectAllEmptyFolders;
    window.removeSingleEmptyFolder = removeSingleEmptyFolder;
    window.exportBookmarksBackup = exportBookmarksBackup;
    window.exportAiCategoriesAsCSV = exportAiCategoriesAsCSV;
    window.customExport = customExport;
    window.checkApiStatus = checkApiStatus;
    
    // --- 启动应用 ---
    initialize();
    
    // 初始化Lucide图标
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
});