/**
 * 导入导出服务模块 - React Hook 版本
 * 处理书签的导入导出功能
 */

import { useState, useCallback } from 'react';
import type { Bookmark } from './bookmarkService';

export interface ExportData {
  version: string;
  timestamp: string;
  bookmarks: Bookmark[];
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
}

export const useImportExportService = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // 导出书签为JSON
  const exportToJSON = useCallback(async (bookmarks: Bookmark[]): Promise<void> => {
    setIsExporting(true);
    setProgress(0);
    
    try {
      const exportData: ExportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        bookmarks: bookmarks
      };
      
      setProgress(50);
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      console.log('书签导出成功');
      
    } catch (error) {
      console.error('导出失败:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  // 导出书签为HTML
  const exportToHTML = useCallback(async (bookmarks: Bookmark[]): Promise<void> => {
    setIsExporting(true);
    setProgress(0);
    
    try {
      setProgress(30);
      
      const htmlContent = generateHTMLContent(bookmarks);
      
      setProgress(70);
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      console.log('HTML书签导出成功');
      
    } catch (error) {
      console.error('HTML导出失败:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  // 生成HTML内容
  const generateHTMLContent = useCallback((bookmarks: Bookmark[]): string => {
    const timestamp = new Date().toLocaleString();
    
    return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>书签</TITLE>
<H1>书签</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Date.now()}" LAST_MODIFIED="${Date.now()}" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
${bookmarks.map(bookmark => 
        `        <DT><A HREF="${bookmark.url}" ADD_DATE="${Date.now()}">${bookmark.title}</A>`
      ).join('\n')}
    </DL><p>
</DL><p>`;
  }, []);

  // 从JSON导入书签
  const importFromJSON = useCallback(async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);
    
    try {
      const text = await file.text();
      setProgress(30);
      
      const importData: ExportData = JSON.parse(text);
      setProgress(50);
      
      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        throw new Error('无效的导入文件格式');
      }
      
      const errors: string[] = [];
      let importedCount = 0;
      
      // 在Chrome扩展环境中导入书签
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        for (const bookmark of importData.bookmarks) {
          try {
            await new Promise<void>((resolve, reject) => {
              chrome.bookmarks.create({
                parentId: '1', // 书签栏
                title: bookmark.title,
                url: bookmark.url
              }, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            });
            importedCount++;
          } catch (error) {
            errors.push(`导入书签失败 "${bookmark.title}": ${error}`);
          }
        }
      } else {
        // 浏览器测试环境，模拟导入
        console.log(`模拟导入 ${importData.bookmarks.length} 个书签`);
        importedCount = importData.bookmarks.length;
      }
      
      setProgress(100);
      
      return {
        success: errors.length === 0,
        importedCount,
        errors
      };
      
    } catch (error) {
      console.error('JSON导入失败:', error);
      return {
        success: false,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : '导入失败']
      };
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  }, []);

  // 从HTML导入书签
  const importFromHTML = useCallback(async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);
    
    try {
      const html = await file.text();
      setProgress(30);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href]');
      
      setProgress(50);
      
      const errors: string[] = [];
      let importedCount = 0;
      
      // 在Chrome扩展环境中导入书签
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        for (const link of links) {
          try {
            const href = link.getAttribute('href');
            const title = link.textContent || href || '未命名书签';
            
            if (!href) continue;
            
            await new Promise<void>((resolve, reject) => {
              chrome.bookmarks.create({
                parentId: '1', // 书签栏
                title: title,
                url: href
              }, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            });
            importedCount++;
          } catch (error) {
            errors.push(`导入书签失败 "${link.textContent}": ${error}`);
          }
        }
      } else {
        // 浏览器测试环境，模拟导入
        console.log(`模拟导入 ${links.length} 个书签`);
        importedCount = links.length;
      }
      
      setProgress(100);
      
      return {
        success: errors.length === 0,
        importedCount,
        errors
      };
      
    } catch (error) {
      console.error('HTML导入失败:', error);
      return {
        success: false,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : '导入失败']
      };
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  }, []);

  // 通用导入方法
  const importBookmarks = useCallback(async (file: File): Promise<ImportResult> => {
    if (file.name.endsWith('.json')) {
      return importFromJSON(file);
    } else if (file.name.endsWith('.html')) {
      return importFromHTML(file);
    } else {
      return {
        success: false,
        importedCount: 0,
        errors: ['不支持的文件格式，请选择 .json 或 .html 文件']
      };
    }
  }, [importFromJSON, importFromHTML]);

  // 创建文件选择器
  const createFileSelector = useCallback((accept: string = '.json,.html'): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  }, []);

  return {
    isExporting,
    isImporting,
    progress,
    exportToJSON,
    exportToHTML,
    importFromJSON,
    importFromHTML,
    importBookmarks,
    createFileSelector
  };
};
