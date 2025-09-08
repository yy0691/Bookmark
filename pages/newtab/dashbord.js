/**
 * 书签数据分析Dashboard - 智能分析中心
 * 基于设计文档要求实现的数据可视化页面
 */

// 导入模块
import { BookmarkService } from '../../modules/bookmarkService.js';
import { VisualizationService } from '../../modules/visualizationService.js';
import { ApiService } from '../../modules/apiService.js';

class Dashboard {
    constructor() {
        this.bookmarkService = new BookmarkService();
        this.visualizationService = new VisualizationService();
        this.apiService = new ApiService();
        
        this.bookmarks = [];
        this.categories = {};
        this.stats = {};
        this.isLoading = true;
        this.error = null;
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.loadData = this.loadData.bind(this);
        this.renderMetrics = this.renderMetrics.bind(this);
        this.renderWordCloud = this.renderWordCloud.bind(this);
        this.renderCategoryChart = this.renderCategoryChart.bind(this);
        this.renderActivityHeatmap = this.renderActivityHeatmap.bind(this);
        this.handleError = this.handleError.bind(this);
        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
    }
    
    /**
     * 初始化Dashboard
     */
    async init() {
        try {
            console.log('🚀 初始化书签数据分析Dashboard...');
            
            // 设置日志回调
            this.bookmarkService.setLogCallback(this.log.bind(this));
            this.visualizationService.setLogCallback(this.log.bind(this));
            
            // 初始化可视化服务
            await this.visualizationService.initialize();
            
            // 加载数据
            await this.loadData();
            
            // 渲染所有组件
            this.renderMetrics();
            this.renderWordCloud();
            this.renderCategoryChart();
            this.renderActivityHeatmap();
            
            this.isLoading = false;
            console.log('✅ Dashboard初始化完成');
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * 加载书签数据
     */
    async loadData() {
        try {
            console.log('📊 开始加载书签数据...');
            
            // 获取所有书签
            this.bookmarks = await this.bookmarkService.getAllBookmarks();
            console.log(`📚 获取到 ${this.bookmarks.length} 个书签`);
            
            if (this.bookmarks.length === 0) {
                throw new Error('没有找到任何书签数据');
            }
            
            // 生成统计信息
            this.stats = this.generateStats();
            console.log('📈 统计信息生成完成:', this.stats);
            
            // 生成分类数据（使用预分类）
            this.categories = this.bookmarkService.performPreCategorization(
                this.bookmarks.map(b => ({
                    title: b.title || '未命名书签',
                    url: b.url || '',
                    domain: this.extractDomain(b.url)
                }))
            );
            console.log('🏷️ 分类数据生成完成:', Object.keys(this.categories).length, '个分类');
            
        } catch (error) {
            console.error('❌ 数据加载失败:', error);
            throw error;
        }
    }
    
    /**
     * 生成统计信息
     */
    generateStats() {
        const totalBookmarks = this.bookmarks.length;
        const domains = new Set();
        const urlSet = new Set();
        let duplicateUrls = 0;
        
        // 统计域名和重复URL
        this.bookmarks.forEach(bookmark => {
            if (bookmark.url) {
                if (urlSet.has(bookmark.url)) {
                    duplicateUrls++;
                } else {
                    urlSet.add(bookmark.url);
                }
                
                try {
                    const domain = new URL(bookmark.url).hostname.replace(/^www\./, '');
                    domains.add(domain);
                } catch (e) {
                    // 忽略无效URL
                }
            }
        });
        
        // 计算分类统计
        const categoryStats = Object.entries(this.categories).map(([name, items]) => ({
            name,
            count: items.length
        })).sort((a, b) => b.count - a.count);
        
        const largestCategory = categoryStats[0] || { name: '无', count: 0 };
        const avgBookmarksPerCategory = categoryStats.length > 0 
            ? Math.round(totalBookmarks / categoryStats.length) 
            : 0;
        
        return {
            totalBookmarks,
            totalCategories: categoryStats.length,
            avgBookmarksPerCategory,
            largestCategory,
            uniqueDomains: domains.size,
            duplicateUrls,
            emptyFolders: 0, // 暂时设为0，后续可以扩展
            deadLinks: 0 // 暂时设为0，后续可以扩展
        };
    }
    
    /**
     * 渲染关键指标卡片
     */
    renderMetrics() {
        const metricsGrid = document.getElementById('metricsGrid');
        if (!metricsGrid) return;
        
        const metrics = [
            {
                title: '书签总数',
                value: this.stats.totalBookmarks,
                icon: 'bookmark',
                color: 'var(--accent-blue)',
                trend: 'up',
                trendValue: '+2.5%'
            },
            {
                title: '分类数量',
                value: this.stats.totalCategories,
                icon: 'folder',
                color: 'var(--accent-purple)',
                trend: 'neutral',
                trendValue: '0%'
            },
            {
                title: '重复书签',
                value: this.stats.duplicateUrls,
                icon: 'copy',
                color: 'var(--brand-warning)',
                trend: 'up',
                trendValue: '+0.8%'
            },
            {
                title: '不同域名',
                value: this.stats.uniqueDomains,
                icon: 'globe',
                color: 'var(--brand-success)',
                trend: 'up',
                trendValue: '+1.2%'
            }
        ];
        
        metricsGrid.innerHTML = metrics.map(metric => `
            <a href="#" class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon" style="background: ${metric.color}">
                        <i data-lucide="${metric.icon}" width="22" height="22"></i>
                    </div>
                    <div class="metric-value-container">
                        <span class="metric-value">${metric.value.toLocaleString()}</span>
                        ${metric.trend !== 'neutral' ? `
                            <div class="metric-trend trend-${metric.trend}">
                                <i data-lucide="${metric.trend === 'up' ? 'trending-up' : 'trending-down'}" width="12" height="12"></i>
                                <span>${metric.trendValue}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <h3 class="metric-label">${metric.title}</h3>
            </a>
        `).join('');
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // 绑定智能分析中心链接事件
        this.bindAnalysisLink();
    }
    
    /**
     * 绑定智能分析中心链接事件
     */
    bindAnalysisLink() {
        const analysisLink = document.getElementById('analysis-link');
        if (analysisLink) {
            analysisLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAnalysisCenter();
            });
        }
    }
    
    /**
     * 打开智能分析中心
     */
    openAnalysisCenter() {
        const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
        chrome.tabs.create({ url: analysisUrl });
    }
    
    /**
     * 渲染词云
     */
    renderWordCloud() {
        const container = document.getElementById('wordCloudContainer');
        if (!container) return;
        
        try {
            // 生成词云数据
            const wordCloudData = this.generateWordCloudData();
            
            if (wordCloudData.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="cloud" class="empty-icon"></i>
                        <div class="empty-title">暂无词云数据</div>
                        <div class="empty-description">书签数量不足，无法生成词云</div>
                    </div>
                `;
                return;
            }
            
            // 渲染词云
            const wordCloudHtml = this.createWordCloudHtml(wordCloudData);
            container.innerHTML = wordCloudHtml;
            
            // 更新徽章
            const badge = document.getElementById('wordCloudBadge');
            if (badge) {
                badge.textContent = `${wordCloudData.length} 个主题`;
            }
            
            // 重新初始化图标
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
        } catch (error) {
            console.error('词云渲染失败:', error);
            container.innerHTML = `
                <div class="error-container">
                    <i data-lucide="alert-circle" class="error-icon"></i>
                    <div class="error-text">词云生成失败</div>
                </div>
            `;
        }
    }
    
    /**
     * 生成词云数据
     */
    generateWordCloudData() {
        const wordMap = new Map();
        
        this.bookmarks.forEach(bookmark => {
            const title = bookmark.title || '';
            // 提取中文和英文单词
            const words = title.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
            
            words.forEach(word => {
                const cleanWord = word.toLowerCase().trim();
                if (cleanWord.length > 1) {
                    wordMap.set(cleanWord, (wordMap.get(cleanWord) || 0) + 1);
                }
            });
        });
        
        // 取前30个高频词
        return Array.from(wordMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([text, value]) => ({ text, value }));
    }
    
    /**
     * 创建词云HTML
     */
    createWordCloudHtml(words) {
        const maxValue = Math.max(...words.map(w => w.value));
        const minValue = Math.min(...words.map(w => w.value));
        const range = maxValue - minValue;
        
        // 使用更丰富的颜色调色板
        const colors = [
            'rgb(59, 130, 246)',   // blue-500
            'rgb(99, 102, 241)',   // indigo-500
            'rgb(139, 92, 246)',    // violet-500
            'rgb(168, 85, 247)',    // purple-500
            'rgb(217, 70, 239)'     // fuchsia-500
        ];
        
        // 计算旋转角度
        const rotations = [0, 0, 0, -15, 15, -30, 30];
        
        return `
            <div class="word-cloud">
                ${words.map((word, index) => {
                    const fontSize = Math.max(12, (word.value / maxValue) * 24 + 12);
                    const colorIndex = Math.min(Math.floor((word.value - minValue) / range * colors.length), colors.length - 1);
                    const color = colors[colorIndex];
                    const rotation = rotations[index % rotations.length];
                    const fontWeight = word.value > (minValue + maxValue) / 2 ? 600 : 400;
                    
                    return `
                        <span class="word-item ${fontWeight === 600 ? 'highlight' : ''}" 
                              style="font-size: ${fontSize}px; color: ${color}; transform: rotate(${rotation}deg);"
                              title="${word.text}: ${word.value}个书签"
                              data-word="${word.text}"
                              data-count="${word.value}">
                            ${word.text}
                        </span>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    /**
     * 渲染分类统计图
     */
    renderCategoryChart() {
        const container = document.getElementById('categoryChartContainer');
        if (!container) return;
        
        try {
            const categoryData = Object.entries(this.categories)
                .map(([name, items]) => ({ name, count: items.length }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // 只显示前10个分类
            
            if (categoryData.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="folder" class="empty-icon"></i>
                        <div class="empty-title">暂无分类数据</div>
                        <div class="empty-description">没有找到可显示的分类信息</div>
                    </div>
                `;
                return;
            }
            
            const maxCount = Math.max(...categoryData.map(d => d.count));
            
            const chartHtml = `
                <div class="category-chart">
                    ${categoryData.map(item => {
                        const percentage = (item.count / maxCount) * 100;
                        return `
                            <div class="category-item" 
                                 data-category="${item.name}"
                                 data-count="${item.count}">
                                <div class="category-label">${item.name}</div>
                                <div class="category-bar">
                                    <div class="category-fill" style="width: ${percentage}%"></div>
                                </div>
                                <div class="category-count">${item.count}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            container.innerHTML = chartHtml;
            
            // 重新初始化图标
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
        } catch (error) {
            console.error('分类统计图渲染失败:', error);
            container.innerHTML = `
                <div class="error-container">
                    <i data-lucide="alert-circle" class="error-icon"></i>
                    <div class="error-text">分类统计图生成失败</div>
                </div>
            `;
        }
    }
    
    /**
     * 渲染活跃度热力图
     */
    renderActivityHeatmap() {
        const container = document.getElementById('activityHeatmapContainer');
        if (!container) return;
        
        try {
            // 生成模拟的活跃度数据
            const activityData = this.generateActivityData();
            
            const heatmapHtml = this.createActivityHeatmapHtml(activityData);
            container.innerHTML = heatmapHtml;
            
        } catch (error) {
            console.error('活跃度热力图渲染失败:', error);
            container.innerHTML = `
                <div class="error-container">
                    <i data-lucide="alert-circle" class="error-icon"></i>
                    <div class="error-text">活跃度热力图生成失败</div>
                </div>
            `;
        }
    }
    
    /**
     * 生成活跃度数据
     */
    generateActivityData() {
        const data = [];
        const today = new Date();
        
        // 生成过去365天的数据
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // 模拟活跃度数据（0-4个书签）
            const count = Math.floor(Math.random() * 5);
            
            data.push({
                date: date.toISOString().split('T')[0],
                count: count
            });
        }
        
        return data;
    }
    
    /**
     * 创建活跃度热力图HTML
     */
    createActivityHeatmapHtml(data) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        
        // 处理数据为网格格式
        const grid = [];
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - 364);
        
        // 创建数据映射
        const dataMap = new Map(data.map(item => [item.date, item.count]));
        
        // 生成网格
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();
            const weekOffset = Math.floor((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            
            if (!grid[weekOffset]) {
                grid[weekOffset] = [];
            }
            
            grid[weekOffset][dayOfWeek] = {
                date: dateStr,
                count: dataMap.get(dateStr) || 0
            };
        }
        
        return `
            <div class="activity-heatmap">
                <div class="heatmap-container">
                    <div class="heatmap-header">
                        <div class="heatmap-title">收藏活跃度热力图</div>
                        <div class="heatmap-legend">
                            <span>活跃度:</span>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #ebedf0;"></div>
                                <span>无</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #c6e48b;"></div>
                                <span>少</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #7bc96f;"></div>
                                <span>中</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #239a3b;"></div>
                                <span>多</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="heatmap-grid">
                        <div class="heatmap-days">
                            ${days.map(day => `<div>${day}</div>`).join('')}
                        </div>
                        <div class="heatmap-squares">
                            ${grid.map((week, weekIndex) => 
                                week.map((day, dayIndex) => {
                                    if (!day) return '<div></div>';
                                    
                                    const color = this.getHeatmapColor(day.count);
                                    return `
                                        <div class="heatmap-square" 
                                             style="background: ${color};"
                                             data-date="${day.date}"
                                             data-count="${day.count}"
                                             title="${day.date}: ${day.count}个书签">
                                        </div>
                                    `;
                                }).join('')
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 获取热力图颜色
     */
    getHeatmapColor(count) {
        const colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
        return colors[Math.min(count, colors.length - 1)];
    }
    
    /**
     * 提取域名
     */
    extractDomain(url) {
        try {
            if (url) {
                const urlObj = new URL(url);
                return urlObj.hostname.replace(/^www\./, '');
            }
        } catch (e) {
            // URL解析失败，忽略
        }
        return '';
    }
    
    /**
     * 显示工具提示
     */
    showTooltip(event, content) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;
        
        tooltip.innerHTML = content;
        tooltip.classList.add('show');
        
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - 10 + 'px';
        tooltip.style.transform = 'translateX(-50%)';
    }
    
    /**
     * 隐藏工具提示
     */
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }
    
    /**
     * 处理错误
     */
    handleError(error) {
        console.error('❌ Dashboard错误:', error);
        this.error = error;
        this.isLoading = false;
        
        // 显示错误状态
        const containers = [
            'metricsGrid',
            'wordCloudContainer', 
            'categoryChartContainer',
            'activityHeatmapContainer'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-container">
                        <i data-lucide="alert-circle" class="error-icon"></i>
                        <div class="error-text">数据加载失败: ${error.message}</div>
                    </div>
                `;
            }
        });
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * 日志记录
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }
}

// 页面加载完成后初始化Dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
});

// 导出Dashboard类供其他模块使用
export { Dashboard };