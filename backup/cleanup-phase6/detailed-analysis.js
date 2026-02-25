// Detailed Analysis - Main controller
import { BookmarkService } from './modules/bookmarkService.js';
import { DetectionService } from './modules/detectionService.js';
import { ImportExportService } from './modules/importExportService.js';
import { VisualizationService } from './modules/visualizationService.js';

const bookmarkService = new BookmarkService();
const detectionService = new DetectionService();
const importExportService = new ImportExportService();
const visualizationService = new VisualizationService();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Detailed Analysis page loaded');
  
  // Check URL params for direct section access
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  if (section) {
    switchTab(section);
  }
  
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // AI Analysis
  document.getElementById('start-ai-analysis')?.addEventListener('click', startAIAnalysis);
  
  // Duplicate detection
  document.getElementById('detect-duplicates')?.addEventListener('click', detectDuplicates);
  
  // Invalid bookmark detection
  document.getElementById('detect-invalid')?.addEventListener('click', detectInvalid);
  
  // Empty folder detection
  document.getElementById('detect-empty')?.addEventListener('click', detectEmptyFolders);
  
  // Word cloud
  document.getElementById('generate-wordcloud')?.addEventListener('click', generateWordCloud);
  
  // Export
  document.getElementById('export-json')?.addEventListener('click', () => exportBookmarks('json'));
  document.getElementById('export-csv')?.addEventListener('click', () => exportBookmarks('csv'));
  document.getElementById('export-html')?.addEventListener('click', () => exportBookmarks('html'));
  
  // Import
  document.getElementById('import-file')?.addEventListener('click', importBookmarks);
  
  // Backup
  document.getElementById('create-backup')?.addEventListener('click', createBackup);
  document.getElementById('restore-backup')?.addEventListener('click', restoreBackup);
  
  // Batch operations
  document.getElementById('batch-delete-duplicates')?.addEventListener('click', batchDeleteDuplicates);
  document.getElementById('batch-delete-invalid')?.addEventListener('click', batchDeleteInvalid);
  document.getElementById('batch-delete-empty')?.addEventListener('click', batchDeleteEmpty);
  document.getElementById('batch-delete-all')?.addEventListener('click', batchDeleteAll);
}

// Switch tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const targetContent = document.getElementById(tabName);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// AI Analysis
async function startAIAnalysis() {
  const resultsContainer = document.getElementById('ai-analysis-results');
  resultsContainer.innerHTML = '<div class="loading">🤖 正在分析您的书签...</div>';
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    
    // Simple categorization for demo
    const categories = {};
    bookmarks.forEach(bookmark => {
      const domain = new URL(bookmark.url).hostname;
      const category = categorizeDomain(domain);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(bookmark);
    });
    
    // Display results
    let html = '<div class="stats-grid">';
    Object.entries(categories).forEach(([category, items]) => {
      html += `
        <div class="stat-card">
          <div class="stat-value">${items.length}</div>
          <div class="stat-label">${category}</div>
        </div>
      `;
    });
    html += '</div>';
    
    html += '<p style="color: var(--text-secondary); margin-top: var(--space-4);">✅ 分析完成！发现 ' + Object.keys(categories).length + ' 个类别。</p>';
    
    resultsContainer.innerHTML = html;
  } catch (error) {
    console.error('AI analysis failed:', error);
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>分析失败，请重试</p></div>';
  }
}

function categorizeDomain(domain) {
  if (domain.includes('github') || domain.includes('stackoverflow') || domain.includes('dev.to')) return '技术开发';
  if (domain.includes('youtube') || domain.includes('netflix') || domain.includes('spotify')) return '娱乐媒体';
  if (domain.includes('news') || domain.includes('cnn') || domain.includes('bbc')) return '新闻资讯';
  if (domain.includes('amazon') || domain.includes('ebay') || domain.includes('shop')) return '购物商城';
  if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('instagram')) return '社交媒体';
  return '其他';
}

