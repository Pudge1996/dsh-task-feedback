/**
 * Status indicator settings section — browser half.
 *
 * Renders a dropdown menu (primitives.Menu) for picking one of three
 * favicon indicator shapes, a sound scope selector, and two sound
 * pickers for warning and done notifications. All selections are
 * persisted to localStorage and take effect immediately.
 *
 * Layout follows the dsh-dv-row pattern (title + description on the
 * left, Menu on the right).
 *
 * No JSX — plain React.createElement.
 */

import { createElement as h, useState } from 'react'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'

const STYLE_KEY = 'dsh-status-indication:style'
const SOUND_SCOPE_KEY = 'dsh-status-indication:sound-scope'
const SOUND_WARNING_KEY = 'dsh-status-indication:sound-warning'
const SOUND_DONE_KEY = 'dsh-status-indication:sound-done'

/** Valid style values. */
const STYLES = ['dot', 'solid-dot', 'rect']

/** Valid sound scope values. */
const SCOPE_IDS = ['none', 'hidden', 'always']

/** Valid sound ids. */
const SOUND_IDS = ['none', 'ding', 'dong', 'chime']

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
  return readKey(SOUND_SCOPE_KEY, SCOPE_IDS, 'hidden')
}

/** Read the persisted warning sound, defaulting to 'none'. */
export function readSoundWarning() {
  return readKey(SOUND_WARNING_KEY, SOUND_IDS, 'none')
}

/** Read the persisted done sound, defaulting to 'none'. */
export function readSoundDone() {
  return readKey(SOUND_DONE_KEY, SOUND_IDS, 'none')
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
        t(value === 'none' ? prefix + 'None' : prefix + value.charAt(0).toUpperCase() + value.slice(1)),
        h(IconChevronDownOutline14, { className: 'dsh-si-chevron' }),
      ),
    }),
  )
}

/**
 * Render the full settings section: favicon style + two sound pickers.
 * @param {{ t: (key: string) => string }} props
 */
export function StatusIndicatorSection({ t }) {
  const [style, setStyle] = useState(readStyle)
  const [styleOpen, setStyleOpen] = useState(false)

  const [soundScope, setSoundScope] = useState(readSoundScope)
  const [soundWarning, setSoundWarning] = useState(readSoundWarning)
  const [soundDone, setSoundDone] = useState(readSoundDone)

  const styleItems = STYLES.map((value) => ({ id: value, label: t(value) }))

  const scopeItems = SCOPE_IDS.map((id) => ({ id, label: t('scope' + id.charAt(0).toUpperCase() + id.slice(1)) }))

  const soundItems = SOUND_IDS.map((id) => ({
    id,
    label: id === 'none' ? t('soundNone') : t('sound' + id.charAt(0).toUpperCase() + id.slice(1)),
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
    items: soundItems,
    key: 'sound-warning',
  })

  // Done sound row
  const doneRow = h(SoundRow, {
    t,
    titleKey: 'soundDoneTitle',
    descKey: 'soundDoneDescription',
    value: soundDone,
    onChange: handleSoundDoneChange,
    items: soundItems,
    key: 'sound-done',
  })

  return h('div', null, statusHeading, styleRow, soundHeading, scopeRow, soundScope !== 'none' && warningRow, soundScope !== 'none' && doneRow)
}