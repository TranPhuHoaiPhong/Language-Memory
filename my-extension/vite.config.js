import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url))

// Extension pages/icons are shipped as-is, never processed by Vite.
const PUBLIC_DIR = resolvePath('./public')
const OUT_DIR = resolvePath('./dist')

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
    plugins: [vue()],
    publicDir: PUBLIC_DIR,
    define: libDefine,
    build: { outDir: OUT_DIR },
  }

  if (mode === 'content') {
    return {
      ...base,
      plugins: [vue(), cssInjectedByJs()],
      build: {
        outDir: OUT_DIR,
        emptyOutDir: false,
        cssCodeSplit: false,
        lib: {
          entry: resolvePath('./src/content/main.js'),
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
          entry: resolvePath('./src/background/main.js'),
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
