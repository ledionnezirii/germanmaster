"use client"

import { useState, useEffect, useRef } from "react"
import { quizService } from "../services/api"
import { BookOpen, ArrowLeft, Check, X, Star, Trophy, Target, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

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
  const [quizzesPerPage] = useState(20)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const speechRef = useRef(null)

  const [selectedLevel, setSelectedLevel] = useState("all")
  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  const [selectedWords, setSelectedWords] = useState([])

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
      A1: "bg-green-50 text-green-700 border-green-200",
      A2: "bg-green-100 text-green-800 border-green-300",
      B1: "bg-emerald-100 text-emerald-800 border-emerald-300",
      B2: "bg-orange-50 text-orange-700 border-orange-200",
      C1: "bg-orange-100 text-orange-800 border-orange-300",
      C2: "bg-amber-100 text-amber-800 border-amber-300",
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
    // Join words with space to form the answer
    handleAnswer(newSelectedWords.join(" "))
  }

  const handleRemoveWord = (index) => {
    const newSelectedWords = selectedWords.filter((_, i) => i !== index)
    setSelectedWords(newSelectedWords)
    // Update answer
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
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>

            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-2.5 text-left rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                    currentAnswer === option
                      ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
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
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Shkruani përgjigjen tuaj këtu..."
              className="w-full p-2.5 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-medium bg-white"
            />
          </div>
        )

      case "drop-down":
      case "dropdown":
        return (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed">
                {question.questionText}
              </h3>
            </div>

            {/* Selected words area */}
            <div className="min-h-[60px] p-3 bg-white border-2 border-gray-300 rounded-lg">
              {selectedWords.length === 0 ? (
                <p className="text-gray-400 text-sm font-medium text-center py-2">
                  Kliko fjalët më poshtë për të formuar përgjigjen...
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveWord(idx)}
                      className="px-3 py-2 bg-green-100 text-green-800 rounded-lg border-2 border-green-300 text-sm font-bold hover:bg-red-100 hover:text-red-800 hover:border-red-300 transition-all duration-200"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Available word buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {question.options.map((option, optIndex) => {
                const isUsed = selectedWords.includes(option)
                return (
                  <button
                    key={optIndex}
                    onClick={() => !isUsed && handleWordClick(option)}
                    disabled={isUsed}
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-bold transition-all duration-200 ${
                      isUsed
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                        : "bg-white text-gray-800 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-800 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {/* Clear button */}
            {selectedWords.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setSelectedWords([])
                    handleAnswer("")
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 transition-colors"
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Diçka shkoi keq</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-bold"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 font-medium">Duke ngarkuar kuizet...</p>
        </div>
      </div>
    )
  }

  if (showResults && quizResults) {
    const percentage = Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100)
    const isGoodScore = percentage >= 70

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full p-5 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isGoodScore ? "bg-green-100" : "bg-orange-100"
            }`}
          >
            {isGoodScore ? (
              <Trophy className="w-7 h-7 text-green-600" />
            ) : (
              <Target className="w-7 h-7 text-orange-600" />
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">Kuizi u Përfundua!</h2>
          <p className="text-gray-600 mb-3 font-medium text-sm">{quizResults.quizTitle}</p>

          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {quizResults.correctAnswers}/{quizResults.totalQuestions}
            </div>
            <p className="text-gray-600 mb-2 font-medium text-sm">Përgjigje të Sakta</p>

            <div className={`text-xl font-bold mb-1 ${isGoodScore ? "text-green-600" : "text-orange-600"}`}>
              {percentage}%
            </div>
            <p className="text-xs text-gray-500 font-medium">Rezultati</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 p-2.5 bg-orange-50 rounded-xl border border-orange-200">
            <Star className="w-4 h-4 text-orange-600" />
            <span className="text-orange-600 font-bold text-sm">+{quizResults.xpEarned} XP Fituar</span>
          </div>

          <div className="mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getLevelColor(quizResults.level)}`}>
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
              className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
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
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto p-3 sm:p-5">
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => {
                setCurrentView("list")
                stopSpeech()
                setSelectedWords([])
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="mb-3 sm:mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kthehu te Kuizet</span>
              <span className="sm:hidden">Kthehu</span>
            </button>

            <div className="bg-green-600 rounded-xl p-4 sm:p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base sm:text-xl font-bold mb-2">{selectedQuiz.title}</h1>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold border-2 bg-white/20 text-white border-white/30">
                      Niveli {selectedQuiz.level}
                    </span>
                    <div className="flex items-center gap-1 text-xs bg-orange-500 px-2.5 py-1 rounded-full font-bold">
                      <Star className="w-3 h-3" />
                      {selectedQuiz.xp} XP
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-100 font-medium">Pyetja</p>
                  <p className="text-lg sm:text-xl font-bold">
                    {currentQuestionIndex + 1}/{selectedQuiz.questions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-600 font-medium">Përparimi</span>
                <span className="text-xs text-gray-600 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 p-3 sm:p-4">
            {renderQuestion(currentQuestion, currentQuestionIndex)}
          </div>

          <div className="flex justify-between gap-2 sm:gap-3">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-green-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">E Mëparshme</span>
              <span className="sm:hidden">Mbrapa</span>
            </button>

            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="hidden sm:inline">Dërgo Kuizin</span>
                <span className="sm:hidden">Dërgo</span>
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  !answers[currentQuestionIndex]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="hidden sm:inline">Tjetri</span>
                <span className="sm:hidden">Para</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-5">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Kuizet e Mësimit të Gjuhës</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Testoni aftësitë tuaja në gjuhën gjermane me kuize interaktive dhe ndiqni përparimin tuaj.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6 sm:mb-8">
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
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  selectedLevel === level
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level === "all" ? "Të Gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {currentQuizzes.map((quiz) => {
            const isCompleted = completedQuizzes.includes(quiz._id)

            return (
              <div
                key={quiz._id}
                className={`relative rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden group border-2 ${
                  isCompleted
                    ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                    : "bg-white border-gray-200 hover:border-green-300"
                }`}
                onClick={() => startQuiz(quiz)}
              >
                {isCompleted && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="w-6 h-6 bg-orange-500 rounded-full shadow-sm flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <div className="mb-4">
                    <h3
                      className={`text-base sm:text-lg font-bold mb-2 line-clamp-2 leading-snug ${
                        isCompleted ? "text-orange-800" : "text-gray-800 group-hover:text-green-700"
                      }`}
                    >
                      {quiz.title}
                    </h3>
                    <p className={`text-sm font-medium ${isCompleted ? "text-orange-600" : "text-gray-500"}`}>
                      {quiz.questions.length} pyetje
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isCompleted ? "bg-orange-100 text-orange-800 border-orange-200" : getLevelColor(quiz.level)
                        }`}
                      >
                        {quiz.level}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700">
                        <Star className="w-4 h-4" />
                        {quiz.xp}
                      </div>
                    </div>

                    <button
                      className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
                        isCompleted
                          ? "bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isCompleted ? "Përsërit Kuizin" : "Fillo Kuizin"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mb-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-lg transition-all ${
                currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 bg-gray-50"
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
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    currentPage === pageNumber
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-lg transition-all ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 bg-gray-50"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {filteredQuizzes.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">
              Duke treguar {indexOfFirstQuiz + 1}-{Math.min(indexOfLastQuiz, filteredQuizzes.length)} nga{" "}
              {filteredQuizzes.length} kuize
            </p>
          </div>
        )}

        {filteredQuizzes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-2xl p-8 inline-block border border-gray-200">
              <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800 mb-2">Nuk ka kuize të disponueshme</h3>
              <p className="text-gray-500 text-sm">
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
