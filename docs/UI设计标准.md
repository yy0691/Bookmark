# 书签助手 UI 设计标准

## 概述

本文档基于 `pages/newtab/index.css` 建立了项目的统一 UI 设计标准，确保所有页面和组件保持一致的视觉风格和用户体验。

**🎨 图标系统更新**: 项目已全局集成了统一的图标系统，使用自定义SVG图标作为应用主图标。详细使用指南请参考 [图标使用指南](./图标使用指南.md)。

## 设计系统架构

```
styles/
├── index.css                 # 主入口文件，统一导入所有样式
├── global-ui-standards.css   # 全局基础样式和CSS变量
├── component-standards.css   # 通用组件样式标准
└── page-standards.css        # 页面专用样式标准

components/
├── Icon.js                   # 图标组件系统
├── Icon.css                  # 图标样式文件
└── icon-demo.html           # 图标演示页面

images/
├── icon.svg                 # 原始SVG图标文件
├── icon16.svg               # 16x16尺寸图标
├── icon48.svg               # 48x48尺寸图标
└── icon128.svg              # 128x128尺寸图标
```

## 1. 色彩系统

### 1.1 基础配色（深色主题）

```css
/* 背景色彩 */
--bg-primary: #0f0f0f           /* 主背景 */
--bg-secondary: rgba(26, 26, 26, 0.8)  /* 次要背景 */
--bg-tertiary: rgba(38, 38, 38, 0.9)   /* 第三层背景 */
--bg-card: rgba(26, 26, 26, 0.7)       /* 卡片背景 */
--bg-hover: rgba(38, 38, 38, 0.8)      /* 悬停背景 */
--bg-glass: rgba(255, 255, 255, 0.05)  /* 毛玻璃背景 */

/* 文字色彩 */
--text-primary: #ffffff         /* 主要文字 */
--text-secondary: #b3b3b3       /* 次要文字 */
--text-tertiary: #808080        /* 第三层文字 */
--text-muted: #666666           /* 弱化文字 */

/* 边框色彩 */
--border-primary: #333333       /* 主要边框 */
--border-secondary: #555555     /* 次要边框 */
```

### 1.2 主题色彩

```css
/* 功能色彩 */
--accent-blue: #3b82f6      /* 主色调 - 蓝色 */
--accent-purple: #8b5cf6    /* 紫色 */
--accent-green: #10b981     /* 成功/绿色 */
--accent-red: #ef4444       /* 错误/红色 */
--accent-orange: #f59e0b    /* 警告/橙色 */
--accent-pink: #ec4899      /* 粉色 */
```

### 1.3 浅色主题适配

```css
[data-theme="light"] {
  --bg-primary: #ffffff
  --bg-secondary: #f8f9fa
  --text-primary: #212529
  --text-secondary: #495057
  /* 其他变量自动适配 */
}
```

## 2. 间距系统

### 2.1 标准间距

```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
```

### 2.2 使用规范

- **组件内边距**: 使用 `--space-3` 到 `--space-5`
- **组件间距**: 使用 `--space-4` 到 `--space-6`
- **页面边距**: 使用 `--space-6` 到 `--space-8`
- **细节间距**: 使用 `--space-1` 到 `--space-2`

## 3. 圆角系统

```css
--radius-sm: 0.375rem    /* 6px - 小元素 */
--radius-md: 0.5rem      /* 8px - 标准元素 */
--radius-lg: 0.75rem     /* 12px - 卡片 */
--radius-xl: 1rem        /* 16px - 大卡片 */
--radius-2xl: 1.5rem     /* 24px - 容器 */
--radius-full: 9999px    /* 圆形 */
```

## 4. 阴影系统

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1)           /* 小阴影 */
--shadow-card: 0 4px 16px rgba(0, 0, 0, 0.2)        /* 卡片阴影 */
--shadow-card-hover: 0 8px 32px rgba(0, 0, 0, 0.3)  /* 悬停阴影 */
--shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.4)         /* 大阴影 */
```

## 5. 字体系统

### 5.1 字体栈

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace
```

### 5.2 字体大小规范

| 用途 | 字体大小 | 字重 |
|------|----------|------|
| 主标题 | 2rem (32px) | 700 |
| 副标题 | 1.5rem (24px) | 600 |
| 章节标题 | 1.25rem (20px) | 600 |
| 正文 | 0.875rem (14px) | 500 |
| 小字 | 0.75rem (12px) | 400 |
| 极小字 | 0.625rem (10px) | 400 |

## 6. 动画系统

### 6.1 缓动函数

