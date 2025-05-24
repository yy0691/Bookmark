/**
 * 可视化功能模块
 * 用于生成书签分类的各种可视化图表
 */

// 生成饼图显示分类比例
function generateCategoryPieChart() {
  const ctx = document.getElementById('category-pie-chart').getContext('2d');
  
  // 准备数据
  const categoryData = Object.entries(categories)
    .map(([name, items]) => ({
      category: name,
      count: items.length
    }))
    .sort((a, b) => b.count - a.count);
  
  // 取前10个分类，其余归为"其他"
  const topCategories = categoryData.slice(0, 10);
  const otherCategories = categoryData.slice(10);
  const otherCount = otherCategories.reduce((sum, cat) => sum + cat.count, 0);
  
  // 如果有"其他"分类，添加到数据中
  if (otherCount > 0) {
    topCategories.push({ category: '其他', count: otherCount });
  }
  
  // 准备图表数据
  const labels = topCategories.map(item => item.category);
  const data = topCategories.map(item => item.count);
  const backgroundColors = generateAppleColorPalette(labels.length);
  
  // 创建图表
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: 'rgba(255, 255, 255, 0.8)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#1d1d1f',
            font: {
              family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Helvetica, Arial, sans-serif',
              size: 12,
              weight: '500'
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1d1d1f',
          bodyColor: '#1d1d1f',
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          titleFont: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Helvetica, Arial, sans-serif',
            size: 14,
            weight: '600'
          },
          bodyFont: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Helvetica, Arial, sans-serif',
            size: 13,
            weight: '500'
          },
          callbacks: {
            label: function(context) {
              const percent = ((context.raw / totalBookmarksCount) * 100).toFixed(1);
              return `${context.label}: ${context.raw}个 (${percent}%)`;
            }
          }
        }
      },
      layout: {
        padding: 20
      }
    }
  });
}

// 生成树形图
function generateCategoryTreeView() {
  const container = document.getElementById('category-tree');
  
  // 清空容器
  container.innerHTML = '';
  
  // 创建SVG容器
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 20, right: 120, bottom: 20, left: 60 };
  
  const svg = d3.select('#category-tree')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'transparent')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // 准备数据结构
  const treeData = {
    name: '📚 书签',
    children: Object.entries(categories)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15) // 限制顶级分类数量
      .map(([category, items]) => ({
        name: `${category} (${items.length})`,
        children: items.slice(0, 5).map(item => ({ // 限制每个分类显示的书签数量
          name: item.title || item.url,
          url: item.url
        }))
      }))
  };
  
  // 创建树形布局
  const treeLayout = d3.tree()
    .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
  
  // 创建根节点
  const root = d3.hierarchy(treeData);
  
  // 计算节点位置
  treeLayout(root);
  
  // 创建连接线
  svg.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x))
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255, 255, 255, 0.4)')
    .attr('stroke-width', 2)
    .style('opacity', 0.8);
  
  // 创建节点
  const node = svg.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', d => `node ${d.children ? 'node-internal' : 'node-leaf'}`)
    .attr('transform', d => `translate(${d.y},${d.x})`);
  
  // 添加节点圆点
  node.append('circle')
    .attr('r', d => d.depth === 0 ? 8 : d.depth === 1 ? 6 : 4)
    .attr('fill', d => {
      if (d.depth === 0) return '#007aff';
      if (d.depth === 1) return '#30d158';
      return '#ff9500';
    })
    .attr('stroke', 'rgba(255, 255, 255, 0.8)')
    .attr('stroke-width', 2)
    .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))');
  
  // 添加节点文本
  node.append('text')
    .attr('dy', '.31em')
    .attr('x', d => d.children ? -12 : 12)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => d.data.name)
    .style('font-size', d => d.depth === 0 ? '14px' : d.depth === 1 ? '12px' : '10px')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Helvetica, Arial, sans-serif')
    .style('font-weight', d => d.depth === 0 ? '600' : d.depth === 1 ? '500' : '400')
    .style('fill', '#1d1d1f')
    .style('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.8)')
    .each(function(d) {
      // 限制文本长度
      const textElement = d3.select(this);
      const text = textElement.text();
      if (text.length > 30) {
        textElement.text(text.substring(0, 27) + '...');
      }
    });
}

