import axios from "axios"

const API_BASE_URL = "/api"
export const SOCKET_URL = "https://gjuhagjermaneserver.onrender.com"

export const getAbsoluteImageUrl = (path) => {
  if (!path) return "/placeholder.svg?height=40&width=40"

  if (path.startsWith("http")) return path

  const baseServerUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseServerUrl}${normalizedPath}`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.url?.includes("puzzle")) {
    console.log("[v0] REQUEST INTERCEPTOR - Full URL:", config.baseURL + config.url)
    console.log("[v0] REQUEST INTERCEPTOR - Method:", config.method)
    console.log("[v0] REQUEST INTERCEPTOR - Data:", config.data)
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("completed-pronunciation-packages")) {
      console.log("[v0] API Response interceptor - Original response.data:", response.data)
      console.log("[v0] API Response interceptor - response.data.data:", response.data.data)
      console.log("[v0] API Response interceptor - Final data will be:", response.data.data || response.data)
    }

    return {
      ...response,
      data: response.data.data || response.data,
    }
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/signin") &&
      !window.location.pathname.includes("/signup")
    ) {
      localStorage.removeItem("authToken")
      window.location.href = "/signin"
    }
    return Promise.reject(error)
  },
)

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

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post(`/auth/reset-password/${token}`, { newPassword }),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
}

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

export const favoritesService = {
  getFavorites: (params = {}) => api.get("/favorites", { params }),
  addFavorite: (wordId, notes) => api.post("/favorites", { wordId, notes }),
  removeFavorite: (wordId) => api.delete(`/favorites/${wordId}`),
  updateFavoriteNotes: (wordId, notes) => api.put(`/favorites/${wordId}`, { notes }),
  checkFavorite: (wordId) => api.get(`/favorites/check/${wordId}`),
  getFavoritesByLevel: (level) => api.get(`/favorites/level/${level}`),
  getFavoriteStats: () => api.get("/favorites/stats"),
}

export const categoriesService = {
  getAllCategories: (params = {}) => api.get("/categories", { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post("/categories", categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  addWordToCategory: (categoryId, wordData) => api.post(`/categories/${categoryId}`, wordData),
  removeWordFromCategory: (categoryId, wordId) => api.delete(`/categories/${categoryId}/words/${wordId}`),
  finishCategory: (categoryId) => api.post(`/categories/${categoryId}/finish`),
  getFinishedCategories: () => api.get("/categories/user/finished"),
}

export const listenService = {
  getAllTests: (params = {}) => api.get("/listen", { params }),
  getTestsByLevel: (level, params = {}) => api.get(`/listen/level/${level}`, { params }),
  getTestById: (id) => api.get(`/listen/${id}`),
  checkAnswer: (testId, userAnswer) => api.post("/listen/check", { testId, userAnswer }),
  markAsListened: (testId) => api.post(`/listen/${testId}`),
  getUserProgress: () => api.get("/listen/user/progress"),
  createTest: (testData) => api.post("/listen", testData),
  updateTest: (id, testData) => api.put(`/listen/${id}`, testData),
  deleteTest: (id) => api.delete(`/listen/${id}`),
}

export const translateService = {
  getAllTexts: (params = {}) => api.get("/translate", { params }),
  getTextById: (id) => api.get(`/translate/${id}`),
  // FIXED: Added /submit to the URL and wrapped answers in an object
  submitAnswers: (textId, answers) => api.post(`/translate/${textId}/submit`, { answers }),
  getTextProgress: (textId) => api.get(`/translate/${textId}/progress`),
  getUserProgress: () => api.get("/translate/user/progress"),
  createText: (textData) => api.post("/translate", textData),
  updateText: (id, textData) => api.put(`/translate/${id}`, textData),
  deleteText: (id) => api.delete(`/translate/${id}`),
}

export const grammarService = {
  getAllTopics: (params = {}) => api.get("/grammar", { params }),
  getTopicsByLevel: (level, params = {}) => api.get(`/grammar/level/${level}`, { params }),
  getTopicById: (id) => api.get(`/grammar/${id}`),
  createTopic: (topicData) => api.post("/grammar", topicData),
  updateTopic: (id, topicData) => api.put(`/grammar/${id}`, topicData),
  deleteTopic: (id) => api.delete(`/grammar/${id}`),
  markTopicAsFinished: (id) => api.post(`/grammar/${id}/finish`),
  getFinishedTopics: () => api.get("/grammar/finished"),
}

export const questionsService = {
  getAllQuestions: (params = {}) => api.get("/questions", { params }),
  getQuestionsByLevel: (level, params = {}) => api.get(`/questions/level/${level}`, { params }),
  getQuestionsByCategory: (category, params = {}) => api.get(`/questions/category/${category}`, { params }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  // FIXED: Added /answer to the URL and wrapped answer in an object
  answerQuestion: (questionId, answer) => api.post(`/questions/${questionId}/answer`, { answer }),
  getRandomQuestion: (params = {}) => api.get("/questions/random", { params }),
  createQuestion: (questionData) => api.post("/questions", questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
}

export const challengeService = {
  getChallengeQuestions: (count = 10, category = null, gameType = "quiz") => {
    const params = new URLSearchParams()
    if (count) params.append("count", count)
    if (category) params.append("category", category)
    if (gameType) params.append("gameType", gameType)
    return api.get(`/challenge/challengeQuestions?${params}`)
  },
  getChallengeStats: () => api.get("/challenge/challengeStats"),
  getChallengeHistory: (username, limit = 10) => api.get(`/challenge/challengeHistory/${username}?limit=${limit}`),
  getChallengeLeaderboard: (limit = 10) => api.get(`/challenge/challengeLeaderboard?limit=${limit}`),
  getActiveRooms: () => api.get("/challenge/activeRooms"),
  getCategories: () => api.get("/challenge/categories"),
  getPracticeQuestions: (count = 5, category = null, gameType = "quiz") =>
    api.post("/challenge/practice", { count, category, gameType }),
  getChallengeByRoomId: (roomId) => api.get(`/challenge/room/${roomId}`),
  submitChallengeFeedback: (challengeId, feedback) => api.post(`/challenge/${challengeId}`, feedback),
  getUserChallengeStats: (userId) => api.get(`/challenge/user/${userId}/stats`),
  reportChallengeIssue: (challengeId, issue) => api.post(`/challenge/${challengeId}`, issue),
  getDifficultyLevels: () => api.get("/challenge/difficulty-levels"),
  getQuestionsByDifficulty: (difficulty, count = 10) =>
    api.get(`/challenge/questions/difficulty/${difficulty}?count=${count}`),
  getDailyChallenge: () => api.get("/challenge/daily"),
  submitDailyChallenge: (answers) => api.post("/challenge/daily/submit", { answers }),
  getWeeklyLeaderboard: (limit = 10) => api.get(`/challenge/leaderboard/weekly?limit=${limit}`),
  getChallengeAchievements: (userId) => api.post(`/challenge/achievements/${userId}`),
  unlockAchievement: (achievementId) => api.post(`/challenge/achievements/${achievementId}`),
}

export const planService = {
  getPlanByLevel: (level) => api.get(`/plan/${level}`),
  markTopicAsCompleted: (planId, topicId) => api.put(`/plan/${planId}/topic/${topicId}/complete`),
  createPlan: (level, topics) => api.post("/plan", { level, topics }),
}

export const testService = {
  getAllTests: (params = {}) => api.get("/tests", { params }),
  getTestById: (id) => api.get(`/tests/${id}`),
  getTestQuestions: (id) => api.get(`/tests/${id}/questions`),
  getTestStats: () => api.get("/tests/stats"),
  submitTest: (id, answers, timeSpent, userId) => api.post(`/tests/${id}/submit`, { answers, timeSpent, userId }),
  getTestAvailability: (userId) => api.get(`/tests/availability?userId=${userId}`),
  createTest: (testData) => api.post("/tests", testData),
  updateTest: (id, testData) => api.put(`/tests/${id}`, testData),
  deleteTest: (id) => api.delete(`/tests/${id}`),
}

export const pronunciationService = {
  getWords: (params = {}) => {
    console.log("[v0] Getting pronunciation words...")
    return api.get("/pronunciation", { params })
  },
  addPackage: (packageData) => api.post("/pronunciation", packageData),
  checkPronunciation: (packageId, wordIndex, spokenWord, userId) =>
    api.post("/pronunciation/check", { packageId, wordIndex, spokenWord, userId }),
  getUserCompletedPackages: () => {
    return api.get("/pronunciation/completed-pronunciation-packages")
  },
}

export const quizService = {
  getAllQuizzes: () => api.get("/quizes"),
  getQuizById: (id) => api.get(`/quizes/${id}`),
  createQuiz: (quizData) => api.post("/quizes", quizData),
  createBulkQuizzes: (quizzes) => api.post("/quizes/bulk", quizzes),
  updateQuiz: (id, quizData) => api.put(`/quizes/${id}`, quizData),
  deleteQuiz: (id) => api.delete(`/quizes/${id}`),

  // SUBMIT QUIZ
  submitQuiz: (quizId, answers) => api.post(`/quizes/${quizId}/submit`, { answers }),

  // GET ALL COMPLETED QUIZZES FOR LOGGED-IN USER
  getCompletedQuizzes: () => api.get("/quizes/completed/user"),
}

export const certificatesService = {
  getUserCertificates: () => api.get("/certificates"),
  issueCertificate: () => api.post("/certificates/issue"),
  downloadCertificate: (certificateId) =>
    api.get(`/certificates/download/${certificateId}`, {
      responseType: "blob",
    }),
  generateCertificateForLevel: (userId, level) => api.post("/certificates/generate", { userId, level }),
}

export const achievementsService = {
  // Update user's XP and check for achievements
  updateUserXP: (userId, xpGained) => api.post(`/users/${userId}/xp`, { xpGained }),

  // Get all achievements for a user (locked and unlocked)
  getUserAchievements: (userId) => api.get(`/users/${userId}/achievements`),

  // Check and update streak-based achievements
  checkStreakAchievements: (userId) => api.post(`/users/${userId}/achievements/streak`),

  // Check and update test-based achievements
  checkTestAchievements: (userId) => api.post(`/users/${userId}/achievements/tests`),

  // Get achievement leaderboard
  getAchievementLeaderboard: () => api.get("/achievements/leaderboard"),
}

export const puzzleService = {
  // User endpoints
  getTodayPuzzle: () => {
    console.log("[v0] Calling getTodayPuzzle API...")
    return api.get("/puzzle/today").then((response) => {
      console.log("[v0] getTodayPuzzle - Raw axios response:", response)
      console.log("[v0] getTodayPuzzle - response.data:", response.data)
      console.log("[v0] getTodayPuzzle - response.data._id:", response.data?._id)
      return response.data
    })
  },
  submitAnswer: (puzzleId, currentGuess) => {
    console.log("[v0] submitAnswer called with puzzleId:", puzzleId, "currentGuess:", currentGuess)
    const url = `/puzzle/${puzzleId}/submit`
    return api.post(url, { guess: currentGuess }).then((response) => response.data)
  },
  getUserProgress: () => api.get("/puzzle/user/progress"),
  getCompletedPuzzles: () => api.get("/puzzle/completed"),

  // Admin endpoints
  getAllPuzzles: (params = {}) => api.get("/puzzle/admin/all", { params }),
  createPuzzle: (puzzleData) => api.post("/puzzle/admin", puzzleData),
  createBulkPuzzles: (puzzles) => api.post("/puzzle/admin/bulk", { puzzles }),
  updatePuzzle: (id, puzzleData) => api.put(`/puzzle/admin/${id}`, puzzleData),
  deletePuzzle: (id) => api.delete(`/puzzle/admin/${id}`),
  getPuzzleById: (id) => api.get(`/puzzle/admin/${id}`),
}

export const practiceService = {
  getAllPractices: (params = {}) => api.get("/practice", { params }),
  getPracticeById: (id) => api.get(`/practice/${id}`),
  submitPractice: (id, answers) => api.post(`/practice/${id}/submit`, { answers }),
  getUserProgress: () => api.get("/practice/user/progress"),
  getFinishedPractices: () => api.get("/practice/user/finished"),
  getPracticeStats: () => api.get("/practice/stats"),
  createPractice: (practiceData) => api.post("/practice", practiceData),
  createBulkPractices: (practices) => api.post("/practice/bulk", { practices }),
  updatePractice: (id, practiceData) => api.put(`/practice/${id}`, practiceData),
  deletePractice: (id) => api.delete(`/practice/${id}`),
}

export default api
