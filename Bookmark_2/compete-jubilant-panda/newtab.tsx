/**
 * 新标签页组件 - React版本
 * 基于原 pages/newtab/index.js 迁移
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBookmarkService } from './src/services/bookmarkService';
import { useVisualizationService } from './src/services/visualizationService';
import './src/styles/globals.css';
import './src/styles/components.css';

interface FolderNode {
  id: string;
  title: string;
  children?: FolderNode[];
  url?: string;
  parentId?: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  dateAdded?: number;
}

interface Tag {
  name: string;
  count: number;
}

interface Statistics {
  totalBookmarks: number;
  totalFolders: number;
  uniqueDomains: number;
  recentAdded: number;
  topDomains: Array<[string, number]>;
}

const NewTab: React.FC = () => {
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [currentBookmarks, setCurrentBookmarks] = useState<Bookmark[]>([]);
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalBookmarks: 0,
    totalFolders: 0,
    uniqueDomains: 0,
    recentAdded: 0,
    topDomains: []
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quickNotes, setQuickNotes] = useState('');
  const [aiStatus, setAiStatus] = useState('准备就绪');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const { 
    bookmarks, 
    getTree, 
    search, 
    getRecent,
    isLoading: bookmarksLoading, 
    error: bookmarksError 
  } = useBookmarkService();

  const { 
    isInitialized: visualizationInitialized,
    initialize: initializeVisualization
  } = useVisualizationService();

  const bookmarksGridRef = useRef<HTMLDivElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 渲染书签到网格
  const renderBookmarks = useCallback((container: HTMLDivElement, bookmarks: Bookmark[], view: 'grid' | 'list') => {
    if (!container) return;

    const isGridView = view === 'grid';
    container.className = `bookmarks-grid ${isGridView ? 'grid-view' : 'list-view'}`;
    
    container.innerHTML = bookmarks.map(bookmark => {
      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`;
      const title = bookmark.title || '无标题';
      const url = bookmark.url;
      
      if (isGridView) {
        return `
          <div class="bookmark-item grid-item" data-id="${bookmark.id}">
            <div class="bookmark-favicon">
              <img src="${favicon}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="bookmark-content">
              <div class="bookmark-title" title="${title}">${title}</div>
              <div class="bookmark-url" title="${url}">${url}</div>
            </div>
            <div class="bookmark-actions">
              <button class="action-btn" onclick="window.open('${url}', '_blank')" title="打开链接">🔗</button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="bookmark-item list-item" data-id="${bookmark.id}">
            <div class="bookmark-favicon">
              <img src="${favicon}" alt="" onerror="this.style.display='none'">
            </div>
            <div class="bookmark-content">
              <div class="bookmark-title" title="${title}">${title}</div>
              <div class="bookmark-url" title="${url}">${url}</div>
            </div>
            <div class="bookmark-actions">
              <button class="action-btn" onclick="window.open('${url}', '_blank')" title="打开链接">🔗</button>
            </div>
          </div>
        `;
      }
    }).join('');
  }, []);

  // 更新时钟
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 格式化时间
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  // 格式化日期
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      weekday: 'short',
      month: 'short',
      day: '2-digit'
    });
  }, []);

  // 从书签标题提取标签
  const extractTags = useCallback((title: string): string[] => {
    const tagRegex = /^\[([^\]]+)\]/g;
    const tags: string[] = [];
    let match;
    while ((match = tagRegex.exec(title || '')) !== null) {
      tags.push(match[1]);
    }
    return tags;
  }, []);

  // 根据活跃标签过滤书签
  const filterBookmarksByTags = useCallback((bookmarks: Bookmark[]): Bookmark[] => {
    if (activeTags.size === 0) return bookmarks;
    
    return bookmarks.filter(bookmark => {
      const bookmarkTags = extractTags(bookmark.title);
      return Array.from(activeTags).every(activeTag => 
        bookmarkTags.includes(activeTag)
      );
    });
  }, [activeTags, extractTags]);

  // 加载并渲染书签
  const loadAndRenderBookmarks = useCallback(async (folderId?: string) => {
    try {
      let bookmarks: Bookmark[] = [];
      
      if (folderId) {
        // 从文件夹加载书签
        const folderBookmarks = allBookmarks.filter(b => b.parentId === folderId);
        bookmarks = folderBookmarks;
      } else {
        // 加载最近的书签
        bookmarks = await getRecent(100);
      }
      
      // 应用标签过滤
      const filteredBookmarks = filterBookmarksByTags(bookmarks);
      setCurrentBookmarks(filteredBookmarks);
      
      // 渲染书签
      if (bookmarksGridRef.current) {
        renderBookmarks(bookmarksGridRef.current, filteredBookmarks, currentView);
      }
    } catch (error) {
      console.error('加载书签失败:', error);
    }
  }, [allBookmarks, getRecent, filterBookmarksByTags, currentView, renderBookmarks]);

  // 渲染文件夹节点
  const renderFolderNode = useCallback((node: FolderNode): React.ReactNode => {
    if (!node.children) return null;

    const folderCount = node.children.filter(child => !child.url).length;
    const bookmarkCount = node.children.filter(child => child.url).length;

    // 跳过空文件夹（除了根节点）
    if (bookmarkCount === 0 && folderCount === 0 && node.id !== '0' && node.id !== '1' && node.id !== '2') {
      return null;
    }

    const isExpanded = expandedFolders.has(node.id);
    const isActive = activeFolder === node.id;

    return (
      <li key={node.id} className={`folder-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}>
        <div 
          className="folder-content"
          onClick={() => {
            if (folderCount > 0) {
              setExpandedFolders(prev => {
                const newSet = new Set(prev);
                if (newSet.has(node.id)) {
                  newSet.delete(node.id);
                } else {
                  newSet.add(node.id);
                }
                return newSet;
              });
            }
            setActiveFolder(node.id);
            loadAndRenderBookmarks(node.id);
          }}
        >
          {folderCount > 0 && (
            <span className="folder-toggle-icon">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="folder-icon">📁</span>
          <span className="folder-name">{node.title || '书签栏'}</span>
          <span className="bookmark-count">{bookmarkCount}</span>
        </div>
        {folderCount > 0 && isExpanded && (
          <ul className="sub-folder-list">
            {node.children
              .filter(child => !child.url)
              .map(child => renderFolderNode(child))
            }
          </ul>
        )}
      </li>
    );
  }, [expandedFolders, activeFolder, loadAndRenderBookmarks]);

  // 加载并渲染文件夹
  const loadAndRenderFolders = useCallback(async () => {
    try {
      const treeArray = await getTree() as any[];
      if (treeArray && treeArray.length > 0 && treeArray[0].children) {
        setFolders(treeArray[0].children);
      }
    } catch (error) {
      console.error('加载文件夹失败:', error);
    }
  }, [getTree]);

  // 加载并渲染标签
  const loadAndRenderTags = useCallback(async () => {
    try {
      // 提取所有标签并计数
      const tagCounts = new Map<string, number>();
      allBookmarks.forEach(bookmark => {
        const bookmarkTags = extractTags(bookmark.title);
        bookmarkTags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      // 按计数排序
      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      setTags(sortedTags);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  }, [allBookmarks, extractTags]);

  // 更新统计信息
  const updateStatistics = useCallback(async () => {
    try {
      const totalBookmarks = allBookmarks.length;
      const uniqueDomains = new Set(allBookmarks.map(b => {
        try {
          return new URL(b.url).hostname;
        } catch {
          return '';
        }
      })).size;

      // 计算最近添加的书签（过去7天）
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentAdded = allBookmarks.filter(b => 
        b.dateAdded && b.dateAdded > oneWeekAgo
      ).length;

      // 计算文件夹数量
      const treeArray = await getTree() as any[];
      const totalFolders = treeArray && treeArray.length > 0 ? countFolders(treeArray[0]) : 0;

      // 计算顶级域名
      const domainCounts: Record<string, number> = {};
      allBookmarks.forEach(bookmark => {
        try {
          const domain = new URL(bookmark.url).hostname;
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch (error) {
          // 跳过无效URL
        }
      });

      const topDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) as Array<[string, number]>;

      setStatistics({
        totalBookmarks,
        totalFolders,
        uniqueDomains,
        recentAdded,
        topDomains
      });
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  }, [allBookmarks, getTree]);

  // 计算文件夹数量
  const countFolders = useCallback((node: any): number => {
    if (!node || !node.children) return 0;
    
    let count = 0;
    for (const child of node.children) {
      if (!child.url) { // 这是一个文件夹
        count += 1 + countFolders(child);
      }
    }
    return count;
  }, []);

  // 处理搜索
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      await loadAndRenderBookmarks(activeFolder || undefined);
      return;
    }
    
    try {
      const results = await search(query);
      const filteredResults = filterBookmarksByTags(results);
      setCurrentBookmarks(filteredResults);
      
      if (bookmarksGridRef.current) {
        renderBookmarks(bookmarksGridRef.current, filteredResults, currentView);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }, [search, filterBookmarksByTags, activeFolder, currentView, renderBookmarks, loadAndRenderBookmarks]);

  // 切换视图
  const toggleView = useCallback((view: 'grid' | 'list') => {
    setCurrentView(view);
    if (bookmarksGridRef.current) {
      renderBookmarks(bookmarksGridRef.current, currentBookmarks, view);
    }
  }, [currentBookmarks, renderBookmarks]);

  // 切换标签选择
  const toggleTag = useCallback((tagName: string) => {
    setActiveTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagName)) {
        newSet.delete(tagName);
      } else {
        newSet.add(tagName);
      }
      return newSet;
    });
  }, []);

  // 清除所有标签
  const clearTags = useCallback(() => {
    setActiveTags(new Set());
  }, []);

  // 保存快速笔记
  const saveQuickNotes = useCallback(async (notes: string) => {
    setQuickNotes(notes);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ quickNotes: notes });
      }
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  }, []);

  // 加载快速笔记
  const loadQuickNotes = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['quickNotes']);
        if (result.quickNotes) {
          setQuickNotes(result.quickNotes);
        }
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
    }
  }, []);

  // AI分析功能
  const analyzeBookmarks = useCallback(async () => {
    if (isAnalyzing) {
      setIsAnalyzing(false);
      setAiStatus('分析已取消');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAiStatus('开始分析...');
      
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAiStatus('分析完成！');
      setIsAnalyzing(false);
      
      // 打开智能分析中心
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
        chrome.tabs.create({ url: analysisUrl });
      }
    } catch (error) {
      console.error('分析失败:', error);
      setAiStatus('分析失败');
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // 检测重复书签
  const detectDuplicates = useCallback(async () => {
    setAiStatus('检测重复项...');
    try {
      const duplicates = new Map<string, Bookmark[]>();
      const duplicateGroups: Array<{ url: string; bookmarks: Bookmark[] }> = [];
      
      // 按URL分组
      allBookmarks.forEach(bookmark => {
        if (duplicates.has(bookmark.url)) {
          duplicates.get(bookmark.url)!.push(bookmark);
        } else {
          duplicates.set(bookmark.url, [bookmark]);
        }
      });
      
      // 找出重复组
      duplicates.forEach((group, url) => {
        if (group.length > 1) {
          duplicateGroups.push({ url, bookmarks: group });
        }
      });
      
      if (duplicateGroups.length === 0) {
        setAiStatus('未发现重复项');
      } else {
        setAiStatus(`发现 ${duplicateGroups.length} 个重复组`);
      }
    } catch (error) {
      console.error('检测重复项失败:', error);
      setAiStatus('检测失败');
    }
  }, [allBookmarks]);

  // 检查失效链接
  const checkBrokenLinks = useCallback(async () => {
    setAiStatus('检查链接...');
    try {
      let brokenCount = 0;
      let checkedCount = 0;
      
      // 批量检查链接
      const batchSize = 10;
      for (let i = 0; i < allBookmarks.length; i += batchSize) {
        const batch = allBookmarks.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (bookmark) => {
          try {
            await fetch(bookmark.url, { 
              method: 'HEAD', 
              mode: 'no-cors',
              cache: 'no-cache'
            });
            checkedCount++;
          } catch (error) {
            brokenCount++;
            checkedCount++;
          }
        }));
        
        setAiStatus(`已检查 ${checkedCount}/${allBookmarks.length} 个链接...`);
        
        // 小延迟避免阻塞
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (brokenCount === 0) {
        setAiStatus('所有链接正常');
      } else {
        setAiStatus(`发现 ${brokenCount} 个失效链接`);
      }
    } catch (error) {
      console.error('检查链接失败:', error);
      setAiStatus('检查失败');
    }
  }, [allBookmarks]);

  // 清理空文件夹
  const cleanEmptyFolders = useCallback(async () => {
    setAiStatus('清理文件夹...');
    try {
      const treeArray = await getTree() as any[];
      const emptyFolders: any[] = [];
      
      const findEmptyFolders = (node: any) => {
        if (!node.children) return;
        
        const hasBookmarks = node.children.some((child: any) => child.url);
        const hasNonEmptySubfolders = node.children.some((child: any) => 
          !child.url && child.children && child.children.length > 0
        );
        
        if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0) {
          emptyFolders.push(node);
        }
        
        node.children.forEach((child: any) => {
          if (!child.url) {
            findEmptyFolders(child);
          }
        });
      };
      
      if (treeArray && treeArray.length > 0 && treeArray[0].children) {
        treeArray[0].children.forEach((rootFolder: any) => findEmptyFolders(rootFolder));
      }
      
      if (emptyFolders.length === 0) {
        setAiStatus('未发现空文件夹');
      } else {
        setAiStatus(`发现 ${emptyFolders.length} 个空文件夹`);
      }
    } catch (error) {
      console.error('清理文件夹失败:', error);
      setAiStatus('清理失败');
    }
  }, [getTree]);

  // 打开Dashboard
  const openDashboard = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const dashboardUrl = chrome.runtime.getURL('pages/newtab/dashbord.html');
      chrome.tabs.create({ url: dashboardUrl });
    }
  }, []);

  // 打开智能分析中心
  const openAnalysisCenter = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
      chrome.tabs.create({ url: analysisUrl });
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setAllBookmarks(bookmarks);
        await loadAndRenderFolders();
        await loadAndRenderTags();
        await loadAndRenderBookmarks();
        await updateStatistics();
        await loadQuickNotes();
      } catch (error) {
        console.error('初始化数据失败:', error);
      }
    };

    initializeData();
  }, [bookmarks, loadAndRenderFolders, loadAndRenderTags, loadAndRenderBookmarks, updateStatistics, loadQuickNotes]);

  // 监听书签变化
  useEffect(() => {
    const refreshAll = async () => {
      console.log('书签变化检测，刷新UI');
      await loadAndRenderFolders();
      await loadAndRenderTags();
      await loadAndRenderBookmarks(activeFolder || undefined);
      await updateStatistics();
    };

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(refreshAll);
      chrome.bookmarks.onRemoved.addListener(refreshAll);
      chrome.bookmarks.onChanged.addListener(refreshAll);
      chrome.bookmarks.onMoved.addListener(refreshAll);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.onCreated.removeListener(refreshAll);
        chrome.bookmarks.onRemoved.removeListener(refreshAll);
        chrome.bookmarks.onChanged.removeListener(refreshAll);
        chrome.bookmarks.onMoved.removeListener(refreshAll);
      }
    };
  }, [loadAndRenderFolders, loadAndRenderTags, loadAndRenderBookmarks, updateStatistics, activeFolder]);

  if (bookmarksLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在加载数据...</div>
      </div>
    );
  }

  if (bookmarksError) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <div className="error-text">数据加载失败: {bookmarksError}</div>
      </div>
    );
  }

  return (
    <div className="newtab-container">
      {/* 顶部导航栏 */}
      <header className="top-nav">
        <div className="nav-left">
          <a href="#" className="logo">📚 BookmarkHub</a>
        </div>

        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="搜索书签和文件夹... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="nav-right">
          <button className="nav-btn" onClick={openDashboard} title="Dashboard">
            📊
          </button>
          <button className="nav-btn" onClick={openAnalysisCenter} title="智能分析中心">
            🧠
          </button>
          <button className="nav-btn" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* 主内容容器 */}
      <div className="main-container">
        <div className="dashboard-grid">
          {/* 左侧边栏 */}
          <aside className="left-sidebar">
            {/* 文件夹组件 */}
            <div className="widget" id="folders-widget">
              <div className="widget-header">
                <span className="widget-icon">📁</span>
                <h2 className="widget-title">文件夹</h2>
              </div>
              <ul className="folder-list">
                {folders.map(folder => renderFolderNode(folder))}
              </ul>
            </div>

            {/* 标签组件 */}
            <div className="widget" id="tags-widget">
              <div className="widget-header">
                <span className="widget-icon">🏷️</span>
                <h2 className="widget-title">标签</h2>
                <button className="clear-tags-btn" onClick={clearTags} title="清除标签筛选">
                  ✕
                </button>
              </div>
              <div className="tags-container">
                {tags.map(tag => (
                  <div 
                    key={tag.name}
                    className={`filter-tag ${activeTags.has(tag.name) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                    <span className="tag-count">{tag.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 时钟组件 */}
            <div className="widget clock-widget">
              <div className="widget-header">
                <span className="widget-icon">🕐</span>
                <h2 className="widget-title">世界时钟</h2>
              </div>
              <div className="clock-time">{formatTime(currentTime)}</div>
              <div className="clock-date">{formatDate(currentTime)}</div>
            </div>
          </aside>

          {/* 主内容区 */}
          <main className="bookmarks-section">
            <div className="bookmarks-toolbar">
              <h2 className="section-title">最近书签</h2>
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${currentView === 'grid' ? 'active' : ''}`}
                  onClick={() => toggleView('grid')}
                  title="网格视图"
                >
                  ⊞
                </button>
                <button 
                  className={`toggle-btn ${currentView === 'list' ? 'active' : ''}`}
                  onClick={() => toggleView('list')}
                  title="列表视图"
                >
                  ☰
                </button>
              </div>
            </div>
            <div className="bookmarks-grid" ref={bookmarksGridRef}>
              {/* 书签将通过 renderBookmarks 动态渲染 */}
            </div>
          </main>

          {/* 右侧边栏 */}
          <aside className="right-sidebar">
            {/* 数据统计组件 */}
            <div className="widget" id="stats-widget">
              <div className="widget-header">
                <span className="widget-icon">📊</span>
                <h2 className="widget-title">统计数据</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{statistics.totalBookmarks}</div>
                  <div className="stat-label">书签总数</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statistics.totalFolders}</div>
                  <div className="stat-label">文件夹</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statistics.uniqueDomains}</div>
                  <div className="stat-label">独立域名</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statistics.recentAdded}</div>
                  <div className="stat-label">本周新增</div>
                </div>
              </div>
            </div>

            {/* 常用域名组件 */}
            <div className="widget" id="domains-widget">
              <div className="widget-header">
                <span className="widget-icon">🌐</span>
                <h2 className="widget-title">常用域名</h2>
              </div>
              <div className="domains-list">
                {statistics.topDomains.length === 0 ? (
                  <div className="stat-item domain-item-layout" style={{ justifyContent: 'center' }}>
                    <span className="domain-name">暂无书签</span>
                  </div>
                ) : (
                  statistics.topDomains.map(([domain, count]) => (
                    <div key={domain} className="stat-item domain-item-layout">
                      <span className="domain-name">{domain}</span>
                      <span className="domain-count">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI分析工具组件 */}
            <div className="widget" id="ai-tools-widget">
              <div className="widget-header">
                <span className="widget-icon">🧠</span>
                <h2 className="widget-title">AI 工具</h2>
              </div>
              <div className="ai-tools-grid">
                <button 
                  className="ai-tool-btn" 
                  onClick={analyzeBookmarks}
                  title="分析和分类书签"
                >
                  ⚡
                  <span>{isAnalyzing ? '取消分析' : '智能分析'}</span>
                </button>
                <button 
                  className="ai-tool-btn" 
                  onClick={detectDuplicates}
                  title="查找重复书签"
                >
                  📋
                  <span>查找重复</span>
                </button>
                <button 
                  className="ai-tool-btn" 
                  onClick={checkBrokenLinks}
                  title="检查失效链接"
                >
                  🔗
                  <span>检查链接</span>
                </button>
                <button 
                  className="ai-tool-btn" 
                  onClick={cleanEmptyFolders}
                  title="清理空文件夹"
                >
                  📁
                  <span>清理文件夹</span>
                </button>
              </div>
              <div className="ai-status">
                <span className="status-text">{aiStatus}</span>
              </div>
            </div>

            {/* 快速笔记组件 */}
            <div className="widget" id="notes-widget">
              <div className="widget-header">
                <span className="widget-icon">📝</span>
                <h2 className="widget-title">快速笔记</h2>
                <div className="notes-actions">
                  <button 
                    className="notes-action-btn" 
                    onClick={() => saveQuickNotes('')}
                    title="清空笔记"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <textarea 
                ref={notesTextareaRef}
                className="notes-textarea" 
                placeholder="点击添加您的快速笔记..."
                value={quickNotes}
                onChange={(e) => saveQuickNotes(e.target.value)}
              />
              <div className="notes-footer">
                <span className="notes-char-count">{quickNotes.length} 字符</span>
                <span className="notes-status">已保存</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NewTab;