// 生成标签云
function generateTagCloud() {
  const container = document.getElementById('category-tag-cloud');
  
  // 清空容器
  container.innerHTML = '';
  
  // 准备数据
  const categoryData = Object.entries(categories)
    .map(([name, items]) => ({
      category: name,
      count: items.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30); // 限制标签数量
  
  if (categoryData.length === 0) {
    container.innerHTML = `
      <div style="
        text-align: center; 
        color: #8e8e93; 
        padding: 60px 20px;
        font-size: 16px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      ">暂无数据</div>
    `;
    return;
  }
  
  // 计算字体大小范围（不使用D3.js）
  const minCount = Math.min(...categoryData.map(d => d.count));
  const maxCount = Math.max(...categoryData.map(d => d.count));
  
  // 简单的线性缩放函数
  const calculateFontSize = (count) => {
    if (minCount === maxCount) {
      return 20; // 如果所有分类书签数量相同，使用固定字体大小
    }
    
    const minFont = 14;
    const maxFont = 36;
    const ratio = (count - minCount) / (maxCount - minCount);
    return Math.round(minFont + ratio * (maxFont - minFont));
  };
  
  // 苹果风格的颜色集合
  const appleColors = [
    '#007aff', '#5856d6', '#af52de', '#ff2d92', '#ff3b30',
    '#ff9500', '#ffcc02', '#30d158', '#00c896', '#0ac8fa',
    '#5ac8fa', '#007aff', '#5856d6', '#af52de'
  ];
  
  // 创建标签
  categoryData.forEach((item, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag-cloud-tag';
    tag.textContent = `${item.category} (${item.count})`;
    
    const fontSize = calculateFontSize(item.count);
    const colorIndex = index % appleColors.length;
    
    // 设置样式
    Object.assign(tag.style, {
      fontSize: `${fontSize}px`,
      background: `linear-gradient(135deg, ${appleColors[colorIndex]}20, ${appleColors[colorIndex]}30)`,
      color: appleColors[colorIndex],
      border: `1px solid ${appleColors[colorIndex]}40`,
      fontWeight: fontSize > 24 ? '600' : '500',
      padding: fontSize > 24 ? '12px 20px' : '8px 16px',
      margin: '6px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: `0 4px 12px ${appleColors[colorIndex]}20`,
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      cursor: 'pointer',
      userSelect: 'none',
      display: 'inline-block'
    });
    
    // 鼠标悬停效果
    tag.addEventListener('mouseenter', () => {
      Object.assign(tag.style, {
        transform: 'scale(1.05) translateY(-2px)',
        background: `linear-gradient(135deg, ${appleColors[colorIndex]}30, ${appleColors[colorIndex]}40)`,
        boxShadow: `0 8px 24px ${appleColors[colorIndex]}30`,
        color: appleColors[colorIndex]
      });
    });
    
    tag.addEventListener('mouseleave', () => {
      Object.assign(tag.style, {
        transform: 'scale(1) translateY(0)',
        background: `linear-gradient(135deg, ${appleColors[colorIndex]}20, ${appleColors[colorIndex]}30)`,
        boxShadow: `0 4px 12px ${appleColors[colorIndex]}20`,
        color: appleColors[colorIndex]
      });
    });
    
    // 设置点击事件，点击时可过滤分类结果
    tag.addEventListener('click', () => {
      // 滚动到分类结果
      document.getElementById('results').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // 添加高亮效果
      const categoryElements = document.querySelectorAll('.category');
      categoryElements.forEach(element => {
        const categoryName = element.querySelector('.category-name').textContent;
        if (categoryName.includes(item.category)) {
          element.style.background = `linear-gradient(135deg, ${appleColors[colorIndex]}20, ${appleColors[colorIndex]}30)`;
          element.style.border = `2px solid ${appleColors[colorIndex]}60`;
          element.style.transform = 'scale(1.02)';
          
          // 3秒后恢复
          setTimeout(() => {
            element.style.background = '';
            element.style.border = '';
            element.style.transform = '';
          }, 3000);
        }
      });
    });
    
    container.appendChild(tag);
  });
}

// 生成苹果风格颜色调色板
function generateAppleColorPalette(count) {
  // 苹果系统颜色
  const appleSystemColors = [
    '#007aff', // 蓝色
    '#5856d6', // 紫色
    '#af52de', // 紫罗兰
    '#ff2d92', // 品红
    '#ff3b30', // 红色
    '#ff9500', // 橙色
    '#ffcc02', // 黄色
    '#30d158', // 绿色
    '#00c896', // 薄荷绿
    '#0ac8fa', // 青色
    '#5ac8fa', // 浅蓝
    '#8e8e93', // 灰色
    '#007aff', // 蓝色（重复）
    '#ff6b6b', // 珊瑚红
    '#4ecdc4'  // 青绿色
  ];
  
  // 如果颜色数量不够，生成渐变色
  if (count <= appleSystemColors.length) {
    return appleSystemColors.slice(0, count);
  }
  
  // 生成额外的渐变颜色
  const colors = [...appleSystemColors];
  
  for (let i = appleSystemColors.length; i < count; i++) {
    // 基于现有颜色生成渐变
    const baseColor = appleSystemColors[i % appleSystemColors.length];
    
    // 从hex转换为HSL，调整亮度和饱和度
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // 调整HSL值
    hsl.h = (hsl.h + (i * 30)) % 360; // 调整色相
    hsl.s = Math.min(hsl.s + 0.1, 1); // 轻微增加饱和度
    hsl.l = Math.max(hsl.l - 0.1, 0.3); // 轻微降低亮度
    
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    colors.push(newColor);
  }
  
  return colors;
}

// 辅助函数：hex转rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 辅助函数：rgb转hsl
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 无色彩
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

// 辅助函数：hsl转rgb
function hslToRgb(h, s, l) {
  h /= 360;
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // 无色彩
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// 辅助函数：rgb转hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
} 