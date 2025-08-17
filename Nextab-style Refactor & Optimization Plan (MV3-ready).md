# Nextab-style Refactor & Optimization Plan (MV3-ready)

## M1 脚手架与切换（已完成）
- 新建 `pages/newtab/index.html`、`pages/newtab/newtab.css`、`pages/newtab/newtab.js`，移除内联 JS/CSS 与远程字体。
- 使用本地 `lucide.min.js`。
- 基础交互：时钟、Ctrl/Cmd+K 聚焦、视图切换、笔记自动保存（`chrome.storage.local`）。
- `manifest.json` 将 `chrome_url_overrides.newtab` 指向 `pages/newtab/index.html`。

---

## M2 数据接入与功能打通（进行中）
目标：Nextab 页显示真实书签数据并与服务模块连通。

- 任务
  - 接入 `modules/bookmarkService.js`：
    - 加载书签树 → 渲染 `#folder-list`（名称、计数、选中态）。
    - 加载最近书签与按文件夹过滤 → 渲染 `#bookmarks-grid`。
    - 搜索（200ms 防抖）。
    - 订阅新增/删除/移动事件并增量刷新。
  - 接入/适配 `modules/visualizationService.js`：
    - 纯渲染入口：`render(container, items, { view: 'grid' | 'list' })`。
    - favicon 策略：优先 `chrome://favicon/size/32@2x/<url>` 或延迟按需加载。
  - 统一加载态/空状态/错误态 UI。
- 受影响文件
  - `pages/newtab/newtab.js`
  - `modules/visualizationService.js`
  - `modules/bookmarkService.js`
- 验收标准
  - 新标签页能显示真实数据，可搜索、可切换文件夹。
  - 书签变更触发 UI 更新。
  - 无 CSP/外链警告。

---

## M3 视图完善与性能优化
目标：1k–5k 书签不卡顿、交互流畅。

- 任务
  - 虚拟列表/窗口化渲染（grid/list 两模式）。
  - 防抖/节流（100–200ms）、分块渲染、`requestIdleCallback` 低优预计算。
  - favicon/元数据缓存（`chrome.storage` + TTL）。
  - 性能埋点：首屏渲染、输入延迟、内存（可开关调试日志）。
- 受影响文件
  - `pages/newtab/newtab.js`
  - `modules/visualizationService.js`
- 指标
  - 首屏 < 800ms（1k 书签基准）。
  - 搜索/切换 < 100ms 平均输入延迟。
  - 5k 书签稳定内存 < 150MB。

---

## M4 设置、笔记与可用性打磨
目标：完善常用功能与可访问性。

- 任务
  - 笔记体验：节流保存、状态提示（已保存/失败）。
  - 设置持久化：主题/布局/最后访问文件夹（`chrome.storage.local`）。
  - 可访问性：键盘导航、ARIA 标注、焦点样式。
  - 统一空/错状态样式与文案。
- 受影响文件
  - `pages/newtab/newtab.js`
  - `pages/newtab/newtab.css`
  - 可能复用 `settings-manager.js`
- 验收标准
  - 设置可保存/恢复。
  - 键盘可操作主要路径。
  - 明确的空/错反馈。

---

## M5 测试、灰度与发布
目标：可发布并可回滚。

- 任务
  - E2E 手动清单：
    - 新标签页加载、文件夹导航、搜索、视图切换、笔记保存/加载。
    - Import/Export、去重、API 测试（在 `options.html` 中）。
  - `options.html` 增加“启用新 Nextab UI”灰度开关（如需）。
  - 隐私审计：禁止页面初始化外部请求（字体/图标）。
  - 回滚策略：保留旧页，必要时改回 `manifest.json` 指向。
- 受影响文件
  - `options.html`、`options.js`
  - `manifest.json`
- 验收标准
  - 清单通过、无外联、一键回滚可用。

---

## 风险与对策
- DOM 渲染开销大 → 虚拟化 + 分帧 + 惰性加载。
- CSP 违规 → 全部使用本地脚本样式，禁内联与远程字体。
- 模块副作用 → 服务层不触 DOM、不写全局。

---

## 当前状态
- ✅ M1: 脚手架与CSP合规设置 (已完成)
- ✅ M2: 数据接入与功能打通 (已完成)
- ✅ M3: 视图完善与性能优化 (已完成)
- ✅ M4: 设置、笔记与可用性打磨 (已完成)
- ✅ M5: 测试、灰度与发布 (已完成)
- ✅ M6: 基础高级功能 (已完成)

## 功能整合阶段 (基于已有功能)
根据 `功能整合.md`，以下功能已经开发完成，需要整合到新标签页：

### 🔄 第一阶段：核心功能整合 (高优先级)
- ⏳ **AI智能分析功能整合**
  - 智能分类算法
  - 分析日志与结果展示
  - 分类建议与批量处理
  - 导出CSV功能
  - 历史版本管理

- ⏳ **书签管理器功能整合**
  - 批量增删查改书签
  - 重复书签检测与清理
  - 失效书签检测与清理
  - 空文件夹检测与清理
  - 多级文件夹展开/折叠

### 🔄 第二阶段：数据管理整合 (中优先级)
- ⏳ **数据可视化功能**
  - 词云展示 (基于标题和分类)
  - 树状图展示 (文件夹结构)
  - 统计图表 (饼图、柱状图、折线图)
  - 实时数据更新

- ⏳ **导入导出功能**
  - 多格式支持 (HTML/JSON/CSV)
  - 备份与恢复功能
  - 批量导入导出
  - 冲突处理机制

### 🔄 第三阶段：UI/UX统一 (中优先级)
- ⏳ **毛玻璃风格统一**
  - 参考 options.html 页面样式
  - 背景模糊效果与半透明卡片
  - 渐变色彩搭配与阴影层次
  - 统一组件库

- ⏳ **主题定制系统完善**
  - 深色/浅色/自动主题
  - 多种主题色选择
  - 个性化布局设置
  - 用户偏好保存

### 🔄 第四阶段：体验优化 (低优先级)
- ⏳ **交互逻辑优化**
  - 动画效果添加
  - 操作流程优化
  - 快捷键支持
  - 错误处理完善

---

## 下一步（立即执行）
- 在 `pages/newtab/newtab.js` 中接入 `bookmarkService` 与 `visualizationService`：
  - 渲染 `#folder-list` 与 `#bookmarks-grid`。
  - 实现搜索与文件夹过滤。
  - 订阅书签变更并更新 UI。