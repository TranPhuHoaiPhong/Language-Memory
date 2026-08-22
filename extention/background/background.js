// background.js
const API_BASE = 'http://localhost:3000/api';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'API_REQUEST') return false;

  const { endpoint, options } = message.payload;
  const url = `${API_BASE}/${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    method: options.method || 'GET',
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  fetch(url, config)
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      return response.json();
    })
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));

  return true; // giữ kênh mở cho response bất đồng bộ
});