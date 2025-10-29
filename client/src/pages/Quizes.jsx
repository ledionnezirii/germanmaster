"use client"

import { useState, useEffect } from "react"
import { quizService } from "../services/api"
import { BookOpen, ArrowLeft, Check, X, Star, Trophy, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

const Quizes = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [quizzes, setQuizzes] = useState([])
  const [completedQuizzes, setCompletedQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [quizzesPerPage] = useState(16)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedWords, setSelectedWords] = useState([])

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]
  const filteredQuizzes = selectedLevel === "all" ? quizzes : quizzes.filter((quiz) => quiz.level === selectedLevel)
  const totalPages = Math.ceil(filteredQuizzes.length / quizzesPerPage)
  const indexOfFirstQuiz = (currentPage - 1) * quizzesPerPage
  const indexOfLastQuiz = Math.min(indexOfFirstQuiz + quizzesPerPage, filteredQuizzes.length)

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const quizzesResponse = await quizService.getAllQuizzes()
        setQuizzes(quizzesResponse.data || [])

        const completedResponse = await quizService.getCompletedQuizzes()
        const completedData = completedResponse.data || []
        const completedIds = completedData.map((item) => (typeof item === "string" ? item : item._id))
        setCompletedQuizzes(completedIds)
      } catch (err) {
        setError("Dështoi të ngarkojë kuizet. Ju lutemi provoni përsëri.")
        setQuizzes([])
        setCompletedQuizzes([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getLevelColor = (level) => {
    const colors = {
      A1: "from-emerald-400 to-teal-500",
      A2: "from-teal-400 to-cyan-500",
      B1: "from-blue-400 to-indigo-500",
      B2: "from-indigo-400 to-purple-500",
      C1: "from-purple-400 to-pink-500",
      C2: "from-pink-400 to-rose-500",
    }
    return colors[level] || colors.A1
  }

  const getLevelBadgeColor = (level) => {
    const colors = {
      A1: "bg-emerald-100 text-emerald-700 border-emerald-200",
      A2: "bg-teal-100 text-teal-700 border-teal-200",
      B1: "bg-blue-100 text-blue-700 border-blue-200",
      B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
      C1: "bg-purple-100 text-purple-700 border-purple-200",
      C2: "bg-pink-100 text-pink-700 border-pink-200",
    }
    return colors[level] || colors.A1
  }

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setSelectedWords([])
    setCurrentView("quiz")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }))
  }

  const handleWordClick = (word) => {
    const newSelectedWords = [...selectedWords, word]
    setSelectedWords(newSelectedWords)
    handleAnswer(newSelectedWords.join(" "))
  }

  const handleRemoveWord = (index) => {
    const newSelectedWords = selectedWords.filter((_, i) => i !== index)
    setSelectedWords(newSelectedWords)
    handleAnswer(newSelectedWords.join(" "))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedWords([])
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setSelectedWords([])
    }
  }

  const submitQuiz = async () => {
    try {
      const response = await quizService.submitQuiz(selectedQuiz._id, answers)

      setQuizResults({
        correctAnswers: response.data.correctAnswers,
        totalQuestions: response.data.totalQuestions,
        xpEarned: response.data.xpEarned || 0,
        quizTitle: selectedQuiz.title,
        level: selectedQuiz.level,
        passed: response.data.passed,
        percentage: response.data.percentage,
        alreadyCompleted: response.data.alreadyCompleted,
      })
      setShowResults(true)

      if (response.data.passed && !response.data.alreadyCompleted) {
        setCompletedQuizzes((prev) => (prev.includes(selectedQuiz._id) ? prev : [...prev, selectedQuiz._id]))
      }
    } catch (err) {
      console.error("Error submitting quiz:", err)
    }
  }

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index] || ""

    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
              <h3 className="text-base font-bold text-gray-800 leading-relaxed">{question.questionText}</h3>
            </div>

            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 text-sm font-semibold ${
                    currentAnswer === option
                      ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1 break-words pr-2">{option}</span>
                    {currentAnswer === option && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case "fill-in":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
              <h3 className="text-base font-bold text-gray-800 leading-relaxed">{question.questionText}</h3>
            </div>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Shkruani përgjigjen tuaj këtu..."
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm font-semibold bg-white shadow-sm"
            />
          </div>
        )

      case "drop-down":
      case "dropdown":
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-100">
              <h3 className="text-base font-bold text-gray-800 leading-relaxed">{question.questionText}</h3>
            </div>

            <div className="min-h-[80px] p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl">
              {selectedWords.length === 0 ? (
                <p className="text-gray-400 text-sm font-semibold text-center py-4">
                  Kliko fjalët më poshtë për të formuar përgjigjen...
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveWord(idx)}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 rounded-lg border-2 border-teal-300 text-sm font-bold hover:from-red-100 hover:to-red-200 hover:text-red-800 hover:border-red-300 transition-all duration-200 shadow-sm"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {question.options.map((option, optIndex) => {
                const isUsed = selectedWords.includes(option)
                return (
                  <button
                    key={optIndex}
                    onClick={() => !isUsed && handleWordClick(option)}
                    disabled={isUsed}
                    className={`px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                      isUsed
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-40"
                        : "bg-white text-gray-800 border-gray-300 hover:border-teal-500 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-800 shadow-sm hover:shadow-md hover:scale-105"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {selectedWords.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setSelectedWords([])
                    handleAnswer("")
                  }}
                  className="px-5 py-2 text-sm font-bold text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                >
                  Pastro të gjitha
                </button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-white rounded-2xl shadow-xl p-8 border-2 border-red-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Diçka shkoi keq</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg text-sm font-bold"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600 font-semibold">Duke ngarkuar kuizet...</p>
        </div>
      </div>
    )
  }

  if (showResults && quizResults) {
    const percentage =
      quizResults.percentage || Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100)
    const passed = quizResults.passed
    const xpEarned = quizResults.xpEarned || 0
    const alreadyCompleted = quizResults.alreadyCompleted

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 max-w-md w-full p-8 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed ? "bg-gradient-to-br from-orange-100 to-orange-200" : "bg-gradient-to-br from-red-100 to-red-200"
            }`}
          >
            {passed ? <Trophy className="w-10 h-10 text-orange-600" /> : <X className="w-10 h-10 text-red-600" />}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">{passed ? "Kuizi u Përfundua!" : "Kuizi Dështoi"}</h2>
          <p className="text-gray-600 mb-4 font-semibold text-base">{quizResults.quizTitle}</p>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 mb-4 border-2 border-gray-200">
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {quizResults.correctAnswers}/{quizResults.totalQuestions}
            </div>
            <p className="text-gray-600 mb-3 font-semibold text-sm">Përgjigje të Sakta</p>

            <div className={`text-3xl font-bold mb-2 ${passed ? "text-orange-600" : "text-red-600"}`}>
              {percentage}%
            </div>
            <p className="text-xs text-gray-500 font-semibold">
              {passed ? "Kaluar! (Duhet ≥70%)" : "Dështuar (Duhet ≥70%)"}
            </p>
          </div>

          {xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
              <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
              <span className="text-orange-600 font-bold text-base">+{xpEarned} XP Fituar</span>
            </div>
          )}

          {passed && alreadyCompleted && (
            <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
              <p className="text-amber-700 text-sm font-semibold">
                Ju keni përfunduar tashmë këtë kuiz. Nuk fitoni XP përsëri.
              </p>
            </div>
          )}

          {!passed && (
            <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
              <p className="text-red-700 text-sm font-semibold">
                Ju nevojitet të paktën 70% për të kaluar. Provoni përsëri!
              </p>
            </div>
          )}

          <div className="mb-5">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getLevelBadgeColor(quizResults.level)}`}
            >
              Niveli {quizResults.level}
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowResults(false)
                setQuizResults(null)
                setCurrentView("list")
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Kthehu te Kuizet
            </button>

            <button
              onClick={() => {
                setShowResults(false)
                setQuizResults(null)
                setCurrentQuestionIndex(0)
                setAnswers({})
                setCurrentView("quiz")
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-bold text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Përsërit Kuizin
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "quiz" && selectedQuiz) {
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <div className="mb-6">
            <button
              onClick={() => {
                setCurrentView("list")
                setSelectedWords([])
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-semibold bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 border-2 border-gray-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kthehu te Kuizet</span>
            </button>

            <div
              className={`bg-gradient-to-r ${getLevelColor(selectedQuiz.level)} rounded-2xl p-6 text-white shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold mb-3">{selectedQuiz.title}</h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/30 backdrop-blur-sm border border-white/40">
                      Niveli {selectedQuiz.level}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold border border-white/40">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      {selectedQuiz.xp} XP
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/80 font-semibold mb-1">Pyetja</p>
                  <p className="text-2xl font-bold">
                    {currentQuestionIndex + 1}/{selectedQuiz.questions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-semibold">Përparimi</span>
                <span className="text-xs text-gray-600 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className={`bg-gradient-to-r ${getLevelColor(selectedQuiz.level)} h-3 rounded-full transition-all duration-500 shadow-md`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg mb-5 p-5">
            {renderQuestion(currentQuestion, currentQuestionIndex)}
          </div>

          <div className="flex justify-between gap-3">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />E Mëparshme
            </button>

            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                }`}
              >
                Dërgo Kuizin
                <Check className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }`}
              >
                Tjetri
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kuize te Gjuhes Gjermane</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-18 font-medium">Sfidoni njohurite tuaja Gjermane</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedLevel("all")
                setCurrentPage(1)
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                selectedLevel === "all"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-transparent"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
              }`}
            >
              Të Gjitha
            </button>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level)
                  setCurrentPage(1)
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                  selectedLevel === level
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-transparent"
                    : `${getLevelBadgeColor(level)} hover:scale-105`
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {filteredQuizzes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {filteredQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz).map((quiz) => {
                const isCompleted = completedQuizzes.includes(quiz._id)

                return (
                  <div
                    key={quiz._id}
                    className="group bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden hover:scale-105"
                    onClick={() => startQuiz(quiz)}
                  >
                    <div className={`h-2 bg-gradient-to-r ${getLevelColor(quiz.level)}`}></div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900 leading-tight flex-1 pr-2 group-hover:text-blue-600 transition-colors">
                          {quiz.title}
                        </h3>
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getLevelBadgeColor(quiz.level)}`}
                        >
                          Niveli {quiz.level}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-semibold">{quiz.questions?.length || 0} Pyetje</span>
                        </div>
                      </div>

                      <button
                        className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-md group-hover:shadow-lg ${
                          isCompleted
                            ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 border-2 border-amber-200"
                            : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                        }`}
                      >
                        {isCompleted ? "Përserit" : "Fillo"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mb-8">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-xl transition-all shadow-md ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-100"
                      : "text-gray-600 hover:bg-white bg-white border-2 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else {
                    if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`w-12 h-12 rounded-xl text-sm font-bold transition-all shadow-md ${
                        currentPage === pageNumber
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-110"
                          : "text-gray-600 hover:bg-gray-50 bg-white border-2 border-gray-200"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-3 rounded-xl transition-all shadow-md ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed bg-gray-100"
                      : "text-gray-600 hover:bg-white bg-white border-2 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                Duke treguar {indexOfFirstQuiz + 1}-{Math.min(indexOfLastQuiz, filteredQuizzes.length)} nga{" "}
                {filteredQuizzes.length} kuize
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-3xl p-12 inline-block border-2 border-gray-200 shadow-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Nuk ka kuize të disponueshme</h3>
              <p className="text-gray-500 text-sm font-medium">
                {selectedLevel === "all" ? "Nuk u gjetën kuize." : `Nuk ka kuize për nivelin ${selectedLevel}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Quizes