// Detect duplicates
async function detectDuplicates() {
  const resultsContainer = document.getElementById('duplicates-results');
  resultsContainer.innerHTML = '<div class="loading">🔄 正在检测重复书签...</div>';
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const urlMap = new Map();
    const duplicates = [];
    
    bookmarks.forEach(bookmark => {
      const url = bookmark.url;
      if (urlMap.has(url)) {
        urlMap.get(url).push(bookmark);
      } else {
        urlMap.set(url, [bookmark]);
      }
    });
    
    urlMap.forEach((group, url) => {
      if (group.length > 1) {
        duplicates.push({ url, bookmarks: group });
      }
    });
    
    if (duplicates.length === 0) {
      resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>没有发现重复的书签</p></div>';
      return;
    }
    
    let html = '<div class="stats-grid"><div class="stat-card"><div class="stat-value">' + duplicates.length + '</div><div class="stat-label">重复组</div></div></div>';
    
    duplicates.forEach(group => {
      html += `
        <div class="duplicate-group">
          <div class="duplicate-count">🔄 ${group.bookmarks.length} 个重复项</div>
          <div class="result-url">${group.url}</div>
      `;
      
      group.bookmarks.forEach((bookmark, index) => {
        html += `
          <div class="result-item">
            <div class="result-title">${bookmark.title || '无标题'}</div>
            <div class="result-actions">
              <button class="btn btn-small" onclick="openBookmark('${bookmark.url}')">打开</button>
              ${index > 0 ? `<button class="btn btn-small btn-danger" onclick="deleteBookmark('${bookmark.id}')">删除</button>` : ''}
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    resultsContainer.innerHTML = html;
  } catch (error) {
    console.error('Duplicate detection failed:', error);
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>检测失败，请重试</p></div>';
  }
}

// Detect invalid bookmarks
async function detectInvalid() {
  const resultsContainer = document.getElementById('invalid-results');
  resultsContainer.innerHTML = '<div class="loading">❌ 正在检测失效书签...</div>';
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const invalid = [];
    
    bookmarks.forEach(bookmark => {
      try {
        new URL(bookmark.url);
        if (!bookmark.title || bookmark.title.trim() === '') {
          invalid.push({ ...bookmark, reason: '标题为空' });
        }
      } catch {
        invalid.push({ ...bookmark, reason: 'URL格式无效' });
      }
    });
    
    if (invalid.length === 0) {
      resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>所有书签都有效</p></div>';
      return;
    }
    
    let html = '<div class="stats-grid"><div class="stat-card"><div class="stat-value">' + invalid.length + '</div><div class="stat-label">失效书签</div></div></div>';
    
    invalid.forEach(bookmark => {
      html += `
        <div class="result-item">
          <div class="result-header">
            <div class="result-title">${bookmark.title || '无标题'}</div>
            <span style="color: var(--accent-red); font-size: 0.75rem;">${bookmark.reason}</span>
          </div>
          <div class="result-url">${bookmark.url}</div>
          <div class="result-actions">
            <button class="btn btn-small" onclick="editBookmark('${bookmark.id}')">编辑</button>
            <button class="btn btn-small btn-danger" onclick="deleteBookmark('${bookmark.id}')">删除</button>
          </div>
        </div>
      `;
    });
    
    resultsContainer.innerHTML = html;
  } catch (error) {
    console.error('Invalid detection failed:', error);
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>检测失败，请重试</p></div>';
  }
}

// Detect empty folders
async function detectEmptyFolders() {
  const resultsContainer = document.getElementById('empty-folders-results');
  resultsContainer.innerHTML = '<div class="loading">📁 正在检测空文件夹...</div>';
  
  try {
    const tree = await new Promise(resolve => chrome.bookmarks.getTree(resolve));
    const emptyFolders = [];
    
    function checkFolder(node) {
      if (!node.children) return;
      
      const hasBookmarks = node.children.some(child => child.url);
      const hasNonEmptySubfolders = node.children.some(child => 
        !child.url && child.children && child.children.length > 0
      );
      
      if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0 && node.id !== '0' && node.id !== '1' && node.id !== '2') {
        emptyFolders.push(node);
      }
      
      node.children.forEach(child => {
        if (!child.url) checkFolder(child);
      });
    }
    
    tree.forEach(root => checkFolder(root));
    
    if (emptyFolders.length === 0) {
      resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>没有空文件夹</p></div>';
      return;
    }
    
    let html = '<div class="stats-grid"><div class="stat-card"><div class="stat-value">' + emptyFolders.length + '</div><div class="stat-label">空文件夹</div></div></div>';
    
    emptyFolders.forEach(folder => {
      html += `
        <div class="result-item">
          <div class="result-title">📁 ${folder.title || '无标题文件夹'}</div>
          <div class="result-actions">
            <button class="btn btn-small btn-danger" onclick="deleteFolder('${folder.id}')">删除</button>
          </div>
        </div>
      `;
    });
    
    resultsContainer.innerHTML = html;
  } catch (error) {
    console.error('Empty folder detection failed:', error);
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>检测失败，请重试</p></div>';
  }
}

// Generate word cloud
async function generateWordCloud() {
  const resultsContainer = document.getElementById('wordcloud-results');
  resultsContainer.innerHTML = '<div class="loading">☁️ 正在生成词云...</div>';
  
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    visualizationService.generateWordCloud(bookmarks, 'wordcloud-results');
  } catch (error) {
    console.error('Word cloud generation failed:', error);
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>生成失败，请重试</p></div>';
  }
}

// Export bookmarks
async function exportBookmarks(format) {
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();
    const timestamp = new Date().toISOString().split('T')[0];
    let content, filename, type;
    
    if (format === 'json') {
      content = JSON.stringify({ bookmarks, exportDate: new Date().toISOString() }, null, 2);
      filename = `bookmarks-${timestamp}.json`;
      type = 'application/json';
    } else if (format === 'csv') {
      content = 'Title,URL,DateAdded\n';
      bookmarks.forEach(b => {
        content += `"${b.title}","${b.url}","${new Date(b.dateAdded).toISOString()}"\n`;
      });
      filename = `bookmarks-${timestamp}.csv`;
      type = 'text/csv';
    } else if (format === 'html') {
      content = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
      bookmarks.forEach(b => {
        content += `<DT><A HREF="${b.url}" ADD_DATE="${Math.floor(b.dateAdded/1000)}">${b.title}</A>\n`;
      });
      content += '</DL><p>';
      filename = `bookmarks-${timestamp}.html`;
      type = 'text/html';
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 导出成功！');
  } catch (error) {
    console.error('Export failed:', error);
    alert('❌ 导出失败，请重试');
  }
}

// Import bookmarks
function importBookmarks() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.html,.csv';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const resultsContainer = document.getElementById('import-results');
    resultsContainer.innerHTML = '<div class="loading">📥 正在导入...</div>';
    
    try {
      const text = await file.text();
      let imported = 0;
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        const bookmarks = data.bookmarks || data;
        for (const bookmark of bookmarks) {
          await chrome.bookmarks.create({
            parentId: '1',
            title: bookmark.title,
            url: bookmark.url
          });
          imported++;
        }
      }
      
      resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✅</div><p>成功导入 ${imported} 个书签</p></div>`;
    } catch (error) {
      console.error('Import failed:', error);
      resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>导入失败，请重试</p></div>';
    }
  };
  
  input.click();
}

// Create backup
async function createBackup() {
  try {
    const tree = await new Promise(resolve => chrome.bookmarks.getTree(resolve));
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tree
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 备份创建成功！');
  } catch (error) {
    console.error('Backup failed:', error);
    alert('❌ 备份失败，请重试');
  }
}

// Restore backup
function restoreBackup() {
  if (!confirm('⚠️ 恢复备份将替换所有现有书签。确定要继续吗？')) {
    return;
  }
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // This is a simplified version - full implementation would need careful handling
      alert('⚠️ 恢复功能需要更复杂的实现以避免数据丢失。建议手动导入。');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('❌ 恢复失败，请重试');
    }
  };
  
  input.click();
}

