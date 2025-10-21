"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, AlertCircle, BookOpen, Target, Trophy, Lock, Award, Sparkles, Rotate3D, Pen } from "lucide-react"
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-8 md:p-10 mb-20 animate-fadeInUp">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl -z-10" />

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Pen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-900 bg-clip-text text-transparent mb-2">
                    Zgjidhni Nivelin Tuaj
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Filloni udhëtimin tuaj të mësimit të gjermanishtes duke zgjedhur nivelin që ju përshtatet më mirë
                  </p>
                </div>
              </div>
            </div>

            {/* Level Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {levels.map((level, index) => {
                const levelConfigs = [
                  {
                    color: "emerald",
                    gradient: "from-emerald-50 to-teal-50",
                    border: "border-emerald-200",
                    text: "text-emerald-600",
                    hover: "hover:border-emerald-400 hover:shadow-emerald-100",
                  },
                  {
                    color: "blue",
                    gradient: "from-blue-50 to-cyan-50",
                    border: "border-blue-200",
                    text: "text-blue-600",
                    hover: "hover:border-blue-400 hover:shadow-blue-100",
                  },
                  {
                    color: "violet",
                    gradient: "from-violet-50 to-purple-50",
                    border: "border-violet-200",
                    text: "text-violet-600",
                    hover: "hover:border-violet-400 hover:shadow-violet-100",
                  },
                  {
                    color: "amber",
                    gradient: "from-amber-50 to-orange-50",
                    border: "border-amber-200",
                    text: "text-amber-600",
                    hover: "hover:border-amber-400 hover:shadow-amber-100",
                  },
                  {
                    color: "rose",
                    gradient: "from-rose-50 to-pink-50",
                    border: "border-rose-200",
                    text: "text-rose-600",
                    hover: "hover:border-rose-400 hover:shadow-rose-100",
                  },
                  {
                    color: "indigo",
                    gradient: "from-indigo-50 to-blue-50",
                    border: "border-indigo-200",
                    text: "text-indigo-600",
                    hover: "hover:border-indigo-400 hover:shadow-indigo-100",
                  },
                ]
                const config = levelConfigs[index]

                return (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className={`bg-gradient-to-br ${config.gradient} border-2 ${config.border} ${config.hover} rounded-3xl p-8 text-center transition-all duration-300 hover:shadow-2xl shadow-lg hover:-translate-y-1 animate-fadeInUp`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`text-4xl font-bold ${config.text} mb-3`}>{level}</div>
                    <p className="text-sm text-gray-700 font-medium">
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">Po ngarkohet plani për nivelin {selectedLevel}...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <FontImport />
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="bg-white border-2 border-red-200 rounded-3xl p-10 text-center max-w-md shadow-2xl shadow-red-100">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 shadow-xl shadow-red-500/30">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-red-600 mb-8 font-medium text-lg">{error}</p>
            <button
              onClick={() => setSelectedLevel(null)}
              className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl"
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
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-10 text-center max-w-md shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <p className="text-gray-700 mb-8 font-medium text-lg">Nuk u gjet plan për nivelin {selectedLevel}.</p>
            <button
              onClick={() => setSelectedLevel(null)}
              className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 py-12 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-8 md:p-10 mb-12 animate-fadeInUp">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Target className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-900 bg-clip-text text-transparent mb-2">
                    Gjermanisht {plan.level}
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Ndiqni progresin tuaj përmes temave thelbësore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLevel(null)}
                className="inline-flex items-center gap-2.5 bg-gray-900 text-white px-6 py-3.5 rounded-2xl hover:bg-gray-800 transition-all text-sm font-medium shadow-xl shadow-gray-900/30 hover:shadow-2xl"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Ndrysho Nivelin
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 m-2 rounded-3xl p-8 border-2 border-emerald-200 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
                <span className="text-xl font-semibold text-gray-900">Progresi Juaj</span>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-emerald-600">{Math.round(progressPercentage)}%</div>
                <div className="text-xs text-gray-600 font-medium mt-1">i përfunduar</div>
              </div>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden mb-4 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              <span className="font-bold text-emerald-600">{completedTopicsCount}</span> nga{" "}
              <span className="font-semibold">{totalTopicsCount}</span> tema të përfunduara
            </p>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plan.topics.map((topic, index) => {
              const locked = isTopicLocked(index)

              return (
                <div
                  key={topic._id}
                  className={`bg-white rounded-3xl p-7 transition-all duration-300 relative animate-fadeInUp ${
                    topic.isCompleted
                      ? "border-2 border-emerald-200 shadow-xl shadow-emerald-100/50 hover:shadow-2xl"
                      : locked
                        ? "border-2 border-gray-200 bg-gray-50/50"
                        : "border-2 border-gray-200 hover:border-emerald-200 shadow-lg hover:shadow-2xl hover:-translate-y-1"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Completion Badge */}
                  {topic.isCompleted && (
                    <div className="absolute top-6 right-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
                        <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}

                  {/* Lock Badge */}
                  {locked && (
                    <div className="absolute top-6 right-6">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                        <Lock className="h-4 w-4 text-gray-600" strokeWidth={2} />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`${topic.isCompleted || locked ? "pr-10" : ""}`}>
                    {/* Topic Number */}
                    <div
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold mb-4 ${
                        topic.isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : locked
                            ? "bg-gray-200 text-gray-600"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      TEMA {index + 1}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">{topic.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-6 font-light">{topic.description}</p>

                    {/* Action Button */}
                    {!topic.isCompleted &&
                      (locked ? (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                        >
                          <Lock className="h-4 w-4" strokeWidth={2} />I bllokuar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsFinished(topic._id)}
                          disabled={submittingTopicId === topic._id}
                          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                            submittingTopicId === topic._id
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5"
                          }`}
                        >
                          {submittingTopicId === topic._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                              Po shënohet...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                              Përfundo Temën
                            </>
                          )}
                        </button>
                      ))}

                    {topic.isCompleted && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Sparkles className="h-4 w-4" strokeWidth={2} />
                        <span className="text-sm font-semibold">E përfunduar</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Completion Message */}
          {completedTopicsCount === totalTopicsCount && totalTopicsCount > 0 && (
            <div className="mt-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-500/30 animate-fadeInUp">
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
                  <Award className="h-10 w-10 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Urime për Arritjen!</h2>
              <p className="text-white/90 text-lg font-light max-w-lg mx-auto">
                Keni përfunduar me sukses të gjitha temat për nivelin {plan.level}. Jeni gati për hapin e radhës!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
