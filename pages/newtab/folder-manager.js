// Folder Manager - JavaScript controller

let selectedFolder = null;
let folderTree = null;
let stats = {
  totalFolders: 0,
  totalBookmarks: 0,
  emptyFolders: 0,
  maxDepth: 0
};

// Initialize the folder manager
async function initialize() {
  console.log('Initializing Folder Manager...');
  
  // Load and display folder tree
  await loadFolderTree();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('Folder Manager initialized');
}

// Load the complete folder tree
async function loadFolderTree() {
  try {
    const tree = await new Promise(resolve => chrome.bookmarks.getTree(resolve));
    folderTree = tree[0];
    
    // Calculate statistics
    calculateStatistics(folderTree);
    updateStatisticsDisplay();
    
    // Render the folder tree
    renderFolderTree(folderTree);
  } catch (error) {
    console.error('Failed to load folder tree:', error);
    showError('加载文件夹树失败');
  }
}

// Calculate folder statistics
function calculateStatistics(node, depth = 0) {
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  
  if (!node.children) return;
  
  for (const child of node.children) {
    if (child.url) {
      stats.totalBookmarks++;
    } else {
      stats.totalFolders++;
      
      // Check if folder is empty
      const isEmpty = isEmptyFolder(child);
      if (isEmpty) {
        stats.emptyFolders++;
      }
      
      // Recurse into subfolders
      if (child.children) {
        calculateStatistics(child, depth + 1);
      }
    }
  }
}

// Check if a folder is empty (no bookmarks, no subfolders with content)
function isEmptyFolder(folder) {
  if (!folder.children || folder.children.length === 0) {
    return true;
  }
  
  const hasBookmarks = folder.children.some(child => child.url);
  if (hasBookmarks) return false;
  
  const hasNonEmptySubfolders = folder.children.some(child => 
    !child.url && child.children && child.children.length > 0 && !isEmptyFolder(child)
  );
  
  return !hasNonEmptySubfolders;
}

// Update statistics display
function updateStatisticsDisplay() {
  document.getElementById('total-folders').textContent = stats.totalFolders;
  document.getElementById('total-bookmarks').textContent = stats.totalBookmarks;
  document.getElementById('empty-folders').textContent = stats.emptyFolders;
  document.getElementById('max-depth').textContent = stats.maxDepth;
}

// Render the folder tree
function renderFolderTree(node) {
  const treeContainer = document.getElementById('folder-tree');
  treeContainer.innerHTML = '';
  
  if (!node.children) {
    treeContainer.innerHTML = '<li class="empty-state">没有文件夹</li>';
    return;
  }
  
  // Render each root folder
  node.children.forEach(child => {
    if (!child.url) { // Only render folders, not bookmarks
      const folderItem = createFolderTreeItem(child, 0);
      treeContainer.appendChild(folderItem);
    }
  });
}

// Create a folder tree item element
function createFolderTreeItem(folder, depth) {
  const li = document.createElement('li');
  li.className = 'folder-tree-item';
  li.dataset.folderId = folder.id;
  li.dataset.depth = depth;
  
  const content = document.createElement('div');
  content.className = 'folder-tree-item-content';
  
  // Count children
  const bookmarkCount = folder.children ? folder.children.filter(c => c.url).length : 0;
  const folderCount = folder.children ? folder.children.filter(c => !c.url).length : 0;
  const isEmpty = isEmptyFolder(folder);
  
  // Toggle icon (only show if has subfolders)
  const toggleIcon = folderCount > 0 
    ? '<span class="folder-toggle">▶</span>'
    : '<span class="folder-toggle" style="opacity: 0;">▶</span>';
  
  // Folder icon
  const folderIcon = isEmpty 
    ? '📁' 
    : (folderCount > 0 ? '📂' : '📚');
  
  content.innerHTML = `
    ${toggleIcon}
    <span class="folder-icon-wrapper">${folderIcon}</span>
    <span class="folder-name" title="${folder.title}">${folder.title || '未命名文件夹'}</span>
    <span class="folder-stats">${bookmarkCount} 书签 / ${folderCount} 文件夹</span>
  `;
  
  // Click handler
  content.addEventListener('click', (e) => {
    if (e.target.classList.contains('folder-toggle')) {
      toggleFolder(li);
    } else {
      selectFolder(folder, content);
    }
  });
  
  li.appendChild(content);
  
  // Add children if has subfolders
  if (folderCount > 0) {
    const childrenUl = document.createElement('ul');
    childrenUl.className = 'folder-tree-children';
    
    folder.children.forEach(child => {
      if (!child.url) {
        const childItem = createFolderTreeItem(child, depth + 1);
        childrenUl.appendChild(childItem);
      }
    });
    
    li.appendChild(childrenUl);
  }
  
  return li;
}

// Toggle folder expand/collapse
function toggleFolder(folderItem) {
  folderItem.classList.toggle('expanded');
}

// Select a folder to view details
function selectFolder(folder, contentElement) {
  selectedFolder = folder;
  
  // Update active state
  document.querySelectorAll('.folder-tree-item-content').forEach(el => {
    el.classList.remove('active');
  });
  contentElement.classList.add('active');
  
  // Show folder details
  displayFolderDetails(folder);
  
  // Update visualization
  updateVisualization(folder);
}

