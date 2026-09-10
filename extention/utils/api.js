// utils/api.js

async function apiRequest(endpoint, options = {}) {
  const response = await chrome.runtime.sendMessage({
    type: 'API_REQUEST',
    payload: { endpoint, options }
  });

  if (!response) {
    throw new Error('Không nhận được phản hồi từ background script');
  }
  if (!response.ok) {
    throw new Error(response.error || 'API request failed');
  }
  return response.data;
}

async function fetchWordInfo(word, language, subtitle, sourceLanguage) {
  return apiRequest('search', {
    method: 'POST',
    body: { word, language, subtitle, sourceLanguage }
  });
}

async function saveWord(data) {
  return apiRequest('save', {
    method: 'POST',
    body: { data }
  });
}

async function sendVideoId(videoId, target_language, native_language) {
  return apiRequest('send-id', {
    method: 'POST',
    body: {
      id: videoId,
      target_language,
      native_language
    }
  });
}

async function fetchTranscriptData(videoId, target_language, native_language, onProgress) {
  const data = await sendVideoId(videoId, target_language, native_language);

  return {
    subtitles: data.subtitle,
    sourceLanguage: data.target_language,   // ngôn ngữ phụ đề gốc
    nativeLanguage: data.native_language,
    noTranslation: data.no_translation || false
  };
}