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

async function sendVideoId(videoId, language) {
  return apiRequest('send-id', {
    method: 'POST',
    body: { id: videoId, language }
  });
}

async function sendTranscript(transcriptText, language, lang, videoId) {
  return apiRequest('transcript', {
    method: 'POST',
    body: { transcript: transcriptText, language, lang, videoId }
  });
}

async function fetchTranscriptData(videoId, targetLanguage, onProgress) {
  const data = await sendVideoId(videoId, targetLanguage);
  const sourceLanguage = data.lang;

  if (data.dta === sourceLanguage) {
    return { subtitles: [], sourceLanguage, noTranslation: true };
  }

  const transcriptUrl = data.dta;
  const response = await fetch(transcriptUrl.toString());
  if (!response.ok) throw new Error('Failed to load transcript');
  const transcriptText = await response.text();

  const result = await sendTranscript(transcriptText, targetLanguage, sourceLanguage, videoId);
  return { subtitles: result.data, sourceLanguage, noTranslation: false };
}