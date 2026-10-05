// src/core/js/sidebar.js
import { shallowRef } from 'vue'
import { attachTo, getSidebar } from './dom.js'
import { createHost } from './hosts.js'

/**
 * The watch page's right-hand column, `ytd-engagement-panel-section-list-renderer`.
 * The extension's panels live inside it and take it over: claiming the slot sets
 * its `visibility` attribute — the same one YouTube uses for its transcript — and
 * hides YouTube's own sections, so the column shows the settings instead of a
 * drawer floating over the player.
 *
 * It is a ref and not a getter because the element is not stable. YouTube owns it:
 * it is built lazily and a fresh one replaces it on every in-app navigation, so a
 * panel cannot simply look the element up once.
 */
export const sidebar = shallowRef(null)

const EXPANDED = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED'
const HIDDEN = 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN'

/** Every host parked in the column, re-parented together when the element changes. */
const hosts = new Set()

/** Ids of the panels sharing the column, with the `close` each one hands over. */
const occupants = new Map()

/**
 * The column's other children, which are YouTube's own sections (transcript,
 * comments, …), with the inline `display` each had before it was displaced. They
 * are what pushes the panel down and takes most of the column's height, so they
 * step aside while a panel holds the slot and get their `display` back on
 * release — restored, not cleared, so whatever YouTube styled them with survives.
 */
const displaced = new Map()

function displaceOthers() {
  const column = sidebar.value
  if (!column) return

  hosts.forEach((host) => {
    Array.from(column.children).forEach((child) => {
      if (hosts.has(child) || displaced.has(child)) return
      displaced.set(child, child.style.display)
      child.style.display = 'none'
    })
  })
}

function restoreOthers() {
  displaced.forEach((display, el) => {
    el.style.display = display
  })
  displaced.clear()
}

function setColumn(expanded) {
  const column = sidebar.value
  if (!column) return

  column.setAttribute('visibility', expanded ? EXPANDED : HIDDEN)
  if (expanded) displaceOthers()
  else restoreOthers()
}

function reparent() {
  const target = getSidebar()
  if (sidebar.value === target) return

  // The column being swapped out takes YouTube's sections with it, so their saved
  // `display` is dropped rather than restored into a detached element.
  displaced.clear()
  sidebar.value = target
  // `attachTo` is a no-op once the host is in place, so this only ever moves the
  // hosts when YouTube has actually swapped the column out.
  hosts.forEach((host) => attachTo(target, host))
  // A fresh element arrives with YouTube's own state, so ours is re-applied.
  setColumn(occupants.size > 0)
}

/** YouTube mutates the watch page constantly, so at most one check per frame. */
let frame = null

function scheduleReparent() {
  if (frame !== null) return
  frame = requestAnimationFrame(() => {
    frame = null
    reparent()
    // Sections also arrive without a navigation, e.g. a video card loading in, and
    // anything new that shows up has to step aside again.
    if (occupants.size > 0) displaceOthers()
  })
}

let observer = null

function startWatching() {
  if (observer) return

  reparent()
  document.addEventListener('yt-navigate-finish', reparent)
  // The column is also built and torn down without a navigation, e.g. when the
  // window crosses the width where YouTube collapses the sidebar.
  observer = new MutationObserver(scheduleReparent)
  observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * A host for a panel that belongs in the column.
 *
 * The host is created on `<body>` and moved inside rather than mounted there: a
 * Vue app mounted into an element YouTube discards would be torn down with it on
 * every navigation, taking the panel's state along.
 */
export function createSidebarHost() {
  const host = createHost()
  hosts.add(host)
  attachTo(sidebar.value, host)
  startWatching()
  return host
}

/**
 * Panels share the one column, so the last one to claim it evicts the others: the
 * toolbar icon and a word click cannot both hold the sidebar.
 *
 * A panel hands over its own `close` instead of calling another feature's, which
 * would make the two import each other's modules — the same seam the word popup
 * and the overlay use through `popupControl`.
 */
export function claimSlot(id, evict) {
  occupants.forEach((close, otherId) => {
    if (otherId !== id) close()
  })
  occupants.set(id, evict)
  setColumn(true)
}

/** Called when a panel closes: the column goes back down once it is the last one. */
export function releaseSlot(id) {
  if (!occupants.delete(id)) return
  if (occupants.size === 0) setColumn(false)
}
