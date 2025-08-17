/**
 * 可视化服务模块 - 处理图表生成、统计显示等可视化功能
 */

export class VisualizationService {
  constructor() {
    this.logCallback = null;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;
    this.cache = {
      wordcloudData: null,
      treeviewData: null,
      chartsData: null,
      lastUpdate: null
    };
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  /**
   * 初始化可视化服务
   */
  async initialize() {
    try {
      this.log('正在初始化可视化服务...', 'info');
      
      // 初始化完成
      this.log('可视化服务初始化完成', 'success');
      return true;
    } catch (error) {
      this.log(`可视化服务初始化失败: ${error.message}`, 'error');
      return false;
    }
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 生成分类统计图表
  generateCategoryChart(categories, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.log(`图表容器 ${containerId} 未找到`, 'error');
      return;
    }

    // 准备数据
    const data = Object.entries(categories).map(([name, bookmarks]) => ({
      category: name,
      count: bookmarks.length
    })).sort((a, b) => b.count - a.count);

    // 检查是否有Chart.js
    if (typeof Chart !== 'undefined') {
      this.createChartJsVisualization(container, data);
    } else {
      this.createSimpleBarChart(container, data);
    }
  }

  // 使用Chart.js创建图表
  createChartJsVisualization(container, data) {
    // 清除现有图表
    const existingChart = this.chartInstances.get(container.id);
    if (existingChart) {
      existingChart.destroy();
    }

    container.innerHTML = '<canvas></canvas>';
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: this.generateColors(data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label} (${data.datasets[0].data[i]})`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: data.datasets[0].borderWidth
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    this.chartInstances.set(container.id, chart);
    this.log('Chart.js图表创建完成', 'success');
  }

  // 创建简单的条形图
  createSimpleBarChart(container, data) {
    const maxCount = Math.max(...data.map(d => d.count));
    const colors = this.generateColors(data.length);
    
    let html = '<div class="simple-chart">';
    html += '<style>';
    html += `
      .simple-chart {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .chart-bar {
        display: flex;
        align-items: center;
        margin: 8px 0;
        height: 30px;
      }
      .bar-label {
        width: 150px;
        font-size: 12px;
        text-align: right;
        padding-right: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bar-fill {
        height: 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        padding: 0 8px;
        color: white;
        font-size: 11px;
        font-weight: bold;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        min-width: 30px;
      }
      .chart-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        text-align: center;
      }
    `;
    html += '</style>';
    
    html += '<div class="chart-title">书签分类统计</div>';
    
    data.forEach((item, index) => {
      const percentage = (item.count / maxCount) * 100;
      const width = Math.max(percentage, 10); // 最小宽度10%
      
      html += `
        <div class="chart-bar">
          <div class="bar-label" title="${item.category}">${item.category}</div>
          <div class="bar-fill" style="background: ${colors[index]}; width: ${width}%">
            ${item.count}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    this.log('简单条形图创建完成', 'success');
  }

  // 生成域名统计图表
  generateDomainChart(bookmarks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.log(`域名图表容器 ${containerId} 未找到`, 'error');
      return;
    }

    // 统计域名
    const domainMap = new Map();
    bookmarks.forEach(bookmark => {
      try {
        const url = new URL(bookmark.url);
        const domain = url.hostname.replace(/^www\./, '');
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
      } catch (e) {
        // 忽略无效URL
      }
    });

    // 取前20个域名
    const topDomains = Array.from(domainMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([domain, count]) => ({ domain, count }));

    if (topDomains.length === 0) {
      container.innerHTML = '<p>没有有效的域名数据</p>';
      return;
    }

    this.createDomainBarChart(container, topDomains);
  }

  // 创建域名条形图
  createDomainBarChart(container, data) {
    const maxCount = Math.max(...data.map(d => d.count));
    
    let html = '<div class="domain-chart">';
    html += '<style>';
    html += `
      .domain-chart {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .domain-bar {
        display: flex;
        align-items: center;
        margin: 6px 0;
        height: 25px;
      }
      .domain-label {
        width: 200px;
        font-size: 11px;
        text-align: right;
        padding-right: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .domain-fill {
        height: 18px;
        background: linear-gradient(90deg, #4CAF50, #45a049);
        border-radius: 9px;
        display: flex;
        align-items: center;
        padding: 0 6px;
        color: white;
        font-size: 10px;
        font-weight: bold;
        min-width: 25px;
      }
      .domain-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 15px;
        text-align: center;
      }
    `;
    html += '</style>';
    
    html += '<div class="domain-title">热门域名统计 (Top 20)</div>';
    
    data.forEach(item => {
      const percentage = (item.count / maxCount) * 100;
      const width = Math.max(percentage, 8);
      
      html += `
        <div class="domain-bar">
          <div class="domain-label" title="${item.domain}">${item.domain}</div>
          <div class="domain-fill" style="width: ${width}%">
            ${item.count}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    this.log(`域名统计图表创建完成，显示${data.length}个域名`, 'success');
  }

  // 生成统计摘要
  generateStatsSummary(bookmarks, categories) {
    const stats = {
      totalBookmarks: bookmarks.length,
      totalCategories: Object.keys(categories).length,
      avgBookmarksPerCategory: 0,
      largestCategory: { name: '', count: 0 },
      smallestCategory: { name: '', count: Infinity },
      domains: new Set(),
      duplicateUrls: 0
    };

    // 计算平均值
    if (stats.totalCategories > 0) {
      stats.avgBookmarksPerCategory = Math.round(stats.totalBookmarks / stats.totalCategories);
    }

    // 找出最大和最小分类
    Object.entries(categories).forEach(([name, items]) => {
      if (items.length > stats.largestCategory.count) {
        stats.largestCategory = { name, count: items.length };
      }
      if (items.length < stats.smallestCategory.count) {
        stats.smallestCategory = { name, count: items.length };
      }
    });

    // 统计域名和重复URL
    const urlSet = new Set();
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        if (urlSet.has(bookmark.url)) {
          stats.duplicateUrls++;
        } else {
          urlSet.add(bookmark.url);
        }

        try {
          const domain = new URL(bookmark.url).hostname.replace(/^www\./, '');
          stats.domains.add(domain);
        } catch (e) {
          // 忽略无效URL
        }
      }
    });

    stats.uniqueDomains = stats.domains.size;
    delete stats.domains; // 删除Set对象，避免序列化问题

    return stats;
  }

  // 渲染统计摘要
  renderStatsSummary(stats, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.log(`统计摘要容器 ${containerId} 未找到`, 'error');
      return;
    }

    const html = `
      <div class="stats-summary">
        <style>
          .stats-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 12px;
            opacity: 0.9;
          }
          .stat-card:nth-child(2n) {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .stat-card:nth-child(3n) {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          .stat-card:nth-child(4n) {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        </style>
        
        <div class="stat-card">
          <div class="stat-number">${stats.totalBookmarks}</div>
          <div class="stat-label">总书签数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.totalCategories}</div>
          <div class="stat-label">分类数量</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.avgBookmarksPerCategory}</div>
          <div class="stat-label">平均每类书签数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.uniqueDomains}</div>
          <div class="stat-label">不同域名数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.largestCategory.count}</div>
          <div class="stat-label">最大分类<br><small>${stats.largestCategory.name}</small></div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.duplicateUrls}</div>
          <div class="stat-label">重复URL数</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.log('统计摘要渲染完成', 'success');
  }

