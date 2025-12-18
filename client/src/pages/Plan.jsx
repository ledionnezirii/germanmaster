"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Check,
  AlertCircle,
  BookOpen,
  Lock,
  Sparkles,
  Pen,
  Calendar,
  Clock,
  Award,
  Target,
  Play,
} from "lucide-react"
// API services
const API_BASE_URL = "/api"

const api = {
  get: async (url) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    const data = await response.json()
    return data.data || data
  },
  post: async (url, body) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    const data = await response.json()
    return data.data || data
  },
  put: async (url, body) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    const data = await response.json()
    return data.data || data
  }
}

const authService = {
  getProfile: () => api.get("/auth/me")
}

const planService = {
  getPlanByLevel: (level) => api.get(`/plan/${level}`),
  startWeek: (level, weekNumber) => api.post(`/plan/${level}/week/${weekNumber}/start`),
  markTopicAsCompleted: (planId, topicId) => api.put(`/plan/${planId}/topic/${topicId}/complete`)
}

function ConfirmationDialog({ isOpen, onClose, onConfirm, weekNumber, loading }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scale-in">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <Play className="w-7 h-7 text-emerald-600" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">Fillo Javën {weekNumber}?</h3>

        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base leading-relaxed">
          Duke filluar këtë javë, ajo do të bllokohet për <strong>7 ditë</strong>. Javët e tjera do të mbeten të hapura
          që të mund të vazhdoni mësimin tuaj.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Anullo
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Duke filluar...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Po, Fillo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!targetDate) return

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

