// ─── Obsidian Terminal Theme ──────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  bg0: '#06060a',
  bg1: '#0d0d14',
  bg2: '#13131e',
  bg3: '#1a1a28',
  bg4: '#222235',

  // Accent – Electric Cyan
  cyan:    '#00f5ff',
  cyanDim: '#00c4cc',
  cyanGlow: 'rgba(0, 245, 255, 0.15)',

  // Accent – Amber
  amber:    '#ffb800',
  amberDim: '#cc9400',
  amberGlow: 'rgba(255, 184, 0, 0.15)',

  // Semantic
  green:  '#00e676',
  red:    '#ff4560',
  purple: '#a78bfa',
  blue:   '#60a5fa',

  // Text
  textPrimary:   '#f0f0f8',
  textSecondary: '#8888aa',
  textMuted:     '#44445a',

  // Borders
  border:      'rgba(255,255,255,0.06)',
  borderHover: 'rgba(0, 245, 255, 0.3)',
} as const;

// ─── Pie / Category Colors ────────────────────────────────────────────────────
export const CHART_COLORS = [
  COLORS.cyan,
  COLORS.amber,
  COLORS.green,
  COLORS.purple,
  COLORS.blue,
  COLORS.red,
];

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  display: "'Syne', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'JetBrains Mono', monospace",
} as const;

// ─── Animation Presets ───────────────────────────────────────────────────────
export const SPRING = {
  gentle: { type: 'spring', stiffness: 200, damping: 30 },
  bouncy: { type: 'spring', stiffness: 400, damping: 20 },
  slow:   { type: 'spring', stiffness: 100, damping: 40 },
} as const;

export const FADE_UP = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const;

export const FADE_IN = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
} as const;

export const SCALE_IN = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
} as const;

// ─── Stagger Container ────────────────────────────────────────────────────────
export const STAGGER_CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
} as const;

// ─── Skip-filter keywords ─────────────────────────────────────────────────────
export const SKIP_KEYWORDS = ['Selftransfer', 'Self transfer', 'Top-up', 'Topup'] as const;