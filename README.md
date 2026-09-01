# dsh-task-feedback

[![npm version](https://img.shields.io/npm/v/dsh-task-feedback)](https://www.npmjs.com/package/dsh-task-feedback)
[![license](https://img.shields.io/npm/l/dsh-task-feedback)](https://github.com/Pudge1996/dsh-task-feedback/blob/main/LICENSE)

中文 | [English](README.en.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的会话状态反馈插件。基于真实使用痛点而做：

> 切到其他标签页或离开电脑时，无法实时感知到 Agent 是否已完成回复，或是否需要人工介入。
  
## 安装

```sh
dsh plugin --profile web add dsh-task-feedback
```

## Favicon 小圆点实时回显会话状态

切走标签页时，将 DSH 的 Favicon 改为小圆点并根据会话状态实时变色：

1. **绿色**：当前任务已完成
2. **蓝色**：当前任务进行中或子代理正在运行
3. **橙色**：需要人工介入（等待审批、计划确认或回答问题等）
  
设计巧思：

1. 在切走标签页时，才会根据状态更改 Favicon（原生 [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) 实现）
2. 若会话本身已经处于空闲/完成状态，Favicon 仍然显示默认的小鲸鱼（最低打扰设计）
3. 支持配置多种形状：`小圆点` | `圆形` | `圆角矩形`

## 音效提示

人工精选了 12 个合成音效，可以为「任务已完成」和「需要你介入」分别选择不同的音效，并控制播放时机：

1. `始终播放`：无论页面是否可见，只要当前会话已完成或需要人工介入，就播放音频提示；
2. `仅页面不可见时播放`：仅在页面不可见时（切走标签页、最小化、关闭显示器等）播放音频（原生 [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) 实现）

**技术亮点** - 所有可选音效均由 [Web Audio API](https://github.com/m1ckc3s/procedural-sounds) 合成，零外部依赖。鼠标悬停即可试听。

所有设置项（Favicon 形状、音效作用域、音效选择）均在 **设置 → 反馈** 中配置，持久化在 localStorage 中。

## 其他说明

- **从 DSH v0.1.2-alpha.1 开始适配**
- **纯前端** — 无自定义协议、无 host 命令、无 LLM 调用、不进会话日志
- **稳定钩子** - 接入 DSH 的 sessions 与 uiSession 标准服务获取任务的运行状态、子代理活动和待介入事件
- **后续计划** - 支持用户上传自定义音效、支持系统级通知
- **注意事项** - 暂不支持 `/goal` 模式

## License

MIT