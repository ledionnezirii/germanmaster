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
    // Handle subscription expired errors
    if (error.response?.status === 403 && error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
      console.log("[v0] Subscription expired, redirecting to payment page")
      localStorage.setItem("subscription_expired", "true")
      window.location.href = "/payments"
      return Promise.reject(error)
    }

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
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials)
    if (response.data?.token) {
      try {
        await api.post("/users/update-streak")
        const profileResponse = await api.get("/auth/me")
        return {
          ...response,
          data: {
            ...response.data,
            user: profileResponse.data,
          },
        }
      } catch (error) {
        console.error("[v0] Streak update failed (non-critical):", error)
      }
    }
    return response
  },

  register: (userData) =>
    api.post("/auth/signup", {
      emri: userData.firstName,
      mbiemri: userData.lastName,
      email: userData.email,
      password: userData.password,
      termsAccepted: userData.termsAccepted,
    }),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post(`/auth/reset-password/${token}`, { newPassword }),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),

  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) =>
    api.put("/users/profile", {
      emri: data.firstName,
      mbiemri: data.lastName,
    }),
  updateAvatarStyle: (avatarStyle) => api.put("/users/avatar-style", { avatarStyle }),
  updateStudyHours: (hours) => api.put("/users/study-hours", { hours }),

  getUserXp: () => api.get("/users/xp"),
  addXp: (xp, reason) => api.post("/users/add-xp", { xp, reason }),
  updateStreak: () => api.post("/users/update-streak"),
}

export const generateDicebearUrl = (userId, avatarStyle = "adventurer") => {
  if (!userId) {
    console.warn("[v0] generateDicebearUrl called with no userId, using placeholder")
    return "/placeholder.svg?height=100&width=100"
  }

  const baseStyle = avatarStyle.split("-").slice(0, -1).join("-") || avatarStyle
  const numericLastPart = avatarStyle.split("-").pop()
  const cleanStyle = numericLastPart && /^\d+$/.test(numericLastPart) ? baseStyle : avatarStyle

  const url = `https://api.dicebear.com/9.x/${cleanStyle}/svg?seed=${userId}`
  console.log(
    "[v0] Generated DiceBear URL:",
    url,
    "for user:",
    userId,
    "original style:",
    avatarStyle,
    "clean style:",
    cleanStyle,
  )
  return url
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
  getDailyLimitStatus: () => api.get("/grammar/daily-limit-status"),
}

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
  getAllPlans: () => api.get("/plan/admin/all"),
  createOrUpdatePlan: (level, planData) => api.put(`/plan/admin/${level}`, planData),
  deletePlan: (level) => api.delete(`/plan/admin/${level}`),
  markTopicAsCompleted: (planId, topicId) => api.put(`/plan/${planId}/topic/${topicId}/complete`),
  getWeekByLevel: (level, weekNumber) => api.get(`/plan/${level}/week/${weekNumber}`),
  startWeek: (level, weekNumber) => api.post(`/plan/${level}/week/${weekNumber}/start`),
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
    api.post("/pronunciation/check", {
      packageId,
      wordIndex,
      spokenWord,
      userId,
    }),
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
  submitQuiz: (quizId, answers) => api.post(`/quizes/${quizId}/submit`, { answers }),
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
  updateUserXP: (userId, xpGained) => api.post(`/users/${userId}/xp`, { xpGained }),
  getUserAchievements: (userId) => api.get(`/users/${userId}/achievements`),
  checkStreakAchievements: (userId) => api.post(`/users/${userId}/achievements/streak`),
  checkTestAchievements: (userId) => api.post(`/users/${userId}/achievements/tests`),
  getAchievementLeaderboard: () => api.get("/achievements/leaderboard"),
}

