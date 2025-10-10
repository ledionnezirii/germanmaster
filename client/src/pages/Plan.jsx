import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle, Check, AlertCircle, Search, BookOpen, Target, Trophy, Lock } from 'lucide-react'
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

  // <CHANGE> Added function to check if a topic is locked based on previous topics completion
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <BookOpen className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 text-balance">
              Zgjidhni Nivelin Tuaj të Gjermanishtes
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              Kjo është seksioni i planit të mësimit ku mund të shënoni temat që tashmë i zotëroni.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level, index) => {
              const colors = [
                { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", hover: "hover:border-blue-400" },
                {
                  bg: "bg-green-50",
                  text: "text-green-600",
                  border: "border-green-200",
                  hover: "hover:border-green-400",
                },
                {
                  bg: "bg-purple-50",
                  text: "text-purple-600",
                  border: "border-purple-200",
                  hover: "hover:border-purple-400",
                },
                {
                  bg: "bg-orange-50",
                  text: "text-orange-600",
                  border: "border-orange-200",
                  hover: "hover:border-orange-400",
                },
                { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200", hover: "hover:border-pink-400" },
                {
                  bg: "bg-indigo-50",
                  text: "text-indigo-600",
                  border: "border-indigo-200",
                  hover: "hover:border-indigo-400",
                },
              ]
              const color = colors[index]

              return (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className={`group ${color.bg} ${color.border} ${color.hover} border-2 rounded-xl p-8 text-center transition-all duration-200 hover:shadow-lg hover:scale-105`}
                >
                  <div className={`text-4xl font-bold ${color.text} mb-3`}>{level}</div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {level === "A1" && "Nivel fillestar për bazat e gjermanishtes"}
                    {level === "A2" && "Nivel paramesatar, zgjeroni fjalorin"}
                    {level === "B1" && "Nivel mesatar, komunikim i pavarur"}
                    {level === "B2" && "Nivel i lartë mesatar"}
                    {level === "C1" && "Nivel i avancuar"}
                    {level === "C2" && "Nivel i zotërimit"}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Po ngarkohet plani për nivelin {selectedLevel}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-md shadow-lg">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={() => setSelectedLevel(null)}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Kthehu te Zgjedhja e Nivelit
          </button>
        </div>
      </div>
    )
  }

  if (!plan || !plan.topics || plan.topics.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md shadow-lg">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="text-gray-600 mb-6 text-lg">Nuk u gjet plan për nivelin {selectedLevel}.</p>
          <button
            onClick={() => setSelectedLevel(null)}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-all duration-200 hover:scale-105 shadow-md"
          >
            Kthehu te Zgjedhja e Nivelit
          </button>
        </div>
      </div>
    )
  }

  const completedTopicsCount = plan.topics.filter((topic) => topic.isCompleted).length
  const totalTopicsCount = plan.topics.length
  const progressPercentage = totalTopicsCount > 0 ? (completedTopicsCount / totalTopicsCount) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Plani i Mësimit - Gjermanisht {plan.level}</h1>
                <p className="text-gray-600 text-lg">Ndiqni progresin tuaj përmes temave thelbësore.</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLevel(null)}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-all duration-200 hover:scale-105 shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
              Ndrysho Nivelin
            </button>
          </div>

          {/* Progress */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <span className="text-xl font-semibold text-gray-900">Progresi</span>
              </div>
              <span className="text-2xl font-bold text-teal-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-gray-600 text-center">
              <span className="font-semibold text-teal-600">{completedTopicsCount}</span> nga{" "}
              <span className="font-semibold">{totalTopicsCount}</span> tema të përfunduara
            </p>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plan.topics.map((topic, index) => {
            // <CHANGE> Check if topic is locked based on previous topics
            const locked = isTopicLocked(index)
            
            const cardColors = [
              "border-blue-200 bg-blue-50",
              "border-green-200 bg-green-50",
              "border-purple-200 bg-purple-50",
              "border-orange-200 bg-orange-50",
            ]
            // <CHANGE> Use gray colors for locked topics
            const cardColor = topic.isCompleted 
              ? "border-teal-300 bg-teal-50" 
              : locked 
              ? "border-gray-200 bg-gray-50" 
              : cardColors[index % 4]

            return (
              <div
                key={topic._id}
                className={`${cardColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg relative group`}
              >
                {topic.isCompleted && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-teal-600" />
                  </div>
                )}

                <div className={`mb-6 ${topic.isCompleted ? "pr-8" : ""}`}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">{topic.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{topic.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* <CHANGE> Show lock icon for locked topics */}
                    {locked ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <div
                        className={`w-5 h-5 border-2 rounded ${
                          topic.isCompleted ? "border-teal-500 bg-teal-500" : "border-gray-300 bg-white"
                        } flex items-center justify-center`}
                      >
                        {topic.isCompleted && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    <span className={`font-medium ${topic.isCompleted ? "text-teal-600" : locked ? "text-gray-400" : "text-gray-500"}`}>
                      {topic.isCompleted ? "Përfunduar" : "Jo përfunduar"}
                    </span>
                  </div>

                  {/* <CHANGE> Show locked button for locked topics, regular button for unlocked */}
                  {!topic.isCompleted && (
                    locked ? (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                      >
                        <Lock className="h-4 w-4" />
                        I bllokuar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsFinished(topic._id)}
                        disabled={submittingTopicId === topic._id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          submittingTopicId === topic._id
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 shadow-md"
                        }`}
                      >
                        {submittingTopicId === topic._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
                            Po shënohet...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Përfundo
                          </>
                        )}
                      </button>
                    )
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