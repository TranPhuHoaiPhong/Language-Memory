// src/features/dictionary/logic/panelControl.js

/**
 * The click handler lives in the popup's composable (it is the one that already
 * resolves which word was hit) while the panel is its own Vue app, so the two
 * cannot import each other's refs. This is the seam between them, the same way
 * `popupControl` bridges the overlay and the popup.
 */
export const wordPanelControl = {
  /** Opens the panel for `text` and looks it up. */
  open: () => {},
  close: () => {},
}
