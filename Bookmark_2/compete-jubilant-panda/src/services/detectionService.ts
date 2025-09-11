/**
 * 检测服务模块 - React Hook 版本
 * 处理重复书签、失效链接、空文件夹等检测功能
 */

import { useState, useCallback } from 'react';
import type { Bookmark } from './bookmarkService';

export interface DuplicateGroup {
  url: string;
  bookmarks: Bookmark[];
}

export interface InvalidBookmark {
  id: string;
  title: string;
  url: string;
  reason: string;
}

export interface EmptyFolder {
  id: string;
  title: string;
  parentId: string;
}

export interface DetectionResults {
  duplicates: DuplicateGroup[];
  invalidBookmarks: InvalidBookmark[];
  emptyFolders: EmptyFolder[];
  statistics: {
    totalBookmarks: number;
    totalFolders: number;
    duplicatesFound: number;
    emptyFoldersFound: number;
    invalidBookmarksFound: number;
  };
}

export const useDetectionService = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  // 检测重复书签
  const detectDuplicates = useCallback(async (bookmarks: Bookmark[]): Promise<DuplicateGroup[]> => {
    setCurrentTask('检测重复书签...');
    const duplicates = new Map<string, Bookmark[]>();
    const duplicateGroups: DuplicateGroup[] = [];
    
    // 按URL分组书签
    bookmarks.forEach(bookmark => {
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
    
    return duplicateGroups;
  }, []);

  // 检测失效书签
  const detectInvalidBookmarks = useCallback(async (bookmarks: Bookmark[]): Promise<InvalidBookmark[]> => {
    setCurrentTask('检测失效书签...');
    const invalid: InvalidBookmark[] = [];
    
    // 批量检测链接有效性
    const batchSize = 10;
    const totalBatches = Math.ceil(bookmarks.length / batchSize);
    
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize);
      
      setProgress((batchIndex / totalBatches) * 100);
      
      await Promise.all(batch.map(async (bookmark) => {
        // 检查URL格式
        try {
          new URL(bookmark.url);
        } catch (error) {
          invalid.push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            reason: '无效的URL格式'
          });
          return;
        }
        
        // 检查标题
        if (!bookmark.title || bookmark.title.trim() === '') {
          invalid.push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            reason: '空标题'
          });
          return;
        }
        
        // 检查链接可达性（可选，因为可能很慢）
        try {
          const response = await fetch(bookmark.url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          });
          // 如果请求成功，说明链接有效
        } catch (error) {
          // 链接可能失效，但这里不添加到invalid中，因为no-cors模式下无法准确判断
          // 如果需要更准确的检测，需要服务端支持
        }
      }));
      
      // 小延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return invalid;
  }, []);

  // 检测空文件夹
  const detectEmptyFolders = useCallback(async (bookmarkTree: any[]): Promise<EmptyFolder[]> => {
    setCurrentTask('检测空文件夹...');
    const emptyFolders: EmptyFolder[] = [];
    
    const findEmptyFolders = (node: any) => {
      if (!node.children) return;
      
      // 检查文件夹是否为空（没有书签且没有非空子文件夹）
      const hasBookmarks = node.children.some((child: any) => child.url);
      const hasNonEmptySubfolders = node.children.some((child: any) => 
        !child.url && child.children && child.children.length > 0
      );
      
      if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0) {
        emptyFolders.push({
          id: node.id,
          title: node.title,
          parentId: node.parentId
        });
      }
      
      // 递归检查子文件夹
      node.children.forEach((child: any) => {
        if (!child.url) {
          findEmptyFolders(child);
        }
      });
    };
    
    if (bookmarkTree && bookmarkTree.length > 0) {
      bookmarkTree.forEach(rootFolder => findEmptyFolders(rootFolder));
    }
    
    return emptyFolders;
  }, []);

  // 执行完整检测
  const runFullDetection = useCallback(async (
    bookmarks: Bookmark[],
    bookmarkTree: any[]
  ): Promise<DetectionResults> => {
    setIsDetecting(true);
    setProgress(0);
    
    try {
      // 检测重复书签
      const duplicates = await detectDuplicates(bookmarks);
      setProgress(25);
      
      // 检测失效书签
      const invalidBookmarks = await detectInvalidBookmarks(bookmarks);
      setProgress(50);
      
      // 检测空文件夹
      const emptyFolders = await detectEmptyFolders(bookmarkTree);
      setProgress(75);
      
      // 生成统计信息
      const statistics = {
        totalBookmarks: bookmarks.length,
        totalFolders: countFolders(bookmarkTree),
        duplicatesFound: duplicates.length,
        emptyFoldersFound: emptyFolders.length,
        invalidBookmarksFound: invalidBookmarks.length
      };
      
      setProgress(100);
      
      return {
        duplicates,
        invalidBookmarks,
        emptyFolders,
        statistics
      };
      
    } catch (error) {
      console.error('检测过程出错:', error);
      throw error;
    } finally {
      setIsDetecting(false);
      setCurrentTask('');
      setProgress(0);
    }
  }, [detectDuplicates, detectInvalidBookmarks, detectEmptyFolders]);

  // 计算文件夹数量
  const countFolders = useCallback((tree: any[]): number => {
    if (!tree || tree.length === 0) return 0;
    
    let count = 0;
    const countInNode = (node: any) => {
      if (!node.children) return;
      
      for (const child of node.children) {
        if (!child.url) { // 是文件夹
          count += 1;
          countInNode(child);
        }
      }
    };
    
    tree.forEach(rootFolder => countInNode(rootFolder));
    return count;
  }, []);

  // 生成检测报告HTML
  const generateDetectionReport = useCallback((results: DetectionResults): string => {
    const { duplicates, invalidBookmarks, emptyFolders, statistics } = results;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>书签检测报告</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #f5f5f5; 
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      padding: 30px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    h1 { 
      color: #333; 
      border-bottom: 2px solid #007acc; 
      padding-bottom: 10px; 
    }
    h2 { 
      color: #555; 
      margin-top: 30px; 
    }
    .summary { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin: 20px 0; 
    }
    .stat-card { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 6px; 
      text-align: center; 
    }
    .stat-value { 
      font-size: 2em; 
      font-weight: bold; 
      color: #007acc; 
    }
    .stat-label { 
      color: #666; 
      margin-top: 5px; 
    }
    .issue { 
      background: #fff3cd; 
      border: 1px solid #ffeaa7; 
      border-radius: 4px; 
      padding: 15px; 
      margin: 10px 0; 
    }
    .issue.error { 
      background: #f8d7da; 
      border-color: #f5c6cb; 
    }
    .issue-title { 
      font-weight: bold; 
      color: #856404; 
    }
    .issue.error .issue-title { 
      color: #721c24; 
    }
    .bookmark-item { 
      background: #f8f9fa; 
      padding: 10px; 
      margin: 5px 0; 
      border-radius: 4px; 
    }
    .bookmark-url { 
      color: #666; 
      font-size: 0.9em; 
      word-break: break-all; 
    }
    .timestamp { 
      color: #666; 
      font-size: 0.9em; 
      text-align: right; 
      margin-top: 30px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 书签检测报告</h1>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${statistics.totalBookmarks}</div>
        <div class="stat-label">总书签数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.totalFolders}</div>
        <div class="stat-label">总文件夹数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.duplicatesFound}</div>
        <div class="stat-label">重复书签组</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.emptyFoldersFound}</div>
        <div class="stat-label">空文件夹</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${statistics.invalidBookmarksFound}</div>
        <div class="stat-label">无效书签</div>
      </div>
    </div>

    ${duplicates.length > 0 ? `
    <h2>🔄 重复书签</h2>
    ${duplicates.map(group => `
      <div class="issue">
        <div class="issue-title">重复URL: ${group.url}</div>
        ${group.bookmarks.map(bookmark => `
          <div class="bookmark-item">
            <strong>${bookmark.title}</strong><br>
            <span class="bookmark-url">${bookmark.url}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
    ` : ''}

    ${emptyFolders.length > 0 ? `
    <h2>📁 空文件夹</h2>
    ${emptyFolders.map(folder => `
      <div class="issue">
        <div class="issue-title">空文件夹: ${folder.title}</div>
        <p>此文件夹不包含任何书签或子文件夹。</p>
      </div>
    `).join('')}
    ` : ''}

    ${invalidBookmarks.length > 0 ? `
    <h2>⚠️ 无效书签</h2>
    ${invalidBookmarks.map(bookmark => `
      <div class="issue error">
        <div class="issue-title">${bookmark.reason}: ${bookmark.title}</div>
        <div class="bookmark-url">${bookmark.url}</div>
      </div>
    `).join('')}
    ` : ''}

    <div class="timestamp">
      报告生成时间: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
    `;
  }, []);

  return {
    isDetecting,
    progress,
    currentTask,
    detectDuplicates,
    detectInvalidBookmarks,
    detectEmptyFolders,
    runFullDetection,
    generateDetectionReport
  };
};