```css
--transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1)
--transition-normal: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### 6.2 标准动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 向上滑入 */
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 脉冲 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 7. 图标系统

### 7.1 图标使用规范

#### 基本用法
```html
<!-- HTML 方式 -->
<div data-icon="app-icon" data-size="24"></div>
<div data-icon="search" data-size="20" data-color="#007aff"></div>

<!-- JavaScript 方式 -->
<script>
const iconElement = iconManager.createIconElement('app-icon', {
  size: 24,
  color: '#007aff',
  className: 'icon-primary'
});
</script>
```

#### 图标尺寸标准
- **XS**: 12px - 极小图标（状态指示）
- **SM**: 16px - 小图标（工具栏、按钮）
- **MD**: 20px - 中等图标（导航、列表）
- **LG**: 24px - 大图标（标题、卡片）
- **XL**: 32px - 超大图标（页面标题）
- **2XL**: 48px - 巨大图标（应用图标）

#### 图标颜色规范
```css
.icon-primary { color: #007aff; }    /* 主色调 */
.icon-secondary { color: #6e6e73; }   /* 次要色 */
.icon-success { color: #30d158; }    /* 成功色 */
.icon-warning { color: #ff9500; }    /* 警告色 */
.icon-danger { color: #ff3b30; }     /* 危险色 */
.icon-info { color: #5ac8fa; }       /* 信息色 */
```

### 7.2 应用主图标

项目使用自定义的SVG图标作为应用主图标，具有以下特点：
- 独特的书签主题设计
- 支持多尺寸缩放
- 矢量格式，清晰度无损
- 支持主题色彩变化

### 7.3 图标动画效果

```css
.icon-spin { animation: icon-spin 1s linear infinite; }
.icon-pulse { animation: icon-pulse 2s ease-in-out infinite; }
.icon-bounce { animation: icon-bounce 1s ease-in-out infinite; }
.icon-hover-scale:hover { transform: scale(1.1); }
.icon-hover-rotate:hover { transform: rotate(90deg); }
```

## 8. 组件标准

### 8.1 按钮组件

#### 基础按钮
```css
.btn {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-normal);
}
```

#### 按钮变体
- `.btn-primary` - 主要按钮（蓝色）
- `.btn-success` - 成功按钮（绿色）
- `.btn-warning` - 警告按钮（橙色）
- `.btn-danger` - 危险按钮（红色）
- `.btn-ghost` - 幽灵按钮（透明）

#### 按钮尺寸
- `.btn-sm` - 小按钮
- `.btn` - 标准按钮
- `.btn-lg` - 大按钮
- `.btn-icon` - 图标按钮（正方形）

### 7.2 卡片组件

#### 标准卡片
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}
```

#### 毛玻璃卡片
```css
.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
}
```

### 7.3 表单组件

#### 输入框
```css
.input {
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}
```

#### 聚焦状态
```css
.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### 7.4 标签组件

```css
.tag {
  padding: var(--space-1) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.tag.active {
  background: var(--accent-primary);
  color: white;
}
```

## 8. 布局标准

### 8.1 网格系统

#### 主仪表板布局
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--space-6);
}
```

#### 书签网格
```css
.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

/* 列表视图 */
.bookmarks-grid.list-view {
  grid-template-columns: 1fr;
  gap: 0.5rem;
}
```

### 8.2 容器系统

```css
/* 主容器 */
.main-container {
  padding: 80px var(--space-6) var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面容器 */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}
```

## 9. 响应式设计

### 9.1 断点系统

```css
/* 移动设备 */
@media (max-width: 640px) { /* sm */ }

/* 平板设备 */
@media (max-width: 768px) { /* md */ }

/* 桌面设备 */
@media (max-width: 1024px) { /* lg */ }
```

### 9.2 响应式规则

1. **移动优先**: 默认样式为移动端，向上扩展
2. **网格调整**: 大屏幕多列，小屏幕单列
3. **间距缩放**: 小屏幕使用较小间距
4. **字体调整**: 移动端适当调整字体大小

## 10. 特殊效果

### 10.1 毛玻璃效果

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 10.2 渐变边框

```css
.gradient-border::before {
  background: linear-gradient(45deg, var(--accent-blue), var(--accent-purple));
  /* 复杂实现，参考具体代码 */
}
```

### 10.3 悬浮阴影

```css
.floating-shadow {
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.1),
    0 16px 32px rgba(0, 0, 0, 0.1);
}
```

## 11. 书签专用组件

### 11.1 书签项

```css
.bookmark-item {
  display: flex;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-slow);
}

.bookmark-item:hover {
  background: var(--bookmark-hover);
  transform: translateY(-2px) scale(1.02);
}
```

### 11.2 文件夹树

```css
.folder-item.active > .folder-content {
  background: var(--folder-active);
  color: var(--text-primary);
}

.folder-toggle-icon {
  transition: transform var(--transition-normal);
}

.folder-item.expanded > .folder-content .folder-toggle-icon {
  transform: rotate(90deg);
}
```

### 11.3 标签过滤器

```css
.filter-tag.active {
  background: var(--accent-primary);
  color: white;
  animation: pulse var(--transition-normal) ease-out;
}
```

## 12. 无障碍设计

### 12.1 对比度

- 确保文字与背景的对比度至少为 4.5:1
- 重要信息的对比度至少为 7:1

### 12.2 动画控制

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 12.3 高对比度模式

```css
@media (prefers-contrast: high) {
  :root {
    --border-primary: #000000;
    --text-muted: #666666;
  }
  
  .btn {
    border-width: 2px;
  }
}
```

## 13. 主题系统

### 13.1 主题切换

```css
[data-theme="light"] {
  /* 浅色主题变量覆盖 */
}

[data-theme="dark"] {
  /* 深色主题变量（默认） */
}
```

### 13.2 主题色定制

```css
[data-accent="blue"] { --accent-primary: var(--accent-blue); }
[data-accent="purple"] { --accent-primary: var(--accent-purple); }
[data-accent="green"] { --accent-primary: var(--accent-green); }
```

## 14. 性能优化

### 14.1 硬件加速

```css
.optimized-element {
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### 14.2 重绘优化

```css
.hover-optimized:hover {
  will-change: transform, box-shadow;
}
```

## 15. 使用指南

### 15.1 引入样式

在HTML文件中引入主样式文件和图标系统：

```html
<!-- 主样式文件 -->
<link rel="stylesheet" href="styles/index.css">

<!-- 图标系统 -->
<link rel="stylesheet" href="components/Icon.css">
<script src="components/Icon.js"></script>

<!-- 页面图标 -->
<link rel="icon" type="image/svg+xml" href="images/icon.svg">
```

### 15.2 组件使用示例

#### 基本按钮
```html
<button class="btn btn-primary">
  <div data-icon="search" data-size="16"></div>
  按钮文字
</button>

<!-- 或者使用应用图标 -->
<button class="btn btn-primary">
  <div data-icon="app-icon" data-size="16"></div>
  书签助手
</button>
```

#### 卡片组件
```html
<div class="glass-card">
  <div class="widget-header">
    <div data-icon="folder" data-size="20" class="widget-icon"></div>
    <h3 class="widget-title">标题</h3>
  </div>
  <div class="widget-content">
    内容
  </div>
</div>
```

#### 书签项
```html
<div class="bookmark-item">
  <img class="favicon" src="icon.png" alt="">
  <div class="bookmark-info">
    <div class="bookmark-title">标题</div>
    <div class="bookmark-url">网址</div>
  </div>
  <div class="bookmark-tags">
    <span class="bookmark-tag">标签</span>
  </div>
</div>
```

## 16. 开发规范

### 16.1 命名约定

- 使用 BEM 命名方式：`.block__element--modifier`
- 组件类名使用描述性名称
- 状态类使用动词：`.is-active`, `.has-error`

### 16.2 CSS 编写规范

1. 使用 CSS 变量而不是硬编码值
2. 遵循移动优先的响应式设计
3. 合理使用继承和组合
4. 避免使用 `!important`
5. 保持选择器的低特异性

### 16.3 代码组织

```css
/* 1. 变量定义 */
:root {
  --custom-var: value;
}

/* 2. 基础样式 */
.component {
  /* 布局属性 */
  display: flex;
  
  /* 盒模型属性 */
  padding: var(--space-4);
  
  /* 视觉属性 */
  background: var(--bg-card);
  
  /* 动画属性 */
  transition: all var(--transition-normal);
}

/* 3. 状态样式 */
.component:hover {
  /* 悬停状态 */
}

/* 4. 响应式样式 */
@media (max-width: 768px) {
  .component {
    /* 移动端适配 */
  }
}
```

## 17. 维护指南

### 17.1 样式更新流程

1. 修改全局变量（如需要）
2. 更新对应的组件样式
3. 测试所有相关页面
4. 更新文档

### 17.2 兼容性检查

- 测试主流浏览器兼容性
- 检查无障碍功能
- 验证响应式表现
- 确认动画性能

### 17.3 代码审查要点

- 是否使用了标准的CSS变量
- 是否遵循命名约定
- 是否考虑了无障碍性
- 是否优化了性能

---

这个UI标准确保了整个书签助手项目的视觉一致性和用户体验统一性。所有新的组件和页面都应该遵循这些标准进行开发。

