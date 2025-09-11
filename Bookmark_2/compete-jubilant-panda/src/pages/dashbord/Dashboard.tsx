/**
 * Dashboard 页面组件 - React版本
 * 基于原 pages/newtab/dashbord.js 迁移
 */

import React, { useState, useEffect } from 'react';
import { useBookmarkService } from '../../services/bookmarkService';
import { useVisualizationService } from '../../services/visualizationService';
import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    bookmarks, 
    categories, 
    stats, 
    isLoading: bookmarksLoading, 
    error: bookmarksError,
    loadBookmarks 
  } = useBookmarkService();
  
  const { 
    generateWordCloudData, 
    generateCategoryChartData, 
    generateActivityData,
    createWordCloudHtml,
    createCategoryChartHtml,
    createActivityHeatmapHtml,
    getHeatmapColor
  } = useVisualizationService();

  // 初始化数据
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        await loadBookmarks();
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [loadBookmarks]);

  // 渲染关键指标卡片
  const renderMetrics = () => {
    if (!stats) return null;

    const metrics = [
      {
        title: '书签总数',
        value: stats.totalBookmarks,
        icon: '📚',
        color: 'var(--accent-blue)',
        trend: 'up',
        trendValue: '+2.5%'
      },
      {
        title: '分类数量',
        value: stats.totalCategories,
        icon: '📁',
        color: 'var(--accent-purple)',
        trend: 'neutral',
        trendValue: '0%'
      },
      {
        title: '重复书签',
        value: stats.duplicateUrls,
        icon: '🔄',
        color: 'var(--accent-orange)',
        trend: 'up',
        trendValue: '+0.8%'
      },
      {
        title: '不同域名',
        value: stats.uniqueDomains,
        icon: '🌐',
        color: 'var(--accent-green)',
        trend: 'up',
        trendValue: '+1.2%'
      }
    ];

    return (
      <div className="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <div 
                className="metric-icon" 
                style={{ background: metric.color }}
              >
                {metric.icon}
              </div>
              <div className="metric-value-container">
                <span className="metric-value">{metric.value.toLocaleString()}</span>
                {metric.trend !== 'neutral' && (
                  <div className={`metric-trend trend-${metric.trend}`}>
                    <span>{metric.trendValue}</span>
                  </div>
                )}
              </div>
            </div>
            <h3 className="metric-label">{metric.title}</h3>
          </div>
        ))}
      </div>
    );
  };

  // 渲染词云
  const renderWordCloud = () => {
    if (!bookmarks.length) return null;

    const wordCloudData = generateWordCloudData(bookmarks);
    
    if (wordCloudData.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">☁️</div>
          <div className="empty-title">暂无词云数据</div>
          <div className="empty-description">书签数量不足，无法生成词云</div>
        </div>
      );
    }

    return (
      <div 
        className="word-cloud"
        dangerouslySetInnerHTML={{ 
          __html: createWordCloudHtml(wordCloudData) 
        }}
      />
    );
  };

  // 渲染分类统计图
  const renderCategoryChart = () => {
    if (!Object.keys(categories).length) return null;

    const categoryData = generateCategoryChartData(categories);
    
    if (categoryData.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">暂无分类数据</div>
          <div className="empty-description">没有找到可显示的分类信息</div>
        </div>
      );
    }

    return (
      <div 
        className="category-chart"
        dangerouslySetInnerHTML={{ 
          __html: createCategoryChartHtml(categoryData) 
        }}
      />
    );
  };

  // 渲染活跃度热力图
  const renderActivityHeatmap = () => {
    const activityData = generateActivityData();
    
    return (
      <div 
        className="activity-heatmap"
        dangerouslySetInnerHTML={{ 
          __html: createActivityHeatmapHtml(activityData) 
        }}
      />
    );
  };

  // 打开智能分析中心
  const openAnalysisCenter = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const analysisUrl = chrome.runtime.getURL('pages/newtab/analysis.html');
      chrome.tabs.create({ url: analysisUrl });
    } else {
      console.log('智能分析中心功能需要在Chrome扩展环境中使用');
    }
  };

  if (isLoading || bookmarksLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在加载数据...</div>
      </div>
    );
  }

  if (error || bookmarksError) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <div className="error-text">数据加载失败: {error || bookmarksError}</div>
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
          📊 书签数据分析中心
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '1rem'
        }}>
          智能分析您的书签收藏，发现使用模式和优化建议
        </p>
      </div>

      {/* 关键指标 */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          关键指标
        </h2>
        {renderMetrics()}
      </div>

      {/* 内容网格 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 'var(--space-6)' 
      }}>
        {/* 词云 */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              ☁️ 书签主题词云
            </h3>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {generateWordCloudData(bookmarks).length} 个主题
            </span>
          </div>
          {renderWordCloud()}
        </div>

        {/* 分类统计 */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              📊 分类统计
            </h3>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {Object.keys(categories).length} 个分类
            </span>
          </div>
          {renderCategoryChart()}
        </div>

        {/* 活跃度热力图 */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            📈 收藏活跃度热力图
          </h3>
          {renderActivityHeatmap()}
        </div>
      </div>

      {/* 智能分析中心链接 */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: 'var(--space-8)',
        padding: 'var(--space-6)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-3)'
        }}>
          🤖 智能分析中心
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-4)'
        }}>
          使用AI技术深度分析您的书签收藏，提供个性化建议和智能分类
        </p>
        <button 
          className="btn btn-primary btn-lg"
          onClick={openAnalysisCenter}
          style={{ 
            padding: 'var(--space-3) var(--space-6)',
            fontSize: '1rem'
          }}
        >
          🚀 进入智能分析中心
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
