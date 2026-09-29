// src/content/audio.js

const player = new Audio()
player.preload = 'none'

export function playAudio(url) {
  if (!url) return Promise.resolve()
  player.pause()
  player.currentTime = 0
  player.src = url
  return player.play().catch((err) => {
    console.warn('[AUDIO] Auto play failed:', err)
  })
}

export function stopAudio() {
  player.pause()
  player.currentTime = 0
}
