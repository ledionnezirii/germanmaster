import axios from "axios"

// Define the API base URL. For production, you will need to change this
// to your deployed backend API URL (e.g., "https://your-backend-api.com/api").
const API_BASE_URL = "http://localhost:5000/api"

// Define the WebSocket URL. For production, you will need to change this
// to your deployed backend WebSocket URL (e.g., "https://your-backend-api.com").
export const SOCKET_URL = "http://localhost:5000" // This is the URL for your socket.io server

// Helper function to construct an absolute URL for images
export const getAbsoluteImageUrl = (relativePath) => {
  if (!relativePath) return "/placeholder.svg?height=40&width=40" // Default placeholder
  // Assuming your images are served from the same base as your API, but without the '/api' suffix
  const baseServerUrl = API_BASE_URL.replace("/api", "")
  // Ensure the relativePath starts with a '/'
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`
  return `${baseServerUrl}${normalizedPath}`
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors and extract data
api.interceptors.response.use(
  (response) => {
    // Extract data from the new ApiResponse format
    return {
      ...response,
      data: response.data.data || response.data,
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken")
      window.location.href = "/signin"
    }
    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) =>
    api.post("/auth/signup", {
      emri: userData.firstName,
      mbiemri: userData.lastName,
      email: userData.email,
      password: userData.password,
    }),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) =>
    api.put("/users/profile", {
      emri: data.firstName,
      mbiemri: data.lastName,
    }),
  uploadProfilePicture: (formData) =>
    api.post("/users/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStudyHours: (hours) => api.put("/users/study-hours", { hours }),
  getUserXp: () => api.get("/users/xp"),
  addXp: (xp, reason) => api.post("/users/add-xp", { xp, reason }),
}

// Dictionary services
export const dictionaryService = {
  getAllWords: (params = {}) => api.get("/dictionary", { params }),
  getWordsByLevel: (level, params = {}) => api.get(`/dictionary/level/${level}`, { params }),
  getWordById: (id) => api.get(`/dictionary/${id}`),
  searchWords: (query, level) => api.get("/dictionary/search", { params: { q: query, level } }),
  addWord: (wordData) => api.post("/dictionary", wordData),
  addMultipleWords: (words) => api.post("/dictionary/bulk", { words }),
  updateWord: (id, wordData) => api.put(`/dictionary/${id}`, wordData),
  deleteWord: (id) => api.delete(`/dictionary/${id}`),
}

// Favorites services
export const favoritesService = {
  getFavorites: (params = {}) => api.get("/favorites", { params }),
  addFavorite: (wordId, notes) => api.post("/favorites", { wordId, notes }),
  removeFavorite: (wordId) => api.delete(`/favorites/${wordId}`),
  updateFavoriteNotes: (wordId, notes) => api.put(`/favorites/${wordId}`, { notes }),
  checkFavorite: (wordId) => api.get(`/favorites/check/${wordId}`),
  getFavoritesByLevel: (level) => api.get(`/favorites/level/${level}`),
  getFavoriteStats: () => api.get("/favorites/stats"),
}

// Categories services
export const categoriesService = {
  getAllCategories: (params = {}) => api.get("/categories", { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post("/categories", categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  addWordToCategory: (categoryId, wordData) => api.post(`/categories/${categoryId}/words`, wordData),
  removeWordFromCategory: (categoryId, wordId) => api.delete(`/categories/${categoryId}/words/${wordId}`),
}

// Listen services
export const listenService = {
  getAllTests: (params = {}) => api.get("/listen", { params }),
  getTestsByLevel: (level, params = {}) => api.get(`/listen/level/${level}`, { params }),
  getTestById: (id) => api.get(`/listen/${id}`),
  checkAnswer: (testId, userAnswer) => api.post("/listen/check", { testId, userAnswer }),
  markAsListened: (testId) => api.post(`/listen/${testId}/mark-listened`),
  getUserProgress: () => api.get("/listen/user/progress"),
  createTest: (testData) => api.post("/listen", testData),
  updateTest: (id, testData) => api.put(`/listen/${id}`, testData),
  deleteTest: (id) => api.delete(`/listen/${id}`),
}

// Translate services
export const translateService = {
  getAllTexts: (params = {}) => api.get("/translate", { params }),
  getTextById: (id) => api.get(`/translate/${id}`),
  submitAnswers: (textId, answers) => api.post(`/translate/${textId}/submit`, { answers }),
  getTextProgress: (textId) => api.get(`/translate/${textId}/progress`),
  getUserProgress: () => api.get("/translate/user/progress"),
  createText: (textData) => api.post("/translate", textData),
  updateText: (id, textData) => api.put(`/translate/${id}`, textData),
  deleteText: (id) => api.delete(`/translate/${id}`),
}

// Grammar services
export const grammarService = {
  getAllTopics: (params = {}) => api.get("/grammar", { params }),
  getTopicsByLevel: (level, params = {}) => api.get(`/grammar/level/${level}`, { params }),
  getTopicById: (id) => api.get(`/grammar/${id}`),
  createTopic: (topicData) => api.post("/grammar", topicData),
  updateTopic: (id, topicData) => api.put(`/grammar/${id}`, topicData),
  deleteTopic: (id) => api.delete(`/grammar/${id}`),
}

// Questions services (for chat/grammar)
export const questionsService = {
  getAllQuestions: (params = {}) => api.get("/questions", { params }),
  getQuestionsByLevel: (level, params = {}) => api.get(`/questions/level/${level}`, { params }),
  getQuestionsByCategory: (category, params = {}) => api.get(`/questions/category/${category}`, { params }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  answerQuestion: (questionId, answer) => api.post(`/questions/${questionId}/answer`, { answer }),
  getRandomQuestion: (params = {}) => api.get("/questions/random", { params }),
  createQuestion: (questionData) => api.post("/questions", questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
}

// Challenge services
export const challengeService = {
  // Get random challenge questions (now supports gameType)
  getChallengeQuestions: (count = 10, category = null, gameType = "quiz") => {
    // NEW: gameType
    const params = new URLSearchParams()
    if (count) params.append("count", count)
    if (category) params.append("category", category)
    if (gameType) params.append("gameType", gameType) // NEW: Add gameType to params
    return api.get(`/challenge/challengeQuestions?${params}`)
  },
  // Get challenge statistics
  getChallengeStats: () => api.get("/challenge/challengeStats"),
  // Get user challenge history
  getChallengeHistory: (username, limit = 10) => api.get(`/challenge/challengeHistory/${username}?limit=${limit}`),
  // Get challenge leaderboard
  getChallengeLeaderboard: (limit = 10) => api.get(`/challenge/challengeLeaderboard?limit=${limit}`),
  // Get active challenge rooms
  getActiveRooms: () => api.get("/challenge/activeRooms"),
  // Get available categories
  getCategories: () => api.get("/challenge/categories"),
  // Get practice questions (now supports gameType)
  getPracticeQuestions: (count = 5, category = null, gameType = "quiz") =>
    api.post("/challenge/practice", { count, category, gameType }), // NEW: gameType
  // Get challenge by room ID (for spectator mode)
  getChallengeByRoomId: (roomId) => api.get(`/challenge/room/${roomId}`),
  // Submit challenge feedback
  submitChallengeFeedback: (challengeId, feedback) => api.post(`/challenge/${challengeId}/feedback`, { feedback }),
  // Get user's challenge statistics
  getUserChallengeStats: (userId) => api.get(`/challenge/user/${userId}/stats`),
  // Report a challenge issue
  reportChallengeIssue: (challengeId, issue) => api.post(`/challenge/${challengeId}/report`, { issue }),
  // Get challenge difficulty levels
  getDifficultyLevels: () => api.get("/challenge/difficulty-levels"),
  // Get questions by difficulty
  getQuestionsByDifficulty: (difficulty, count = 10) =>
    api.get(`/challenge/questions/difficulty/${difficulty}?count=${count}`),
  // Get daily challenge
  getDailyChallenge: () => api.get("/challenge/daily"),
  // Submit daily challenge result
  submitDailyChallenge: (answers) => api.post("/challenge/daily/submit", { answers }),
  // Get weekly leaderboard
  getWeeklyLeaderboard: (limit = 10) => api.get(`/challenge/leaderboard/weekly?limit=${limit}`),
  // Get monthly leaderboard: (limit = 10) => api.get(`/challenge/leaderboard/monthly?limit=${limit}`),
  // Get challenge achievements
  getChallengeAchievements: (userId) => api.get(`/challenge/achievements/${userId}`),
  // Unlock achievement
  unlockAchievement: (achievementId) => api.post(`/challenge/achievements/${achievementId}/unlock`),
}

export default api
