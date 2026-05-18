import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://192.168.1.131:5000/api";
export const SOCKET_URL = "http://192.168.1.131:5000";

const storage = {
  getItem: (key) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  deleteItem: (key) =>
    Platform.OS === "web"
      ? (localStorage.removeItem(key), Promise.resolve())
      : SecureStore.deleteItemAsync(key),
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => ({
    ...response,
    data: response.data.data || response.data,
  }),
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem("authToken");
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data?.token) {
      await SecureStore.setItemAsync("authToken", response.data.token);
      api.post("/users/update-streak").catch(() => {});
    }
    return response;
  },
  register: (data) => api.post("/auth/signup", data),
  logout: async () => {
    await api.post("/auth/logout");
    await SecureStore.deleteItemAsync("authToken");
  },
  getMe: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  googleAuth: (access_token) => api.post("/auth/google", { access_token }),
  requestVerification: () => api.post("/auth/send-verification"),
};

// ── User ──────────────────────────────────────────────────────────────────────
export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  updateAvatarStyle: (avatarStyle) => api.put("/users/avatar-style", { avatarStyle }),
  getXp: () => api.get("/users/xp"),
  updateStreak: () => api.post("/users/update-streak"),
  changePassword: (currentPassword, newPassword) =>
    api.put("/users/change-password", { currentPassword, newPassword }),
  deleteAccount: (password) => api.delete("/users/delete-account", { data: { password } }),
};

export const generateDicebearUrl = (userId, avatarStyle = "adventurer") => {
  if (!userId) return null;

  const baseStyle =
    String(avatarStyle || "adventurer").split("-").slice(0, -1).join("-") ||
    String(avatarStyle || "adventurer");
  const numericLastPart = String(avatarStyle || "adventurer").split("-").pop();
  const cleanStyle =
    numericLastPart && /^\d+$/.test(numericLastPart) ? baseStyle : avatarStyle;

  return `https://api.dicebear.com/9.x/${cleanStyle || "adventurer"}/png?seed=${userId}&size=128`;
};

// ── Dictionary ────────────────────────────────────────────────────────────────
export const dictionaryService = {
  getAll: (params) => api.get("/dictionary", { params }),
  getByLevel: (level, params) => api.get(`/dictionary/level/${level}`, { params }),
  getById: (id) => api.get(`/dictionary/${id}`),
  search: (query) => api.get("/dictionary/search", { params: { q: query } }),
  unlockWord: (wordId, language = "de") => api.post(`/dictionary/${wordId}/unlock`, { language }),
  getUnlockStats: () => api.get("/dictionary/unlocks/stats"),
};

// ── Favorites ─────────────────────────────────────────────────────────────────
export const favoritesService = {
  getFavorites: (params = {}) => api.get("/favorites", { params }),
  addFavorite: (wordId) => api.post("/favorites", { wordId }),
  removeFavorite: (wordId) => api.delete(`/favorites/${wordId}`),
};

// ── Words ─────────────────────────────────────────────────────────────────────
export const wordsService = {
  getAll: (language) => api.get("/words", { params: { language } }),
  add: (data) => api.post("/words", data),
  update: (id, data) => api.put(`/words/${id}`, data),
  remove: (id) => api.delete(`/words/${id}`),
  getStats: (language) => api.get("/words/stats", { params: { language } }),
  getQuizWord: (language) => api.get("/words/quiz", { params: { language } }),
  addQuizXp: (xp) => api.post("/words/quiz-xp", { xp }),
};

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizService = {
  getAll: (params) => api.get("/quizes", { params }),
  getById: (id) => api.get(`/quizes/${id}`),
  submit: (id, data) => api.post(`/quizes/${id}/submit`, data),
  getCompleted: () => api.get("/quizes/completed/user"),
};

// ── Listen ────────────────────────────────────────────────────────────────────
export const listenService = {
  getAll: (params) => api.get("/listen", { params }),
  getById: (id) => api.get(`/listen/${id}`),
  checkAnswer: (data) => api.post("/listen/check", data),
  getProgress: () => api.get("/listen/user/progress"),
};

// ── Grammar (web) ─────────────────────────────────────────────────────────────
export const grammarService = {
  getAll: (params) => api.get("/grammar", { params }),
  getByLevel: (level) => api.get(`/grammar/level/${level}`),
  finish: (id) => api.post(`/grammar/${id}/finish`),
};

