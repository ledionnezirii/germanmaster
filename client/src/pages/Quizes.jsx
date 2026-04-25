"use client"

import { useState, useEffect, useRef } from "react"
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
  Zap,
  Check,
  PartyPopper,
} from "lucide-react"

/* ─── Inject quiz animation keyframes once ─────────────────────────── */
const QUIZ_STYLES = `
  @keyframes quizBounce {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    70%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }
  @keyframes quizShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-8px); }
    30%     { transform: translateX(8px); }
    45%     { transform: translateX(-6px); }
    60%     { transform: translateX(6px); }
    75%     { transform: translateX(-3px); }
    90%     { transform: translateX(3px); }
  }
  .quiz-answer-correct { animation: quizBounce 0.4s cubic-bezier(.34,1.56,.64,1); }
  .quiz-answer-wrong   { animation: quizShake 0.45s ease; }
`

if (typeof document !== "undefined" && !document.getElementById("quiz-anim-styles")) {
  const tag = document.createElement("style")
  tag.id = "quiz-anim-styles"
  tag.textContent = QUIZ_STYLES
  document.head.appendChild(tag)
}

/* ─── Constants ─────────────────────────────────────────────────────── */
const LANGUAGE_LABELS = {
  de: "Gjermanisht",
  en: "Anglisht",
  fr: "Frëngjisht",
  tr: "Turqisht",
  it: "Italisht",
}
const LETTER_MAP    = ["a", "b", "c", "d"]
const LETTER_LABELS = ["A", "B", "C", "D"]

