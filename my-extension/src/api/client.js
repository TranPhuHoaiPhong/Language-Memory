// src/api/client.js
import { sendMessage } from '../shared/browser.js'

/**
 * Every call is proxied through the background service worker so the content
 * script never needs cross-origin host permissions of its own.
 */
export async function apiRequest(endpoint, options = {}) {
  const response = await sendMessage({
    type: 'API_REQUEST',
    payload: { endpoint, options },
  })

  if (!response) {
    throw new Error('Không nhận được phản hồi từ background script')
  }
  if (!response.ok) {
    throw new Error(response.error || 'API request failed')
  }
  return response.data
}
