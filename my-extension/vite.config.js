import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url))

// Extension pages/icons are shipped as-is, never processed by Vite.
const PUBLIC_DIR = resolvePath('./public')
const OUT_DIR = resolvePath('./dist')

const MIME_TYPES = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

/**
 * Assets that end up in the page DOM cannot be loaded as `chrome-extension://`
 * URLs: Chrome blocks those requests unless the frame matches
 * `web_accessible_resources`, and it still rejects them in some contexts. This
 * plugin lets the content script import an icon from `public/` as a data URL,
 * so the page never has to request a cross-origin resource at all.
 *
 *     import logo from 'virtual:icon/icons/icon.png'
 */
function inlinePublicIcon() {
  const PREFIX = 'virtual:icon/'

  return {
    name: 'inline-public-icon',
    resolveId(id) {
      return id.startsWith(PREFIX) ? `\0${id}` : null
    },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return null

      const file = id.slice(`\0${PREFIX}`.length)
      const ext = file.slice(file.lastIndexOf('.'))
      const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
      const base64 = readFileSync(resolvePath(`./public/${file}`)).toString('base64')

      return `export default ${JSON.stringify(`data:${mime};base64,${base64}`)}`
    },
  }
}

/**
 * Two separate builds, because each Chrome extension target has its own
 * module-format requirement and they cannot share a single Rollup pass:
 *
 *   content    - content_scripts are NOT modules in MV3, needs one IIFE file
 *                with the CSS inlined as JS (dist/content.js). Also carries the
 *                settings sidebar UI.
 *   background - MV3 service worker, ES module (dist/background.js)
 */
export default defineConfig(({ mode }) => {
  // Rollup library builds keep `process.env.NODE_ENV` intact so consumers can
  // decide; a content script has no `process`, so pin it here.
  const libDefine = { 'process.env.NODE_ENV': JSON.stringify('production') }

  const base = {
    plugins: [vue(), inlinePublicIcon()],
    publicDir: PUBLIC_DIR,
    define: libDefine,
    build: { outDir: OUT_DIR },
  }

  if (mode === 'content') {
    return {
      ...base,
      plugins: [vue(), cssInjectedByJs(), inlinePublicIcon()],
      build: {
        outDir: OUT_DIR,
        emptyOutDir: false,
        cssCodeSplit: false,
        lib: {
          entry: resolvePath('./src/entry/content.js'),
          name: 'SubtitleTranslatorContent',
          formats: ['iife'],
          fileName: () => 'content.js',
        },
      },
    }
  }

  if (mode === 'background') {
    return {
      ...base,
      build: {
        outDir: OUT_DIR,
        emptyOutDir: false,
        lib: {
          entry: resolvePath('./src/entry/background.js'),
          formats: ['es'],
          fileName: () => 'background.js',
        },
      },
    }
  }

  return {
    ...base,
    base: './',
    build: {
      outDir: OUT_DIR,
      emptyOutDir: true,
    },
  }
})
