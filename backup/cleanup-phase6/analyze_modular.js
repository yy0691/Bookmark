/**
 * 模块化的书签分析主文件
 * 重构后的 analyze.js，使用ES6模块化架构
 */

// 导入所有模块
import { ApiService } from '../modules/apiService.js';
import { BookmarkService } from '../modules/bookmarkService.js';
import { UIManager } from '../modules/uiManager.js';
import { BookmarkManager } from '../modules/bookmarkManager.js';
import { DetectionService } from '../modules/detectionService.js';
import { ImportExportService } from '../modules/importExportService.js';
import { VisualizationService } from '../modules/visualizationService.js';
import { Utils } from '../modules/utils.js';

// 全局状态管理
class AppState {
  constructor() {
    this.bookmarks = [];
    this.categories = {};
    this.isProcessing = false;
    this.worker = null;
    this.currentBatch = 0;
    this.totalBatches = 0;
  }

  reset() {
    this.bookmarks = [];
    this.categories = {};
    this.isProcessing = false;
    this.currentBatch = 0;
    this.totalBatches = 0;
  }
}

// 主应用类
class BookmarkAnalyzer {
  constructor() {
    // 初始化状态
    this.state = new AppState();
    
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
    
    // 绑定方法
    this.bindMethods();
  }

  // 设置日志回调
  setupLogCallbacks() {
    const logCallback = (message, type) => this.uiManager.addLog(message, type);
    
    this.apiService.setLogCallback(logCallback);
    this.bookmarkService.setLogCallback(logCallback);
    this.bookmarkManager.setLogCallback(logCallback);
    this.detectionService.setLogCallback(logCallback);
    this.importExportService.setLogCallback(logCallback);
    this.visualizationService.setLogCallback(logCallback);
  }

  // 绑定方法到全局作用域（保持向后兼容）
  bindMethods() {
    // 将主要方法绑定到window对象
    window.analyzeBookmarks = this.analyzeBookmarks.bind(this);
    window.organizeBookmarks = this.organizeBookmarks.bind(this);
    window.detectDuplicates = this.detectDuplicates.bind(this);
    window.detectInvalid = this.detectInvalid.bind(this);
    window.detectEmpty = this.detectEmpty.bind(this);
    window.exportBookmarks = this.exportBookmarks.bind(this);
    window.importBookmarks = this.importBookmarks.bind(this);
    window.openBookmarkManager = this.openBookmarkManager.bind(this);
    window.clearLog = () => this.uiManager.clearLog();
    window.generateVisualization = this.generateVisualization.bind(this);
  }

  // 初始化应用
  async initialize() {
    this.uiManager.addLog('书签分析器初始化中...', 'info');
    
    // 初始化UI管理器
    this.uiManager.initialize();
    
    // 初始化Web Worker
    this.initializeWorker();
    
    // 检查API状态
    await this.checkApiStatus();
    
    // 初始化事件监听器
    this.initializeEventListeners();
    
    this.uiManager.addLog('书签分析器初始化完成', 'success');
    this.uiManager.updateStatus('就绪', 'info');
  }

