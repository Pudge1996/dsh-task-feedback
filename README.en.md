# dsh-task-feedback

[![npm version](https://img.shields.io/npm/v/dsh-task-feedback)](https://www.npmjs.com/package/dsh-task-feedback)
[![license](https://img.shields.io/npm/l/dsh-task-feedback)](https://github.com/Pudge1996/dsh-task-feedback/blob/main/LICENSE)

[中文](README.md) | English

A session status feedback plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Built from a real pain point:

> When you switch to another tab or step away from your computer, you have no way of knowing whether the agent has finished its response or needs your input.

## Install

```sh
# Browser-served Web profile
dsh plugin --profile web add dsh-task-feedback

# Desktop app profile
dsh plugin --profile desktop add dsh-task-feedback
```

## Version matrix

The DSH client API is **not forward-compatible** across `rc.x` → `alpha.x`: a wrong pick does not degrade gracefully, it crashes at runtime (common symptom: `TypeError: useConversation is not a function`). Pick the plugin version that matches your DSH:

| Your DSH | Install |
|---|---|
| `0.2.x` (verified on `v0.2.1-alpha.2`) | `dsh plugin --profile <profile> add dsh-task-feedback` (latest, currently `0.2.0`) |
| `0.1.2-alpha.1` – `0.1.x` | `dsh plugin --profile <profile> add dsh-task-feedback@0.1.0` |

> The main-view session and pending-interaction reads are dual-generation compatible, so `0.2.0` usually runs on older DSH as well; only the `0.2.0` × `v0.2.1-alpha.2` pairing above has been verified for this release.

## Favicon indicator

When you switch away from the tab, the DSH favicon turns into a coloured dot that reflects the current session state in real time:

<img width="1207" height="1198" alt="image" src="https://github.com/user-attachments/assets/02da79be-5b5e-4f9a-9da0-c5df19d2d937" />

1. **Green** — the current task has completed.
2. **Blue** — the current task is in progress or a subagent is running.
3. **Amber** — needs your input (approval, plan confirmation, answering a question, etc.).

Design decisions:

1. The favicon only changes when the tab is hidden (powered by the native [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)).
2. If the session was already idle or completed, the favicon stays as the default whale (minimum distraction).
3. Configurable shapes: `Small dot` | `Circle` | `Rounded rectangle`.
4. **The shape setting is Web-only** — a Desktop shell window has no browser tab strip, so the favicon is never visible there and the "Favicon shape" group is hidden in Settings.

## Sound notifications

<img width="1121" height="628" alt="image" src="https://github.com/user-attachments/assets/f6cd6147-e6ea-408d-8172-eda159ef4f3b" />

12 hand-picked synthesised sounds. Choose different sounds for "task done" and "needs your input", and control when they play:

1. `Always` — play sound notifications regardless of tab visibility, whenever the session completes or needs your input.
2. `Only when unfocused` — only play while the page is away from you: the tab is hidden (switched away, minimised, display off — native [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)) or the window lost focus because you switched to another application (the `window` `blur` event).

**Tech highlight** — all sounds are synthesised in real time via the [Web Audio API](https://github.com/m1ckc3s/procedural-sounds) with zero external dependencies. Hover over any sound option in the settings to preview it.

All settings (favicon shape, sound scope, sound selection) are configured in **Settings → Feedback** and persisted to localStorage.

## Notes

- **Tested from DSH v0.1.2-alpha.1, verified on DSH v0.2.1-alpha.2** (main-view session and pending-interaction reads stay generation-tolerant)
- **Dual-mode** — verified under both the browser (Web) profile and the Desktop client; everything favicon-related is only visible in Web mode.
- **Frontend only** — no custom protocols, no host commands, no LLM calls, no session-log entries.
- **Stable hooks** — reads session state, subagent activity, and pending interactions through DSH's standard `sessions` and `uiSession` services.
- **Roadmap** — custom sound uploads, system-level notifications.
- **Limitations** — `/goal` mode is not yet supported.

## License

MIT