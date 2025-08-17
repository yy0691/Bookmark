/**
 * UI管理模块 - 处理界面状态、进度显示、日志管理等
 */

export class UIManager {
  constructor() {
    this.logContainer = null;
    this.currentLogContainerId = 'analysis-log'; // 默认日志容器
    this.progressContainer = null;
    this.statusElement = null;
    this.progressBar = null;
    this.loadingOverlay = null;
    
    this.initialize();
  }

  // 初始化UI元素
  initialize() {
    // 优先使用分析日志容器，如果不存在则使用通用日志容器
    this.logContainer = document.getElementById('analysis-log') || document.getElementById('log');
    this.progressBar = document.getElementById('progress');
    this.statusElement = document.getElementById('status');
    
    // 确保日志容器存在
    if (!this.logContainer) {
      console.warn('日志容器未找到，创建默认容器');
      this.createDefaultLogContainer();
    }
  }

  // 创建默认日志容器
  createDefaultLogContainer() {
    this.logContainer = document.createElement('div');
    this.logContainer.id = 'log';
    this.logContainer.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      background: #f9f9f9;
      font-family: monospace;
      font-size: 12px;
    `;
    document.body.appendChild(this.logContainer);
  }

  // 设置当前日志容器
  setLogContainer(containerId) {
    this.currentLogContainerId = containerId;
    this.logContainer = document.getElementById(containerId);
    if (!this.logContainer) {
      // 如果指定容器不存在，回退到默认容器
      this.logContainer = document.getElementById('analysis-log') || document.getElementById('log');
    }
  }

  // 添加日志
  addLog(message, type = 'info') {
    // 使用当前设置的日志容器
    const container = document.getElementById(this.currentLogContainerId) || this.logContainer;
    if (!container) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    // 设置日志样式 - 适配暗色主题
    const styles = {
      info: { color: 'var(--text-primary, #e0e0e0)', background: 'transparent' },
      success: { color: 'var(--success-color, #4ade80)', background: 'var(--success-bg, rgba(74, 222, 128, 0.1))' },
      warning: { color: 'var(--warning-color, #fbbf24)', background: 'var(--warning-bg, rgba(251, 191, 36, 0.1))' },
      error: { color: 'var(--error-color, #f87171)', background: 'var(--error-bg, rgba(248, 113, 113, 0.1))' }
    };
    
    const style = styles[type] || styles.info;
    logEntry.innerHTML = `
      <span class="log-time">${timestamp}</span>
      <span class="log-message">${message}</span>
    `;
    logEntry.style.cssText = `
      color: ${style.color};
      background: ${style.background};
      padding: 4px 8px;
      margin: 2px 0;
      border-radius: 3px;
      font-size: 13px;
    `;
    
    container.appendChild(logEntry);
    container.scrollTop = container.scrollHeight;
    
    // 限制日志条数，避免内存占用过多
    const maxLogs = 1000;
    while (container.children.length > maxLogs) {
      container.removeChild(container.firstChild);
    }
  }

  // 更新进度条
  updateProgress(current, total, message = '') {
    if (!this.progressBar) {
      console.log(`进度: ${current}/${total} ${message}`);
      return;
    }

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    // 更新进度条
    const progressFill = this.progressBar.querySelector('.progress-fill') || 
                        this.createProgressFill();
    
    progressFill.style.width = `${percentage}%`;
    
    // 更新进度文本
    const progressText = this.progressBar.querySelector('.progress-text') || 
                        this.createProgressText();
    
    progressText.textContent = message || `${current}/${total} (${percentage}%)`;
    
    // 显示/隐藏进度条
    this.progressBar.style.display = total > 0 ? 'block' : 'none';
  }

  // 创建进度条填充元素
  createProgressFill() {
    let progressFill = this.progressBar.querySelector('.progress-fill');
    if (!progressFill) {
      progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        border-radius: inherit;
        transition: width 0.3s ease;
        width: 0%;
      `;
      this.progressBar.appendChild(progressFill);
    }
    return progressFill;
  }

  // 创建进度文本元素
  createProgressText() {
    let progressText = this.progressBar.querySelector('.progress-text');
    if (!progressText) {
      progressText = document.createElement('div');
      progressText.className = 'progress-text';
      progressText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      `;
      this.progressBar.appendChild(progressText);
    }
    return progressText;
  }

  // 更新状态显示
  updateStatus(message, type = 'info') {
    if (!this.statusElement) {
      console.log(`状态: ${message}`);
      return;
    }

    this.statusElement.textContent = message;
    this.statusElement.className = `status status-${type}`;
    
    // 设置状态样式
    const styles = {
      info: { color: '#17a2b8', background: '#d1ecf1' },
      success: { color: '#155724', background: '#d4edda' },
      warning: { color: '#856404', background: '#fff3cd' },
      error: { color: '#721c24', background: '#f8d7da' },
      processing: { color: '#004085', background: '#cce7ff' }
    };
    
    const style = styles[type] || styles.info;
    this.statusElement.style.cssText = `
      padding: 8px 12px;
      border-radius: 4px;
      background: ${style.background};
      color: ${style.color};
      border: 1px solid ${style.color}33;
      margin: 10px 0;
    `;
  }

  // 显示加载状态
  showLoading(message = '处理中...') {
    this.isProcessing = true;
    this.updateStatus(message, 'processing');
    
    // 禁用相关按钮
    this.toggleButtons(false);
  }

  // 隐藏加载状态
  hideLoading() {
    this.isProcessing = false;
    this.updateStatus('就绪', 'info');
    
    // 启用相关按钮
    this.toggleButtons(true);
  }

  // 切换按钮状态
  toggleButtons(enabled) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (enabled) {
        button.removeAttribute('disabled');
        button.style.opacity = '1';
      } else {
        button.setAttribute('disabled', 'true');
        button.style.opacity = '0.6';
      }
    });
  }

  // 清空日志
  clearLog() {
    if (this.logContainer) {
      this.logContainer.innerHTML = '';
    }
  }

  // 重置进度条
  resetProgress() {
    this.updateProgress(0, 0);
  }

  // 显示错误消息
  showError(message, details = null) {
    this.addLog(`错误: ${message}`, 'error');
    this.updateStatus(`错误: ${message}`, 'error');
    
    if (details) {
      this.addLog(`详细信息: ${details}`, 'error');
    }
    
    this.hideLoading();
  }

  // 显示成功消息
  showSuccess(message) {
    this.addLog(message, 'success');
    this.updateStatus(message, 'success');
  }

  // 显示警告消息
  showWarning(message) {
    this.addLog(message, 'warning');
    this.updateStatus(message, 'warning');
  }

  // 创建模态对话框
  createModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const modalHeader = document.createElement('h3');
    modalHeader.textContent = title;
    modalHeader.style.cssText = `
      margin: 0 0 15px 0;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    `;

    const modalBody = document.createElement('div');
    modalBody.innerHTML = content;
    modalBody.style.cssText = `
      margin-bottom: 20px;
      line-height: 1.5;
    `;

    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    `;

    buttons.forEach(buttonConfig => {
      const button = document.createElement('button');
      button.textContent = buttonConfig.text;
      button.className = buttonConfig.primary ? 'btn-primary' : 'btn-secondary';
      button.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: ${buttonConfig.primary ? '#007bff' : '#6c757d'};
        color: white;
      `;
      
      button.onclick = () => {
        if (buttonConfig.onClick) {
          buttonConfig.onClick();
        }
        document.body.removeChild(modal);
      };
      
      modalFooter.appendChild(button);
    });

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);

    // 点击遮罩关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    document.body.appendChild(modal);
    return modal;
  }

  // 显示确认对话框
  showConfirm(title, message, onConfirm, onCancel = null) {
    return this.createModal(title, message, [
      {
        text: '取消',
        onClick: onCancel
      },
      {
        text: '确认',
        primary: true,
        onClick: onConfirm
      }
    ]);
  }

  // 显示信息对话框
  showAlert(title, message, onOk = null) {
    return this.createModal(title, message, [
      {
        text: '确定',
        primary: true,
        onClick: onOk
      }
    ]);
  }

  // 更新元素内容
  updateElement(elementId, content, isHtml = false) {
    const element = document.getElementById(elementId);
    if (element) {
      if (isHtml) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    }
  }

  // 显示/隐藏元素
  toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  // 添加CSS样式
  addStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // 格式化数字
  formatNumber(num) {
    return new Intl.NumberFormat('zh-CN').format(num);
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 格式化时间
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
}