export default function PlanPage() {
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [plan, setPlan] = useState(null)
  const [userXp, setUserXp] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittingTopicId, setSubmittingTopicId] = useState(null)
  const [lockStatus, setLockStatus] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, weekNumber: null })
  const [startingWeek, setStartingWeek] = useState(false)

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  useEffect(() => {
    const fetchPlanAndXp = async () => {
      if (!selectedLevel) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const xpResponse = await authService.getProfile()
        console.log("[PlanPage] XP Response:", xpResponse)
        // Handle both nested and flat response structures
        const xpValue = xpResponse.xp || xpResponse.user?.xp || 0
        setUserXp(xpValue)

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        console.log("[PlanPage] Plan Response:", planResponse)
        // Response is already unwrapped by interceptor
        setPlan(planResponse)
        setLockStatus(planResponse.lockStatus)
      } catch (err) {
        console.error(`Failed to fetch plan or XP for level ${selectedLevel}:`, err)
        setError(
          `Dështoi ngarkimi i planit të mësimit të gjermanishtes për nivelin ${selectedLevel}. Ju lutemi provoni përsëri.`,
        )
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPlanAndXp()
  }, [selectedLevel])

  const handleLevelSelect = (level) => {
    setSelectedLevel(level)
    setSelectedWeek(null)
    setPlan(null)
    setError(null)
    setLockStatus(null)
  }

  const handleWeekButtonClick = (weekNumber, isLocked, isActiveWeek) => {
    // Block if locked (another week is active)
    if (isLocked) return

    // If it's already the active week, go directly to content
    if (isActiveWeek) {
      setSelectedWeek(weekNumber)
      return
    }

    // Show confirmation dialog for new weeks
    setConfirmDialog({ isOpen: true, weekNumber })
  }

  const handleConfirmStartWeek = async () => {
    const weekNumber = confirmDialog.weekNumber
    console.log("[PlanPage] Starting week:", weekNumber, "for level:", selectedLevel)

    try {
      setStartingWeek(true)
      console.log("[PlanPage] Calling API to start week...")

      const response = await planService.startWeek(selectedLevel, weekNumber)
      console.log("[PlanPage] Start week API response:", response)

      // Check if we got a successful response (has weekNumber and message)
      if (response && response.weekNumber) {
        console.log("[PlanPage] Week started successfully, fetching updated plan...")
        
        const planResponse = await planService.getPlanByLevel(selectedLevel)
        console.log("[PlanPage] Updated plan response:", planResponse)

        setPlan(planResponse)
        setLockStatus(planResponse.lockStatus)

        setConfirmDialog({ isOpen: false, weekNumber: null })

        // Navigate to the week
        setTimeout(() => {
          console.log("[PlanPage] Navigating to week:", weekNumber)
          setSelectedWeek(weekNumber)
        }, 100)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("[PlanPage] Failed to start week:", err)
      console.error("[PlanPage] Error response:", err.response?.data)

      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Dështoi fillimi i javës. Ju lutemi provoni përsëri.")
      }
      setConfirmDialog({ isOpen: false, weekNumber: null })
    } finally {
      setStartingWeek(false)
    }
  }

  const handleBackToWeeks = () => setSelectedWeek(null)

  const handleMarkAsFinished = async (topicId) => {
    if (!plan || submittingTopicId) return

    setSubmittingTopicId(topicId)

    // Optimistically update UI
    setPlan((prevPlan) => {
      if (!prevPlan?.weeks) return null

      const updatedWeeks = prevPlan.weeks.map((week) => {
        if (week.weekNumber === selectedWeek) {
          const updatedTopics = week.topics.map((topic) =>
            topic._id === topicId
              ? { ...topic, isCompleted: true, xpAwarded: 100, completedAt: new Date().toISOString() }
              : topic,
          )
          return { ...week, topics: updatedTopics }
        }
        return week
      })
      return { ...prevPlan, weeks: updatedWeeks }
    })

    try {
      const response = await planService.markTopicAsCompleted(plan._id, topicId)
      console.log("[PlanPage] Mark topic completed response:", response)
      
      // Response is unwrapped by interceptor
      if (response && (response.success || response.data)) {
        const newXp = response.data?.userXp || response.userXp
        if (newXp) {
          setUserXp(newXp)
        }
        
        // Refresh the plan to get accurate data
        const planResponse = await planService.getPlanByLevel(selectedLevel)
        setPlan(planResponse)
      }
    } catch (err) {
      console.error("Failed to mark topic as finished:", err)
      
      // Revert optimistic update on error
      setPlan((prevPlan) => {
        if (!prevPlan?.weeks) return null
        const revertedWeeks = prevPlan.weeks.map((week) => {
          if (week.weekNumber === selectedWeek) {
            const revertedTopics = week.topics.map((topic) =>
              topic._id === topicId ? { ...topic, isCompleted: false, xpAwarded: 0, completedAt: undefined } : topic,
            )
            return { ...week, topics: revertedTopics }
          }
          return week
        })
        return { ...prevPlan, weeks: revertedWeeks }
      })

      setError(err.response?.data?.message || "Dështoi shënimi i temës si e përfunduar. Ju lutemi provoni përsëri.")
    } finally {
      setSubmittingTopicId(null)
    }
  }

  const isTopicLocked = (index) => {
    if (!plan?.weeks || !selectedWeek) return false

    const currentWeek = plan.weeks.find((w) => w.weekNumber === selectedWeek)
    if (!currentWeek?.topics || index === 0) return false

    for (let i = 0; i < index; i++) {
      if (!currentWeek.topics[i].isCompleted) return true
    }
    return false
  }

  const levelConfigs = [
    {
      gradient: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      text: "text-emerald-600",
      hover: "hover:border-emerald-400 hover:shadow-emerald-100",
    },
    {
      gradient: "from-blue-50 to-cyan-50",
      border: "border-blue-200",
      text: "text-blue-600",
      hover: "hover:border-blue-400 hover:shadow-blue-100",
    },
    {
      gradient: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      text: "text-violet-600",
      hover: "hover:border-violet-400 hover:shadow-violet-100",
    },
    {
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      text: "text-amber-600",
      hover: "hover:border-amber-400 hover:shadow-amber-100",
    },
    {
      gradient: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      text: "text-rose-600",
      hover: "hover:border-rose-400 hover:shadow-rose-100",
    },
    {
      gradient: "from-indigo-50 to-blue-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      hover: "hover:border-indigo-400 hover:shadow-indigo-100",
    },
  ]

  const levelNames = { A1: "Fillestar", A2: "Paramesatar", B1: "Mesatar", B2: "I lartë", C1: "Avancuar", C2: "Zotërim" }

  // Level Selection View
  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-12 lg:py-20">
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-5 sm:p-8 md:p-10 mb-8 sm:mb-12 lg:mb-20 animate-fade-in">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Pen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-900 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Zgjidhni Nivelin Tuaj
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                  Filloni udhëtimin tuaj të mësimit të gjermanishtes duke zgjedhur nivelin që ju përshtatet më mirë
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {levels.map((level, index) => (
              <button
                key={level}
                onClick={() => handleLevelSelect(level)}
                className={`bg-gradient-to-br ${levelConfigs[index].gradient} border-2 ${levelConfigs[index].border} ${levelConfigs[index].hover} rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-2xl shadow-lg hover:-translate-y-1`}
              >
                <div className={`text-3xl sm:text-4xl font-bold ${levelConfigs[index].text} mb-2 sm:mb-3`}>{level}</div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">{levelNames[level]}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200 border-t-emerald-500"></div>
          </div>
          <p className="text-gray-600 font-medium text-base sm:text-lg">
            Po ngarkohet plani për nivelin {selectedLevel}...
          </p>
        </div>
      </div>
    )
  }

  // Error View
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border-2 border-red-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center max-w-md shadow-2xl shadow-red-100">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-red-500 shadow-xl shadow-red-500/30">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <p className="text-red-600 mb-6 sm:mb-8 font-medium text-base sm:text-lg">{error}</p>
          <button
            onClick={() => {
              setSelectedLevel(null)
              setError(null)
            }}
            className="w-full sm:w-auto bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl"
          >
            Kthehu te Zgjedhja e Nivelit
          </button>
        </div>
      </div>
    )
  }

  // No Plan Found View
  if (!plan?.weeks?.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gray-100">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-700 mb-6 sm:mb-8 font-medium text-base sm:text-lg">
            Nuk u gjet plan për nivelin {selectedLevel}.
          </p>
          <button
            onClick={() => setSelectedLevel(null)}
            className="w-full sm:w-auto bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl"
          >
            Kthehu te Zgjedhja e Nivelit
          </button>
        </div>
      </div>
    )
  }

  // Week Topics View
  if (selectedWeek) {
    console.log("[PlanPage] Rendering week content for week:", selectedWeek)
    const currentWeek = plan.weeks.find((w) => w.weekNumber === selectedWeek)

    console.log("[PlanPage] Current week data:", currentWeek)

    if (!currentWeek) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Java nuk u gjet.</p>
            <button
              onClick={handleBackToWeeks}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
            >
              Kthehu te Javët
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-4 md:p-8 shadow-xl backdrop-blur-md mb-6 sm:mb-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <button
                onClick={handleBackToWeeks}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all text-sm font-medium shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Kthehu te Javët
              </button>
              <div className="flex-1">
                <h1 className="mb-1 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-2xl md:text-4xl font-bold text-transparent">
                  {currentWeek.title}
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  {currentWeek.description || `Përfundoni të gjitha temat e javës ${selectedWeek}`}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <Award className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">{userXp} XP</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Progresi i Javës</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {currentWeek.progress.completed}/{currentWeek.progress.total} tema
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${currentWeek.progress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{currentWeek.progress.percentage}% e përfunduar</p>
          </div>

          <div className="space-y-4">
            {currentWeek.topics.map((topic, index) => {
              const locked = isTopicLocked(index)
              const isSubmitting = submittingTopicId === topic._id

              return (
                <div
                  key={topic._id}
                  className={`bg-white rounded-2xl border-2 p-6 transition-all duration-300 ${
                    locked
                      ? "border-gray-200 bg-gray-50/50 opacity-60"
                      : topic.isCompleted
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-gray-200 hover:border-emerald-200 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        locked
                          ? "bg-gray-200 text-gray-500"
                          : topic.isCompleted
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {locked ? (
                        <Lock className="w-5 h-5" />
                      ) : topic.isCompleted ? (
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold mb-2 ${locked ? "text-gray-500" : "text-gray-900"}`}>
                        {topic.title}
                      </h3>
                      <p className={`text-sm mb-4 ${locked ? "text-gray-400" : "text-gray-600"}`}>
                        {topic.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            locked
                              ? "bg-gray-100 text-gray-500"
                              : topic.isCompleted
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          {topic.xpReward || 100} XP
                        </div>

                        {topic.isCompleted && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />E përfunduar
                          </div>
                        )}

                        {locked && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">
                            <Lock className="w-3.5 h-3.5" />E bllokuar
                          </div>
                        )}
                      </div>
                    </div>

                    {!locked && !topic.isCompleted && (
                      <button
                        onClick={() => handleMarkAsFinished(topic._id)}
                        disabled={isSubmitting}
                        className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-sm">Duke ruajtur...</span>
                          </div>
                        ) : (
                          <span className="text-sm">Shëno si të Përfunduar</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function CountdownTimer({ lockedUntil }) {
    const timeLeft = useCountdown(lockedUntil)

    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
      return <span className="text-xs text-amber-800 font-medium">Duke u zhbllokuar...</span>
    }

    return (
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900">
        {timeLeft.days > 0 && <span className="bg-amber-100 px-2 py-1 rounded">{timeLeft.days}d</span>}
        <span className="bg-amber-100 px-2 py-1 rounded">{timeLeft.hours}h</span>
        <span className="bg-amber-100 px-2 py-1 rounded">{timeLeft.minutes}m</span>
        <span className="bg-amber-100 px-2 py-1 rounded">{timeLeft.seconds}s</span>
      </div>
    )
  }

  // Weeks Selection View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-12">
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, weekNumber: null })}
        onConfirm={handleConfirmStartWeek}
        weekNumber={confirmDialog.weekNumber}
        loading={startingWeek}
      />

      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-4 md:p-8 shadow-xl backdrop-blur-md mb-6 sm:mb-10 lg:mb-12">
          <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 text-center md:flex-row md:text-left">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="mb-1 md:mb-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-2xl md:text-4xl font-bold text-transparent">
                Gjermanisht {plan.level} - Zgjidhni Javën
              </h1>
              <p className="text-sm md:text-base text-gray-600">Çdo javë përmban tema që duhet të përfundoni</p>
            </div>
            <button
              onClick={() => setSelectedLevel(null)}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Ndrysho Nivelin
            </button>
          </div>
        </div>

        {lockStatus?.isLocked && (
          <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
                  Java Aktive: Java {lockStatus.activeWeekNumber}
                </h3>
                <p className="text-amber-800 text-xs sm:text-sm leading-relaxed mb-3">
                  Kjo javë është e hapur për 7 ditë për t'ju ndihmuar të përqendroheni. Javët e tjera janë ende të
                  mbyllura.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-amber-900">Zhbllokohet pas:</span>
                  <CountdownTimer lockedUntil={lockStatus.lockedUntil} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plan.weeks.map((week, index) => {
            const completedTopics = week.topics.filter((t) => t.isCompleted).length
            const totalTopics = week.topics.length
            const weekProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0
            const isActiveWeek = lockStatus?.activeWeekNumber === week.weekNumber
            // Lock all weeks EXCEPT the active one when lockStatus.isLocked is true
            const isLocked = lockStatus?.isLocked && !isActiveWeek
            const isCompleted = weekProgress === 100

            return (
              <div
                key={week._id}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                  isLocked
                    ? "border-2 border-amber-200 bg-amber-50/30 opacity-90"
                    : "border-2 border-gray-200 hover:border-emerald-200 shadow-lg hover:shadow-2xl hover:-translate-y-1"
                }`}
              >
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
                  {isLocked ? (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-400 shadow-lg animate-pulse">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-900" strokeWidth={2} />
                    </div>
                  ) : isCompleted ? (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2.5} />
                    </div>
                  ) : isActiveWeek ? (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2} />
                    </div>
                  ) : null}
                </div>

                <div
                  className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold mb-3 ${
                    isLocked
                      ? "bg-amber-200 text-amber-800"
                      : isActiveWeek
                        ? "bg-blue-100 text-blue-700"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isLocked ? "E BLLOKUAR" : isActiveWeek && !isCompleted ? "JAVA AKTIVE" : `JAVA ${week.weekNumber}`}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-tight pr-10 sm:pr-12">
                  {week.title || `Java e ${week.weekNumber}`}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  {completedTopics} nga {totalTopics} tema të përfunduara
                </p>

                {isLocked && lockStatus?.lockedUntil && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-amber-800 font-medium mb-2">Zhbllokohet pas:</p>
                    <CountdownTimer lockedUntil={lockStatus.lockedUntil} />
                  </div>
                )}

                <div className="mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLocked ? "bg-amber-400" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                      }`}
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-semibold ${isLocked ? "text-amber-600" : "text-emerald-600"}`}>
                      {Math.round(weekProgress)}% e përfunduar
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleWeekButtonClick(week.weekNumber, isLocked, isActiveWeek)}
                  disabled={isLocked || startingWeek}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    isLocked
                      ? "bg-amber-200 text-amber-800 cursor-not-allowed"
                      : isActiveWeek
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl"
                        : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-xl"
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>E Bllokuar</span>
                    </>
                  ) : isActiveWeek ? (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Shiko Temat</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Fillo Javën</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}