  // 初始化Web Worker
  initializeWorker() {
    try {
      this.state.worker = new Worker('bookmarkProcessor.js');
      
      this.state.worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        switch (type) {
          case 'progress':
            this.uiManager.updateProgress(data.current, data.total, data.message);
            break;
          case 'log':
            this.uiManager.addLog(data.message, data.type);
            break;
          case 'batch_complete':
            this.handleBatchComplete(data);
            break;
          case 'error':
            this.uiManager.showError('Worker错误', data.error);
            break;
        }
      };
      
      this.state.worker.onerror = (error) => {
        this.uiManager.addLog(`Worker错误: ${error.message}`, 'error');
      };
      
      this.uiManager.addLog('Web Worker初始化成功', 'success');
    } catch (error) {
      this.uiManager.addLog(`Web Worker初始化失败: ${error.message}`, 'warning');
    }
  }

  // 检查API状态
  async checkApiStatus() {
    try {
      const status = await this.apiService.checkApiStatus();
      if (status.connected) {
        this.uiManager.addLog(`API已连接: ${status.provider}`, 'success');
        this.uiManager.updateElement('api-status', `✅ ${status.provider} 已连接`);
      } else {
        this.uiManager.addLog('API未配置，请先配置API密钥', 'warning');
        this.uiManager.updateElement('api-status', '⚠️ API未配置');
      }
    } catch (error) {
      this.uiManager.addLog(`API状态检查失败: ${error.message}`, 'error');
    }
  }

  // 初始化事件监听器
  initializeEventListeners() {
    // 分析按钮
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeBookmarks());
    }

    // 整理按钮
    const organizeBtn = document.getElementById('organize-btn');
    if (organizeBtn) {
      organizeBtn.addEventListener('click', () => this.organizeBookmarks());
    }

    // 检测按钮
    const detectDuplicatesBtn = document.getElementById('detect-duplicates-btn');
    if (detectDuplicatesBtn) {
      detectDuplicatesBtn.addEventListener('click', () => this.detectDuplicates());
    }

    const detectInvalidBtn = document.getElementById('detect-invalid-btn');
    if (detectInvalidBtn) {
      detectInvalidBtn.addEventListener('click', () => this.detectInvalid());
    }

    const detectEmptyBtn = document.getElementById('detect-empty-btn');
    if (detectEmptyBtn) {
      detectEmptyBtn.addEventListener('click', () => this.detectEmpty());
    }

    // 导入导出按钮
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBookmarks());
    }

    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importBookmarks());
    }

    // 书签管理器按钮
    const managerBtn = document.getElementById('manager-btn');
    if (managerBtn) {
      managerBtn.addEventListener('click', () => this.openBookmarkManager());
    }

    // 可视化按钮
    const visualBtn = document.getElementById('visual-btn');
    if (visualBtn) {
      visualBtn.addEventListener('click', () => this.generateVisualization());
    }

    // 清空日志按钮
    const clearLogBtn = document.getElementById('clear-log-btn');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => this.uiManager.clearLog());
    }
  }

  // 分析书签
  async analyzeBookmarks() {
    if (this.state.isProcessing) {
      this.uiManager.showWarning('正在处理中，请等待完成');
      return;
    }

    try {
      this.state.isProcessing = true;
      this.uiManager.showLoading('正在分析书签...');
      this.state.reset();

      // 获取API设置
      const settings = await this.apiService.getApiSettings();
      if (!settings.apiKey) {
        throw new Error('请先配置API密钥');
      }

      // 获取所有书签
      this.uiManager.addLog('正在获取书签数据...', 'info');
      this.state.bookmarks = await this.bookmarkService.getAllBookmarks();

      if (this.state.bookmarks.length === 0) {
        throw new Error('没有找到书签');
      }

      // 使用AI进行分类
      this.uiManager.addLog(`开始AI分类，共${this.state.bookmarks.length}个书签`, 'info');
      this.state.categories = await this.bookmarkService.categorizeBookmarks(
        this.state.bookmarks, 
        settings, 
        this.apiService
      );

      // 显示结果
      this.displayCategories();
      this.uiManager.showSuccess(`分析完成！共分为${Object.keys(this.state.categories).length}个分类`);

    } catch (error) {
      this.uiManager.showError('分析失败', error.message);
    } finally {
      this.state.isProcessing = false;
      this.uiManager.hideLoading();
    }
  }

  // 整理书签
  async organizeBookmarks() {
    if (!this.state.categories || Object.keys(this.state.categories).length === 0) {
      this.uiManager.showWarning('请先进行书签分析');
      return;
    }

    if (this.state.isProcessing) {
      this.uiManager.showWarning('正在处理中，请等待完成');
      return;
    }

    try {
      this.state.isProcessing = true;
      this.uiManager.showLoading('正在整理书签...');

      let organizedCount = 0;
      const totalCategories = Object.keys(this.state.categories).length;

      // 创建主分类文件夹
      const mainFolder = await this.bookmarkService.createBookmarkFolder('AI分类书签', '1');
      
      for (const [categoryName, bookmarks] of Object.entries(this.state.categories)) {
        try {
          // 创建分类文件夹
          const categoryFolder = await this.bookmarkService.createBookmarkFolder(categoryName, mainFolder.id);
          
          // 移动书签到分类文件夹
          for (const bookmark of bookmarks) {
            const matchingBookmark = this.state.bookmarks.find(b => 
              b.url === bookmark.url && b.title === bookmark.title
            );
            
            if (matchingBookmark) {
              await this.bookmarkService.moveBookmark(matchingBookmark.id, categoryFolder.id);
              organizedCount++;
            }
          }
          
          this.uiManager.addLog(`已整理分类"${categoryName}": ${bookmarks.length}个书签`, 'info');
          
        } catch (error) {
          this.uiManager.addLog(`整理分类"${categoryName}"失败: ${error.message}`, 'error');
        }
      }

      this.uiManager.showSuccess(`书签整理完成！共整理了${organizedCount}个书签`);

    } catch (error) {
      this.uiManager.showError('整理失败', error.message);
    } finally {
      this.state.isProcessing = false;
      this.uiManager.hideLoading();
    }
  }

  // 检测重复书签
  async detectDuplicates() {
    try {
      this.uiManager.showLoading('正在检测重复书签...');
      
      const result = await this.detectionService.detectDuplicateBookmarks();
      this.displayDuplicates(result);
      
      this.uiManager.showSuccess(`重复检测完成：发现${result.urlDuplicateCount}个URL重复，${result.titleDuplicateCount}个标题重复`);
    } catch (error) {
      this.uiManager.showError('重复检测失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 检测失效书签
  async detectInvalid() {
    try {
      this.uiManager.showLoading('正在检测失效书签...');
      
      const result = await this.detectionService.detectInvalidBookmarks();
      this.displayInvalid(result);
      
      this.uiManager.showSuccess(`失效检测完成：${result.valid}个有效，${result.invalid}个失效`);
    } catch (error) {
      this.uiManager.showError('失效检测失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 检测空文件夹
  async detectEmpty() {
    try {
      this.uiManager.showLoading('正在检测空文件夹...');
      
      const result = await this.detectionService.detectEmptyFolders();
      this.displayEmpty(result);
      
      this.uiManager.showSuccess(`空文件夹检测完成：发现${result.count}个空文件夹`);
    } catch (error) {
      this.uiManager.showError('空文件夹检测失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 导出书签
  async exportBookmarks() {
    try {
      this.uiManager.showLoading('正在导出书签...');
      
      if (this.state.categories && Object.keys(this.state.categories).length > 0) {
        // 导出分类结果
        await this.importExportService.exportCategoriesAsCsv(this.state.categories);
      } else {
        // 导出原始书签
        await this.importExportService.exportBookmarksAsJson();
      }
      
      this.uiManager.showSuccess('书签导出完成');
    } catch (error) {
      this.uiManager.showError('导出失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 导入书签
  async importBookmarks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.html';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        this.uiManager.showLoading('正在导入书签...');
        
        const text = await file.text();
        let result;
        
        if (file.name.endsWith('.json')) {
          result = await this.importExportService.importBookmarksFromJson(text);
        } else if (file.name.endsWith('.html')) {
          result = await this.importExportService.importBookmarksFromHtml(text);
        } else {
          throw new Error('不支持的文件格式');
        }
        
        if (result.success) {
          this.uiManager.showSuccess(`导入完成：导入了${result.importedCount}个书签`);
        } else {
          throw new Error(result.error);
        }
        
      } catch (error) {
        this.uiManager.showError('导入失败', error.message);
      } finally {
        this.uiManager.hideLoading();
      }
    };
    
    input.click();
  }

  // 打开书签管理器
  async openBookmarkManager() {
    try {
      this.uiManager.showLoading('正在加载书签管理器...');
      
      await this.bookmarkManager.getBookmarkTree();
      
      // 创建管理器窗口
      const managerWindow = this.uiManager.createModal('书签管理器', `
        <div id="bookmark-tree-container" style="height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
          <div id="bookmark-tree"></div>
        </div>
        <div style="margin-top: 10px;">
          <input type="text" id="search-input" placeholder="搜索书签..." style="width: 100%; padding: 5px;">
        </div>
      `, [
        { text: '关闭', onClick: () => {} }
      ]);
      
      // 渲染书签树
      const treeContainer = document.getElementById('bookmark-tree');
      this.bookmarkManager.renderBookmarkTree(treeContainer);
      
      // 搜索功能
      const searchInput = document.getElementById('search-input');
      searchInput.addEventListener('input', Utils.debounce((e) => {
        const query = e.target.value;
        if (query) {
          this.bookmarkManager.searchNodes(query);
        } else {
          this.bookmarkManager.clearSearchHighlight();
        }
      }, 300));
      
      this.uiManager.showSuccess('书签管理器已打开');
    } catch (error) {
      this.uiManager.showError('打开书签管理器失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 生成可视化
  async generateVisualization() {
    if (!this.state.categories || Object.keys(this.state.categories).length === 0) {
      this.uiManager.showWarning('请先进行书签分析');
      return;
    }

    try {
      this.uiManager.showLoading('正在生成可视化...');
      
      // 生成分类图表
      this.visualizationService.generateCategoryChart(this.state.categories, 'category-chart');
      
      // 生成域名图表
      this.visualizationService.generateDomainChart(this.state.bookmarks, 'domain-chart');
      
      // 生成统计摘要
      const stats = this.visualizationService.generateStatsSummary(this.state.bookmarks, this.state.categories);
      this.visualizationService.renderStatsSummary(stats, 'stats-summary');
      
      // 生成词云
      this.visualizationService.generateWordCloud(this.state.bookmarks, 'word-cloud');
      
      this.uiManager.showSuccess('可视化生成完成');
    } catch (error) {
      this.uiManager.showError('可视化生成失败', error.message);
    } finally {
      this.uiManager.hideLoading();
    }
  }

  // 显示分类结果
  displayCategories() {
    const container = document.getElementById('categories');
    if (!container) return;

    let html = '<div class="categories-container">';
    html += '<h3>分类结果</h3>';

    Object.entries(this.state.categories).forEach(([category, bookmarks]) => {
      html += `
        <div class="category-group">
          <h4>${Utils.escapeHtml(category)} (${bookmarks.length})</h4>
          <div class="bookmark-list">
      `;
      
      bookmarks.slice(0, 10).forEach(bookmark => {
        html += `
          <div class="bookmark-item">
            <a href="${Utils.escapeHtml(bookmark.url)}" target="_blank" title="${Utils.escapeHtml(bookmark.url)}">
              ${Utils.escapeHtml(bookmark.title)}
            </a>
          </div>
        `;
      });
      
      if (bookmarks.length > 10) {
        html += `<div class="more-items">...还有${bookmarks.length - 10}个书签</div>`;
      }
      
      html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // 显示重复书签
  displayDuplicates(result) {
    const container = document.getElementById('duplicates');
    if (!container) return;

    let html = '<div class="duplicates-container">';
    html += '<h3>重复书签检测结果</h3>';
    
    if (result.duplicatesByUrl.length > 0) {
      html += '<h4>URL重复</h4>';
      result.duplicatesByUrl.forEach(group => {
        html += `<div class="duplicate-group">`;
        html += `<p><strong>URL:</strong> ${Utils.escapeHtml(group.url)}</p>`;
        html += `<p><strong>重复数量:</strong> ${group.count}</p>`;
        html += '<ul>';
        group.bookmarks.forEach(bookmark => {
          html += `<li>${Utils.escapeHtml(bookmark.title)} (ID: ${bookmark.id})</li>`;
        });
        html += '</ul></div>';
      });
    }
    
    if (result.duplicatesByTitle.length > 0) {
      html += '<h4>标题重复</h4>';
      result.duplicatesByTitle.forEach(group => {
        html += `<div class="duplicate-group">`;
        html += `<p><strong>标题:</strong> ${Utils.escapeHtml(group.title)}</p>`;
        html += `<p><strong>重复数量:</strong> ${group.count}</p>`;
        html += '<ul>';
        group.bookmarks.forEach(bookmark => {
          html += `<li><a href="${Utils.escapeHtml(bookmark.url)}" target="_blank">${Utils.escapeHtml(bookmark.url)}</a> (ID: ${bookmark.id})</li>`;
        });
        html += '</ul></div>';
      });
    }
    
    if (result.duplicatesByUrl.length === 0 && result.duplicatesByTitle.length === 0) {
      html += '<p>没有发现重复书签</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  // 显示失效书签
  displayInvalid(result) {
    const container = document.getElementById('invalid');
    if (!container) return;

    let html = '<div class="invalid-container">';
    html += '<h3>失效书签检测结果</h3>';
    html += `<p>总计: ${result.total}, 有效: ${result.valid}, 失效: ${result.invalid}</p>`;
    
    if (result.invalidBookmarks.length > 0) {
      html += '<div class="invalid-list">';
      result.invalidBookmarks.forEach(bookmark => {
        html += `
          <div class="invalid-item">
            <p><strong>${Utils.escapeHtml(bookmark.title)}</strong></p>
            <p>URL: <a href="${Utils.escapeHtml(bookmark.url)}" target="_blank">${Utils.escapeHtml(bookmark.url)}</a></p>
            <p>错误: ${Utils.escapeHtml(bookmark.error)}</p>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<p>没有发现失效书签</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  // 显示空文件夹
  displayEmpty(result) {
    const container = document.getElementById('empty');
    if (!container) return;

    let html = '<div class="empty-container">';
    html += '<h3>空文件夹检测结果</h3>';
    html += `<p>发现 ${result.count} 个空文件夹</p>`;
    
    if (result.emptyFolders.length > 0) {
      html += '<div class="empty-list">';
      result.emptyFolders.forEach(folder => {
        html += `
          <div class="empty-item">
            <p><strong>${Utils.escapeHtml(folder.title)}</strong> (${folder.type === 'empty' ? '完全空' : '嵌套空'})</p>
            <p>ID: ${folder.id}</p>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<p>没有发现空文件夹</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  // 处理批次完成
  handleBatchComplete(data) {
    this.bookmarkService.mergeCategoryResults(data.categories);
    this.state.currentBatch++;
    
    this.uiManager.updateProgress(
      this.state.currentBatch, 
      this.state.totalBatches, 
      `已完成 ${this.state.currentBatch}/${this.state.totalBatches} 批次`
    );
    
    if (this.state.currentBatch >= this.state.totalBatches) {
      this.displayCategories();
      this.uiManager.showSuccess('所有批次处理完成');
      this.state.isProcessing = false;
      this.uiManager.hideLoading();
    }
  }

  // 清理资源
  cleanup() {
    if (this.state.worker) {
      this.state.worker.terminate();
    }
    this.visualizationService.clearAllCharts();
  }
}

// 全局应用实例
let bookmarkAnalyzer;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    bookmarkAnalyzer = new BookmarkAnalyzer();
    await bookmarkAnalyzer.initialize();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (bookmarkAnalyzer) {
    bookmarkAnalyzer.cleanup();
  }
});

// 导出主要类供外部使用
export { BookmarkAnalyzer, AppState };
