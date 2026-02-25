// Folder Manager - JavaScript controller with enhanced features

let selectedFolder = null;
let folderTree = null;
let stats = {
  totalFolders: 0,
  totalBookmarks: 0,
  emptyFolders: 0,
  maxDepth: 0
};

let editingItem = null; // Current item being edited (for add/edit modals)
let draggedItem = null; // Item being dragged

// Batch selection mode
let batchMode = false;
let selectedItems = new Set(); // Set of selected item IDs

// Theme management
let currentTheme = 'light';
let currentAccent = 'blue';

// Initialize the folder manager
async function initialize() {
  console.log('Initializing Folder Manager...');
  
  // Load theme settings
  await loadThemeSettings();
  
  // Load and display folder tree
  await loadFolderTree();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('Folder Manager initialized');
}

// Load theme settings from storage
async function loadThemeSettings() {
  try {
    const result = await chrome.storage.local.get('newtabSettings');
    if (result.newtabSettings) {
      currentTheme = result.newtabSettings.theme || 'light';
      currentAccent = result.newtabSettings.accentColor || 'blue';
      applyTheme(currentTheme, currentAccent);
    }
  } catch (error) {
    console.error('Failed to load theme settings:', error);
  }
}

// Apply theme to the page
function applyTheme(theme, accent) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-accent', accent);
  console.log(`Theme applied: ${theme}, Accent: ${accent}`);
}

// Listen for theme changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.newtabSettings) {
    const newSettings = changes.newtabSettings.newValue;
    if (newSettings) {
      currentTheme = newSettings.theme || 'light';
      currentAccent = newSettings.accentColor || 'blue';
      applyTheme(currentTheme, currentAccent);
    }
  }
});

// Load the complete folder tree
async function loadFolderTree() {
  try {
    const tree = await new Promise(resolve => chrome.bookmarks.getTree(resolve));
    folderTree = tree[0];
    
    // Reset statistics
    stats = {
      totalFolders: 0,
      totalBookmarks: 0,
      emptyFolders: 0,
      maxDepth: 0
    };
    
    // Calculate statistics
    calculateStatistics(folderTree);
    updateStatisticsDisplay();
    
    // Render the folder tree
    renderFolderTree(folderTree);
  } catch (error) {
    console.error('Failed to load folder tree:', error);
    showToast('加载文件夹树失败', 'error');
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
  
  // Render each root folder and bookmarks
  node.children.forEach(child => {
    const item = createFolderTreeItem(child, 0);
    treeContainer.appendChild(item);
  });
}

// Create a folder tree item element
function createFolderTreeItem(item, depth) {
  const li = document.createElement('li');
  li.className = 'folder-tree-item';
  li.dataset.itemId = item.id;
  li.dataset.depth = depth;
  li.draggable = true;
  
  const content = document.createElement('div');
  content.className = 'folder-tree-item-content draggable';
  
  // Check if it's a bookmark or folder
  const isBookmark = !!item.url;
  
  if (isBookmark) {
    // Bookmark item
    const checkboxHtml = batchMode 
      ? `<span class="checkbox-wrapper"><input type="checkbox" class="item-checkbox" data-item-id="${item.id}"></span>`
      : '';
    content.innerHTML = `
      ${checkboxHtml}
      <span class="folder-toggle" style="opacity: 0;">▶</span>
      <span class="folder-icon-wrapper">🔖</span>
      <span class="folder-name" title="${item.title || item.url}">${item.title || item.url}</span>
    `;
  } else {
    // Folder item
    const bookmarkCount = item.children ? item.children.filter(c => c.url).length : 0;
    const folderCount = item.children ? item.children.filter(c => !c.url).length : 0;
    const isEmpty = isEmptyFolder(item);
    
    // Toggle icon (only show if has children)
    const hasChildren = item.children && item.children.length > 0;
    const toggleIcon = hasChildren 
      ? '<span class="folder-toggle">▶</span>'
      : '<span class="folder-toggle" style="opacity: 0;">▶</span>';
    
    // Folder icon
    const folderIcon = isEmpty 
      ? '📁' 
      : (folderCount > 0 ? '📂' : '📚');
    
    const checkboxHtml = batchMode 
      ? `<span class="checkbox-wrapper"><input type="checkbox" class="item-checkbox" data-item-id="${item.id}"></span>`
      : '';
    
    content.innerHTML = `
      ${checkboxHtml}
      ${toggleIcon}
      <span class="folder-icon-wrapper">${folderIcon}</span>
      <span class="folder-name" title="${item.title}">${item.title || '未命名文件夹'}</span>
      <span class="folder-stats">${bookmarkCount} 书签 / ${folderCount} 文件夹</span>
    `;
  }
  
  // Click handler
  content.addEventListener('click', (e) => {
    if (e.target.classList.contains('folder-toggle')) {
      toggleFolder(li);
    } else if (e.target.classList.contains('item-checkbox')) {
      // Checkbox click - toggle selection
      toggleItemSelection(item.id, e.target.checked);
    } else if (batchMode) {
      // In batch mode, clicking the item toggles its checkbox
      const checkbox = content.querySelector('.item-checkbox');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        toggleItemSelection(item.id, checkbox.checked);
      }
    } else {
      selectItem(item, content);
    }
  });
  
  // Setup checkbox change listener
  if (batchMode) {
    const checkbox = content.querySelector('.item-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleItemSelection(item.id, e.target.checked);
      });
      
      // Set checkbox state if item is already selected
      if (selectedItems.has(item.id)) {
        checkbox.checked = true;
        content.classList.add('selected');
      }
    }
  }
  
  // Drag and drop handlers
  setupDragAndDrop(li, item);
  
  li.appendChild(content);
  
  // Add children if has any
  if (!isBookmark && item.children && item.children.length > 0) {
    const childrenUl = document.createElement('ul');
    childrenUl.className = 'folder-tree-children';
    
    item.children.forEach(child => {
      const childItem = createFolderTreeItem(child, depth + 1);
      childrenUl.appendChild(childItem);
    });
    
    li.appendChild(childrenUl);
  }
  
  return li;
}

