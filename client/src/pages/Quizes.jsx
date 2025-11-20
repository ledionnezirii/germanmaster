"use client"

import { useState, useEffect } from "react"
import { quizService } from "../services/api"

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
  const itemsPerPage = 20

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
      setError("Failed to load quizzes")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompletedQuizzes = async () => {
    try {
      const response = await quizService.getCompletedQuizzes()
      setCompletedQuizzes((response.data || []).map((q) => q._id))
    } catch (err) {
      console.log("Could not load completed quizzes")
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

    // Set the answer immediately
    setAnswers({ ...answers, [currentQuestionIndex]: answer })

    // Set submitted status with immediate feedback
    setSubmittedAnswers({
      ...submittedAnswers,
      [currentQuestionIndex]: {
        answer: answer,
        isCorrect: isCorrect,
      },
    })

    // Update streak
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
      setError("Failed to submit quiz")
    }
  }

  const resetQuiz = () => {
    setSelectedQuiz(null)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResult(false)
    setResult(null)
    setSubmittedAnswers({})
    setCurrentStreak(0)
    loadQuizzes()
  }

  const getLevelColor = (level) => {
    const colors = {
      A1: "bg-[#7C3AED] text-white",
      A2: "bg-[#7C3AED] text-white",
      B1: "bg-[#7C3AED] text-white",
      B2: "bg-[#7C3AED] text-white",
      C1: "bg-[#7C3AED] text-white",
      C2: "bg-[#7C3AED] text-white",
    }
    return colors[level] || "bg-gray-500 text-white"
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

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#F5F7FA] flex items-center justify-center"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Duke ngarkuar kuizet...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Gabim</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadQuizzes()
            }}
            className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-lg transition-colors"
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
        className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
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
            className="text-3xl font-bold text-center mb-3 text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {result.passed ? "Urime!" : "Vazhdo të Praktikosh!"}
          </h2>

          <p className="text-center text-slate-600 mb-8">
            Ju duhen 70% për të kaluar. {result.passed ? "Provoni përsëri!" : "Provoni përsëri!"}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-[#10B981]" : "text-[#FF8A00]"}`}>
                {result.percentage}%
              </div>
              <div className="text-sm text-slate-600">Rezultati</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-[#10B981]" : "text-[#FF8A00]"}`}>
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-slate-600">Përgjigje të Sakta</div>
            </div>
          </div>

          {!result.passed && (
            <div className="bg-[#FFF4E5] border border-[#FFE4B5] rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-700 text-center">
                Ju e keni përfunduar më parë këtë kuiz. Nuk jepen XP.
              </p>
            </div>
          )}

          <button
            onClick={resetQuiz}
            className={`w-full px-6 py-4 text-white font-semibold rounded-xl transition-colors ${result.passed ? "bg-[#10B981] hover:bg-[#059669]" : "bg-[#FF8A00] hover:bg-[#E67A00]"}`}
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

    return (
      <div className="min-h-screen bg-[#F5F7FA] py-8 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Mbrapa
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#FF8A00] text-white px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-bold">{currentStreak}</span>
                  </div>
                  <span className="bg-[#7C3AED] text-white text-sm font-semibold px-3 py-1 rounded">
                    {selectedQuiz.level}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span style={{ fontFamily: "Poppins, sans-serif" }}>
                    Pyetja {currentQuestionIndex + 1} nga {selectedQuiz.questions.length}
                  </span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <h2
                className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {currentQuestion.questionText}
              </h2>

              {currentQuestion.type === "multiple-choice" && (
                <div className="space-y-3 mb-6">
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
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isCorrect
                            ? "border-[#10B981] bg-[#10B981]/5"
                            : isWrong
                              ? "border-red-500 bg-red-50"
                              : isSelected && !isSubmitted
                                ? "border-[#7C3AED] bg-purple-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                        } ${isSubmitted ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isCorrect
                                  ? "border-[#10B981] bg-[#10B981]"
                                  : isWrong
                                    ? "border-red-500 bg-red-500"
                                    : isSelected && !isSubmitted
                                      ? "border-[#7C3AED]"
                                      : "border-slate-300"
                              }`}
                            >
                              {isSelected && !isSubmitted && <div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div>}
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
                              className={`font-medium ${isCorrect ? "text-[#10B981]" : isWrong ? "text-red-600" : "text-slate-700"}`}
                            >
                              {option}
                            </span>
                          </div>
                          {isCorrect && (
                            <svg
                              className="w-6 h-6 text-[#10B981]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isWrong && (
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mb-6">
                  <input
                    type="text"
                    value={currentAnswer || ""}
                    onChange={(e) =>
                      !submittedAnswer && setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })
                    }
                    disabled={submittedAnswer !== undefined}
                    placeholder="Shkruani përgjigjen tuaj këtu..."
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none ${
                      submittedAnswer?.isCorrect
                        ? "border-[#10B981] bg-[#10B981]/5"
                        : submittedAnswer && !submittedAnswer.isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 focus:border-[#7C3AED]"
                    }`}
                  />
                  {!submittedAnswer && currentAnswer && (
                    <button
                      onClick={() => handleAnswer(currentAnswer)}
                      className="mt-3 w-full px-6 py-3 bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold rounded-xl transition-colors"
                    >
                      Kontrollo
                    </button>
                  )}
                </div>
              )}

              {currentQuestion.type === "drop-down" && (
                <div className="mb-6">
                  <select
                    value={currentAnswer || ""}
                    onChange={(e) => !submittedAnswer && handleAnswer(e.target.value)}
                    disabled={submittedAnswer !== undefined}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none ${
                      submittedAnswer?.isCorrect
                        ? "border-[#10B981] bg-[#10B981]/5"
                        : submittedAnswer && !submittedAnswer.isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 focus:border-[#7C3AED]"
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
                  className="w-full px-6 py-4 bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold rounded-xl transition-colors"
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
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 bg-white rounded-2xl p-6 shadow-sm">
          <h1
            className="text-2xl md:text-3xl font-bold text-slate-900 mb-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Test Your Knowledge
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mx-auto">
            Challenge yourself with quizzes across different levels and earn XP as you progress
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Filter by Level</h3>
          <div className="flex flex-wrap gap-2">
            {["All", "A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                  selectedLevel === level
                    ? "bg-[#7C3AED] text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-[#7C3AED]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {paginatedQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Nuk ka Kuize të Disponueshme
            </h2>
            <p className="text-slate-600 text-sm">Kontrolloni më vonë për kuize të reja!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedQuizzes.map((quiz) => {
                const isCompleted = completedQuizzes.includes(quiz._id)
                const isNew = isNewQuiz(quiz)
                return (
                  <div
                    key={quiz._id}
                    className="bg-white rounded-xl border-2 border-slate-200 hover:border-[#7C3AED] transition-all relative"
                  >
                    {isNew && !isCompleted && (
                      <div className="absolute top-2 right-2 bg-[#FF8A00] text-white text-xs font-bold px-2 py-0.5 rounded">
                        NEW!
                      </div>
                    )}

                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`${getLevelColor(quiz.level)} text-xs font-semibold px-2 py-0.5 rounded`}>
                          {quiz.level}
                        </span>
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>Completed</span>
                          </div>
                        )}
                      </div>

                      <h3
                        className="text-sm font-semibold text-slate-900 mb-2 leading-tight line-clamp-2 min-h-[2.5rem]"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {quiz.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#FF8A00]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="font-semibold">{quiz.xp} XP</span>
                        </div>
                      </div>

                      <button
                        onClick={() => startQuiz(quiz)}
                        className={`w-full px-3 py-2 text-white text-sm font-bold rounded-lg transition-colors ${
                          isCompleted ? "bg-[#FF8A00] hover:bg-[#E67A00]" : "bg-[#10B981] hover:bg-[#059669]"
                        }`}
                      >
                        {isCompleted ? "RETAKE QUIZ" : "START QUIZ"}
                      </button>
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
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  ← Mbrapa
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                        currentPage === page ? "bg-[#7C3AED] text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Para →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
