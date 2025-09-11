/**
 * 主应用组件 - React版本
 * 整合所有页面和功能，支持Chrome扩展环境
 */

import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './pages/dashbord/Dashboard';
import Analysis from './pages/analysis/Analysis';
import NewTab from '../newtab';
import '../globals.css';
import '../components.css';

type Page = 'dashboard' | 'analysis' | 'newtab';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('newtab');
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
  const [accentColor, setAccentColor] = useState<'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink'>('blue');
  const [isExtensionContext, setIsExtensionContext] = useState(false);

  // 检测Chrome扩展环境
  useEffect(() => {
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    setIsExtensionContext(isExtension);
    console.log('Chrome扩展环境检测:', isExtension);
  }, []);

  // 应用主题
  useEffect(() => {
    let actualTheme = theme;
    if (theme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.setAttribute('data-theme', actualTheme);
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  // 根据URL参数或Chrome扩展上下文确定当前页面
  useEffect(() => {
    if (isExtensionContext) {
      // 在Chrome扩展环境中，根据当前页面路径确定页面
      const path = window.location.pathname;
      if (path.includes('dashboard') || path.includes('dashbord')) {
        setCurrentPage('dashboard');
      } else if (path.includes('analysis')) {
        setCurrentPage('analysis');
      } else {
        setCurrentPage('newtab');
      }
    } else {
      // 在浏览器环境中，根据URL参数确定页面
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get('page') as Page;
      if (page && ['dashboard', 'analysis', 'newtab'].includes(page)) {
        setCurrentPage(page);
      }
    }
  }, [isExtensionContext]);

  // 导航函数
  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    
    if (isExtensionContext) {
      // 在Chrome扩展环境中，打开新标签页
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const urls = {
          dashboard: chrome.runtime.getURL('pages/newtab/dashbord.html'),
          analysis: chrome.runtime.getURL('pages/newtab/analysis.html'),
          newtab: chrome.runtime.getURL('pages/newtab/index.html')
        };
        chrome.tabs.create({ url: urls[page] });
      }
    } else {
      // 在浏览器环境中，更新URL参数
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.pushState({}, '', url.toString());
    }
  }, [isExtensionContext]);

  // 渲染导航栏
  const renderNavigation = () => {
    if (isExtensionContext) {
      // 在Chrome扩展环境中，不显示导航栏，让每个页面独立运行
      return null;
    }

    return (
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        padding: 'var(--space-3) var(--space-4)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📚 书签智能工作台
          </h1>
          
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[
              { id: 'newtab', label: '新标签页', icon: '🏠' },
              { id: 'dashboard', label: '仪表盘', icon: '📊' },
              { id: 'analysis', label: '智能分析', icon: '🤖' }
            ].map(page => (
              <button
                key={page.id}
                className={`btn ${currentPage === page.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => navigateTo(page.id as Page)}
                style={{ 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)'
                }}
              >
                <span>{page.icon}</span>
                <span>{page.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* 主题切换 */}
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <button
              className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTheme('dark')}
              title="深色主题"
            >
              🌙
            </button>
            <button
              className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTheme('light')}
              title="浅色主题"
            >
              ☀️
            </button>
            <button
              className={`btn btn-sm ${theme === 'auto' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTheme('auto')}
              title="自动主题"
            >
              🔄
            </button>
          </div>

          {/* 主题色切换 */}
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {[
              { color: 'blue', name: '蓝色', emoji: '🔵' },
              { color: 'purple', name: '紫色', emoji: '🟣' },
              { color: 'green', name: '绿色', emoji: '🟢' },
              { color: 'red', name: '红色', emoji: '🔴' },
              { color: 'orange', name: '橙色', emoji: '🟠' },
              { color: 'pink', name: '粉色', emoji: '🩷' }
            ].map(color => (
              <button
                key={color.color}
                className={`btn btn-sm ${accentColor === color.color ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAccentColor(color.color as any)}
                title={color.name}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
              >
                {color.emoji}
              </button>
            ))}
          </div>

          {/* 环境指示器 */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {isExtensionContext ? '🔌 扩展模式' : '🌐 浏览器模式'}
          </div>
        </div>
      </nav>
    );
  };

  // 渲染当前页面
  const renderCurrentPage = () => {
    const pageStyle: React.CSSProperties = {
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      paddingTop: isExtensionContext ? '0' : '80px', // 为导航栏留出空间
      transition: 'all 0.3s ease'
    };

    const pageContent = (() => {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'analysis':
          return <Analysis />;
        case 'newtab':
        default:
          return <NewTab />;
      }
    })();

    return (
      <div style={pageStyle}>
        {pageContent}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--font-size-base)',
      lineHeight: 'var(--line-height-base)',
      overflow: 'hidden'
    }}>
      {renderNavigation()}
      <main>
        {renderCurrentPage()}
      </main>
      
      {/* 全局加载指示器 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-card)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        display: 'none', // 默认隐藏，可以通过状态控制显示
        zIndex: 9999
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: '0.875rem',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid var(--border-primary)',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          加载中...
        </div>
      </div>

      {/* 全局错误提示 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-danger)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)',
        boxShadow: 'var(--shadow-lg)',
        display: 'none', // 默认隐藏，可以通过状态控制显示
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: '0.875rem',
          color: 'var(--text-danger)'
        }}>
          <span>⚠️</span>
          <span>发生错误，请刷新页面重试</span>
        </div>
      </div>
    </div>
  );
};

export default App;
