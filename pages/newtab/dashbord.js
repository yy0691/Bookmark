/**
 * 书签智能分析中心 — 统一 Dashboard
 * 合并数据概览 + AI 分析 + 问题检测 + 数据管理
 */

import { BookmarkService } from '../../modules/bookmarkService.js';
import { VisualizationService } from '../../modules/visualizationService.js';
import { ApiService } from '../../modules/apiService.js';
import { DetectionService } from '../../modules/detectionService.js';
import { ImportExportService } from '../../modules/importExportService.js';

class Dashboard {
    constructor() {
        // Services
        this.bookmarkService = new BookmarkService();
        this.visualizationService = new VisualizationService();
        this.apiService = new ApiService();
        this.detectionService = new DetectionService();
        this.importExportService = new ImportExportService();

        // State
        this.bookmarks = [];
        this.stats = {};
        this.currentTab = 'overview';
        this.analysisState = {
            isProcessing: false,
            progress: 0,
            categories: {},
            results: null
        };
        this.detectionState = {
            duplicates: [],
            deadLinks: [],
            emptyFolders: [],
            malformed: []
        };
        this.logs = [];
        this.worker = null;
    }

    // ══════════════════════════════════════
    //  Init
    // ══════════════════════════════════════

    async init() {
        this.addLog('初始化智能分析中心...', 'info');
        this.bindEvents();
        this.initWorker();

        try {
            await this.loadData();
            this.renderMetrics();
            this.renderWordCloud();
            this.renderCategoryChart();
            this.renderActivityHeatmap();
            await this.checkApiStatus();
            await this.loadBookmarkStats();
            this.addLog('智能分析中心初始化完成', 'success');
        } catch (error) {
            this.addLog(`初始化失败: ${error.message}`, 'error');
            this.handleError(error);
        }
    }

    // ══════════════════════════════════════
    //  Event Binding
    // ══════════════════════════════════════

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Top bar
        document.getElementById('btn-refresh')?.addEventListener('click', () => this.refreshData());
        document.getElementById('btn-settings')?.addEventListener('click', () => this.openSettings());

