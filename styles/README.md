# 书签助手 UI 样式标准系统

## 概述

这个目录包含了书签助手项目的统一UI样式标准，基于 `pages/newtab/index.css` 建立了完整的设计系统。

## 文件结构

```
styles/
├── index.css                 # 🎯 主入口文件 - 统一导入点
├── global-ui-standards.css   # 🌐 全局基础样式和CSS变量
├── component-standards.css   # 🧩 通用组件样式标准
├── page-standards.css        # 📄 页面专用样式标准
└── README.md                 # 📖 本说明文件
```

## 使用方法

### 1. 引入样式

在任何HTML文件中，只需引入主入口文件：

```html
<link rel="stylesheet" href="styles/index.css">
```

### 2. 使用标准组件

所有组件都有预定义的样式类：

```html
<!-- 按钮 -->
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-success">成功按钮</button>
<button class="btn btn-danger">危险按钮</button>

<!-- 卡片 -->
<div class="card">标准卡片</div>
<div class="glass-card">毛玻璃卡片</div>

<!-- 输入框 -->
<input type="text" class="input" placeholder="标准输入框">

<!-- 标签 -->
<span class="tag">标签</span>
<span class="tag active">活跃标签</span>
```

### 3. 使用设计令牌（CSS变量）

在自定义样式中使用预定义的变量：

```css
.my-component {
  /* 颜色 */
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  
  /* 间距 */
  padding: var(--space-4);
  margin: var(--space-2);
  
  /* 圆角 */
  border-radius: var(--radius-lg);
  
  /* 阴影 */
  box-shadow: var(--shadow-card);
  
  /* 动画 */
  transition: all var(--transition-normal);
}
```

## 设计令牌系统

### 颜色系统

```css
/* 背景色 */
--bg-primary: #0f0f0f           /* 主背景 */
--bg-secondary: rgba(26,26,26,0.8)  /* 次要背景 */
--bg-card: rgba(26,26,26,0.7)       /* 卡片背景 */

/* 文字色 */
--text-primary: #ffffff         /* 主要文字 */
--text-secondary: #b3b3b3       /* 次要文字 */
--text-muted: #666666           /* 弱化文字 */

/* 主题色 */
--accent-blue: #3b82f6          /* 蓝色 */
--accent-green: #10b981         /* 绿色 */
--accent-red: #ef4444           /* 红色 */
```

### 间距系统

```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
```

### 圆角系统

```css
--radius-sm: 0.375rem    /* 6px */
--radius-md: 0.5rem      /* 8px */
--radius-lg: 0.75rem     /* 12px */
--radius-xl: 1rem        /* 16px */
--radius-2xl: 1.5rem     /* 24px */
--radius-full: 9999px    /* 圆形 */
```

## 主题支持

### 深色/浅色主题

系统支持自动主题切换：

```css
/* 深色主题（默认） */
[data-theme="dark"] {
  --bg-primary: #0f0f0f;
  --text-primary: #ffffff;
}

/* 浅色主题 */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #212529;
}

/* 自动检测系统主题 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    /* 浅色主题变量 */
  }
}
```

### 主题色定制

```css
[data-accent="blue"] { --accent-primary: var(--accent-blue); }
[data-accent="green"] { --accent-primary: var(--accent-green); }
[data-accent="purple"] { --accent-primary: var(--accent-purple); }
```

## 组件库

### 按钮组件

| 类名 | 描述 | 使用场景 |
|------|------|----------|
| `.btn` | 基础按钮 | 默认样式 |
| `.btn-primary` | 主要按钮 | 主要操作 |
| `.btn-success` | 成功按钮 | 确认操作 |
| `.btn-warning` | 警告按钮 | 警告操作 |
| `.btn-danger` | 危险按钮 | 删除操作 |
| `.btn-ghost` | 幽灵按钮 | 次要操作 |
| `.btn-sm` | 小按钮 | 紧凑空间 |
| `.btn-lg` | 大按钮 | 重要操作 |

### 卡片组件

| 类名 | 描述 | 特效 |
|------|------|------|
| `.card` | 标准卡片 | 基础阴影 |
| `.glass-card` | 毛玻璃卡片 | 背景模糊 |
| `.widget` | 组件卡片 | 悬停动画 |

### 书签专用组件

| 类名 | 描述 | 用途 |
|------|------|------|
| `.bookmark-item` | 书签项 | 单个书签 |
| `.bookmark-card` | 书签卡片 | 卡片视图 |
| `.folder-item` | 文件夹项 | 文件夹树 |
| `.filter-tag` | 标签过滤器 | 标签筛选 |

## 响应式设计

系统采用移动优先的响应式设计：

```css
/* 移动端（默认） */
.component { /* 移动端样式 */ }

/* 平板端 */
@media (max-width: 768px) {
  .component { /* 平板端适配 */ }
}

/* 桌面端 */
@media (max-width: 1024px) {
  .component { /* 桌面端适配 */ }
}
```

## 无障碍支持

### 动画控制

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 高对比度模式

```css
@media (prefers-contrast: high) {
  :root {
    --border-primary: #000000;
    --text-muted: #666666;
  }
}
```

## 性能优化

### 硬件加速

所有动画元素都启用了硬件加速：

```css
.optimized-element {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
```

### GPU 优化

优先使用GPU友好的CSS属性：

```css
/* ✅ 推荐 - GPU 友好 */
transform: translateY(-2px);
opacity: 0.8;

/* ❌ 避免 - 引起重绘 */
top: -2px;
background-position: center;
```

## 开发规范

### 1. 命名约定

- 使用 BEM 命名方式：`.block__element--modifier`
- 组件类名使用描述性名称
- 状态类使用动词前缀：`.is-active`, `.has-error`

### 2. CSS 编写顺序

```css
.component {
  /* 1. 定位属性 */
  position: relative;
  top: 0;
  
  /* 2. 盒模型属性 */
  display: flex;
  width: 100%;
  padding: var(--space-4);
  margin: var(--space-2);
  
  /* 3. 视觉属性 */
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  
  /* 4. 字体属性 */
  font-size: 0.875rem;
  font-weight: 500;
  
  /* 5. 动画属性 */
  transition: all var(--transition-normal);
}
```

### 3. 变量使用规则

1. 优先使用设计令牌变量
2. 避免硬编码数值
3. 新增变量需要文档说明
4. 保持向后兼容性

## 常见问题

### Q: 如何自定义主题色？

A: 在 HTML 标签上设置 `data-accent` 属性：

```html
<html data-theme="dark" data-accent="purple">
```

### Q: 如何创建自定义组件？

A: 继承基础样式，使用标准变量：

```css
.my-button {
  @extend .btn;
  background: var(--accent-purple);
  color: white;
}
```

### Q: 如何优化动画性能？

A: 使用 transform 和 opacity，避免改变布局属性：

```css
/* ✅ 性能友好 */
.element:hover {
  transform: translateY(-2px) scale(1.02);
  opacity: 0.9;
}

/* ❌ 性能较差 */
.element:hover {
  top: -2px;
  width: 102%;
  height: 102%;
}
```

## 更新日志

### v1.0.0 (2024-12)
- ✨ 建立统一UI样式标准系统
- 🎨 基于 index.css 创建设计令牌
- 📱 完善响应式设计支持
- ♿ 添加无障碍功能支持
- ⚡ 性能优化和硬件加速

---

📚 **相关文档**: 
- [UI设计标准完整文档](../docs/UI设计标准.md)
- [开发文档](../docs/开发文档.md)

💡 **提示**: 如有任何样式相关问题，请优先查阅 [UI设计标准文档](../docs/UI设计标准.md)。


