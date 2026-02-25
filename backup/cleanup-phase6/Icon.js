/**
 * 全局图标组件系统
 * 提供统一的图标管理和使用方式
 */

class IconManager {
  constructor() {
    this.iconCache = new Map();
    this.defaultSize = 24;
    this.defaultColor = 'currentColor';
  }

  /**
   * 获取SVG图标内容
   * @param {string} iconName - 图标名称
   * @param {Object} options - 选项
   * @param {number} options.size - 图标大小
   * @param {string} options.color - 图标颜色
   * @param {string} options.className - CSS类名
   * @returns {string} SVG HTML字符串
   */
  getIcon(iconName, options = {}) {
    const {
      size = this.defaultSize,
      color = this.defaultColor,
      className = ''
    } = options;

    const cacheKey = `${iconName}-${size}-${color}-${className}`;
    
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey);
    }

    const svgContent = this.generateSVG(iconName, { size, color, className });
    this.iconCache.set(cacheKey, svgContent);
    
    return svgContent;
  }

  /**
   * 生成SVG内容
   * @param {string} iconName - 图标名称
   * @param {Object} options - 选项
   * @returns {string} SVG HTML字符串
   */
  generateSVG(iconName, options) {
    const { size, color, className } = options;
    
    // 如果是应用主图标，使用自定义SVG
    if (iconName === 'app-icon' || iconName === 'bookmark-icon') {
      return this.getAppIconSVG(size, color, className);
    }

    // 其他图标使用Lucide图标库
    return this.getLucideIconSVG(iconName, size, color, className);
  }

  /**
   * 获取应用主图标SVG
   * @param {number} size - 图标大小
   * @param {string} color - 图标颜色
   * @param {string} className - CSS类名
   * @returns {string} SVG HTML字符串
   */
  getAppIconSVG(size, color, className) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" class="app-icon ${className}" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M255.473371 889.382034s156.765623-7.832137 260.953235-8.78592c115.755886-1.059109 300.160731 8.78592 300.160731 8.78592l191.321234 21.635657s-298.896823 17.712274-491.481965 17.577692C327.533714 928.463726 52.662857 911.017691 52.662857 911.017691l202.810514-21.635657z" fill="#000000" opacity=".5"></path>
      <path d="M281.798949 125.270309C342.788389 81.785417 421.25312 64.365714 520.777143 64.365714c153.523931 0 292.978103 82.382263 367.504823 266.830995 44.988709 64.459337 58.596206 151.4496 46.872868 234.534034-11.819886 83.748571-49.68448 165.814857-110.381348 219.311543-181.151451 159.659154-414.210926 107.326903-517.298469 57.341074-60.930926-29.543863-194.817463-103.447406-211.093211-256.155063-8.358766-78.41792 0.234057-160.29696 54.737188-253.855451 28.639817-96.130194 69.936274-163.787337 130.68288-207.102537z m16.986697 23.821165C244.893989 187.517806 206.262857 248.931474 178.66752 342.372937l-0.509074 1.717394-0.906972 1.544778c-51.662263 87.98208-59.628983 163.857554-51.782217 237.491931 14.453029 135.59808 133.792914 203.3664 194.767726 232.930743 98.397623 47.712549 316.945554 95.319771 485.188754-52.964206 54.362697-47.914423 89.684846-123.011657 100.755749-201.450057 11.076754-78.488137-2.431269-158.041234-42.773943-214.955154l-1.000594-1.410195-0.643658-1.606217C791.663177 168.7552 662.308571 93.622857 520.774217 93.622857c-96.498834 0-167.97696 16.95744-221.988571 55.471543z" fill="#5E3424"></path>
      <path d="M334.552503 459.337143c47.419977 6.866651 61.407817-9.3184 74.810514-19.382857 21.931154-13.382217 47.864686-39.131429 104.029623-39.131429 60.916297 0 87.253577 23.692434 105.530514 39.131429 6.457051 5.456457 37.738789 26.249509 57.320595 26.249508 60.693943 0 102.341486-103.450331 171.789165-26.249508 26.196846 29.12256 31.205669 152.201509-36.606537 262.489234C738.32448 821.335771 577.10592 854.308571 519.84384 854.308571c-113.368503 0-211.605211-59.222309-255.46752-104.000365-43.862309-44.778057-129.960229-167.078766-95.524571-261.632C212.716983 368.239177 310.921509 455.914057 334.555429 459.337143z" fill="#FFE4CA"></path>
      <path d="M362.788571 441.782857c33.929509 0 61.44-27.507566 61.44-61.44s-27.510491-61.44-61.44-61.44c-33.932434 0-61.44 27.507566-61.44 61.44s27.507566 61.44 61.44 61.44z m304.274286 0c33.929509 0 61.44-27.507566 61.44-61.44s-27.510491-61.44-61.44-61.44c-33.932434 0-61.44 27.507566-61.44 61.44s27.507566 61.44 61.44 61.44z" fill="#FFFFFF"></path>
    </svg>`;
  }

  /**
   * 获取Lucide图标SVG
   * @param {string} iconName - 图标名称
   * @param {number} size - 图标大小
   * @param {string} color - 图标颜色
   * @param {string} className - CSS类名
   * @returns {string} SVG HTML字符串
   */
  getLucideIconSVG(iconName, size, color, className) {
    // 常用图标的SVG路径
    const iconPaths = {
      'search': '<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>',
      'user': '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      'settings': '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>',
      'folder': '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>',
      'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>',
      'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline>',
      'brain': '<path d="M12 5a3 3 0 10-5.997.125 4 4 0 00-2.526 5.77 4 4 0 00 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>',
      'chevron-right': '<polyline points="9,18 15,12 9,6"></polyline>',
      'chevron-down': '<polyline points="6,9 12,15 18,9"></polyline>',
      'x': '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
      'external-link': '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
      'plus-square': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>',
      'edit': '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
      'copy': '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>',
      'trash-2': '<polyline points="3,6 5,6 21,6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
      'layout-grid': '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
      'list': '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
      'bar-chart-3': '<path d="M3 3v18h18"></path><path d="M18 7v4"></path><path d="M13 11v8"></path><path d="M8 15v4"></path>',
      'zap': '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>',
      'link-off': '<path d="M9 9l3 3m0 0l3 3m-3-3l-3 3m3-3l3-3"></path><path d="M21 3l-6 6"></path><path d="M3 21l6-6"></path><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"></path><path d="M9 9h6v6"></path>',
      'folder-minus': '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line>',
      'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline>',
      'sticky-note': '<path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"></path><path d="M15 3v6h6"></path>',
      'download': '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
    };

    const path = iconPaths[iconName];
    if (!path) {
      console.warn(`图标 "${iconName}" 未找到，使用默认图标`);
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon ${className}"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon ${className}">${path}</svg>`;
  }

  /**
   * 创建图标元素
   * @param {string} iconName - 图标名称
   * @param {Object} options - 选项
   * @returns {HTMLElement} 图标元素
   */
  createIconElement(iconName, options = {}) {
    const svgContent = this.getIcon(iconName, options);
    const container = document.createElement('div');
    container.innerHTML = svgContent;
    return container.firstElementChild;
  }

  /**
   * 替换元素中的图标
   * @param {HTMLElement} element - 目标元素
   * @param {string} iconName - 图标名称
   * @param {Object} options - 选项
   */
  replaceIcon(element, iconName, options = {}) {
    const iconElement = this.createIconElement(iconName, options);
    element.innerHTML = '';
    element.appendChild(iconElement);
  }

  /**
   * 初始化页面中的所有图标
   * @param {string} selector - 选择器，默认为 '[data-icon]'
   */
  initializeIcons(selector = '[data-icon]') {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const iconName = element.getAttribute('data-icon');
      const size = parseInt(element.getAttribute('data-size')) || this.defaultSize;
      const color = element.getAttribute('data-color') || this.defaultColor;
      const className = element.getAttribute('data-class') || '';

      if (iconName) {
        this.replaceIcon(element, iconName, { size, color, className });
      }
    });
  }

  /**
   * 清除图标缓存
   */
  clearCache() {
    this.iconCache.clear();
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    return {
      size: this.iconCache.size,
      keys: Array.from(this.iconCache.keys())
    };
  }
}

// 创建全局实例
const iconManager = new IconManager();

// 导出给模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconManager;
}

// 全局可用
window.IconManager = IconManager;
window.iconManager = iconManager;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  iconManager.initializeIcons();
});

console.log('🎨 图标组件系统已加载');




