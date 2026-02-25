/**
 * AI智能中枢 - 主控制器
 * 统一管理和协调所有AI功能模块
 */

// 导入必要的模块
import { ApiService } from './modules/apiService.js';
import { BookmarkService } from './modules/bookmarkService.js';
import { DetectionService } from './modules/detectionService.js';
import { ImportExportService } from './modules/importExportService.js';

class AIHub {
  constructor() {
    // 初始化服务模块
    this.apiService = new ApiService();
    this.bookmarkService = new BookmarkService();
    this.detectionService = new DetectionService();
    this.importExportService = new ImportExportService();
    
    this.state = {
      isInitialized: false,
      bookmarkCount: 0,
      categoryCount: 0,
      apiStatus: 'checking',
      lastAnalysis: null,
      activities: []
    };

    // 设置日志回调
    this.setupLogCallbacks();
  }

  // 设置日志回调
  setupLogCallbacks() {
    const logCallback = (message, type) => this.addActivity(message, type);
    
    this.apiService.setLogCallback(logCallback);
    this.bookmarkService.setLogCallback(logCallback);
    this.detectionService.setLogCallback(logCallback);
    this.importExportService.setLogCallback(logCallback);
  }

  // 初始化中枢
  async initialize() {
    try {
      this.addActivity('🚀 AI智能中枢启动中...', 'info');
      
      // 加载基础数据
      await this.loadSystemStatus();
      
      // 绑定全局函数
      this.bindGlobalFunctions();
      
      // 加载最近活动
      await this.loadRecentActivities();
      
      this.state.isInitialized = true;
      this.addActivity('✅ AI智能中枢启动完成', 'success');
      
    } catch (error) {
      this.addActivity(`❌ 启动失败: ${error.message}`, 'error');
      console.error('AI Hub initialization failed:', error);
    }
  }

