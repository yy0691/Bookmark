/**
 * 选项页面入口文件 - Plasmo框架
 */

import React from 'react';
import './src/styles/globals.css';
import './src/styles/components.css';

const Options = () => {
  return (
    <div style={{ 
      padding: 'var(--space-6)', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'var(--font-sans)'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        ⚙️ 书签助手设置
      </h1>
      
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          API配置
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          配置AI分析服务的API密钥和提供商设置
        </p>
        <button className="btn btn-primary">
          🔑 配置API设置
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          个性化设置
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          自定义界面主题、布局和显示选项
        </p>
        <button className="btn btn-secondary">
          🎨 个性化设置
        </button>
      </div>

      <div className="card">
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          数据管理
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          导入导出书签数据，备份和恢复设置
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary">
            📥 导入数据
          </button>
          <button className="btn btn-secondary">
            📤 导出数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default Options;
