// 检测外部库加载状态
window.addEventListener('DOMContentLoaded', function() {
  const libraryStatus = {
    chartjs: typeof Chart !== 'undefined',
    d3js: typeof d3 !== 'undefined'
  };
  
  console.log('外部库加载状态:', libraryStatus);
  
  if (!libraryStatus.chartjs) {
    console.warn('Chart.js未加载，饼图功能将不可用');
    // 提供备用的简单饼图实现
    window.createSimplePieChart = createSimplePieChart;
  }
  
  if (!libraryStatus.d3js) {
    console.warn('D3.js未加载，树形图功能将不可用');
    // 提供备用的简单树形图实现
    window.createSimpleTreeView = createSimpleTreeView;
  }
  
  // 将状态保存到全局变量供其他脚本使用
  window.libraryStatus = libraryStatus;
});

// 简单的饼图实现（不依赖Chart.js）
function createSimplePieChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  // 创建简单的饼图显示
  const pieContainer = document.createElement('div');
  pieContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 20px;
  `;
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  
  Object.entries(data).forEach(([category, bookmarks], index) => {
    const percentage = ((bookmarks.length / Object.values(data).reduce((sum, arr) => sum + arr.length, 0)) * 100).toFixed(1);
    
    const categoryCard = document.createElement('div');
    categoryCard.style.cssText = `
      background: ${colors[index % colors.length]};
      border-radius: 50%;
      width: 120px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    `;
    
    categoryCard.innerHTML = `
      <div style="font-size: 14px;">${category}</div>
      <div style="font-size: 12px;">${bookmarks.length}个</div>
      <div style="font-size: 10px;">${percentage}%</div>
    `;
    
    categoryCard.addEventListener('click', () => {
      showCategoryDetails(category, bookmarks);
    });
    
    categoryCard.addEventListener('mouseenter', () => {
      categoryCard.style.transform = 'scale(1.1)';
    });
    
    categoryCard.addEventListener('mouseleave', () => {
      categoryCard.style.transform = 'scale(1)';
    });
    
    pieContainer.appendChild(categoryCard);
  });
  
  container.appendChild(pieContainer);
}

// 显示分类详情
function showCategoryDetails(category, bookmarks) {
  const detailsContainer = document.createElement('div');
  detailsContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 1000;
  `;
  
  detailsContainer.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333;">${category} (${bookmarks.length}个书签)</h3>
    <div style="max-height: 300px; overflow-y: auto;">
      ${bookmarks.map(bookmark => `
        <div style="padding: 8px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #333;">${bookmark.title}</div>
          <div style="font-size: 12px; color: #666; word-break: break-all;">${bookmark.url}</div>
        </div>
      `).join('')}
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 15px;
      padding: 8px 16px;
      background: #007aff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    ">关闭</button>
  `;
  
  document.body.appendChild(detailsContainer);
}

// 简单的树形图实现（不依赖D3.js）
function createSimpleTreeView(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  const treeContainer = document.createElement('div');
  treeContainer.style.cssText = `
    padding: 20px;
    font-family: monospace;
  `;
  
  function renderNode(node, level = 0) {
    const indent = '  '.repeat(level);
    const nodeElement = document.createElement('div');
    nodeElement.style.cssText = `
      margin: 5px 0;
      padding: 8px;
      background: ${level % 2 === 0 ? '#f5f5f5' : '#ffffff'};
      border-left: 3px solid #007aff;
      border-radius: 4px;
    `;
    
    if (Array.isArray(node)) {
      // 如果是数组，显示为分类
      nodeElement.innerHTML = `
        <strong>📁 ${node[0]?.title || '未命名分类'}</strong>
        <span style="color: #666; font-size: 12px;">(${node.length}个书签)</span>
      `;
    } else if (node.url) {
      // 如果是书签
      nodeElement.innerHTML = `
        <span>🔗 ${node.title}</span>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">${node.url}</div>
      `;
    }
    
    treeContainer.appendChild(nodeElement);
  }
  
  Object.entries(data).forEach(([category, bookmarks]) => {
    renderNode(bookmarks, 0);
    bookmarks.forEach(bookmark => {
      renderNode(bookmark, 1);
    });
  });
  
  container.appendChild(treeContainer);
} 