export const puzzleService = {
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

export const wordsService = {
  getLearnedWords: () => api.get("/words"),
  addLearnedWord: (wordData) => api.post("/words", wordData),
  updateLearnedWord: (id, wordData) => api.put(`/words/${id}`, wordData),
  removeLearnedWord: (id) => api.delete(`/words/${id}`),
  getWordStats: () => api.get("/words/stats"),
  addQuizXp: (xp) => api.post("/words/quiz-xp", { xp }),
}

export const phraseService = {
  getAllPhrases: (params = {}) => api.get("/phrases", { params }),
  getPhrasesByLevel: (level, params = {}) => api.get(`/phrases/level/${level}`, { params }),
  getPhraseById: (id) => api.get(`/phrases/${id}`),
  markPhraseAsFinished: (phraseId) => api.post(`/phrases/${phraseId}/finish`),
  unmarkPhraseAsFinished: (phraseId) => api.delete(`/phrases/${phraseId}/finish`),
  getFinishedPhrases: () => api.get("/phrases/user/finished"),
  getUserPhraseProgress: (level = null) => api.get("/phrases/user/progress", { params: { level } }),
  getDailyLimitStatus: () => api.get("/phrases/user/daily-limit"),
  createPhrase: (phraseData) => api.post("/phrases", phraseData),
  createBulkPhrases: (phrases) => api.post("/phrases/bulk", { phrases }),
  updatePhrase: (id, phraseData) => api.put(`/phrases/${id}`, phraseData),
  deletePhrase: (id) => api.delete(`/phrases/${id}`),
  addQuizXp: (xp) => api.post("/phrases/quiz-xp", { xp }),
}

export const ttsService = {
  getAudio: (testId, text, level) => api.post(`/tts/audio/${testId}`, { text, level }, { responseType: "blob" }),

  getDictionaryAudio: (wordId, text, level) =>
    api.post(`/tts/dictionary/${wordId}`, { text, level }, { responseType: "blob" }),

  getPhraseAudio: (phraseId, text, level) =>
    api.post(`/tts/phrase/${phraseId}`, { text, level }, { responseType: "blob" }),

  checkAudio: (id, level, type) => api.get(`/tts/check/${id}`, { params: { level, type } }),

  preGenerate: (id, text, level, type) => api.post("/tts/pre-generate", { id, text, level, type }),
}

export const sessionService = {
  getSessions: () => api.get("/auth/sessions"),
  logoutSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  logoutCurrentDevice: () => api.post("/auth/logout"),
}

export const generateAvatarOptions = () => {
  const styles = [
    "adventurer",
    "adventurer-neutral",
    "avataaars",
    "avataaars-neutral",
    "big-ears",
    "big-ears-neutral",
    "big-smile",
    "bottts",
    "bottts-neutral",
    "croodles",
    "croodles-neutral",
    "faces",
    "fun-emoji",
    "glass",
    "icons",
    "identicon",
    "initials",
    "lorelei",
    "micah",
    "miniavs",
    "notionists",
    "notionists-neutral",
    "personas",
    "personas-neutral",
    "pixel-art",
    "pixel-art-neutral",
    "rings",
    "shapes",
    "shapes-neutral",
    "thumbs",
  ]

  const seedPrefixes = Array.from({ length: 17 }, (_, i) => i + 1)

  const avatars = []
  for (const style of styles) {
    for (const prefix of seedPrefixes) {
      avatars.push(`${style}-${prefix}`)
    }
  }

  return avatars
}

export const paymentService = {
  createCheckoutSession: async (userId, priceId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/payments/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, priceId }),
    })
    if (!response.ok) throw new Error("Failed to create checkout session")
    return response.json()
  },

  getUserSubscription: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/payments/subscription/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error("Failed to fetch subscription")
    return response.json()
  },

  getUserPayments: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/payments/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error("Failed to fetch payments")
    return response.json()
  },

  cancelSubscription: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/payments/subscription/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error("Failed to cancel subscription")
    return response.json()
  },
}

// FIXED subscription service - now properly checks the subscription
export const subscriptionService = {
  checkStatus: async () => {
    console.log("[Subscription] Checking subscription status...")

    const userStr = localStorage.getItem("user")
    console.log("[Subscription] User from localStorage:", userStr)

    if (!userStr) {
      console.log("[Subscription] No user found in localStorage")
      return { active: false, expired: true, daysRemaining: 0 }
    }

    try {
      const user = JSON.parse(userStr)
      console.log("[Subscription] Parsed user:", user)

      // Check if subscription object exists
      if (!user.subscription) {
        console.log("[Subscription] No subscription object found")
        return { active: false, expired: true, daysRemaining: 0 }
      }

      const now = new Date()
      const expiresAt = new Date(user.subscription.expiresAt)

      console.log("[Subscription] Now:", now)
      console.log("[Subscription] Expires at:", expiresAt)
      console.log("[Subscription] Time difference (ms):", expiresAt - now)

      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      const isExpired = expiresAt <= now
      const isActive = user.subscription.active && !isExpired

      console.log("[Subscription] Days remaining:", daysRemaining)
      console.log("[Subscription] Is expired:", isExpired)
      console.log("[Subscription] Is active:", isActive)

      return {
        active: isActive,
        expired: isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        type: user.subscription.type,
        expiresAt: user.subscription.expiresAt,
        trialStartedAt: user.subscription.trialStartedAt,
      }
    } catch (error) {
      console.error("[Subscription] Error parsing user data:", error)
      return { active: false, expired: true, daysRemaining: 0 }
    }
  },
}