// Display folder details
function displayFolderDetails(folder) {
  const detailsContainer = document.getElementById('folder-details');
  detailsContainer.style.display = 'block';
  
  const bookmarkCount = folder.children ? folder.children.filter(c => c.url).length : 0;
  const subfolderCount = folder.children ? folder.children.filter(c => !c.url).length : 0;
  const depth = parseInt(document.querySelector(`[data-folder-id="${folder.id}"]`)?.dataset.depth || 0);
  const isEmpty = isEmptyFolder(folder);
  
  document.getElementById('detail-name').textContent = folder.title || '未命名文件夹';
  document.getElementById('detail-bookmarks').textContent = bookmarkCount;
  document.getElementById('detail-subfolders').textContent = subfolderCount;
  document.getElementById('detail-depth').textContent = depth;
  
  // Show/hide delete empty folder button
  const deleteBtn = document.getElementById('delete-empty-btn');
  if (isEmpty && folder.id !== '0' && folder.id !== '1' && folder.id !== '2') {
    deleteBtn.style.display = 'flex';
  } else {
    deleteBtn.style.display = 'none';
  }
}

// Update visualization canvas
function updateVisualization(folder) {
  const canvas = document.getElementById('visualization-canvas');
  
  const bookmarkCount = folder.children ? folder.children.filter(c => c.url).length : 0;
  const subfolderCount = folder.children ? folder.children.filter(c => !c.url).length : 0;
  
  // Create a simple bar chart visualization
  const maxValue = Math.max(bookmarkCount, subfolderCount, 1);
  const bookmarkPercentage = (bookmarkCount / maxValue) * 100;
  const folderPercentage = (subfolderCount / maxValue) * 100;
  
  canvas.innerHTML = `
    <div style="width: 80%; max-width: 400px;">
      <h3 style="text-align: center; margin-bottom: 2rem; color: var(--text-primary);">
        ${folder.title || '未命名文件夹'}
      </h3>
      
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-secondary);">📚 书签</span>
          <span style="color: var(--text-primary); font-weight: 600;">${bookmarkCount}</span>
        </div>
        <div style="background: var(--bg-tertiary); border-radius: 8px; height: 24px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); height: 100%; width: ${bookmarkPercentage}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-secondary);">📁 子文件夹</span>
          <span style="color: var(--text-primary); font-weight: 600;">${subfolderCount}</span>
        </div>
        <div style="background: var(--bg-tertiary); border-radius: 8px; height: 24px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${folderPercentage}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
        <div style="font-size: 2rem; font-weight: 700; color: var(--accent-primary, var(--accent-blue));">
          ${bookmarkCount + subfolderCount}
        </div>
        <div style="color: var(--text-muted); font-size: 0.875rem;">
          总项目数
        </div>
      </div>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    // Reset stats
    stats = {
      totalFolders: 0,
      totalBookmarks: 0,
      emptyFolders: 0,
      maxDepth: 0
    };
    await loadFolderTree();
  });
  
  // Collapse all
  document.getElementById('collapse-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.folder-tree-item.expanded').forEach(item => {
      item.classList.remove('expanded');
    });
  });
  
  // Expand all
  document.getElementById('expand-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.folder-tree-item').forEach(item => {
      if (item.querySelector('.folder-tree-children')) {
        item.classList.add('expanded');
      }
    });
  });
  
  // Open folder in Chrome
  document.getElementById('open-folder-btn').addEventListener('click', () => {
    if (selectedFolder) {
      chrome.bookmarks.getChildren(selectedFolder.id, (children) => {
        children.filter(c => c.url).forEach((bookmark, index) => {
          setTimeout(() => {
            window.open(bookmark.url, '_blank');
          }, index * 100); // Stagger opening to avoid browser blocking
        });
      });
    }
  });
  
  // Export folder
  document.getElementById('export-folder-btn').addEventListener('click', () => {
    if (selectedFolder) {
      exportFolder(selectedFolder);
    }
  });
  
  // Delete empty folder
  document.getElementById('delete-empty-btn').addEventListener('click', async () => {
    if (selectedFolder) {
      const confirmed = confirm(`确定要删除空文件夹 "${selectedFolder.title}" 吗？此操作无法撤销。`);
      if (confirmed) {
        try {
          await chrome.bookmarks.removeTree(selectedFolder.id);
          showSuccess('文件夹已删除');
          // Reload tree
          stats = {
            totalFolders: 0,
            totalBookmarks: 0,
            emptyFolders: 0,
            maxDepth: 0
          };
          await loadFolderTree();
          document.getElementById('folder-details').style.display = 'none';
        } catch (error) {
          console.error('Failed to delete folder:', error);
          showError('删除文件夹失败');
        }
      }
    }
  });
}

// Export folder as JSON
function exportFolder(folder) {
  const exportData = {
    name: folder.title,
    id: folder.id,
    dateAdded: folder.dateAdded,
    children: folder.children
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folder.title || 'folder'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccess('文件夹已导出');
}

// Show error message
function showError(message) {
  // Simple alert for now, can be enhanced with a toast notification
  alert('❌ ' + message);
}

// Show success message
function showSuccess(message) {
  // Simple alert for now, can be enhanced with a toast notification
  const originalText = document.getElementById('refresh-btn').textContent;
  document.getElementById('refresh-btn').textContent = '✅ ' + message;
  setTimeout(() => {
    document.getElementById('refresh-btn').textContent = originalText;
  }, 2000);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
