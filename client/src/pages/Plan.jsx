import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle, Check, AlertCircle, Search, BookOpen, Target, Trophy, Lock, Award } from 'lucide-react'
import { planService, authService } from "../services/api"

export default function PlanPage() {
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [plan, setPlan] = useState(null)
  const [userXp, setUserXp] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittingTopicId, setSubmittingTopicId] = useState(null)

  const FontImport = () => (
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}
    </style>
  )

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
        setUserXp(xpResponse.data.xp)

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        setPlan(planResponse.data)
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
    setPlan(null)
    setError(null)
  }

  const handleMarkAsFinished = async (topicId) => {
    if (!plan || submittingTopicId) return

    setSubmittingTopicId(topicId)

    setPlan((prevPlan) => {
      if (!prevPlan) return null

      const updatedTopics = prevPlan.topics.map((topic) =>
        topic._id === topicId
          ? { ...topic, isCompleted: true, xpAwarded: 100, completedAt: new Date().toISOString() }
          : topic,
      )
      return { ...prevPlan, topics: updatedTopics }
    })

    try {
      const response = await planService.markTopicAsCompleted(plan._id, topicId)
      if (response.success) {
        console.log("Updated plan from server:", response.data.plan)
        setUserXp(response.data.userXp)
      }
    } catch (err) {
      console.error("Failed to mark topic as finished:", err)
      setPlan((prevPlan) => {
        if (!prevPlan) return null
        const revertedTopics = prevPlan.topics.map((topic) =>
          topic._id === topicId ? { ...topic, isCompleted: false, xpAwarded: 0, completedAt: undefined } : topic,
        )
        return { ...prevPlan, topics: revertedTopics }
      })

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError("Dështoi shënimi i temës si e përfunduar. Ju lutemi provoni përsëri.")
      }
    } finally {
      setSubmittingTopicId(null)
    }
  }

  const isTopicLocked = (index) => {
    if (!plan || !plan.topics) return false
    if (index === 0) return false
    
    for (let i = 0; i < index; i++) {
      if (!plan.topics[i].isCompleted) {
        return true
      }
    }
    return false
  }

  if (!selectedLevel) {
    return (
      <>
        <FontImport />
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Zgjidhni Nivelin Tuaj të Gjermanishtes
              </h1>
              <p className="text-base text-gray-700 max-w-2xl mx-auto">
                Kjo është seksioni i planit të mësimit ku mund të shënoni temat që tashmë i zotëroni.
              </p>
            </div>

            {/* Level Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {levels.map((level, index) => {
                const levelConfigs = [
                  { bg: "bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4]", border: "border-[#5EEAD4]", text: "text-[#0D9488]", hover: "hover:border-[#14B8A6]" },
                  { bg: "bg-gradient-to-br from-[#BFDBFE] to-[#93C5FD]", border: "border-[#93C5FD]", text: "text-[#1D4ED8]", hover: "hover:border-[#2563EB]" },
                  { bg: "bg-gradient-to-br from-[#DDD6FE] to-[#C4B5FD]", border: "border-[#C4B5FD]", text: "text-[#7C3AED]", hover: "hover:border-[#8B5CF6]" },
                  { bg: "bg-gradient-to-br from-[#FED7AA] to-[#FDBA74]", border: "border-[#FDBA74]", text: "text-[#EA580C]", hover: "hover:border-[#F97316]" },
                  { bg: "bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4]", border: "border-[#F9A8D4]", text: "text-[#DB2777]", hover: "hover:border-[#EC4899]" },
                  { bg: "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]", border: "border-[#FDE68A]", text: "text-[#D97706]", hover: "hover:border-[#F59E0B]" }
                ]
                const config = levelConfigs[index]

                return (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className={`${config.bg} ${config.border} ${config.hover} border-2 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-lg shadow-md`}
                  >
                    <div className={`text-2xl font-bold ${config.text} mb-2`}>{level}</div>
                    <p className="text-xs text-gray-700 font-medium">
                      {level === "A1" && "Fillestar"}
                      {level === "A2" && "Paramesatar"}
                      {level === "B1" && "Mesatar"}
                      {level === "B2" && "I lartë"}
                      {level === "C1" && "Avancuar"}
                      {level === "C2" && "Zotërim"}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <FontImport />
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#14B8A6] mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Po ngarkohet plani për nivelin {selectedLevel}...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <FontImport />
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-300 rounded-xl p-6 text-center max-w-md shadow-lg">
            <div className="flex justify-center mb-3">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <button
              onClick={() => setSelectedLevel(null)}
              className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-5 py-2 rounded-full hover:from-[#0D9488] hover:to-[#0891B2] transition-all text-sm font-medium shadow-lg shadow-teal-500/30"
            >
              Kthehu te Zgjedhja e Nivelit
            </button>
          </div>
        </div>
      </>
    )
  }

  if (!plan || !plan.topics || plan.topics.length === 0) {
    return (
      <>
        <FontImport />
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#99F6E4] rounded-xl p-6 text-center max-w-md shadow-lg">
            <div className="flex justify-center mb-3">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-700 mb-4 font-medium">Nuk u gjet plan për nivelin {selectedLevel}.</p>
            <button
              onClick={() => setSelectedLevel(null)}
              className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-5 py-2 rounded-full hover:from-[#0D9488] hover:to-[#0891B2] transition-all text-sm font-medium shadow-lg shadow-teal-500/30"
            >
              Kthehu te Zgjedhja e Nivelit
            </button>
          </div>
        </div>
      </>
    )
  }

  const completedTopicsCount = plan.topics.filter((topic) => topic.isCompleted).length
  const totalTopicsCount = plan.topics.length
  const progressPercentage = totalTopicsCount > 0 ? (completedTopicsCount / totalTopicsCount) * 100 : 0

  return (
    <>
      <FontImport />
      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header Card */}
          <div className="bg-white border-2 border-[#99F6E4] rounded-xl shadow-xl shadow-teal-100/50 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Plani i Mësimit - Gjermanisht {plan.level}</h1>
                  <p className="text-sm text-gray-700">Ndiqni progresin tuaj përmes temave thelbësore</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLevel(null)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-4 py-2 rounded-full hover:from-[#0D9488] hover:to-[#0891B2] transition-all text-sm font-medium shadow-lg shadow-teal-500/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Ndrysho Nivelin
              </button>
            </div>

            {/* Progress Section */}
            <div className="bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] rounded-xl p-5 border-2 border-[#99F6E4]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#14B8A6]" />
                  <span className="text-base font-semibold text-gray-900">Progresi</span>
                </div>
                <span className="text-xl font-bold text-[#14B8A6]">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden mb-2 border border-[#99F6E4]">
                <div
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-700 text-center font-medium">
                <span className="font-bold text-[#14B8A6]">{completedTopicsCount}</span> nga{" "}
                <span className="font-semibold">{totalTopicsCount}</span> tema të përfunduara
              </p>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.topics.map((topic, index) => {
              const locked = isTopicLocked(index)

              return (
                <div
                  key={topic._id}
                  className={`bg-white border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg shadow-md relative ${
                    topic.isCompleted 
                      ? "border-[#5EEAD4] bg-gradient-to-br from-[#F0FDFA] to-white shadow-teal-100/50" 
                      : locked 
                      ? "border-gray-200 bg-gray-50" 
                      : "border-[#99F6E4] hover:border-[#5EEAD4]"
                  }`}
                >
                  {/* Completion Badge */}
                  {topic.isCompleted && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="h-5 w-5 text-[#14B8A6]" />
                    </div>
                  )}

                  {/* Lock Badge */}
                  {locked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className={`${topic.isCompleted || locked ? "pr-8" : ""}`}>
                    {/* Topic Number */}
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${
                      topic.isCompleted 
                        ? "bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4] text-[#0D9488]" 
                        : locked 
                        ? "bg-gray-200 text-gray-600" 
                        : "bg-gradient-to-br from-[#BFDBFE] to-[#93C5FD] text-[#1D4ED8]"
                    }`}>
                      Tema {index + 1}
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {topic.description}
                    </p>

                    {/* Status and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {locked ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : (
                          <div
                            className={`w-4 h-4 border-2 rounded ${
                              topic.isCompleted 
                                ? "border-[#14B8A6] bg-[#14B8A6]" 
                                : "border-gray-300 bg-white"
                            } flex items-center justify-center`}
                          >
                            {topic.isCompleted && <Check className="h-3 w-3 text-white" />}
                          </div>
                        )}
                        <span className={`text-xs font-medium ${
                          topic.isCompleted 
                            ? "text-[#14B8A6]" 
                            : locked 
                            ? "text-gray-400" 
                            : "text-gray-700"
                        }`}>
                          {topic.isCompleted ? "Përfunduar" : locked ? "I bllokuar" : "Jo përfunduar"}
                        </span>
                      </div>

                      {!topic.isCompleted && (
                        locked ? (
                          <button
                            disabled
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            <Lock className="h-3 w-3" />
                            I bllokuar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsFinished(topic._id)}
                            disabled={submittingTopicId === topic._id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              submittingTopicId === topic._id
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white hover:from-[#0D9488] hover:to-[#0891B2] shadow-md shadow-teal-500/30 hover:shadow-lg"
                            }`}
                          >
                            {submittingTopicId === topic._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500" />
                                Po shënohet...
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                Përfundo
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Completion Message */}
          {completedTopicsCount === totalTopicsCount && totalTopicsCount > 0 && (
            <div className="mt-6 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-xl p-6 text-center shadow-xl shadow-teal-500/30">
              <div className="flex justify-center mb-3">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Urime!
              </h2>
              <p className="text-white/90 text-sm font-medium">
                Keni përfunduar të gjitha temat për nivelin {plan.level}!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}