// Setup drag and drop for an item
function setupDragAndDrop(element, item) {
  let dropPosition = null; // 'before', 'into', 'after'
  
  element.addEventListener('dragstart', (e) => {
    draggedItem = item;
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', element.innerHTML);
  });
  
  element.addEventListener('dragend', (e) => {
    element.classList.remove('dragging');
    document.querySelectorAll('.drag-over, .drag-over-before, .drag-over-after').forEach(el => {
      el.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    });
    draggedItem = null;
    dropPosition = null;
  });
  
  element.addEventListener('dragover', (e) => {
    if (!draggedItem || draggedItem.id === item.id) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Determine drop position based on mouse position
    const rect = element.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    
    // Remove all position classes first
    element.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    
    // For folders, allow dropping into them (center area) or before/after
    if (!item.url) {
      if (mouseY < height * 0.25) {
        dropPosition = 'before';
        element.classList.add('drag-over-before');
      } else if (mouseY > height * 0.75) {
        dropPosition = 'after';
        element.classList.add('drag-over-after');
      } else {
        dropPosition = 'into';
        element.classList.add('drag-over');
      }
    } else {
      // For bookmarks, only allow before/after
      if (mouseY < height * 0.5) {
        dropPosition = 'before';
        element.classList.add('drag-over-before');
      } else {
        dropPosition = 'after';
        element.classList.add('drag-over-after');
      }
    }
  });
  
  element.addEventListener('dragleave', (e) => {
    element.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    dropPosition = null;
  });
  
  element.addEventListener('drop', async (e) => {
    e.preventDefault();
    element.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    
    if (!draggedItem || draggedItem.id === item.id) return;
    
    try {
      if (dropPosition === 'into') {
        // Drop into folder
        if (item.url) {
          showToast('只能将项目移动到文件夹中', 'error');
          return;
        }
        
        // Prevent moving a folder into itself or its descendants
        if (!draggedItem.url && isDescendant(item, draggedItem)) {
          showToast('不能将文件夹移动到自己或子文件夹中', 'error');
          return;
        }
        
        await chrome.bookmarks.move(draggedItem.id, { parentId: item.id });
        showToast('移动成功', 'success');
      } else {
        // Drop before or after (reorder)
        // Get parent of target item
        const targetParent = await getParentNode(item.id);
        if (!targetParent) {
          showToast('无法确定父文件夹', 'error');
          return;
        }
        
        // Check if source and target have the same parent
        const sourceParent = await getParentNode(draggedItem.id);
        
        // Find target index in parent's children
        const targetIndex = targetParent.children.findIndex(c => c.id === item.id);
        let newIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
        
        // If moving within same parent and source is before target, adjust index
        if (sourceParent && sourceParent.id === targetParent.id) {
          const sourceIndex = targetParent.children.findIndex(c => c.id === draggedItem.id);
          if (sourceIndex < targetIndex && dropPosition === 'after') {
            newIndex--;
          }
        }
        
        await chrome.bookmarks.move(draggedItem.id, { 
          parentId: targetParent.id,
          index: newIndex
        });
        showToast('调整顺序成功', 'success');
      }
      
      await loadFolderTree();
      
      // Re-select the moved item
      const movedElement = document.querySelector(`[data-item-id="${draggedItem.id}"] .folder-tree-item-content`);
      if (movedElement) {
        selectItem(draggedItem, movedElement);
      }
    } catch (error) {
      console.error('Failed to move item:', error);
      showToast('移动失败', 'error');
    }
    
    dropPosition = null;
  });
}

