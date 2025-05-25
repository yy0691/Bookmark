// 全局变量
let bookmarkTreeData = null;
let selectedBookmarks = new Set();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化事件监听器
  initializeEventListeners();
  
  // 加载书签树
  await loadBookmarkTree();
  
  // 展开第一级文件夹
  expandFirstLevelFolders();
});

// 初始化事件监听器
function initializeEventListeners() {
  // 工具栏按钮
  document.getElementById('expand-all').addEventListener('click', () => expandAllFolders(true));
  document.getElementById('collapse-all').addEventListener('click', () => expandAllFolders(false));
  document.getElementById('select-all').addEventListener('click', toggleSelectAll);
  document.getElementById('refresh-tree').addEventListener('click', refreshBookmarkManager);
  document.getElementById('create-folder').addEventListener('click', createNewFolder);
  document.getElementById('batch-delete').addEventListener('click', batchDeleteItems);
  document.getElementById('batch-move').addEventListener('click', batchMoveItems);
  document.getElementById('batch-export').addEventListener('click', batchExportItems);
  
  // 侧边栏按钮
  document.getElementById('import-bookmarks').addEventListener('click', importBookmarks);
  document.getElementById('backup-bookmarks').addEventListener('click', backupBookmarks);
  document.getElementById('analyze-page').addEventListener('click', () => {
    chrome.tabs.create({ url: 'analyze.html' });
  });
  
  // 模态框按钮
  document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
  document.getElementById('save-edit').addEventListener('click', saveBookmarkEdit);
  document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
  document.getElementById('close-move-modal').addEventListener('click', closeMoveModal);
  document.getElementById('confirm-move').addEventListener('click', confirmMoveItems);
  document.getElementById('cancel-move').addEventListener('click', closeMoveModal);
}

// 加载书签树
async function loadBookmarkTree() {
  try {
    const tree = await chrome.bookmarks.getTree();
    bookmarkTreeData = tree;
    
    // 分析书签统计
    const stats = analyzeBookmarkTree(tree);
    updateBookmarkStats(stats);
    
    // 渲染书签树
    renderBookmarkTree();
    
    console.log('书签树加载完成:', tree);
  } catch (error) {
    console.error('加载书签树失败:', error);
    showError('加载书签失败，请刷新页面重试');
  }
}

// 分析书签树统计信息
function analyzeBookmarkTree(nodes) {
  const stats = {
    totalBookmarks: 0,
    totalFolders: 0,
    maxDepth: 0,
    bookmarkBar: 0,
    otherBookmarks: 0,
    mobileBookmarks: 0
  };

  function analyzeNode(node, depth = 0) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (node.url) {
      stats.totalBookmarks++;
      
      // 根据父节点统计分布
      if (node.parentId === '1') {
        stats.bookmarkBar++;
      } else if (node.parentId === '2') {
        stats.otherBookmarks++;
      } else if (node.parentId === '3') {
        stats.mobileBookmarks++;
      }
    } else if (node.children) {
      if (node.id !== '0') {
        stats.totalFolders++;
      }
      
      node.children.forEach(child => analyzeNode(child, depth + 1));
    }
  }

  // 从根节点开始遍历
  if (nodes && nodes.length > 0 && nodes[0].children) {
    nodes[0].children.forEach(child => analyzeNode(child, 0));
  }

  return stats;
}

// 更新书签统计信息
function updateBookmarkStats(stats) {
  document.getElementById('total-bookmarks').textContent = stats.totalBookmarks;
  document.getElementById('total-folders').textContent = stats.totalFolders;
  document.getElementById('max-depth').textContent = stats.maxDepth;
  document.getElementById('bookmarks-bar').textContent = stats.bookmarkBar;
  document.getElementById('other-bookmarks').textContent = stats.otherBookmarks;
  document.getElementById('mobile-bookmarks').textContent = stats.mobileBookmarks;
}

