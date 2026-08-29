/**
 * Status indicator settings section — browser half.
 *
 * Renders a dropdown menu (primitives.Menu) for picking one of three
 * favicon indicator shapes, a sound scope selector, and two sound
 * pickers for warning and done notifications. All selections are
 * persisted to localStorage and take effect immediately.
 *
 * Sound ids are sourced from sounds.js (which derives them from
 * procedural-patches.js).  Patch labels are registered into the
 * locale system by index.js via the `soundXxx` keys.
 *
 * No JSX — plain React.createElement.
 */

import { createElement as h, useEffect, useRef, useState } from 'react'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import { playSound, soundLabelKey } from './sounds.js'
import { PATCHES } from './procedural-patches.js'

/** Sound ids for each picker, filtered by category. */
const WARNING_IDS = [...PATCHES.filter(p => p.category === 'warning' || p.category === 'both').map(p => p.id), 'none']
const DONE_IDS    = [...PATCHES.filter(p => p.category === 'done'    || p.category === 'both').map(p => p.id), 'none']

const STYLE_KEY = 'dsh-status-indication:style'
const SOUND_SCOPE_KEY = 'dsh-status-indication:sound-scope'
const SOUND_WARNING_KEY = 'dsh-status-indication:sound-warning'
const SOUND_DONE_KEY = 'dsh-status-indication:sound-done'

/** Valid style values. */
const STYLES = ['dot', 'solid-dot', 'rect']

/** Valid sound scope values. */
const SCOPE_IDS = ['always', 'hidden']

/** Generic localStorage helpers. */
function readKey(key, valid, fallback) {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  return valid.includes(raw) ? raw : fallback
}

function writeKey(key, value) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
}

/** Read the persisted style, defaulting to 'dot'. */
export function readStyle() {
  return readKey(STYLE_KEY, STYLES, 'dot')
}

/** Read the persisted sound scope, defaulting to 'hidden'. */
export function readSoundScope() {
  return readKey(SOUND_SCOPE_KEY, SCOPE_IDS, 'always')
}

/** Read the persisted warning sound, defaulting to 'procedural-ethereal'. */
export function readSoundWarning() {
  return readKey(SOUND_WARNING_KEY, WARNING_IDS, 'procedural-ethereal')
}

/** Read the persisted done sound, defaulting to 'procedural-ripple'. */
export function readSoundDone() {
  return readKey(SOUND_DONE_KEY, DONE_IDS, 'procedural-ripple')
}

/**
 * Milliseconds before a hover triggers a preview play.
 * Prevents brief pass-throughs (e.g. dragging to the last item) from firing.
 */
const HOVER_PREVIEW_MS = 100

/**
 * Hook: discover `[role="menuitem"]` buttons that contain a `data-sound-id`
 * marker and attach `mouseenter`/`mouseleave` listeners directly on them.
 * Uses `requestAnimationFrame` polling so buttons are discovered as soon as
 * the Menu portal renders them.
 *
 * `mouseenter`/`mouseleave` do not bubble — child→child moves inside the
 * button are invisible to the listener, so there is no penetration to
 * suppress.  The logic is simply: enter → start 100ms timer → play;
 * leave → cancel timer.
 */
function useSoundHoverPreview() {
  const timerRef = useRef(null)
  const attachedRef = useRef(new Set())

  useEffect(() => {
    let raf
    const poll = () => {
      const markers = document.querySelectorAll('[data-sound-id]')
      for (const m of markers) {
        const id = m.getAttribute('data-sound-id')
        if (!id || id === 'none') continue
        const btn = m.closest('[role="menuitem"]')
        if (!btn || attachedRef.current.has(btn)) continue
        attachedRef.current.add(btn)

        btn.addEventListener('mouseenter', () => {
          clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => { playSound(id) }, HOVER_PREVIEW_MS)
        })
        btn.addEventListener('mouseleave', () => {
          clearTimeout(timerRef.current)
        })
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timerRef.current)
    }
  }, [])
}

/**
 * Build a single settings row: title + description on the left,
 * a Menu dropdown on the right.
 */
