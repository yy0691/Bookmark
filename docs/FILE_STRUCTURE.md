# 项目文件结构分析

本文档分析了当前项目的文件结构，对文件进行分类，并指出了可能可以被清理或归档的文件。

## 一、 核心扩展文件 (Essential Files)

这些是根据 `manifest.json` 定义的浏览器扩展运行所必需的核心文件。

-   `manifest.json`: 扩展的清单文件，定义了所有核心组件、权限和设置。
-   `popup.html` & `popup.js`: 点击浏览器工具栏图标时显示的弹出窗口的界面和逻辑。
-   `options.html` & `options.js`: 扩展的设置页面。
-   `background.js`: 事件处理脚本，作为扩展的 Service Worker 运行。
-   `pages/newtab/index.html` & `index.js`: 自定义新标签页。
-   `pages/newtab/dashbord.html` & `dashbord.js`: 书签数据分析Dashboard页面。
-   `images/*.svg`: 扩展在浏览器界面中显示的图标。

## 二、 模块化代码 (Modular Code)

项目遵循模块化开发的思想，将功能拆分到不同模块。

-   `modules/`: 存放核心功能模块。
    -   `bookmarkService.js`: 处理书签的增删改查。
    -   `uiManager.js`: 负责UI的更新和交互。
    -   `apiService.js`: 与外部API（可能是AI服务）通信。
    -   `utils.js`: 提供通用工具函数。
    -   `visualizationService.js`: 书签可视化服务。
    -   `detectionService.js`: 用于检测无效或重复书签的服务。
    -   `importExportService.js`: 负责导入导出功能。
-   `components/`: 可重用的UI组件。
    -   `Icon.js` & `Icon.css`: 封装的图标组件。
    -   `UI/`: 更复杂的UI组件目录。
        -   `Dialog.js` & `Dialog.css`: 对话框组件。
        -   `SettingsPanel.js` & `SettingsPanel.css`: 设置面板组件。

## 三、 样式文件 (Styles)

-   `styles/`: 全局和标准的样式定义。
    -   `global-ui-standards.css`: 全局UI标准。
    -   `component-standards.css`: 组件设计标准。
    -   `page-standards.css`: 页面级样式标准。
-   `apple-style-improved.css`: 可能是某个UI的主要样式文件。
-   `settings-manager.css`: 设置管理器的样式。
-   `workbench-enhancements.css`: 工作台的增强样式。
-   `visualization-enhanced.css`: 可视化页面的增强样式。

## 四、 功能页面与工具 (Feature Pages & Tools)

除了核心的 popup 和 options 页面，项目还包含其他用于特定功能的HTML文件。

-   `bookmark-manager.html` & `bookmark-manager.js`: 功能齐全的书签管理主界面。
-   `detailed-analysis.html` & `detailed-analysis.js`: 书签深度分析页面。
-   `visualization.html` & `visualization.js`: 书签关系可视化页面。
-   `history.html` & `history.js`: 浏览历史或操作历史页面。
-   `workbench-demo.html`: 用于演示或测试组件的工作台。
-   `lucide-icons.js` & `lucide.min.js`: Lucide 图标库。

## 五、 配置文件 (Configuration)

-   `.gitignore`: 定义了Git应忽略的文件和目录。
-   `.hintrc`: Webhint 的配置文件，用于代码质量检查。
-   `package.json` & `package-lock.json`: Node.js 项目依赖和版本锁定文件。

## 六、 文档 (Documentation)

-   `docs/`: 存放项目文档。
-   `README.md`: 项目的主要说明文件。
-   各种 `.md` 文件: 如 `MODULAR_GUIDE.md`, `OPTIMIZATION_PLAN.md` 等，记录了开发过程中的思考和计划。

## 七、 可能无用或可归档的文件 (Potentially Unused/Archivable)

以下文件根据其命名和功能推测，可能是开发过程中的备份、旧版本或测试代码。**在删除前，请仔细确认它们是否已不再被任何地方引用。**

-   **备份文件:**
    -   `detailed-analysis-backup.html`
    -   `detailed-analysis-backup.js`
    -   `visualization-backup.js`
    -   `backup/visualization-version1.html`
    -   `backup/visualization-version1.js`

-   **旧版本或已重构版本:**
    -   `detailed-analysis-old.js`
    -   `detailed-analysis-fixed.js` (可能修复后已被 `detailed-analysis.js` 合并)
    -   `apple-style.css` (可能已被 `apple-style-improved.css` 替代)
    -   `analyze.js`, `analyze_clean.js`, `analyze_modular.js`, `analyze.html` (功能可能已被 `detailed-analysis.js` 或其他模块替代)
    -   `visualization-enhanced.js`, `visualization-enhanced-clean.js` (功能可能已被 `visualization.js` 和 `visualizationService.js` 整合)

-   **测试或演示页面:**
    -   `test_modular.html`
    -   `ui-preview.html`
    -   `icon-demo.html`
    -   `nextab-inspired.html`
    -   `manifest-test.json`

-   **功能单一且可能已整合的文件:**
    -   `bookmarkProcessor.js` (功能可能已并入 `bookmarkService.js`)
    -   `library-checker.js` (一次性检查脚本)
    -   `animation-optimizer.js` (功能可能已在全局CSS或JS中实现)

**建议:**
在删除这些文件之前，建议先将它们移动到一个单独的 `_archive` 文件夹中。运行并全面测试扩展，确保所有功能正常。如果一周或更长时间内没有出现问题，再考虑永久删除。
