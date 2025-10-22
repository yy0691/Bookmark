/**
 * AI智能分析中心 - 主控制器
 * 整合所有AI分析功能的统一界面
 */

// 导入必要的模块
import { ApiService } from './modules/apiService.js';
import { BookmarkService } from './modules/bookmarkService.js';
import { UIManager } from './modules/uiManager.js';
import { BookmarkManager } from './modules/bookmarkManager.js';
import { DetectionService } from './modules/detectionService.js';
import { ImportExportService } from './modules/importExportService.js';
import { VisualizationService } from './modules/visualizationService.js';
import { Utils } from './modules/utils.js';

// 全局状态管理
class AnalysisCenterState {
  constructor() {
    this.isInitialized = false;
    this.currentTab = 'analysis';
    this.analysisData = {
      bookmarks: [],
      categories: {},
      isProcessing: false,
      progress: 0,
      results: null
    };
    this.detectionData = {
      duplicates: [],
      deadLinks: [],
      emptyFolders: [],
      malformed: []
    };
    this.visualizationData = {
      charts: {},
      lastGenerated: null
    };
    this.logs = [];
    this.worker = null;
  }

  reset() {
    this.analysisData = {
      bookmarks: [],
      categories: {},
      isProcessing: false,
      progress: 0,
      results: null
    };
  }
}

// AI分析中心主类
class AIAnalysisCenter {
  constructor() {
    this.state = new AnalysisCenterState();
    
    // 初始化服务模块
    this.apiService = new ApiService();
    this.bookmarkService = new BookmarkService();
    this.uiManager = new UIManager();
    this.bookmarkManager = new BookmarkManager();
    this.detectionService = new DetectionService();
    this.importExportService = new ImportExportService();
    this.visualizationService = new VisualizationService();
    
    // 设置日志回调
    this.setupLogCallbacks();
  }

  // 设置日志回调
  setupLogCallbacks() {
    const logCallback = (message, type) => this.addLog(message, type);
    
    this.apiService.setLogCallback(logCallback);
    this.bookmarkService.setLogCallback(logCallback);
    this.bookmarkManager.setLogCallback(logCallback);
    this.detectionService.setLogCallback(logCallback);
    this.importExportService.setLogCallback(logCallback);
    this.visualizationService.setLogCallback(logCallback);
  }

