/**
 * Built-in procedural sound patches.
 *
 * Sounds sourced from: https://procedural-sounds.vercel.app/
 *
 * Each entry has:
 *   id       — unique sound id, used in SOUND_IDS and localStorage
 *   patch    — the Patch recipe (Layer | { layers: Layer[] })
 *   label    — { zh: string, en: string } display names
 *   category — 'warning' | 'done' | 'both' (which picker shows it)
 *
 * Order within each group: duration from short to long, for a natural
 * progression from light/crisp to rich/spacious as the user scrolls down.
 */

export const PATCHES = [
  // ── warning (ask) ──────────────────────────────────────────────────
  {
    id: 'procedural-tap',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 583.7895010675901 },
          envelope: { attack: 0.004, decay: 0.07059932016182185, sustain: 0, release: 0.004 },
          gain: 0.141,
        },
        {
          source: { type: 'sine', frequency: 616.3391012439632 },
          envelope: { attack: 0.004, decay: 0.08151093520506603, sustain: 0, release: 0.004 },
          gain: 0.163,
          delay: 0.12029955070395922,
        },
      ],
    },
    label: { zh: '轻敲', en: 'Tap' },
    category: 'warning',
  },
  {
    id: 'procedural-crisp',
    patch: {
      layers: [
        {
          source: { type: 'triangle', frequency: 468.3972596162972 },
          envelope: { attack: 0.004, decay: 0.1226311225668731, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.239,
        },
        {
          source: { type: 'triangle', frequency: 342.9126622899798 },
          envelope: { attack: 0.004, decay: 0.136744132864171, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.248,
          delay: 0.07105509310101021,
        },
      ],
    },
    label: { zh: '清脆', en: 'Crisp' },
    category: 'warning',
  },
  {
    id: 'procedural-electronic',
    patch: {
      layers: [
        {
          source: { type: 'triangle', frequency: 407.369 },
          envelope: { attack: 0.004, decay: 0.116, sustain: 0, release: 0, curve: 'ramp' },
          gain: 0.21,
        },
        {
          source: { type: 'triangle', frequency: 298.234 },
          envelope: { attack: 0.004, decay: 0.122, sustain: 0, release: 0, curve: 'ramp' },
          gain: 0.236,
          delay: 0.088,
        },
      ],
    },
    label: { zh: '电子', en: 'Electronic' },
    category: 'warning',
  },
  {
    id: 'procedural-ethereal',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 423.3790483790889 },
          envelope: { attack: 0.012, decay: 0.14782114890956316, sustain: 0, release: 0.004 },
          gain: 0.073,
          delay: 0,
        },
        {
          source: { type: 'sine', frequency: 423.3790483790889 },
          envelope: { attack: 0.012, decay: 0.23407926353152822, sustain: 0, release: 0.004 },
          gain: 0.073,
          delay: 0.09992832229100823,
        },
      ],
    },
    label: { zh: '空灵', en: 'Ethereal' },
    category: 'warning',
  },
  {
    id: 'procedural-lively',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 1002.4394953410563 },
          envelope: { attack: 0.004, decay: 0.10081345381810522, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.122,
          effects: [{ type: 'delay', delay: 0.124, feedback: 0.284, wet: 0.187, lowpass: 3994 }],
        },
        {
          source: { type: 'sine', frequency: 795.6370380529727 },
          envelope: { attack: 0.004, decay: 0.2763077668131684, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.134,
          delay: 0.21464945326150184,
          effects: [{ type: 'delay', delay: 0.124, feedback: 0.284, wet: 0.187, lowpass: 3994 }],
        },
      ],
    },
    label: { zh: '跳跃', en: 'Lively' },
    category: 'warning',
  },
  {
    id: 'procedural-bounce',
    patch: {
      layers: [
        {
          source: { type: 'triangle', frequency: 384.719 },
          envelope: { attack: 0.0013896001519955253, decay: 0.09196910629724316, sustain: 0, release: 0, curve: 'ramp' },
          gain: 0.194,
          filter: { type: 'lowpass', frequency: 1211, Q: 1.132 },
        },
        {
          source: { type: 'triangle', frequency: 384.719 },
          envelope: { attack: 0.00220127112883553, decay: 0.3381107891967095, sustain: 0, release: 0, curve: 'ramp' },
          gain: 0.141,
          delay: 0.147,
          filter: { type: 'lowpass', frequency: 1216, Q: 0.865 },
        },
        {
          source: { type: 'triangle', frequency: 192.36 },
          envelope: { attack: 0.0013896001519955253, decay: 0.09196910629724316, sustain: 0, release: 0, curve: 'ramp' },
          gain: 0.107,
          filter: { type: 'lowpass', frequency: 1211, Q: 1.132 },
          delay: 0,
        },
      ],
    },
    label: { zh: '弹振', en: 'Bounce' },
    category: 'warning',
  },

  // ── done (completed) ───────────────────────────────────────────────
  {
    id: 'procedural-rise',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 692.1485253651889 },
          envelope: { attack: 0.002, decay: 0.05008352186941592, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.195,
          effects: [{ type: 'delay', delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 }],
        },
        {
          source: { type: 'sine', frequency: 1038.2227880477833 },
          envelope: { attack: 0.002, decay: 0.0559612264974477, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.195,
          delay: 0.04026667679661315,
          effects: [{ type: 'delay', delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 }],
        },
        {
          source: { type: 'sine', frequency: 1557.334182071675 },
          envelope: { attack: 0.002, decay: 0.062345439534569766, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.195,
          delay: 0.0805333535932263,
          effects: [{ type: 'delay', delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 }],
        },
      ],
    },
    label: { zh: '浮起', en: 'Rise' },
    category: 'done',
  },
  {
    id: 'procedural-discovery',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 1122.2079261691945, fm: { ratio: 2.652486028918067, depth: 224.70146845651152 } },
          envelope: { attack: 0, decay: 0.17401717099991085, sustain: 0, release: 0.0642541906973491 },
          effects: [{ type: 'reverb', decay: 0.39934297444706984, damping: 0.6, mix: 0.07093884176937254 }],
          gain: 0.131,
        },
        {
          source: { type: 'sine', frequency: 1414.8180158007035, fm: { ratio: 2.8231547782887754, depth: 186.7387672263663 } },
          envelope: { attack: 0, decay: 0.16676207640127205, sustain: 0, release: 0.0623052386020567 },
          delay: 0.05332371343278789,
          effects: [{ type: 'reverb', decay: 0.456919957184446, damping: 0.6, mix: 0.07567728257915979 }],
          gain: 0.091,
        },
      ],
    },
    label: { zh: '发现', en: 'Discovery' },
    category: 'done',
  },
  {
    id: 'procedural-bright',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 1090.3730323443858 },
          envelope: { attack: 0.004, decay: 0.1334378091219888, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.142,
          effects: [{ type: 'delay', delay: 0.1433468823925163, feedback: 0.30814427260100086, wet: 0.14060819700262958, lowpass: 3242.266138456832 }],
        },
        {
          source: { type: 'sine', frequency: 1633.7141916658104 },
          envelope: { attack: 0.003, decay: 0.20941365283153057, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.13,
          delay: 0.04007316115751175,
          effects: [{ type: 'delay', delay: 0.1433468823925163, feedback: 0.30814427260100086, wet: 0.14060819700262958, lowpass: 3242.266138456832 }],
        },
        {
          source: { type: 'sine', frequency: 2180.7460646887716 },
          envelope: { attack: 0.004, decay: 0.14342770831463109, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.061,
          effects: [{ type: 'delay', delay: 0.1433468823925163, feedback: 0.30814427260100086, wet: 0.14060819700262958, lowpass: 3242.266138456832 }],
          delay: 0.07012803202564556,
        },
        {
          source: { type: 'sine', frequency: 545.1865161721929 },
          envelope: { attack: 0.004, decay: 0.17424751367930255, sustain: 0, release: 0.004, curve: 'ramp' },
          gain: 0.08,
          effects: [{ type: 'delay', delay: 0.1433468823925163, feedback: 0.30814427260100086, wet: 0.14060819700262958, lowpass: 3242.266138456832 }],
          delay: 0,
        },
      ],
    },
    label: { zh: '明亮', en: 'Bright' },
    category: 'done',
  },
  {
    id: 'procedural-renewal',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 377.896 },
          envelope: { attack: 0.005, decay: 0.123, sustain: 0, release: 0 },
          gain: 0.105,
          effects: [{ type: 'delay', delay: 0.14131938412805864, feedback: 0.3644189038448571, wet: 0.17837739832942467, lowpass: 2981.4611714315356 }],
        },
        {
          source: { type: 'sine', frequency: 566.205 },
          envelope: { attack: 0.002, decay: 0.127, sustain: 0, release: 0 },
          gain: 0.138,
          delay: 0.087,
          effects: [{ type: 'delay', delay: 0.14131938412805864, feedback: 0.3644189038448571, wet: 0.17837739832942467, lowpass: 2981.4611714315356 }],
        },
        {
          source: { type: 'sine', frequency: 750 },
          envelope: { attack: 0.002, decay: 0.322, sustain: 0, release: 0 },
          gain: 0.102,
          delay: 0.175,
          effects: [{ type: 'delay', delay: 0.14131938412805864, feedback: 0.3644189038448571, wet: 0.17837739832942467, lowpass: 2981.4611714315356 }],
        },
      ],
    },
    label: { zh: '新生', en: 'Renewal' },
    category: 'done',
  },
  {
    id: 'procedural-bloom',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 523, fm: { ratio: 3, depth: 250 } },
          envelope: { attack: 0, decay: 0.5, sustain: 0.03, release: 0.2 },
          effects: [{ type: 'reverb', decay: 0.7, damping: 0.4, mix: 0.12 }],
          gain: 0.106,
        },
        {
          source: { type: 'sine', frequency: 659, fm: { ratio: 3, depth: 220 } },
          envelope: { attack: 0, decay: 0.45, sustain: 0.02, release: 0.18 },
          delay: 0.1,
          effects: [{ type: 'reverb', decay: 0.7, damping: 0.4, mix: 0.12 }],
          gain: 0.089,
        },
        {
          source: { type: 'sine', frequency: 784, fm: { ratio: 3, depth: 200 } },
          envelope: { attack: 0, decay: 0.4, sustain: 0.02, release: 0.18 },
          delay: 0.2,
          effects: [{ type: 'reverb', decay: 0.7, damping: 0.4, mix: 0.12 }],
          gain: 0.08,
        },
      ],
    },
    label: { zh: '绽放', en: 'Bloom' },
    category: 'done',
  },
  {
    id: 'procedural-ripple',
    patch: {
      layers: [
        {
          source: { type: 'sine', frequency: 1031.59 },
          envelope: { attack: 0.003, decay: 0.043, sustain: 0, release: 0 },
          gain: 0.169,
          effects: [{ type: 'delay', delay: 0.06453290823895033, feedback: 0.26049766810256514, wet: 0.1720283449660654, lowpass: 5478.705467040193 }],
        },
        {
          source: { type: 'sine', frequency: 1415.171 },
          envelope: { attack: 0.003, decay: 0.051, sustain: 0, release: 0 },
          gain: 0.135,
          delay: 0.1,
        },
        {
          source: { type: 'sine', frequency: 1770.022 },
          envelope: { attack: 0.003, decay: 0.076, sustain: 0, release: 0 },
          gain: 0.152,
          delay: 0.191,
        },
        {
          source: { type: 'sine', frequency: 515.795 },
          envelope: { attack: 0.003, decay: 0.043, sustain: 0, release: 0 },
          gain: 0.093,
          effects: [{ type: 'delay', delay: 0.06453290823895033, feedback: 0.26049766810256514, wet: 0.1720283449660654, lowpass: 5478.705467040193 }],
          delay: 0,
        },
      ],
    },
    label: { zh: '涟漪', en: 'Ripple' },
    category: 'done',
  },
]