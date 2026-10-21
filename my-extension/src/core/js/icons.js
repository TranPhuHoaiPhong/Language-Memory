// src/core/js/icons.js

/**
 * Icons used inside the page are imported as data URLs (see `inlinePublicIcon`
 * in vite.config.js). Loading them as `chrome-extension://` URLs makes Chrome
 * reject the request from a youtube.com frame, even when the file is listed in
 * `web_accessible_resources`.
 */
import logoIcon from 'virtual:icon/icons/icon.png'
import speakerIcon from 'virtual:icon/icons/speaker.png'

export const LOGO_ICON = logoIcon
export const SPEAKER_ICON = speakerIcon