function SoundRow({ t, titleKey, descKey, value, onChange, items, labelPrefix }) {
  const [open, setOpen] = useState(false)

  const handleSelect = (id) => {
    setOpen(false)
    onChange(id)
  }

  const prefix = labelPrefix ?? 'sound'

  return h('div', { className: 'dsh-si-row' },
    h('div', { className: 'dsh-si-rowText' },
      h('div', { className: 'dsh-si-title' }, t(titleKey)),
      h('div', { className: 'dsh-si-desc' }, t(descKey)),
    ),
    h(Menu, {
      open,
      onClose: () => { setOpen(false) },
      items,
      selectedId: value,
      onSelect: handleSelect,
      align: 'end',
      portal: true,
      anchor: h('button', {
        type: 'button',
        className: 'dsh-si-selector',
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: () => { setOpen((v) => !v) },
      },
        t(value === 'none' ? prefix + 'None' : labelPrefix === 'scope' ? prefix + value.charAt(0).toUpperCase() + value.slice(1) : t(soundLabelKey(value))),
        h(IconChevronDownOutline14, { className: 'dsh-si-chevron' }),
      ),
    }),
  )
}

/**
 * Render the full settings section: favicon style + sound scope + two sound pickers.
 * @param {{ t: (key: string) => string }} props
 */
export function StatusIndicatorSection({ t }) {
  useSoundHoverPreview()

  const [style, setStyle] = useState(readStyle)
  const [styleOpen, setStyleOpen] = useState(false)

  const [soundScope, setSoundScope] = useState(readSoundScope)
  const [soundWarning, setSoundWarning] = useState(readSoundWarning)
  const [soundDone, setSoundDone] = useState(readSoundDone)

  const styleItems = STYLES.map((value) => ({ id: value, label: t(value) }))

  const scopeItems = SCOPE_IDS.map((id) => ({ id, label: t('scope' + id.charAt(0).toUpperCase() + id.slice(1)) }))

  const soundWarningItems = WARNING_IDS.map((id) => ({
    id,
    label: h('span', { 'data-sound-id': id }, t(soundLabelKey(id))),
  }))

  const soundDoneItems = DONE_IDS.map((id) => ({
    id,
    label: h('span', { 'data-sound-id': id }, t(soundLabelKey(id))),
  }))

  const handleStyleSelect = (id) => {
    setStyleOpen(false)
    setStyle(id)
    writeKey(STYLE_KEY, id)
  }

  const handleSoundScopeChange = (id) => {
    setSoundScope(id)
    writeKey(SOUND_SCOPE_KEY, id)
  }

  const handleSoundWarningChange = (id) => {
    setSoundWarning(id)
    writeKey(SOUND_WARNING_KEY, id)
  }

  const handleSoundDoneChange = (id) => {
    setSoundDone(id)
    writeKey(SOUND_DONE_KEY, id)
  }

  // Section headings
  const statusHeading = h('h3', { className: 'dsh-si-heading' }, t('statusHeading'))
  const soundHeading = h('h3', { className: 'dsh-si-heading' }, t('soundHeading'))

  // Favicon style row
  const styleRow = h('div', { className: 'dsh-si-row' },
    h('div', { className: 'dsh-si-rowText' },
      h('div', { className: 'dsh-si-title' }, t('title')),
      h('div', { className: 'dsh-si-desc' }, t('description')),
    ),
    h(Menu, {
      open: styleOpen,
      onClose: () => { setStyleOpen(false) },
      items: styleItems,
      selectedId: style,
      onSelect: handleStyleSelect,
      align: 'end',
      portal: true,
      anchor: h('button', {
        type: 'button',
        className: 'dsh-si-selector',
        'aria-haspopup': 'menu',
        'aria-expanded': styleOpen,
        onClick: () => { setStyleOpen((v) => !v) },
      },
        t(style),
        h(IconChevronDownOutline14, { className: 'dsh-si-chevron' }),
      ),
    }),
  )

  // Sound scope row
  const scopeRow = h(SoundRow, {
    t,
    titleKey: 'soundScopeTitle',
    descKey: 'soundScopeDescription',
    value: soundScope,
    onChange: handleSoundScopeChange,
    items: scopeItems,
    labelPrefix: 'scope',
    key: 'sound-scope',
  })

  // Warning sound row
  const warningRow = h(SoundRow, {
    t,
    titleKey: 'soundWarningTitle',
    descKey: 'soundWarningDescription',
    value: soundWarning,
    onChange: handleSoundWarningChange,
    items: soundWarningItems,
    key: 'sound-warning',
  })

  // Done sound row
  const doneRow = h(SoundRow, {
    t,
    titleKey: 'soundDoneTitle',
    descKey: 'soundDoneDescription',
    value: soundDone,
    onChange: handleSoundDoneChange,
    items: soundDoneItems,
    key: 'sound-done',
  })

  return h('div', null, statusHeading, styleRow, soundHeading, scopeRow, warningRow, doneRow)
}