/**
 * 书签管理器模块 - 处理书签树形结构、编辑、拖拽等管理功能
 */

export class BookmarkManager {
  constructor() {
    this.logCallback = null;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;
    this.bookmarks = [];
    this.folders = [];
    this.currentFolder = null;
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  /**
   * 初始化书签管理器
   */
  async initialize() {
    try {
      this.log('正在初始化书签管理器...', 'info');
      
      // 初始化完成
      this.log('书签管理器初始化完成', 'success');
      return true;
    } catch (error) {
      this.log(`书签管理器初始化失败: ${error.message}`, 'error');
      return false;
    }
  }

  log(message, type = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type);
    }
  }

  // 获取书签树
  async getBookmarkTree() {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        this.bookmarkTree = bookmarkTreeNodes;
        resolve(bookmarkTreeNodes);
      });
    });
  }

  // 渲染书签树
  renderBookmarkTree(container, tree = null) {
    if (!container) {
      this.log('书签树容器未找到', 'error');
      return;
    }

    if (!tree) {
      tree = this.bookmarkTree;
    }

    container.innerHTML = '';
    
    const treeElement = document.createElement('div');
    treeElement.className = 'bookmark-tree';
    
    if (tree && tree.length > 0) {
      tree.forEach(rootNode => {
        const nodeElement = this.createTreeNode(rootNode);
        treeElement.appendChild(nodeElement);
      });
    }
    
    container.appendChild(treeElement);
    this.attachTreeEvents(treeElement);
  }

  // 创建树节点
  createTreeNode(node, level = 0) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.dataset.nodeId = node.id;
    nodeDiv.dataset.level = level;
    
    const indent = '  '.repeat(level);
    const hasChildren = node.children && node.children.length > 0;
    const isFolder = !node.url;
    
    // 节点内容
    const nodeContent = document.createElement('div');
    nodeContent.className = 'node-content';
    nodeContent.draggable = true;
    
    // 展开/折叠图标
    const expandIcon = document.createElement('span');
    expandIcon.className = 'expand-icon';
    expandIcon.innerHTML = hasChildren ? '▶' : '&nbsp;&nbsp;';
    expandIcon.style.cursor = hasChildren ? 'pointer' : 'default';
    
    // 节点图标
    const nodeIcon = document.createElement('span');
    nodeIcon.className = 'node-icon';
    if (isFolder) {
      nodeIcon.innerHTML = '📁';
    } else {
      nodeIcon.innerHTML = '🔖';
    }
    
    // 节点标题
    const nodeTitle = document.createElement('span');
    nodeTitle.className = 'node-title';
    nodeTitle.textContent = node.title || '未命名';
    nodeTitle.contentEditable = false;
    
    // 节点操作按钮
    const nodeActions = document.createElement('span');
    nodeActions.className = 'node-actions';
    nodeActions.innerHTML = `
      <button class="btn-edit" title="编辑">✏️</button>
      <button class="btn-delete" title="删除">🗑️</button>
      ${isFolder ? '<button class="btn-add" title="添加">➕</button>' : ''}
    `;
    
    nodeContent.appendChild(document.createTextNode(indent));
    nodeContent.appendChild(expandIcon);
    nodeContent.appendChild(nodeIcon);
    nodeContent.appendChild(nodeTitle);
    nodeContent.appendChild(nodeActions);
    
    nodeDiv.appendChild(nodeContent);
    
    // 子节点容器
    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'children-container';
      childrenContainer.style.display = 'none';
      
      node.children.forEach(child => {
        const childNode = this.createTreeNode(child, level + 1);
        childrenContainer.appendChild(childNode);
      });
      
      nodeDiv.appendChild(childrenContainer);
    }
    
    return nodeDiv;
  }

  // 附加树事件
  attachTreeEvents(treeElement) {
    // 展开/折叠事件
    treeElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('expand-icon')) {
        this.toggleNode(e.target.closest('.tree-node'));
      }
    });
    
    // 选择事件
    treeElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('node-content') || 
          e.target.classList.contains('node-title')) {
        this.selectNode(e.target.closest('.tree-node'), e.ctrlKey);
      }
    });
    
    // 编辑事件
    treeElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit')) {
        e.stopPropagation();
        this.editNode(e.target.closest('.tree-node'));
      }
    });
    
    // 删除事件
    treeElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        e.stopPropagation();
        this.deleteNode(e.target.closest('.tree-node'));
      }
    });
    
    // 添加事件
    treeElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add')) {
        e.stopPropagation();
        this.addNode(e.target.closest('.tree-node'));
      }
    });
    
    // 拖拽事件
    this.attachDragEvents(treeElement);
  }

  // 切换节点展开/折叠
  toggleNode(nodeElement) {
    const childrenContainer = nodeElement.querySelector('.children-container');
    const expandIcon = nodeElement.querySelector('.expand-icon');
    
    if (childrenContainer) {
      const isExpanded = childrenContainer.style.display !== 'none';
      childrenContainer.style.display = isExpanded ? 'none' : 'block';
      expandIcon.innerHTML = isExpanded ? '▶' : '▼';
    }
  }

  // 选择节点
  selectNode(nodeElement, multiSelect = false) {
    const nodeId = nodeElement.dataset.nodeId;
    
    if (!multiSelect) {
      // 清除之前的选择
      this.selectedNodes.clear();
      document.querySelectorAll('.tree-node.selected').forEach(node => {
        node.classList.remove('selected');
      });
    }
    
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);
      nodeElement.classList.remove('selected');
    } else {
      this.selectedNodes.add(nodeId);
      nodeElement.classList.add('selected');
    }
    
    this.log(`已选择 ${this.selectedNodes.size} 个节点`, 'info');
  }

  // 编辑节点
  editNode(nodeElement) {
    const nodeId = nodeElement.dataset.nodeId;
    const titleElement = nodeElement.querySelector('.node-title');
    const currentTitle = titleElement.textContent;
    
    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'node-edit-input';
    input.style.cssText = `
      border: 1px solid #007bff;
      padding: 2px 4px;
      font-size: inherit;
      font-family: inherit;
    `;
    
    // 替换标题元素
    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement.nextSibling);
    input.focus();
    input.select();
    
    // 保存编辑
    const saveEdit = async () => {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== currentTitle) {
        try {
          await this.updateBookmark(nodeId, { title: newTitle });
          titleElement.textContent = newTitle;
          this.log(`书签标题已更新: "${currentTitle}" → "${newTitle}"`, 'success');
        } catch (error) {
          this.log(`更新书签标题失败: ${error.message}`, 'error');
        }
      }
      
      // 恢复显示
      titleElement.style.display = '';
      input.remove();
    };
    
    // 取消编辑
    const cancelEdit = () => {
      titleElement.style.display = '';
      input.remove();
    };
    
    // 事件监听
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });
  }

  // 删除节点
  async deleteNode(nodeElement) {
    const nodeId = nodeElement.dataset.nodeId;
    const titleElement = nodeElement.querySelector('.node-title');
    const title = titleElement.textContent;
    
    if (confirm(`确定要删除 "${title}" 吗？`)) {
      try {
        await this.removeBookmark(nodeId);
        nodeElement.remove();
        this.selectedNodes.delete(nodeId);
        this.log(`已删除书签: "${title}"`, 'success');
      } catch (error) {
        this.log(`删除书签失败: ${error.message}`, 'error');
      }
    }
  }

  // 添加节点
  async addNode(nodeElement) {
    const parentId = nodeElement.dataset.nodeId;
    const title = prompt('请输入新书签/文件夹的名称:');
    
    if (title) {
      const isFolder = confirm('创建文件夹？点击"确定"创建文件夹，点击"取消"创建书签');
      
      try {
        let newNode;
        if (isFolder) {
          newNode = await this.createBookmarkFolder(title, parentId);
        } else {
          const url = prompt('请输入书签URL:');
          if (url) {
            newNode = await this.createBookmark(title, url, parentId);
          } else {
            return;
          }
        }
        
        // 刷新树显示
        await this.refreshTree();
        this.log(`已添加${isFolder ? '文件夹' : '书签'}: "${title}"`, 'success');
      } catch (error) {
        this.log(`添加失败: ${error.message}`, 'error');
      }
    }
  }

  // 附加拖拽事件
  attachDragEvents(treeElement) {
    treeElement.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('node-content')) {
        this.draggedNode = e.target.closest('.tree-node');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedNode.dataset.nodeId);
        this.draggedNode.style.opacity = '0.5';
      }
    });
    
    treeElement.addEventListener('dragend', (e) => {
      if (this.draggedNode) {
        this.draggedNode.style.opacity = '';
        this.draggedNode = null;
      }
    });
    
    treeElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const targetNode = e.target.closest('.tree-node');
      if (targetNode && targetNode !== this.draggedNode) {
        // 添加拖拽悬停效果
        document.querySelectorAll('.drag-over').forEach(node => {
          node.classList.remove('drag-over');
        });
        targetNode.classList.add('drag-over');
      }
    });
    
    treeElement.addEventListener('dragleave', (e) => {
      const targetNode = e.target.closest('.tree-node');
      if (targetNode) {
        targetNode.classList.remove('drag-over');
      }
    });
    
    treeElement.addEventListener('drop', async (e) => {
      e.preventDefault();
      
      const targetNode = e.target.closest('.tree-node');
      if (targetNode) {
        targetNode.classList.remove('drag-over');
        
        if (this.draggedNode && targetNode !== this.draggedNode) {
          const draggedId = this.draggedNode.dataset.nodeId;
          const targetId = targetNode.dataset.nodeId;
          
          try {
            await this.moveBookmark(draggedId, targetId);
            await this.refreshTree();
            this.log(`书签已移动`, 'success');
          } catch (error) {
            this.log(`移动书签失败: ${error.message}`, 'error');
          }
        }
      }
    });
  }

  // 刷新树显示
  async refreshTree() {
    await this.getBookmarkTree();
    const container = document.querySelector('.bookmark-tree')?.parentElement;
    if (container) {
      this.renderBookmarkTree(container);
    }
  }

  // 更新书签
  async updateBookmark(id, changes) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.update(id, changes, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 删除书签
  async removeBookmark(id) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.removeTree(id, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 创建书签文件夹
  async createBookmarkFolder(title, parentId) {
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

  // 移动书签
  async moveBookmark(id, newParentId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.move(id, { parentId: newParentId }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 批量删除选中的节点
  async deleteSelectedNodes() {
    if (this.selectedNodes.size === 0) {
      this.log('没有选中的节点', 'warning');
      return;
    }
    
    const count = this.selectedNodes.size;
    if (confirm(`确定要删除选中的 ${count} 个项目吗？`)) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const nodeId of this.selectedNodes) {
        try {
          await this.removeBookmark(nodeId);
          successCount++;
        } catch (error) {
          errorCount++;
          this.log(`删除节点 ${nodeId} 失败: ${error.message}`, 'error');
        }
      }
      
      this.selectedNodes.clear();
      await this.refreshTree();
      
      this.log(`批量删除完成: 成功 ${successCount} 个，失败 ${errorCount} 个`, 
               errorCount > 0 ? 'warning' : 'success');
    }
  }

  // 批量移动选中的节点
  async moveSelectedNodes(targetParentId) {
    if (this.selectedNodes.size === 0) {
      this.log('没有选中的节点', 'warning');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const nodeId of this.selectedNodes) {
      try {
        await this.moveBookmark(nodeId, targetParentId);
        successCount++;
      } catch (error) {
        errorCount++;
        this.log(`移动节点 ${nodeId} 失败: ${error.message}`, 'error');
      }
    }
    
    this.selectedNodes.clear();
    await this.refreshTree();
    
    this.log(`批量移动完成: 成功 ${successCount} 个，失败 ${errorCount} 个`, 
             errorCount > 0 ? 'warning' : 'success');
  }

  // 搜索节点
  searchNodes(query) {
    const nodes = document.querySelectorAll('.tree-node');
    const results = [];
    
    nodes.forEach(node => {
      const title = node.querySelector('.node-title').textContent.toLowerCase();
      if (title.includes(query.toLowerCase())) {
        results.push(node);
        // 高亮匹配的节点
        node.classList.add('search-match');
        // 展开父节点
        this.expandToNode(node);
      } else {
        node.classList.remove('search-match');
      }
    });
    
    this.log(`搜索 "${query}" 找到 ${results.length} 个匹配项`, 'info');
    return results;
  }

  // 展开到指定节点
  expandToNode(targetNode) {
    let parent = targetNode.parentElement;
    while (parent) {
      if (parent.classList.contains('children-container')) {
        parent.style.display = 'block';
        const parentNode = parent.previousElementSibling;
        if (parentNode) {
          const expandIcon = parentNode.querySelector('.expand-icon');
          if (expandIcon) {
            expandIcon.innerHTML = '▼';
          }
        }
      }
      parent = parent.parentElement;
    }
  }

  // 清除搜索高亮
  clearSearchHighlight() {
    document.querySelectorAll('.search-match').forEach(node => {
      node.classList.remove('search-match');
    });
  }
}
