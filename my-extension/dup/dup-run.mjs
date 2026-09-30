// Counts the background requests a single loadTranscript() round triggers.
const listeners = []
const calls = []

globalThis.location = new URL('https://www.youtube.com/watch?v=VIDEO1')
const videoEl = {
  duration: 120,
  currentTime: 0,
  paused: true,
  textTracks: { length: 0 },
  addEventListener: () => {},
  removeEventListener: () => {},
  getAttribute: () => null,
  setAttribute: () => {},
  removeAttribute: () => {},
  hasAttribute: () => false,
  classList: { add: () => {}, remove: () => {}, contains: () => false },
}
globalThis.document = {
  querySelector: () => videoEl,
  addEventListener: () => {},
}
globalThis.window = globalThis

const storageData = { target_language: 'ja', native_language: 'vi' }

globalThis.fetch = async (url) => ({ ok: true, status: 200, text: async () => '<timedtext/>' })

globalThis.chrome = {
  runtime: {
    lastError: null,
    sendMessage(msg, cb) {
      const { endpoint } = msg.payload || {}
      calls.push(endpoint)
      setTimeout(() => {
        if (endpoint === 'send-id') return cb({ ok: true, data: { target_link: 'https://x/t.xml' } })
        if (endpoint === 'transcript') {
          return cb({
            ok: true,
            data: {
              subtitles: [{ index: 0, start: 0, duration: 2, text: 'hello', translation: 'xin' }],
              sourceLanguage: 'en',
            },
          })
        }
        cb({ ok: true, data: {} })
      }, 0)
    },
  },
  storage: {
    sync: {
      get(keys, cb) {
        const out = {}
        for (const k of [].concat(keys)) out[k] = storageData[k]
        setTimeout(() => cb(out), 0)
      },
      set(items, cb) {
        Object.assign(storageData, items)
        setTimeout(() => cb(), 0)
      },
    },
    onChanged: {
      addListener: (fn) => listeners.push(fn),
      removeListener: () => {},
    },
  },
}

const { startPreferences } = await import('./dist/dup.js')
const settle = () => new Promise((r) => setTimeout(r, 50))

const count = (endpoint) => calls.filter((e) => e === endpoint).length
const report = (label) => {
  console.log(`${label}: send-id=${count('send-id')} transcript=${count('transcript')}`)
  calls.length = 0
}

await startPreferences()
await settle()
report('startup (2 language keys)')

// The panel writes both language keys in one storageSet, exactly like the UI does.
listeners[0]({ target_language: { newValue: 'ko' }, native_language: { newValue: 'vi' } }, 'sync')
await settle()
report('one language change')