/* ─── PaywallModal (unchanged) ──────────────────────────────────────── */
function PaywallModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
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
              {["Kuize të pakufizuara", "Të gjitha nivelet A1-C2", "Ndjekje progresit", "Pa reklama"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <a href="/payments"
              className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl text-center transition-all shadow-lg shadow-emerald-500/25 mb-3">
              Shiko Planet Premium
            </a>
            <button onClick={onClose}
              className="block w-full py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
              Tani jo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── StreakDot ──────────────────────────────────────────────────────── */
function StreakDot({ state }) {
  const base = { width: 20, height: 20, borderRadius: "50%", transition: "all 0.3s", flexShrink: 0 }
  if (state === "correct") return <div style={{ ...base, background: "#22c55e", boxShadow: "0 0 10px rgba(34,197,94,0.5)" }} />
  if (state === "wrong")   return <div style={{ ...base, background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }} />
  if (state === "current") return <div style={{ ...base, background: "#facc15", boxShadow: "0 0 12px rgba(250,204,21,0.7)", animation: "pulse 1s infinite" }} />
  return <div style={{ ...base, background: "#e2e8f0", border: "2px solid #cbd5e1" }} />
}

/* ─── AnswerButton ───────────────────────────────────────────────────── */
function AnswerButton({ label, text, state, disabled, onClick }) {
  // state: "idle" | "correct" | "wrong" | "reveal"
  const styles = {
    idle:    { border: "2px solid #e2e8f0", background: "#f8fafc", color: "#1e293b" },
    correct: { border: "2px solid #22c55e", background: "rgba(34,197,94,0.08)", color: "#15803d" },
    wrong:   { border: "2px solid #ef4444", background: "rgba(239,68,68,0.08)", color: "#b91c1c" },
    reveal:  { border: "2px solid #22c55e", background: "rgba(34,197,94,0.06)", color: "#15803d" },
  }[state]

  const keyStyles = {
    idle:    { background: "rgba(0,0,0,0.06)", color: "#64748b" },
    correct: { background: "#22c55e", color: "white" },
    wrong:   { background: "#ef4444", color: "white" },
    reveal:  { background: "#22c55e", color: "white" },
  }[state]

  const animClass = state === "correct" ? "quiz-answer-correct" : state === "wrong" ? "quiz-answer-wrong" : ""

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={animClass}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", borderRadius: 16,
        fontFamily: "inherit", fontSize: 15, fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left", width: "100%",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s",
        ...styles,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)" } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}
    >
      <span style={{
        minWidth: 32, height: 32, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, flexShrink: 0,
        ...keyStyles,
      }}>
        {state === "correct" || state === "reveal" ? <Check size={14} /> : state === "wrong" ? <XCircle size={14} /> : label}
      </span>
      {text}
    </button>
  )
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function Quizes() {
  const { language } = useLanguage()

  const [quizzes, setQuizzes]                     = useState([])
  const [selectedQuiz, setSelectedQuiz]           = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers]                     = useState({})
  const [isLoading, setIsLoading]                 = useState(true)
  const [result, setResult]                       = useState(null)
  const [showResult, setShowResult]               = useState(false)
  const [error, setError]                         = useState(null)
  const [completedQuizzes, setCompletedQuizzes]   = useState([])
  const [selectedLevel, setSelectedLevel]         = useState("A1")
  const [currentPage, setCurrentPage]             = useState(1)
  const [submittedAnswers, setSubmittedAnswers]   = useState({})
  const [currentStreak, setCurrentStreak]         = useState(0)
  const [score, setScore]                         = useState(0)
  const [history, setHistory]                     = useState([])   // true/false per question
  const [notification, setNotification]           = useState(null)
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [isMobile, setIsMobile]                   = useState(window.innerWidth < 640)
  const [isPaid, setIsPaid]                       = useState(false)
  const [freeLimit, setFreeLimit]                 = useState(5)
  const [showPaywall, setShowPaywall]             = useState(false)
  const [completedQuizzesData, setCompletedQuizzesData] = useState([])
  const [showMixedQuizInfo, setShowMixedQuizInfo] = useState(false)
  const [comboVisible, setComboVisible]           = useState(false)
  const [comboText, setComboText]                 = useState("")
  const comboTimerRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const itemsPerPage = 20
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  /* SEO */
  const SEO_BY_LANG = {
    de: {
      title: "Kuizet Gjermanisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive",
      description: "Bëni kuize interaktive gjermane për të testuar njohuritë tuaja. Pyetje të shumëfishta me përgjigje dhe XP. Fillo sot!",
      keywords: "kuizet gjermanisht, quiz gjermanisht, test njohurish gjermanisht, A1 A2 B1 B2 C1 C2",
      sdName: "Kuizet Gjermanisht",
    },
    en: {
      title: "Kuizet Anglisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive",
      description: "Bëni kuize interaktive angleze për të testuar njohuritë tuaja. Pyetje të shumëfishta me përgjigje dhe XP. Fillo sot!",
      keywords: "kuizet anglisht, quiz anglisht, test njohurish anglisht, A1 A2 B1 B2 C1 C2",
      sdName: "Kuizet Anglisht",
    },
    fr: {
      title: "Kuizet Frëngjisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive",
      description: "Bëni kuize interaktive frënge për të testuar njohuritë tuaja. Pyetje të shumëfishta me përgjigje dhe XP. Fillo sot!",
      keywords: "kuizet frëngjisht, quiz frëngjisht, test njohurish frëngjisht, A1 A2 B1 B2 C1 C2",
      sdName: "Kuizet Frëngjisht",
    },
    tr: {
      title: "Kuizet Turqisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive",
      description: "Bëni kuize interaktive turke për të testuar njohuritë tuaja. Pyetje të shumëfishta me përgjigje dhe XP. Fillo sot!",
      keywords: "kuizet turqisht, quiz turqisht, test njohurish turqisht, A1 A2 B1 B2 C1 C2",
      sdName: "Kuizet Turqisht",
    },
    it: {
      title: "Kuizet Italisht - Testo Njohuritë Tuaja | Pyetje dhe Përgjigje Interaktive",
      description: "Bëni kuize interaktive italiane për të testuar njohuritë tuaja. Pyetje të shumëfishta me përgjigje dhe XP. Fillo sot!",
      keywords: "kuizet italisht, quiz italisht, test njohurish italisht, A1 A2 B1 B2 C1 C2",
      sdName: "Kuizet Italisht",
    },
  }

  useEffect(() => {
    const seo = SEO_BY_LANG[language] || SEO_BY_LANG.de
    document.title = seo.title
    const setMeta = (name, content, isProperty = false) => {
      let el = document.querySelector(`meta[${isProperty ? "property" : "name"}="${name}"]`)
      if (!el) { el = document.createElement("meta"); el.setAttribute(isProperty ? "property" : "name", name); document.head.appendChild(el) }
      el.content = content
    }
    setMeta("description", seo.description)
    setMeta("keywords", seo.keywords)
    setMeta("og:title", seo.title, true)
    setMeta("og:description", seo.description, true)
    setMeta("og:url", `${window.location.origin}/quizes`, true)
    setMeta("og:type", "website", true)
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical) }
    canonical.href = `${window.location.origin}/quizes`
    const structuredData = { "@context": "https://schema.org", "@type": "Quiz", name: seo.sdName, description: "Testoni njohuritë tuaja me kuize interaktive", url: `${window.location.origin}/quizes` }
    let sdScript = document.querySelector('script[type="application/ld+json"][data-quizes]')
    if (!sdScript) { sdScript = document.createElement("script"); sdScript.type = "application/ld+json"; sdScript.setAttribute("data-quizes", "true"); document.head.appendChild(sdScript) }
    sdScript.textContent = JSON.stringify(structuredData)
    return () => { const s = document.querySelector('script[type="application/ld+json"][data-quizes]'); if (s) s.remove() }
  }, [language])

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
    setNotification({ message, type }); setNotificationVisible(true)
    setTimeout(() => { setNotificationVisible(false); setTimeout(() => setNotification(null), 300) }, 3000)
  }

  useEffect(() => { loadQuizzes(); loadCompletedQuizzes() }, [language])

  const handleOpenMixedQuiz = () => {
    if (!isPaid) { setShowPaywall(true); return }
    if (completedQuizzesData.length < 2) { setShowMixedQuizInfo(true); return }
    const allQuestions = completedQuizzesData.flatMap(q => q.questions || [])
    const mixed = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 10)
    startQuiz({ _id: "mixed", title: "Kuiz me të Perziera", level: "MIX", questions: mixed, xp: 0, isMixed: true })
  }

  const loadQuizzes = async () => {
    try { setIsLoading(true); const r = await quizService.getAllQuizzes(language); setQuizzes(r.data || []) }
    catch { setError("Dështoi ngarkimi i kuizeve") }
    finally { setIsLoading(false) }
  }

  const loadCompletedQuizzes = async () => {
    try {
      const r = await quizService.getCompletedQuizzes()
      const d = r.data || {}; const q = d.quizzes || []
      setCompletedQuizzes(q.map(x => x._id)); setCompletedQuizzesData(q)
      if (d.isPaid !== undefined) setIsPaid(d.isPaid)
      if (d.freeLimit !== undefined) setFreeLimit(d.freeLimit)
    } catch { console.log("Nuk mundëm të ngarkohen kuizet e përfunduara") }
  }

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz); setCurrentQuestionIndex(0); setAnswers({})
    setShowResult(false); setResult(null); setSubmittedAnswers({})
    setCurrentStreak(0); setScore(0); setHistory([])
  }

  const triggerCombo = (streak, xpGained) => {
    setComboText(`${streak} Rreshte Saktë!`)
    setComboVisible(true)
    clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setComboVisible(false), 2200)
  }

  const handleAnswer = (answer) => {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer
    const xpPerQ = Math.round((selectedQuiz.xp || 0) / Math.max(selectedQuiz.questions.length, 1))
    const isLast = currentQuestionIndex === selectedQuiz.questions.length - 1

    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }))
    setSubmittedAnswers(prev => ({ ...prev, [currentQuestionIndex]: { answer, isCorrect } }))

    const newStreak = isCorrect ? currentStreak + 1 : 0
    setCurrentStreak(newStreak)
    setHistory(prev => { const n = [...prev]; n[currentQuestionIndex] = isCorrect; return n })

    if (isCorrect) {
      const gained = newStreak > 2 ? xpPerQ * 2 : xpPerQ
      setScore(s => s + gained)
      if (newStreak > 2) triggerCombo(newStreak, gained)
    }

    setTimeout(() => {
      if (!isLast) {
        setCurrentQuestionIndex(i => i + 1)
      } else {
        submitQuiz()
      }
    }, 1000)
  }

  const submitQuiz = async () => {
    try {
      const answersArray = selectedQuiz.questions.map((_, i) => answers[i] || "")
      const response = await quizService.submitQuiz(selectedQuiz._id, answersArray)
      const data = response.data
      if (data.limitReached) { setShowPaywall(true); return }
      setResult(data); setShowResult(true)
      if (data.passed) {
        setCompletedQuizzes(prev => [...prev, selectedQuiz._id])
        if (data.xpEarned > 0) { try { await quizService.addQuizXp(data.xpEarned) } catch(e) { console.error(e) } }
      }
    } catch { setError("Dështoi dërgimi i kuizit") }
  }

  const resetQuiz = () => {
    setSelectedQuiz(null); setCurrentQuestionIndex(0); setAnswers({})
    setShowResult(false); setResult(null); setSubmittedAnswers({})
    setCurrentStreak(0); setScore(0); setHistory([])
  }

  useEffect(() => { setCurrentPage(1) }, [selectedLevel, language])

  const filteredQuizzes  = selectedLevel === "all" ? quizzes : quizzes.filter(q => q.level === selectedLevel)
  const totalPages       = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const paginatedQuizzes = filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const isNewQuiz        = (quiz) => quiz.createdAt && (new Date() - new Date(quiz.createdAt)) / (1000 * 60 * 60 * 24) <= 7
  const isQuizCompleted  = (id) => completedQuizzes.includes(id)

  /* ── Notification ── */
  const NotificationElement = notification && (
    <AnimatePresence>
      {notificationVisible && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl font-medium text-sm shadow-2xl z-50 flex items-center gap-3 ${
            notification.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
          }`}>
          {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  /* ── Loading ── */
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-48">
      {NotificationElement}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
    </div>
  )

  /* ── Error ── */
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

  /* ── Result screen ── */
  if (showResult) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center py-8 px-4">
      {NotificationElement}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center ${
              result.passed ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
            }`}>
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
              <PartyPopper className="w-5 h-5 text-amber-500" />
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

  /* ── Quiz question screen ──────────────────────────────────────────── */
  if (selectedQuiz) {
    const currentQuestion  = selectedQuiz.questions[currentQuestionIndex]
    const progress         = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const isLastQuestion   = currentQuestionIndex === selectedQuiz.questions.length - 1
    const currentAnswer    = answers[currentQuestionIndex]
    const submittedAnswer  = submittedAnswers[currentQuestionIndex]
    const isSubmitted      = submittedAnswer !== undefined
    const isCorrect        = isSubmitted && submittedAnswer.isCorrect
    const totalQ           = selectedQuiz.questions.length

    return (
      <div style={{
        minHeight: "100vh",
        background: "#f8f9fc",
        backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(249,115,22,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(20,184,166,0.05) 0%, transparent 60%)",
        padding: isMobile ? "16px 12px" : "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {showPaywall && <PaywallModal onClose={() => { setShowPaywall(false); setSelectedQuiz(null) }} />}
        {NotificationElement}

        {/* Combo toast */}
        <div style={{ position: "fixed", top: 72, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}>
          <motion.div
            initial={false}
            animate={{ y: comboVisible ? 0 : -80, opacity: comboVisible ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{
              background: "linear-gradient(135deg, #f97316, #fbbf24)",
              color: "white", padding: isMobile ? "8px 20px" : "10px 28px", borderRadius: 99,
              fontWeight: 800, fontSize: isMobile ? 14 : 17,
              boxShadow: "0 8px 30px rgba(249,115,22,0.4)",
              display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            }}>
            <Flame size={isMobile ? 15 : 18} />{comboText}
          </motion.div>
        </div>

        <div style={{ width: "100%", maxWidth: 660 }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 16 : 24 }}>
            <button onClick={() => setSelectedQuiz(null)} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "white", border: "1px solid #e2e8f0", color: "#64748b",
              padding: isMobile ? "7px 10px" : "8px 16px", borderRadius: 12, fontFamily: "inherit",
              fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: "pointer",
            }}>
              <ArrowLeft size={15} /> {!isMobile && "Mbrapa"}
            </button>
            <div style={{ flex: 1 }} />
            <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${getLevelColor(selectedQuiz.level)}`}>
              {selectedQuiz.level}
            </span>
            <button onClick={submitQuiz} style={{
              background: "transparent", border: "2px solid #e2e8f0", color: "#94a3b8",
              padding: isMobile ? "7px 10px" : "8px 14px", borderRadius: 12, fontFamily: "inherit",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              Përfundo
            </button>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: "#64748b" }}>Pyetja {currentQuestionIndex + 1} nga {totalQ}</span>
              <span style={{ color: "#14b8a6" }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ height: "100%", background: "linear-gradient(90deg, #14b8a6, #34d399)", borderRadius: 99 }}
              />
            </div>
          </div>

          {/* Streak dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 6 : 8, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
            {Array.from({ length: totalQ }, (_, i) => (
              <StreakDot key={i} state={history[i] === true ? "correct" : history[i] === false ? "wrong" : i === currentQuestionIndex ? "current" : "idle"} />
            ))}
          </div>

          {/* Question card */}
          <div style={{
            background: "white", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: isMobile ? 18 : 24,
            padding: isMobile ? "20px 16px 24px" : "32px 36px 36px",
            marginBottom: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #14b8a6, #f97316)",
            }} />

            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              PYETJA {String(currentQuestionIndex + 1).padStart(2, "0")}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentQuestionIndex}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: "#1e293b", lineHeight: 1.4, marginBottom: isMobile ? 20 : 28 }}>
                {currentQuestion.questionText}
              </motion.div>
            </AnimatePresence>

            {/* Multiple choice — 1-col on mobile, 2-col on desktop */}
            {currentQuestion.type === "multiple-choice" && (() => {
              const uniqueOptions = [...new Set(currentQuestion.options)]
              return (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12 }}>
                  {uniqueOptions.map((option, index) => {
                    const optionLetter = LETTER_MAP[index]
                    const wasSelected  = submittedAnswer?.answer === optionLetter
                    const isThisCorrect = currentQuestion.correctAnswer === optionLetter
                    let state = "idle"
                    if (isSubmitted) {
                      if (wasSelected && submittedAnswer.isCorrect)  state = "correct"
                      else if (wasSelected && !submittedAnswer.isCorrect) state = "wrong"
                      else if (isThisCorrect) state = "reveal"
                    }
                    return (
                      <AnswerButton key={index}
                        label={LETTER_LABELS[index]} text={option} state={state}
                        disabled={isSubmitted}
                        onClick={() => handleAnswer(optionLetter)}
                      />
                    )
                  })}
                </div>
              )
            })()}

            {/* Fill-in */}
            {currentQuestion.type === "fill-in" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="text" value={currentAnswer || ""}
                  onChange={e => !isSubmitted && setAnswers(p => ({ ...p, [currentQuestionIndex]: e.target.value }))}
                  disabled={isSubmitted}
                  placeholder="Shkruani përgjigjen tuaj..."
                  style={{
                    padding: "14px 16px", fontSize: 15, borderRadius: 14, fontFamily: "inherit",
                    border: `2px solid ${isSubmitted ? (submittedAnswer?.isCorrect ? "#22c55e" : "#ef4444") : "#e2e8f0"}`,
                    background: isSubmitted ? (submittedAnswer?.isCorrect ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)") : "white",
                    outline: "none",
                  }}
                />
                {!isSubmitted && currentAnswer && (
                  <button onClick={() => handleAnswer(currentAnswer)} style={{
                    padding: "12px", borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #14b8a6, #22c55e)", color: "white",
                    fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  }}>Kontrollo</button>
                )}
              </div>
            )}

            {/* Dropdown */}
            {currentQuestion.type === "drop-down" && (
              <select value={currentAnswer || ""}
                onChange={e => !isSubmitted && handleAnswer(e.target.value)}
                disabled={isSubmitted}
                style={{
                  width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 14, fontFamily: "inherit",
                  border: `2px solid ${isSubmitted ? (submittedAnswer?.isCorrect ? "#22c55e" : "#ef4444") : "#e2e8f0"}`,
                  background: isSubmitted ? (submittedAnswer?.isCorrect ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)") : "white",
                  outline: "none",
                }}>
                <option value="">Zgjidhni një përgjigje...</option>
                {currentQuestion.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            )}
          </div>

          {/* Feedback bar */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
                  padding: isMobile ? "14px 14px" : "16px 20px", borderRadius: 16,
                  border: `2px solid ${isCorrect ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                  background: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  marginBottom: 12,
                }}>
                <div style={{ color: isCorrect ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
                  {isCorrect ? <CheckCircle size={22} /> : <XCircle size={22} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isCorrect ? "#16a34a" : "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                    {isCorrect ? "Saktë!" : "Gabim!"}
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: isCorrect ? "#15803d" : "#b91c1c", wordBreak: "break-word" }}>
                    {isCorrect
                      ? ["Shkëlqyeshëm!", "Bravo!", "E saktë!", "Vazhdoni kështu!"][currentQuestionIndex % 4]
                      : `Përgjigja: "${currentQuestion.options[LETTER_MAP.indexOf(currentQuestion.correctAnswer)]}"`}
                  </div>
                </div>
                {isLastQuestion && (
                  <button onClick={submitQuiz} style={{
                    background: "#f97316", border: "none", color: "white",
                    padding: isMobile ? "9px 14px" : "10px 20px", borderRadius: 12, fontFamily: "inherit",
                    fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  }}>
                    <Trophy size={14} /> Dërgo
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    )
  }

  /* ── Quiz list ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen p-4 flex flex-col">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {NotificationElement}

      <AnimatePresence>
        {showMixedQuizInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowMixedQuizInfo(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 flex items-center justify-center mx-auto mb-5">
                <Zap className="h-10 w-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Kuiz me të Perziera</h2>
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                Duhen të paktën <span className="font-bold text-blue-600">2 kuize</span> të përfunduara.
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((completedQuizzesData.length / 2) * 100, 100)}%` }} />
              </div>
              <button onClick={() => setShowMixedQuizInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg border-none cursor-pointer">
                Kuptova!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div style={{
            display: "flex", flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start", justifyContent: "space-between", gap: 24,
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 75%, #93c5fd 100%)",
            borderRadius: 20, padding: isMobile ? "20px" : "28px 32px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <Target size={14} /> Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>Kuizet</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>Zgjidhni një kuiz për të filluar të mësoni</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              {(() => {
                const canQuiz = completedQuizzesData.length >= 2
                const mixedLocked = !isPaid
                return (
                  <button onClick={handleOpenMixedQuiz} style={{
                    background: mixedLocked ? "rgba(0,0,0,0.2)" : canQuiz ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                    border: `1px solid ${mixedLocked ? "rgba(255,255,255,0.15)" : canQuiz ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", flex: isMobile ? 1 : "unset", transition: "background 0.2s",
                    opacity: mixedLocked ? 0.7 : canQuiz ? 1 : 0.6,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                      {mixedLocked ? <Crown size={16} color="rgba(255,215,0,0.9)" /> : canQuiz ? <Zap size={16} color="#fff" /> : <Lock size={16} color="rgba(255,255,255,0.7)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 2 }}>Kuiz me të Perziera</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                        {mixedLocked ? "Premium" : canQuiz ? "Fillo tani" : `${completedQuizzesData.length}/2 kuize`}
                      </div>
                    </div>
                  </button>
                )
              })()}
            </div>
          </div>
        </header>

        {/* Level filter */}
        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Filtro sipas Nivelit</h2>
          <div className="flex flex-wrap gap-2">
            {levels.map(level => (
              <button key={level} onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md ${
                  selectedLevel === level ? getLevelColor(level) + " border-2" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
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
              {paginatedQuizzes.map(quiz => {
                const isCompleted = isQuizCompleted(quiz._id)
                const isNew       = isNewQuiz(quiz)
                const isLocked    = !isCompleted && !isPaid && completedQuizzes.length >= freeLimit
                return (
                  <div key={quiz._id}
                    onClick={() => isLocked ? setShowPaywall(true) : startQuiz(quiz)}
                    className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                      isLocked ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300" : "bg-white border-gray-100 hover:border-emerald-300"
                    }`}>
                    <div className={`absolute top-3 right-3 ${isLocked ? "bg-gray-100 border-gray-200 text-gray-400" : getLevelColor(quiz.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                      {quiz.level}
                    </div>
                    <BookOpen className="absolute -bottom-4 -right-4 w-20 h-20 text-gray-100 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                      {isNew && !isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-500 to-purple-500 text-white mb-2">
                          <Sparkles className="w-3 h-3" />
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-500 mb-2">
                          <Lock className="w-3 h-3" /> Premium
                        </span>
                      )}
                      <h3 className={`text-sm font-bold mb-2 pr-14 truncate ${isLocked ? "text-gray-400" : "text-gray-800 group-hover:text-emerald-700"}`}>
                        {quiz.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
                        {quiz.questions?.length || 0} pyetje
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-400">
                          {LANGUAGE_LABELS[quiz.language] || "Gjermanisht"} • Kuiz
                        </span>
                        <div className="flex items-center gap-2">
                          {!isCompleted && !isLocked && (
                            <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                              <Star className="h-3 w-3" />{quiz.xp}
                            </span>
                          )}
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1 ${
                            isLocked ? "bg-gray-200 text-gray-400"
                              : isCompleted ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          }`}>
                            {isLocked ? <Crown className="w-3 h-3" /> : isCompleted ? <><Check className="w-3 h-3" /> Kryer</> : "Fillo"}
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
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                  <ChevronLeft className="w-4 h-4" /> Mbrapa
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                        currentPage === page ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200"
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
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
