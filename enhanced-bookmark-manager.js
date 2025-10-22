/**
 * 增强型书签管理器
 * 提供完整的书签管理功能，包括拖拽、批量操作、搜索等
 */

// 导入必要的模块
import { BookmarkService } from './modules/bookmarkService.js';
import { ImportExportService } from './modules/importExportService.js';
import { Utils } from './modules/utils.js';

class EnhancedBookmarkManager {
  constructor() {
    this.bookmarkService = new BookmarkService();
    this.importExportService = new ImportExportService();
    
    this.state = {
      bookmarkTree: null,
      currentFolderId: null,
      currentFolderPath: [],
      selectedItems: new Set(),
      draggedItem: null,
      searchQuery: '',
      isLoading: false
    };

    // 绑定上下文
    this.handleTreeItemClick = this.handleTreeItemClick.bind(this);
    this.handleBookmarkItemClick = this.handleBookmarkItemClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  // 初始化管理器
  async initialize() {
    try {
      this.showLoading(true);
      
      // 设置日志回调
      this.bookmarkService.setLogCallback((message, type) => {
        console.log(`[${type}] ${message}`);
      });
      
      this.importExportService.setLogCallback((message, type) => {
        console.log(`[${type}] ${message}`);
      });

      // 加载书签树
      await this.loadBookmarkTree();
      
      // 初始化事件监听器
      this.initializeEventListeners();
      
      // 显示根目录的书签
      await this.showFolderContents(null);
      
      this.showLoading(false);
      console.log('书签管理器初始化完成');
      
    } catch (error) {
      this.showError('初始化失败', error.message);
      this.showLoading(false);
    }
  }

  // 加载书签树
  async loadBookmarkTree() {
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        return new Promise((resolve) => {
          chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            this.state.bookmarkTree = bookmarkTreeNodes[0];
            this.renderBookmarkTree();
            resolve();
          });
        });
      } else {
        // 浏览器测试模式
        this.state.bookmarkTree = this.generateMockBookmarkTree();
        this.renderBookmarkTree();
      }
    } catch (error) {
      throw new Error(`加载书签树失败: ${error.message}`);
    }
  }

  // 渲染书签树
  renderBookmarkTree() {
    const treeContainer = document.getElementById('bookmark-tree');
    if (!treeContainer) return;

    treeContainer.innerHTML = '';
    
    if (this.state.bookmarkTree && this.state.bookmarkTree.children) {
      this.state.bookmarkTree.children.forEach(node => {
        const nodeElement = this.createTreeNodeElement(node);
        treeContainer.appendChild(nodeElement);
      });
    }
  }

  // 创建树节点元素
  createTreeNodeElement(node, level = 0) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.dataset.nodeId = node.id;
    nodeDiv.dataset.level = level;

    const hasChildren = node.children && node.children.length > 0;
    const childBookmarkCount = this.getBookmarkCount(node);

    const itemDiv = document.createElement('div');
    itemDiv.className = 'tree-item';
    itemDiv.style.paddingLeft = `${level * 16 + 12}px`;
    
    // 展开/折叠按钮
    const expandDiv = document.createElement('div');
    expandDiv.className = 'tree-expand';
    expandDiv.innerHTML = hasChildren ? '▶' : '';
    if (hasChildren) {
      expandDiv.onclick = (e) => {
        e.stopPropagation();
        this.toggleTreeNode(node.id);
      };
    }

    // 图标
    const iconDiv = document.createElement('div');
    iconDiv.className = 'tree-icon';
    iconDiv.innerHTML = node.children ? '📁' : '🔖';

    // 标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'tree-title';
    titleDiv.textContent = node.title || '未命名';

    // 书签数量
    const countDiv = document.createElement('div');
    countDiv.className = 'tree-count';
    countDiv.textContent = childBookmarkCount;

    itemDiv.appendChild(expandDiv);
    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(titleDiv);
    if (childBookmarkCount > 0) {
      itemDiv.appendChild(countDiv);
    }

    // 添加事件监听器
    itemDiv.onclick = () => this.handleTreeItemClick(node);
    itemDiv.oncontextmenu = (e) => this.handleContextMenu(e, node);
    
    // 拖拽支持
    if (node.children) {
      itemDiv.draggable = false; // 文件夹不允许拖拽
      itemDiv.ondragover = this.handleDragOver;
      itemDiv.ondrop = (e) => this.handleDrop(e, node);
    }

    nodeDiv.appendChild(itemDiv);

    // 子节点容器
    if (hasChildren) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'tree-children';
      childrenDiv.id = `children-${node.id}`;
      
      node.children.forEach(child => {
        const childElement = this.createTreeNodeElement(child, level + 1);
        childrenDiv.appendChild(childElement);
      });
      
      nodeDiv.appendChild(childrenDiv);
    }

    return nodeDiv;
  }

  // 切换树节点展开/折叠
  toggleTreeNode(nodeId) {
    const childrenContainer = document.getElementById(`children-${nodeId}`);
    const expandButton = document.querySelector(`[data-node-id="${nodeId}"] .tree-expand`);
    
    if (childrenContainer && expandButton) {
      const isExpanded = childrenContainer.classList.contains('expanded');
      
      if (isExpanded) {
        childrenContainer.classList.remove('expanded');
        expandButton.classList.remove('expanded');
        expandButton.innerHTML = '▶';
      } else {
        childrenContainer.classList.add('expanded');
        expandButton.classList.add('expanded');
        expandButton.innerHTML = '▼';
      }
    }
  }

  // 显示文件夹内容
  async showFolderContents(folderId) {
    try {
      this.state.currentFolderId = folderId;
      this.updateFolderPath(folderId);
      
      let bookmarks = [];
      
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        if (folderId) {
          bookmarks = await new Promise((resolve) => {
            chrome.bookmarks.getChildren(folderId, resolve);
          });
        } else {
          // 显示所有书签
          bookmarks = await this.bookmarkService.getAllBookmarksFlat();
        }
      } else {
        // 浏览器测试模式
        bookmarks = this.generateMockBookmarks(folderId);
      }

      this.renderBookmarkList(bookmarks);
      this.updateTreeSelection(folderId);
      
    } catch (error) {
      this.showError('加载文件夹内容失败', error.message);
    }
  }

  // 渲染书签列表
  renderBookmarkList(bookmarks) {
    const listContainer = document.getElementById('bookmark-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // 应用搜索筛选
    const filteredBookmarks = this.state.searchQuery 
      ? bookmarks.filter(bookmark => 
          bookmark.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
          (bookmark.url && bookmark.url.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
        )
      : bookmarks;

    if (filteredBookmarks.length === 0) {
      this.showEmptyState(listContainer);
      return;
    }

    filteredBookmarks.forEach(bookmark => {
      const bookmarkElement = this.createBookmarkElement(bookmark);
      listContainer.appendChild(bookmarkElement);
    });
  }

  // 创建书签元素
  createBookmarkElement(bookmark) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'bookmark-item';
    itemDiv.dataset.bookmarkId = bookmark.id;
    itemDiv.dataset.itemType = bookmark.children ? 'folder' : 'bookmark';

    // 网站图标
    const faviconDiv = document.createElement('div');
    faviconDiv.className = 'bookmark-favicon';
    if (bookmark.url) {
      const faviconUrl = `chrome://favicon/${bookmark.url}`;
      faviconDiv.style.backgroundImage = `url(${faviconUrl})`;
      faviconDiv.style.backgroundSize = 'cover';
    } else {
      faviconDiv.innerHTML = '📁';
      faviconDiv.style.display = 'flex';
      faviconDiv.style.alignItems = 'center';
      faviconDiv.style.justifyContent = 'center';
    }

    // 书签信息
    const infoDiv = document.createElement('div');
    infoDiv.className = 'bookmark-info';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'bookmark-title';
    titleDiv.textContent = bookmark.title || '未命名';

    const urlDiv = document.createElement('div');
    urlDiv.className = 'bookmark-url';
    urlDiv.textContent = bookmark.url || `${this.getBookmarkCount(bookmark)} 个项目`;

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(urlDiv);

    // 操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'bookmark-actions';

    if (bookmark.url) {
      const openBtn = document.createElement('button');
      openBtn.className = 'btn btn-small';
      openBtn.textContent = '打开';
      openBtn.onclick = (e) => {
        e.stopPropagation();
        this.openBookmark(bookmark);
      };
      actionsDiv.appendChild(openBtn);
    }

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-small';
    editBtn.textContent = '编辑';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      this.editBookmark(bookmark);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-small btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteBookmark(bookmark);
    };

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    itemDiv.appendChild(faviconDiv);
    itemDiv.appendChild(infoDiv);
    itemDiv.appendChild(actionsDiv);

    // 事件监听器
    itemDiv.onclick = () => this.handleBookmarkItemClick(bookmark);
    itemDiv.oncontextmenu = (e) => this.handleContextMenu(e, bookmark);
    
    // 拖拽支持
    if (bookmark.url) {
      itemDiv.draggable = true;
      itemDiv.ondragstart = (e) => this.handleDragStart(e, bookmark);
    }

    return itemDiv;
  }

  // 初始化事件监听器
  initializeEventListeners() {
    // 搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.oninput = Utils.debounce(this.handleSearch, 300);
    }

    // 全局事件
    document.addEventListener('click', (e) => {
      this.hideContextMenu();
      if (!e.target.closest('.bookmark-item')) {
        this.clearSelection();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
        this.clearSelection();
      }
      if (e.key === 'Delete' && this.state.selectedItems.size > 0) {
        this.deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        this.selectAll();
      }
    });

    // 绑定全局函数
    this.bindGlobalFunctions();
  }

  // 绑定全局函数
  bindGlobalFunctions() {
    window.createNewFolder = this.createNewFolder.bind(this);
    window.addNewBookmark = this.addNewBookmark.bind(this);
    window.refreshBookmarks = this.refreshBookmarks.bind(this);
    window.showImportModal = this.showImportModal.bind(this);
    window.exportBookmarks = this.exportBookmarks.bind(this);
    window.openSettings = this.openSettings.bind(this);
    window.selectAll = this.selectAll.bind(this);
    window.clearSelection = this.clearSelection.bind(this);
    window.moveSelected = this.moveSelected.bind(this);
    window.exportSelected = this.exportSelected.bind(this);
    window.deleteSelected = this.deleteSelected.bind(this);
  }

  // 事件处理器
  handleTreeItemClick(node) {
    if (node.children) {
      this.showFolderContents(node.id);
    }
  }

  handleBookmarkItemClick(bookmark) {
    if (bookmark.children) {
      // 文件夹
      this.showFolderContents(bookmark.id);
    } else {
      // 书签 - 切换选中状态
      this.toggleItemSelection(bookmark.id);
    }
  }

  handleContextMenu(e, item) {
    e.preventDefault();
    this.showContextMenu(e.clientX, e.clientY, item);
  }

  handleDragStart(e, bookmark) {
    this.state.draggedItem = bookmark;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookmark.id);
    
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  handleDrop(e, targetFolder) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (this.state.draggedItem && targetFolder.children) {
      this.moveBookmarkToFolder(this.state.draggedItem.id, targetFolder.id);
    }
    
    this.state.draggedItem = null;
    
    // 清除拖拽状态
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }

  handleSearch(e) {
    this.state.searchQuery = e.target.value.trim();
    
    if (this.state.searchQuery) {
      // 搜索模式 - 显示所有匹配的书签
      this.searchBookmarksGlobally();
    } else {
      // 正常模式 - 显示当前文件夹内容
      this.showFolderContents(this.state.currentFolderId);
    }
  }

  // 搜索功能
  async searchBookmarksGlobally() {
    try {
      const allBookmarks = await this.bookmarkService.getAllBookmarksFlat();
      const matchedBookmarks = allBookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
        (bookmark.url && bookmark.url.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
      );
      
      this.renderBookmarkList(matchedBookmarks);
      this.updateCurrentFolderDisplay(`搜索结果: "${this.state.searchQuery}"`);
      
    } catch (error) {
      this.showError('搜索失败', error.message);
    }
  }

  // 选择功能
  toggleItemSelection(itemId) {
    if (this.state.selectedItems.has(itemId)) {
      this.state.selectedItems.delete(itemId);
    } else {
      this.state.selectedItems.add(itemId);
    }
    
    this.updateItemSelection(itemId);
    this.updateBatchToolbar();
  }

  updateItemSelection(itemId) {
    const itemElement = document.querySelector(`[data-bookmark-id="${itemId}"]`);
    if (itemElement) {
      if (this.state.selectedItems.has(itemId)) {
        itemElement.classList.add('selected');
      } else {
        itemElement.classList.remove('selected');
      }
    }
  }

  selectAll() {
    const bookmarkItems = document.querySelectorAll('.bookmark-item[data-bookmark-id]');
    bookmarkItems.forEach(item => {
      const itemId = item.dataset.bookmarkId;
      this.state.selectedItems.add(itemId);
      item.classList.add('selected');
    });
    
    this.updateBatchToolbar();
  }

  clearSelection() {
    this.state.selectedItems.clear();
    document.querySelectorAll('.bookmark-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    this.updateBatchToolbar();
  }

  updateBatchToolbar() {
    const toolbar = document.getElementById('batch-toolbar');
    const countElement = document.getElementById('selected-count');
    
    if (toolbar && countElement) {
      countElement.textContent = this.state.selectedItems.size;
      
      if (this.state.selectedItems.size > 0) {
        toolbar.classList.add('visible');
      } else {
        toolbar.classList.remove('visible');
      }
    }
  }

  // 右键菜单
  showContextMenu(x, y, item) {
    const menu = document.getElementById('context-menu');
    if (!menu) return;

    menu.innerHTML = '';
    
    if (item.children) {
      // 文件夹菜单
      this.addContextMenuItem(menu, '📂 打开文件夹', () => this.showFolderContents(item.id));
      this.addContextMenuItem(menu, '✏️ 重命名', () => this.renameItem(item));
      menu.appendChild(this.createMenuSeparator());
      this.addContextMenuItem(menu, '📁 新建子文件夹', () => this.createNewFolder(item.id));
      this.addContextMenuItem(menu, '➕ 添加书签', () => this.addNewBookmark(item.id));
      menu.appendChild(this.createMenuSeparator());
      this.addContextMenuItem(menu, '📤 导出文件夹', () => this.exportFolder(item));
      this.addContextMenuItem(menu, '🗑️ 删除文件夹', () => this.deleteBookmark(item), 'danger');
    } else {
      // 书签菜单
      this.addContextMenuItem(menu, '🔗 打开链接', () => this.openBookmark(item));
      this.addContextMenuItem(menu, '🆕 在新标签页打开', () => this.openBookmark(item, true));
      this.addContextMenuItem(menu, '📋 复制链接', () => this.copyBookmarkUrl(item));
      menu.appendChild(this.createMenuSeparator());
      this.addContextMenuItem(menu, '✏️ 编辑书签', () => this.editBookmark(item));
      this.addContextMenuItem(menu, '📁 移动到', () => this.showMoveDialog(item));
      menu.appendChild(this.createMenuSeparator());
      this.addContextMenuItem(menu, '🗑️ 删除书签', () => this.deleteBookmark(item), 'danger');
    }

    // 定位菜单
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';

    // 确保菜单在屏幕内
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    });
  }

  addContextMenuItem(menu, text, onClick, className = '') {
    const item = document.createElement('div');
    item.className = `context-menu-item ${className}`;
    item.textContent = text;
    item.onclick = () => {
      this.hideContextMenu();
      onClick();
    };
    menu.appendChild(item);
  }

  createMenuSeparator() {
    const separator = document.createElement('div');
    separator.className = 'context-menu-separator';
    return separator;
  }

  hideContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  // 书签操作
  async openBookmark(bookmark, newTab = false) {
    if (bookmark.url) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ 
          url: bookmark.url, 
          active: !newTab 
        });
      } else {
        window.open(bookmark.url, newTab ? '_blank' : '_self');
      }
    }
  }

  async copyBookmarkUrl(bookmark) {
    if (bookmark.url) {
      try {
        await navigator.clipboard.writeText(bookmark.url);
        this.showNotification('链接已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  }

  async editBookmark(bookmark) {
    this.showModal('编辑书签', `
      <div class="form-group">
        <label class="form-label">标题</label>
        <input type="text" class="form-input" id="edit-title" value="${bookmark.title || ''}" required>
      </div>
      ${bookmark.url ? `
        <div class="form-group">
          <label class="form-label">URL</label>
          <input type="url" class="form-input" id="edit-url" value="${bookmark.url}" required>
        </div>
      ` : ''}
    `, [
      {
        text: '取消',
        onClick: () => this.hideModal()
      },
      {
        text: '保存',
        className: 'btn-primary',
        onClick: () => this.saveBookmarkEdit(bookmark)
      }
    ]);
  }

  async saveBookmarkEdit(bookmark) {
    const title = document.getElementById('edit-title')?.value.trim();
    const url = document.getElementById('edit-url')?.value.trim();

    if (!title) {
      this.showNotification('请输入标题', 'error');
      return;
    }

    try {
      const updateData = { title };
      if (bookmark.url) {
        updateData.url = url;
      }

      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.update(bookmark.id, updateData, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      }

      this.hideModal();
      this.refreshBookmarks();
      this.showNotification('保存成功');
      
    } catch (error) {
      this.showNotification(`保存失败: ${error.message}`, 'error');
    }
  }

  async deleteBookmark(bookmark) {
    const itemType = bookmark.children ? '文件夹' : '书签';
    const confirmMessage = `确定要删除${itemType}"${bookmark.title}"吗？${bookmark.children ? '文件夹内的所有内容也会被删除。' : ''}`;
    
    if (!confirm(confirmMessage)) return;

    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        if (bookmark.children) {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.removeTree(bookmark.id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        } else {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.remove(bookmark.id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        }
      }

      this.refreshBookmarks();
      this.showNotification(`${itemType}已删除`);
      
    } catch (error) {
      this.showNotification(`删除失败: ${error.message}`, 'error');
    }
  }

  // 文件夹操作
  async createNewFolder(parentId = null) {
    this.showModal('新建文件夹', `
      <div class="form-group">
        <label class="form-label">文件夹名称</label>
        <input type="text" class="form-input" id="folder-name" placeholder="输入文件夹名称" required>
      </div>
    `, [
      {
        text: '取消',
        onClick: () => this.hideModal()
      },
      {
        text: '创建',
        className: 'btn-primary',
        onClick: () => this.doCreateFolder(parentId)
      }
    ]);

    // 自动聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('folder-name');
      if (input) input.focus();
    }, 100);
  }

  async doCreateFolder(parentId) {
    const folderName = document.getElementById('folder-name')?.value.trim();
    
    if (!folderName) {
      this.showNotification('请输入文件夹名称', 'error');
      return;
    }

    try {
      const targetParentId = parentId || this.state.currentFolderId || '1';
      
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.create({
            parentId: targetParentId,
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

      this.hideModal();
      this.refreshBookmarks();
      this.showNotification('文件夹创建成功');
      
    } catch (error) {
      this.showNotification(`创建失败: ${error.message}`, 'error');
    }
  }

  async addNewBookmark(parentId = null) {
    this.showModal('添加书签', `
      <div class="form-group">
        <label class="form-label">标题</label>
        <input type="text" class="form-input" id="bookmark-title" placeholder="输入书签标题" required>
      </div>
      <div class="form-group">
        <label class="form-label">URL</label>
        <input type="url" class="form-input" id="bookmark-url" placeholder="https://example.com" required>
      </div>
    `, [
      {
        text: '取消',
        onClick: () => this.hideModal()
      },
      {
        text: '添加',
        className: 'btn-primary',
        onClick: () => this.doAddBookmark(parentId)
      }
    ]);

    // 自动聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('bookmark-title');
      if (input) input.focus();
    }, 100);
  }

  async doAddBookmark(parentId) {
    const title = document.getElementById('bookmark-title')?.value.trim();
    const url = document.getElementById('bookmark-url')?.value.trim();
    
    if (!title || !url) {
      this.showNotification('请填写完整信息', 'error');
      return;
    }

    try {
      const targetParentId = parentId || this.state.currentFolderId || '1';
      
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.create({
            parentId: targetParentId,
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

      this.hideModal();
      this.refreshBookmarks();
      this.showNotification('书签添加成功');
      
    } catch (error) {
      this.showNotification(`添加失败: ${error.message}`, 'error');
    }
  }

  // 批量操作
  async deleteSelected() {
    if (this.state.selectedItems.size === 0) return;

    const count = this.state.selectedItems.size;
    if (!confirm(`确定要删除选中的 ${count} 个项目吗？`)) return;

    try {
      for (const itemId of this.state.selectedItems) {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.get(itemId, (bookmarks) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              
              const bookmark = bookmarks[0];
              if (bookmark) {
                if (bookmark.url) {
                  // 书签
                  chrome.bookmarks.remove(itemId, () => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve();
                    }
                  });
                } else {
                  // 文件夹
                  chrome.bookmarks.removeTree(itemId, () => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve();
                    }
                  });
                }
              } else {
                resolve();
              }
            });
          });
        }
      }

      this.clearSelection();
      this.refreshBookmarks();
      this.showNotification(`已删除 ${count} 个项目`);
      
    } catch (error) {
      this.showNotification(`批量删除失败: ${error.message}`, 'error');
    }
  }

  async exportSelected() {
    if (this.state.selectedItems.size === 0) return;

    try {
      const selectedBookmarks = [];
      
      for (const itemId of this.state.selectedItems) {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          const bookmarks = await new Promise((resolve) => {
            chrome.bookmarks.get(itemId, resolve);
          });
          
          if (bookmarks && bookmarks[0]) {
            selectedBookmarks.push(bookmarks[0]);
          }
        }
      }

      await this.importExportService.exportBookmarksAsCsv(selectedBookmarks);
      this.showNotification('选中项目已导出');
      
    } catch (error) {
      this.showNotification(`导出失败: ${error.message}`, 'error');
    }
  }

  // UI辅助方法
  showModal(title, content, buttons = []) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    
    if (!overlay || !modal) return;

    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${title}</div>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${buttons.map(btn => `
          <button class="btn ${btn.className || ''}" onclick="(${btn.onClick.toString()})()">${btn.text}</button>
        `).join('')}
      </div>
    `;

    overlay.style.display = 'flex';
  }

  hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff3b30' : '#007aff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后自动消失
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showLoading(show) {
    const treeContainer = document.getElementById('bookmark-tree');
    const listContainer = document.getElementById('bookmark-list');
    
    if (show) {
      if (treeContainer) {
        treeContainer.innerHTML = '<div class="loading"><div class="spinner"></div>正在加载...</div>';
      }
      if (listContainer) {
        listContainer.innerHTML = '<div class="loading"><div class="spinner"></div>正在加载...</div>';
      }
    }
  }

  showError(title, message) {
    this.showNotification(`${title}: ${message}`, 'error');
    console.error(title, message);
  }

  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <div class="empty-title">文件夹为空</div>
        <div class="empty-desc">此文件夹中没有书签</div>
      </div>
    `;
  }

  // 刷新和更新方法
  async refreshBookmarks() {
    await this.loadBookmarkTree();
    await this.showFolderContents(this.state.currentFolderId);
    this.showNotification('已刷新');
  }

  updateCurrentFolderDisplay(name) {
    const nameElement = document.getElementById('current-folder-name');
    if (nameElement) {
      nameElement.textContent = name || '所有书签';
    }
  }

  updateFolderPath(folderId) {
    // 更新面包屑导航
    const pathElement = document.getElementById('folder-path');
    if (pathElement && folderId) {
      // 这里可以实现面包屑导航逻辑
      const path = this.getFolderPath(folderId);
      pathElement.textContent = path.join(' > ');
    }
  }

  updateTreeSelection(folderId) {
    // 更新树形菜单中的选中状态
    document.querySelectorAll('.tree-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    if (folderId) {
      const selectedItem = document.querySelector(`[data-node-id="${folderId}"] .tree-item`);
      if (selectedItem) {
        selectedItem.classList.add('selected');
      }
    }
  }

  // 辅助方法
  getBookmarkCount(node) {
    if (!node.children) return 0;
    
    let count = 0;
    node.children.forEach(child => {
      if (child.url) {
        count++;
      } else if (child.children) {
        count += this.getBookmarkCount(child);
      }
    });
    
    return count;
  }

  getFolderPath(folderId) {
    // 实现获取文件夹路径的逻辑
    // 这是一个简化版本
    return ['书签栏', '文件夹']; 
  }

  generateMockBookmarkTree() {
    // 测试用的模拟数据
    return {
      id: '0',
      title: '根目录',
      children: [
        {
          id: '1',
          title: '书签栏',
          children: [
            { id: '2', title: '谷歌', url: 'https://google.com' },
            { id: '3', title: '百度', url: 'https://baidu.com' },
            {
              id: '4',
              title: '开发工具',
              children: [
                { id: '5', title: 'GitHub', url: 'https://github.com' },
                { id: '6', title: 'Stack Overflow', url: 'https://stackoverflow.com' }
              ]
            }
          ]
        }
      ]
    };
  }

  generateMockBookmarks(folderId) {
    // 测试用的模拟书签数据
    return [
      { id: '2', title: '谷歌', url: 'https://google.com' },
      { id: '3', title: '百度', url: 'https://baidu.com' },
      { id: '4', title: '开发工具', children: [] }
    ];
  }

  // 导入导出相关方法
  async showImportModal() {
    this.showModal('导入书签', `
      <div class="form-group">
        <label class="form-label">选择文件</label>
        <input type="file" class="form-input" id="import-file" accept=".html,.json,.csv">
      </div>
      <div class="form-group">
        <label class="form-label">导入到</label>
        <select class="form-input" id="import-target">
          <option value="">当前文件夹</option>
          <option value="1">书签栏</option>
          <option value="new">新建文件夹</option>
        </select>
      </div>
    `, [
      {
        text: '取消',
        onClick: () => this.hideModal()
      },
      {
        text: '导入',
        className: 'btn-primary',
        onClick: () => this.doImportBookmarks()
      }
    ]);
  }

  async doImportBookmarks() {
    const fileInput = document.getElementById('import-file');
    const targetSelect = document.getElementById('import-target');
    
    if (!fileInput?.files?.[0]) {
      this.showNotification('请选择文件', 'error');
      return;
    }

    const file = fileInput.files[0];
    const target = targetSelect?.value || this.state.currentFolderId;

    try {
      const text = await file.text();
      let result;

      if (file.name.endsWith('.json')) {
        result = await this.importExportService.importBookmarksFromJson(text);
      } else if (file.name.endsWith('.html')) {
        result = await this.importExportService.importBookmarksFromHtml(text);
      } else if (file.name.endsWith('.csv')) {
        result = await this.importExportService.importBookmarksFromCsv(text);
      } else {
        throw new Error('不支持的文件格式');
      }

      if (result.success) {
        this.hideModal();
        this.refreshBookmarks();
        this.showNotification(`导入成功：${result.importedCount} 个书签`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.showNotification(`导入失败: ${error.message}`, 'error');
    }
  }

  async exportBookmarks() {
    try {
      await this.importExportService.exportBookmarksAsJson();
      this.showNotification('导出成功');
    } catch (error) {
      this.showNotification(`导出失败: ${error.message}`, 'error');
    }
  }

  async moveSelected() {
    if (this.state.selectedItems.size === 0) return;

    // 显示文件夹选择对话框
    // 这里简化实现
    const targetFolderId = prompt('请输入目标文件夹ID（1=书签栏）:');
    if (targetFolderId) {
      try {
        for (const itemId of this.state.selectedItems) {
          await this.moveBookmarkToFolder(itemId, targetFolderId);
        }
        
        this.clearSelection();
        this.refreshBookmarks();
        this.showNotification('移动成功');
        
      } catch (error) {
        this.showNotification(`移动失败: ${error.message}`, 'error');
      }
    }
  }

  async moveBookmarkToFolder(bookmarkId, folderId) {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.move(bookmarkId, { parentId: folderId }, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    }
  }

  openSettings() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    } else {
      window.open('options.html', '_blank');
    }
  }
}

// 初始化管理器
let bookmarkManager = null;

document.addEventListener('DOMContentLoaded', async () => {
  bookmarkManager = new EnhancedBookmarkManager();
  await bookmarkManager.initialize();
});

// 导出到全局作用域
window.bookmarkManager = bookmarkManager;