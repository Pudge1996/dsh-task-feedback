# dsh-task-feedback

[![npm version](https://img.shields.io/npm/v/dsh-task-feedback)](https://www.npmjs.com/package/dsh-task-feedback)
[![license](https://img.shields.io/npm/l/dsh-task-feedback)](https://github.com/Pudge1996/dsh-task-feedback/blob/main/LICENSE)

[中文](README.md) | English

A session status feedback plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Built from a real pain point:

> When you switch to another tab or step away from your computer, you have no way of knowing whether the agent has finished its response or needs your input.

## Install

```sh
dsh plugin --profile web add dsh-task-feedback
```

## Favicon indicator

When you switch away from the tab, the DSH favicon turns into a coloured dot that reflects the current session state in real time:

1. **Green** — the current task has completed.
2. **Blue** — the current task is in progress or a subagent is running.
3. **Amber** — needs your input (approval, plan confirmation, answering a question, etc.).

Design decisions:

1. The favicon only changes when the tab is hidden (powered by the native [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)).
2. If the session was already idle or completed, the favicon stays as the default whale (minimum distraction).
3. Configurable shapes: `Small dot` | `Circle` | `Rounded rectangle`.

## Sound notifications

12 hand-picked synthesised sounds. Choose different sounds for "task done" and "needs your input", and control when they play:

1. `Always` — play sound notifications regardless of tab visibility, whenever the session completes or needs your input.
2. `Only when hidden` — only play when the tab is not visible (switched away, minimised, display off, etc.), powered by the native [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

**Tech highlight** — all sounds are synthesised in real time via the [Web Audio API](https://github.com/m1ckc3s/procedural-sounds) with zero external dependencies. Hover over any sound option in the settings to preview it.

All settings (favicon shape, sound scope, sound selection) are configured in **Settings → Feedback** and persisted to localStorage.

## Notes

- **Tested against DSH v0.1.2-alpha.1**
- **Frontend only** — no custom protocols, no host commands, no LLM calls, no session-log entries.
- **Stable hooks** — reads session state, subagent activity, and pending interactions through DSH's standard `sessions` and `uiSession` services.
- **Roadmap** — custom sound uploads, system-level notifications.
- **Limitations** — `/goal` mode is not yet supported.

## License

MIT