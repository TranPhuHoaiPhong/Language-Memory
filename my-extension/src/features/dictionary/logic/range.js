// src/features/dictionary/logic/range.js

/**
 * Nearest `.sub-word` ancestor of a node (walks up from text nodes too),
 * or null when the node is not inside a word span.
 */
export function closestSubWord(node) {
  if (!node) return null
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  return el ? el.closest('.sub-word') : null
}

function firstTextNodeOf(el) {
  if (!el) return null
  if (el.nodeType === Node.TEXT_NODE) return el
  return document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false).nextNode()
}

function lastTextNodeOf(el) {
  if (!el) return null
  if (el.nodeType === Node.TEXT_NODE) return el
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
  let last = null
  let node
  while ((node = walker.nextNode()) !== null) last = node
  return last
}

/**
 * Grows a range so it always covers whole words at both ends.
 *
 * Returns null when either end sits outside a `.sub-word` (e.g. the user
 * started dragging inside punctuation), otherwise the range is snapped to
 * the first text node of the leading span and the last text node of the
 * trailing span.
 */
export function expandRangeToWords(range) {
  const startSpan = closestSubWord(range.startContainer)
  const endSpan = closestSubWord(range.endContainer)
  if (!startSpan || !endSpan) return null

  const startText = firstTextNodeOf(startSpan)
  const endText = lastTextNodeOf(endSpan)
  if (!startText || !endText) return null

  range.setStart(startText, 0)
  range.setEnd(endText, endText.textContent.length)
  return range
}
