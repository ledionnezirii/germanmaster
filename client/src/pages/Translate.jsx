"use client"

import { useState, useEffect } from "react"
import { translateService } from "../services/api"
import { Check, X, Filter, ArrowLeft, Book, Star } from "lucide-react"

const Translate = () => {
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

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  useEffect(() => {
    fetchTexts()
    fetchUserProgress()
  }, [selectedLevel])

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
      const params = { page: 1, limit: 50 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
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
      const progressData = response.data.progress || response.data || []
      const progressMap = {}
      progressData.forEach((progress) => {
        if (progress.textId) {
          const textId = typeof progress.textId === "object" ? progress.textId._id : progress.textId
          progressMap[textId] = progress
        }
      })
      setUserProgress(progressMap)
    } catch (error) {
      console.error("Error fetching user progress:", error)
    }
  }

  const handleAnswerSelect = (answer) => {
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
    }, 1000)
  }

  const submitQuizAnswers = async (answers) => {
    try {
      const formattedAnswers = selectedText.questions.map((question, index) => ({
        questionId: question._id,
        answer: answers[index] || "",
      }))
      const response = await translateService.submitAnswers(selectedText._id, formattedAnswers)
      setQuizResults(response.data)
      setScore(response.data.correctAnswers || 0)
      if (response.data.passed) {
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
    fetchUserProgress()

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
      case "A2":
        return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200"
      case "B1":
        return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200"
      case "B2":
        return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200"
      case "C1":
        return "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200"
      case "C2":
        return "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200"
      default:
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
    }
  }

  const getBaseXP = (level) => {
    switch (level) {
      case "A1":
        return 10
      case "A2":
        return 20
      case "B1":
        return 30
      case "B2":
        return 40
      case "C1":
        return 50
      case "C2":
        return 60
      default:
        return 10
    }
  }

  if (selectedText) {
    return (
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 px-2 sm:px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-2 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base sm:text-xl font-bold mb-1">{selectedText.title}</h1>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    Niveli {selectedText.level}
                  </span>
                  <span className="text-slate-300 text-xs">{selectedText.questions?.length || 0} pyetje</span>
                </div>
              </div>
              <button
                onClick={resetQuiz}
                className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Kthehu</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-6 p-3 sm:p-6">
            {/* Text Section */}
            <div className="space-y-3 w-full">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-5 border border-gray-200 shadow-inner">
                <div className="flex items-center mb-3">
                  <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                    <Book className="h-4 w-4 text-slate-600" />
                    <span>Teksti për Lexim</span>
                  </h2>
                </div>

                {/* Text Display with Scrollbar */}
                <div className="relative bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 w-full max-h-52 sm:max-h-72 overflow-y-auto">
                  <p className="text-gray-800 leading-relaxed text-xs sm:text-sm font-medium tracking-wide break-words w-full">
                    {selectedText.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz Section */}
            <div className="space-y-3 w-full">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 sm:p-5 border border-gray-200 shadow-md">
                {!quizComplete ? (
                  <>
                    {/* Progress Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 gap-2">
                      <h2 className="text-xs sm:text-sm font-bold text-gray-800">
                        Pyetja {currentQuestion + 1} nga {selectedText.questions.length}
                      </h2>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="bg-white px-2 py-0.5 rounded-full shadow-sm">
                          <span className="text-xs font-medium text-gray-600">
                            {userAnswers.length}/{selectedText.questions.length}
                          </span>
                        </div>
                        <div className="flex-1 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-slate-500 to-slate-600 transition-all duration-300"
                            style={{ width: `${(userAnswers.length / selectedText.questions.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-4 sm:mb-5">
                      <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-3">
                        <p className="text-gray-900 font-semibold text-xs sm:text-sm leading-relaxed break-words">
                          {selectedText.questions[currentQuestion].question}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2">
                        {selectedText.questions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== ""}
                            className={`w-full p-2 sm:p-3 text-left rounded-lg border-2 transition-all duration-200 font-medium ${
                              selectedAnswer === option
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-md transform scale-[1.02]"
                                : "bg-white border-gray-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex-1 text-xs sm:text-sm break-words pr-2">{option}</span>
                              {selectedAnswer === option && (
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Results Screen */
                  <div className="text-center space-y-4">
                    {quizResults ? (
                      <>
                        {/* XP Banner */}
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 sm:p-6 rounded-xl shadow-lg">
                          <div className="text-4xl sm:text-5xl mb-2">{quizResults.passed ? "🎉" : "📚"}</div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                            {quizResults.passed ? "Urime!" : "Provo Përsëri!"}
                          </h2>
                          {quizResults.xpAwarded > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                              <span className="text-white font-bold text-lg sm:text-xl">
                                +{quizResults.xpAwarded} XP
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Score Summary */}
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                          <div className="flex justify-center gap-6 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full mx-auto mb-2">
                                <Check className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                              </div>
                              <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {quizResults.correctAnswers || 0}
                              </p>
                              <p className="text-xs text-gray-500">Të sakta</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full mx-auto mb-2">
                                <X className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                              </div>
                              <p className="text-xl sm:text-2xl font-bold text-red-600">
                                {(quizResults.totalQuestions || selectedText.questions.length) -
                                  (quizResults.correctAnswers || 0)}
                              </p>
                              <p className="text-xs text-gray-500">Të gabuara</p>
                            </div>
                          </div>

                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700">
                              Rezultati:{" "}
                              {quizResults.score ||
                                Math.round(
                                  (quizResults.correctAnswers /
                                    (quizResults.totalQuestions || selectedText.questions.length)) *
                                    100,
                                )}
                              %
                            </p>
                          </div>
                        </div>

                        {/* Questions Review */}
                        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 text-left max-h-40 overflow-y-auto">
                          <h3 className="font-bold text-gray-800 mb-2 text-sm">Përmbledhje:</h3>
                          <div className="space-y-1.5">
                            {quizResults.results &&
                              quizResults.results.map((result, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                    result.isCorrect
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-red-50 border border-red-200"
                                  }`}
                                >
                                  {result.isCorrect ? (
                                    <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <X className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`font-medium ${result.isCorrect ? "text-green-700" : "text-red-700"}`}
                                  >
                                    Pyetja {index + 1}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <button
                          onClick={resetQuiz}
                          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl w-full"
                        >
                          Vazhdo me Tekst Tjetër
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
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

  return (
    <div className="h-min-screen p-4 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#99F6E4] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktika e Përkthimit</h1>
                <p className="text-gray-600">Praktiko kuptimin e leximit me tekste gjermane dhe pyetje</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Teste të përfunduara: {Object.values(userProgress).filter((p) => p.completed).length}
            </p>
          </div>
        </header>

        <div className="bg-white border-2 border-[#99F6E4] p-3 rounded-lg mb-4 shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-[#14B8A6]" />
            <h2 className="text-sm font-medium text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 shadow-sm hover:shadow-md ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-gradient-to-r from-[#14B8A6] to-[#a0dae4] text-[#000c0bfb] border-[#0D9488] shadow-teal-500/30"
                      : getLevelColor(level)
                    : "bg-gradient-to-br from-[#F0FDFA] to-[#b3e4d9] text-[#000c0bfb] hover:from-[#CCFBF1] hover:to-[#99F6E4] border-[#99F6E4]"
                }`}
              >
                {level === "all" ? "Të gjitha Nivelet" : level}
                {selectedLevel === level && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-white/50 rounded-full text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {texts.length > 0 ? (
              texts.map((text) => {
                const progress = userProgress[text._id]
                const isCompleted = progress && progress.completed
                return (
                  <div
                    key={text._id}
                    className={`p-3 rounded-lg shadow-md border-2 transition-all cursor-pointer overflow-hidden relative group h-fit hover:shadow-xl ${
                      isCompleted
                        ? "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#F59E0B] hover:border-[#D97706]"
                        : "bg-white border-emerald-200 hover:border-emerald-400"
                    }`}
                    onClick={() => setSelectedText(text)}
                  >
                    <div
                      className={`absolute top-2 right-2 ${getLevelColor(text.level)} px-1.5 py-0.5 rounded text-xs font-medium shadow-sm`}
                    >
                      {text.level}
                    </div>
                    <Book
                      className={`absolute -bottom-4 -right-4 w-16 h-16 ${
                        isCompleted ? "text-[#FDE68A]" : "text-slate-100"
                      }`}
                    />
                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-semibold mb-1 pr-12 truncate ${
                          isCompleted
                            ? "text-[#D97706] group-hover:text-[#92400E]"
                            : "text-gray-800 group-hover:text-emerald-700"
                        }`}
                      >
                        {text.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-[#92400E]" : "text-gray-600"}`}>
                        {text.text ? text.text.substring(0, 80) + "..." : "Tekst për lexim"}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-[#92400E]" : "text-gray-500"}`}>
                          {text.questions?.length || 0} pyetje
                        </span>
                        <div className="flex items-center gap-1">
                          {!isCompleted && (
                            <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                              <Star className="h-3 w-3" />
                              {text.xpReward || getBaseXP(text.level)}
                            </span>
                          )}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium shadow-sm ${
                              isCompleted
                                ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                            }`}
                          >
                            {isCompleted ? "Përfunduar" : "Fillo"}
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