// ── Grammar App (mobile) ──────────────────────────────────────────────────────
export const grammarAppService = {
  getAll:   (params) => api.get("/grammar-app", { params }),
  getTypes: (level, language) => api.get("/grammar-app/types", { params: { level, language } }),
  getById:  (id) => api.get(`/grammar-app/${id}`),
};

// ── Chat Questions ──────────────────────────────────────────────────────────
export const questionsService = {
  getAllQuestions: (params = {}) => api.get("/questions", { params }),
  getQuestionsByLevel: (level, params = {}) =>
    api.get(`/questions/level/${level}`, { params }),
  getQuestionsByCategory: (category, params = {}) =>
    api.get(`/questions/category/${category}`, { params }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  getRandomQuestion: (params = {}) => api.get("/questions/random", { params }),
  answerQuestion: (questionId, answer) =>
    api.post(`/questions/${questionId}/answer`, { answer }),
};

// ── Practice ──────────────────────────────────────────────────────────────────
export const practiceService = {
  getAll: (params) => api.get("/practice", { params }),
  submit: (id, data) => api.post(`/practice/${id}/submit`, data),
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const leaderboardService = {
  getAllTime: () => api.get("/leaderboard/all-time"),
  getWeekly: () => api.get("/leaderboard/weekly"),
  getMonthly: () => api.get("/leaderboard/monthly"),
  getMyRank: (timeFrame = "all-time") => api.get("/leaderboard/my-rank", { params: { timeFrame } }),
};

// ── Phrases ───────────────────────────────────────────────────────────────────
export const phraseService = {
  getAll: (params) => api.get("/phrases", { params }),
  getById: (id) => api.get(`/phrases/${id}`),
  getPhrasesByLevel: (level, params = {}, language) =>
    api.get(`/phrases/level/${level}`, { params: { limit: 200, ...params, language } }),
  getFinishedPhrases: () => api.get("/phrases/user/finished"),
  getUserPhraseProgress: (level = null) =>
    api.get("/phrases/user/progress", { params: { level } }),
  markPhraseAsFinished: (phraseId) => api.post(`/phrases/${phraseId}/finish`),
  addQuizXp: (xp) => api.post("/phrases/quiz-xp", { xp }),
};

// ── TTS ───────────────────────────────────────────────────────────────────────
export const ttsService = {
  getWordAudio: (wordId) => api.post(`/tts/dictionary/${wordId}`),
  getPhraseAudio: (phraseId, text, level, language = "de") =>
    api.post(`/tts/phrase/${phraseId}`, { text, level, language })
      .then((res) => res.data?.url || res.data?.audioUrl || res.url || res.audioUrl),
  getListenAudio: (testId, data) => api.post(`/tts/audio/${testId}`, data),
  getDictionaryAudio: (wordId, text, level, language = "de") =>
    api.post(`/tts/dictionary/${wordId}`, { text, level, language })
      .then((res) => res.data?.url || res.data?.audioUrl),
  getWordAudioAudio: (setId, wordIndex, text, level, language = "de") =>
    api.post(`/tts/wordaudio/${setId}/${wordIndex}`, { text, level, language })
      .then((res) => res.data?.url || res.data?.audioUrl),
  getPronunciationAudio: (wordId, text, level, language = "de") =>
    api.post(`/tts/pronunciation/${wordId}`, { text, level, language })
      .then((res) => res.data?.url || res.data?.audioUrl || res.url || res.audioUrl),
  getCategoryAudio: (categoryId, wordIndex, text, level, language = "de") =>
    api.post(`/tts/category/${categoryId}/${wordIndex}`, { text, level, language })
      .then((res) => res.data?.url || res.data?.audioUrl || res.url || res.audioUrl),
};

// ── Word Audio ────────────────────────────────────────────────────────────────
export const wordAudioService = {
  getAllSets: (params = {}, language) =>
    api.get("/wordaudio", { params: { ...params, language } }),
  getFinishedSets: (language) =>
    api.get("/wordaudio/finished", { params: language ? { language } : {} }),
  submitQuiz: (setId, score, totalQuestions) =>
    api.post("/wordaudio/submit", { setId, score, totalQuestions }),
  submitMixedQuiz: () => api.post("/wordaudio/submit-mixed"),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
export const testService = {
  getAll: (params = {}) => api.get("/tests", { params }),
  getById: (id) => api.get(`/tests/${id}`),
  getAvailability: (userId, language = "de") =>
    api.get(`/tests/availability?userId=${userId}&language=${language}`),
  submit: (id, answers, timeSpent, userId) =>
    api.post(`/tests/${id}/submit`, { answers, timeSpent, userId }),
  submitViolation: (id, data) => api.post(`/tests/${id}/violation`, data),
};

// ── Daily Challenge ───────────────────────────────────────────────────────────
export const dailyChallengeService = {
  get:    (language = "de") => api.get("/daily-challenge", { params: { language } }),
  submit: (score, total) => api.post("/daily-challenge/submit", { score, total }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll: (params = {}) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
  seedTest: () => api.post("/notifications/test-seed"),
};

// ── Achievements ──────────────────────────────────────────────────────────────
export const achievementService = {
  getAll: () => api.get("/achievements"),
  getUserAchievements: () => api.get("/achievements/user"),
};

// ── Sentences ─────────────────────────────────────────────────────────────────
export const sentenceService = {
  getAllSentences: (params = {}) => api.get("/sentences", { params }),
  getSentencesByLevel: (level, language) => api.get(`/sentences/level/${level}`, { params: { language } }),
  getSentenceById: (id) => api.get(`/sentences/${id}`),
  submitSentence: (id, answers) => api.post(`/sentences/${id}/submit`, { answers }),
  getFinishedSentences: () => api.get("/sentences/finished"),
};

// ── Create Word ───────────────────────────────────────────────────────────────
export const createWordService = {
  getAllLessons: (params = {}) => api.get("/createword", { params }),
  submitLesson: (lessonId, answers) => api.post("/createword/submit", { lessonId, answers }),
  getFinishedLessons: () => api.get("/createword/finished"),
};

// ── Translate ─────────────────────────────────────────────────────────────────
export const translateService = {
  getAll: (params) => api.get("/translate", { params }),
  getById: (id) => api.get(`/translate/${id}`),
  submit: (id, answers) => api.post(`/translate/${id}/submit`, { answers }),
  getUserProgress: () => api.get("/translate/user/progress"),
  getTextProgress: (id) => api.get(`/translate/${id}/progress`),
};

// ── Category ──────────────────────────────────────────────────────────────────
export const categoryService = {
  getAll: (params = {}, language) => api.get("/categories", { params: { ...params, language } }),
  getById: (id) => api.get(`/categories/${id}`),
  finish: (id) => api.post(`/categories/${id}/finish`),
  getFinished: (language) => api.get("/categories/user/finished", { params: language ? { language } : {} }),
  getFinishedWords: (language) => api.get("/categories/user/finished-words", { params: language ? { language } : {} }),
};

// ── Pronunciation ─────────────────────────────────────────────────────────────
export const pronunciationService = {
  getPackages: (language = "de") => api.get("/pronunciation", { params: { language } }),
  checkPronunciation: (packageId, wordIndex, spokenWord) =>
    api.post("/pronunciation/check", { packageId, wordIndex, spokenWord }),
  getUserCompletedPackages: () => api.get("/pronunciation/completed-pronunciation-packages"),
};

// ── Hearts ────────────────────────────────────────────────────────────────────
export const heartsService = {
  get: () => api.get("/users/hearts"),
  lose: () => api.post("/users/hearts/lose"),
  gain: () => api.post("/users/hearts/gain"),
};

// ── RevenueCat / Payments ─────────────────────────────────────────────────────
export const paymentService = {
  manualGrant: (userId, productId, expirationAtMs) =>
    api.post("/payments/revenuecat/grant", { userId, productId, expirationAtMs }),
  getSubscription: (userId) => api.get(`/payments/subscription/${userId}`),
};


// ── AI Tutor ──────────────────────────────────────────────────────────────────
export const aiTutorService = {
  chat: (messages, appLanguage = "de", userLevel) =>
    api.post("/ai-tutor/chat", { messages, appLanguage, userLevel }),
};

export default api;