export const academyService = {
  // Academy operations
  getAllAcademies: (params = {}) => api.get("/academies", { params }),
  getAcademyById: (id) => api.get(`/academies/${id}`),
  createAcademy: (academyData) => api.post("/academies", academyData),
  updateAcademy: (id, academyData) => api.put(`/academies/${id}`, academyData),
  deleteAcademy: (id) => api.delete(`/academies/${id}`),
  getMyAcademies: () => api.get("/academies/my/list"),

  // Group operations
  createGroup: (academyId, groupData) => api.post(`/academies/${academyId}/groups`, groupData),
  updateGroup: (academyId, groupId, groupData) => api.put(`/academies/${academyId}/groups/${groupId}`, groupData),
  deleteGroup: (academyId, groupId) => api.delete(`/academies/${academyId}/groups/${groupId}`),
  getGroupById: (academyId, groupId) => api.get(`/academies/${academyId}/groups/${groupId}`),
  getMyGroups: () => api.get("/academies/groups/my"),
  getGroupInviteInfo: (academyId, groupId) => api.get(`/academies/${academyId}/groups/${groupId}/invite-info`),

  // Task operations
  createTask: (academyId, groupId, taskData) => api.post(`/academies/${academyId}/groups/${groupId}/tasks`, taskData),
  updateTask: (academyId, groupId, taskId, taskData) =>
    api.put(`/academies/${academyId}/groups/${groupId}/tasks/${taskId}`, taskData),
  deleteTask: (academyId, groupId, taskId) => api.delete(`/academies/${academyId}/groups/${groupId}/tasks/${taskId}`),
  completeTask: (academyId, groupId, taskId) =>
    api.post(`/academies/${academyId}/groups/${groupId}/tasks/${taskId}/complete`),
  getMyTasks: () => api.get("/academies/tasks/my"),

  // Invitation operations
  inviteStudent: (academyId, groupId, email) => api.post(`/academies/${academyId}/groups/${groupId}/invite`, { email }),
  getMyInvitations: () => api.get("/academies/invitations/my"),
  acceptInvitation: (academyId, groupId) => api.post(`/academies/${academyId}/groups/${groupId}/accept`),
  rejectInvitation: (invitationId) => api.post(`/academies/invitations/${invitationId}/reject`),

  // Leaderboard
  getGroupLeaderboard: (academyId, groupId) => api.get(`/academies/${academyId}/groups/${groupId}/leaderboard`),
  getAcademyLeaderboard: (academyId) => api.get(`/academies/${academyId}/leaderboard`),

  // Member management
  removeMember: (academyId, groupId, userId) =>
    api.delete(`/academies/${academyId}/groups/${groupId}/members/${userId}`),
  addGroupAdmin: (academyId, groupId, userId) =>
    api.post(`/academies/${academyId}/groups/${groupId}/admins`, { userId }),
  removeGroupAdmin: (academyId, groupId, userId) =>
    api.delete(`/academies/${academyId}/groups/${groupId}/admins/${userId}`),
}




export const raceService = {
  getAvailableRooms: (params = {}) => api.get("/race/rooms", { params }),
  getRoomById: (roomId) => api.get(`/race/rooms/${roomId}`),
  getRoomByCode: (roomCode) => api.get(`/race/rooms/code/${roomCode}`),
  createRoom: (roomData) => api.post("/race/create", roomData),
  joinRoom: (roomId) => api.post(`/race/rooms/${roomId}/join`),
  leaveRoom: (roomId) => api.post(`/race/rooms/${roomId}/leave`),
  deleteRoom: (roomId) => api.delete(`/race/rooms/${roomId}`),
  getUserRaceStats: () => api.get("/race/stats"),
}


export default api
