"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { quizService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import {
  CheckCircle,
  XCircle,
  BookOpen,
  Star,
  Flame,
  ArrowLeft,
  Trophy,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
} from "lucide-react"

const LANGUAGE_LABELS = {
  de: "Gjermanisht",
  en: "Anglisht",
  fr: "Frëngjisht",
  tr: "Turqisht",
  it: "Italisht",
}

function PaywallModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Planet Premium</h2>
            <p className="text-emerald-100 text-sm">Ke përfunduar 5 kuizet falas</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-2xl p-4">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-slate-400">5</div>
                <div className="text-xs text-slate-500 mt-1">Falas</div>
              </div>
              <div className="text-slate-300 text-xl font-light">→</div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-emerald-600">∞</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Premium</div>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {["Kuize të pakufizuara", "Të gjitha nivelet A1-C2", "Ndjekje progresit", "Pa reklama"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/payments"
              className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-center transition-all shadow-lg shadow-emerald-500/25 mb-3"
            >
              Shiko Planet Premium
            </a>
            <button
              onClick={onClose}
              className="block w-full py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
            >
              Tani jo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Quizes() {
  const { language } = useLanguage()

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState(null)
  const [completedQuizzes, setCompletedQuizzes] = useState([])
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [currentPage, setCurrentPage] = useState(1)
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  const [currentStreak, setCurrentStreak] = useState(0)
  const [notification, setNotification] = useState(null)
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [isPaid, setIsPaid] = useState(false)
  const [freeLimit, setFreeLimit] = useState(5)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const itemsPerPage = 20
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  // SEO
  useEffect(() => {
    document.title = "Kuizet Gjermanisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive"

    const setMeta = (name, content, isProperty = false) => {
      let el = document.querySelector(`meta[${isProperty ? "property" : "name"}="${name}"]`)
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(isProperty ? "property" : "name", name)
        document.head.appendChild(el)
      }
      el.content = content
    }

    setMeta("description", "Bëni kuize interaktive gjermane për të testuar njohuritë tuaja. Pyetje të shumëfishta dhe përgjigje me XP. Fillo sot!")
    setMeta("keywords", "kuizet gjermanisht, quiz gjermanisht, test njohurish, A1 A2 B1 B2 C1 C2")
    setMeta("og:title", "Kuizet Gjermanisht - Testo Njohuritë Tuaja", true)
    setMeta("og:description", "Bëni kuize interaktive gjermane për të testuar njohuritë tuaja.", true)
    setMeta("og:url", `${window.location.origin}/quizes`, true)
    setMeta("og:type", "website", true)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}/quizes`

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: "Kuizet Gjermanisht",
      description: "Testoni njohuritë tuaja me kuize interaktive",
      url: `${window.location.origin}/quizes`,
    }
    let sdScript = document.querySelector('script[type="application/ld+json"][data-quizes]')
    if (!sdScript) {
      sdScript = document.createElement("script")
      sdScript.type = "application/ld+json"
      sdScript.setAttribute("data-quizes", "true")
      document.head.appendChild(sdScript)
    }
    sdScript.textContent = JSON.stringify(structuredData)

    return () => {
      const s = document.querySelector('script[type="application/ld+json"][data-quizes]')
      if (s) s.remove()
    }
  }, [])

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

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setNotificationVisible(true)
    setTimeout(() => {
      setNotificationVisible(false)
      setTimeout(() => setNotification(null), 300)
    }, 3000)
  }

  // Re-fetch whenever global language changes
  useEffect(() => {
    loadQuizzes()
    loadCompletedQuizzes()
  }, [language])

  const loadQuizzes = async () => {
    try {
      setIsLoading(true)
      const response = await quizService.getAllQuizzes(language)
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
      const resData = response.data || {}
      setCompletedQuizzes((resData.quizzes || []).map((q) => q._id))
      if (resData.isPaid !== undefined) setIsPaid(resData.isPaid)
      if (resData.freeLimit !== undefined) setFreeLimit(resData.freeLimit)
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

    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }))
    setSubmittedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: { answer, isCorrect } }))
    setCurrentStreak((s) => (isCorrect ? s + 1 : 0))

    setTimeout(() => {
      if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
        setCurrentQuestionIndex((i) => i + 1)
      }
    }, 1000)
  }

  const submitQuiz = async () => {
    try {
      const answersArray = selectedQuiz.questions.map((_, i) => answers[i] || "")
      const response = await quizService.submitQuiz(selectedQuiz._id, answersArray)
      const data = response.data

      if (data.limitReached) {
        setShowPaywall(true)
        return
      }

      setResult(data)
      setShowResult(true)

      if (data.passed) {
        setCompletedQuizzes((prev) => [...prev, selectedQuiz._id])
        if (data.xpEarned > 0) {
          try { await quizService.addQuizXp(data.xpEarned) } catch (e) { console.error(e) }
        }
      }
    } catch (err) {
      setError("Dështoi dërgimi i kuizit")
    }
  }

  const resetQuiz = () => {
    if (result) {
      if (result.passed) {
        showNotification(
          result.xpEarned > 0
            ? `Urime! Kaluat kuizin me ${result.percentage}%! +${result.xpEarned} XP 🎉`
            : `Urime! Kaluat kuizin me ${result.percentage}%!`,
          "success"
        )
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

  useEffect(() => { setCurrentPage(1) }, [selectedLevel, language])

  const filteredQuizzes = selectedLevel === "all" ? quizzes : quizzes.filter((q) => q.level === selectedLevel)
  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const paginatedQuizzes = filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const isNewQuiz = (quiz) => {
    if (!quiz.createdAt) return false
    return (new Date() - new Date(quiz.createdAt)) / (1000 * 60 * 60 * 24) <= 7
  }
  const isQuizCompleted = (id) => completedQuizzes.includes(id)

  // ── Notification ──────────────────────────────────────────────────────────
  const NotificationElement = notification && (
    <AnimatePresence>
      {notificationVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-48">
      {NotificationElement}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
      {NotificationElement}
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Gabim</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => { setError(null); loadQuizzes() }}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all">
          Provo Përsëri
        </button>
      </div>
    </div>
  )

  // ── Result screen ─────────────────────────────────────────────────────────
  if (showResult) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center py-8 px-4">
      {NotificationElement}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center ${
              result.passed
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
            }`}
          >
            {result.passed ? <Trophy className="w-12 h-12 text-white" /> : <Target className="w-12 h-12 text-white" />}
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-slate-800 mb-2">
            {result.passed ? "Urime!" : "Vazhdo të Praktikosh!"}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-slate-500 mb-8">
            {result.passed ? "Shkëlqyeshëm, e kaluat kuizin!" : "Provoni përsëri për rezultat më të mirë"}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-5">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>{result.percentage}%</div>
              <div className="text-sm text-slate-500 font-medium">Rezultati</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5">
              <div className={`text-4xl font-bold mb-1 ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>{result.correctAnswers}/{result.totalQuestions}</div>
              <div className="text-sm text-slate-500 font-medium">Sakta</div>
            </div>
          </motion.div>

          {result.passed && result.xpEarned > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl mb-6">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700">+{result.xpEarned} XP të fituara!</span>
              <span className="text-xl">🎉</span>
            </motion.div>
          )}
          {result.passed && result.xpEarned === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="px-4 py-3 bg-slate-50 rounded-xl mb-6 text-sm text-slate-600">
              E keni përfunduar më parë këtë kuiz. Nuk jepen XP.
            </motion.div>
          )}

          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            onClick={resetQuiz}
            className={`w-full py-4 rounded-2xl font-semibold text-lg text-white transition-all ${
              result.passed
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
            }`}>
            Kthehu te Kuizet
          </motion.button>
        </div>
      </motion.div>
    </div>
  )

  // ── Quiz question screen ───────────────────────────────────────────────────
  if (selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const isLastQuestion = currentQuestionIndex === selectedQuiz.questions.length - 1
    const currentAnswer = answers[currentQuestionIndex]
    const submittedAnswer = submittedAnswers[currentQuestionIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-8 px-4">
        {showPaywall && <PaywallModal onClose={() => { setShowPaywall(false); setSelectedQuiz(null) }} />}
        {NotificationElement}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setSelectedQuiz(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-sm border border-slate-200">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Mbrapa</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? "animate-pulse" : ""}`} />
                <span className="font-bold">{currentStreak}</span>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getLevelColor(selectedQuiz.level)}`}>
                {selectedQuiz.level}
              </span>
              <button
                onClick={submitQuiz}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm border border-red-200 transition-all"
              >
                Përfundo
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-500 font-medium">Pyetja {currentQuestionIndex + 1} nga {selectedQuiz.questions.length}</span>
                <span className="text-emerald-600 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.h2 key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl font-semibold text-slate-800 mb-8 leading-relaxed">
                  {currentQuestion.questionText}
                </motion.h2>
              </AnimatePresence>

              {/* Multiple choice */}
              {currentQuestion.type === "multiple-choice" && (() => {
                const uniqueOptions = [...new Set(currentQuestion.options)]
                const letterMap = ["a", "b", "c", "d"]
                const letterLabels = ["A", "B", "C", "D"]
                return (
                  <div className="grid gap-3 mb-6">
                    {uniqueOptions.map((option, index) => {
                      const optionLetter = letterMap[index]
                      const isSubmitted = submittedAnswer !== undefined
                      const isCorrect = submittedAnswer?.answer === optionLetter && submittedAnswer?.isCorrect
                      const isWrong = submittedAnswer?.answer === optionLetter && !submittedAnswer?.isCorrect
                      const isCorrectAnswer = currentQuestion.correctAnswer === optionLetter
                      const isSelected = currentAnswer === optionLetter
                      const showGreen = isCorrect || (isSubmitted && isCorrectAnswer) || (isSelected && !isSubmitted)

                      return (
                        <motion.button key={index}
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          onClick={() => !isSubmitted && handleAnswer(optionLetter)}
                          disabled={isSubmitted}
                          className={`w-full p-4 rounded-2xl text-left transition-all duration-300 flex items-center gap-4 border-2 ${
                            showGreen ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10"
                              : isWrong ? "bg-red-50 border-red-400"
                              : "bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200"
                          } ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            showGreen ? "border-emerald-500 bg-emerald-500 text-white"
                              : isWrong ? "border-red-400 bg-red-400 text-white"
                              : "border-slate-300 text-slate-500"
                          }`}>
                            {isCorrect || (isSubmitted && isCorrectAnswer) ? <CheckCircle className="w-4 h-4" />
                              : isWrong ? <XCircle className="w-4 h-4" />
                              : letterLabels[index]}
                          </div>
                          <span className={`font-medium ${
                            showGreen ? "text-emerald-700" : isWrong ? "text-red-600" : "text-slate-700"
                          }`}>{option}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Fill in */}
              {currentQuestion.type === "fill-in" && (
                <div className="space-y-4 mb-6">
                  <input type="text" value={currentAnswer || ""}
                    onChange={(e) => !submittedAnswer && setAnswers((p) => ({ ...p, [currentQuestionIndex]: e.target.value }))}
                    disabled={submittedAnswer !== undefined}
                    placeholder="Shkruani përgjigjen tuaj..."
                    className={`w-full px-4 py-4 text-lg rounded-2xl border-2 transition-all focus:outline-none ${
                      submittedAnswer?.isCorrect ? "border-emerald-500 bg-emerald-50"
                        : submittedAnswer && !submittedAnswer.isCorrect ? "border-red-400 bg-red-50"
                        : "border-slate-200 focus:border-emerald-500"
                    }`}
                  />
                  {!submittedAnswer && currentAnswer && (
                    <button onClick={() => handleAnswer(currentAnswer)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all">
                      Kontrollo
                    </button>
                  )}
                </div>
              )}

              {/* Dropdown */}
              {currentQuestion.type === "drop-down" && (
                <div className="mb-6">
                  <select value={currentAnswer || ""}
                    onChange={(e) => !submittedAnswer && handleAnswer(e.target.value)}
                    disabled={submittedAnswer !== undefined}
                    className={`w-full px-4 py-4 text-lg rounded-2xl border-2 transition-all focus:outline-none ${
                      submittedAnswer?.isCorrect ? "border-emerald-500 bg-emerald-50"
                        : submittedAnswer && !submittedAnswer.isCorrect ? "border-red-400 bg-red-50"
                        : "border-slate-200 focus:border-emerald-500"
                    }`}
                  >
                    <option value="">Zgjidhni një përgjigje...</option>
                    {currentQuestion.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              {isLastQuestion && submittedAnswer && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={submitQuiz}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all">
                  Dërgo Kuizin
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Quiz list ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 flex flex-col">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {NotificationElement}
      <div className="max-w-6xl mx-auto w-full">

        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 75%, #93c5fd 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <Target size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Kuizet
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Zgjidhni një kuiz për të filluar të mësoni
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 130 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                  <Trophy size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1, marginBottom: 2 }}>{completedQuizzes.length}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Të Përfunduara</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Level filter — language is driven by the navbar */}
        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Filtro sipas Nivelit</h2>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button key={level} onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md ${
                  selectedLevel === level
                    ? getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}>
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {paginatedQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 inline-block border border-gray-100 shadow-xl">
              <BookOpen className="text-emerald-400 w-12 h-12 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-800 mb-2">Nuk ka Kuize</h3>
              <p className="text-gray-500 text-sm">Kontrolloni më vonë për kuize të reja!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
              {paginatedQuizzes.map((quiz) => {
                const isCompleted = isQuizCompleted(quiz._id)
                const isNew = isNewQuiz(quiz)
                const isLocked = !isCompleted && !isPaid && completedQuizzes.length >= freeLimit
                return (
                  <div key={quiz._id}
                    onClick={() => isLocked ? setShowPaywall(true) : startQuiz(quiz)}
                    className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                      isLocked
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300"
                        : isCompleted
                          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                          : "bg-white border-gray-100 hover:border-emerald-300"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 ${isLocked ? "bg-gray-100 border-gray-200 text-gray-400" : getLevelColor(quiz.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                      {quiz.level}
                    </div>
                    <BookOpen className={`absolute -bottom-4 -right-4 w-20 h-20 ${isLocked ? "text-gray-100" : isCompleted ? "text-amber-100" : "text-gray-100"} transition-transform group-hover:scale-110`} />

                    <div className="relative z-10">
                      {isNew && !isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-500 to-purple-500 text-white mb-2">
                          <Sparkles className="w-3 h-3" />
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-500 mb-2">
                          <Lock className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                      <h3 className={`text-sm font-bold mb-2 pr-14 truncate ${
                        isLocked ? "text-gray-400" : isCompleted ? "text-amber-700 group-hover:text-amber-800" : "text-gray-800 group-hover:text-emerald-700"
                      }`}>
                        {quiz.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isLocked ? "text-gray-400" : isCompleted ? "text-amber-600" : "text-gray-500"}`}>
                        {quiz.questions?.length || 0} pyetje
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs font-medium ${isLocked ? "text-gray-400" : isCompleted ? "text-amber-500" : "text-gray-400"}`}>
                          {LANGUAGE_LABELS[quiz.language] || "Gjermanisht"} • Kuiz
                        </span>
                        <div className="flex items-center gap-2">
                          {!isCompleted && !isLocked && (
                            <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                              <Star className="h-3 w-3" />
                              {quiz.xp}
                            </span>
                          )}
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                            isLocked
                              ? "bg-gray-200 text-gray-400"
                              : isCompleted
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          }`}>
                            {isLocked ? <Crown className="w-3 h-3" /> : isCompleted ? "✓ Kryer" : "Fillo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                  <ChevronLeft className="w-4 h-4" /> Mbrapa
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                          : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200"
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                  Para <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}