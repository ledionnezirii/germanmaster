"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { quizService } from "../services/api"
import { CheckCircle, XCircle, BookOpen, Star, Flame, ArrowLeft, Trophy, Target, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"

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

  const itemsPerPage = 12

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
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedLevel])

  const isNewQuiz = (quiz) => {
    if (!quiz.createdAt) return false
    const daysDiff = (new Date() - new Date(quiz.createdAt)) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }

  const isQuizCompleted = (quizId) => {
    return completedQuizzes.includes(quizId)
  }

  // Notification component
  const NotificationElement = notification && (
    <AnimatePresence>
      {notificationVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl font-medium text-sm shadow-2xl z-50 flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
          }`}
        >
          {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center">
        {NotificationElement}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Duke ngarkuar kuizet...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center p-4">
        {NotificationElement}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Gabim</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadQuizzes()
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all"
          >
            Provo Përsëri
          </button>
        </motion.div>
      </div>
    )
  }

  // Result screen
  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center py-8 px-4">
        {NotificationElement}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center ${
                result.passed
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                  : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
              }`}
            >
              {result.passed ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <Target className="w-12 h-12 text-white" />
              )}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-slate-800 mb-2"
            >
              {result.passed ? "Urime!" : "Vazhdo të Praktikosh!"}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 mb-8"
            >
              {result.passed ? "Shkëlqyeshëm, e kaluat kuizin!" : "Provoni përsëri për rezultat më të mirë"}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-slate-50 rounded-2xl p-5">
                <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>
                  {result.percentage}%
                </div>
                <div className="text-sm text-slate-500 font-medium">Rezultati</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5">
                <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>
                  {result.correctAnswers}/{result.totalQuestions}
                </div>
                <div className="text-sm text-slate-500 font-medium">Sakta</div>
              </div>
            </motion.div>

            {result.passed && result.xpEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl mb-6"
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-700">+{result.xpEarned} XP të fituara!</span>
                <span className="text-xl">🎉</span>
              </motion.div>
            )}

            {result.passed && result.xpEarned === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="px-4 py-3 bg-slate-50 rounded-xl mb-6 text-sm text-slate-600"
              >
                E keni përfunduar më parë këtë kuiz. Nuk jepen XP.
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={resetQuiz}
              className={`w-full py-4 rounded-2xl font-semibold text-lg ${
                result.passed
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
              } text-white transition-all`}
            >
              Kthehu te Kuizet
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Quiz question screen
  if (selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const isLastQuestion = currentQuestionIndex === selectedQuiz.questions.length - 1
    const currentAnswer = answers[currentQuestionIndex]
    const submittedAnswer = submittedAnswers[currentQuestionIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 py-8 px-4">
        {NotificationElement}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedQuiz(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Mbrapa</span>
            </button>

            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: currentStreak > 0 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
              >
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? "animate-pulse" : ""}`} />
                <span className="font-bold">{currentStreak}</span>
              </motion.div>

              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold">
                {selectedQuiz.level}
              </span>
            </div>
          </div>

          <motion.div layout className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-500 font-medium">
                  Pyetja {currentQuestionIndex + 1} nga {selectedQuiz.questions.length}
                </span>
                <span className="text-cyan-600 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-xl font-semibold text-slate-800 mb-8 leading-relaxed"
                >
                  {currentQuestion.questionText}
                </motion.h2>
              </AnimatePresence>

              {currentQuestion.type === "multiple-choice" && (
                <div className="grid gap-3 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = currentAnswer === option
                    const isSubmitted = submittedAnswer !== undefined
                    const isCorrect = submittedAnswer?.answer === option && submittedAnswer?.isCorrect
                    const isWrong = submittedAnswer?.answer === option && !submittedAnswer?.isCorrect

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                        onClick={() => !isSubmitted && handleAnswer(option)}
                        disabled={isSubmitted}
                        className={`w-full p-4 rounded-2xl text-left transition-all duration-300 flex items-center justify-between ${
                          isCorrect
                            ? "bg-emerald-50 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                            : isWrong
                            ? "bg-red-50 border-2 border-red-400"
                            : isSelected && !isSubmitted
                            ? "bg-cyan-50 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10"
                            : "bg-slate-50 border-2 border-transparent hover:bg-slate-100 hover:border-slate-200"
                        } ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-500"
                                : isWrong
                                ? "border-red-400 bg-red-400"
                                : isSelected && !isSubmitted
                                ? "border-cyan-500 bg-cyan-500"
                                : "border-slate-300"
                            }`}
                          >
                            {isCorrect && <CheckCircle className="w-4 h-4 text-white" />}
                            {isWrong && <XCircle className="w-4 h-4 text-white" />}
                            {isSelected && !isSubmitted && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span
                            className={`font-medium ${
                              isCorrect ? "text-emerald-700" : isWrong ? "text-red-600" : "text-slate-700"
                            }`}
                          >
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === "fill-in" && (
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    value={currentAnswer || ""}
                    onChange={(e) =>
                      !submittedAnswer && setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })
                    }
                    disabled={submittedAnswer !== undefined}
                    placeholder="Shkruani përgjigjen tuaj..."
                    className={`w-full px-4 py-4 text-lg rounded-2xl border-2 transition-all focus:outline-none ${
                      submittedAnswer?.isCorrect
                        ? "border-emerald-500 bg-emerald-50"
                        : submittedAnswer && !submittedAnswer.isCorrect
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200 focus:border-cyan-500"
                    }`}
                  />
                  {!submittedAnswer && currentAnswer && (
                    <button
                      onClick={() => handleAnswer(currentAnswer)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold transition-all"
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
                    className={`w-full px-4 py-4 text-lg rounded-2xl border-2 transition-all focus:outline-none ${
                      submittedAnswer?.isCorrect
                        ? "border-emerald-500 bg-emerald-50"
                        : submittedAnswer && !submittedAnswer.isCorrect
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200 focus:border-cyan-500"
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
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={submitQuiz}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Dërgo Kuizin
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Main quiz list
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 py-8 px-4">
      {NotificationElement}

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Kuizet</h1>
          </div>
          <p className="text-slate-500 mb-8">Zgjidhni një kuiz për të filluar të mësoni</p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {["All", "A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <motion.button
                key={level}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLevel(level)}
                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedLevel === level ? "text-white" : "text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
                }`}
              >
                {selectedLevel === level && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full shadow-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{level === "All" ? "Të gjitha" : level}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {paginatedQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-3xl shadow-sm"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Nuk ka Kuize</h2>
            <p className="text-slate-500">Kontrolloni më vonë për kuize të reja!</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {paginatedQuizzes.map((quiz, index) => {
                const isCompleted = isQuizCompleted(quiz._id)
                const isNew = isNewQuiz(quiz)

                return (
                  <motion.div
                    key={quiz._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startQuiz(quiz)}
                    className="group relative bg-white rounded-2xl p-5 cursor-pointer overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-teal-50/0 group-hover:from-cyan-50/50 group-hover:to-teal-50/30 transition-all duration-500" />

                    <div className="relative flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                        {quiz.level}
                      </span>
                      <div className="flex items-center gap-2">
                        {isNew && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                          >
                            <Sparkles className="w-3 h-3" />
                            E RE
                          </motion.span>
                        )}
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <h3 className="relative text-base font-semibold text-slate-800 mb-4 leading-snug line-clamp-2 group-hover:text-slate-900 transition-colors">
                      {quiz.title}
                    </h3>

                    <div className="relative flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">{quiz.questions?.length || 0} pyetje</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-amber-500">{quiz.xp} XP</span>
                      </div>
                    </div>

                    <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                )
              })}
            </motion.div>

            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3 mt-10"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Mbrapa
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg"
                          : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Para
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}