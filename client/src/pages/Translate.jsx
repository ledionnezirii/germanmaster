"use client"

import { useState, useEffect } from "react"
import { translateService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Filter, ArrowLeft, Book, Star, Crown, Lock } from "lucide-react"

function PaywallModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 max-w-sm w-full text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Limit i Arritur</h2>
          <p className="text-gray-500 text-sm mb-2 leading-relaxed">
            Versioni falas lejon vetëm <span className="font-bold text-emerald-600">5</span> tekste të përfunduara.
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Kaloni në planin Premium për të pasur akses të pakufizuar në të gjitha tekstet.
          </p>
          <button
            onClick={() => { window.location.href = "/payments" }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all border-none cursor-pointer mb-3"
          >
            Shiko Planet Premium
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-50 text-gray-500 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Mbyll
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const Translate = () => {
  const { language } = useLanguage()
  const [texts, setTexts] = useState([])
  const [selectedText, setSelectedText] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [userAnswers, setUserAnswers] = useState([])
  const [userProgress, setUserProgress] = useState({})
  const [quizResults, setQuizResults] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [freeLimit, setFreeLimit] = useState(5)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  useEffect(() => {
    document.title = "Praktika e Përkthimit Gjermanisht - Përmirësoni Leximin dhe Kuptimin | Tekste dhe Pyetje"

    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement("meta")
      metaDescription.name = "description"
      document.head.appendChild(metaDescription)
    }
    metaDescription.content =
      "Praktikoni përkthimin dhe kuptimin e teksteve gjermane me ushtrime interaktive. Përmirësoni aftësitë e leximit nga A1 deri C2. Fillo sot!"

    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta")
      metaKeywords.name = "keywords"
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.content =
      "përkthim gjermanisht, praktikë përkthimi, lesen verstehen, reading comprehension german, tekst gjermanisht, ushtrime leximi, pyetje përkthimi"

    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement("link")
      canonicalLink.rel = "canonical"
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = `${window.location.origin}/translate`

    updateMetaTag("og:title", "Praktika e Përkthimit Gjermanisht - Përmirësoni Leximin dhe Kuptimin")
    updateMetaTag("og:description", "Praktikoni përkthimin dhe kuptimin e teksteve gjermane me ushtrime interaktive.")
    updateMetaTag("og:url", `${window.location.origin}/translate`)
    updateMetaTag("og:type", "website")
    updateMetaTag("twitter:title", "Praktika e Përkthimit Gjermanisht - Përmirësoni Leximin dhe Kuptimin")
    updateMetaTag("twitter:description", "Praktikoni përkthimin dhe kuptimin e teksteve gjermane me ushtrime interaktive.")

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: "Praktika e Përkthimit Gjermanisht",
      description: "Praktikoni përkthimin dhe kuptimin e teksteve gjermane me ushtrime interaktive dhe pyetje",
      url: `${window.location.origin}/translate`,
      educationalLevel: ["Beginner", "Intermediate", "Advanced"],
      inLanguage: ["de", "sq"],
      learningResourceType: "Reading Exercise",
      offers: { "@type": "Offer", category: "Educational Services" },
    }

    let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-translate]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement("script")
      structuredDataScript.type = "application/ld+json"
      structuredDataScript.setAttribute("data-translate", "true")
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)

    return () => {
      const script = document.querySelector('script[type="application/ld+json"][data-translate]')
      if (script) script.remove()
    }
  }, [])

  const updateMetaTag = (property, content) => {
    let metaTag =
      document.querySelector(`meta[property="${property}"]`) ||
      document.querySelector(`meta[name="${property}"]`)
    if (!metaTag) {
      metaTag = document.createElement("meta")
      metaTag.setAttribute(property.startsWith("og:") ? "property" : "name", property)
      document.head.appendChild(metaTag)
    }
    metaTag.content = content
  }

  useEffect(() => {
    fetchTexts()
    fetchUserProgress()
  }, [selectedLevel, language])

  useEffect(() => {
    if (selectedText && quizComplete) {
      setTimeout(() => {
        fetchUserProgress()
      }, 2000)
    }
  }, [quizComplete, selectedText])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedText])

  const fetchTexts = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 50, language }
      if (selectedLevel !== "all") params.level = selectedLevel
      const response = await translateService.getAllTexts(params)
      const textsData = response.data.texts || response.data || []

      const sortedTexts = textsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0)
        const dateB = new Date(b.createdAt || b.updatedAt || 0)
        return dateA - dateB
      })

      setTexts(sortedTexts)
    } catch (error) {
      console.error("Error fetching texts:", error)
      setTexts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await translateService.getUserProgress()
      const data = response.data || {}
      const progressData = data.progress || []
      const progressMap = {}
      progressData.forEach((progress) => {
        if (progress.textId) {
          const textId = typeof progress.textId === "object" ? progress.textId._id : progress.textId
          progressMap[textId] = progress
        }
      })
      setUserProgress(progressMap)
      setIsPaid(data.isPaid || false)
      setFreeLimit(data.freeLimit || 5)
    } catch (error) {
      console.error("Error fetching user progress:", error)
    }
  }

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== "") return
    setSelectedAnswer(answer)
    const updatedUserAnswers = [...userAnswers]
    updatedUserAnswers[currentQuestion] = answer
    setUserAnswers(updatedUserAnswers)
    setTimeout(() => {
      if (currentQuestion + 1 < selectedText.questions.length) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer("")
      } else {
        setQuizComplete(true)
        submitQuizAnswers(updatedUserAnswers)
      }
    }, 900)
  }

  const submitQuizAnswers = async (answers) => {
    try {
      const formattedAnswers = selectedText.questions.map((question, index) => ({
        questionId: question._id,
        answer: answers[index] || "",
      }))
      const response = await translateService.submitAnswers(selectedText._id, formattedAnswers)
      const data = response.data
      setQuizResults(data)
      setScore(data.correctAnswers || 0)

      if (data.limitReached) {
        setShowPaywall(true)
      } else if (data.passed) {
        setUserProgress((prev) => ({
          ...prev,
          [selectedText._id]: {
            ...prev[selectedText._id],
            completed: true,
            textId: selectedText._id,
          },
        }))
      }
    } catch (error) {
      console.error("Error submitting answers:", error)
      setQuizResults({
        score: 0,
        correctAnswers: 0,
        totalQuestions: selectedText.questions.length,
        passed: false,
        limitReached: false,
        message: "Gabim në dërgimin e përgjigjeve. Ju lutem provoni përsëri.",
      })
    }
  }

  const resetQuiz = () => {
    setSelectedText(null)
    setCurrentQuestion(0)
    setSelectedAnswer("")
    setScore(0)
    setShowResult(false)
    setQuizComplete(false)
    setUserAnswers([])
    setQuizResults(null)
    setShowPaywall(false)
    fetchUserProgress()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1": return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
      case "A2": return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200"
      case "B1": return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200"
      case "B2": return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200"
      case "C1": return "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200"
      case "C2": return "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200"
      default:   return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
    }
  }

  const getBaseXP = (level) => {
    switch (level) {
      case "A1": return 10
      case "A2": return 20
      case "B1": return 30
      case "B2": return 40
      case "C1": return 50
      case "C2": return 60
      default:   return 10
    }
  }

  if (selectedText) {
    return (
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 px-2 sm:px-4">
        {showPaywall && (
          <PaywallModal
            onClose={() => {
              setShowPaywall(false)
              resetQuiz()
            }}
          />
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* top bar — violet gradient matching the header */}
          <div style={{ background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 75%, #a78bfa 100%)", padding: "16px 24px" }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white mb-1">{selectedText.title}</h1>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    Niveli {selectedText.level}
                  </span>
                  <span className="text-white/70 text-xs">{selectedText.questions?.length || 0} pyetje</span>
                </div>
              </div>
              <button
                onClick={resetQuiz}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-xl transition-all text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kthehu</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 p-4 sm:p-6">
            {/* Text panel */}
            <div className="w-full">
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Book className="h-4 w-4 text-cyan-600" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">Teksti për Lexim</h2>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 max-h-52 sm:max-h-72 overflow-y-auto">
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm tracking-wide break-words">
                    {selectedText.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Question panel */}
            <div className="w-full">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm h-full">
                {!quizComplete ? (
                  <>
                    {/* Progress bar */}
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                        Pyetja {currentQuestion + 1}/{selectedText.questions.length}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${((currentQuestion + 1) / selectedText.questions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {userAnswers.length}/{selectedText.questions.length}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-violet-100 mb-4 shadow-sm">
                        <p className="text-gray-900 font-semibold text-xs sm:text-sm leading-relaxed break-words">
                          {selectedText.questions[currentQuestion].question}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {selectedText.questions[currentQuestion].options.map((option, index) => {
                          const correctAnswer = selectedText.questions[currentQuestion].correctAnswer
                          const isSelected = selectedAnswer === option
                          const isCorrect = option === correctAnswer
                          const showFeedback = selectedAnswer !== ""

                          let btnClass = "bg-white border-gray-100 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-md"
                          if (showFeedback) {
                            if (isSelected && isCorrect) btnClass = "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400 text-emerald-800 shadow-md scale-[1.01]"
                            else if (isSelected && !isCorrect) btnClass = "bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-800 shadow-md scale-[1.01]"
                            else if (!isSelected && isCorrect) btnClass = "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-700 opacity-80"
                          }

                          return (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(option)}
                              disabled={selectedAnswer !== ""}
                              className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-200 font-medium ${btnClass}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1 text-xs sm:text-sm break-words">{option}</span>
                                {showFeedback && isSelected && (
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                                    {isCorrect
                                      ? <Check className="h-3 w-3 text-white" />
                                      : <X className="h-3 w-3 text-white" />
                                    }
                                  </div>
                                )}
                                {showFeedback && !isSelected && isCorrect && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {quizResults ? (
                      <>
                        {quizResults.limitReached ? (
                          <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
                              <Crown className="w-8 h-8 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Limit i Arritur</h2>
                            <p className="text-sm text-gray-500">Versioni falas lejon vetëm 5 tekste. Kaloni në Premium për akses të pakufizuar.</p>
                            <button onClick={() => { window.location.href = "/payments" }}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                              Shiko Planet Premium
                            </button>
                            <button onClick={resetQuiz}
                              className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-all">
                              Kthehu te tekstet
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Score banner */}
                            <div className={`rounded-2xl p-5 text-center ${quizResults.passed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-violet-500 to-purple-600"} shadow-lg`}>
                              <div className="text-3xl mb-1">{quizResults.passed ? "🎉" : "💪"}</div>
                              <h2 className="text-lg font-bold text-white mb-1">
                                {quizResults.passed ? "Urime!" : "Provo Përsëri!"}
                              </h2>
                              {quizResults.xpAwarded > 0 && (
                                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full mt-1">
                                  <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                                  <span className="text-white font-bold text-base">+{quizResults.xpAwarded} XP</span>
                                </div>
                              )}
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
                                  <Check className="h-4 w-4 text-emerald-600" />
                                </div>
                                <p className="text-xl font-bold text-emerald-600">{quizResults.correctAnswers || 0}</p>
                                <p className="text-xs text-gray-500">Sakte</p>
                              </div>
                              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                                  <X className="h-4 w-4 text-red-500" />
                                </div>
                                <p className="text-xl font-bold text-red-500">
                                  {(quizResults.totalQuestions || selectedText.questions.length) - (quizResults.correctAnswers || 0)}
                                </p>
                                <p className="text-xs text-gray-500">Gabim</p>
                              </div>
                              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-1">
                                  <Star className="h-4 w-4 text-violet-600" />
                                </div>
                                <p className="text-xl font-bold text-violet-600">
                                  {quizResults.score || Math.round((quizResults.correctAnswers / (quizResults.totalQuestions || selectedText.questions.length)) * 100)}%
                                </p>
                                <p className="text-xs text-gray-500">Rezultat</p>
                              </div>
                            </div>

                            {/* Per-question summary */}
                            {quizResults.results && (
                              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-36 overflow-y-auto space-y-1.5">
                                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Përmbledhje</p>
                                {quizResults.results.map((result, index) => (
                                  <div key={index} className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium ${result.isCorrect ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${result.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                                      {result.isCorrect ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-white" />}
                                    </div>
                                    <span>Pyetja {index + 1}</span>
                                    {!result.isCorrect && result.correctAnswer && (
                                      <span className="text-gray-500 font-normal ml-auto truncate max-w-[120px]">→ {result.correctAnswer}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button onClick={resetQuiz}
                              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl">
                              Vazhdo me Tekst Tjetër
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center min-h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const completedCount = Object.values(userProgress).filter((p) => p.completed).length

  return (
    <div className="h-min-screen p-4 flex flex-col">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-4 flex-shrink-0">
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 75%, #a78bfa 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <Book size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Praktika e Përkthimit
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Praktiko kuptimin e leximit me tekste gjermane dhe pyetje
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 130 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                  <Check size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1, marginBottom: 2 }}>{completedCount}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Të Përfunduara</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-[#14B8A6]" />
            <h2 className="text-sm font-semibold text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-emerald-500/30"
                      : getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {texts.length > 0 ? (
              texts.map((text) => {
                const progress = userProgress[text._id]
                const isCompleted = progress && progress.completed
                const isLocked = !isCompleted && !isPaid && completedCount >= freeLimit

                return (
                  <div
                    key={text._id}
                    className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 hover:shadow-xl ${
                      isLocked
                        ? "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
                        : isCompleted
                        ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                        : "bg-white border-gray-100 hover:border-emerald-300"
                    }`}
                    onClick={() => (isLocked ? setShowPaywall(true) : setSelectedText(text))}
                  >
                    <div
                      className={`absolute top-3 right-3 ${getLevelColor(text.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}
                    >
                      {text.level}
                    </div>

                    {isLocked && (
                      <div className="absolute top-3 left-3 z-10">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    <Book
                      className={`absolute -bottom-4 -right-4 w-20 h-20 ${
                        isCompleted ? "text-amber-100" : isLocked ? "text-gray-100" : "text-slate-100"
                      } transition-transform group-hover:scale-110`}
                    />

                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-bold mb-2 pr-14 truncate ${
                          isLocked
                            ? "text-gray-400"
                            : isCompleted
                            ? "text-amber-700 group-hover:text-amber-800"
                            : "text-gray-800 group-hover:text-emerald-700"
                        }`}
                      >
                        {text.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isLocked ? "text-gray-300" : isCompleted ? "text-amber-600" : "text-gray-500"}`}>
                        {text.text ? text.text.substring(0, 80) + "..." : "Tekst për lexim"}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs font-medium ${isLocked ? "text-gray-300" : isCompleted ? "text-amber-500" : "text-gray-400"}`}>
                          {text.questions?.length || 0} pyetje
                        </span>
                        <div className="flex items-center gap-2">
                          {!isCompleted && !isLocked && (
                            <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                              <Star className="h-3 w-3" />
                              {text.xpReward || getBaseXP(text.level)}
                            </span>
                          )}
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                              isCompleted
                                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                                : isLocked
                                ? "bg-gradient-to-r from-gray-400 to-slate-500 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                            }`}
                          >
                            {isCompleted ? "Përfunduar" : isLocked ? "Premium" : "Fillo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="bg-white rounded-lg p-6 inline-block border-2 border-[#99F6E4] shadow-lg">
                  <Book className="text-[#14B8A6] w-10 h-10 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Nuk u gjetën tekste</h3>
                  <p className="text-gray-500 text-xs">
                    Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Translate