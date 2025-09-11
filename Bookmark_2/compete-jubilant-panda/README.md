# 书签智能工作台 - React版

一个基于React + TypeScript + Plasmo构建的Chrome扩展，使用AI自动分类并整理浏览器书签。

## 🚀 功能特性

### 📊 数据可视化
- **词云展示**: 基于书签标题生成词云
- **分类图表**: 书签分类统计图表
- **活动热力图**: 书签创建时间分布

### 🤖 智能分析
- **AI智能分类**: 使用AI自动分类书签
- **重复检测**: 自动检测重复书签
- **失效链接检测**: 检测无法访问的书签
- **空文件夹清理**: 清理空的书签文件夹

### 📂 书签管理
- **网格/列表视图**: 多种显示模式
- **搜索和过滤**: 快速查找书签
- **批量操作**: 批量管理书签
- **导入导出**: 数据备份和恢复

### 🎨 个性化设置
- **主题切换**: 深色/浅色/自动主题
- **主题色**: 多种主题色选择
- **响应式设计**: 适配不同屏幕尺寸

## 🛠️ 技术栈

- **React 18**: 现代化的用户界面库
- **TypeScript**: 类型安全的JavaScript
- **Plasmo**: Chrome扩展开发框架
- **Chrome Extension APIs**: 书签、存储、标签页等API
- **CSS Variables**: 动态主题系统

## 📁 项目结构

```
src/
├── pages/                 # 页面组件
│   ├── Dashboard.tsx     # 仪表盘页面
│   ├── Analysis.tsx      # 智能分析页面
│   └── NewTab.tsx        # 新标签页
├── services/             # 服务层
│   ├── bookmarkService.ts      # 书签服务
│   ├── visualizationService.ts # 可视化服务
│   ├── detectionService.ts     # 检测服务
│   ├── apiService.ts          # API服务
│   └── importExportService.ts  # 导入导出服务
├── styles/               # 样式文件
│   ├── globals.css       # 全局样式
│   ├── components.css    # 组件样式
│   └── popup.css         # 弹窗样式
├── App.tsx              # 主应用组件
└── popup.tsx           # 弹窗组件
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
# 或
pnpm dev
```

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

## 📦 安装扩展

### 开发环境
1. 运行 `npm run dev`
2. 打开Chrome扩展管理页面 (`chrome://extensions/`)
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `build/chrome-mv3-dev` 文件夹

### 生产环境
1. 运行 `npm run build`
2. 选择 `build/chrome-mv3-prod` 文件夹进行安装

## 🔧 开发指南

### 添加新页面
1. 在 `src/pages/` 目录下创建新的 `.tsx` 文件
2. 在 `src/App.tsx` 中添加路由
3. 更新导航栏

### 添加新服务
1. 在 `src/services/` 目录下创建新的 `.ts` 文件
2. 使用React Hooks模式封装逻辑
3. 添加TypeScript类型定义

### 样式开发
- 使用CSS变量进行主题管理
- 遵循响应式设计原则
- 使用现有的组件样式类

## 🧪 测试

### 功能测试
- [ ] 书签数据加载
- [ ] 搜索和过滤
- [ ] 可视化图表
- [ ] 智能分析
- [ ] 主题切换

### 兼容性测试
- [ ] Chrome扩展环境
- [ ] 浏览器环境
- [ ] 不同屏幕尺寸

## 📝 更新日志

### v2.0.0 (2024-01)
- ✅ 完成React + TypeScript迁移
- ✅ 重构所有页面组件
- ✅ 实现服务层架构
- ✅ 优化性能和用户体验
- ✅ 更新manifest配置

### v1.0.0 (原始版本)
- 基于原生JavaScript的Chrome扩展
- 基础的书签管理功能
- 简单的数据可视化

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Plasmo文档](https://docs.plasmo.com/)
- [Chrome扩展开发指南](https://developer.chrome.com/docs/extensions/)
- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/)

---

**开发团队**: LuoYuan <luoyuan@ifree8.cn>