  // 初始化应用
  async initialize() {
    try {
      this.addLog('🚀 初始化AI分析中心...', 'info');
      
      // 初始化Web Worker
      this.initializeWorker();
      
      // 检查API状态
      await this.checkApiStatus();
      
      // 加载书签统计
      await this.loadBookmarkStats();
      
      // 初始化事件监听器
      this.initializeEventListeners();
      
      // 加载数据管理状态
      await this.loadDataManagementStatus();
      
      this.state.isInitialized = true;
      this.addLog('✅ AI分析中心初始化完成', 'success');
      
      return true;
    } catch (error) {
      this.addLog(`❌ 初始化失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 初始化Web Worker
  initializeWorker() {
    try {
      this.state.worker = new Worker('bookmarkProcessor.js');
      
      this.state.worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        switch (type) {
          case 'progress':
            this.updateProgress(data.current, data.total, data.message);
            break;
          case 'log':
            this.addLog(data.message, data.type);
            break;
          case 'batch_complete':
            this.handleBatchComplete(data);
            break;
          case 'error':
            this.showError('Worker错误', data.error);
            break;
        }
      };
      
      this.state.worker.onerror = (error) => {
        this.addLog(`⚠️ Worker错误: ${error.message}`, 'warning');
      };
      
      this.addLog('🔧 Web Worker初始化成功', 'success');
    } catch (error) {
      this.addLog(`⚠️ Web Worker初始化失败: ${error.message}`, 'warning');
    }
  }

  // 检查API状态
  async checkApiStatus() {
    try {
      const status = await this.apiService.checkApiStatus();
      const statusElement = document.getElementById('api-status');
      
      if (status.connected) {
        statusElement.textContent = `✅ ${status.provider}`;
        statusElement.style.color = '#34d058';
        this.addLog(`🔌 API已连接: ${status.provider}`, 'success');
      } else {
        statusElement.textContent = '❌ 未配置';
        statusElement.style.color = '#ff3b30';
        this.addLog('⚠️ API未配置，请先配置API密钥', 'warning');
      }
    } catch (error) {
      const statusElement = document.getElementById('api-status');
      statusElement.textContent = '❌ 错误';
      statusElement.style.color = '#ff3b30';
      this.addLog(`❌ API状态检查失败: ${error.message}`, 'error');
    }
  }

  // 加载书签统计
  async loadBookmarkStats() {
    try {
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      const bookmarkCount = document.getElementById('bookmark-count');
      bookmarkCount.textContent = bookmarks.length;
      
      this.state.analysisData.bookmarks = bookmarks;
      this.addLog(`📚 已加载 ${bookmarks.length} 个书签`, 'info');
    } catch (error) {
      this.addLog(`❌ 加载书签统计失败: ${error.message}`, 'error');
    }
  }

  // 初始化事件监听器
  initializeEventListeners() {
    // 绑定全局函数到window对象，保持兼容性
    window.switchTab = this.switchTab.bind(this);
    window.startAnalysis = this.startAnalysis.bind(this);
    window.stopAnalysis = this.stopAnalysis.bind(this);
    window.applyCategories = this.applyCategories.bind(this);
    window.exportResults = this.exportResults.bind(this);
    window.detectDuplicates = this.detectDuplicates.bind(this);
    window.detectDeadLinks = this.detectDeadLinks.bind(this);
    window.detectEmptyFolders = this.detectEmptyFolders.bind(this);
    window.detectMalformed = this.detectMalformed.bind(this);
    window.runFullDetection = this.runFullDetection.bind(this);
    window.generateVisualization = this.generateVisualization.bind(this);
    window.importBookmarks = this.importBookmarks.bind(this);
    window.exportBookmarks = this.exportBookmarks.bind(this);
    window.createBackup = this.createBackup.bind(this);
    window.openBookmarkManager = this.openBookmarkManager.bind(this);
    window.refreshData = this.refreshData.bind(this);
    window.openSettings = this.openSettings.bind(this);
    window.openHelp = this.openHelp.bind(this);
    window.clearLog = this.clearLog.bind(this);
    window.exportLog = this.exportLog.bind(this);
    window.toggleAllCategories = this.toggleAllCategories.bind(this);
    
    // 其他事件监听器可以在这里添加
  }

  // 切换标签页
  switchTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // 查找对应的标签按钮并激活
    const targetTabButton = Array.from(document.querySelectorAll('.nav-tab')).find(tab => {
      const onclick = tab.getAttribute('onclick');
      return onclick && onclick.includes(`'${tabName}'`);
    });
    
    if (targetTabButton) {
      targetTabButton.classList.add('active');
    }

    // 显示对应内容
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${tabName}-tab`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    this.state.currentTab = tabName;
    this.addLog(`📋 切换到${this.getTabDisplayName(tabName)}标签页`, 'info');
  }

  getTabDisplayName(tabName) {
    const names = {
      'analysis': '智能分析',
      'management': '书签管理',
      'detection': '问题检测', 
      'visualization': '数据可视化',
      'data': '数据管理'
    };
    return names[tabName] || tabName;
  }

  // 开始AI分析
  async startAnalysis() {
    if (this.state.analysisData.isProcessing) {
      this.showWarning('正在分析中，请等待完成');
      return;
    }

    try {
      this.state.analysisData.isProcessing = true;
      this.updateAnalysisStatus('分析中...');
      this.showProgress(true);
      this.updateProgress(0, 100, '准备分析...');
      
      // 切换按钮状态
      document.getElementById('start-analysis-btn').classList.add('hidden');
      document.getElementById('stop-analysis-btn').classList.remove('hidden');

      // 获取API设置
      const settings = await this.apiService.getApiSettings();
      if (!settings.apiKey) {
        throw new Error('请先配置API密钥');
      }

      // 获取书签数据
      this.updateProgress(10, 100, '获取书签数据...');
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      
      if (bookmarks.length === 0) {
        throw new Error('没有找到书签');
      }

      this.state.analysisData.bookmarks = bookmarks;
      this.addLog(`📚 开始分析 ${bookmarks.length} 个书签`, 'info');

      // 使用AI进行分类
      this.updateProgress(20, 100, 'AI分析中...');
      const categories = await this.bookmarkService.categorizeBookmarks(
        bookmarks,
        settings,
        this.apiService,
        (progress, message) => {
          this.updateProgress(20 + (progress * 0.7), 100, message);
        }
      );

      this.state.analysisData.categories = categories;
      this.state.analysisData.results = categories;
      
      // 更新UI
      this.updateProgress(100, 100, '分析完成');
      this.displayAnalysisResults(categories);
      this.updateCategoryCount(Object.keys(categories).length);
      
      // 显示应用按钮
      document.getElementById('apply-btn').classList.remove('hidden');
      
      this.addLog(`✅ 分析完成！共分为 ${Object.keys(categories).length} 个分类`, 'success');
      this.updateAnalysisStatus('已完成');

    } catch (error) {
      this.addLog(`❌ 分析失败: ${error.message}`, 'error');
      this.showError('分析失败', error.message);
      this.updateAnalysisStatus('分析失败');
    } finally {
      this.state.analysisData.isProcessing = false;
      this.showProgress(false);
      
      // 恢复按钮状态
      document.getElementById('start-analysis-btn').classList.remove('hidden');
      document.getElementById('stop-analysis-btn').classList.add('hidden');
    }
  }

  // 停止分析
  stopAnalysis() {
    if (this.state.worker) {
      this.state.worker.terminate();
      this.initializeWorker();
    }
    
    this.state.analysisData.isProcessing = false;
    this.showProgress(false);
    this.updateAnalysisStatus('已停止');
    
    // 恢复按钮状态
    document.getElementById('start-analysis-btn').classList.remove('hidden');
    document.getElementById('stop-analysis-btn').classList.add('hidden');
    
    this.addLog('⏹️ 分析已停止', 'warning');
  }

  // 应用分类结果
  async applyCategories() {
    if (!this.state.analysisData.results) {
      this.showWarning('没有可应用的分析结果');
      return;
    }

    try {
      this.showProgress(true);
      this.updateProgress(0, 100, '应用分类结果...');
      
      let organizedCount = 0;
      const categories = this.state.analysisData.results;
      const totalCategories = Object.keys(categories).length;

      // 创建主分类文件夹
      this.updateProgress(10, 100, '创建分类文件夹...');
      const mainFolder = await this.bookmarkService.createBookmarkFolder('AI分类书签', '1');
      
      let currentCategory = 0;
      for (const [categoryName, bookmarks] of Object.entries(categories)) {
        try {
          const progress = 10 + ((currentCategory / totalCategories) * 80);
          this.updateProgress(progress, 100, `整理分类: ${categoryName}`);
          
          // 创建分类文件夹
          const categoryFolder = await this.bookmarkService.createBookmarkFolder(categoryName, mainFolder.id);
          
          // 移动书签到分类文件夹
          for (const bookmark of bookmarks) {
            const matchingBookmark = this.state.analysisData.bookmarks.find(b => 
              b.url === bookmark.url && b.title === bookmark.title
            );
            
            if (matchingBookmark) {
              await this.bookmarkService.moveBookmark(matchingBookmark.id, categoryFolder.id);
              organizedCount++;
            }
          }
          
          this.addLog(`📁 已整理分类"${categoryName}": ${bookmarks.length}个书签`, 'info');
          currentCategory++;
          
        } catch (error) {
          this.addLog(`❌ 整理分类"${categoryName}"失败: ${error.message}`, 'error');
        }
      }

      this.updateProgress(100, 100, '应用完成');
      this.addLog(`✅ 分类应用完成！共整理了${organizedCount}个书签`, 'success');

    } catch (error) {
      this.addLog(`❌ 应用分类失败: ${error.message}`, 'error');
      this.showError('应用失败', error.message);
    } finally {
      this.showProgress(false);
    }
  }

  // 导出分析结果
  async exportResults() {
    try {
      if (this.state.analysisData.results) {
        // 导出分类结果为CSV
        await this.importExportService.exportCategoriesAsCsv(this.state.analysisData.results);
        this.addLog('📤 分析结果已导出为CSV格式', 'success');
      } else {
        // 导出原始书签
        await this.importExportService.exportBookmarksAsJson();
        this.addLog('📤 书签数据已导出为JSON格式', 'success');
      }
    } catch (error) {
      this.addLog(`❌ 导出失败: ${error.message}`, 'error');
      this.showError('导出失败', error.message);
    }
  }

  // 检测重复书签
  async detectDuplicates() {
    try {
      this.addLog('🔍 开始检测重复书签...', 'info');
      this.showProgress(true);
      
      const result = await this.detectionService.detectDuplicateBookmarks();
      this.state.detectionData.duplicates = result.duplicates;
      
      // 更新UI显示
      document.getElementById('duplicate-count').textContent = `${result.urlDuplicateCount} URL / ${result.titleDuplicateCount} 标题`;
      
      this.addLog(`✅ 重复检测完成：发现${result.urlDuplicateCount}个URL重复，${result.titleDuplicateCount}个标题重复`, 'success');
      
    } catch (error) {
      this.addLog(`❌ 重复检测失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  // 检测失效链接
  async detectDeadLinks() {
    try {
      this.addLog('🔍 开始检测失效链接...', 'info');
      this.showProgress(true);
      
      const result = await this.detectionService.detectInvalidBookmarks();
      this.state.detectionData.deadLinks = result.invalidBookmarks;
      
      // 更新UI显示
      document.getElementById('dead-link-count').textContent = result.invalid;
      
      this.addLog(`✅ 失效检测完成：${result.valid}个有效，${result.invalid}个失效`, 'success');
      
    } catch (error) {
      this.addLog(`❌ 失效检测失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  // 检测空文件夹
  async detectEmptyFolders() {
    try {
      this.addLog('🔍 开始检测空文件夹...', 'info');
      this.showProgress(true);
      
      const result = await this.detectionService.detectEmptyFolders();
      this.state.detectionData.emptyFolders = result.emptyFolders;
      
      // 更新UI显示
      document.getElementById('empty-folder-count').textContent = result.count;
      
      this.addLog(`✅ 空文件夹检测完成：发现${result.count}个空文件夹`, 'success');
      
    } catch (error) {
      this.addLog(`❌ 空文件夹检测失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  // 检测格式异常
  async detectMalformed() {
    try {
      this.addLog('🔍 开始检测格式异常...', 'info');
      this.showProgress(true);
      
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      const malformed = [];
      
      bookmarks.forEach(bookmark => {
        // 检测异常情况
        if (!bookmark.title || bookmark.title.trim() === '') {
          malformed.push({ ...bookmark, issue: '标题为空' });
        }
        if (!bookmark.url || bookmark.url.trim() === '') {
          malformed.push({ ...bookmark, issue: 'URL为空' });
        }
        if (bookmark.url && !this.isValidUrl(bookmark.url)) {
          malformed.push({ ...bookmark, issue: 'URL格式异常' });
        }
      });
      
      this.state.detectionData.malformed = malformed;
      
      // 更新UI显示
      document.getElementById('malformed-count').textContent = malformed.length;
      
      this.addLog(`✅ 格式检测完成：发现${malformed.length}个异常书签`, 'success');
      
    } catch (error) {
      this.addLog(`❌ 格式检测失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  // 全面检测
  async runFullDetection() {
    this.addLog('🔍 开始全面检测...', 'info');
    
    await this.detectDuplicates();
    await this.detectDeadLinks();
    await this.detectEmptyFolders();
    await this.detectMalformed();
    
    this.addLog('✅ 全面检测完成', 'success');
  }

  // 生成可视化
  async generateVisualization() {
    try {
      this.addLog('📊 开始生成可视化...', 'info');
      
      const bookmarks = this.state.analysisData.bookmarks;
      const categories = this.state.analysisData.categories;
      
      if (Object.keys(categories).length === 0) {
        this.showWarning('请先进行书签分析');
        return;
      }

      this.showProgress(true);
      
      // 生成分类图表
      this.updateProgress(25, 100, '生成分类图表...');
      this.visualizationService.generateCategoryChart(categories, 'category-chart');
      
      // 生成域名图表
      this.updateProgress(50, 100, '生成域名图表...');
      this.visualizationService.generateDomainChart(bookmarks, 'domain-chart');
      
      // 生成统计摘要
      this.updateProgress(75, 100, '生成统计摘要...');
      const stats = this.visualizationService.generateStatsSummary(bookmarks, categories);
      this.visualizationService.renderStatsSummary(stats, 'stats-summary');
      
      // 生成词云
      this.updateProgress(100, 100, '生成词云...');
      this.visualizationService.generateWordCloud(bookmarks, 'word-cloud');
      
      this.addLog('✅ 可视化生成完成', 'success');
      
    } catch (error) {
      this.addLog(`❌ 可视化生成失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  // 导入书签
  async importBookmarks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      this.addLog(`📥 开始导入文件: ${file.name}`, 'info');
      this.showProgress(true);
      
      const text = await file.text();
      let result;
      
      if (file.name.endsWith('.json')) {
        result = await this.importExportService.importBookmarksFromJson(text);
      } else if (file.name.endsWith('.html')) {
        result = await this.importExportService.importBookmarksFromHtml(text);
      } else if (file.name.endsWith('.csv')) {
        result = await this.importExportService.importBookmarksFromCsv(text);
      } else {
        throw new Error('不支持的文件格式');
      }
      
      if (result.success) {
        this.addLog(`✅ 导入完成：导入了${result.importedCount}个书签`, 'success');
        await this.loadBookmarkStats(); // 刷新统计
        this.updateDataManagementStatus('import');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      this.addLog(`❌ 导入失败: ${error.message}`, 'error');
    } finally {
      this.showProgress(false);
      // 清除文件输入
      event.target.value = '';
    }
  }

  // 导出书签
  async exportBookmarks() {
    try {
      this.addLog('📤 开始导出书签...', 'info');
      
      await this.importExportService.exportBookmarksAsJson();
      this.addLog('✅ 书签导出完成', 'success');
      this.updateDataManagementStatus('export');
      
    } catch (error) {
      this.addLog(`❌ 导出失败: ${error.message}`, 'error');
    }
  }

  // 创建备份
  async createBackup() {
    try {
      this.addLog('💾 开始创建备份...', 'info');
      
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        bookmarkCount: bookmarks.length,
        bookmarks: bookmarks,
        categories: this.state.analysisData.categories || {},
        metadata: {
          userAgent: navigator.userAgent,
          exportSource: 'AI分析中心'
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `书签备份_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.addLog('✅ 备份创建完成', 'success');
      this.updateDataManagementStatus('backup');
      
    } catch (error) {
      this.addLog(`❌ 备份创建失败: ${error.message}`, 'error');
    }
  }

  // 打开书签管理器
  async openBookmarkManager() {
    try {
      this.addLog('📚 打开书签管理器...', 'info');
      
      // 这里可以打开一个模态窗口或跳转到书签管理页面
      if (chrome && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      } else {
        // 在当前窗口打开
        window.open('popup.html', '_blank');
      }
      
      this.addLog('✅ 书签管理器已打开', 'success');
      
    } catch (error) {
      this.addLog(`❌ 打开书签管理器失败: ${error.message}`, 'error');
    }
  }

  // 刷新数据
  async refreshData() {
    this.addLog('🔄 刷新数据...', 'info');
    
    try {
      await this.checkApiStatus();
      await this.loadBookmarkStats();
      await this.loadDataManagementStatus();
      
      this.addLog('✅ 数据刷新完成', 'success');
    } catch (error) {
      this.addLog(`❌ 数据刷新失败: ${error.message}`, 'error');
    }
  }

  // 打开设置
  openSettings() {
    try {
      if (chrome && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      } else {
        window.open('options.html', '_blank');
      }
    } catch (error) {
      this.addLog(`❌ 打开设置失败: ${error.message}`, 'error');
    }
  }

  // 打开帮助
  openHelp() {
    try {
      // 可以打开帮助文档或说明页面
      window.open('https://github.com/your-repo/bookmark-helper/wiki', '_blank');
    } catch (error) {
      this.addLog(`❌ 打开帮助失败: ${error.message}`, 'error');
    }
  }

  // 工具方法
  addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type
    };
    
    this.state.logs.push(logEntry);
    
    // 更新UI
    const logContent = document.getElementById('log-content');
    const logElement = document.createElement('div');
    logElement.className = `log-entry ${type}`;
    logElement.textContent = `[${timestamp}] ${message}`;
    
    logContent.appendChild(logElement);
    logContent.scrollTop = logContent.scrollHeight;
    
    // 限制日志数量
    if (this.state.logs.length > 1000) {
      this.state.logs = this.state.logs.slice(-500);
      // 清理DOM中的老日志
      while (logContent.children.length > 500) {
        logContent.removeChild(logContent.firstChild);
      }
    }
  }

  clearLog() {
    this.state.logs = [];
    document.getElementById('log-content').innerHTML = '';
    this.addLog('🗑️ 日志已清空', 'info');
  }

  exportLog() {
    try {
      const logText = this.state.logs.map(log => 
        `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `分析中心日志_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.addLog('📤 日志导出完成', 'success');
    } catch (error) {
      this.addLog(`❌ 日志导出失败: ${error.message}`, 'error');
    }
  }

  updateProgress(current, total, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
      const percentage = Math.round((current / total) * 100);
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${message} (${percentage}%)`;
    }
  }

  showProgress(show) {
    const progressContainer = document.getElementById('analysis-progress');
    if (progressContainer) {
      progressContainer.style.display = show ? 'block' : 'none';
    }
  }

  updateAnalysisStatus(status) {
    const statusElement = document.getElementById('analysis-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  updateCategoryCount(count) {
    const countElement = document.getElementById('category-count');
    if (countElement) {
      countElement.textContent = count;
    }
  }

  displayAnalysisResults(categories) {
    const resultsContainer = document.getElementById('analysis-results');
    const resultsContent = document.getElementById('results-content');
    
    if (!resultsContainer || !resultsContent) return;
    
    resultsContainer.style.display = 'block';
    resultsContent.innerHTML = '';
    
    Object.entries(categories).forEach(([categoryName, bookmarks]) => {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'category-item';
      categoryElement.innerHTML = `
        <div class="category-header" onclick="toggleCategory('${categoryName}')">
          <span class="category-name">${categoryName}</span>
          <span class="category-count">${bookmarks.length}</span>
        </div>
        <div class="bookmark-list" id="category-${categoryName}">
          ${bookmarks.map(bookmark => `
            <a href="${bookmark.url}" class="bookmark-link" target="_blank">
              ${bookmark.title}
            </a>
          `).join('')}
        </div>
      `;
      
      resultsContent.appendChild(categoryElement);
    });
  }

  toggleAllCategories() {
    const bookmarkLists = document.querySelectorAll('.bookmark-list');
    const isAnyExpanded = Array.from(bookmarkLists).some(list => list.classList.contains('expanded'));
    
    bookmarkLists.forEach(list => {
      if (isAnyExpanded) {
        list.classList.remove('expanded');
      } else {
        list.classList.add('expanded');
      }
    });
  }

  async loadDataManagementStatus() {
    try {
      // 从存储中加载上次操作时间
      if (chrome && chrome.storage) {
        chrome.storage.local.get(['lastImport', 'lastExport', 'lastBackup'], (result) => {
          if (result.lastImport) {
            document.getElementById('last-import').textContent = new Date(result.lastImport).toLocaleString();
          }
          if (result.lastExport) {
            document.getElementById('last-export').textContent = new Date(result.lastExport).toLocaleString();
          }
          if (result.lastBackup) {
            document.getElementById('last-backup').textContent = new Date(result.lastBackup).toLocaleString();
          }
        });
      }
    } catch (error) {
      this.addLog(`⚠️ 加载数据管理状态失败: ${error.message}`, 'warning');
    }
  }

  updateDataManagementStatus(operation) {
    try {
      const now = new Date().toISOString();
      
      if (chrome && chrome.storage) {
        chrome.storage.local.set({
          [`last${operation.charAt(0).toUpperCase() + operation.slice(1)}`]: now
        });
      }
      
      // 更新UI
      const element = document.getElementById(`last-${operation}`);
      if (element) {
        element.textContent = new Date(now).toLocaleString();
      }
    } catch (error) {
      this.addLog(`⚠️ 更新${operation}状态失败: ${error.message}`, 'warning');
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  showWarning(message) {
    this.addLog(`⚠️ ${message}`, 'warning');
  }

  showError(title, message) {
    this.addLog(`❌ ${title}: ${message}`, 'error');
  }
}

// 全局函数定义
window.toggleCategory = function(categoryName) {
  const categoryList = document.getElementById(`category-${categoryName}`);
  if (categoryList) {
    categoryList.classList.toggle('expanded');
  }
};

// 初始化应用
let analysisCenter = null;

document.addEventListener('DOMContentLoaded', async () => {
  analysisCenter = new AIAnalysisCenter();
  const initialized = await analysisCenter.initialize();
  
  if (!initialized) {
    console.error('AI分析中心初始化失败');
    return;
  }
  
  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.substring(1);
  
  // 如果有tab参数或hash，切换到对应标签页
  const targetTab = urlParams.get('tab') || hash;
  if (targetTab && ['analysis', 'management', 'detection', 'visualization', 'data'].includes(targetTab)) {
    analysisCenter.switchTab(targetTab);
  }
  
  // 如果有auto参数，自动执行对应操作
  if (urlParams.get('auto') === 'true') {
    setTimeout(() => {
      switch (targetTab || 'analysis') {
        case 'analysis':
          analysisCenter.startAnalysis();
          break;
        case 'detection':
          analysisCenter.runFullDetection();
          break;
        case 'visualization':
          analysisCenter.generateVisualization();
          break;
        default:
          // 默认执行分析
          analysisCenter.startAnalysis();
          break;
      }
    }, 1000); // 延迟1秒确保页面完全加载
  }
});

// 导出到全局作用域，供其他脚本使用
window.analysisCenter = analysisCenter;