// Get parent node of a bookmark/folder
async function getParentNode(itemId) {
  return new Promise((resolve) => {
    chrome.bookmarks.get(itemId, (items) => {
      if (!items || items.length === 0) {
        resolve(null);
        return;
      }
      const item = items[0];
      chrome.bookmarks.get(item.parentId, (parents) => {
        if (!parents || parents.length === 0) {
          resolve(null);
          return;
        }
        const parent = parents[0];
        chrome.bookmarks.getChildren(parent.id, (children) => {
          parent.children = children;
          resolve(parent);
        });
      });
    });
  });
}

// Check if an item is a descendant of another
function isDescendant(parent, child) {
  if (!parent.children) return false;
  
  for (const item of parent.children) {
    if (item.id === child.id) return true;
    if (!item.url && isDescendant(item, child)) return true;
  }
  
  return false;
}

// Toggle folder expand/collapse
function toggleFolder(folderItem) {
  folderItem.classList.toggle('expanded');
}

// Select an item to view details
function selectItem(item, contentElement) {
  selectedFolder = item;
  
  // Update active state
  document.querySelectorAll('.folder-tree-item-content').forEach(el => {
    el.classList.remove('active');
  });
  contentElement.classList.add('active');
  
  // Show item details
  displayItemDetails(item);
  
  // Update visualization
  updateVisualization(item);
}

// Display item details
function displayItemDetails(item) {
  const detailsContainer = document.getElementById('folder-details');
  detailsContainer.style.display = 'block';
  
  const isBookmark = !!item.url;
  
  if (isBookmark) {
    // Bookmark details
    document.getElementById('detail-name').textContent = item.title || '未命名书签';
    document.getElementById('detail-bookmarks').textContent = '1';
    document.getElementById('detail-subfolders').textContent = '0';
    const depth = parseInt(document.querySelector(`[data-item-id="${item.id}"]`)?.dataset.depth || 0);
    document.getElementById('detail-depth').textContent = depth;
    
    // Hide folder-specific buttons
    document.getElementById('open-folder-btn').style.display = 'none';
    document.getElementById('export-folder-btn').style.display = 'none';
  } else {
    // Folder details
    const bookmarkCount = item.children ? item.children.filter(c => c.url).length : 0;
    const subfolderCount = item.children ? item.children.filter(c => !c.url).length : 0;
    const depth = parseInt(document.querySelector(`[data-item-id="${item.id}"]`)?.dataset.depth || 0);
    
    document.getElementById('detail-name').textContent = item.title || '未命名文件夹';
    document.getElementById('detail-bookmarks').textContent = bookmarkCount;
    document.getElementById('detail-subfolders').textContent = subfolderCount;
    document.getElementById('detail-depth').textContent = depth;
    
    // Show folder-specific buttons
    document.getElementById('open-folder-btn').style.display = 'flex';
    document.getElementById('export-folder-btn').style.display = 'flex';
  }
}

