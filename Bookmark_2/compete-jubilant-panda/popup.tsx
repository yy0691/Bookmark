import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './src/styles/globals.css';
import './src/styles/components.css';
import './src/styles/popup.css';

// 类型定义
interface BookmarkStats {
  totalBookmarks: number;
  totalFolders: number;
  duplicateCount: number;
  invalidCount: number;
}

interface ApiStatus {
  isConnected: boolean;
  provider?: string;
}

// 防抖Hook
const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => func(...args), wait);
  }, [func, wait]) as T;
};

// 节流Hook
const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  const inThrottleRef = React.useRef(false);
  
  return useCallback((...args: Parameters<T>) => {
    if (!inThrottleRef.current) {
      func(...args);
      inThrottleRef.current = true;
      setTimeout(() => {
        inThrottleRef.current = false;
      }, limit);
    }
  }, [func, limit]) as T;
};

// 弹窗组件
const Popup: React.FC = () => {
  // 状态管理
  const [bookmarkStats, setBookmarkStats] = useState<BookmarkStats>({
    totalBookmarks: 0,
    totalFolders: 0,
    duplicateCount: 0,
    invalidCount: 0
  });
  
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isConnected: false
  });
  
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isExtensionContext, setIsExtensionContext] = useState(false);

  // 检测Chrome扩展环境
  useEffect(() => {
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.id === 'string';
    setIsExtensionContext(!!isExtension);
  }, []);

  // 加载书签统计数据
  const loadBookmarkStats = useCallback(async () => {
    if (!isExtensionContext) {
      // 在非扩展环境中使用模拟数据
      setBookmarkStats({
        totalBookmarks: 1250,
        totalFolders: 45,
        duplicateCount: 23,
        invalidCount: 8
      });
      return;
    }

    try {
      console.log('📊 加载书签统计数据...');
      
      const bookmarks = await chrome.bookmarks.getTree();
      
      let totalBookmarks = 0;
      let totalFolders = 0;
      
      const countBookmarks = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        for (const node of nodes) {
          if (node.url) {
            totalBookmarks++;
          } else {
            totalFolders++;
            if (node.children) {
              countBookmarks(node.children);
            }
          }
        }
      };
      
      countBookmarks(bookmarks);
      
      setBookmarkStats(prev => ({
        ...prev,
        totalBookmarks,
        totalFolders
      }));
      
      // 异步检测重复书签
      setTimeout(() => {
        detectDuplicateCount();
      }, 50);
      
    } catch (error) {
      console.error('❌ 加载统计数据失败:', error);
    }
  }, [isExtensionContext]);

  // 检测重复书签数量
  const detectDuplicateCount = useCallback(async () => {
    if (!isExtensionContext) return;

    try {
      const bookmarks = await chrome.bookmarks.getTree();
      const urlMap = new Map<string, boolean>();
      let duplicateCount = 0;
      
      const findDuplicates = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        for (const node of nodes) {
          if (node.url) {
            const normalizedUrl = normalizeUrl(node.url);
            if (urlMap.has(normalizedUrl)) {
              duplicateCount++;
            } else {
              urlMap.set(normalizedUrl, true);
            }
          }
          if (node.children) {
            findDuplicates(node.children);
          }
        }
      };
      
      findDuplicates(bookmarks);
      
      setBookmarkStats(prev => ({
        ...prev,
        duplicateCount
      }));
      
    } catch (error) {
      console.error('❌ 检测重复书签失败:', error);
    }
  }, [isExtensionContext]);

  // 标准化URL
  const normalizeUrl = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }, []);

  // 检查API连接状态
  const checkApiStatus = useCallback(() => {
    if (!isExtensionContext) {
      setApiStatus({ isConnected: true, provider: 'Mock API' });
      return;
    }

    chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
      if (result.apiProvider && result.apiKey) {
        setApiStatus({
          isConnected: true,
          provider: result.apiProvider
        });
      } else {
        setApiStatus({
          isConnected: false
        });
      }
    });
  }, [isExtensionContext]);

  // 防抖版本的加载函数
  const debouncedLoadStats = useDebounce(loadBookmarkStats, 100);
  const throttledDetectDuplicates = useThrottle(detectDuplicateCount, 200);

  // 初始化
  useEffect(() => {
    console.log('🚀 书签助手 Popup 初始化...');
    debouncedLoadStats();
    checkApiStatus();
  }, [debouncedLoadStats, checkApiStatus]);

  // 设置按钮加载状态
  const setButtonLoading = useCallback((buttonId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [buttonId]: loading
    }));
  }, []);

  // 打开新标签页
  const openTab = useCallback((url: string) => {
    if (isExtensionContext && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  }, [isExtensionContext]);

  // 打开选项页面
  const openOptionsPage = useCallback(() => {
    if (isExtensionContext && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      console.log('打开选项页面');
    }
  }, [isExtensionContext]);

  // 主要功能处理函数
  const handleOpenVisualization = useCallback(() => {
    console.log('🎨 打开书签可视化页面');
    openTab('newtab.html');
  }, [openTab]);

  const handleOpenManager = useCallback(() => {
    console.log('📂 打开书签管理器');
    openTab('newtab.html');
  }, [openTab]);

  const handleAIAnalysis = useCallback(() => {
    console.log('🤖 打开AI智能分析');
    openTab('newtab.html');
  }, [openTab]);

  const handleDataVisualization = useCallback(() => {
    console.log('📊 打开数据可视化');
    openTab('newtab.html');
  }, [openTab]);

  const handleExportData = useCallback(() => {
    console.log('📤 打开数据导出');
    openTab('newtab.html');
  }, [openTab]);

  const handleBatchOperations = useCallback(() => {
    console.log('⚡ 打开批量操作');
    openTab('newtab.html');
  }, [openTab]);

  const handleImportExport = useCallback(() => {
    console.log('🔄 打开导入导出');
    openTab('newtab.html');
  }, [openTab]);

  const handleBackupRestore = useCallback(() => {
    console.log('💾 打开备份恢复');
    openTab('newtab.html');
  }, [openTab]);

  const handleDetectDuplicates = useCallback(() => {
    console.log('🔄 检测重复书签');
    setButtonLoading('detect-duplicates', true);
    openTab('newtab.html');
    setTimeout(() => {
      setButtonLoading('detect-duplicates', false);
    }, 800);
  }, [openTab, setButtonLoading]);

  const handleDetectInvalid = useCallback(() => {
    console.log('❌ 检测失效书签');
    setButtonLoading('detect-invalid', true);
    openTab('newtab.html');
    setTimeout(() => {
      setButtonLoading('detect-invalid', false);
    }, 800);
  }, [openTab, setButtonLoading]);

  const handleCleanupBookmarks = useCallback(() => {
    console.log('🧹 清理书签');
    openTab('newtab.html');
  }, [openTab]);

  const handlePersonalization = useCallback(() => {
    console.log('🎨 打开个性化设置');
    openTab('newtab.html');
  }, [openTab]);

  const handleAPISettings = useCallback(() => {
    console.log('🔑 打开API设置');
    openOptionsPage();
  }, [openOptionsPage]);

  const handleDashboard = useCallback(() => {
    console.log('🔍 打开仪表盘');
    openTab('newtab.html');
  }, [openTab]);

  // 格式化数字
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  // 按钮组件
  const ActionButton: React.FC<{
    id: string;
    icon: string;
    text: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    badge?: string | number;
    onClick: () => void;
    loading?: boolean;
  }> = ({ id, icon, text, variant = 'secondary', badge, onClick, loading = false }) => {
    const isLoading = loading || loadingStates[id];
    
    return (
      <button
        className={`btn ${isLoading ? 'loading' : ''} btn-${variant}`}
        onClick={onClick}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '10px',
          width: '100%',
          marginBottom: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '500',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: isLoading 
            ? 'rgba(255, 255, 255, 0.1)' 
            : variant === 'primary' 
              ? 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)'
              : variant === 'success'
                ? 'linear-gradient(135deg, #30d158 0%, #00c896 100%)'
                : variant === 'warning'
                  ? 'linear-gradient(135deg, #ff9500 0%, #ffb347 100%)'
                  : variant === 'danger'
                    ? 'linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%)'
                    : 'rgba(255, 255, 255, 0.2)',
          color: ['primary', 'success', 'warning', 'danger'].includes(variant) ? 'white' : '#1d1d1f',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{ fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{text}</span>
        {badge && (
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'inherit',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            {badge}
          </span>
        )}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '16px',
            height: '16px',
            margin: '-8px 0 0 -8px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid #007aff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
      </button>
    );
  };

  // 统计卡片组件
  const StatCard: React.FC<{
    number: number;
    label: string;
  }> = ({ number, label }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '8px',
      textAlign: 'center',
      fontSize: '11px'
    }}>
      <span style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#007aff',
        display: 'block'
      }}>
        {formatNumber(number)}
      </span>
      <span style={{
        color: '#6e6e73',
        fontSize: '10px'
      }}>
        {label}
      </span>
    </div>
  );

  // 分类组件
  const Category: React.FC<{
    title: string;
    icon: string;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#6e6e73',
        marginBottom: '8px',
        paddingLeft: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{
      width: '420px',
      minHeight: '520px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
      color: '#1d1d1f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      lineHeight: '1.5',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      willChange: 'transform'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity'
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}>
          <img 
            src="images/icon.svg" 
            alt="书签助手" 
            style={{
              width: '40px',
              height: '40px',
              marginRight: '12px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          />
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1d1d1f',
            letterSpacing: '-0.3px'
          }}>
            书签助手
          </h1>
        </div>

        {/* 快速统计 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}>
          <StatCard number={bookmarkStats.totalBookmarks} label="总书签" />
          <StatCard number={bookmarkStats.totalFolders} label="文件夹" />
          <StatCard number={bookmarkStats.duplicateCount} label="重复" />
        </div>

        {/* 主要功能分类 */}
        <Category title="主要功能" icon="🎨">
          <ActionButton
            id="open-visualization"
            icon="🎨"
            text="书签可视化"
            variant="success"
            badge="推荐"
            onClick={handleOpenVisualization}
          />
          <ActionButton
            id="open-manager"
            icon="📂"
            text="书签管理器"
            variant="primary"
            onClick={handleOpenManager}
          />
        </Category>

        {/* 智能分析分类 */}
        <Category title="智能分析" icon="🤖">
          <ActionButton
            id="ai-analysis"
            icon="🔍"
            text="AI智能分析"
            variant="primary"
            onClick={handleAIAnalysis}
          />
          <ActionButton
            id="data-visualization"
            icon="📊"
            text="数据可视化"
            variant="secondary"
            onClick={handleDataVisualization}
          />
          <ActionButton
            id="export-data"
            icon="📤"
            text="导出数据"
            variant="secondary"
            onClick={handleExportData}
          />
        </Category>

        {/* 数据管理分类 */}
        <Category title="数据管理" icon="📦">
          <ActionButton
            id="batch-operations"
            icon="⚡"
            text="批量操作"
            variant="warning"
            onClick={handleBatchOperations}
          />
          <ActionButton
            id="import-export"
            icon="🔄"
            text="导入导出"
            variant="secondary"
            onClick={handleImportExport}
          />
          <ActionButton
            id="backup-restore"
            icon="💾"
            text="备份恢复"
            variant="secondary"
            onClick={handleBackupRestore}
          />
        </Category>

        {/* 检测清理分类 */}
        <Category title="检测清理" icon="🔧">
          <ActionButton
            id="detect-duplicates"
            icon="🔄"
            text="检测重复"
            variant="warning"
            badge={bookmarkStats.duplicateCount > 0 ? bookmarkStats.duplicateCount : undefined}
            onClick={handleDetectDuplicates}
            loading={loadingStates['detect-duplicates']}
          />
          <ActionButton
            id="detect-invalid"
            icon="❌"
            text="检测失效"
            variant="warning"
            badge={bookmarkStats.invalidCount > 0 ? bookmarkStats.invalidCount : undefined}
            onClick={handleDetectInvalid}
            loading={loadingStates['detect-invalid']}
          />
          <ActionButton
            id="cleanup-bookmarks"
            icon="🧹"
            text="清理书签"
            variant="danger"
            onClick={handleCleanupBookmarks}
          />
        </Category>

        {/* 设置分类 */}
        <Category title="设置" icon="⚙️">
          <ActionButton
            id="personalization"
            icon="🎨"
            text="个性化设置"
            variant="secondary"
            onClick={handlePersonalization}
          />
          <ActionButton
            id="api-settings"
            icon="🔑"
            text="API设置"
            variant="secondary"
            onClick={handleAPISettings}
          />
        </Category>

        {/* 仪表盘 */}
        <Category title="仪表盘" icon="🔍">
          <ActionButton
            id="dashboard"
            icon="📊"
            text="仪表盘"
            variant="secondary"
            onClick={handleDashboard}
          />
        </Category>

        {/* API状态 */}
        <div style={{
          marginTop: 'auto',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          fontSize: '12px',
          textAlign: 'center',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: apiStatus.isConnected ? '#30d158' : '#ff3b30',
            animation: 'pulse 2s ease-in-out infinite',
            transform: 'translateZ(0)',
            willChange: 'opacity'
          }} />
          <span style={{
            color: apiStatus.isConnected ? '#30d158' : '#ff3b30'
          }}>
            API状态: {apiStatus.isConnected ? '已连接' : '未连接'}
          </span>
        </div>

        {/* 页脚 */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(29, 29, 31, 0.6)',
          fontWeight: '500'
        }}>
          AI辅助书签整理工具 v1.0.0
        </div>
      </div>

      {/* 添加CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        @keyframes spin {
          0% { transform: translateZ(0) rotate(0deg); }
          100% { transform: translateZ(0) rotate(360deg); }
        }
        
        .btn:hover {
          background: rgba(255, 255, 255, 0.4) !important;
          transform: translateZ(0) translateY(-1px) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #0056b3 0%, #4a4bb8 100%) !important;
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.3) !important;
        }
        
        .btn-success:hover {
          background: linear-gradient(135deg, #28a745 0%, #00a67a 100%) !important;
          box-shadow: 0 6px 20px rgba(48, 209, 88, 0.3) !important;
        }
        
        .btn-warning:hover {
          background: linear-gradient(135deg, #e68500 0%, #e6a040 100%) !important;
          box-shadow: 0 6px 20px rgba(255, 149, 0, 0.3) !important;
        }
        
        .btn-danger:hover {
          background: linear-gradient(135deg, #dc3545 0%, #e55a5a 100%) !important;
          box-shadow: 0 6px 20px rgba(255, 59, 48, 0.3) !important;
        }
        
        .btn:active {
          transform: translateZ(0) translateY(0) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .loading {
          opacity: 0.6 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

export default Popup;
