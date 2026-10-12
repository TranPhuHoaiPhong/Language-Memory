// src/core/js/sidebar.js
import { shallowRef } from 'vue'
import { getSidebar } from './dom.js'
import { createHost } from './hosts.js'

/**
 * The watch page's right-hand column, `ytd-engagement-panel-section-list-renderer`.
 * The panels no longer live inside it: they float in a fixed dock on the right of
 * the viewport (see the panels' own stylesheets), so this is only the sentinel
 * that says "this page has somewhere for a panel to appear". That keeps the
 * toolbar icon and a word click from opening panels on every other page YouTube
 * has, where the lookup and the settings have nothing to act on.
 *
 * It is a ref and not a getter because the element is not stable. YouTube owns it:
 * it is built lazily and a fresh one replaces it on every in-app navigation, so a
 * panel cannot simply look the element up once.
 */
export const sidebar = shallowRef(null)

/** Ids of the open panels, with the `close` each one handed over. */
const occupants = new Map()

function syncWatchPage() {
  const target = getSidebar()
  if (sidebar.value !== target) sidebar.value = target
}

/** YouTube mutates the watch page constantly, so at most one check per frame. */
let frame = null

function scheduleSync() {
  if (frame !== null) return
  frame = requestAnimationFrame(() => {
    frame = null
    syncWatchPage()
  })
}

let observer = null

function startWatching() {
  if (observer) return

  syncWatchPage()
  document.addEventListener('yt-navigate-finish', syncWatchPage)
  // The column is also built and torn down without a navigation, e.g. when the
  // window crosses the width where YouTube collapses the sidebar.
  observer = new MutationObserver(scheduleSync)
  observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * A host for a panel. It is created on `<body>` and stays there: the fixed dock
 * rules on the panel itself place it, so nothing has to be re-parented when
 * YouTube swaps the watch page's own column out from under us.
 */
export function createSidebarHost() {
  const host = createHost()
  startWatching()
  return host
}

/**
 * One dock, one panel: the last one to claim it evicts the others, so the toolbar
 * icon and a word click cannot both hold the right of the screen.
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
}

/** Called when a panel closes: it drops out of the dock. */
export function releaseSlot(id) {
  occupants.delete(id)
}