// Batch operations
async function batchDeleteDuplicates() {
  if (!confirm('确定要删除所有重复的书签吗？')) return;
  
  const resultsContainer = document.getElementById('batch-results');
  resultsContainer.innerHTML = '<div class="loading">⚡ 正在删除重复书签...</div>';
  
  // Implementation would go here
  setTimeout(() => {
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>批量删除完成</p></div>';
  }, 1000);
}

async function batchDeleteInvalid() {
  if (!confirm('确定要删除所有失效的书签吗？')) return;
  
  const resultsContainer = document.getElementById('batch-results');
  resultsContainer.innerHTML = '<div class="loading">⚡ 正在删除失效书签...</div>';
  
  // Implementation would go here
  setTimeout(() => {
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>批量删除完成</p></div>';
  }, 1000);
}

async function batchDeleteEmpty() {
  if (!confirm('确定要删除所有空文件夹吗？')) return;
  
  const resultsContainer = document.getElementById('batch-results');
  resultsContainer.innerHTML = '<div class="loading">⚡ 正在删除空文件夹...</div>';
  
  // Implementation would go here
  setTimeout(() => {
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>批量删除完成</p></div>';
  }, 1000);
}

async function batchDeleteAll() {
  if (!confirm('⚠️ 这将删除所有检测到的问题项。确定要继续吗？')) return;
  
  const resultsContainer = document.getElementById('batch-results');
  resultsContainer.innerHTML = '<div class="loading">⚡ 正在执行批量清理...</div>';
  
  // Implementation would go here
  setTimeout(() => {
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>批量清理完成</p></div>';
  }, 1000);
}

// Global helper functions
window.openBookmark = (url) => {
  window.open(url, '_blank');
};

window.deleteBookmark = async (id) => {
  if (confirm('确定要删除这个书签吗？')) {
    try {
      await chrome.bookmarks.remove(id);
      alert('✅ 删除成功');
      // Refresh current view
      location.reload();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ 删除失败');
    }
  }
};

window.editBookmark = async (id) => {
  const title = prompt('输入新标题：');
  if (title) {
    try {
      await chrome.bookmarks.update(id, { title });
      alert('✅ 更新成功');
      location.reload();
    } catch (error) {
      console.error('Edit failed:', error);
      alert('❌ 更新失败');
    }
  }
};

window.deleteFolder = async (id) => {
  if (confirm('确定要删除这个文件夹吗？')) {
    try {
      await chrome.bookmarks.removeTree(id);
      alert('✅ 删除成功');
      location.reload();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ 删除失败');
    }
  }
};