        // AI Analysis
        document.getElementById('start-analysis-btn')?.addEventListener('click', () => this.startAnalysis());
        document.getElementById('stop-analysis-btn')?.addEventListener('click', () => this.stopAnalysis());
        document.getElementById('apply-btn')?.addEventListener('click', () => this.applyCategories());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportResults());

        // Detection
        document.getElementById('detect-dup-card')?.addEventListener('click', () => this.detectDuplicates());
        document.getElementById('detect-dead-card')?.addEventListener('click', () => this.detectDeadLinks());
        document.getElementById('detect-empty-card')?.addEventListener('click', () => this.detectEmptyFolders());
        document.getElementById('detect-malform-card')?.addEventListener('click', () => this.detectMalformed());
        document.getElementById('run-full-detect')?.addEventListener('click', () => this.runFullDetection());

        // Data management
        document.getElementById('card-import')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        document.getElementById('import-file')?.addEventListener('change', (e) => this.importBookmarks(e));
        document.getElementById('card-export')?.addEventListener('click', () => this.exportBookmarks());
        document.getElementById('card-backup')?.addEventListener('click', () => this.createBackup());
        document.getElementById('card-manager')?.addEventListener('click', () => this.openBookmarkManager());

        // Log
        document.getElementById('btn-clear-log')?.addEventListener('click', () => this.clearLog());
    }

    // ══════════════════════════════════════
    //  Tab Switching
    // ══════════════════════════════════════

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const panel = document.getElementById(`panel-${tabName}`);

        if (btn) btn.classList.add('active');
        if (panel) panel.classList.add('active');
        this.currentTab = tabName;
    }

    // ══════════════════════════════════════
    //  Data Loading
    // ══════════════════════════════════════

    async loadData() {
        try {
            this.bookmarks = await this.bookmarkService.getAllBookmarks();
            if (!this.bookmarks || this.bookmarks.length === 0) {
                throw new Error('没有找到任何书签数据');
            }
            this.generateStats();
            this.addLog(`已加载 ${this.bookmarks.length} 个书签`, 'info');
        } catch (error) {
            this.addLog(`数据加载失败: ${error.message}`, 'error');
            this.bookmarks = [];
            this.stats = { total: 0, folders: 0, domains: 0, todayCount: 0 };
            throw error;
        }
    }

    generateStats() {
        const urls = new Set();
        const domains = new Set();
        let folders = 0;
        let todayCount = 0;
        const today = new Date().toDateString();

        const traverse = (nodes) => {
            if (!nodes) return;
            for (const node of nodes) {
                if (node.url) {
                    urls.add(node.url);
                    try { domains.add(new URL(node.url).hostname); } catch { }
                    if (node.dateAdded) {
                        const d = new Date(node.dateAdded);
                        if (d.toDateString() === today) todayCount++;
                    }
                } else if (node.children) {
                    folders++;
                    traverse(node.children);
                }
            }
        };

        if (Array.isArray(this.bookmarks)) {
            if (this.bookmarks[0]?.children) {
                traverse(this.bookmarks[0].children);
            } else {
                // Flat array
                this.bookmarks.forEach(b => {
                    if (b.url) {
                        urls.add(b.url);
                        try { domains.add(new URL(b.url).hostname); } catch { }
                    } else {
                        folders++;
                    }
                });
            }
        }

        this.stats = {
            total: urls.size || this.bookmarks.length,
            folders,
            domains: domains.size,
            todayCount
        };
    }

    // ══════════════════════════════════════
    //  Render: Metrics
    // ══════════════════════════════════════

    renderMetrics() {
        this.setText('m-total', this.stats.total);
        this.setText('m-folders', this.stats.folders);
        this.setText('m-domains', this.stats.domains);
        this.setText('m-today', this.stats.todayCount);
    }

    // ══════════════════════════════════════
    //  Render: Word Cloud
    // ══════════════════════════════════════

    renderWordCloud() {
        const container = document.getElementById('wordCloudContainer');
        if (!container) return;

        try {
            const words = this.generateWordCloudData();
            if (words.length === 0) {
                container.innerHTML = '<div class="state-msg"><div class="title">暂无数据</div><div class="desc">没有找到足够的关键词</div></div>';
                return;
            }

            const badge = document.getElementById('wordCloudBadge');
            if (badge) badge.textContent = `${words.length} 个主题`;

            const colors = ['#007aff', '#5856d6', '#af52de', '#ff2d55', '#ff9500', '#34c759', '#5ac8fa', '#ff6482'];
            let html = '<div class="word-cloud">';
            words.forEach((w, i) => {
                const size = Math.max(13, Math.min(36, 13 + w.weight * 3));
                const color = colors[i % colors.length];
                const weight = w.weight > 6 ? 700 : w.weight > 3 ? 600 : 400;
                const opacity = 0.65 + Math.min(w.weight / 10, 0.35);
                html += `<span class="word-item" style="font-size:${size}px;color:${color};font-weight:${weight};opacity:${opacity}" title="${w.text}: ${w.count}次">${w.text}</span>`;
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="state-msg"><div class="title">数据加载失败</div><div class="desc">${error.message}</div></div>`;
        }
    }

    generateWordCloudData() {
        const wordMap = {};
        const stopWords = new Set(['的', '了', '在', '是', '和', '与', '为', '有', '个', '一', '不', '人', '中', '上', '下', '大', '小', '这', '那', '我', '你', '他', '它', 'http', 'https', 'www', 'com', 'cn', 'org', 'html', 'htm']);
        const flat = this.getFlatBookmarks();

        flat.forEach(b => {
            if (!b.title || !b.url) return;
            const words = b.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ').split(/\s+/);
            words.forEach(w => {
                w = w.toLowerCase().trim();
                if (w.length >= 2 && !stopWords.has(w)) {
                    wordMap[w] = (wordMap[w] || 0) + 1;
                }
            });
        });

        return Object.entries(wordMap)
            .filter(([, c]) => c >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 40)
            .map(([text, count]) => ({ text, count, weight: Math.min(count, 12) }));
    }

    // ══════════════════════════════════════
    //  Render: Category Chart
    // ══════════════════════════════════════

    renderCategoryChart() {
        const container = document.getElementById('categoryChartContainer');
        if (!container) return;

        try {
            const categories = {};
            const flat = this.getFlatBookmarks();

            flat.forEach(b => {
                if (!b.url) return;
                const domain = this.extractDomain(b.url);
                const cat = this.categorizeDomain(domain);
                categories[cat] = (categories[cat] || 0) + 1;
            });

            const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10);
            if (sorted.length === 0) {
                container.innerHTML = '<div class="state-msg"><div class="title">暂无数据</div></div>';
                return;
            }

            const max = sorted[0][1];
            let html = '<div class="category-list">';
            sorted.forEach(([name, count]) => {
                const pct = Math.round((count / max) * 100);
                html += `
          <div class="category-row">
            <span class="category-name">${name}</span>
            <div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%"></div></div>
            <span class="category-count">${count}</span>
          </div>`;
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="state-msg"><div class="title">数据加载失败</div><div class="desc">${error.message}</div></div>`;
        }
    }

    categorizeDomain(domain) {
        const map = {
            'github.com': '开发工具', 'stackoverflow.com': '开发工具', 'npmjs.com': '开发工具',
            'gitlab.com': '开发工具', 'developer.mozilla.org': '开发工具', 'codepen.io': '开发工具',
            'youtube.com': '视频娱乐', 'bilibili.com': '视频娱乐', 'netflix.com': '视频娱乐',
            'twitter.com': '社交媒体', 'x.com': '社交媒体', 'weibo.com': '社交媒体', 'zhihu.com': '社交媒体',
            'google.com': '搜索引擎', 'baidu.com': '搜索引擎', 'bing.com': '搜索引擎',
            'amazon.com': '购物', 'taobao.com': '购物', 'jd.com': '购物',
            'wikipedia.org': '知识百科', 'medium.com': '知识百科',
            'docs.google.com': '办公工具', 'notion.so': '办公工具', 'figma.com': '设计工具',
        };
        for (const [d, cat] of Object.entries(map)) {
            if (domain.includes(d)) return cat;
        }
        return '其他';
    }

    // ══════════════════════════════════════
    //  Render: Heatmap
    // ══════════════════════════════════════

    renderActivityHeatmap() {
        const container = document.getElementById('activityHeatmapContainer');
        if (!container) return;

        try {
            const data = this.generateActivityData();
            const html = this.createHeatmapHtml(data);
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div class="state-msg"><div class="title">数据加载失败</div><div class="desc">${error.message}</div></div>`;
        }
    }

    generateActivityData() {
        const dayData = {};
        const flat = this.getFlatBookmarks();

        flat.forEach(b => {
            if (b.dateAdded) {
                const d = new Date(b.dateAdded);
                const key = d.toISOString().split('T')[0];
                dayData[key] = (dayData[key] || 0) + 1;
            }
        });

        const weeks = [];
        const now = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const weekIdx = Math.floor((364 - i) / 7);
            if (!weeks[weekIdx]) weeks[weekIdx] = [];
            weeks[weekIdx].push({ date: key, count: dayData[key] || 0, day: d.getDay() });
        }
        return weeks;
    }

    createHeatmapHtml(weeks) {
        const colors = ['rgba(0,0,0,0.04)', 'rgba(0,122,255,0.2)', 'rgba(0,122,255,0.4)', 'rgba(0,122,255,0.6)', 'rgba(0,122,255,0.85)'];
        const getColor = (c) => c === 0 ? colors[0] : c <= 2 ? colors[1] : c <= 5 ? colors[2] : c <= 10 ? colors[3] : colors[4];
        const dayLabels = ['', '周一', '', '周三', '', '周五', ''];

        let html = `<div class="heatmap-wrap">
      <div class="heatmap-title-row">
        <span></span>
        <div class="heatmap-legend">
          <span>少</span>
          ${colors.map(c => `<span class="legend-block" style="background:${c}"></span>`).join('')}
          <span>多</span>
        </div>
      </div>
      <div class="heatmap-grid">
        <div class="heatmap-days">${dayLabels.map(l => `<div style="height:11px;line-height:11px">${l}</div>`).join('')}</div>
        <div class="heatmap-squares">`;

        weeks.forEach(week => {
            week.forEach(day => {
                html += `<div class="heatmap-cell" style="background:${getColor(day.count)}" title="${day.date}: ${day.count}个书签"></div>`;
            });
        });

        html += '</div></div></div>';
        return html;
    }

    // ══════════════════════════════════════
    //  AI Analysis
    // ══════════════════════════════════════

    async checkApiStatus() {
        try {
            const status = await this.apiService.checkApiStatus();
            const el = document.getElementById('api-status');
            if (!el) return;

            if (status.connected) {
                el.textContent = status.provider;
                el.style.color = '#34c759';
            } else {
                el.textContent = '未配置';
                el.style.color = '#ff3b30';
                this.addLog('API 未配置，请先在设置中配置 API 密钥', 'warning');
            }
        } catch (error) {
            this.setText('api-status', '错误');
        }
    }

    async loadBookmarkStats() {
        try {
            const flat = this.getFlatBookmarks();
            this.setText('bookmark-count', flat.length);
        } catch { }
    }

    async startAnalysis() {
        if (this.analysisState.isProcessing) return;

        try {
            this.analysisState.isProcessing = true;
            this.setText('analysis-status', '分析中...');
            this.showProgress('analysis-progress', true);
            this.updateProgress('progress-fill', 'progress-text', 0, 100, '准备分析...');

            document.getElementById('start-analysis-btn')?.classList.add('hidden');
            document.getElementById('stop-analysis-btn')?.classList.remove('hidden');

            const settings = await this.apiService.getApiSettings();
            if (!settings.apiKey) throw new Error('请先配置 API 密钥');

            this.updateProgress('progress-fill', 'progress-text', 10, 100, '获取书签数据...');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            if (!bookmarks || bookmarks.length === 0) throw new Error('没有找到书签');

            this.addLog(`开始分析 ${bookmarks.length} 个书签`, 'info');

            this.updateProgress('progress-fill', 'progress-text', 20, 100, 'AI 分析中...');
            const categories = await this.bookmarkService.categorizeBookmarks(
                bookmarks, settings, this.apiService,
                (progress, message) => this.updateProgress('progress-fill', 'progress-text', 20 + progress * 0.7, 100, message)
            );

            this.analysisState.categories = categories;
            this.analysisState.results = categories;

            this.updateProgress('progress-fill', 'progress-text', 100, 100, '分析完成');
            this.displayAnalysisResults(categories);
            this.setText('category-count', Object.keys(categories).length);

            document.getElementById('apply-btn')?.classList.remove('hidden');
            this.addLog(`分析完成！共分为 ${Object.keys(categories).length} 个分类`, 'success');
            this.setText('analysis-status', '已完成');

        } catch (error) {
            this.addLog(`分析失败: ${error.message}`, 'error');
            this.setText('analysis-status', '分析失败');
        } finally {
            this.analysisState.isProcessing = false;
            this.showProgress('analysis-progress', false);
            document.getElementById('start-analysis-btn')?.classList.remove('hidden');
            document.getElementById('stop-analysis-btn')?.classList.add('hidden');
        }
    }

    stopAnalysis() {
        if (this.worker) {
            this.worker.terminate();
            this.initWorker();
        }
        this.analysisState.isProcessing = false;
        this.showProgress('analysis-progress', false);
        this.setText('analysis-status', '已停止');
        document.getElementById('start-analysis-btn')?.classList.remove('hidden');
        document.getElementById('stop-analysis-btn')?.classList.add('hidden');
        this.addLog('分析已停止', 'warning');
    }

    async applyCategories() {
        if (!this.analysisState.results) return;

        try {
            this.showProgress('analysis-progress', true);
            this.updateProgress('progress-fill', 'progress-text', 0, 100, '应用分类结果...');

            const categories = this.analysisState.results;
            const mainFolder = await this.bookmarkService.createBookmarkFolder('AI分类书签', '1');
            let count = 0;
            const total = Object.keys(categories).length;

            for (const [name, items] of Object.entries(categories)) {
                const pct = 10 + ((count / total) * 80);
                this.updateProgress('progress-fill', 'progress-text', pct, 100, `整理: ${name}`);
                const folder = await this.bookmarkService.createBookmarkFolder(name, mainFolder.id);

                for (const bm of items) {
                    const match = this.getFlatBookmarks().find(b => b.url === bm.url && b.title === bm.title);
                    if (match) await this.bookmarkService.moveBookmark(match.id, folder.id);
                }
                count++;
                this.addLog(`已整理分类 "${name}": ${items.length}个书签`, 'info');
            }

            this.updateProgress('progress-fill', 'progress-text', 100, 100, '完成');
            this.addLog('分类应用完成！', 'success');
        } catch (error) {
            this.addLog(`应用失败: ${error.message}`, 'error');
        } finally {
            this.showProgress('analysis-progress', false);
        }
    }

    async exportResults() {
        try {
            if (this.analysisState.results) {
                await this.importExportService.exportCategoriesAsCsv(this.analysisState.results);
                this.addLog('分析结果已导出', 'success');
            } else {
                await this.importExportService.exportBookmarksAsJson();
                this.addLog('书签数据已导出', 'success');
            }
        } catch (error) {
            this.addLog(`导出失败: ${error.message}`, 'error');
        }
    }

    displayAnalysisResults(categories) {
        const wrap = document.getElementById('analysis-results');
        const content = document.getElementById('results-content');
        if (!wrap || !content) return;

        wrap.classList.remove('hidden');
        let html = '<div class="feature-grid">';
        for (const [name, items] of Object.entries(categories)) {
            html += `
        <div class="feature-card" style="cursor:default">
          <div class="feature-name">${name}</div>
          <div class="feature-desc">${items.length} 个书签</div>
        </div>`;
        }
        html += '</div>';
        content.innerHTML = html;
    }

    // ══════════════════════════════════════
    //  Detection
    // ══════════════════════════════════════

    async detectDuplicates() {
        try {
            this.addLog('开始检测重复书签...', 'info');
            this.showProgress('detection-progress', true);
            const result = await this.detectionService.detectDuplicateBookmarks();
            this.setText('dup-count', `${result.urlDuplicateCount} URL / ${result.titleDuplicateCount} 标题`);
            this.addLog(`重复检测完成: ${result.urlDuplicateCount} URL重复, ${result.titleDuplicateCount} 标题重复`, 'success');
        } catch (error) {
            this.addLog(`重复检测失败: ${error.message}`, 'error');
        } finally {
            this.showProgress('detection-progress', false);
        }
    }

    async detectDeadLinks() {
        try {
            this.addLog('开始检测失效链接...', 'info');
            this.showProgress('detection-progress', true);
            const result = await this.detectionService.detectInvalidBookmarks();
            this.setText('dead-count', result.invalid);
            this.addLog(`失效检测完成: ${result.valid}个有效, ${result.invalid}个失效`, 'success');
        } catch (error) {
            this.addLog(`失效检测失败: ${error.message}`, 'error');
        } finally {
            this.showProgress('detection-progress', false);
        }
    }

    async detectEmptyFolders() {
        try {
            this.addLog('开始检测空文件夹...', 'info');
            this.showProgress('detection-progress', true);
            const result = await this.detectionService.detectEmptyFolders();
            this.setText('empty-count', result.count);
            this.addLog(`空文件夹检测完成: 发现${result.count}个`, 'success');
        } catch (error) {
            this.addLog(`空文件夹检测失败: ${error.message}`, 'error');
        } finally {
            this.showProgress('detection-progress', false);
        }
    }

    async detectMalformed() {
        try {
            this.addLog('开始检测格式异常...', 'info');
            this.showProgress('detection-progress', true);

            const bookmarks = this.getFlatBookmarks();
            const malformed = [];
            bookmarks.forEach(b => {
                if (!b.title || b.title.trim() === '') malformed.push({ ...b, issue: '标题为空' });
                if (b.url && !this.isValidUrl(b.url)) malformed.push({ ...b, issue: 'URL格式异常' });
            });

            this.setText('malform-count', malformed.length);
            this.addLog(`格式检测完成: 发现${malformed.length}个异常`, 'success');
        } catch (error) {
            this.addLog(`格式检测失败: ${error.message}`, 'error');
        } finally {
            this.showProgress('detection-progress', false);
        }
    }

    async runFullDetection() {
        this.addLog('开始全面检测...', 'info');
        await this.detectDuplicates();
        await this.detectEmptyFolders();
        await this.detectMalformed();
        // Dead link detection is slow, run last
        await this.detectDeadLinks();
        this.addLog('全面检测完成', 'success');
    }

    // ══════════════════════════════════════
    //  Data Management
    // ══════════════════════════════════════

    async importBookmarks(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;

        try {
            this.addLog(`开始导入文件: ${file.name}`, 'info');
            const text = await file.text();
            let result;
            if (file.name.endsWith('.json')) result = await this.importExportService.importBookmarksFromJson(text);
            else if (file.name.endsWith('.html')) result = await this.importExportService.importBookmarksFromHtml(text);
            else if (file.name.endsWith('.csv')) result = await this.importExportService.importBookmarksFromCsv(text);
            else throw new Error('不支持的文件格式');

            if (result.success) {
                this.addLog(`导入完成: ${result.importedCount}个书签`, 'success');
                this.setText('last-import', new Date().toLocaleString());
                await this.refreshData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.addLog(`导入失败: ${error.message}`, 'error');
        } finally {
            if (event?.target) event.target.value = '';
        }
    }

    async exportBookmarks() {
        try {
            this.addLog('开始导出书签...', 'info');
            await this.importExportService.exportBookmarksAsJson();
            this.addLog('书签导出完成', 'success');
            this.setText('last-export', new Date().toLocaleString());
        } catch (error) {
            this.addLog(`导出失败: ${error.message}`, 'error');
        }
    }

    async createBackup() {
        try {
            this.addLog('开始创建备份...', 'info');
            const bookmarks = await this.bookmarkService.getAllBookmarks();
            const data = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                bookmarkCount: this.getFlatBookmarks().length,
                bookmarks,
                categories: this.analysisState.categories || {},
                metadata: { userAgent: navigator.userAgent, source: '智能分析中心' }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `书签备份_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.addLog('备份创建完成', 'success');
            this.setText('last-backup', new Date().toLocaleString());
        } catch (error) {
            this.addLog(`备份失败: ${error.message}`, 'error');
        }
    }

    openBookmarkManager() {
        try {
            if (chrome?.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('enhanced-bookmark-manager.html') });
            } else {
                window.open('../../enhanced-bookmark-manager.html', '_blank');
            }
        } catch (error) {
            this.addLog(`打开管理器失败: ${error.message}`, 'error');
        }
    }

    // ══════════════════════════════════════
    //  Utilities
    // ══════════════════════════════════════

    getFlatBookmarks() {
        const flat = [];
        const traverse = (nodes) => {
            if (!nodes) return;
            for (const n of nodes) {
                if (n.url) flat.push(n);
                if (n.children) traverse(n.children);
            }
        };

        if (Array.isArray(this.bookmarks)) {
            if (this.bookmarks[0]?.children) {
                traverse(this.bookmarks);
            } else {
                return this.bookmarks.filter(b => b.url);
            }
        }
        return flat;
    }

    extractDomain(url) {
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'unknown'; }
    }

    isValidUrl(url) {
        try { new URL(url); return true; } catch { return false; }
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    initWorker() {
        try {
            this.worker = new Worker('../../bookmarkProcessor.js');
            this.worker.onerror = () => { };
        } catch { }
    }

    async refreshData() {
        this.addLog('刷新数据...', 'info');
        try {
            await this.loadData();
            this.renderMetrics();
            this.renderWordCloud();
            this.renderCategoryChart();
            this.renderActivityHeatmap();
            await this.checkApiStatus();
            await this.loadBookmarkStats();
            this.addLog('数据刷新完成', 'success');
        } catch (error) {
            this.addLog(`刷新失败: ${error.message}`, 'error');
        }
    }

    openSettings() {
        try {
            if (chrome?.runtime) chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
            else window.open('../../options.html', '_blank');
        } catch { }
    }

    handleError(error) {
        const containers = ['wordCloudContainer', 'categoryChartContainer', 'activityHeatmapContainer'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<div class="state-msg"><div class="title">数据加载失败</div><div class="desc">${error.message}</div></div>`;
        });
    }

    // ── Progress helpers ──

    showProgress(id, show) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('visible', show);
    }

    updateProgress(fillId, textId, current, total, message) {
        const fill = document.getElementById(fillId);
        const text = document.getElementById(textId);
        const pct = Math.round((current / total) * 100);
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${message} (${pct}%)`;
    }

    // ── Log System ──

    addLog(message, type = 'info') {
        const ts = new Date().toLocaleTimeString();
        this.logs.push({ ts, message, type });

        const container = document.getElementById('log-content');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `log-entry ${type}`;
        el.textContent = `[${ts}] ${message}`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;

        if (this.logs.length > 500) {
            this.logs = this.logs.slice(-250);
            while (container.children.length > 250) container.removeChild(container.firstChild);
        }
    }

    clearLog() {
        this.logs = [];
        const el = document.getElementById('log-content');
        if (el) el.innerHTML = '';
        this.addLog('日志已清空', 'info');
    }
}

// ══════════════════════════════════════
//  Bootstrap
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();

    // Support hash-based tab switching (e.g. #ai-analysis)
    const hash = window.location.hash.replace('#', '');
    if (hash) dashboard.switchTab(hash);
});

export { Dashboard };