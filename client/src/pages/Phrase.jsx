"use client"
import { useState, useEffect, useRef } from "react"
import { phraseService, ttsService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight, LockIcon, Plus, Eye, EyeOff, Clock, Sparkles, Check, Trophy, RotateCcw, X, Crown, Zap, Headphones, Play, Pause, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SEO from "../components/SEO"

const FREE_DAILY_LIMIT = 2
const PAID_DAILY_LIMIT = 10

const LANGUAGES = [
  { code: "de", flag: "https://flagcdn.com/w40/de.png", label: "Gjermanisht" },
  { code: "en", flag: "https://flagcdn.com/w40/gb.png", label: "Anglisht" },
]
const ALBANIAN_FLAG = "https://flagcdn.com/w40/al.png"

function PaywallModal({ onClose, hoursUntilReset, minutesUntilReset }) {
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
          className="bg-white rounded-3xl shadow-2xl border-2 border-orange-100 p-8 max-w-sm w-full text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Limiti Ditor i Arritur</h2>
          <p className="text-gray-500 text-sm mb-1 leading-relaxed">
            Plani falas lejon vetëm <span className="font-bold text-orange-500">2 fraza</span> në ditë.
          </p>
          <p className="text-gray-400 text-xs mb-1 leading-relaxed">
            Me <span className="font-bold text-amber-500">Premium</span> hap deri në <span className="font-bold text-amber-500">10 fraza</span> çdo ditë.
          </p>
          {(hoursUntilReset > 0 || minutesUntilReset > 0) && (
            <p className="text-gray-400 text-xs mb-5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Riset pas {hoursUntilReset}h {minutesUntilReset}min
            </p>
          )}
          {!(hoursUntilReset > 0 || minutesUntilReset > 0) && <div className="mb-5" />}
          <button
            onClick={() => { window.location.href = "/payments" }}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all border-none cursor-pointer mb-3"
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

const WAVE_HEIGHTS = [5, 10, 18, 13, 22, 14, 24, 9, 20, 12, 17, 7, 21, 11, 9]
const LETTERS = ["A", "B", "C", "D"]

const Phrase = () => {
  const fonts = {
    poppins: ["Poppins", "sans-serif"].join(", "),
    inter: ["Inter", "sans-serif"].join(", "),
  }

  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const [phrases, setPhrases] = useState([])
  const [finishedPhraseIds, setFinishedPhraseIds] = useState([])
  const [progress, setProgress] = useState({ totalPhrases: 0, finishedPhrases: 0, percentage: 0 })
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [animatedXp, setAnimatedXp] = useState(0)
  const [xpPosition, setXpPosition] = useState({ x: 0, y: 0 })
  const [showGerman, setShowGerman] = useState(true)
  const [showAlbanian, setShowAlbanian] = useState(true)

  // ── Regular (matching) quiz state ─────────────────────────────────────────
  const [quizMode, setQuizMode] = useState(false)
  const [quizPhrases, setQuizPhrases] = useState([])
  const [selectedGerman, setSelectedGerman] = useState(null)
  const [selectedAlbanian, setSelectedAlbanian] = useState(null)
  const [matches, setMatches] = useState({})
  const [shuffledAlbanian, setShuffledAlbanian] = useState([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [wrongPair, setWrongPair] = useState(null)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)

  const [playingPhraseId, setPlayingPhraseId] = useState(null)
  const audioRef = useRef(null)
  const listenAudioRef = useRef(null)

  // ── Listen Quiz state ──────────────────────────────────────────────────────
  const [listenQuizMode, setListenQuizMode] = useState(false)
  const [listenPhrases, setListenPhrases] = useState([])
  const [listenIdx, setListenIdx] = useState(0)
  const [listenOptions, setListenOptions] = useState([])
  const [listenSelected, setListenSelected] = useState(null)
  const [listenScore, setListenScore] = useState(0)
  const [listenComplete, setListenComplete] = useState(false)
  const [listenPlaying, setListenPlaying] = useState(false)

  const itemsPerPage = 30

  const [dailyLimitInfo, setDailyLimitInfo] = useState({
    dailyLimit: FREE_DAILY_LIMIT,
    dailyUnlocksUsed: 0,
    remainingUnlocks: FREE_DAILY_LIMIT,
    dailyLimitReached: false,
    hoursUntilReset: 0,
    minutesUntilReset: 0,
    isPaid: false,
  })
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const levelTextSizes = {
    A1: { german: "text-lg sm:text-xl", albanian: "text-sm sm:text-base" },
    A2: { german: "text-base sm:text-lg", albanian: "text-sm sm:text-base" },
    B1: { german: "text-sm sm:text-base", albanian: "text-xs sm:text-sm" },
    B2: { german: "text-sm sm:text-base", albanian: "text-xs sm:text-sm" },
    C1: { german: "text-xs sm:text-sm", albanian: "text-[11px] sm:text-xs" },
    C2: { german: "text-xs sm:text-sm", albanian: "text-[11px] sm:text-xs" },
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      setLoading(false)
      setError("Ju lutem identifikohuni për të parë frazat")
    }
  }, [selectedLevel, isAuthenticated, language])

  useEffect(() => { setCurrentPage(1) }, [selectedLevel])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src && audioRef.current.src.startsWith("blob:")) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchPhrases(), fetchFinishedPhrases(), fetchProgress()])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Nuk mund të ngarkohen frazat. Ju lutem provoni përsëri më vonë.")
    } finally {
      setLoading(false)
    }
  }

  const fetchPhrases = async () => {
    try {
      const response = await phraseService.getPhrasesByLevel(selectedLevel, { limit: 500 }, language)
      setPhrases(response.data || [])
    } catch (error) {
      console.error("Error fetching phrases:", error)
      setPhrases([])
    }
  }

  const fetchFinishedPhrases = async () => {
    try {
      const response = await phraseService.getFinishedPhrases()
      const finishedIds = (response.data || []).map((phrase) => phrase._id || phrase.id)
      setFinishedPhraseIds(finishedIds)
    } catch (error) {
      console.error("Error fetching finished phrases:", error)
      setFinishedPhraseIds([])
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await phraseService.getUserPhraseProgress(selectedLevel)
      const data = response.data || { totalPhrases: 0, finishedPhrases: 0, percentage: 0 }
      setProgress(data)
      if (data.dailyLimit !== undefined) {
        setDailyLimitInfo({
          dailyLimit: data.dailyLimit,
          dailyUnlocksUsed: data.dailyUnlocksUsed,
          remainingUnlocks: data.remainingUnlocks,
          dailyLimitReached: data.dailyLimitReached,
          hoursUntilReset: data.hoursUntilReset,
          minutesUntilReset: data.minutesUntilReset,
          isPaid: data.isPaid || false,
        })
      }
    } catch (error) {
      console.error("Error fetching progress:", error)
      setProgress({ totalPhrases: 0, finishedPhrases: 0, percentage: 0 })
    }
  }

  const handleMarkAsFinished = async (phraseId, xp, event) => {
    if (finishedPhraseIds.includes(phraseId)) return
    if (dailyLimitInfo.dailyLimitReached) {
      setShowPaywallModal(true)
      return
    }
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    setXpPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    try {
      const response = await phraseService.markPhraseAsFinished(phraseId)
      setFinishedPhraseIds((prev) => [...prev, phraseId])
      if (response.data) {
        setDailyLimitInfo((prev) => ({
          ...prev,
          dailyUnlocksUsed: response.data.dailyUnlocksUsed,
          remainingUnlocks: response.data.remainingUnlocks,
          dailyLimit: response.data.dailyLimit || prev.dailyLimit,
          dailyLimitReached: response.data.remainingUnlocks <= 0,
          isPaid: response.data.isPaid ?? prev.isPaid,
        }))
      }
      setAnimatedXp(xp)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)
      await fetchProgress()
    } catch (error) {
      console.error("Error marking phrase:", error)
      if (error.response?.status === 429 && error.response?.data?.dailyLimitReached) {
        setDailyLimitInfo((prev) => ({
          ...prev,
          dailyUnlocksUsed: error.response.data.dailyLimit || prev.dailyLimit,
          remainingUnlocks: 0,
          dailyLimitReached: true,
          hoursUntilReset: error.response.data.hoursUntilReset,
          minutesUntilReset: error.response.data.minutesUntilReset,
        }))
        setShowPaywallModal(true)
      } else {
        alert("Nuk mund të përditësohet statusi i frazës. Ju lutem provoni përsëri.")
      }
    }
  }

  // ── Regular matching quiz ──────────────────────────────────────────────────
  const startQuiz = () => {
    if (!dailyLimitInfo.isPaid) {
      setShowPaywallModal(true)
      return
    }
    const finishedPhrases = phrases.filter((phrase) => finishedPhraseIds.includes(phrase._id || phrase.id))
    if (finishedPhrases.length === 0) {
      alert("Përfundoni disa fraza para se të filloni kuizin!")
      return
    }
    const quizSize = Math.min(10, finishedPhrases.length)
    const selectedPhrases = finishedPhrases.sort(() => Math.random() - 0.5).slice(0, quizSize)
    const shuffled = [...selectedPhrases].sort(() => Math.random() - 0.5)
    setShuffledAlbanian(shuffled)
    setQuizPhrases(selectedPhrases)
    setMatches({})
    setSelectedGerman(null)
    setSelectedAlbanian(null)
    setWrongPair(null)
    setQuizComplete(false)
    setQuizScore(0)
    setStreak(0)
    setMaxStreak(0)
    setWrongCount(0)
    setQuizMode(true)
  }

  const handleMatchClick = (germanId, albanianId) => {
    const isCorrectMatch = germanId === albanianId
    if (isCorrectMatch) {
      const newMatches = { ...matches, [germanId]: albanianId }
      const newStreak = streak + 1
      setMatches(newMatches)
      setStreak(newStreak)
      setMaxStreak((prev) => Math.max(prev, newStreak))
      setSelectedGerman(null)
      setSelectedAlbanian(null)
      setWrongPair(null)
      if (Object.keys(newMatches).length === quizPhrases.length) {
        finishQuiz(newMatches)
      } else {
        setQuizScore((prev) => prev + 1)
      }
    } else {
      setStreak(0)
      setWrongCount((prev) => prev + 1)
      setWrongPair({ german: germanId, albanian: albanianId })
      setTimeout(() => {
        setWrongPair(null)
        setSelectedGerman(null)
        setSelectedAlbanian(null)
      }, 700)
    }
  }

  const finishQuiz = async (finalMatches) => {
    setQuizComplete(true)
    const totalXp = Object.keys(finalMatches || matches).length * 1
    try {
      await phraseService.addQuizXp(totalXp)
    } catch (error) {
      console.error("Error submitting quiz XP:", error)
    }
    setAnimatedXp(totalXp)
    setShowXpAnimation(true)
    setTimeout(() => setShowXpAnimation(false), 2000)
  }

  const exitQuiz = () => {
    setQuizMode(false)
    setQuizComplete(false)
    setMatches({})
    setQuizScore(0)
    setSelectedGerman(null)
    setSelectedAlbanian(null)
    setWrongPair(null)
    setStreak(0)
    setMaxStreak(0)
    setWrongCount(0)
  }

  // ── Listen Quiz (Dictionary design) ───────────────────────────────────────
  const buildListenOptions = (correct, pool) => {
    const others = pool.filter((p) => (p._id || p.id) !== (correct._id || correct.id))
    const wrong = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
    return [...wrong, correct].sort(() => Math.random() - 0.5)
  }

  const playListenAudio = async (phrase) => {
    if (!phrase) return
    try {
      setListenPlaying(true)
      const phraseId = phrase._id || phrase.id
      const response = await ttsService.getPhraseAudio(phraseId, phrase.german, selectedLevel, language)
      let audioUrl = null
      if (typeof response === "string") audioUrl = response
      else if (response?.url) audioUrl = response.url
      else if (response?.data?.url) audioUrl = response.data.url
      if (!audioUrl) throw new Error("No audio URL")
      if (!listenAudioRef.current) listenAudioRef.current = new Audio()
      listenAudioRef.current.src = audioUrl
      listenAudioRef.current.onended = () => setListenPlaying(false)
      listenAudioRef.current.onerror = () => setListenPlaying(false)
      await listenAudioRef.current.play()
    } catch {
      setListenPlaying(false)
    }
  }

  const startListenQuiz = () => {
    const finished = phrases.filter((p) => finishedPhraseIds.includes(p._id || p.id))
    if (finished.length < 4) {
      alert("Përfundoni të paktën 4 fraza para se të filloni kuizin e dëgjimit!")
      return
    }
    const quizSize = Math.min(10, finished.length)
    const selected = [...finished].sort(() => Math.random() - 0.5).slice(0, quizSize)
    setListenPhrases(selected)
    setListenIdx(0)
    setListenOptions(buildListenOptions(selected[0], finished))
    setListenSelected(null)
    setListenScore(0)
    setListenComplete(false)
    setListenPlaying(false)
    setListenQuizMode(true)
  }

  const handleListenAnswer = (option) => {
    if (listenSelected !== null) return
    const correctId = listenPhrases[listenIdx]?._id || listenPhrases[listenIdx]?.id
    const selectedId = option._id || option.id
    setListenSelected(selectedId)
    const isCorrect = selectedId === correctId
    if (isCorrect) setListenScore((s) => s + 1)
    setTimeout(() => nextListenQuestion(isCorrect ? 1 : 0), 800)
  }

  const nextListenQuestion = async (scoreToAdd = 0) => {
    const next = listenIdx + 1
    const newScore = listenScore + scoreToAdd
    if (next >= listenPhrases.length) {
      setListenComplete(true)
      try { await phraseService.addQuizXp(newScore) } catch {}
      setAnimatedXp(newScore)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)
      return
    }
    const finished = phrases.filter((p) => finishedPhraseIds.includes(p._id || p.id))
    setListenIdx(next)
    setListenOptions(buildListenOptions(listenPhrases[next], finished))
    setListenSelected(null)
  }

  const exitListenQuiz = () => {
    if (listenAudioRef.current) listenAudioRef.current.pause()
    setListenQuizMode(false)
    setListenComplete(false)
    setListenIdx(0)
    setListenScore(0)
    setListenSelected(null)
    setListenPlaying(false)
  }

  const speakGerman = async (phrase) => {
    const phraseId = phrase._id || phrase.id
    if (playingPhraseId === phraseId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingPhraseId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      if (audioRef.current.src && audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
    try {
      setPlayingPhraseId(phraseId)
      const response = await ttsService.getPhraseAudio(phraseId, phrase.german, selectedLevel, language)
      let audioUrl = null
      if (typeof response === "string") audioUrl = response
      else if (response?.url) audioUrl = response.url
      else if (response?.data?.url) audioUrl = response.data.url
      if (!audioUrl) throw new Error("No audio URL in response")
      if (!audioRef.current) audioRef.current = new Audio()
      audioRef.current.src = audioUrl
      audioRef.current.onended = () => setPlayingPhraseId(null)
      audioRef.current.onerror = (e) => {
        console.error("[TTS] Audio playback error:", e)
        setPlayingPhraseId(null)
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(phrase.german)
          utterance.lang = "de-DE"
          utterance.rate = 0.8
          window.speechSynthesis.speak(utterance)
        }
      }
      await audioRef.current.play()
    } catch (error) {
      console.error("[TTS] Error:", error)
      setPlayingPhraseId(null)
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(phrase.german)
        utterance.lang = "de-DE"
        utterance.rate = 0.8
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPhrases = phrases.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(phrases.length / itemsPerPage)

  const Pagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all ${currentPage === 1 ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white active:scale-95"}`}
        >
          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
          if (pageNum > totalPages) return null
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 ${currentPage === pageNum ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-[#14B8A6]/30" : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#14B8A6]"}`}
              style={{ fontFamily: fonts.poppins }}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all ${currentPage === totalPages ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white active:scale-95"}`}
        >
          <ChevronRight size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>Kërkohet Autentifikimi</h2>
          <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>Ju lutem identifikohuni për të hyrë në fraza.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>Gabim</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>{error}</p>
          <button onClick={fetchData} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform text-sm sm:text-base" style={{ fontFamily: fonts.poppins }}>
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  // ─── MATCHING QUIZ MODE (gamified redesign) ─────────────────────────────
  if (quizMode) {
    const matchedCount = Object.keys(matches).length
    const totalCount = quizPhrases.length
    const progressPct = totalCount > 0 ? (matchedCount / totalCount) * 100 : 0
    const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1

    const pairColors = [
      { bg: 'rgba(20,184,166,0.22)', border: '#14b8a6', text: '#5eead4' },
      { bg: 'rgba(139,92,246,0.22)', border: '#8b5cf6', text: '#c4b5fd' },
      { bg: 'rgba(245,158,11,0.22)', border: '#f59e0b', text: '#fcd34d' },
      { bg: 'rgba(244,114,182,0.22)', border: '#f472b6', text: '#fbcfe8' },
      { bg: 'rgba(59,130,246,0.22)', border: '#3b82f6', text: '#93c5fd' },
      { bg: 'rgba(34,197,94,0.22)', border: '#22c55e', text: '#86efac' },
      { bg: 'rgba(251,146,60,0.22)', border: '#fb923c', text: '#fed7aa' },
      { bg: 'rgba(6,182,212,0.22)', border: '#06b6d4', text: '#67e8f9' },
      { bg: 'rgba(232,121,249,0.22)', border: '#e879f9', text: '#f5d0fe' },
      { bg: 'rgba(79,70,229,0.22)', border: '#4f46e5', text: '#a5b4fc' },
    ]

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

    const phraseColorMap = {}
    quizPhrases.forEach((phrase, idx) => {
      phraseColorMap[phrase._id || phrase.id] = idx % pairColors.length
    })

    const getAlbanianColorIdx = (aId) => {
      const matchedGId = Object.keys(matches).find(gId => matches[gId] === aId)
      return matchedGId !== undefined ? phraseColorMap[matchedGId] : null
    }

    return (
      <>
        <SEO
          title="Kuiz Fraza Gjermane - Testoni Dijen tuaj"
          description="Testoni njohuritë tuaja të frazave gjermane me kuiz interaktiv."
          keywords="kuiz gjermanisht, test frazash, mesimi gjermanishtes"
        />
        <style>{`
          @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
          @keyframes correctPop { 0%{transform:scale(1)} 40%{transform:scale(1.1)} 100%{transform:scale(1)} }
          @keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(1.2)} }
          @keyframes starPop { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.35) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
          @keyframes pulseGlow { 0%,100%{box-shadow:0 0 12px rgba(6,182,212,0.4)} 50%{box-shadow:0 0 28px rgba(6,182,212,0.7)} }
          .quiz-shake { animation: shake 0.45s ease; }
          .correct-pop { animation: correctPop 0.32s ease; }
          .star-1 { animation: starPop 0.5s ease 0.1s both; }
          .star-2 { animation: starPop 0.5s ease 0.25s both; }
          .star-3 { animation: starPop 0.5s ease 0.4s both; }
        `}</style>

        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #faf9f6 0%, #f5f0eb 50%, #faf9f6 100%)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* ── Header ── */}
          <div style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(0,0,0,0.07)',
            backdropFilter: 'blur(8px)',
          }}>
            <button
              onClick={exitQuiz}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>

            <div style={{ flex: 1, background: 'rgba(0,0,0,0.08)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #06b6d4, #818cf8)',
                width: `${progressPct}%`,
                transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: '0 0 14px rgba(129,140,248,0.65)',
              }} />
            </div>

            {/* Streak chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: streak > 0 ? 'rgba(251,191,36,0.14)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${streak > 0 ? 'rgba(251,191,36,0.4)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 99, padding: '4px 10px', transition: 'all 0.3s',
            }}>
              <Zap size={12} color={streak > 0 ? '#fbbf24' : 'rgba(255,255,255,0.25)'} />
              <span style={{ fontSize: 12, fontWeight: 800, color: streak > 0 ? '#d97706' : 'rgba(0,0,0,0.25)', fontFamily: fonts.poppins }}>
                {streak}
              </span>
            </div>

            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', fontFamily: fonts.poppins, minWidth: 32, textAlign: 'right' }}>
              {matchedCount}/{totalCount}
            </span>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, padding: '20px 16px 40px', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: 580 }}>
              {quizComplete ? (
                /* ── Completion screen ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 28, overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                  }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0891b2 100%)',
                    padding: '40px 24px 32px', textAlign: 'center', position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -20%, rgba(251,191,36,0.28), transparent 65%)' }} />
                    <div style={{ position: 'relative' }}>
                      <Trophy size={54} color="white" style={{ filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.45))' }} />
                      <h2 style={{ fontSize: 27, fontWeight: 900, color: 'white', margin: '14px 0 6px', fontFamily: fonts.poppins }}>
                        {wrongCount === 0 ? 'Perfekt! 🎉' : wrongCount <= 2 ? 'Shumë Mirë! 🌟' : 'Kualifikuar!'}
                      </h2>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 18px', fontFamily: fonts.inter }}>
                        {wrongCount === 0 ? 'Asnjë gabim — Fenomenal!' : `${wrongCount} gabim${wrongCount > 1 ? 'e' : ''} — Vazhdo të praktikosh!`}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                        {[1,2,3].map(s => (
                          <span key={s} className={`star-${s}`} style={{ fontSize: 38, filter: s <= stars ? 'drop-shadow(0 0 12px #fbbf24)' : 'grayscale(1) opacity(0.22)' }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px 20px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                      {[
                        { label: 'Çifte Saktë', value: matchedCount, color: '#34d399', bg: 'rgba(52,211,153,0.09)', border: 'rgba(52,211,153,0.28)' },
                        { label: 'XP Fituar', value: `+${matchedCount}`, color: '#fbbf24', bg: 'rgba(251,191,36,0.09)', border: 'rgba(251,191,36,0.28)' },
                        { label: 'Streak Max', value: maxStreak, color: '#f472b6', bg: 'rgba(244,114,182,0.09)', border: 'rgba(244,114,182,0.28)' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '14px 6px', borderRadius: 14, background: s.bg, border: `1px solid ${s.border}` }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: fonts.poppins }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 3, fontFamily: fonts.inter }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={exitQuiz} style={{
                        flex: 1, padding: '13px 0',
                        background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 14, cursor: 'pointer',
                        color: '#64748b', fontSize: 14, fontWeight: 700,
                        fontFamily: fonts.poppins, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      }}>
                        <X size={14} /> Dil
                      </button>
                      <button onClick={startQuiz} style={{
                        flex: 2, padding: '13px 0',
                        background: 'linear-gradient(135deg, #06b6d4, #818cf8)',
                        border: 'none', borderRadius: 14, cursor: 'pointer',
                        color: 'white', fontSize: 14, fontWeight: 700,
                        fontFamily: fonts.poppins, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                      }}>
                        <RotateCcw size={14} /> Fillo Përsëri
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── Active quiz ── */
                <>
                  <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 18, fontFamily: fonts.inter }}>
                    Lidh frazën {currentLang.label.toLowerCase()} me shqipen e saj
                  </p>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, padding: '7px 12px' }}>
                      <img src={currentLang.flag} alt={currentLang.label} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 3 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0891b2', fontFamily: fonts.poppins }}>{currentLang.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '7px 12px' }}>
                      <img src={ALBANIAN_FLAG} alt="Shqip" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 3 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', fontFamily: fonts.poppins }}>Shqip</span>
                    </div>
                  </div>

                  {/* Pairs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quizPhrases.map((germanPhrase, idx) => {
                      const gId = germanPhrase._id || germanPhrase.id
                      const albanianPhrase = shuffledAlbanian[idx]
                      const aId = albanianPhrase?._id || albanianPhrase?.id

                      const gMatched = !!matches[gId]
                      const aMatched = Object.values(matches).includes(aId)
                      const gSelected = selectedGerman === gId
                      const aSelected = selectedAlbanian === aId
                      const gWrong = wrongPair?.german === gId
                      const aWrong = wrongPair?.albanian === aId

                      const gColorIdx = gMatched ? phraseColorMap[gId] : null
                      const aColorIdx = aMatched ? getAlbanianColorIdx(aId) : null
                      const gColor = gColorIdx !== null ? pairColors[gColorIdx] : null
                      const aColor = aColorIdx !== null ? pairColors[aColorIdx] : null

                      const maxLen = Math.max(germanPhrase.german.length, albanianPhrase?.albanian?.length ?? 0)
                      const fs = maxLen > 50 ? 11 : maxLen > 32 ? 12 : 13

                      const gStyle = gMatched && gColor
                        ? { background: gColor.bg, border: `2px solid ${gColor.border}`, color: '#d97706', boxShadow: `0 0 14px ${gColor.border}55` }
                        : gWrong
                        ? { background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.7)', color: '#dc2626' }
                        : gSelected
                        ? { background: 'rgba(6,182,212,0.12)', border: '2px solid #06b6d4', color: '#0e7490', boxShadow: '0 0 18px rgba(6,182,212,0.25)' }
                        : { background: '#fff', border: '2px solid rgba(6,182,212,0.3)', color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

                      const aStyle = aMatched && aColor
                        ? { background: aColor.bg, border: `2px solid ${aColor.border}`, color: '#d97706', boxShadow: `0 0 14px ${aColor.border}55` }
                        : aWrong
                        ? { background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.7)', color: '#dc2626' }
                        : aSelected
                        ? { background: 'rgba(139,92,246,0.12)', border: '2px solid #8b5cf6', color: '#6d28d9', boxShadow: '0 0 18px rgba(139,92,246,0.25)' }
                        : { background: '#fff', border: '2px solid rgba(139,92,246,0.3)', color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

                      const baseBtn = {
                        padding: '10px 12px', borderRadius: 12,
                        fontSize: fs, fontWeight: 600, textAlign: 'left',
                        lineHeight: 1.35, minHeight: '2.7rem',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: fonts.inter,
                        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                        width: '100%',
                      }

                      return (
                        <div key={gId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <button
                            onClick={() => {
                              if (gMatched) return
                              if (gSelected) { setSelectedGerman(null); return }
                              setSelectedGerman(gId)
                              if (selectedAlbanian) handleMatchClick(gId, selectedAlbanian)
                            }}
                            disabled={gMatched}
                            className={gWrong ? 'quiz-shake' : gMatched ? 'correct-pop' : ''}
                            style={{ ...baseBtn, ...gStyle, cursor: gMatched ? 'default' : 'pointer', transform: gSelected ? 'scale(1.02)' : 'scale(1)' }}
                          >
                            {gMatched ? <Check size={12} style={{ flexShrink: 0 }} /> : null}
                            <span>{germanPhrase.german}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!albanianPhrase || aMatched) return
                              if (aSelected) { setSelectedAlbanian(null); return }
                              if (selectedGerman) { handleMatchClick(selectedGerman, aId) } else { setSelectedAlbanian(aId) }
                            }}
                            disabled={!albanianPhrase || aMatched}
                            className={aWrong ? 'quiz-shake' : aMatched ? 'correct-pop' : ''}
                            style={{ ...baseBtn, ...aStyle, cursor: aMatched ? 'default' : 'pointer', transform: aSelected ? 'scale(1.02)' : 'scale(1)' }}
                          >
                            {aMatched ? <Check size={12} style={{ flexShrink: 0 }} /> : null}
                            <span>{albanianPhrase?.albanian}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {showXpAnimation && (
            <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: '50%', top: '40%', transform: 'translate(-50%,-50%)', fontFamily: fonts.poppins, animation: 'floatUp 1.8s ease-out forwards' }}>
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span className="text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
            </div>
          )}
        </div>
      </>
    )
  }

  // ─── LISTEN QUIZ MODE (Dictionary design) ────────────────────────────────
  if (listenQuizMode) {
    const currentPhrase = listenPhrases[listenIdx]
    const correctId = currentPhrase?._id || currentPhrase?.id
    const progressPct = listenPhrases.length > 0 ? (listenIdx / listenPhrases.length) * 100 : 0

    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
        <style>{`
          @keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(1.2)} }
        `}</style>

        {/* Top bar */}
        <div style={{ background: "white", borderBottom: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={exitListenQuiz} style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
            <ArrowLeft size={16} /> Frazat
          </button>
          <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: 99, transition: "width 0.5s ease", width: `${progressPct}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", minWidth: 36, textAlign: "right" }}>{listenIdx + 1}/{listenPhrases.length}</span>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "24px 16px 32px" }}>
          <div style={{ width: "100%", maxWidth: 480 }}>
            {listenComplete ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "white", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5, #4338ca)", padding: "40px 32px", textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, background: "rgba(255,255,255,0.15)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Headphones size={36} color="white" />
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: "0 0 8px" }}>
                    {listenScore >= Math.ceil(listenPhrases.length * 0.6) ? "Urime! 🎉" : "Provo Përsëri!"}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                    {listenScore >= Math.ceil(listenPhrases.length * 0.6) ? "Kuizi i dëgjimit u krye!" : "Vazhdo të praktikosh dëgjimin."}
                  </p>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Saktë", value: `${listenScore}/${listenPhrases.length}`, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
                      { label: "Saktësi", value: `${Math.round((listenScore / listenPhrases.length) * 100)}%`, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
                      { label: "XP Fituar", value: `+${listenScore}`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center", padding: "16px 8px", borderRadius: 16, background: s.bg, border: `1px solid ${s.border}` }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={exitListenQuiz} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                      <X size={15} /> Dil
                    </button>
                    <button onClick={startListenQuiz} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
                      <RotateCcw size={15} /> Provo Përsëri
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key={listenIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                {/* Instruction */}
                <p style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 20px" }}>
                  Dëgjo dhe zgjedh frazën e saktë
                </p>

                {/* Player card */}
                <div style={{ background: "white", borderRadius: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", padding: "32px 24px", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Waveform bars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36, marginBottom: 24 }}>
                    {WAVE_HEIGHTS.map((h, i) => (
                      <motion.div
                        key={i}
                        style={{ width: 3, borderRadius: 99, background: "#a5b4fc" }}
                        animate={listenPlaying ? { height: [h, Math.min(h * 2.2, 32), h] } : { height: h }}
                        transition={{ duration: 0.35 + (i % 4) * 0.12, repeat: listenPlaying ? Infinity : 0, ease: "easeInOut", delay: i * 0.04 }}
                      />
                    ))}
                  </div>

                  {/* Pill play button */}
                  <button
                    onClick={() => playListenAudio(currentPhrase)}
                    disabled={listenPlaying}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "14px 36px", borderRadius: 99,
                      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                      border: "none", color: "white", fontFamily: "inherit",
                      fontSize: 16, fontWeight: 800, cursor: listenPlaying ? "default" : "pointer",
                      boxShadow: "0 8px 28px rgba(99,102,241,0.4)",
                      transition: "transform 0.15s, opacity 0.15s",
                      opacity: listenPlaying ? 0.75 : 1,
                    }}
                    onMouseEnter={(e) => { if (!listenPlaying) e.currentTarget.style.transform = "scale(1.04)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "" }}
                  >
                    {listenPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                    {listenPlaying ? "Duke luajtur..." : "Dëgjo"}
                  </button>
                </div>

                {/* Answer options — 2×2 grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {listenOptions.map((option, idx) => {
                    const optId = option._id || option.id
                    const isCorrect = optId === correctId
                    const isSelected = listenSelected === optId
                    const answered = listenSelected !== null

                    let cardStyle = { background: "white", border: "2px solid #e2e8f0", color: "#1e293b" }
                    let letterColor = "#818cf8"
                    let icon = null

                    if (answered) {
                      if (isCorrect) {
                        cardStyle = { background: "white", border: "2px solid #22c55e", color: "#1e293b", boxShadow: "0 4px 20px rgba(34,197,94,0.15)" }
                        letterColor = "#22c55e"
                        icon = <Check size={13} color="#22c55e" />
                      } else if (isSelected) {
                        cardStyle = { background: "white", border: "2px solid #ef4444", color: "#94a3b8" }
                        letterColor = "#ef4444"
                        icon = <X size={13} color="#ef4444" />
                      } else {
                        cardStyle = { background: "white", border: "2px solid #e2e8f0", color: "#cbd5e1", opacity: 0.5 }
                        letterColor = "#cbd5e1"
                      }
                    }

                    return (
                      <motion.button
                        key={optId}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: answered && !isCorrect && !isSelected ? 0.5 : 1, scale: 1 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => handleListenAnswer(option)}
                        disabled={answered}
                        style={{
                          ...cardStyle,
                          padding: "18px 12px",
                          borderRadius: 18,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          fontFamily: "inherit", fontWeight: 700, fontSize: 14,
                          cursor: answered ? "default" : "pointer",
                          transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                          textAlign: "center",
                        }}
                        onMouseEnter={(e) => { if (!answered) { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)" } }}
                        onMouseLeave={(e) => { if (!answered) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "" } }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: letterColor }}>{LETTERS[idx]}</span>
                          {icon}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{option.albanian}</span>
                        {answered && isCorrect && (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{option.german}</span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {showXpAnimation && (
          <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: "50%", top: "40%", transform: "translate(-50%,-50%)", animation: "floatUp 1.8s ease-out forwards" }}>
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
          </div>
        )}
      </div>
    )
  }

  // ─── MAIN PHRASE LIST ────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title="Fraza Gjermane - Mësoni Fraza të Përditshme"
        description="Mësoni fraza të përditshme në gjuhën gjermane me përkthim në shqip."
        keywords="fraza gjermane, mesimi gjermanishtes, perkthim gjermanisht shqip, shqiptim gjermanisht"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1]">
        {showPaywallModal && (
          <PaywallModal
            onClose={() => setShowPaywallModal(false)}
            hoursUntilReset={dailyLimitInfo.hoursUntilReset}
            minutesUntilReset={dailyLimitInfo.minutesUntilReset}
          />
        )}

        {showXpAnimation && (
          <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: `${xpPosition.x}px`, top: `${xpPosition.y}px`, fontFamily: fonts.poppins, animation: "floatUp 1.5s ease-out forwards" }}>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            <span className="text-3xl sm:text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
          </div>
        )}

        <style>{`
          @keyframes floatUp {
            0%   { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
          }
        `}</style>

        <div className="max-w-[1200px] mx-auto p-3 sm:p-6">
          {/* Header */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #ea580c 75%, #fb923c 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
            marginBottom: isMobile ? 16 : 32,
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <BookOpen size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Fraza Gjermane
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Mëso fraza të zakonshme gjermane
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 130 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                  <Trophy size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1, marginBottom: 2 }}>{progress.finishedPhrases || 0}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Të Përfunduara</div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Limit Banner */}
          {dailyLimitInfo.dailyLimitReached && !dailyLimitInfo.isPaid ? (
            <div className="mb-4 sm:mb-6 rounded-2xl overflow-hidden shadow-lg border border-orange-200">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center gap-3">
                <Crown className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white font-bold text-sm" style={{ fontFamily: fonts.poppins }}>Limiti ditor i arritur</span>
                <span className="ml-auto text-white/80 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Riset pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min
                </span>
              </div>
              <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold text-sm mb-1" style={{ fontFamily: fonts.poppins }}>
                    Keni hapur të gjitha <span className="text-orange-500">2 frazat falas</span> të sotit.
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed" style={{ fontFamily: fonts.inter }}>
                    Me Premium hap deri në <span className="font-bold text-amber-600">10 fraza çdo ditë</span> — 5× më shumë akses.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400" style={{ fontFamily: fonts.inter }}>Sot:</span>
                    {Array.from({ length: FREE_DAILY_LIMIT }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    ))}
                    <span className="text-xs text-gray-300 mx-1">|</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: fonts.inter }}>Premium:</span>
                    {Array.from({ length: Math.min(PAID_DAILY_LIMIT, 8) }).map((_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-full border-2 ${i < FREE_DAILY_LIMIT ? "border-orange-300 bg-orange-50" : "border-amber-300 bg-amber-50"}`} />
                    ))}
                    <span className="text-xs text-amber-500 font-bold">+2</span>
                  </div>
                </div>
                <button
                  onClick={() => { window.location.href = "/payments" }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-95 border-none cursor-pointer"
                  style={{ fontFamily: fonts.poppins }}
                >
                  <Zap className="w-4 h-4" />
                  Shiko Premium
                </button>
              </div>
            </div>
          ) : (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 ${dailyLimitInfo.isPaid ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" : "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dailyLimitInfo.isPaid ? "bg-amber-100" : "bg-teal-100"}`}>
                    {dailyLimitInfo.isPaid
                      ? <Crown className="w-5 h-5 text-amber-500" />
                      : <Clock className="w-5 h-5 text-teal-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: fonts.poppins }}>
                      {dailyLimitInfo.isPaid ? "Premium" : "Plan Falas"} · {dailyLimitInfo.remainingUnlocks}/{dailyLimitInfo.dailyLimit} fraza sot
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {Array.from({ length: dailyLimitInfo.dailyLimit }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all ${i < dailyLimitInfo.dailyLimit - dailyLimitInfo.remainingUnlocks
                            ? dailyLimitInfo.isPaid ? "w-4 h-4 bg-amber-400" : "w-4 h-4 bg-teal-500"
                            : "w-4 h-4 border-2 border-gray-300 bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {!dailyLimitInfo.isPaid && (
                  <a
                    href="/payments"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    <Crown className="w-3.5 h-3.5" /> Premium →10/ditë
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Level Selector */}
          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${selectedLevel === level ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-[#14B8A6]/30" : "bg-white text-gray-600 border-2 border-gray-200 hover:border-[#14B8A6]"}`}
                style={{ fontFamily: fonts.poppins }}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
            <button onClick={() => setShowGerman(!showGerman)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 font-semibold transition-all active:scale-95 text-xs sm:text-sm ${showGerman ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-gray-300 text-gray-500"}`} style={{ fontFamily: fonts.poppins }}>
              {showGerman ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="hidden sm:inline">Gjermane</span>
              <span className="sm:hidden">DE</span>
            </button>
            <button onClick={() => setShowAlbanian(!showAlbanian)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 font-semibold transition-all active:scale-95 text-xs sm:text-sm ${showAlbanian ? "bg-purple-50 border-purple-400 text-purple-700" : "bg-white border-gray-300 text-gray-500"}`} style={{ fontFamily: fonts.poppins }}>
              {showAlbanian ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="hidden sm:inline">Shqipe</span>
              <span className="sm:hidden">AL</span>
            </button>
            <button onClick={startQuiz} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-amber-500/30 active:scale-95 transition-transform text-xs sm:text-sm" style={{ fontFamily: fonts.poppins }}>
              {dailyLimitInfo.isPaid ? "📝" : <Crown size={14} className="text-white" />}
              <span className="hidden sm:inline">Fillo</span> Kuizin
            </button>
            <button onClick={startListenQuiz} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-teal-500/30 active:scale-95 transition-transform text-xs sm:text-sm" style={{ fontFamily: fonts.poppins }}>
              <Headphones size={14} className="text-white" />
              <span className="hidden sm:inline">Kuizi i</span> Dëgjimit
            </button>
          </div>

          {/* Phrases Grid */}
          {currentPhrases.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-xl">
              <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>
                Nuk ka fraza të disponueshme për nivelin {selectedLevel}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {currentPhrases.map((phrase, index) => {
                  const isFinished = finishedPhraseIds.includes(phrase._id || phrase.id)
                  const phraseId = phrase._id || phrase.id
                  const previousPhraseFinished = index === 0 || finishedPhraseIds.includes(currentPhrases[index - 1]._id || currentPhrases[index - 1].id)
                  const isLocked = !isFinished && !previousPhraseFinished
                  const canUnlock = !isLocked && !isFinished && !dailyLimitInfo.dailyLimitReached
                  const isPlaying = playingPhraseId === phraseId

                  return (
                    <div
                      key={phraseId}
                      className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md transition-all ${isFinished ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200" : isLocked ? "bg-gray-100/60 blur-[3px] border-2 border-gray-200 opacity-60" : "bg-white border-2 border-gray-200 hover:border-[#14B8A6] hover:shadow-lg"}`}
                    >
                      <div className="flex justify-between items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          {showGerman && (
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                              <p className={`font-bold text-gray-900 ${levelTextSizes[selectedLevel].german}`} style={{ fontFamily: fonts.poppins }}>
                                {phrase.german}
                              </p>
                              <button
                                onClick={() => !isLocked && speakGerman(phrase)}
                                disabled={isLocked}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isLocked ? "border-gray-400 text-gray-400" : isPlaying ? "border-[#14B8A6] bg-[#14B8A6] text-white" : "border-[#14B8A6] text-[#14B8A6] bg-white hover:bg-[#14B8A6] hover:text-white active:scale-90"}`}
                              >
                                <Volume2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlaying ? "animate-pulse" : ""}`} />
                              </button>
                            </div>
                          )}
                          {showAlbanian && (
                            <p className={`text-gray-600 ${levelTextSizes[selectedLevel].albanian}`} style={{ fontFamily: fonts.inter }}>
                              {phrase.albanian}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-amber-700 whitespace-nowrap" style={{ fontFamily: fonts.inter }}>+{phrase.xp} XP</span>
                          {!isFinished && !isLocked && canUnlock && (
                            <button onClick={(e) => handleMarkAsFinished(phraseId, phrase.xp, e)} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-green-500/40 hover:shadow-green-500/60 transition-all active:scale-90">
                              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                          )}
                          {!isFinished && !isLocked && !canUnlock && (
                            <button onClick={() => setShowPaywallModal(true)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-orange-300 bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition-colors">
                              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                          {!isFinished && isLocked && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center">
                              <LockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          )}
                          {isFinished && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Pagination />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Phrase
