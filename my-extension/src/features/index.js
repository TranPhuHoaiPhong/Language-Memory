// src/features/index.js
import { subtitles } from './subtitles/index.js'
import { dictionary } from './dictionary/index.js'
import { settingsPanel } from './settings/index.js'

/**
 * The features that make up the extension, in the order their stylesheets have
 * to cascade. Adding one is a folder with an `index.js` exporting an object
 * with an `id` and a `mount()`, plus a line here: the entry point, the settings
 * panel and the preferences loader all read this list.
 *
 * The imports above follow the same order on purpose: a feature's stylesheet
 * is injected when its module is evaluated, which happens on import, not in
 * `boot()`.
 */
export const FEATURES = [subtitles, dictionary, settingsPanel]

export function boot() {
  FEATURES.forEach((feature) => feature.mount())
}
