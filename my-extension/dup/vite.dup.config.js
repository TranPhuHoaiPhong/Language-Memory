import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  build: {
    outDir: resolvePath('./dist'),
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolvePath('./dup-entry.js'),
      formats: ['es'],
      fileName: () => 'dup.js',
    },
  },
})
