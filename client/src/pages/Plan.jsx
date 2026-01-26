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
import { authService, planService } from "../services/api"

function ConfirmationDialog({ isOpen, onClose, onConfirm, weekNumber, loading }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 md:p-8 animate-scale-in">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 text-center mb-2 sm:mb-3">
          Fillo Javën {weekNumber}?
        </h3>

        <p className="text-gray-600 text-center mb-5 sm:mb-6 text-xs sm:text-sm md:text-base leading-relaxed">
          Duke filluar këtë javë, ajo do të jete e hapur për <strong>7 ditë</strong>. Javët e tjera do te jene te
          blokuara per 7 dite që të mund të vazhdoni mësimin tuaj me nje strukure te duhur per mesin e gjuhes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 text-sm"
          >
            Anullo
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                <span>Duke filluar...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:w-5" />
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

function CountdownTimer({ lockedUntil }) {
  const timeLeft = useCountdown(lockedUntil)

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-xs text-amber-800 font-medium">Duke u zhbllokuar...</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono font-bold text-amber-900">
      {timeLeft.days > 0 && <span className="bg-amber-100 px-1.5 sm:px-2 py-1 rounded">{timeLeft.days}d</span>}
      <span className="bg-amber-100 px-1.5 sm:px-2 py-1 rounded">{timeLeft.hours}h</span>
      <span className="bg-amber-100 px-1.5 sm:px-2 py-1 rounded">{timeLeft.minutes}m</span>
      <span className="bg-amber-100 px-1.5 sm:px-2 py-1 rounded">{timeLeft.seconds}s</span>
    </div>
  )
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

  // SEO Effect
  useEffect(() => {
    // Update page title
    document.title = "Plani i Mësimit Gjermanisht - Strukturë Mësimi nga A1 deri C2 | Udhërrëfyes i Plotë"
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = "Ndiqni planin e strukturuar të mësimit të gjermanishtes nga A1 deri C2. Javët, tema dhe progres i organizuar. Fillo sot!"
    
    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.name = 'keywords'
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.content = "plani mësimi, udhërrëfyes gjermanisht, lernplan deutsch, kurse gjermane, mësim i strukturuar, A1 A2 B1 B2 C1 C2, plan javor"
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = `${window.location.origin}/plan`
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', 'Plani i Mësimit Gjermanisht - Strukturë Mësimi nga A1 deri C2')
    updateMetaTag('og:description', 'Ndiqni planin e strukturuar të mësimit të gjermanishtes nga A1 deri C2. Javët, tema dhe progres i organizuar.')
    updateMetaTag('og:url', `${window.location.origin}/plan`)
    updateMetaTag('og:type', 'website')
    
    // Update Twitter meta tags
    updateMetaTag('twitter:title', 'Plani i Mësimit Gjermanisht - Strukturë Mësimi nga A1 deri C2')
    updateMetaTag('twitter:description', 'Ndiqni planin e strukturuar të mësimit të gjermanishtes nga A1 deri C2. Javët, tema dhe progres i organizuar.')
    
    // Add structured data for plan page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Plani i Mësimit Gjermanisht",
      "description": "Ndiqni planin e strukturuar të mësimit të gjermanishtes nga A1 deri C2 me javët dhe tema të organizuara",
      "url": `${window.location.origin}/plan`,
      "educationalLevel": ["Beginner", "Intermediate", "Advanced"],
      "inLanguage": ["de", "sq"],
      "learningResourceType": "Curriculum",
      "offers": {
        "@type": "Offer",
        "category": "Educational Services"
      }
    }
    
    let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-plan]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.type = 'application/ld+json'
      structuredDataScript.setAttribute('data-plan', 'true')
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)
    
    // Cleanup function
    return () => {
      // Remove the structured data script when component unmounts
      const script = document.querySelector('script[type="application/ld+json"][data-plan]')
      if (script) script.remove()
    }
  }, [])
  
  // Helper function to update meta tags
  const updateMetaTag = (property, content) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(property.startsWith('og:') ? 'property' : 'name', property)
      document.head.appendChild(metaTag)
    }
    metaTag.content = content
  }

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
        const xpValue = xpResponse.data?.xp || xpResponse.xp || xpResponse.user?.xp || 0
        setUserXp(xpValue)

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        console.log("[PlanPage] Plan Response:", planResponse)
        const planData = planResponse.data || planResponse
        setPlan(planData)
        setLockStatus(planData.lockStatus)
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
    if (isLocked) return

    if (isActiveWeek) {
      setSelectedWeek(weekNumber)
      return
    }

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

      const responseData = response.data || response
      if (responseData && responseData.weekNumber) {
        console.log("[PlanPage] Week started successfully, fetching updated plan...")

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        console.log("[PlanPage] Updated plan response:", planResponse)

        const planData = planResponse.data || planResponse
        setPlan(planData)
        setLockStatus(planData.lockStatus)

        setConfirmDialog({ isOpen: false, weekNumber: null })

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

      const responseData = response.data || response
      if (responseData && (responseData.success || responseData.data)) {
        const newXp = responseData.data?.userXp || responseData.userXp
        if (newXp) {
          setUserXp(newXp)
        }

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        const planData = planResponse.data || planResponse
        setPlan(planData)
      }
    } catch (err) {
      console.error("Failed to mark topic as finished:", err)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4">
        <div className="mx-auto max-w-7xl">
          {/* HEADER WITH LISTEN.JSX STYLE */}
          <header className="mb-6 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Zgjidhni Nivelin Tuaj</h1>
                    <p className="text-gray-600">
                      Filloni udhëtimin tuaj të mësimit të gjermanishtes duke zgjedhur nivelin që ju përshtatet më mirë
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
            {levels.map((level, index) => (
              <button
                key={level}
                onClick={() => handleLevelSelect(level)}
                className={`bg-gradient-to-br ${levelConfigs[index].gradient} border-2 ${levelConfigs[index].border} ${levelConfigs[index].hover} rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 md:p-8 text-center transition-all duration-300 hover:shadow-2xl shadow-lg hover:-translate-y-1 active:scale-95`}
              >
                <div
                  className={`text-2xl sm:text-3xl md:text-4xl font-bold ${levelConfigs[index].text} mb-1 sm:mb-2 md:mb-3`}
                >
                  {level}
                </div>
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
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4">
        <div className="mx-auto max-w-5xl">
          {/* HEADER WITH LISTEN.JSX STYLE */}
          <header className="mb-6 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentWeek.title}</h1>
                    <p className="text-gray-600">
                      {currentWeek.description || `Përfundoni të gjitha temat e javës ${selectedWeek}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-900">{userXp} XP</span>
                  </div>
                </div>
                <button
                  onClick={handleBackToWeeks}
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 active:scale-95 transition-all text-sm font-medium shadow-lg whitespace-nowrap"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  Kthehu te Javët
                </button>
              </div>
            </div>
          </header>

          <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Progresi i Javës</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-600">
                {currentWeek.progress.completed}/{currentWeek.progress.total} tema
              </span>
            </div>
            <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${currentWeek.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
              {currentWeek.progress.percentage}% e përfunduar
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {currentWeek.topics.map((topic, index) => {
              const locked = isTopicLocked(index)
              const isSubmitting = submittingTopicId === topic._id

              return (
                <div
                  key={topic._id}
                  className={`bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 md:p-6 transition-all duration-300 ${
                    locked
                      ? "border-gray-200 bg-gray-50/50 opacity-60"
                      : topic.isCompleted
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-gray-200 hover:border-emerald-200 hover:shadow-lg"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div
                      className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold ${
                        locked
                          ? "bg-gray-200 text-gray-500"
                          : topic.isCompleted
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {locked ? (
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : topic.isCompleted ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                      ) : (
                        <span className="text-sm sm:text-base">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h3
                        className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 ${locked ? "text-gray-500" : "text-gray-900"} leading-tight`}
                      >
                        {topic.title}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm mb-3 sm:mb-4 ${locked ? "text-gray-400" : "text-gray-600"} leading-relaxed`}
                      >
                        {topic.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold ${
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
                          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />E përfunduar
                          </div>
                        )}

                        {locked && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">
                            <Lock className="w-3.5 h-3.5" />E bllokuar
                          </div>
                        )}
                      </div>
                    </div>

                    {!locked && !topic.isCompleted && (
                      <button
                        onClick={() => handleMarkAsFinished(topic._id)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto sm:flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Duke ruajtur...</span>
                          </div>
                        ) : (
                          <span>Shëno si të Përfunduar</span>
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

  // Weeks Selection View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4">
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, weekNumber: null })}
        onConfirm={handleConfirmStartWeek}
        weekNumber={confirmDialog.weekNumber}
        loading={startingWeek}
      />

      <div className="mx-auto max-w-7xl">
        {/* HEADER WITH LISTEN.JSX STYLE */}
        <header className="mb-6 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Gjermanisht {plan.level} - Zgjidhni Javën
                  </h1>
                  <p className="text-gray-600">Çdo javë përmban tema që duhet të përfundoni</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLevel(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 active:scale-95 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl whitespace-nowrap"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Ndrysho Nivelin
              </button>
            </div>
          </div>
        </header>

        {lockStatus?.isLocked && (
          <div className="mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-200 flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-amber-900 mb-1">
                  Java Aktive: Java {lockStatus.activeWeekNumber}
                </h3>
                <p className="text-amber-800 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
                  Kjo javë është e hapur për 7 ditë për t'ju ndihmuar të përqendroheni. Javët e tjera janë ende të
                  mbyllura.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-amber-900">Zhbllokohet pas:</span>
                  <CountdownTimer lockedUntil={lockStatus.lockedUntil} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plan.weeks.map((week) => {
            const completedTopics = week.topics.filter((t) => t.isCompleted).length
            const totalTopics = week.topics.length
            const weekProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0
            const isActiveWeek = lockStatus?.activeWeekNumber === week.weekNumber
            const isLocked = lockStatus?.isLocked && !isActiveWeek
            const isCompleted = weekProgress === 100

            return (
              <div
                key={week._id}
                className={`relative bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 ${
                  isLocked
                    ? "border-2 border-amber-200 bg-amber-50/30 opacity-90"
                    : "border-2 border-gray-200 hover:border-emerald-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                }`}
              >
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5">
                  {isLocked ? (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-amber-400 shadow-lg animate-pulse">
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-amber-900" strokeWidth={2} />
                    </div>
                  ) : isCompleted ? (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" strokeWidth={2.5} />
                    </div>
                  ) : isActiveWeek ? (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" strokeWidth={2} />
                    </div>
                  ) : null}
                </div>

                <div
                  className={`inline-block px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold mb-2 sm:mb-3 ${
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

                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight pr-8 sm:pr-10 md:pr-12">
                  {week.title || `Java e ${week.weekNumber}`}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {completedTopics} nga {totalTopics} tema të përfunduara
                </p>

                {isLocked && lockStatus?.lockedUntil && (
                  <div className="mb-3 sm:mb-4 bg-amber-50 border border-amber-200 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <p className="text-xs text-amber-800 font-medium mb-1.5 sm:mb-2">Zhbllokohet pas:</p>
                    <CountdownTimer lockedUntil={lockStatus.lockedUntil} />
                  </div>
                )}

                <div className="mb-3 sm:mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLocked ? "bg-amber-400" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                      }`}
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                    <span className={`text-xs font-semibold ${isLocked ? "text-amber-600" : "text-emerald-600"}`}>
                      {Math.round(weekProgress)}% e përfunduar
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleWeekButtonClick(week.weekNumber, isLocked, isActiveWeek)}
                  disabled={isLocked || startingWeek}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
                    isLocked
                      ? "bg-amber-200 text-amber-800 cursor-not-allowed"
                      : isActiveWeek
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl"
                        : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-xl"
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>E Bllokuar</span>
                    </>
                  ) : isActiveWeek ? (
                    <>
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Shiko Temat</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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