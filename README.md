# dsh-feedback

Live session status on the browser tab favicon and configurable Web Audio notification sounds.

When the browser tab is hidden, the favicon changes colour to reflect the current session's state:

- **Green** — a running task finished while you were away
- **Blue** — agent or subagent is running
- **Amber** — waiting for your approval, plan review, or answer

The indicator is a *change notification*, not a live status mirror. When the session was already idle at the moment you switched away, no indicator is shown — there is nothing new to report.

Sound notifications are synthesised in real time via Web Audio API with zero external dependencies. You can pick different sounds for "needs your input" and "task done" events, and control when they play (always, or only when the tab is hidden).

All settings — favicon shape, sound scope, and sound selection — are configured in **Settings → Feedback** and persisted to localStorage.

## Install

```sh
dsh plugin --profile web add Pudge1996/dsh-feedback
```

Or via npm:

```sh
dsh plugin --profile web add dsh-feedback
```

## Uninstall

```sh
dsh plugin --profile web remove dsh-feedback
```

## Settings

| Setting | Options | Default |
|---------|---------|---------|
| Favicon shape | Small dot, Circle, Rounded rectangle | Small dot |
| When to play sounds | Always, Only when hidden | Always |
| Needs your input | 10 procedural sounds + None | Ethereal |
| Task done | 10 procedural sounds + None | Ripple |

## License

MIT