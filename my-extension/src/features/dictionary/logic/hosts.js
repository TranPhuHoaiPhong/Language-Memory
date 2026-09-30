// src/features/dictionary/logic/hosts.js
import { createHost } from '../../../core/js/hosts.js'

/**
 * The popup is re-parented between the player, the fullscreen element and the
 * player root as the video is resized and goes fullscreen, so it keeps its own
 * host and moves that around.
 */
export const wordPopupHost = createHost()
