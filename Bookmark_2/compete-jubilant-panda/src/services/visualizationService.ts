/**
 * 可视化服务模块 - React Hook 版本
 * 处理图表生成、统计显示等可视化功能
 */

import { useState, useCallback, useRef } from 'react';
import type { Bookmark, CategorizedBookmarks, BookmarkStats } from './bookmarkService';

export interface WordCloudData {
  text: string;
  value: number;
}

export interface ChartData {
  category: string;
  count: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export const useVisualizationService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const chartInstances = useRef<Map<string, any>>(new Map());

  // 初始化可视化服务
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('正在初始化可视化服务...');
      setIsInitialized(true);
      console.log('可视化服务初始化完成');
      return true;
    } catch (error) {
      console.error(`可视化服务初始化失败: ${error}`);
      return false;
    }
  }, []);

  // 生成分类统计图表数据
  const generateCategoryChartData = useCallback((categories: CategorizedBookmarks): ChartData[] => {
    return Object.entries(categories)
      .map(([name, bookmarks]) => ({
        category: name,
        count: bookmarks.length
      }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // 生成域名统计图表数据
  const generateDomainChartData = useCallback((bookmarks: Bookmark[]): ChartData[] => {
    const domainMap = new Map<string, number>();
    
    bookmarks.forEach(bookmark => {
      try {
        const url = new URL(bookmark.url);
        const domain = url.hostname.replace(/^www\./, '');
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
      } catch (e) {
        // 忽略无效URL
      }
    });

    return Array.from(domainMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([domain, count]) => ({ category: domain, count }));
  }, []);

  // 生成词云数据
  const generateWordCloudData = useCallback((bookmarks: Bookmark[]): WordCloudData[] => {
    const wordMap = new Map<string, number>();
    
    bookmarks.forEach(bookmark => {
      const title = bookmark.title || '';
      // 提取中文和英文单词
      const words = title.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
      
      words.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord.length > 1) {
          wordMap.set(cleanWord, (wordMap.get(cleanWord) || 0) + 1);
        }
      });
    });
    
    return Array.from(wordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([text, value]) => ({ text, value }));
  }, []);

  // 生成活跃度数据（模拟）
  const generateActivityData = useCallback((): ActivityData[] => {
    const data: ActivityData[] = [];
    const today = new Date();
    
    // 生成过去365天的数据
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // 模拟活跃度数据（0-4个书签）
      const count = Math.floor(Math.random() * 5);
      
      data.push({
        date: date.toISOString().split('T')[0],
        count: count
      });
    }
    
    return data;
  }, []);

  // 生成颜色数组
  const generateColors = useCallback((count: number): string[] => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
      '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB'
    ];
    
    // 如果需要更多颜色，生成随机颜色
    while (colors.length < count) {
      const hue = Math.floor(Math.random() * 360);
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return colors.slice(0, count);
  }, []);

  // 获取热力图颜色
  const getHeatmapColor = useCallback((count: number): string => {
    const colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
    return colors[Math.min(count, colors.length - 1)];
  }, []);

  // 创建词云HTML
  const createWordCloudHtml = useCallback((words: WordCloudData[]): string => {
    const maxValue = Math.max(...words.map(w => w.value));
    const minValue = Math.min(...words.map(w => w.value));
    const range = maxValue - minValue;
    
    // 使用更丰富的颜色调色板
    const colors = [
      'rgb(59, 130, 246)',   // blue-500
      'rgb(99, 102, 241)',   // indigo-500
      'rgb(139, 92, 246)',    // violet-500
      'rgb(168, 85, 247)',    // purple-500
      'rgb(217, 70, 239)'     // fuchsia-500
    ];
    
    // 计算旋转角度
    const rotations = [0, 0, 0, -15, 15, -30, 30];
    
    return words.map((word, index) => {
      const fontSize = Math.max(12, (word.value / maxValue) * 24 + 12);
      const colorIndex = Math.min(Math.floor((word.value - minValue) / range * colors.length), colors.length - 1);
      const color = colors[colorIndex];
      const rotation = rotations[index % rotations.length];
      const fontWeight = word.value > (minValue + maxValue) / 2 ? 600 : 400;
      
      return `
        <span class="word-item ${fontWeight === 600 ? 'highlight' : ''}" 
              style="font-size: ${fontSize}px; color: ${color}; transform: rotate(${rotation}deg);"
              title="${word.text}: ${word.value}个书签"
              data-word="${word.text}"
              data-count="${word.value}">
          ${word.text}
        </span>
      `;
    }).join('');
  }, []);

  // 创建分类图表HTML
  const createCategoryChartHtml = useCallback((data: ChartData[]): string => {
    const maxCount = Math.max(...data.map(d => d.count));
    
    return data.map(item => {
      const percentage = (item.count / maxCount) * 100;
      return `
        <div class="category-item" 
             data-category="${item.category}"
             data-count="${item.count}">
          <div class="category-label">${item.category}</div>
          <div class="category-bar">
            <div class="category-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="category-count">${item.count}</div>
        </div>
      `;
    }).join('');
  }, []);

  // 创建活跃度热力图HTML
  const createActivityHeatmapHtml = useCallback((data: ActivityData[]): string => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    // 处理数据为网格格式
    const grid: any[][] = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    
    // 创建数据映射
    const dataMap = new Map(data.map(item => [item.date, item.count]));
    
    // 生成网格
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const weekOffset = Math.floor((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (!grid[weekOffset]) {
        grid[weekOffset] = [];
      }
      
      grid[weekOffset][dayOfWeek] = {
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      };
    }
    
    return `
      <div class="activity-heatmap">
        <div class="heatmap-container">
          <div class="heatmap-header">
            <div class="heatmap-title">收藏活跃度热力图</div>
            <div class="heatmap-legend">
              <span>活跃度:</span>
              <div class="legend-item">
                <div class="legend-color" style="background: #ebedf0;"></div>
                <span>无</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #c6e48b;"></div>
                <span>少</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #7bc96f;"></div>
                <span>中</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #239a3b;"></div>
                <span>多</span>
              </div>
            </div>
          </div>
          
          <div class="heatmap-grid">
            <div class="heatmap-days">
              ${days.map(day => `<div>${day}</div>`).join('')}
            </div>
            <div class="heatmap-squares">
              ${grid.map((week, weekIndex) => 
                week.map((day, dayIndex) => {
                  if (!day) return '<div></div>';
                  
                  const color = getHeatmapColor(day.count);
                  return `
                    <div class="heatmap-square" 
                         style="background: ${color};"
                         data-date="${day.date}"
                         data-count="${day.count}"
                         title="${day.date}: ${day.count}个书签">
                    </div>
                  `;
                }).join('')
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }, [getHeatmapColor]);

  // 清除所有图表
  const clearAllCharts = useCallback(() => {
    chartInstances.current.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    chartInstances.current.clear();
    console.log('所有图表已清除');
  }, []);

  // 导出图表为图片
  const exportChartAsImage = useCallback((containerId: string, filename?: string) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`容器 ${containerId} 未找到`);
      return;
    }

    // 使用html2canvas导出（如果可用）
    if (typeof (window as any).html2canvas !== 'undefined') {
      (window as any).html2canvas(container).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = filename || 'chart.png';
        link.href = canvas.toDataURL();
        link.click();
        console.log(`图表已导出为图片: ${filename}`);
      });
    } else {
      console.warn('html2canvas库未找到，无法导出图片');
    }
  }, []);

  return {
    isInitialized,
    initialize,
    generateCategoryChartData,
    generateDomainChartData,
    generateWordCloudData,
    generateActivityData,
    generateColors,
    getHeatmapColor,
    createWordCloudHtml,
    createCategoryChartHtml,
    createActivityHeatmapHtml,
    clearAllCharts,
    exportChartAsImage
  };
};