// 渲染书签树
function renderBookmarkTree() {
  const treeContainer = document.getElementById('bookmark-tree');
  
  if (!bookmarkTreeData || !bookmarkTreeData[0] || !bookmarkTreeData[0].children) {
    treeContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6e6e73;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <div>未找到书签数据</div>
      </div>
    `;
    return;
  }

  treeContainer.innerHTML = '';
  
  // 渲染顶级文件夹
  bookmarkTreeData[0].children.forEach(node => {
    const nodeElement = createTreeNode(node, 0);
    treeContainer.appendChild(nodeElement);
  });
}

// 创建树节点
function createTreeNode(node, level) {
  const nodeElement = document.createElement('div');
  nodeElement.className = 'tree-node';
  nodeElement.style.marginLeft = `${level * 12}px`;
  nodeElement.dataset.nodeId = node.id;

  const nodeContent = document.createElement('div');
  nodeContent.className = 'tree-node-content';

  // 展开/折叠按钮（仅文件夹）
  if (!node.url && node.children) {
    const expandButton = document.createElement('button');
    expandButton.className = 'tree-expand-btn';
    expandButton.textContent = '▶';
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNodeExpansion(nodeElement, expandButton);
    });
    nodeContent.appendChild(expandButton);
  } else {
    // 书签项的占位符
    const spacer = document.createElement('span');
    spacer.className = 'tree-spacer';
    spacer.textContent = '  ';
    nodeContent.appendChild(spacer);
  }

  // 复选框
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tree-checkbox';
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    toggleBookmarkSelection(node.id, checkbox.checked);
  });
  nodeContent.appendChild(checkbox);

  // 图标
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = node.url ? '🔖' : '📁';
  nodeContent.appendChild(icon);

  // 标题容器
  const titleContainer = document.createElement('div');
  titleContainer.className = 'tree-title-container';

  const title = document.createElement('span');
  title.className = 'tree-title';
  title.textContent = node.title || '未命名';
  title.title = node.url || node.title;
  
  // 双击编辑
  title.addEventListener('dblclick', () => editBookmarkItem(node));
  
  // 右键菜单
  title.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, node);
  });

  titleContainer.appendChild(title);

  // 文件夹书签数量标签
  if (!node.url && node.children) {
    const bookmarkCount = countBookmarksInFolder(node);
    if (bookmarkCount > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'folder-count';
      countSpan.textContent = bookmarkCount;
      countSpan.title = `包含 ${bookmarkCount} 个书签`;
      titleContainer.appendChild(countSpan);
    }
  }

  nodeContent.appendChild(titleContainer);
  nodeElement.appendChild(nodeContent);

  // 子节点容器
  if (!node.url && node.children && node.children.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children hidden';
    
    node.children.forEach(child => {
      const childElement = createTreeNode(child, level + 1);
      childrenContainer.appendChild(childElement);
    });
    
    nodeElement.appendChild(childrenContainer);
  }

  return nodeElement;
}

// 统计文件夹中的书签数量
function countBookmarksInFolder(folderNode) {
  function countRecursive(node) {
    let count = 0;
    if (node.children) {
      node.children.forEach(child => {
        if (child.url) {
          count++;
        } else if (child.children) {
          count += countRecursive(child);
        }
      });
    }
    return count;
  }
  
  return countRecursive(folderNode);
}

// 切换节点展开/折叠
function toggleNodeExpansion(nodeElement, expandButton) {
  const childrenContainer = nodeElement.querySelector('.tree-children');
  if (childrenContainer) {
    const isExpanded = !childrenContainer.classList.contains('hidden');
    if (isExpanded) {
      childrenContainer.classList.add('hidden');
      expandButton.textContent = '▶';
    } else {
      childrenContainer.classList.remove('hidden');
      expandButton.textContent = '▼';
    }
  }
}

// 展开/折叠所有文件夹
function expandAllFolders(expand) {
  const allExpandButtons = document.querySelectorAll('.tree-expand-btn');
  const allChildrenContainers = document.querySelectorAll('.tree-children');
  
  allChildrenContainers.forEach(container => {
    if (expand) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  });
  
  allExpandButtons.forEach(button => {
    button.textContent = expand ? '▼' : '▶';
  });
}

// 展开第一级文件夹
function expandFirstLevelFolders() {
  const allTreeNodes = document.querySelectorAll('.tree-node');
  
  allTreeNodes.forEach(node => {
    const marginLeft = parseInt(node.style.marginLeft) || 0;
    if (marginLeft === 0) {
      const expandButton = node.querySelector('.tree-expand-btn');
      const childrenContainer = node.querySelector('.tree-children');
      
      if (expandButton && childrenContainer && childrenContainer.classList.contains('hidden')) {
        childrenContainer.classList.remove('hidden');
        expandButton.textContent = '▼';
      }
    }
  });
}

// 切换书签选择
function toggleBookmarkSelection(nodeId, selected) {
  if (selected) {
    selectedBookmarks.add(nodeId);
  } else {
    selectedBookmarks.delete(nodeId);
  }
  
  updateBatchActionButtons();
}

// 全选/取消全选
function toggleSelectAll() {
  const allCheckboxes = document.querySelectorAll('.tree-checkbox');
  const isAllSelected = selectedBookmarks.size > 0;
  
  if (isAllSelected) {
    // 取消全选
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    selectedBookmarks.clear();
  } else {
    // 全选
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
      const nodeId = checkbox.closest('.tree-node').dataset.nodeId;
      selectedBookmarks.add(nodeId);
    });
  }
  
  updateBatchActionButtons();
}

// 更新批量操作按钮状态
function updateBatchActionButtons() {
  const hasSelection = selectedBookmarks.size > 0;
  
  document.getElementById('batch-delete').disabled = !hasSelection;
  document.getElementById('batch-move').disabled = !hasSelection;
  document.getElementById('batch-export').disabled = !hasSelection;
  
  // 更新全选按钮文本
  const selectAllBtn = document.getElementById('select-all');
  if (hasSelection) {
    selectAllBtn.innerHTML = '<span>☐</span> 取消全选';
  } else {
    selectAllBtn.innerHTML = '<span>☑️</span> 全选';
  }
}

// 编辑书签项
function editBookmarkItem(node) {
  document.getElementById('edit-title').value = node.title || '';
  document.getElementById('edit-url').value = node.url || '';
  
  // 加载父文件夹选项
  loadParentFolderOptions(node.parentId);
  
  // 显示编辑模态框
  document.getElementById('edit-modal').style.display = 'block';
  
  // 保存当前编辑的节点
  document.getElementById('edit-modal').dataset.nodeId = node.id;
}

// 加载父文件夹选项
function loadParentFolderOptions(currentParentId) {
  const select = document.getElementById('edit-parent');
  select.innerHTML = '';
  
  function addFolderOptions(nodes, level = 0) {
    nodes.forEach(node => {
      if (!node.url && node.children) {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = '  '.repeat(level) + (node.title || '未命名文件夹');
        if (node.id === currentParentId) {
          option.selected = true;
        }
        select.appendChild(option);
        
        if (node.children) {
          addFolderOptions(node.children, level + 1);
        }
      }
    });
  }
  
  if (bookmarkTreeData && bookmarkTreeData[0] && bookmarkTreeData[0].children) {
    addFolderOptions(bookmarkTreeData[0].children);
  }
}

// 保存书签编辑
async function saveBookmarkEdit() {
  const nodeId = document.getElementById('edit-modal').dataset.nodeId;
  const title = document.getElementById('edit-title').value.trim();
  const url = document.getElementById('edit-url').value.trim();
  const parentId = document.getElementById('edit-parent').value;
  
  if (!title) {
    showError('标题不能为空');
    return;
  }
  
  try {
    // 更新书签
    await chrome.bookmarks.update(nodeId, {
      title: title,
      url: url || undefined
    });
    
    // 如果需要移动到不同的父文件夹
    const currentNode = findNodeById(nodeId);
    if (currentNode && currentNode.parentId !== parentId) {
      await chrome.bookmarks.move(nodeId, {
        parentId: parentId
      });
    }
    
    closeEditModal();
    await refreshBookmarkManager();
    showSuccess('书签已更新');
  } catch (error) {
    console.error('保存书签失败:', error);
    showError('保存失败: ' + error.message);
  }
}

// 关闭编辑模态框
function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// 创建新文件夹
async function createNewFolder() {
  const folderName = prompt('请输入文件夹名称:');
  if (!folderName || !folderName.trim()) {
    return;
  }
  
  try {
    // 默认创建在"其他书签"文件夹下（通常ID为2）
    await chrome.bookmarks.create({
      parentId: '2',
      title: folderName.trim()
    });
    
    await refreshBookmarkManager();
    showSuccess('文件夹已创建');
  } catch (error) {
    console.error('创建文件夹失败:', error);
    showError('创建失败: ' + error.message);
  }
}

// 批量删除
async function batchDeleteItems() {
  if (selectedBookmarks.size === 0) return;
  
  const confirmed = confirm(`确定要删除选中的 ${selectedBookmarks.size} 个项目吗？此操作不可撤销。`);
  if (!confirmed) return;
  
  try {
    const deletePromises = Array.from(selectedBookmarks).map(nodeId => 
      chrome.bookmarks.removeTree(nodeId)
    );
    
    await Promise.all(deletePromises);
    
    selectedBookmarks.clear();
    await refreshBookmarkManager();
    showSuccess('选中项目已删除');
  } catch (error) {
    console.error('批量删除失败:', error);
    showError('删除失败: ' + error.message);
  }
}

// 批量移动
function batchMoveItems() {
  if (selectedBookmarks.size === 0) return;
  
  // 加载目标文件夹选项
  loadMoveTargetFolders();
  
  // 显示移动预览
  const preview = document.getElementById('move-preview');
  preview.innerHTML = `<p>将移动 ${selectedBookmarks.size} 个项目</p>`;
  
  // 显示移动模态框
  document.getElementById('move-modal').style.display = 'block';
}

// 加载移动目标文件夹
function loadMoveTargetFolders() {
  const select = document.getElementById('move-target');
  select.innerHTML = '';
  
  function addFolderOptions(nodes, level = 0) {
    nodes.forEach(node => {
      if (!node.url && node.children) {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = '  '.repeat(level) + (node.title || '未命名文件夹');
        select.appendChild(option);
        
        if (node.children) {
          addFolderOptions(node.children, level + 1);
        }
      }
    });
  }
  
  if (bookmarkTreeData && bookmarkTreeData[0] && bookmarkTreeData[0].children) {
    addFolderOptions(bookmarkTreeData[0].children);
  }
}

// 确认移动
async function confirmMoveItems() {
  const targetFolderId = document.getElementById('move-target').value;
  if (!targetFolderId) {
    showError('请选择目标文件夹');
    return;
  }
  
  try {
    const movePromises = Array.from(selectedBookmarks).map(nodeId =>
      chrome.bookmarks.move(nodeId, { parentId: targetFolderId })
    );
    
    await Promise.all(movePromises);
    
    selectedBookmarks.clear();
    closeMoveModal();
    await refreshBookmarkManager();
    showSuccess('项目已移动');
  } catch (error) {
    console.error('批量移动失败:', error);
    showError('移动失败: ' + error.message);
  }
}

// 关闭移动模态框
function closeMoveModal() {
  document.getElementById('move-modal').style.display = 'none';
}

// 批量导出
function batchExportItems() {
  if (selectedBookmarks.size === 0) return;
  
  const selectedNodes = Array.from(selectedBookmarks).map(nodeId => findNodeById(nodeId)).filter(node => node);
  
  const exportData = {
    exportDate: new Date().toISOString(),
    bookmarks: selectedNodes
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showSuccess('书签已导出');
}

// 导入书签
function importBookmarks() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.html';
  input.addEventListener('change', handleFileImport);
  input.click();
}

// 处理文件导入
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const content = await readFileContent(file);
    
    if (file.name.endsWith('.json')) {
      await importJsonBookmarks(content);
    } else if (file.name.endsWith('.html')) {
      await importHtmlBookmarks(content);
    } else {
      showError('不支持的文件格式');
    }
  } catch (error) {
    console.error('导入失败:', error);
    showError('导入失败: ' + error.message);
  }
}

// 读取文件内容
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 导入JSON书签
async function importJsonBookmarks(jsonContent) {
  try {
    const data = JSON.parse(jsonContent);
    const bookmarks = data.bookmarks || data;
    
    // 在"其他书签"下创建导入文件夹
    const importFolder = await chrome.bookmarks.create({
      parentId: '2',
      title: `导入的书签 - ${new Date().toLocaleDateString()}`
    });
    
    for (const bookmark of bookmarks) {
      await chrome.bookmarks.create({
        parentId: importFolder.id,
        title: bookmark.title,
        url: bookmark.url
      });
    }
    
    await refreshBookmarkManager();
    showSuccess(`成功导入 ${bookmarks.length} 个书签`);
  } catch (error) {
    throw new Error('JSON格式无效');
  }
}

// 导入HTML书签
async function importHtmlBookmarks(htmlContent) {
  // 简单的HTML书签解析（这里可以扩展更复杂的解析）
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const links = doc.querySelectorAll('a[href]');
  
  const importFolder = await chrome.bookmarks.create({
    parentId: '2',
    title: `导入的书签 - ${new Date().toLocaleDateString()}`
  });
  
  for (const link of links) {
    await chrome.bookmarks.create({
      parentId: importFolder.id,
      title: link.textContent || link.href,
      url: link.href
    });
  }
  
  await refreshBookmarkManager();
  showSuccess(`成功导入 ${links.length} 个书签`);
}

// 备份书签
async function backupBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const backupData = {
      backupDate: new Date().toISOString(),
      version: '1.0',
      bookmarks: tree
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showSuccess('书签备份已下载');
  } catch (error) {
    console.error('备份失败:', error);
    showError('备份失败: ' + error.message);
  }
}

// 刷新书签管理器
async function refreshBookmarkManager() {
  selectedBookmarks.clear();
  await loadBookmarkTree();
  expandFirstLevelFolders();
  updateBatchActionButtons();
}

// 根据ID查找节点
function findNodeById(nodeId) {
  function searchNode(nodes) {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = searchNode(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  if (bookmarkTreeData && bookmarkTreeData[0]) {
    return searchNode([bookmarkTreeData[0]]);
  }
  return null;
}

// 显示右键菜单
function showContextMenu(event, node) {
  // 这里可以实现右键菜单功能
  console.log('右键菜单:', node);
}

// 工具函数
function showSuccess(message) {
  // 简单的成功提示
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #30d158;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showError(message) {
  // 简单的错误提示
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff3b30;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
} 