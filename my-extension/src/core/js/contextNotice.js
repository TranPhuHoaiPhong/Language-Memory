// src/core/js/contextNotice.js

/**
 * The page-side notice shown when the extension context is gone.
 *
 * The content script keeps running in the page after the extension has been
 * reloaded or updated, but every `chrome.*` call it makes from then on throws
 * "Extension context invalidated." The extension is therefore alive on screen
 * and dead underneath, and the user has no way to tell the two apart — so this
 * says it in plain words, with the one action that fixes it.
 *
 * The notice is plain DOM with inline styles on purpose: it has to work even
 * when the context is dead, so it cannot rely on the extension's own
 * stylesheets, Vue, or any API call.
 */

const NOTICE_ID = 'lingo-context-invalidated-notice'

const TEXT = 'Lingo vừa được cập nhật. Hãy tải lại trang để dùng lại.'

function reload() {
  location.reload()
}

/** Creates the notice if it is not on the page yet. */
export function showContextInvalidatedNotice() {
  if (document.getElementById(NOTICE_ID)) return

  const notice = document.createElement('div')
  notice.id = NOTICE_ID
  notice.setAttribute('role', 'status')

  Object.assign(notice.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: 'min(560px, calc(100vw - 32px))',
    padding: '10px 14px',
    borderRadius: '10px',
    background: '#1f2937',
    color: '#f9fafb',
    font: '13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
  })

  const label = document.createElement('span')
  label.textContent = TEXT
  notice.appendChild(label)

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Tải lại'
  Object.assign(button.style, {
    flex: '0 0 auto',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    background: '#2563eb',
    color: '#ffffff',
    font: 'inherit',
    fontWeight: '600',
    cursor: 'pointer',
  })
  button.addEventListener('click', reload)
  notice.appendChild(button)

  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = '×'
  close.setAttribute('aria-label', 'Đóng')
  Object.assign(close.style, {
    flex: '0 0 auto',
    padding: '2px 6px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    font: '18px/1 inherit',
    cursor: 'pointer',
  })
  close.addEventListener('click', () => notice.remove())
  notice.appendChild(close)

  document.body.appendChild(notice)
}
