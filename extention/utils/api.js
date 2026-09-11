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

async function sendTranscript(videoId, target_language, native_language, target_transcript, native_transcript) {
  return apiRequest('transcript', {
    method: 'POST',
    body: { 
      target_transcript, 
      native_transcript, 
      target_language, 
      native_language, 
      videoId }
  });
}

async function fetchTranscriptData(videoId, target_language, native_language, onProgress) {
  // 1. Gửi videoId → nhận 2 link timedtext
  const linkData = await sendVideoId(videoId, target_language, native_language);

  const { target_link, native_link } = linkData || {};

  if (!target_link || !native_link) {
    throw new Error('Không nhận được target_link hoặc native_link từ backend');
  }

  // 2. Extension tự fetch cả 2 link
  let targetTranscript, nativeTranscript;

  try {
    const [targetRes, nativeRes] = await Promise.all([
      fetch(target_link),
      fetch(native_link)
    ]);

    if (!targetRes.ok) {
      throw new Error(`Fetch target_link failed: ${targetRes.status}`);
    }
    if (!nativeRes.ok) {
      throw new Error(`Fetch native_link failed: ${nativeRes.status}`);
    }

    // Dùng .text() vì backend đang nhận chuỗi JSON3
    targetTranscript = await targetRes.text();
    nativeTranscript = await nativeRes.text();
  } catch (err) {
    console.error('Lỗi khi tải transcript từ YouTube:', err);
    throw new Error('Không thể tải transcript từ YouTube');
  }

  // 3. Gửi cả 2 transcript về backend để xử lý
  const data = await sendTranscript(
    videoId,
    target_language,
    native_language,
    targetTranscript,
    nativeTranscript
  );

  // 4. Trả về đúng format cũ để các chỗ khác không bị ảnh hưởng
  return {
    subtitles: data.subtitles,
    sourceLanguage: data.sourceLanguage,
    nativeLanguage: data.nativeLanguage,
    noTranslation: data.noTranslation || false
  };
}