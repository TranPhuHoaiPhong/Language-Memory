// src/features/subtitles/state/settings.js

/** Single storage key so the content script can read everything in one go. */
export const SETTINGS_KEY = 'subtitle_settings'

/** The overlay's dragged position: per-device, so `localStorage` not `sync`. */
export const SUBTITLE_POSITION_KEY = 'subtitlePosition'

/**
 * Every string that reaches a style binding comes from one of these lists.
 * A free-text `font-family` or `box-shadow` would be a CSS injection hole, so
 * the sidebar only ever stores the key and `resolve()` maps it to the real value.
 */
export const FONT_FAMILIES = [
  { value: 'system', label: 'Hệ thống', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { value: 'sans', label: 'Sans serif', stack: 'Arial, Helvetica, sans-serif' },
  { value: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monospace', stack: '"Courier New", Courier, monospace' },
  { value: 'rounded', label: 'Bo tròn', stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { value: 'condensed', label: 'Chữ hẹp', stack: '"Arial Narrow", "Helvetica Neue", sans-serif' },
]

export const FONT_WEIGHTS = [
  { value: 300, label: 'Thin' },
  { value: 400, label: 'Thường' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Đậm' },
  { value: 800, label: 'Black' },
]

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
]

export const BOX_SHADOWS = [
  { value: 'none', label: 'Không' },
  { value: 'soft', label: 'Mềm', css: '0 2px 8px rgba(0, 0, 0, 0.35)' },
  { value: 'strong', label: 'Đậm', css: '0 4px 16px rgba(0, 0, 0, 0.6)' },
]

export const TEXT_SHADOWS = [
  { value: 'outline', label: 'Viền', css: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' },
  { value: 'soft', label: 'Mềm', css: '0 1px 3px rgba(0, 0, 0, 0.7)' },
  { value: 'glow', label: 'Phát sáng', css: '0 0 6px currentColor' },
  { value: 'none', label: 'Không', css: 'none' },
]

export const SCALE_RANGE = { min: 0.6, max: 1.8, step: 0.05 }
export const LINE_HEIGHT_RANGE = { min: 0.8, max: 2.4, step: 0.05 }
export const LETTER_SPACING_RANGE = { min: -0.05, max: 0.3, step: 0.01 }
export const WIDTH_RANGE = { min: 40, max: 100, step: 1 }
export const GAP_RANGE = { min: 0, max: 1.2, step: 0.05 }
export const OPACITY_RANGE = { min: 0, max: 1, step: 0.05 }
export const RADIUS_RANGE = { min: 0, max: 24, step: 1 }
export const PADDING_X_RANGE = { min: 0, max: 40, step: 1 }
export const PADDING_Y_RANGE = { min: 0, max: 20, step: 1 }

export const DEFAULT_SETTINGS = {
  /** Typography both lines share: everything except family and size. */
  font: {
    weight: 600,
    lineHeight: 1.3,
    /** Tracking in `em`. */
    letterSpacing: 0,
    /** Subtitle box width as a percentage of the player. */
    width: 90,
    align: 'center',
    bold: false,
    italic: false,
  },

  /** Vertical space between the original and the translated line, in `em`. */
  gap: 0.2,

  /** Appearance of the original (source language) line. */
  original: { enabled: true, family: 'system', scale: 0.8, color: '#ffffff', opacity: 1 },
  /** Appearance of the translated (target language) line. */
  translated: { enabled: true, family: 'system', scale: 0.8, color: '#ffffff', opacity: 1 },

  background: {
    enabled: true,
    color: '#000000',
    opacity: 0.6,
    radius: 10,
    paddingX: 13,
    paddingY: 5,
    boxShadow: 'none',
    textShadow: 'none',
  },
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function clampNumber(value, range, fallback) {
  // `Number(null)` and `Number('')` are both 0, which would silently clamp a
  // missing field to the minimum instead of using the default.
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(range.max, Math.max(range.min, n))
}

function pickOneOf(options, value, fallback) {
  return options.some((o) => o.value === value) ? value : fallback
}

function pickColor(value, fallback) {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : fallback
}

function pickBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

/** Maps a stored key to the CSS it stands for; `null` means "not set". */
export function resolve(options, value) {
  return options.find((o) => o.value === value) || null
}

export function fontStack(value) {
  return (resolve(FONT_FAMILIES, value) || FONT_FAMILIES[0]).stack
}

export function boxShadowCss(value) {
  return (resolve(BOX_SHADOWS, value) || BOX_SHADOWS[0]).css
}

export function textShadowCss(value) {
  return (resolve(TEXT_SHADOWS, value) || TEXT_SHADOWS[0]).css
}

/** `#rrggbb` + alpha -> `rgba(...)`. The only way text opacity is applied. */
export function withAlpha(hex, alpha) {
  const color = pickColor(hex, '#000000')
  const n = Math.round(Math.min(1, Math.max(0, Number(alpha) || 0)) * 1000) / 1000
  const int = parseInt(color.slice(1), 16)
  // eslint-disable-next-line no-bitwise
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${n})`
}

/** Bold is a shortcut that never lowers the chosen weight. */
export function effectiveWeight(font) {
  return font.bold ? Math.max(700, font.weight) : font.weight
}

/**
 * The custom properties a single line reads: its own family, size multiplier and
 * colour. Set on the line element itself so both lines share one CSS rule, and
 * sized in `em` so the multiplier follows the root's auto font size.
 */
export function lineStyle(line) {
  return {
    '--sub-family': fontStack(line.family),
    '--sub-scale': line.scale,
    '--sub-color': withAlpha(line.color, line.opacity),
  }
}

/**
 * Storage can hold anything (or hand-edited junk, or a settings object written
 * by an older version), so every field is clamped and fallbacks are explicit.
 * The pre-nested `{ scale, color, gap }` shape is migrated to the per-line
 * settings, and so is a family/size that used to be shared by both lines: it is
 * copied onto each of them so existing users keep the look they had.
 */
export function normalizeSettings(raw) {
  const flat = raw && typeof raw === 'object' ? raw : {}
  const font = flat.font && typeof flat.font === 'object' ? flat.font : {}
  const original = flat.original && typeof flat.original === 'object' ? flat.original : {}
  const translated = flat.translated && typeof flat.translated === 'object' ? flat.translated : {}
  const bg = flat.background && typeof flat.background === 'object' ? flat.background : {}

  const legacyColor = pickColor(flat.color, null)
  const legacyFamily = pickOneOf(FONT_FAMILIES, font.family, null)
  const legacyScale = Number.isFinite(Number(flat.scale)) ? Number(flat.scale) : null
  const sharedScale = Number.isFinite(Number(font.scale)) ? Number(font.scale) : legacyScale
  const d = DEFAULT_SETTINGS

  return {
    font: {
      weight: pickOneOf(FONT_WEIGHTS, Number(font.weight), d.font.weight),
      lineHeight: clampNumber(font.lineHeight, LINE_HEIGHT_RANGE, d.font.lineHeight),
      letterSpacing: clampNumber(font.letterSpacing, LETTER_SPACING_RANGE, d.font.letterSpacing),
      width: clampNumber(font.width, WIDTH_RANGE, d.font.width),
      align: pickOneOf(ALIGN_OPTIONS, font.align, d.font.align),
      bold: pickBoolean(font.bold, d.font.bold),
      italic: pickBoolean(font.italic, d.font.italic),
    },

    gap: clampNumber(flat.gap, GAP_RANGE, d.gap),

    original: {
      enabled: pickBoolean(original.enabled, d.original.enabled),
      family: pickOneOf(FONT_FAMILIES, original.family, legacyFamily ?? d.original.family),
      scale: clampNumber(original.scale ?? sharedScale, SCALE_RANGE, d.original.scale),
      color: pickColor(original.color, legacyColor ?? d.original.color),
      opacity: clampNumber(original.opacity, OPACITY_RANGE, d.original.opacity),
    },
    translated: {
      enabled: pickBoolean(translated.enabled, d.translated.enabled),
      family: pickOneOf(FONT_FAMILIES, translated.family, legacyFamily ?? d.translated.family),
      scale: clampNumber(translated.scale ?? sharedScale, SCALE_RANGE, d.translated.scale),
      color: pickColor(translated.color, legacyColor ?? d.translated.color),
      opacity: clampNumber(translated.opacity, OPACITY_RANGE, d.translated.opacity),
    },

    background: {
      enabled: pickBoolean(bg.enabled, d.background.enabled),
      color: pickColor(bg.color, d.background.color),
      opacity: clampNumber(bg.opacity, OPACITY_RANGE, d.background.opacity),
      radius: clampNumber(bg.radius, RADIUS_RANGE, d.background.radius),
      paddingX: clampNumber(bg.paddingX, PADDING_X_RANGE, d.background.paddingX),
      paddingY: clampNumber(bg.paddingY, PADDING_Y_RANGE, d.background.paddingY),
      boxShadow: pickOneOf(BOX_SHADOWS, bg.boxShadow, d.background.boxShadow),
      textShadow: pickOneOf(TEXT_SHADOWS, bg.textShadow, d.background.textShadow),
    },
  }
}
