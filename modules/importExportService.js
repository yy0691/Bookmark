/**
 * 导入导出服务模块 - 处理书签的导入、导出、备份功能
 */

export class ImportExportService {
  constructor() {
    this.logCallback = null;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;
    this.supportedFormats = ['json', 'html', 'csv'];
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  /**
   * 初始化导入导出服务
   */
  async initialize() {
    try {
      this.log('正在初始化导入导出服务...', 'info');
      
      // 初始化完成
      this.log('导入导出服务初始化完成', 'success');
      return true;
    } catch (error) {
      this.log(`导入导出服务初始化失败: ${error.message}`, 'error');
      return false;
    }
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 导出书签为JSON格式
  async exportBookmarksAsJson() {
    this.log('开始导出书签为JSON格式...', 'info');
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const exportData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          bookmarks: bookmarkTreeNodes
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const filename = `bookmarks_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log(`书签已导出为JSON: ${filename}`, 'success');
        resolve({ success: true, filename, data: exportData });
      });
    });
  }

  // 导出书签为HTML格式
  async exportBookmarksAsHtml() {
    this.log('开始导出书签为HTML格式...', 'info');
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const htmlContent = this.generateBookmarkHtml(bookmarkTreeNodes);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const filename = `bookmarks_${new Date().toISOString().split('T')[0]}.html`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log(`书签已导出为HTML: ${filename}`, 'success');
        resolve({ success: true, filename });
      });
    });
  }

  // 生成HTML格式的书签内容
  generateBookmarkHtml(bookmarkTreeNodes) {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    const processNode = (node, level = 0) => {
      const indent = '    '.repeat(level);
      
      if (node.url) {
        // 书签项
        const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
        html += `${indent}<DT><A HREF="${this.escapeHtml(node.url)}" ADD_DATE="${addDate}">${this.escapeHtml(node.title || '')}</A>\n`;
      } else if (node.children && node.children.length > 0) {
        // 文件夹
        const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
        html += `${indent}<DT><H3 ADD_DATE="${addDate}">${this.escapeHtml(node.title || '')}</H3>\n`;
        html += `${indent}<DL><p>\n`;
        
        node.children.forEach(child => processNode(child, level + 1));
        
        html += `${indent}</DL><p>\n`;
      }
    };

    bookmarkTreeNodes.forEach(rootNode => {
      if (rootNode.children) {
        rootNode.children.forEach(child => processNode(child, 1));
      }
    });

    html += `</DL><p>`;
    return html;
  }

  // 导出分类结果为CSV
  async exportCategoriesAsCsv(categories) {
    this.log('开始导出分类结果为CSV...', 'info');
    
    let csvContent = 'Category,Title,URL\n';
    
    Object.entries(categories).forEach(([category, bookmarks]) => {
      bookmarks.forEach(bookmark => {
        const title = (bookmark.title || '').replace(/"/g, '""');
        const url = (bookmark.url || '').replace(/"/g, '""');
        const categoryName = category.replace(/"/g, '""');
        csvContent += `"${categoryName}","${title}","${url}"\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const filename = `bookmark_categories_${new Date().toISOString().split('T')[0]}.csv`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.log(`分类结果已导出为CSV: ${filename}`, 'success');
    return { success: true, filename };
  }

  // 从JSON导入书签
  async importBookmarksFromJson(jsonData) {
    this.log('开始从JSON导入书签...', 'info');
    
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('无效的JSON格式：缺少bookmarks数组');
      }
      
      let importedCount = 0;
      const importFolder = await this.createImportFolder();
      
      for (const rootNode of data.bookmarks) {
        if (rootNode.children) {
          for (const child of rootNode.children) {
            const count = await this.importNodeRecursive(child, importFolder.id);
            importedCount += count;
          }
        }
      }
      
      this.log(`JSON导入完成: 导入了${importedCount}个书签`, 'success');
      return { success: true, importedCount };
      
    } catch (error) {
      this.log(`JSON导入失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 从HTML导入书签
  async importBookmarksFromHtml(htmlContent) {
    this.log('开始从HTML导入书签...', 'info');
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      let importedCount = 0;
      const importFolder = await this.createImportFolder();
      
      const dlElements = doc.querySelectorAll('DL');
      for (const dl of dlElements) {
        const count = await this.parseHtmlBookmarks(dl, importFolder.id);
        importedCount += count;
      }
      
      this.log(`HTML导入完成: 导入了${importedCount}个书签`, 'success');
      return { success: true, importedCount };
      
    } catch (error) {
      this.log(`HTML导入失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 创建导入文件夹
  async createImportFolder() {
    const folderName = `导入的书签_${new Date().toISOString().split('T')[0]}`;
    
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: '1', // 书签栏
        title: folderName
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 递归导入节点
  async importNodeRecursive(node, parentId) {
    let count = 0;
    
    if (node.url) {
      // 书签项
      try {
        await this.createBookmark(node.title || '未命名书签', node.url, parentId);
        count++;
      } catch (error) {
        this.log(`导入书签失败: ${node.title} - ${error.message}`, 'warning');
      }
    } else if (node.children && node.children.length > 0) {
      // 文件夹
      try {
        const folder = await this.createFolder(node.title || '未命名文件夹', parentId);
        
        for (const child of node.children) {
          const childCount = await this.importNodeRecursive(child, folder.id);
          count += childCount;
        }
      } catch (error) {
        this.log(`创建文件夹失败: ${node.title} - ${error.message}`, 'warning');
      }
    }
    
    return count;
  }

  // 解析HTML书签
  async parseHtmlBookmarks(dlElement, parentId) {
    let count = 0;
    const children = dlElement.children;
    
    for (const child of children) {
      if (child.tagName === 'DT') {
        const link = child.querySelector('A');
        const h3 = child.querySelector('H3');
        
        if (link) {
          // 书签项
          try {
            await this.createBookmark(
              link.textContent || '未命名书签',
              link.href,
              parentId
            );
            count++;
          } catch (error) {
            this.log(`导入书签失败: ${link.textContent} - ${error.message}`, 'warning');
          }
        } else if (h3) {
          // 文件夹
          try {
            const folder = await this.createFolder(
              h3.textContent || '未命名文件夹',
              parentId
            );
            
            const subDl = child.querySelector('DL');
            if (subDl) {
              const subCount = await this.parseHtmlBookmarks(subDl, folder.id);
              count += subCount;
            }
          } catch (error) {
            this.log(`创建文件夹失败: ${h3.textContent} - ${error.message}`, 'warning');
          }
        }
      }
    }
    
    return count;
  }

  // 创建书签
  async createBookmark(title, url, parentId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: parentId,
        title: title,
        url: url
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 创建文件夹
  async createFolder(title, parentId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: parentId,
        title: title
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 创建备份
  async createBackup() {
    this.log('开始创建书签备份...', 'info');
    
    try {
      const jsonResult = await this.exportBookmarksAsJson();
      const htmlResult = await this.exportBookmarksAsHtml();
      
      // 保存备份信息到本地存储
      const backupInfo = {
        timestamp: new Date().toISOString(),
        jsonFile: jsonResult.filename,
        htmlFile: htmlResult.filename,
        bookmarkCount: this.countBookmarks(jsonResult.data.bookmarks)
      };
      
      const backups = await this.getBackupHistory();
      backups.unshift(backupInfo);
      
      // 只保留最近10个备份记录
      const recentBackups = backups.slice(0, 10);
      
      chrome.storage.local.set({ bookmarkBackups: recentBackups });
      
      this.log(`备份创建完成: JSON和HTML格式`, 'success');
      return { success: true, backupInfo };
      
    } catch (error) {
      this.log(`创建备份失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 获取备份历史
  async getBackupHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['bookmarkBackups'], (result) => {
        resolve(result.bookmarkBackups || []);
      });
    });
  }

  // 统计书签数量
  countBookmarks(bookmarkTreeNodes) {
    let count = 0;
    
    const countRecursive = (nodes) => {
      for (const node of nodes) {
        if (node.url) {
          count++;
        }
        if (node.children) {
          countRecursive(node.children);
        }
      }
    };
    
    countRecursive(bookmarkTreeNodes);
    return count;
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 批量导出选定的分类
  async exportSelectedCategories(categories, selectedCategoryNames) {
    const selectedCategories = {};
    
    selectedCategoryNames.forEach(name => {
      if (categories[name]) {
        selectedCategories[name] = categories[name];
      }
    });
    
    if (Object.keys(selectedCategories).length === 0) {
      this.log('没有选择要导出的分类', 'warning');
      return { success: false, error: '没有选择要导出的分类' };
    }
    
    return await this.exportCategoriesAsCsv(selectedCategories);
  }

  // 导出检测报告
  async exportDetectionReport(report) {
    this.log('开始导出检测报告...', 'info');
    
    const reportContent = this.generateReportContent(report);
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const filename = `bookmark_detection_report_${new Date().toISOString().split('T')[0]}.txt`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.log(`检测报告已导出: ${filename}`, 'success');
    return { success: true, filename };
  }

  // 生成报告内容
  generateReportContent(report) {
    let content = `书签检测报告
生成时间: ${new Date(report.timestamp).toLocaleString()}

=== 摘要 ===
重复书签: ${report.summary.duplicateBookmarks} 个
失效书签: ${report.summary.invalidBookmarks} 个
空文件夹: ${report.summary.emptyFolders} 个
总问题数: ${report.summary.totalIssues} 个

=== 详细信息 ===

## 重复书签 (按URL)
`;

    if (report.details.duplicates.duplicatesByUrl.length > 0) {
      report.details.duplicates.duplicatesByUrl.forEach((group, index) => {
        content += `${index + 1}. URL: ${group.url}\n`;
        content += `   重复数量: ${group.count}\n`;
        group.bookmarks.forEach((bookmark, i) => {
          content += `   ${i + 1}) ${bookmark.title} (ID: ${bookmark.id})\n`;
        });
        content += '\n';
      });
    } else {
      content += '未发现URL重复的书签\n\n';
    }

    content += `## 重复书签 (按标题)\n`;
    if (report.details.duplicates.duplicatesByTitle.length > 0) {
      report.details.duplicates.duplicatesByTitle.forEach((group, index) => {
        content += `${index + 1}. 标题: ${group.title}\n`;
        content += `   重复数量: ${group.count}\n`;
        group.bookmarks.forEach((bookmark, i) => {
          content += `   ${i + 1}) ${bookmark.url} (ID: ${bookmark.id})\n`;
        });
        content += '\n';
      });
    } else {
      content += '未发现标题重复的书签\n\n';
    }

    content += `## 失效书签\n`;
    if (report.details.invalid.invalidBookmarks.length > 0) {
      report.details.invalid.invalidBookmarks.forEach((bookmark, index) => {
        content += `${index + 1}. ${bookmark.title}\n`;
        content += `   URL: ${bookmark.url}\n`;
        content += `   错误: ${bookmark.error}\n`;
        content += `   ID: ${bookmark.id}\n\n`;
      });
    } else {
      content += '未发现失效书签\n\n';
    }

    content += `## 空文件夹\n`;
    if (report.details.emptyFolders.emptyFolders.length > 0) {
      report.details.emptyFolders.emptyFolders.forEach((folder, index) => {
        content += `${index + 1}. ${folder.title} (${folder.type === 'empty' ? '完全空' : '嵌套空'})\n`;
        content += `   ID: ${folder.id}\n\n`;
      });
    } else {
      content += '未发现空文件夹\n\n';
    }

    return content;
  }
}
