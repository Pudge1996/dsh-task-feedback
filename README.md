# dsh-task-feedback

[![npm version](https://img.shields.io/npm/v/dsh-task-feedback)](https://www.npmjs.com/package/dsh-task-feedback)
[![license](https://img.shields.io/npm/l/dsh-task-feedback)](https://github.com/Pudge1996/dsh-task-feedback/blob/main/LICENSE)

中文 | [English](README.en.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的会话状态反馈插件。基于真实使用痛点而做：

> 切到其他标签页或离开电脑时，无法实时感知到 Agent 是否已完成回复，或是否需要人工介入。

## 安装

```sh
# 浏览器访问的 Web profile
dsh plugin --profile web add dsh-task-feedback

# Desktop 客户端 profile
dsh plugin --profile desktop add dsh-task-feedback
```

## 版本对照

DSH 的客户端 API 在 `rc.x` → `alpha.x` 之间**前向不兼容**：装错版本不会优雅降级，而是在运行时直接报错（常见症状 `TypeError: useConversation is not a function`）。请按你的 DSH 版本选择插件版本：

| 你的 DSH | 建议安装 |
|---|---|
| `0.2.x`（已在 `v0.2.1-alpha.2` 上实测） | `dsh plugin --profile <profile> add dsh-task-feedback`（最新，当前 `0.2.0`） |
| `0.1.2-alpha.1` ~ `0.1.x` | `dsh plugin --profile <profile> add dsh-task-feedback@0.1.0` |

> 主视图会话与待介入状态的读取都做了双代次兼容，`0.2.0` 在旧版 DSH 上通常也能运行；但上表中只有 `0.2.0` × `v0.2.1-alpha.2` 这一组经过本版本实测。

## Favicon 实时回显会话状态

切走标签页时，把 DSH 的 Favicon 换成状态指示图标（默认小圆点，可在设置中改为圆形或圆角矩形），并根据会话状态实时变色：

<img width="1207" height="1198" alt="image" src="https://github.com/user-attachments/assets/da0949a8-3428-4eab-a9a4-83d22ee89d15" />

1. **绿色**：当前任务已完成
2. **蓝色**：当前任务进行中或子代理正在运行
3. **橙色**：需要人工介入（等待审批、计划确认或回答问题等）

设计巧思：

1. 在切走标签页时，才会根据状态更改 Favicon（原生 [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) 实现）
2. 若会话本身已经处于空闲/完成状态，Favicon 仍然显示默认的小鲸鱼（最低打扰设计）
3. 支持配置多种形状：`小圆点` | `圆形` | `圆角矩形`
4. **形状设置仅在 Web 模式提供**：Desktop 客户端窗口没有浏览器标签栏，Favicon 不可见，因此设置中的「图标样式」分组会在 Desktop 下自动隐藏

## 音效提示

<img width="1109" height="625" alt="image" src="https://github.com/user-attachments/assets/27897447-5de5-4301-872a-86c01494daf2" />

人工精选了 12 个合成音效，可以为「任务已完成」和「需要你介入」分别选择不同的音效，并控制播放时机：

1. `全部`：无论页面是否失焦，只要当前会话已完成或需要人工介入，就播放音频提示；
2. `仅失焦时`：仅在页面失焦时播放音频——切走标签页、最小化、关闭显示器（原生 [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)），或切到其他应用/窗口导致窗口失焦（`window` 的 `blur` 事件）

**技术亮点** - 所有可选音效均由 [Web Audio API](https://github.com/m1ckc3s/procedural-sounds) 合成，零外部依赖。鼠标悬停即可试听。

所有设置项（Favicon 形状、音效作用域、音效选择）均在 **设置 → 反馈** 中配置，持久化在 localStorage 中。

## 其他说明

- **从 DSH v0.1.2-alpha.1 开始适配，已在 DSH v0.2.1-alpha.2 上验证**（主视图会话与待介入状态均为双代次兼容读取）
- **双模式适配** — 已在浏览器（Web）与 Desktop 客户端两种模式下验证；Favicon 相关的可视化仅在 Web 模式下可见
- **纯前端** — 无自定义协议、无 host 命令、无 LLM 调用、不进会话日志
- **稳定钩子** - 接入 DSH 的 sessions 与 uiSession 标准服务获取任务的运行状态、子代理活动和待介入事件
- **后续计划** - 支持用户上传自定义音效、支持系统级通知
- **注意事项** - 暂不支持 `/goal` 模式

## License

MIT