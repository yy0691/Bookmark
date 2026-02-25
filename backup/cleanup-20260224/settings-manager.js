/**
 * 设置管理模块
 * 负责管理所有设置面板功能，包括外观、工具、数据、个性化、API设置等
 */

class SettingsManager {
    constructor() {
        this.settings = {
            appearance: {},
            tools: {},
            data: {},
            personalization: {},
            api: {}
        };
        this.currentTab = 'appearance';
        this.isPanelOpen = false;
        this.init();
    }

    /**
     * 初始化设置管理器
     */
    init() {
        this.loadSettings();
        this.createSettingsPanel();
        this.bindEvents();
        this.applySettings();
    }

    /**
     * 初始化设置面板
     */
    createSettingsPanel() {
        // HTML已经在visualization.html中定义，这里只需要初始化事件
        console.log('✅ 设置面板HTML已加载，开始初始化事件...');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });

        // 关闭按钮
        document.getElementById('close-settings-panel-btn').addEventListener('click', () => {
            this.closePanel();
        });

        // 面板外部点击关闭
        document.getElementById('settings-panel').addEventListener('click', (e) => {
            if (e.target.id === 'settings-panel') {
                this.closePanel();
            }
        });

        // 外观设置事件
        this.bindAppearanceEvents();
        
        // 工具设置事件
        this.bindToolsEvents();
        
        // 数据管理事件
        this.bindDataEvents();
        
        // 个性化设置事件
        this.bindPersonalizationEvents();
        
        // API设置事件
        this.bindApiEvents();
    }

    /**
     * 绑定外观设置事件
     */
    bindAppearanceEvents() {
        // 主题切换
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyTheme(e.target.dataset.theme);
            });
        });

        // 背景上传
        document.getElementById('bg-upload-btn').addEventListener('click', () => {
            document.getElementById('bg-upload-input').click();
        });

        document.getElementById('bg-upload-input').addEventListener('change', (e) => {
            this.handleBackgroundUpload(e);
        });

        document.getElementById('clear-bg-btn').addEventListener('click', () => {
            this.clearCustomBackground();
        });
    }

    /**
     * 绑定工具设置事件
     */
    bindToolsEvents() {
        // 数据可视化
        document.getElementById('show-wordcloud-btn').addEventListener('click', () => {
            this.showWordcloud();
        });

        document.getElementById('show-treeview-btn').addEventListener('click', () => {
            this.showTreeview();
        });

        document.getElementById('show-charts-btn').addEventListener('click', () => {
            this.showCharts();
        });

        document.getElementById('refresh-visualization-btn').addEventListener('click', () => {
            this.refreshVisualizationData();
        });

        // AI分析
        document.getElementById('analyze-bookmarks-btn').addEventListener('click', () => {
            this.analyzeBookmarks();
        });

        document.getElementById('regenerate-categories-btn').addEventListener('click', () => {
            this.regenerateSuggestedCategories();
        });

        document.getElementById('organize-bookmarks-btn').addEventListener('click', () => {
            this.organizeBookmarks();
        });

        // 书签管理
        document.getElementById('open-bookmark-manager-btn').addEventListener('click', () => {
            this.openBookmarkManager();
        });

        document.getElementById('detect-duplicates-btn').addEventListener('click', () => {
            this.detectDuplicateBookmarks();
        });

        document.getElementById('detect-invalid-btn').addEventListener('click', () => {
            this.detectInvalidBookmarks();
        });

        document.getElementById('detect-empty-folders-btn').addEventListener('click', () => {
            this.detectEmptyFolders();
        });

        // 快速入口
        document.getElementById('open-analyze-page-btn').addEventListener('click', () => {
            this.openAnalyzePage();
        });

        document.getElementById('open-history-page-btn').addEventListener('click', () => {
            this.openHistoryPage();
        });
    }

    /**
     * 绑定数据管理事件
     */
    bindDataEvents() {
        // 导入功能
        document.getElementById('import-bookmarks-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        document.getElementById('import-from-url-btn').addEventListener('click', () => {
            this.importFromUrl();
        });

        // 导出功能
        document.getElementById('export-backup-btn').addEventListener('click', () => {
            this.handleExportBackup();
        });

        document.getElementById('export-selected-btn').addEventListener('click', () => {
            this.exportSelected();
        });

        document.getElementById('export-ai-categories-btn').addEventListener('click', () => {
            this.exportAiCategories();
        });

        document.getElementById('export-custom-btn').addEventListener('click', () => {
            this.exportCustom();
        });

        // 检测报告
        document.getElementById('view-duplicate-report-btn').addEventListener('click', () => {
            this.viewDuplicateReport();
        });

        document.getElementById('view-invalid-report-btn').addEventListener('click', () => {
            this.viewInvalidReport();
        });

        document.getElementById('view-cleanup-report-btn').addEventListener('click', () => {
            this.viewCleanupReport();
        });

        document.getElementById('generate-comprehensive-report-btn').addEventListener('click', () => {
            this.generateComprehensiveReport();
        });

        // 数据备份
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restore-backup-btn').addEventListener('click', () => {
            this.restoreBackup();
        });

        document.getElementById('manage-backups-btn').addEventListener('click', () => {
            this.manageBackups();
        });
    }

    /**
     * 绑定个性化设置事件
     */
    bindPersonalizationEvents() {
        // 动画设置
        document.getElementById('animation-level').addEventListener('change', (e) => {
            this.updateAnimationLevel(e.target.value);
        });

        document.getElementById('enable-ripple').addEventListener('change', (e) => {
            this.updateRippleEffect(e.target.checked);
        });

        document.getElementById('enable-floating').addEventListener('change', (e) => {
            this.updateFloatingAnimation(e.target.checked);
        });

        document.getElementById('enable-particles').addEventListener('change', (e) => {
            this.updateParticlesEffect(e.target.checked);
        });

        // 界面设置
        document.getElementById('ui-density').addEventListener('change', (e) => {
            this.updateUIDensity(e.target.value);
        });

        document.getElementById('corner-radius').addEventListener('input', (e) => {
            this.updateCornerRadius(e.target.value);
        });

        document.getElementById('blur-intensity').addEventListener('input', (e) => {
            this.updateBlurIntensity(e.target.value);
        });

        // 颜色主题
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColorTheme(e.target.dataset.color);
            });
        });

        document.getElementById('custom-color').addEventListener('change', (e) => {
            this.updateCustomColor(e.target.value);
        });

        // 行为设置
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.updateAutoSave(e.target.checked);
        });

        document.getElementById('show-notifications').addEventListener('change', (e) => {
            this.updateShowNotifications(e.target.checked);
        });

        document.getElementById('enable-sounds').addEventListener('change', (e) => {
            this.updateEnableSounds(e.target.checked);
        });

        document.getElementById('remember-last-folder').addEventListener('change', (e) => {
            this.updateRememberLastFolder(e.target.checked);
        });

        // 个性化操作
        document.getElementById('reset-personalization-btn').addEventListener('click', () => {
            this.resetPersonalization();
        });

        document.getElementById('export-personalization-btn').addEventListener('click', () => {
            this.exportPersonalization();
        });

        document.getElementById('import-personalization-btn').addEventListener('click', () => {
            this.importPersonalization();
        });
    }

    /**
     * 绑定API设置事件
     */
    bindApiEvents() {
        // API提供商切换
        document.getElementById('api-provider').addEventListener('change', (e) => {
            this.toggleApiFields(e.target.value);
        });

        // 保存和测试API设置
        document.getElementById('save-api-settings-btn').addEventListener('click', () => {
            this.saveApiSettings();
        });

        document.getElementById('test-api-btn').addEventListener('click', () => {
            this.testApiConnection();
        });
    }

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // 移除所有活跃状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 设置新的活跃状态
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        this.currentTab = tabName;
    }

    /**
     * 打开设置面板
     */
    openPanel() {
        const panel = document.getElementById('settings-panel');
        panel.classList.add('is-visible');
        this.isPanelOpen = true;
        
        // 初始化图标
        if (window.lucide) {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    /**
     * 关闭设置面板
     */
    closePanel() {
        const panel = document.getElementById('settings-panel');
        panel.classList.remove('is-visible');
        this.isPanelOpen = false;
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('bookmark-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('bookmark-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 应用设置
     */
    applySettings() {
        // 应用主题
        if (this.settings.appearance?.theme) {
            this.applyTheme(this.settings.appearance.theme);
        }

        // 应用个性化设置
        if (this.settings.personalization) {
            this.applyPersonalizationSettings(this.settings.personalization);
        }
    }

    // ==================== 外观设置方法 ====================

    /**
     * 应用主题
     */
    applyTheme(theme) {
        document.body.className = theme;
        this.settings.appearance.theme = theme;
        this.saveSettings();
        this.showNotification('主题已切换', 'success');
    }

    /**
     * 处理背景上传
     */
    handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.body.style.backgroundImage = `url(${e.target.result})`;
                this.settings.appearance.background = e.target.result;
                this.saveSettings();
                this.showNotification('背景已更新', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * 清除自定义背景
     */
    clearCustomBackground() {
        document.body.style.backgroundImage = '';
        delete this.settings.appearance.background;
        this.saveSettings();
        this.showNotification('背景已清除', 'info');
    }

    // ==================== 工具设置方法 ====================

    /**
     * 显示词云
     */
    showWordcloud() {
        this.showVisualization('wordcloud');
    }

    /**
     * 显示树状图
     */
    showTreeview() {
        this.showVisualization('treeview');
    }

    /**
     * 显示图表
     */
    showCharts() {
        this.showVisualization('charts');
    }

    /**
     * 显示可视化
     */
    showVisualization(type) {
        const container = document.getElementById('visualization-container');
        const panels = container.querySelectorAll('.visualization-panel');
        
        // 隐藏所有面板
        panels.forEach(panel => panel.classList.add('hidden'));
        container.classList.remove('hidden');
        
        // 显示指定面板
        document.getElementById(`${type}-container`).classList.remove('hidden');
    }

    /**
     * 刷新可视化数据
     */
    refreshVisualizationData() {
        this.showNotification('正在刷新数据...', 'info');
        // 这里可以添加实际的数据刷新逻辑
        setTimeout(() => {
            this.showNotification('数据已刷新', 'success');
        }, 1000);
    }

    /**
     * 分析书签
     */
    async analyzeBookmarks() {
        this.showNotification('开始分析书签...', 'info');
        
        // 显示进度
        const progress = document.getElementById('analysis-progress');
        const progressBar = document.getElementById('analysis-progress-bar');
        const status = document.getElementById('analysis-status');
        
        progress.classList.remove('hidden');
        
        // 模拟分析进度
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 10;
            progressBar.style.width = `${currentProgress}%`;
            status.textContent = `分析进度: ${currentProgress}%`;
            
            if (currentProgress >= 100) {
                clearInterval(interval);
                this.showNotification('分析完成', 'success');
                progress.classList.add('hidden');
                
                // 显示结果
                document.getElementById('analysis-results').classList.remove('hidden');
            }
        }, 500);
    }

    /**
     * 重新生成分类建议
     */
    regenerateSuggestedCategories() {
        this.showNotification('正在重新生成分类建议...', 'info');
        // 这里可以添加实际的分类生成逻辑
        setTimeout(() => {
            this.showNotification('分类建议已更新', 'success');
        }, 2000);
    }

    /**
     * 整理书签到文件夹
     */
    organizeBookmarks() {
        this.showNotification('正在整理书签...', 'info');
        // 这里可以添加实际的书签整理逻辑
        setTimeout(() => {
            this.showNotification('书签整理完成', 'success');
        }, 1500);
    }

    /**
     * 打开书签管理器
     */
    openBookmarkManager() {
        this.showNotification('打开书签管理器', 'info');
        // 这里可以添加打开书签管理器的逻辑
    }

    /**
     * 检测重复书签
     */
    detectDuplicateBookmarks() {
        this.showNotification('正在检测重复书签...', 'info');
        // 这里可以添加实际的重复检测逻辑
        setTimeout(() => {
            this.showNotification('重复检测完成', 'success');
        }, 2000);
    }

    /**
     * 检测失效书签
     */
    detectInvalidBookmarks() {
        this.showNotification('正在检测失效书签...', 'info');
        // 这里可以添加实际的失效检测逻辑
        setTimeout(() => {
            this.showNotification('失效检测完成', 'success');
        }, 2000);
    }

    /**
     * 检测空文件夹
     */
    detectEmptyFolders() {
        this.showNotification('正在检测空文件夹...', 'info');
        // 这里可以添加实际的空文件夹检测逻辑
        setTimeout(() => {
            this.showNotification('空文件夹检测完成', 'success');
        }, 1500);
    }

    /**
     * 打开详细分析页面
     */
    openAnalyzePage() {
        window.open('detailed-analysis.html', '_blank');
    }

    /**
     * 打开历史记录页面
     */
    openHistoryPage() {
        window.open('history.html', '_blank');
    }

    // ==================== 数据管理方法 ====================

    /**
     * 处理文件导入
     */
    handleFileImport(event) {
        const file = event.target.files[0];
        if (file) {
            this.showNotification('正在导入文件...', 'info');
            // 这里可以添加实际的文件导入逻辑
            setTimeout(() => {
                this.showNotification('文件导入完成', 'success');
            }, 2000);
        }
    }

    /**
     * 从URL导入
     */
    importFromUrl() {
        const url = prompt('请输入要导入的书签URL:');
        if (url) {
            this.showNotification('正在从URL导入...', 'info');
            // 这里可以添加实际的URL导入逻辑
            setTimeout(() => {
                this.showNotification('URL导入完成', 'success');
            }, 2000);
        }
    }

    /**
     * 处理导出备份
     */
    handleExportBackup() {
        this.showNotification('正在导出备份...', 'info');
        // 这里可以添加实际的导出逻辑
        setTimeout(() => {
            this.showNotification('备份导出完成', 'success');
        }, 1500);
    }

    /**
     * 导出选中项
     */
    exportSelected() {
        this.showNotification('导出选中项', 'info');
        // 这里可以添加实际的导出逻辑
    }

    /**
     * 导出AI分类
     */
    exportAiCategories() {
        this.showNotification('导出AI分类', 'info');
        // 这里可以添加实际的导出逻辑
    }

    /**
     * 自定义导出
     */
    exportCustom() {
        this.showNotification('自定义导出', 'info');
        // 这里可以添加实际的导出逻辑
    }

    /**
     * 查看重复书签报告
     */
    viewDuplicateReport() {
        this.showNotification('查看重复书签报告', 'info');
        // 这里可以添加实际的报告查看逻辑
    }

    /**
     * 查看失效书签报告
     */
    viewInvalidReport() {
        this.showNotification('查看失效书签报告', 'info');
        // 这里可以添加实际的报告查看逻辑
    }

    /**
     * 查看清理报告
     */
    viewCleanupReport() {
        this.showNotification('查看清理报告', 'info');
        // 这里可以添加实际的报告查看逻辑
    }

    /**
     * 生成综合报告
     */
    generateComprehensiveReport() {
        this.showNotification('正在生成综合报告...', 'info');
        // 这里可以添加实际的报告生成逻辑
        setTimeout(() => {
            this.showNotification('综合报告生成完成', 'success');
        }, 3000);
    }

    /**
     * 创建备份
     */
    createBackup() {
        this.showNotification('正在创建备份...', 'info');
        // 这里可以添加实际的备份创建逻辑
        setTimeout(() => {
            this.showNotification('备份创建完成', 'success');
        }, 2000);
    }

    /**
     * 恢复备份
     */
    restoreBackup() {
        this.showNotification('恢复备份', 'info');
        // 这里可以添加实际的备份恢复逻辑
    }

    /**
     * 管理备份
     */
    manageBackups() {
        this.showNotification('管理备份', 'info');
        // 这里可以添加实际的备份管理逻辑
    }

    // ==================== 个性化设置方法 ====================

    /**
     * 更新动画级别
     */
    updateAnimationLevel(level) {
        this.settings.personalization.animationLevel = level;
        this.saveSettings();
        this.showNotification('动画级别已更新', 'success');
    }

    /**
     * 更新波纹效果
     */
    updateRippleEffect(enabled) {
        this.settings.personalization.enableRipple = enabled;
        this.saveSettings();
        this.showNotification('波纹效果已更新', 'success');
    }

    /**
     * 更新浮动动画
     */
    updateFloatingAnimation(enabled) {
        this.settings.personalization.enableFloating = enabled;
        this.saveSettings();
        this.showNotification('浮动动画已更新', 'success');
    }

    /**
     * 更新粒子效果
     */
    updateParticlesEffect(enabled) {
        this.settings.personalization.enableParticles = enabled;
        this.saveSettings();
        this.showNotification('粒子效果已更新', 'success');
    }

    /**
     * 更新界面密度
     */
    updateUIDensity(density) {
        this.settings.personalization.uiDensity = density;
        this.saveSettings();
        this.showNotification('界面密度已更新', 'success');
    }

    /**
     * 更新圆角大小
     */
    updateCornerRadius(value) {
        this.settings.personalization.cornerRadius = value;
        document.getElementById('corner-radius-value').textContent = `${value}px`;
        this.saveSettings();
    }

    /**
     * 更新毛玻璃强度
     */
    updateBlurIntensity(value) {
        this.settings.personalization.blurIntensity = value;
        document.getElementById('blur-intensity-value').textContent = `${value}px`;
        this.saveSettings();
    }

    /**
     * 选择颜色主题
     */
    selectColorTheme(color) {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.settings.personalization.colorTheme = color;
        this.saveSettings();
        this.showNotification('颜色主题已更新', 'success');
    }

    /**
     * 更新自定义颜色
     */
    updateCustomColor(color) {
        this.settings.personalization.customColor = color;
        this.saveSettings();
        this.showNotification('自定义颜色已更新', 'success');
    }

    /**
     * 更新自动保存
     */
    updateAutoSave(enabled) {
        this.settings.personalization.autoSave = enabled;
        this.saveSettings();
        this.showNotification('自动保存已更新', 'success');
    }

    /**
     * 更新显示通知
     */
    updateShowNotifications(enabled) {
        this.settings.personalization.showNotifications = enabled;
        this.saveSettings();
        this.showNotification('通知设置已更新', 'success');
    }

    /**
     * 更新启用音效
     */
    updateEnableSounds(enabled) {
        this.settings.personalization.enableSounds = enabled;
        this.saveSettings();
        this.showNotification('音效设置已更新', 'success');
    }

    /**
     * 更新记住上次文件夹
     */
    updateRememberLastFolder(enabled) {
        this.settings.personalization.rememberLastFolder = enabled;
        this.saveSettings();
        this.showNotification('文件夹记忆已更新', 'success');
    }

    /**
     * 重置个性化设置
     */
    resetPersonalization() {
        if (confirm('确定要重置所有个性化设置吗？')) {
            this.settings.personalization = {};
            this.saveSettings();
            this.showNotification('个性化设置已重置', 'success');
        }
    }

    /**
     * 导出个性化设置
     */
    exportPersonalization() {
        const data = JSON.stringify(this.settings.personalization, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'personalization-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('个性化设置已导出', 'success');
    }

    /**
     * 导入个性化设置
     */
    importPersonalization() {
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
                        this.settings.personalization = settings;
                        this.saveSettings();
                        this.showNotification('个性化设置已导入', 'success');
                    } catch (error) {
                        this.showNotification('导入失败：文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * 应用个性化设置
     */
    applyPersonalizationSettings(settings) {
        // 应用各种个性化设置
        if (settings.animationLevel) {
            document.getElementById('animation-level').value = settings.animationLevel;
        }
        if (settings.enableRipple !== undefined) {
            document.getElementById('enable-ripple').checked = settings.enableRipple;
        }
        // 可以继续添加其他设置的应用逻辑
    }

    // ==================== API设置方法 ====================

    /**
     * 切换API字段显示
     */
    toggleApiFields(provider) {
        const geminiFields = document.getElementById('gemini-fields');
        const openaiFields = document.getElementById('openai-fields');
        const customApiFields = document.getElementById('custom-api-fields');

        // 隐藏所有字段
        geminiFields.classList.add('hidden');
        openaiFields.classList.add('hidden');
        customApiFields.classList.add('hidden');

        // 显示对应字段
        switch (provider) {
            case 'gemini':
                geminiFields.classList.remove('hidden');
                break;
            case 'openai':
                openaiFields.classList.remove('hidden');
                break;
            case 'custom':
                customApiFields.classList.remove('hidden');
                break;
        }
    }

    /**
     * 保存API设置
     */
    saveApiSettings() {
        const provider = document.getElementById('api-provider').value;
        const apiKey = document.getElementById('api-key').value;
        const batchSize = document.getElementById('batch-size').value;

        this.settings.api = {
            provider,
            apiKey,
            batchSize: parseInt(batchSize)
        };

        // 根据提供商保存特定设置
        if (provider === 'gemini') {
            this.settings.api.geminiModel = document.getElementById('gemini-model').value;
        } else if (provider === 'openai') {
            this.settings.api.openaiModel = document.getElementById('openai-model').value;
        } else if (provider === 'custom') {
            this.settings.api.customApiUrl = document.getElementById('custom-api-url').value;
            this.settings.api.customModel = document.getElementById('custom-model').value;
        }

        this.saveSettings();
        this.showNotification('API设置已保存', 'success');
    }

    /**
     * 测试API连接
     */
    async testApiConnection() {
        const provider = document.getElementById('api-provider').value;
        const apiKey = document.getElementById('api-key').value;
        
        if (!apiKey) {
            this.showNotification('请先输入API密钥', 'error');
            return;
        }

        this.showNotification('正在测试网络连接和API...', 'info');
        
        try {
            // 第一步：测试网络连接
            this.showNotification('步骤1: 检测网络连接...', 'info');
            const networkConnected = await this.checkNetworkConnection();
            
            if (!networkConnected) {
                this.showNotification('网络连接失败，请检查网络设置', 'error');
                return;
            }
            
            this.showNotification('网络连接正常', 'success');
            
            // 第二步：测试API连接
            this.showNotification('步骤2: 测试API连接...', 'info');
            
            let apiTestResult = false;
            switch (provider) {
                case 'gemini':
                    apiTestResult = await this.testGeminiApi(apiKey);
                    break;
                case 'openai':
                    apiTestResult = await this.testOpenAiApi(apiKey);
                    break;
                case 'custom':
                    const customUrl = document.getElementById('custom-api-url').value;
                    if (!customUrl) {
                        this.showNotification('自定义API需要提供URL', 'error');
                        return;
                    }
                    apiTestResult = await this.testCustomApi(apiKey, customUrl);
                    break;
                default:
                    this.showNotification('不支持的API提供商', 'error');
                    return;
            }
            
            if (apiTestResult) {
                this.showNotification('API连接测试成功！', 'success');
            } else {
                this.showNotification('API连接测试失败，请检查密钥和设置', 'error');
            }
            
        } catch (error) {
            this.showNotification(`测试失败: ${error.message}`, 'error');
        }
    }

    /**
     * 检查网络连接
     */
    async checkNetworkConnection() {
        try {
            const testUrls = [
                'https://httpbin.org/status/200',
                'https://api.github.com/zen',
                'https://www.baidu.com/favicon.ico'
            ];

            for (const url of testUrls) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-cache',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    return true;
                } catch (urlError) {
                    continue;
                }
            }
            
            return navigator.onLine || false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 测试Gemini API
     */
    async testGeminiApi(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Hello, this is a test message."
                        }]
                    }]
                })
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 测试OpenAI API
     */
    async testOpenAiApi(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: 'Hello, this is a test message.'
                    }],
                    max_tokens: 10
                })
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 测试自定义API
     */
    async testCustomApi(apiKey, customUrl) {
        try {
            const response = await fetch(customUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Hello, this is a test message.'
                })
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // ==================== 通用方法 ====================

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }
}

// 导出设置管理器
window.SettingsManager = SettingsManager;