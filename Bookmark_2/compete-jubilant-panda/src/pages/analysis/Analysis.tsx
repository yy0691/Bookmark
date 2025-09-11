/**
 * 智能分析中心页面组件 - React版本
 * 基于原 pages/newtab/analysis.js 迁移
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useBookmarkService } from '../../services/bookmarkService';
import { useDetectionService } from '../../services/detectionService';
import { useApiService } from '../../services/apiService';
import '../styles/globals.css';
import '../styles/components.css';
import '../styles/analysis.css';

interface AnalysisResult {
  id: string;
  title: string;
  url?: string;
  folder?: string;
  path?: string;
  suggestedCategory?: string;
  confidence?: number;
  lastChecked?: string;
  createdAt?: string;
  originalId?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Analysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'smart' | 'duplicates' | 'deadlinks' | 'emptyfolders'>('smart');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<{
    smart: AnalysisResult[];
    duplicates: AnalysisResult[];
    deadlinks: AnalysisResult[];
    emptyfolders: AnalysisResult[];
  }>({
    smart: [],
    duplicates: [],
    deadlinks: [],
    emptyfolders: []
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const { 
    bookmarks, 
    getTree, 
    isLoading: bookmarksLoading, 
    error: bookmarksError 
  } = useBookmarkService();

  const { 
    detectDuplicates, 
    detectInvalidBookmarks, 
    detectEmptyFolders,
    isDetecting: detectionLoading
  } = useDetectionService();

  const { 
    callApi,
    isLoading: apiLoading,
    error: apiError
  } = useApiService();

  // 添加日志
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      message,
      type
    };
    
    setLogs(prev => [...prev, logEntry]);
    
    // 控制台输出
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${logEntry.timestamp.toLocaleTimeString()}] ${message}`);
  }, []);

  // 获取标签页标签
  const getTabLabel = useCallback((tabId: string) => {
    const labels = {
      smart: '智能分类',
      duplicates: '重复项检测',
      deadlinks: '失效链接检测',
      emptyfolders: '空文件夹检测'
    };
    return labels[tabId as keyof typeof labels] || tabId;
  }, []);

  // 处理标签页切换
  const handleTabChange = useCallback((tabId: 'smart' | 'duplicates' | 'deadlinks' | 'emptyfolders') => {
    setActiveTab(tabId);
    setSelectedItems({});
    addLog(`切换到${getTabLabel(tabId)}`, 'info');
  }, [getTabLabel, addLog]);

  // 开始分析
  const startAnalysis = useCallback(async () => {
    if (isAnalyzing) {
      addLog('分析正在进行中，忽略重复调用', 'warning');
      return;
    }

    try {
      setIsAnalyzing(true);
      setProgress(0);
      setLogs([]);
      
      addLog(`开始${getTabLabel(activeTab)}分析...`, 'info');
      
      // 模拟分析进度
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 3 + 1;
          if (newProgress >= 100) {
            clearInterval(interval);
            completeAnalysis();
            return 100;
          }
          return newProgress;
        });
      }, 200);

      // 根据分析类型执行不同的分析
      switch (activeTab) {
        case 'smart':
          await performSmartCategorization();
          break;
        case 'duplicates':
          await performDuplicateDetection();
          break;
        case 'deadlinks':
          await performDeadLinkDetection();
          break;
        case 'emptyfolders':
          await performEmptyFolderDetection();
          break;
      }
    } catch (error) {
      addLog(`分析过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, activeTab, getTabLabel, addLog]);

  // 执行智能分类分析
  const performSmartCategorization = useCallback(async () => {
    try {
      addLog('正在加载书签数据...', 'info');
      addLog('正在分析书签内容...', 'info');
      
      // 获取未分类的书签
      const uncategorized = bookmarks.filter(b => b.url && b.parentId && b.parentId !== '1');
      addLog(`发现${uncategorized.length}个未分类书签`, 'warning');
      
      addLog('正在生成分类建议...', 'info');
      const suggestions = await generateCategorizationSuggestions(uncategorized);
      
      setResults(prev => ({
        ...prev,
        smart: suggestions
      }));
      
      addLog(`生成${suggestions.length}个分类建议`, 'success');
    } catch (error) {
      addLog(`智能分类分析失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [bookmarks, addLog]);

  // 执行重复项检测
  const performDuplicateDetection = useCallback(async () => {
    try {
      addLog('正在比较URL...', 'info');
      addLog('正在比较书签标题...', 'info');
      
      const duplicateGroups = await detectDuplicates(bookmarks);
      
      // 转换数据格式
      const duplicates: AnalysisResult[] = [];
      duplicateGroups.forEach(group => {
        group.bookmarks.forEach(bookmark => {
          duplicates.push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            folder: bookmark.parentId || '未知文件夹'
          });
        });
      });
      
      setResults(prev => ({
        ...prev,
        duplicates: duplicates
      }));
      
      addLog(`发现${duplicates?.length || 0}个重复书签`, 'warning');
    } catch (error) {
      addLog(`重复项检测失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [bookmarks, detectDuplicates, addLog]);

  // 执行失效链接检测
  const performDeadLinkDetection = useCallback(async () => {
    try {
      addLog('正在准备链接列表...', 'info');
      addLog('开始验证链接状态...', 'info');
      
      const invalidBookmarks = await detectInvalidBookmarks(bookmarks);
      
      // 转换数据格式
      const deadLinks: AnalysisResult[] = invalidBookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        folder: '未知文件夹',
        lastChecked: new Date().toISOString()
      }));
      
      setResults(prev => ({
        ...prev,
        deadlinks: deadLinks
      }));
      
      addLog(`发现${deadLinks?.length || 0}个失效链接`, 'warning');
    } catch (error) {
      addLog(`失效链接检测失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [bookmarks, detectInvalidBookmarks, addLog]);

  // 执行空文件夹检测
  const performEmptyFolderDetection = useCallback(async () => {
    try {
      addLog('正在遍历文件夹结构...', 'info');
      const tree = await getTree();
      
      addLog('正在识别空文件夹...', 'info');
      const emptyFolderList = await detectEmptyFolders(Array.isArray(tree) ? tree : []);
      
      // 转换数据格式
      const emptyFolders: AnalysisResult[] = emptyFolderList.map(folder => ({
        id: folder.id,
        title: folder.title,
        folder: '空文件夹',
        path: folder.parentId || '未知路径'
      }));
      
      setResults(prev => ({
        ...prev,
        emptyfolders: emptyFolders
      }));
      
      addLog(`发现${emptyFolders?.length || 0}个空文件夹`, 'warning');
    } catch (error) {
      addLog(`空文件夹检测失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [getTree, detectEmptyFolders, addLog]);

  // 生成分类建议
  const generateCategorizationSuggestions = useCallback(async (bookmarks: any[]): Promise<AnalysisResult[]> => {
    const suggestions: AnalysisResult[] = [];
    const categories = ['工作', '学习', '娱乐', '新闻', '社交媒体', '开发', '设计', '购物', '金融', '健康', '旅游', '美食', '技术博客'];
    
    // 基于URL域名和标题内容进行智能分类
    const bookmarksToProcess = bookmarks.slice(0, 30);
    
    bookmarksToProcess.forEach((bookmark, index) => {
      const suggestedCategory = suggestCategory(bookmark, categories);
      const confidence = calculateConfidence(bookmark, suggestedCategory);
      
      suggestions.push({
        id: `uncategorized-${index}`,
        title: bookmark.title || '未命名书签',
        url: bookmark.url || '',
        suggestedCategory,
        confidence,
        folder: '收藏夹' // 暂时返回默认值
      });
    });
    
    return suggestions;
  }, []);

  // 基于书签内容建议分类
  const suggestCategory = useCallback((bookmark: any, categories: string[]): string => {
    const title = (bookmark.title || '').toLowerCase();
    const url = (bookmark.url || '').toLowerCase();
    
    // 基于域名的分类规则
    const domainRules: Record<string, string> = {
      'github.com': '开发',
      'stackoverflow.com': '开发',
      'developer.mozilla.org': '开发',
      'w3schools.com': '学习',
      'coursera.org': '学习',
      'youtube.com': '娱乐',
      'netflix.com': '娱乐',
      'facebook.com': '社交媒体',
      'twitter.com': '社交媒体',
      'linkedin.com': '工作',
      'amazon.com': '购物',
      'taobao.com': '购物',
      'news': '新闻',
      'cnn.com': '新闻',
      'bbc.com': '新闻'
    };
    
    // 检查域名规则
    for (const [domain, category] of Object.entries(domainRules)) {
      if (url.includes(domain)) {
        return category;
      }
    }
    
    // 基于标题关键词的分类规则
    const titleRules: Record<string, string[]> = {
      '工作': ['工作', 'job', 'career', 'office', 'business'],
      '学习': ['学习', 'study', 'course', 'tutorial', 'education', '教程'],
      '娱乐': ['娱乐', 'game', 'movie', 'music', 'fun', '游戏', '电影'],
      '新闻': ['新闻', 'news', '时事', '政治'],
      '开发': ['开发', 'code', 'programming', 'api', '技术', '编程'],
      '设计': ['设计', 'design', 'ui', 'ux', 'art', '美术'],
      '购物': ['购物', 'shop', 'buy', 'store', '商城'],
      '健康': ['健康', 'health', 'medical', 'fitness', '健身'],
      '旅游': ['旅游', 'travel', 'trip', 'hotel', '旅行']
    };
    
    for (const [category, keywords] of Object.entries(titleRules)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }
    
    // 默认随机分类
    return categories[Math.floor(Math.random() * categories.length)];
  }, []);

  // 计算分类置信度
  const calculateConfidence = useCallback((bookmark: any, category: string): number => {
    const title = (bookmark.title || '').toLowerCase();
    const url = (bookmark.url || '').toLowerCase();
    
    let confidence = 0.5; // 基础置信度
    
    // 如果URL包含相关域名，提高置信度
    const domainRules: Record<string, string> = {
      'github.com': '开发',
      'stackoverflow.com': '开发',
      'youtube.com': '娱乐',
      'facebook.com': '社交媒体',
      'amazon.com': '购物'
    };
    
    for (const [domain, expectedCategory] of Object.entries(domainRules)) {
      if (url.includes(domain) && category === expectedCategory) {
        confidence += 0.3;
        break;
      }
    }
    
    // 如果标题包含相关关键词，提高置信度
    const titleRules: Record<string, string[]> = {
      '工作': ['工作', 'job', 'career'],
      '学习': ['学习', 'study', 'course', '教程'],
      '娱乐': ['娱乐', 'game', 'movie', '游戏'],
      '开发': ['开发', 'code', 'programming', '编程'],
      '设计': ['设计', 'design', 'ui', 'ux']
    };
    
    if (titleRules[category]) {
      const keywordCount = titleRules[category].filter(keyword => 
        title.includes(keyword)
      ).length;
      confidence += keywordCount * 0.1;
    }
    
    return Math.min(confidence, 0.95); // 最大置信度95%
  }, []);

  // 完成分析
  const completeAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    addLog(`${getTabLabel(activeTab)}分析完成！`, 'success');
    addLog('分析完成！结果已准备就绪', 'success');
  }, [activeTab, getTabLabel, addLog]);

  // 取消分析
  const cancelAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(0);
    addLog('分析已取消', 'warning');
  }, [addLog]);

  // 切换选择项
  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // 切换全选
  const toggleSelectAll = useCallback(() => {
    const currentResults = results[activeTab] || [];
    const allSelected = currentResults.every(item => selectedItems[item.id]);
    
    const newSelectedItems: Record<string, boolean> = {};
    currentResults.forEach(item => {
      newSelectedItems[item.id] = !allSelected;
    });
    
    setSelectedItems(newSelectedItems);
  }, [results, activeTab, selectedItems]);

  // 接受分类建议
  const acceptSuggestion = useCallback(async (id: string) => {
    try {
      const suggestion = results.smart.find(item => item.id === id);
      if (!suggestion) {
        addLog(`未找到分类建议: ${id}`, 'error');
        return;
      }
      
      addLog(`接受分类建议: ${suggestion.title} -> ${suggestion.suggestedCategory}`, 'info');
      
      // 从结果中移除已处理的建议
      setResults(prev => ({
        ...prev,
        smart: prev.smart.filter(item => item.id !== id)
      }));
      
      setSelectedItems(prev => ({
        ...prev,
        [id]: false
      }));
      
      addLog(`分类建议已应用: ${suggestion.title}`, 'success');
    } catch (error) {
      addLog(`应用分类建议失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [results.smart, addLog]);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    try {
      addLog(`删除项目: ${id}`, 'info');
      
      // 根据当前标签页确定要删除的项目类型
      const currentResults = results[activeTab] || [];
      const itemToDelete = currentResults.find(item => item.id === id);
      
      if (!itemToDelete) {
        addLog(`未找到要删除的项目: ${id}`, 'error');
        return;
      }
      
      // 从结果中移除已删除的项目
      setResults(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item.id !== id)
      }));
      
      setSelectedItems(prev => ({
        ...prev,
        [id]: false
      }));
      
      addLog(`项目已删除: ${itemToDelete.title || '未命名项目'}`, 'success');
    } catch (error) {
      addLog(`删除项目失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [results, activeTab, addLog]);

  // 导出结果
  const exportResults = useCallback(() => {
    try {
      const currentResults = results[activeTab] || [];
      if (currentResults.length === 0) {
        addLog('没有可导出的结果', 'warning');
        return;
      }
      
      addLog(`导出 ${currentResults.length} 个分析结果`, 'info');
      
      // 生成导出数据
      const exportData = {
        analysisType: getTabLabel(activeTab),
        timestamp: new Date().toISOString(),
        totalCount: currentResults.length,
        results: currentResults.map(item => ({
          title: item.title || '未命名',
          url: item.url || '',
          folder: item.folder || item.path || '',
          ...(item.suggestedCategory && { suggestedCategory: item.suggestedCategory }),
          ...(item.confidence && { confidence: item.confidence }),
          ...(item.lastChecked && { lastChecked: item.lastChecked }),
          ...(item.createdAt && { createdAt: item.createdAt })
        }))
      };
      
      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookmark-analysis-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);
      
      addLog(`分析结果已导出: ${link.download}`, 'success');
    } catch (error) {
      addLog(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [results, activeTab, getTabLabel, addLog]);

  // 渲染结果项
  const renderResultItem = useCallback((item: AnalysisResult) => {
    const isSelected = selectedItems[item.id] || false;
    
    return (
      <div key={item.id} className="result-item">
        <input 
          type="checkbox" 
          className="result-checkbox" 
          checked={isSelected}
          onChange={() => toggleSelectItem(item.id)}
        />
        <div className="result-content">
          <div className="result-title">{item.title || '未命名书签'}</div>
          {item.url && <div className="result-url">{item.url}</div>}
          {item.folder && <div className="result-folder">文件夹: {item.folder}</div>}
          {item.path && <div className="result-folder">路径: {item.path}</div>}
        </div>
        <div className="result-actions">
          {activeTab === 'smart' && item.suggestedCategory && (
            <>
              <div className="result-badge badge-suggestion">
                建议分类: {item.suggestedCategory}
              </div>
              <div className="result-badge badge-confidence">
                {Math.round((item.confidence || 0) * 100)}%
              </div>
            </>
          )}
          {activeTab === 'smart' && (
            <button 
              className="action-btn accept" 
              onClick={() => acceptSuggestion(item.id)}
              title="接受建议"
            >
              ✓
            </button>
          )}
          <button 
            className="action-btn delete" 
            onClick={() => deleteItem(item.id)}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }, [selectedItems, activeTab, toggleSelectItem, acceptSuggestion, deleteItem]);

  // 渲染重复项结果
  const renderDuplicateResults = useCallback((results: AnalysisResult[]) => {
    // 按URL分组
    const grouped: Record<string, AnalysisResult[]> = {};
    results.forEach(item => {
      if (item.url) {
        if (!grouped[item.url]) {
          grouped[item.url] = [];
        }
        grouped[item.url].push(item);
      }
    });
    
    return (
      <div className="duplicate-groups">
        {Object.entries(grouped).map(([url, items], index) => (
          <div key={url} className="duplicate-group">
            <div className="group-header">
              <h4 className="group-title">重复URL #{index + 1}</h4>
              <span className="group-count">{items.length}个副本</span>
            </div>
            <a href={url} className="group-url" target="_blank" rel="noopener noreferrer">
              🔗 {url}
            </a>
            <div className="group-items">
              {items.map(item => renderResultItem(item))}
            </div>
          </div>
        ))}
      </div>
    );
  }, [renderResultItem]);

  // 渲染批量操作按钮
  const renderBatchActionButton = useCallback(() => {
    const currentResults = results[activeTab] || [];
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    
    if (selectedCount === 0) return null;
    
    const buttons = {
      smart: (
        <button className="btn-primary" onClick={() => {
          // 应用所有分类建议的逻辑
          addLog(`应用 ${selectedCount} 个分类建议`, 'info');
        }}>
          ✓ 应用所有分类建议
        </button>
      ),
      duplicates: (
        <button className="btn-danger" onClick={() => {
          // 清理所有重复项的逻辑
          addLog(`清理 ${selectedCount} 个重复项`, 'info');
        }}>
          🗑️ 一键清理所有重复项
        </button>
      ),
      deadlinks: (
        <button className="btn-danger" onClick={() => {
          // 删除所有失效链接的逻辑
          addLog(`删除 ${selectedCount} 个失效链接`, 'info');
        }}>
          🗑️ 批量删除所有失效链接
        </button>
      ),
      emptyfolders: (
        <button className="btn-danger" onClick={() => {
          // 清理所有空文件夹的逻辑
          addLog(`清理 ${selectedCount} 个空文件夹`, 'info');
        }}>
          🗑️ 一键清理所有空文件夹
        </button>
      )
    };
    
    return buttons[activeTab] || null;
  }, [activeTab, results, selectedItems, addLog]);

  // 渲染结果内容
  const renderResultsContent = useCallback(() => {
    const currentResults = results[activeTab] || [];
    
    if (isAnalyzing) {
      return (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">正在分析中，请稍候... {Math.round(progress)}%</p>
        </div>
      );
    }
    
    if (progress === 0) {
      const descriptions = {
        smart: '分析您的书签并提供智能分类建议，帮助您更好地组织书签。',
        duplicates: '检测您的书签库中的重复项，帮助您清理冗余内容。',
        deadlinks: '检测您的书签库中已失效的链接，保持书签库的健康。',
        emptyfolders: '查找并标记空文件夹，帮助您保持书签结构整洁。'
      };
      
      const icons = {
        smart: '📊',
        duplicates: '📈',
        deadlinks: '⚠️',
        emptyfolders: '📁'
      };
      
      return (
        <div className="empty-state">
          <div className="empty-icon">{icons[activeTab]}</div>
          <h3 className="empty-title">开始{getTabLabel(activeTab)}</h3>
          <p className="empty-description">{descriptions[activeTab]}</p>
          <button className="btn-primary" onClick={startAnalysis}>
            开始{getTabLabel(activeTab)}
          </button>
        </div>
      );
    }
    
    if (currentResults.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3 className="empty-title">分析完成</h3>
          <p className="empty-description">未发现需要处理的项目。</p>
        </div>
      );
    }
    
    const summaries = {
      smart: `发现 ${currentResults.length} 个未分类书签，已为它们生成智能分类建议。`,
      duplicates: `共发现 ${currentResults.length} 个重复书签。`,
      deadlinks: `共发现 ${currentResults.length} 个失效链接。`,
      emptyfolders: `共发现 ${currentResults.length} 个空文件夹。`
    };
    
    const allSelected = currentResults.every(item => selectedItems[item.id]);
    const someSelected = currentResults.some(item => selectedItems[item.id]);
    
    return (
      <>
        <div className="results-summary">
          <h3 className="summary-title">分析结果摘要</h3>
          <p className="summary-description">{summaries[activeTab]}</p>
        </div>
        
        {activeTab === 'duplicates' ? (
          renderDuplicateResults(currentResults)
        ) : (
          <div className="results-list">
            {currentResults.map(item => renderResultItem(item))}
          </div>
        )}
        
        <div className="batch-actions">
          <div className="batch-select">
            <input 
              type="checkbox" 
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <span>全选</span>
          </div>
          <div className="batch-buttons">
            <button className="btn-secondary" onClick={exportResults}>
              📥 导出结果
            </button>
            {renderBatchActionButton()}
          </div>
        </div>
      </>
    );
  }, [
    isAnalyzing, 
    progress, 
    activeTab, 
    results, 
    selectedItems, 
    getTabLabel, 
    startAnalysis, 
    renderDuplicateResults, 
    renderResultItem, 
    toggleSelectAll, 
    exportResults, 
    renderBatchActionButton
  ]);

  // 渲染日志条目
  const renderLogEntry = useCallback((log: LogEntry) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return (
      <div key={log.id} className={`log-entry ${log.type}`}>
        <span className="log-icon">{icons[log.type]}</span>
        <div className="log-content">
          <div className="log-message">{log.message}</div>
          <div className="log-time">{log.timestamp.toLocaleTimeString()}</div>
        </div>
      </div>
    );
  }, []);

  if (bookmarksLoading || detectionLoading || apiLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在加载数据...</div>
      </div>
    );
  }

  if (bookmarksError || apiError) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <div className="error-text">数据加载失败: {bookmarksError || apiError}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 'var(--space-6)', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      {/* 页面标题 */}
      <div style={{ 
        marginBottom: 'var(--space-6)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)'
        }}>
          🤖 智能分析中心
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '1rem'
        }}>
          使用AI技术深度分析您的书签收藏，提供个性化建议和智能分类
        </p>
      </div>

      {/* 任务标签页 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-primary)', 
        marginBottom: 'var(--space-6)' 
      }}>
        {(['smart', 'duplicates', 'deadlinks', 'emptyfolders'] as const).map(tabId => (
          <button
            key={tabId}
            className={`task-tab ${activeTab === tabId ? 'active' : ''}`}
            onClick={() => handleTabChange(tabId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: activeTab === tabId ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tabId ? 'var(--bg-primary)' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
          >
            {tabId === 'smart' && '📊'}
            {tabId === 'duplicates' && '📈'}
            {tabId === 'deadlinks' && '⚠️'}
            {tabId === 'emptyfolders' && '📁'}
            {getTabLabel(tabId)}
          </button>
        ))}
      </div>

      {/* 结果面板 */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ 
          padding: 'var(--space-4)', 
          borderBottom: '1px solid var(--border-primary)', 
          background: 'var(--bg-secondary)' 
        }}>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
            {getTabLabel(activeTab)}
          </h2>
        </div>
        <div style={{ padding: 'var(--space-4)' }}>
          {renderResultsContent()}
        </div>
      </div>

      {/* 分析日志 */}
      {isAnalyzing && (
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: 'var(--space-3)', 
            borderBottom: '1px solid var(--border-primary)', 
            background: 'var(--bg-secondary)' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)' 
            }}>
              🕐 分析日志
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              background: 'var(--bg-muted)', 
              padding: 'var(--space-1) var(--space-2)', 
              borderRadius: 'var(--radius-full)' 
            }}>
              {logs.length} 条记录
            </span>
          </div>
          <div style={{ 
            maxHeight: '240px', 
            overflowY: 'auto', 
            padding: 'var(--space-3)', 
            background: 'var(--bg-muted)' 
          }}>
            {logs.length === 0 ? (
              <div className="empty-state">
                <p>尚无分析日志</p>
              </div>
            ) : (
              <div className="logs-list">
                {logs.map(log => renderLogEntry(log))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: 'var(--space-6)',
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-3)'
      }}>
        {!isAnalyzing ? (
          <button className="btn btn-primary btn-lg" onClick={startAnalysis}>
            🚀 开始分析
          </button>
        ) : (
          <button className="btn btn-danger btn-lg" onClick={cancelAnalysis}>
            ⏹️ 取消分析
          </button>
        )}
        <button className="btn btn-secondary btn-lg" onClick={exportResults}>
          📥 导出结果
        </button>
      </div>
    </div>
  );
};

export default Analysis;