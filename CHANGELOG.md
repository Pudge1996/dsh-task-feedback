# Changelog

本项目的所有重要改动都记录在此文件。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-10-11

### 新增

- **Desktop 平台识别**：新增 `src/client/platform.js`，通过 `<html data-platform>`、`window.dshDesktop` 预加载桥与 Electron UA 三重信号在运行时区分 Desktop 客户端与浏览器 Web。
- **Desktop 下隐藏「图标样式」设置分组**：Desktop 窗口没有标签栏，Favicon 指示不可见，因此该分组（标题 + 形状行 + 其分割线）在 Desktop 下不再渲染；同时「音效」标题自动成为首个子节点，顶部间距归零。
- **音效作用域纳入窗口失焦**：`仅失焦时` 现在同时覆盖标签页隐藏（Page Visibility API）与 `window` 的 `blur`（切到其他应用或窗口）。

### 变更

- 音效作用域文案：`仅当页面不可见时` → `仅失焦时`（英文 `Only when hidden` → `Only when unfocused`）。存储值仍为 `hidden`，已保存的偏好不受影响。
- 失焦/隐藏的瞬间会重新播种状态跟踪器，**不再补播「离开前已经看见过的」状态变化**；重新聚焦不清空跟踪器，`全部` 作用域的实时行为保持不变。
- Favicon 指示改为驱动页面上的全部 `link[rel="icon"]`——DSH 0.1.7-alpha.1 起壳层用 `media` 区分深浅色图标。
- 设置面板的下拉箭头兼容 DSH 0.1.7-alpha.1 的导出重命名（`IconChevronDownOutlineRegular`），并回退旧名 `IconChevronDownOutline14`。
- 设置面板样式改为随插件生命周期注入/移除，热重载不再叠加重复的 `<style>`。
- 主视图会话（`uiSession.adapter.current` → `SessionListState.current`）与待介入状态（`uiSession.sessionStatus` → `uiSession.pendingInteractions`）保持双代次兼容读取。
- `package.json`：声明 `dsh.client.inject: ["@deepseek-ai/dsh-client-ui-primitives"]`；`files` 由 `lib/*.js` 改为 `lib`，让发布包内的 `lib/client.js.map` 与产物中的 `sourceMappingURL` 引用一致；补入 `CHANGELOG.md`。
- README：安装章节补充 Desktop profile、新增「版本对照 / Version matrix」表、音效选项名与设置面板对齐、音效作用域说明补充窗口失焦。

## [0.1.0] - 2026-09-01

首次公开发布。对应提交 [`ad90e83`](https://github.com/Pudge1996/dsh-task-feedback/commit/ad90e83)。

### 新增

- **Favicon 状态指示**：标签页隐藏时按会话状态显示 绿色（已完成）/ 蓝色（进行中或子代理运行）/ 橙色（等待人工介入），支持小圆点、圆形、圆角矩形三种形状。
- **音效通知**：12 个基于 Web Audio API 实时合成的音效，可分别配置「需要你介入」与「任务已完成」，鼠标悬停即可试听。
- **音效作用域**：`全部` 与 `仅当页面不可见时`。
- **设置 → 反馈** 面板，所有选项持久化在 localStorage 中。

[0.2.0]: https://github.com/Pudge1996/dsh-task-feedback/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Pudge1996/dsh-task-feedback/releases/tag/v0.1.0