// Update visualization canvas
function updateVisualization(item) {
  const canvas = document.getElementById('visualization-canvas');
  
  const isBookmark = !!item.url;
  
  if (isBookmark) {
    // Bookmark visualization
    canvas.innerHTML = `
      <div style="width: 80%; max-width: 400px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔖</div>
        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
          ${item.title || '未命名书签'}
        </h3>
        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; word-break: break-all;">
          <a href="${item.url}" target="_blank" style="color: var(--accent-primary, var(--accent-blue)); text-decoration: none;">
            ${item.url}
          </a>
        </div>
      </div>
    `;
  } else {
    // Folder visualization
    const bookmarkCount = item.children ? item.children.filter(c => c.url).length : 0;
    const subfolderCount = item.children ? item.children.filter(c => !c.url).length : 0;
    
    const maxValue = Math.max(bookmarkCount, subfolderCount, 1);
    const bookmarkPercentage = (bookmarkCount / maxValue) * 100;
    const folderPercentage = (subfolderCount / maxValue) * 100;
    
    canvas.innerHTML = `
      <div style="width: 80%; max-width: 400px;">
        <h3 style="text-align: center; margin-bottom: 2rem; color: var(--text-primary);">
          ${item.title || '未命名文件夹'}
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
}

// Setup event listeners
function setupEventListeners() {
  // Add bookmark button
  document.getElementById('add-bookmark-btn').addEventListener('click', () => {
    openBookmarkModal('add');
  });
  
  // Add folder button
  document.getElementById('add-folder-btn').addEventListener('click', () => {
    openFolderModal('add');
  });
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadFolderTree();
    showToast('刷新成功', 'success');
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
  
  // Edit item button
  document.getElementById('edit-item-btn').addEventListener('click', () => {
    if (selectedFolder) {
      if (selectedFolder.url) {
        openBookmarkModal('edit', selectedFolder);
      } else {
        openFolderModal('edit', selectedFolder);
      }
    }
  });
  
  // Open folder in Chrome
  document.getElementById('open-folder-btn').addEventListener('click', () => {
    if (selectedFolder && !selectedFolder.url) {
      chrome.bookmarks.getChildren(selectedFolder.id, (children) => {
        const bookmarks = children.filter(c => c.url);
        if (bookmarks.length === 0) {
          showToast('文件夹中没有书签', 'error');
          return;
        }
        bookmarks.forEach((bookmark, index) => {
          setTimeout(() => {
            window.open(bookmark.url, '_blank');
          }, index * 100);
        });
        showToast(`打开了 ${bookmarks.length} 个书签`, 'success');
      });
    }
  });
  
  // Export folder
  document.getElementById('export-folder-btn').addEventListener('click', () => {
    if (selectedFolder && !selectedFolder.url) {
      exportFolder(selectedFolder);
    }
  });
  
  // Delete item button
  document.getElementById('delete-item-btn').addEventListener('click', async () => {
    if (selectedFolder) {
      await deleteItem(selectedFolder);
    }
  });
  
  // Bookmark modal events
  setupModalEvents('bookmark');
  
  // Folder modal events
  setupModalEvents('folder');
  
  // Batch mode toggle
  document.getElementById('batch-mode-btn').addEventListener('click', () => {
    toggleBatchMode();
  });
  
  // Selection toolbar events
  document.getElementById('select-all-btn').addEventListener('click', () => {
    selectAllItems();
  });
  
  document.getElementById('deselect-all-btn').addEventListener('click', () => {
    deselectAllItems();
  });
  
  document.getElementById('batch-move-btn').addEventListener('click', () => {
    if (selectedItems.size === 0) {
      showToast('请先选择要移动的项目', 'error');
      return;
    }
    openBatchMoveModal();
  });
  
  document.getElementById('batch-delete-btn').addEventListener('click', async () => {
    if (selectedItems.size === 0) {
      showToast('请先选择要删除的项目', 'error');
      return;
    }
    await batchDeleteItems();
  });
  
  document.getElementById('close-selection-btn').addEventListener('click', () => {
    toggleBatchMode();
  });
  
  // Batch move modal events
  setupBatchMoveModalEvents();
}

// Setup modal events
function setupModalEvents(type) {
  const modal = document.getElementById(`${type}-modal`);
  const closeBtn = document.getElementById(`${type}-modal-close`);
  const cancelBtn = document.getElementById(`${type}-modal-cancel`);
  const saveBtn = document.getElementById(`${type}-modal-save`);
  
  // Check if already initialized to prevent duplicate event listeners
  if (modal.dataset.initialized === 'true') {
    return;
  }
  modal.dataset.initialized = 'true';
  
  // Close modal function
  const closeModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    modal.classList.remove('active');
    editingItem = null;
  };
  
  // Close button click handler
  closeBtn.addEventListener('click', closeModal);
  
  // Cancel button click handler
  cancelBtn.addEventListener('click', closeModal);
  
  // Click outside to close (click on overlay background)
  modal.addEventListener('click', (e) => {
    // Only close if clicking directly on the modal overlay (not its children)
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
      closeModal(e);
    }
  });
  
  // ESC key to close - only for this specific modal
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal(e);
    }
  };
  document.addEventListener('keydown', handleEscapeKey);
  
  // Save button handler
  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
    }
    try {
      if (type === 'bookmark') {
        await saveBookmark();
      } else {
        await saveFolder();
      }
      closeModal();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };
  
  saveBtn.addEventListener('click', handleSave);
  
  // Enter key to save (only when modal is active)
  modal.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && modal.classList.contains('active')) {
      await handleSave(e);
    }
  });
}

// Open bookmark modal
function openBookmarkModal(mode, bookmark = null) {
  const modal = document.getElementById('bookmark-modal');
  const title = document.getElementById('bookmark-modal-title');
  const titleInput = document.getElementById('bookmark-title');
  const urlInput = document.getElementById('bookmark-url');
  
  if (!modal || !title || !titleInput || !urlInput) {
    console.error('Bookmark modal elements not found');
    return;
  }
  
  if (mode === 'edit' && bookmark) {
    title.textContent = '编辑书签';
    titleInput.value = bookmark.title || '';
    urlInput.value = bookmark.url || '';
    editingItem = bookmark;
  } else {
    title.textContent = '添加书签';
    titleInput.value = '';
    urlInput.value = '';
    editingItem = { mode: 'add' };
  }
  
  modal.classList.add('active');
  // Use setTimeout to ensure DOM is ready and focus works
  setTimeout(() => {
    titleInput.focus();
  }, 50);
}

// Open folder modal
function openFolderModal(mode, folder = null) {
  const modal = document.getElementById('folder-modal');
  const title = document.getElementById('folder-modal-title');
  const titleInput = document.getElementById('folder-title');
  
  if (!modal || !title || !titleInput) {
    console.error('Folder modal elements not found');
    return;
  }
  
  if (mode === 'edit' && folder) {
    title.textContent = '编辑文件夹';
    titleInput.value = folder.title || '';
    editingItem = folder;
  } else {
    title.textContent = '添加文件夹';
    titleInput.value = '';
    editingItem = { mode: 'add' };
  }
  
  modal.classList.add('active');
  // Use setTimeout to ensure DOM is ready and focus works
  setTimeout(() => {
    titleInput.focus();
  }, 50);
}

// Save bookmark
async function saveBookmark() {
  const titleInput = document.getElementById('bookmark-title');
  const urlInput = document.getElementById('bookmark-url');
  
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  
  if (!title) {
    showToast('请输入书签标题', 'error');
    return;
  }
  
  if (!url) {
    showToast('请输入书签URL', 'error');
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    showToast('请输入有效的URL', 'error');
    return;
  }
  
  try {
    if (editingItem && editingItem.id) {
      // Edit existing bookmark
      await chrome.bookmarks.update(editingItem.id, { title, url });
      showToast('书签已更新', 'success');
    } else {
      // Add new bookmark
      const parentId = selectedFolder && !selectedFolder.url ? selectedFolder.id : '1';
      await chrome.bookmarks.create({ parentId, title, url });
      showToast('书签已添加', 'success');
    }
    
    await loadFolderTree();
  } catch (error) {
    console.error('Failed to save bookmark:', error);
    showToast('保存失败', 'error');
  }
}

// Save folder
async function saveFolder() {
  const titleInput = document.getElementById('folder-title');
  const title = titleInput.value.trim();
  
  if (!title) {
    showToast('请输入文件夹名称', 'error');
    return;
  }
  
  try {
    if (editingItem && editingItem.id) {
      // Edit existing folder
      await chrome.bookmarks.update(editingItem.id, { title });
      showToast('文件夹已更新', 'success');
    } else {
      // Add new folder
      const parentId = selectedFolder && !selectedFolder.url ? selectedFolder.id : '1';
      await chrome.bookmarks.create({ parentId, title });
      showToast('文件夹已添加', 'success');
    }
    
    await loadFolderTree();
  } catch (error) {
    console.error('Failed to save folder:', error);
    showToast('保存失败', 'error');
  }
}

// Delete item (bookmark or folder)
async function deleteItem(item) {
  const isBookmark = !!item.url;
  const itemType = isBookmark ? '书签' : '文件夹';
  const itemName = item.title || '未命名' + itemType;
  
  // Check if folder has children
  if (!isBookmark && item.children && item.children.length > 0) {
    const confirmed = confirm(`"${itemName}" 包含 ${item.children.length} 个项目。确定要删除整个${itemType}及其所有内容吗？此操作无法撤销。`);
    if (!confirmed) return;
  } else {
    const confirmed = confirm(`确定要删除${itemType} "${itemName}" 吗？此操作无法撤销。`);
    if (!confirmed) return;
  }
  
  try {
    if (isBookmark) {
      await chrome.bookmarks.remove(item.id);
    } else {
      await chrome.bookmarks.removeTree(item.id);
    }
    
    showToast(`${itemType}已删除`, 'success');
    await loadFolderTree();
    document.getElementById('folder-details').style.display = 'none';
    selectedFolder = null;
  } catch (error) {
    console.error('Failed to delete item:', error);
    showToast('删除失败', 'error');
  }
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
  
  showToast('文件夹已导出', 'success');
}

// Show toast notification
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : '❌';
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toggle batch selection mode
function toggleBatchMode() {
  batchMode = !batchMode;
  const batchBtn = document.getElementById('batch-mode-btn');
  const toolbar = document.getElementById('selection-toolbar');
  
  if (batchMode) {
    batchBtn.classList.add('active');
    toolbar.classList.add('show');
    selectedItems.clear();
  } else {
    batchBtn.classList.remove('active');
    toolbar.classList.remove('show');
    selectedItems.clear();
  }
  
  // Re-render tree to show/hide checkboxes
  renderFolderTree(folderTree);
  updateSelectionCount();
}

// Toggle item selection
function toggleItemSelection(itemId, selected) {
  if (selected) {
    selectedItems.add(itemId);
  } else {
    selectedItems.delete(itemId);
  }
  
  // Update visual state
  const element = document.querySelector(`[data-item-id="${itemId}"] .folder-tree-item-content`);
  if (element) {
    if (selected) {
      element.classList.add('selected');
    } else {
      element.classList.remove('selected');
    }
  }
  
  updateSelectionCount();
}

// Update selection count display
function updateSelectionCount() {
  const countElement = document.getElementById('selected-count');
  if (countElement) {
    countElement.textContent = selectedItems.size;
  }
}

// Select all items
function selectAllItems() {
  const allCheckboxes = document.querySelectorAll('.item-checkbox');
  allCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
    const itemId = checkbox.dataset.itemId;
    selectedItems.add(itemId);
    
    const content = checkbox.closest('.folder-tree-item-content');
    if (content) {
      content.classList.add('selected');
    }
  });
  
  updateSelectionCount();
  showToast(`已选择 ${selectedItems.size} 项`, 'success');
}

// Deselect all items
function deselectAllItems() {
  const allCheckboxes = document.querySelectorAll('.item-checkbox');
  allCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
    const itemId = checkbox.dataset.itemId;
    selectedItems.delete(itemId);
    
    const content = checkbox.closest('.folder-tree-item-content');
    if (content) {
      content.classList.remove('selected');
    }
  });
  
  selectedItems.clear();
  updateSelectionCount();
  showToast('已取消所有选择', 'success');
}

// Batch delete items
async function batchDeleteItems() {
  const count = selectedItems.size;
  const confirmed = confirm(`确定要删除选中的 ${count} 项吗？此操作无法撤销。`);
  
  if (!confirmed) return;
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const itemId of selectedItems) {
    try {
      // Check if it's a folder or bookmark
      const items = await new Promise(resolve => chrome.bookmarks.get(itemId, resolve));
      if (items && items.length > 0) {
        const item = items[0];
        if (item.url) {
          await chrome.bookmarks.remove(itemId);
        } else {
          await chrome.bookmarks.removeTree(itemId);
        }
        successCount++;
      }
    } catch (error) {
      console.error(`Failed to delete item ${itemId}:`, error);
      errorCount++;
    }
  }
  
  if (successCount > 0) {
    showToast(`成功删除 ${successCount} 项${errorCount > 0 ? `，失败 ${errorCount} 项` : ''}`, errorCount > 0 ? 'error' : 'success');
  } else {
    showToast('删除失败', 'error');
  }
  
  selectedItems.clear();
  updateSelectionCount();
  await loadFolderTree();
}

// Setup batch move modal events
function setupBatchMoveModalEvents() {
  const modal = document.getElementById('batch-move-modal');
  const closeBtn = document.getElementById('batch-move-modal-close');
  const cancelBtn = document.getElementById('batch-move-modal-cancel');
  const saveBtn = document.getElementById('batch-move-modal-save');
  
  if (modal.dataset.initialized === 'true') {
    return;
  }
  modal.dataset.initialized = 'true';
  
  const closeModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    modal.classList.remove('active');
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
      closeModal(e);
    }
  });
  
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal(e);
    }
  };
  document.addEventListener('keydown', handleEscapeKey);
  
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await performBatchMove();
    closeModal();
  });
}

// Open batch move modal
function openBatchMoveModal() {
  const modal = document.getElementById('batch-move-modal');
  const select = document.getElementById('target-folder-select');
  const countElement = document.getElementById('move-items-count');
  
  if (!modal || !select || !countElement) {
    console.error('Batch move modal elements not found');
    return;
  }
  
  // Update count
  countElement.textContent = selectedItems.size;
  
  // Populate folder select
  select.innerHTML = '<option value="">-- 选择文件夹 --</option>';
  populateFolderSelect(select, folderTree);
  
  modal.classList.add('active');
}

// Populate folder select recursively
function populateFolderSelect(select, node, depth = 0) {
  if (!node.children) return;
  
  for (const child of node.children) {
    if (!child.url) {
      // It's a folder
      const indent = '　'.repeat(depth);
      const option = document.createElement('option');
      option.value = child.id;
      option.textContent = `${indent}${child.title || '未命名文件夹'}`;
      
      // Disable if this folder is in the selection (can't move into itself)
      if (selectedItems.has(child.id)) {
        option.disabled = true;
        option.textContent += ' (已选中)';
      }
      
      select.appendChild(option);
      
      // Recurse for subfolders
      populateFolderSelect(select, child, depth + 1);
    }
  }
}

// Perform batch move
async function performBatchMove() {
  const select = document.getElementById('target-folder-select');
  const targetFolderId = select.value;
  
  if (!targetFolderId) {
    showToast('请选择目标文件夹', 'error');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const itemId of selectedItems) {
    try {
      // Check if target is a descendant of item being moved
      const items = await new Promise(resolve => chrome.bookmarks.get(itemId, resolve));
      if (items && items.length > 0) {
        const item = items[0];
        
        // For folders, check if target is a descendant
        if (!item.url) {
          const targetIsDescendant = await checkIfDescendant(targetFolderId, itemId);
          if (targetIsDescendant) {
            console.warn(`Cannot move folder ${itemId} into its own descendant ${targetFolderId}`);
            errorCount++;
            continue;
          }
        }
        
        await chrome.bookmarks.move(itemId, { parentId: targetFolderId });
        successCount++;
      }
    } catch (error) {
      console.error(`Failed to move item ${itemId}:`, error);
      errorCount++;
    }
  }
  
  if (successCount > 0) {
    showToast(`成功移动 ${successCount} 项${errorCount > 0 ? `，失败 ${errorCount} 项` : ''}`, errorCount > 0 ? 'error' : 'success');
  } else {
    showToast('移动失败', 'error');
  }
  
  selectedItems.clear();
  updateSelectionCount();
  await loadFolderTree();
}

// Check if targetId is a descendant of parentId
async function checkIfDescendant(targetId, parentId) {
  if (targetId === parentId) return true;
  
  try {
    const target = await new Promise(resolve => chrome.bookmarks.getSubTree(targetId, resolve));
    if (!target || !target[0]) return false;
    
    const parent = await new Promise(resolve => chrome.bookmarks.getSubTree(parentId, resolve));
    if (!parent || !parent[0]) return false;
    
    // Check if target is within parent's subtree
    const checkNode = (node) => {
      if (node.id === targetId) return true;
      if (!node.children) return false;
      return node.children.some(child => checkNode(child));
    };
    
    return checkNode(parent[0]);
  } catch (error) {
    console.error('Error checking descendant:', error);
    return false;
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
