"use client"

import { useState, useEffect, useRef } from "react"
import { quizService } from "../services/api"
import {
  BookOpen,
  ArrowLeft,
  Check,
  X,
  Star,
  Trophy,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react"

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
  const [quizzesPerPage] = useState(20) // Changed to 20 for better grid layout
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const speechRef = useRef(null)

  const [selectedLevel, setSelectedLevel] = useState("all")
  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

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
        console.error("Error loading quiz data:", err)
        setError("Dështoi të ngarkojë kuizet. Ju lutemi provoni përsëri.")
        setQuizzes([])
        setCompletedQuizzes([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsPlaying(true)
        setIsPaused(false)
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }

      utterance.onerror = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }

      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const filteredQuizzes = selectedLevel === "all" ? quizzes : quizzes.filter((quiz) => quiz.level === selectedLevel)

  const indexOfLastQuiz = currentPage * quizzesPerPage
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage
  const currentQuizzes = filteredQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz)
  const totalPages = Math.ceil(filteredQuizzes.length / quizzesPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const getLevelColor = (level) => {
    const colors = {
      A1: "bg-teal-100 text-teal-800 border-teal-200",
      A2: "bg-teal-200 text-teal-800 border-teal-300",
      B1: "bg-teal-300 text-teal-800 border-teal-400",
      B2: "bg-teal-400 text-teal-800 border-teal-500",
      C1: "bg-teal-500 text-white border-teal-600",
      C2: "bg-teal-600 text-white border-teal-700",
    }
    return colors[level] || colors.A1
  }

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setCurrentView("quiz")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const submitQuiz = async () => {
    try {
      await quizService.submitQuiz(selectedQuiz._id, answers)

      const correctAnswers = selectedQuiz.questions.filter((q, index) => answers[index] === q.correctAnswer).length

      setQuizResults({
        correctAnswers,
        totalQuestions: selectedQuiz.questions.length,
        xpEarned: selectedQuiz.xp,
        quizTitle: selectedQuiz.title,
        level: selectedQuiz.level,
      })
      setShowResults(true)

      setCompletedQuizzes((prev) => (prev.includes(selectedQuiz._id) ? prev : [...prev, selectedQuiz._id]))
    } catch (err) {
      console.error("Error submitting quiz:", err)
      alert("Dështoi të dërgojë kuizin. Ju lutemi provoni përsëri.")
    }
  }

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index] || ""

    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>

            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-2.5 text-left rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    currentAnswer === option
                      ? "border-teal-500 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 shadow-md transform scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1 break-words pr-2">{option}</span>
                    {currentAnswer === option && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
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
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Shkruani përgjigjen tuaj këtu..."
              className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-sm font-medium bg-white"
            />
          </div>
        )

      case "drop-down":
      case "dropdown":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>
            <select
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none bg-white text-sm font-medium"
            >
              <option value="">Zgjidhni një opsion...</option>
              {question.options.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Diçka shkoi keq</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 font-medium">Duke ngarkuar kuizet...</p>
        </div>
      </div>
    )
  }

  if (showResults && quizResults) {
    const percentage = Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100)
    const isGoodScore = percentage >= 70

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isGoodScore ? "bg-green-100" : "bg-orange-100"
            }`}
          >
            {isGoodScore ? (
              <Trophy className="w-8 h-8 text-green-600" />
            ) : (
              <Target className="w-8 h-8 text-orange-600" />
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">Kuizi u Përfundua!</h2>
          <p className="text-gray-600 mb-4 font-medium">{quizResults.quizTitle}</p>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 mb-3">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {quizResults.correctAnswers}/{quizResults.totalQuestions}
            </div>
            <p className="text-gray-600 mb-2 font-medium">Përgjigje të Sakta</p>

            <div className={`text-xl font-bold mb-1 ${isGoodScore ? "text-green-600" : "text-orange-600"}`}>
              {percentage}%
            </div>
            <p className="text-xs text-gray-500 font-medium">Rezultati</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 p-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
            <Star className="w-4 h-4 text-teal-600" />
            <span className="text-teal-600 font-bold text-sm">+{quizResults.xpEarned} XP Fituar</span>
          </div>

          <div className="mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getLevelColor(quizResults.level)}`}>
              Niveli {quizResults.level}
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setShowResults(false)
                setQuizResults(null)
                setCurrentView("list")
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="max-w-6xl mx-auto p-3 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => {
                setCurrentView("list")
                stopSpeech()
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium bg-white px-3 sm:px-4 py-2 rounded-xl shadow-sm hover:shadow-md border border-gray-200"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Kthehu te Kuizet</span>
              <span className="sm:hidden">Kthehu</span>
            </button>

            <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">{selectedQuiz.title}</h1>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 bg-white/20 text-white border-white/30`}
                    >
                      Niveli {selectedQuiz.level}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-teal-100 font-medium">
                      <Star className="w-3 sm:w-4 h-3 sm:h-4" />
                      {selectedQuiz.xp} XP
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-teal-100 font-medium">Pyetja</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {currentQuestionIndex + 1}/{selectedQuiz.questions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Përparimi</span>
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 sm:h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-lg mb-6 p-3">
            {renderQuestion(currentQuestion, currentQuestionIndex)}
          </div>

          <div className="flex justify-between gap-3 sm:gap-4">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm font-bold transition-all ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-teal-300 shadow-sm hover:shadow-md"
              }`}
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">E Mëparshme</span>
              <span className="sm:hidden">Mbrapa</span>
            </button>

            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
              >
                <span className="hidden sm:inline">Dërgo Kuizin</span>
                <span className="sm:hidden">Dërgo</span>
                <Check className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
              >
                <span className="hidden sm:inline">Tjetri</span>
                <span className="sm:hidden">Para</span>
                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="max-w-5xl mx-auto p-3 sm:p-6">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">Kuizet e Mësimit të Gjuhës</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium">
            Testoni aftësitë tuaja në gjuhën gjermane me kuize interaktive dhe ndiqni përparimin tuaj.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level)
                  setCurrentPage(1)
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level === "all" ? "Të Gjitha Nivelet" : level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-10">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 text-center shadow-sm">
            <div className="w-8 sm:w-12 h-8 sm:h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <BookOpen className="w-4 sm:w-6 h-4 sm:h-6 text-teal-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-600 mb-1 sm:mb-2">Kuize Gjithsej</h3>
            <p className="text-lg sm:text-2xl font-bold text-gray-800">{filteredQuizzes.length}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 text-center shadow-sm">
            <div className="w-8 sm:w-12 h-8 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Trophy className="w-4 sm:w-6 h-4 sm:h-6 text-green-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-600 mb-1 sm:mb-2">Të Përfunduara</h3>
            <p className="text-lg sm:text-2xl font-bold text-gray-800">{completedQuizzes.length}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 text-center shadow-sm">
            <div className="w-8 sm:w-12 h-8 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Clock className="w-4 sm:w-6 h-4 sm:h-6 text-orange-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-600 mb-1 sm:mb-2">Në Progres</h3>
            <p className="text-lg sm:text-2xl font-bold text-gray-800">
              {filteredQuizzes.length - completedQuizzes.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {currentQuizzes.map((quiz) => {
            const isCompleted = completedQuizzes.includes(quiz._id)

            return (
              <div
                key={quiz._id}
                className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer overflow-hidden group h-28 sm:h-32 ${
                  // reduced height from h-32 sm:h-36 to h-28 sm:h-32
                  isCompleted
                    ? "bg-[#a8e6cf] border-2 border-green-300 shadow-md" // using soft mint color #a8e6cf for completed boxes
                    : "bg-white border-2 border-gray-200 hover:border-teal-300 shadow-sm"
                }`}
                onClick={() => startQuiz(quiz)}
              >
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <div className="w-2 sm:w-3 h-2 sm:h-3 bg-green-600 rounded-full shadow-lg">
                      {" "}
                      {/* removed tick icon, made dot smaller */}
                    </div>
                  </div>
                )}

                <BookOpen
                  className={`absolute -bottom-2 -right-2 w-6 sm:w-8 h-6 sm:h-8 ${
                    isCompleted ? "text-green-300" : "text-gray-200"
                  } group-hover:scale-110 transition-transform duration-300`}
                />

                <div className="relative z-10 p-2 sm:p-3 h-full flex flex-col justify-between">
                  <div className="mb-2">
                    <h3
                      className={`text-xs sm:text-sm font-bold mb-1 line-clamp-2 ${
                        isCompleted ? "text-green-800" : "text-gray-800 group-hover:text-teal-700"
                      }`}
                    >
                      {quiz.title}
                    </h3>
                    <p className={`text-xs font-medium ${isCompleted ? "text-green-600" : "text-gray-500"}`}>
                      {quiz.questions.length} pyetje
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        isCompleted ? "bg-green-200 text-green-800 border-green-300" : getLevelColor(quiz.level)
                      }`}
                    >
                      {quiz.level}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        isCompleted ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <Star className="w-2.5 h-2.5" />
                      {quiz.xp}
                    </div>
                  </div>

                  <button
                    className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md"
                        : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {isCompleted ? "Përsërit" : "Fillo"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-white hover:shadow-md bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
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
                  className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    currentPage === pageNumber
                      ? "bg-teal-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-white hover:shadow-md bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-white hover:shadow-md bg-gray-50"
              }`}
            >
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        )}

        {filteredQuizzes.length > 0 && (
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Duke treguar {indexOfFirstQuiz + 1}-{Math.min(indexOfLastQuiz, filteredQuizzes.length)} nga{" "}
              {filteredQuizzes.length} kuize
            </p>
          </div>
        )}

        {filteredQuizzes.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 inline-block">
              <BookOpen className="h-8 sm:h-10 w-8 sm:w-10 text-teal-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-800 mb-1">Nuk ka kuize të disponueshme</h3>
              <p className="text-gray-500 text-xs">
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