  // 加载系统状态
  async loadSystemStatus() {
    try {
      // 检查API状态
      const apiStatus = await this.apiService.checkApiStatus();
      this.updateApiStatus(apiStatus);
      
      // 加载书签统计
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      this.updateBookmarkCount(bookmarks.length);
      
      // 加载分析记录
      await this.loadAnalysisHistory();
      
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  }

  // 更新API状态显示
  updateApiStatus(status) {
    const statusElement = document.getElementById('api-status');
    if (statusElement) {
      if (status.connected) {
        statusElement.textContent = '✅ 已连接';
        statusElement.style.color = '#4ade80';
        this.addActivity(`🔌 API已连接: ${status.provider}`, 'success');
      } else {
        statusElement.textContent = '❌ 未配置';
        statusElement.style.color = '#f87171';
        this.addActivity('⚠️ API未配置，请先配置API密钥', 'warning');
      }
    }
  }

  // 更新书签计数
  updateBookmarkCount(count) {
    const countElement = document.getElementById('bookmark-count');
    if (countElement) {
      countElement.textContent = count.toLocaleString();
      this.state.bookmarkCount = count;
    }
  }

  // 更新分类计数
  updateCategoryCount(count) {
    const countElement = document.getElementById('category-count');
    if (countElement) {
      countElement.textContent = count;
      this.state.categoryCount = count;
    }
  }

  // 加载分析历史
  async loadAnalysisHistory() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['lastAnalysis', 'analysisHistory'], (result) => {
          if (result.lastAnalysis) {
            const lastAnalysis = new Date(result.lastAnalysis);
            const timeAgo = this.getTimeAgo(lastAnalysis);
            
            const lastAnalysisElement = document.getElementById('last-analysis');
            if (lastAnalysisElement) {
              lastAnalysisElement.textContent = timeAgo;
            }
            
            this.state.lastAnalysis = lastAnalysis;
          }
          
          if (result.analysisHistory) {
            // 可以在这里处理历史记录
          }
        });
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  }

  // 加载最近活动
  async loadRecentActivities() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['recentActivities'], (result) => {
          if (result.recentActivities) {
            this.state.activities = result.recentActivities.slice(0, 10);
            this.renderActivities();
          }
        });
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
    }
  }

  // 添加活动记录
  addActivity(message, type = 'info') {
    const activity = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    this.state.activities.unshift(activity);
    
    // 限制活动记录数量
    if (this.state.activities.length > 50) {
      this.state.activities = this.state.activities.slice(0, 50);
    }
    
    // 保存到存储
    this.saveActivities();
    
    // 更新UI
    this.renderActivities();
  }

  // 保存活动记录
  saveActivities() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        recentActivities: this.state.activities
      });
    }
  }

  // 渲染活动列表
  renderActivities() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // 保留欢迎消息，添加其他活动
    const activities = this.state.activities.slice(0, 5);
    
    let html = `
      <div class="activity-item">
        <div class="activity-icon">🎉</div>
        <div class="activity-content">
          <div class="activity-text">AI智能中枢已启动</div>
          <div class="activity-time">刚刚</div>
        </div>
      </div>
    `;
    
    activities.forEach(activity => {
      const icon = this.getActivityIcon(activity.type);
      const timeAgo = this.getTimeAgo(activity.timestamp);
      
      html += `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-text">${activity.message}</div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        </div>
      `;
    });
    
    activityList.innerHTML = html;
  }

  // 获取活动图标
  getActivityIcon(type) {
    const icons = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'analysis': '🧠',
      'detection': '🔍',
      'export': '📤',
      'import': '📥',
      'backup': '💾'
    };
    return icons[type] || '📋';
  }

  // 计算时间差
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    
    return date.toLocaleDateString();
  }

  // 绑定全局函数
  bindGlobalFunctions() {
    // 页面导航
    window.openAnalysisCenter = () => {
      this.addActivity('🧠 打开AI分析中心', 'info');
      window.open('ai-analysis-center.html', '_blank');
    };

    window.openBookmarkManager = () => {
      this.addActivity('📚 打开增强书签管理器', 'info');
      window.open('enhanced-bookmark-manager.html', '_blank');
    };

    window.openSettings = () => {
      this.addActivity('⚙️ 打开设置页面', 'info');
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      } else {
        window.open('options.html', '_blank');
      }
    };

    // 直接操作
    window.openDetectionCenter = () => {
      this.addActivity('🔍 切换到问题检测', 'info');
      window.open('ai-analysis-center.html#detection', '_blank');
    };

    window.openVisualization = () => {
      this.addActivity('📊 切换到数据可视化', 'info');
      window.open('ai-analysis-center.html#visualization', '_blank');
    };

    window.openDataCenter = () => {
      this.addActivity('💾 切换到数据管理', 'info');
      window.open('ai-analysis-center.html#data', '_blank');
    };

    // 快速操作
    window.startQuickAnalysis = this.startQuickAnalysis.bind(this);
    window.startFullDetection = this.startFullDetection.bind(this);
    window.createQuickFolder = this.createQuickFolder.bind(this);
    window.generateCharts = this.generateCharts.bind(this);
    window.createBackup = this.createBackup.bind(this);
    window.testApiConnection = this.testApiConnection.bind(this);
  }

  // 快速分析
  async startQuickAnalysis() {
    try {
      this.addActivity('🚀 开始快速AI分析...', 'analysis');
      
      // 检查API状态
      const apiStatus = await this.apiService.checkApiStatus();
      if (!apiStatus.connected) {
        this.addActivity('❌ API未配置，请先设置API密钥', 'error');
        this.openSettings();
        return;
      }

      // 获取书签
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      if (bookmarks.length === 0) {
        this.addActivity('⚠️ 没有找到书签', 'warning');
        return;
      }

      this.addActivity(`📚 开始分析 ${bookmarks.length} 个书签`, 'info');
      
      // 打开分析中心并自动开始分析
      const analysisWindow = window.open('ai-analysis-center.html?auto=true', '_blank');
      
      // 更新最后分析时间
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          lastAnalysis: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this.addActivity(`❌ 快速分析失败: ${error.message}`, 'error');
    }
  }

  // 全面检测
  async startFullDetection() {
    try {
      this.addActivity('🔍 开始全面问题检测...', 'detection');
      
      // 打开分析中心的检测标签页
      window.open('ai-analysis-center.html?tab=detection&auto=true', '_blank');
      
    } catch (error) {
      this.addActivity(`❌ 检测启动失败: ${error.message}`, 'error');
    }
  }

  // 创建快速文件夹
  async createQuickFolder() {
    const folderName = prompt('请输入文件夹名称:');
    if (!folderName || !folderName.trim()) return;

    try {
      this.addActivity(`📁 创建文件夹: ${folderName}`, 'info');
      
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.create({
            parentId: '1', // 书签栏
            title: folderName.trim()
          }, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
        
        this.addActivity('✅ 文件夹创建成功', 'success');
      } else {
        this.addActivity('⚠️ 请在扩展环境中使用此功能', 'warning');
      }
      
    } catch (error) {
      this.addActivity(`❌ 创建文件夹失败: ${error.message}`, 'error');
    }
  }

  // 生成图表
  async generateCharts() {
    try {
      this.addActivity('📊 生成数据可视化图表...', 'info');
      
      // 打开分析中心的可视化标签页
      window.open('ai-analysis-center.html?tab=visualization&auto=true', '_blank');
      
    } catch (error) {
      this.addActivity(`❌ 图表生成失败: ${error.message}`, 'error');
    }
  }

  // 创建备份
  async createBackup() {
    try {
      this.addActivity('💾 创建书签备份...', 'backup');
      
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        bookmarkCount: bookmarks.length,
        bookmarks: bookmarks,
        metadata: {
          userAgent: navigator.userAgent,
          exportSource: 'AI智能中枢'
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
      
      // 保存备份记录
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          lastBackup: new Date().toISOString()
        });
      }
      
      this.addActivity('✅ 备份创建成功', 'success');
      
    } catch (error) {
      this.addActivity(`❌ 备份创建失败: ${error.message}`, 'error');
    }
  }

  // 测试API连接
  async testApiConnection() {
    try {
      this.addActivity('🧪 测试API连接...', 'info');
      
      const status = await this.apiService.checkApiStatus();
      this.updateApiStatus(status);
      
      if (status.connected) {
        this.addActivity(`✅ API测试成功: ${status.provider}`, 'success');
      } else {
        this.addActivity('❌ API测试失败: 未配置或配置错误', 'error');
      }
      
    } catch (error) {
      this.addActivity(`❌ API测试失败: ${error.message}`, 'error');
    }
  }

  // 刷新系统状态
  async refreshStatus() {
    this.addActivity('🔄 刷新系统状态...', 'info');
    await this.loadSystemStatus();
    this.addActivity('✅ 状态刷新完成', 'success');
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff3b30' : '#007aff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后自动消失
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 获取系统统计
  getSystemStats() {
    return {
      bookmarkCount: this.state.bookmarkCount,
      categoryCount: this.state.categoryCount,
      apiConnected: this.state.apiStatus === 'connected',
      lastAnalysis: this.state.lastAnalysis,
      activitiesCount: this.state.activities.length
    };
  }

  // 导出系统报告
  async exportSystemReport() {
    try {
      this.addActivity('📋 生成系统报告...', 'info');
      
      const stats = this.getSystemStats();
      const report = {
        generatedAt: new Date().toISOString(),
        systemStats: stats,
        recentActivities: this.state.activities.slice(0, 20),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `系统报告_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.addActivity('✅ 系统报告导出完成', 'success');
      
    } catch (error) {
      this.addActivity(`❌ 报告导出失败: ${error.message}`, 'error');
    }
  }
}

// 初始化AI中枢
let aiHub = null;

document.addEventListener('DOMContentLoaded', async () => {
  aiHub = new AIHub();
  await aiHub.initialize();
});

// 导出到全局作用域
window.aiHub = aiHub;