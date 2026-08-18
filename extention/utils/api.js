// utils/api.js
// ===== API Configuration =====
const API_BASE = 'http://localhost:3000/api';

/**
 * Hàm gọi API chung
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  return response.json();
}

// ===== Các hàm gọi API cụ thể =====
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

// ===== Hàm xử lý toàn bộ quy trình lấy và dịch transcript =====
/**
 * Gửi video ID, lấy transcript, dịch và trả về dữ liệu phụ đề.
 * @param {string} videoId - ID của video YouTube
 * @param {string} targetLanguage - Ngôn ngữ đích (ví dụ 'vi')
 * @param {Function} onProgress - Callback để cập nhật trạng thái (tùy chọn)
 * @returns {Promise<{ subtitles: Array, sourceLanguage: string }>}
 */
async function fetchTranscriptData(videoId, targetLanguage, onProgress) {
  // Bước 1: Gửi ID video và lấy thông tin ngôn ngữ nguồn
  const data = await sendVideoId(videoId, targetLanguage);
  const sourceLanguage = data.lang;

  // Nếu ngôn ngữ nguồn trùng với ngôn ngữ đích -> không cần dịch
  if (data.dta === sourceLanguage) {
    return { subtitles: [], sourceLanguage, noTranslation: true };
  }

  // Bước 2: Lấy transcript từ URL (data.dta) và dịch
  const transcriptUrl = data.dta;
  const response = await fetch(transcriptUrl.toString());
  if (!response.ok) throw new Error('Failed to fetch transcript');
  const transcriptText = await response.text();

  // Bước 3: Gửi transcript lên server để dịch
  const result = await sendTranscript(transcriptText, targetLanguage, sourceLanguage, videoId);
  return { subtitles: result.data, sourceLanguage, noTranslation: false };
}