  // 生成颜色数组
  generateColors(count) {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
      '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB'
    ];
    
    // 如果需要更多颜色，生成随机颜色
    while (colors.length < count) {
      const hue = Math.floor(Math.random() * 360);
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return colors.slice(0, count);
  }

  // 创建词云（简化版）
  generateWordCloud(bookmarks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.log(`词云容器 ${containerId} 未找到`, 'error');
      return;
    }

    // 提取关键词
    const wordMap = new Map();
    bookmarks.forEach(bookmark => {
      const title = bookmark.title || '';
      const words = title.split(/[\s\-_,.，。、]+/).filter(word => 
        word.length > 1 && !/^\d+$/.test(word)
      );
      
      words.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord) {
          wordMap.set(cleanWord, (wordMap.get(cleanWord) || 0) + 1);
        }
      });
    });

    // 取前30个高频词
    const topWords = Array.from(wordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    if (topWords.length === 0) {
      container.innerHTML = '<p>没有足够的文本数据生成词云</p>';
      return;
    }

    this.createSimpleWordCloud(container, topWords);
  }

  // 创建简单词云
  createSimpleWordCloud(container, words) {
    const maxCount = Math.max(...words.map(w => w[1]));
    const colors = this.generateColors(words.length);
    
    let html = '<div class="word-cloud">';
    html += '<style>';
    html += `
      .word-cloud {
        padding: 20px;
        text-align: center;
        line-height: 1.5;
      }
      .word-item {
        display: inline-block;
        margin: 5px;
        padding: 3px 8px;
        border-radius: 15px;
        font-weight: bold;
        cursor: default;
        transition: transform 0.2s;
      }
      .word-item:hover {
        transform: scale(1.1);
      }
      .word-cloud-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
      }
    `;
    html += '</style>';
    
    html += '<div class="word-cloud-title">书签标题关键词云</div>';
    
    words.forEach(([word, count], index) => {
      const fontSize = Math.max(12, (count / maxCount) * 24 + 12);
      const color = colors[index % colors.length];
      
      html += `
        <span class="word-item" 
              style="font-size: ${fontSize}px; background: ${color}; color: white;"
              title="${word}: ${count}次">
          ${word}
        </span>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    this.log(`词云创建完成，显示${words.length}个关键词`, 'success');
  }

  // 清除所有图表
  clearAllCharts() {
    this.chartInstances.forEach(chart => {
      chart.destroy();
    });
    this.chartInstances.clear();
    this.log('所有图表已清除', 'info');
  }

  // 渲染书签列表/网格
  renderBookmarks(container, bookmarks, view = 'grid') {
    if (!container) {
      this.log('书签渲染容器未找到', 'error');
      return;
    }

    // 为视图切换管理容器类
    container.classList.remove('grid-view', 'list-view');
    container.classList.add(view === 'list' ? 'list-view' : 'grid-view');

    if (!bookmarks || bookmarks.length === 0) {
      container.innerHTML = '<p class="empty-message">没有书签可显示。</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    bookmarks.forEach(bookmark => {
      if (!bookmark.url) return; // 只渲染书签，不渲染文件夹

      const item = document.createElement('a');
      item.href = bookmark.url;
      item.className = 'bookmark-item';
      item.title = `${bookmark.title}\n${bookmark.url}`;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';

      // Extract tags from bookmark title (format: [tag1][tag2] Title)
      const tagRegex = /^\[([^\]]+)\]/g;
      const tags = [];
      let cleanTitle = bookmark.title || '无标题';
      let match;
      
      while ((match = tagRegex.exec(bookmark.title || '')) !== null) {
        tags.push(match[1]);
        cleanTitle = cleanTitle.replace(match[0], '').trim();
      }

      const tagsHtml = tags.length > 0 ? 
        `<div class="bookmark-tags">${tags.map(tag => `<span class="bookmark-tag">${tag}</span>`).join('')}</div>` : '';

      // Create favicon using the favicon service from the main page
      const faviconContainer = document.createElement('div');
      faviconContainer.className = 'favicon-container';
      
      // Use Google's favicon service for better reliability
      const domain = new URL(bookmark.url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
      item.innerHTML = `
        <img src="${faviconUrl}" alt="" class="favicon" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSIjNjM2NjcwIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxMy43OTA5IDI0IDEyIDIyLjIwOTEgMTIgMjBIMjBDMjAgMjIuMjA5MSAxOC4yMDkxIDI0IDE2IDI0WiIgZmlsbD0iIzYzNjY3MCIvPgo8L3N2Zz4K'"/>
        <div class="bookmark-info">
          <div class="bookmark-title">${cleanTitle}</div>
          <div class="bookmark-url">${domain}</div>
          ${tagsHtml}
        </div>
      `;
      
      // Add right-click context menu support
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Dispatch custom event for context menu
        const contextMenuEvent = new CustomEvent('bookmarkContextMenu', {
          detail: { event: e, bookmark: bookmark }
        });
        document.dispatchEvent(contextMenuEvent);
      });
      
      fragment.appendChild(item);
    });

    container.innerHTML = ''; // 清空旧内容
    container.appendChild(fragment);
    this.log(`成功渲染 ${bookmarks.length} 个书签到容器`, 'success');
  }

  // 导出图表为图片
  exportChartAsImage(containerId, filename) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.log(`容器 ${containerId} 未找到`, 'error');
      return;
    }

    // 使用html2canvas导出（如果可用）
    if (typeof html2canvas !== 'undefined') {
      html2canvas(container).then(canvas => {
        const link = document.createElement('a');
        link.download = filename || 'chart.png';
        link.href = canvas.toDataURL();
        link.click();
        this.log(`图表已导出为图片: ${filename}`, 'success');
      });
    } else {
      this.log('html2canvas库未找到，无法导出图片', 'warning');
    }
  }
}
