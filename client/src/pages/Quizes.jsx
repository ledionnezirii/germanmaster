"use client"

import { useState, useEffect } from "react"
import { quizService } from "../services/api"
import { CheckCircle, XCircle } from "lucide-react"

export default function Quizes() {
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState(null)
  const [completedQuizzes, setCompletedQuizzes] = useState([])
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  const [currentStreak, setCurrentStreak] = useState(0)
  const [notification, setNotification] = useState(null)
  const [notificationVisible, setNotificationVisible] = useState(false)

  const itemsPerPage = 20

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setNotificationVisible(true)
    setTimeout(() => {
      setNotificationVisible(false)
      setTimeout(() => setNotification(null), 300)
    }, 3000)
  }

  useEffect(() => {
    loadQuizzes()
    loadCompletedQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setIsLoading(true)
      const response = await quizService.getAllQuizzes()
      setQuizzes(response.data || [])
    } catch (err) {
      setError("Dështoi ngarkimi i kuizeve")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompletedQuizzes = async () => {
    try {
      const response = await quizService.getCompletedQuizzes()
      setCompletedQuizzes((response.data || []).map((q) => q._id))
    } catch (err) {
      console.log("Nuk mundëm të ngarkohen kuizet e përfunduara")
    }
  }

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResult(false)
    setResult(null)
    setSubmittedAnswers({})
    setCurrentStreak(0)
  }

  const handleAnswer = (answer) => {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer

    setAnswers({ ...answers, [currentQuestionIndex]: answer })
    setSubmittedAnswers({
      ...submittedAnswers,
      [currentQuestionIndex]: {
        answer: answer,
        isCorrect: isCorrect,
      },
    })

    if (isCorrect) {
      setCurrentStreak(currentStreak + 1)
    } else {
      setCurrentStreak(0)
    }

    setTimeout(() => {
      if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    }, 1000)
  }

  const submitQuiz = async () => {
    try {
      const answersArray = selectedQuiz.questions.map((_, index) => answers[index] || "")
      const response = await quizService.submitQuiz(selectedQuiz._id, answersArray)
      setResult(response.data)
      setShowResult(true)
      if (response.data.passed) {
        setCompletedQuizzes([...completedQuizzes, selectedQuiz._id])
      }
    } catch (err) {
      setError("Dështoi dërgimi i kuizit")
    }
  }

  const resetQuiz = () => {
    if (result) {
      if (result.passed) {
        if (result.xpEarned > 0) {
          showNotification(`Urime! Kaluat kuizin me ${result.percentage}%! +${result.xpEarned} XP 🎉`, "success")
        } else {
          showNotification(`Urime! Kaluat kuizin me ${result.percentage}%!`, "success")
        }
      } else {
        showNotification(`Rezultati: ${result.percentage}%. Ju duhen 70% për të kaluar. Provoni përsëri!`, "error")
      }
    }

    setSelectedQuiz(null)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResult(false)
    setResult(null)
    setSubmittedAnswers({})
    setCurrentStreak(0)
  }

  const filteredQuizzes = selectedLevel === "All" ? quizzes : quizzes.filter((quiz) => quiz.level === selectedLevel)
  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedLevel])

  const isNewQuiz = (quiz) => {
    if (!quiz.createdAt) return false
    const quizDate = new Date(quiz.createdAt)
    const now = new Date()
    const daysDiff = (now - quizDate) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }

  const isQuizCompleted = (quizId) => {
    return completedQuizzes.includes(quizId)
  }

  const NotificationElement = notification && (
    <div
      className={`fixed bottom-5 right-5 px-6 py-4 rounded-2xl font-semibold text-sm shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 ease-out transform ${
        notificationVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
      } ${
        notification.type === "success"
          ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white"
          : "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white"
      }`}
      style={{
        boxShadow:
          notification.type === "success"
            ? "0 10px 40px rgba(16, 185, 129, 0.4)"
            : "0 10px 40px rgba(239, 68, 68, 0.4)",
      }}
    >
      <div className={`p-1.5 rounded-full ${notification.type === "success" ? "bg-white/20" : "bg-white/20"}`}>
        {notification.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </div>
      <span className="max-w-xs">{notification.message}</span>
    </div>
  )

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#F8F9FA] flex items-center justify-center"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {NotificationElement}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Duke ngarkuar kuizet...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {NotificationElement}
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gabim</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadQuizzes()
            }}
            className="px-6 py-2.5 bg-[#007AFF] hover:bg-[#0051D5] text-white font-medium rounded-lg transition-colors cursor-pointer text-sm"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  if (showResult) {
    return (
      <div
        className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {NotificationElement}
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? "bg-[#10B981]/10" : "bg-[#FF8A00]/10"}`}
          >
            {result.passed ? (
              <svg className="w-12 h-12 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-5xl text-[#FF8A00] font-bold">!</span>
            )}
          </div>
          <h2
            className="text-3xl font-bold text-center mb-3 text-gray-900"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {result.passed ? "Urime!" : "Vazhdo të Praktikosh!"}
          </h2>
          <p className="text-center text-gray-600 mb-8">{result.passed ? "Shkëlqyeshëm!" : "Provoni përsëri!"}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-[#10B981]" : "text-[#FF8A00]"}`}>
                {result.percentage}%
              </div>
              <div className="text-sm text-gray-600">Rezultati</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-[#10B981]" : "text-[#FF8A00]"}`}>
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Përgjigje të Sakta</div>
            </div>
          </div>
          {result.passed && result.xpEarned > 0 && (
            <div className="bg-[#E8FFF3] border border-[#A3E9C8] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 text-center font-semibold">+{result.xpEarned} XP të fituara! 🎉</p>
            </div>
          )}
          {result.passed && result.xpEarned === 0 && (
            <div className="bg-[#FFF4E5] border border-[#FFE4B5] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 text-center">Ju e keni përfunduar më parë këtë kuiz. Nuk jepen XP.</p>
            </div>
          )}
          <button
            onClick={resetQuiz}
            className={`w-full px-6 py-4 text-white font-semibold rounded-xl transition-colors cursor-pointer ${result.passed ? "bg-[#10B981] hover:bg-[#059669]" : "bg-[#FF8A00] hover:bg-[#E67A00]"}`}
          >
            Kthehu te Kuizet
          </button>
        </div>
      </div>
    )
  }

  if (selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const isLastQuestion = currentQuestionIndex === selectedQuiz.questions.length - 1
    const currentAnswer = answers[currentQuestionIndex]
    const submittedAnswer = submittedAnswers[currentQuestionIndex]

    const getFireSize = () => {
      if (currentStreak === 0) return "w-3.5 h-3.5"
      if (currentStreak <= 2) return "w-4 h-4"
      if (currentStreak <= 5) return "w-5 h-5"
      if (currentStreak <= 10) return "w-6 h-6"
      return "w-7 h-7"
    }

    return (
      <div
        className="min-h-screen bg-[#F8F9FA] flex items-center justify-center py-6 px-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {NotificationElement}
        <div className="max-w-3xl w-full mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200 flex items-center gap-2 cursor-pointer text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Mbrapa
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF6B00] text-white px-3 py-1.5 rounded-lg shadow-md">
                    <svg
                      className={`${getFireSize()} transition-all duration-300 ease-out ${currentStreak > 0 ? "animate-pulse" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-bold">{currentStreak}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                    {selectedQuiz.level}
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">
                    Pyetja {currentQuestionIndex + 1} / {selectedQuiz.questions.length}
                  </span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <h2
                className="text-lg font-semibold text-gray-900 mb-5 leading-relaxed"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {currentQuestion.questionText}
              </h2>
              {currentQuestion.type === "multiple-choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = currentAnswer === option
                    const isSubmitted = submittedAnswer !== undefined
                    const isCorrect = submittedAnswer && submittedAnswer.answer === option && submittedAnswer.isCorrect
                    const isWrong = submittedAnswer && submittedAnswer.answer === option && !submittedAnswer.isCorrect

                    return (
                      <button
                        key={index}
                        onClick={() => !isSubmitted && handleAnswer(option)}
                        disabled={isSubmitted}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ease-out ${
                          isCorrect
                            ? "border-[#10B981] bg-[#10B981]/5 scale-[1.02]"
                            : isWrong
                              ? "border-red-500 bg-red-50"
                              : isSelected && !isSubmitted
                                ? "border-[#007AFF] bg-[#007AFF]/5"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                        } ${isSubmitted ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                isCorrect
                                  ? "border-[#10B981] bg-[#10B981]"
                                  : isWrong
                                    ? "border-red-500 bg-red-500"
                                    : isSelected && !isSubmitted
                                      ? "border-[#007AFF]"
                                      : "border-gray-300"
                              }`}
                            >
                              {isSelected && !isSubmitted && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]"></div>
                              )}
                              {isCorrect && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                              {isWrong && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`font-medium text-sm ${isCorrect ? "text-[#10B981]" : isWrong ? "text-red-600" : "text-gray-700"}`}
                            >
                              {option}
                            </span>
                          </div>
                          {isCorrect && (
                            <svg
                              className="w-5 h-5 text-[#10B981] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isWrong && (
                            <svg
                              className="w-5 h-5 text-red-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {currentQuestion.type === "fill-in" && (
                <div className="mb-5">
                  <input
                    type="text"
                    value={currentAnswer || ""}
                    onChange={(e) =>
                      !submittedAnswer && setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })
                    }
                    disabled={submittedAnswer !== undefined}
                    placeholder="Shkruani përgjigjen tuaj këtu..."
                    className={`w-full p-4 border-2 rounded-lg focus:outline-none cursor-text transition-all duration-200 ${
                      submittedAnswer?.isCorrect
                        ? "border-[#10B981] bg-[#10B981]/5"
                        : submittedAnswer && !submittedAnswer.isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-[#007AFF]"
                    }`}
                  />
                  {!submittedAnswer && currentAnswer && (
                    <button
                      onClick={() => handleAnswer(currentAnswer)}
                      className="mt-3 w-full px-6 py-3 bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Kontrollo
                    </button>
                  )}
                </div>
              )}
              {currentQuestion.type === "drop-down" && (
                <div className="mb-5">
                  <select
                    value={currentAnswer || ""}
                    onChange={(e) => !submittedAnswer && handleAnswer(e.target.value)}
                    disabled={submittedAnswer !== undefined}
                    className={`w-full p-4 border-2 rounded-lg focus:outline-none cursor-pointer transition-all duration-200 ${
                      submittedAnswer?.isCorrect
                        ? "border-[#10B981] bg-[#10B981]/5"
                        : submittedAnswer && !submittedAnswer.isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-[#007AFF]"
                    }`}
                  >
                    <option value="">Zgjidhni një përgjigje...</option>
                    {currentQuestion.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isLastQuestion && submittedAnswer && (
                <button
                  onClick={submitQuiz}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-md"
                >
                  Dërgo Kuizin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
      {NotificationElement}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00D9C0]/80 to-[#00B8A3]/80 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Kuizet
            </h1>
          </div>
          <p className="text-gray-600 text-sm mb-4">Zgjidhni një kuiz për të filluar të mësoni!</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["All", "A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  selectedLevel === level
                    ? "bg-gradient-to-r from-[#00D9C0]/20 to-[#00B8A3]/20 text-gray-900 border-2 border-[#00D9C0]/50"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {paginatedQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              Nuk ka Kuize të Disponueshme
            </h2>
            <p className="text-gray-500 text-sm">Kontrolloni më vonë për kuize të reja!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {paginatedQuizzes.map((quiz) => {
                const isCompleted = isQuizCompleted(quiz._id)
                const isNew = isNewQuiz(quiz)

                return (
                  <div
                    key={quiz._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all relative overflow-hidden border border-gray-100 cursor-pointer"
                    onClick={() => startQuiz(quiz)}
                  >
                    <div className="p-3.5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-[#eb6b15]/90 text-white text-xs font-semibold px-2 py-1 rounded">
                          {quiz.level}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isNew && (
                            <span className="bg-gradient-to-r from-purple-400/80 to-pink-400/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              E RE
                            </span>
                          )}
                          {isCompleted && (
                            <div className="w-5 h-5 bg-[#34C759]/90 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <h3
                        className="text-sm font-semibold text-gray-900 mb-3 leading-snug line-clamp-2"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {quiz.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-600 font-medium">{quiz.questions?.length || 0} pyetje</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#FF9500]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[#FF9500] font-bold">{quiz.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Mbrapa
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                        currentPage === page
                          ? "bg-[#007AFF] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 bg-white border border-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer"
                >
                  Para
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
