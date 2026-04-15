"use client"
import { useState, useEffect, useRef } from "react"
import { phraseService, ttsService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight, LockIcon, Plus, Eye, EyeOff, Clock, Sparkles, Check, Trophy, RotateCcw, X, Crown, Zap, Headphones, Play } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SEO from "../components/SEO"

const FREE_DAILY_LIMIT = 2
const PAID_DAILY_LIMIT = 10

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
  const [quizMode, setQuizMode] = useState(false)
  const [quizPhrases, setQuizPhrases] = useState([])
  const [selectedGerman, setSelectedGerman] = useState(null)
  const [selectedAlbanian, setSelectedAlbanian] = useState(null)
  const [matches, setMatches] = useState({})
  const [shuffledAlbanian, setShuffledAlbanian] = useState([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [wrongPair, setWrongPair] = useState(null)
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
  const [showLimitWarning, setShowLimitWarning] = useState(false)
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
      const response = await phraseService.getPhrasesByLevel(selectedLevel, { limit: 100 }, language)
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
    setQuizMode(true)
  }

  const handleMatchClick = (germanId, albanianId) => {
    const isCorrectMatch = germanId === albanianId
    if (isCorrectMatch) {
      const newMatches = { ...matches, [germanId]: albanianId }
      setMatches(newMatches)
      setSelectedGerman(null)
      setSelectedAlbanian(null)
      setWrongPair(null)
      if (Object.keys(newMatches).length === quizPhrases.length) {
        finishQuiz(newMatches)
      } else {
        setQuizScore((prev) => prev + 1)
      }
    } else {
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
  }

  // ── Listen Quiz helpers ────────────────────────────────────────────────────
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

  // ─── QUIZ MODE ────────────────────────────────────────────────────────────────
  if (quizMode) {
    const matchedCount = Object.keys(matches).length
    const totalCount = quizPhrases.length
    const progressPct = totalCount > 0 ? (matchedCount / totalCount) * 100 : 0

    return (
      <>
        <SEO
          title="Kuiz Fraza Gjermane - Testoni Dijen tuaja"
          description="Testoni djenë tuaj të frazave gjermane me kuiz interaktiv."
          keywords="kuiz gjermanisht, test frazash, mesimi gjermanishtes"
        />

        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20%      { transform: translateX(-5px); }
            40%      { transform: translateX(5px); }
            60%      { transform: translateX(-3px); }
            80%      { transform: translateX(3px); }
          }
          @keyframes popIn {
            0%   { transform: scale(0.9); opacity: 0; }
            60%  { transform: scale(1.03); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes floatUp {
            0%   { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
          }
          @keyframes matchPop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.06); }
            100% { transform: scale(1); }
          }
          .quiz-shake { animation: shake 0.4s ease; }
          .quiz-pop   { animation: popIn 0.25s ease; }
          .match-pop  { animation: matchPop 0.3s ease; }
        `}</style>

        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] flex items-start justify-center p-3 sm:p-5 pt-4">
          <div className="w-full max-w-[600px]">
            {quizComplete ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden quiz-pop">
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-2 bg-white/30 rounded-full flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: fonts.poppins }}>Kuizi Përfundoi!</h2>
                  <p className="text-white/80 text-xs" style={{ fontFamily: fonts.inter }}>Punë e shkëlqyer!</p>
                </div>
                <div className="p-5">
                  <div className="flex gap-3 justify-center mb-5">
                    <div className="flex-1 text-center bg-teal-50 rounded-xl py-3 px-2 border border-teal-100">
                      <div className="text-2xl font-bold text-teal-600" style={{ fontFamily: fonts.poppins }}>{matchedCount}</div>
                      <div className="text-[11px] text-teal-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Çifte Saktë</div>
                    </div>
                    <div className="flex-1 text-center bg-amber-50 rounded-xl py-3 px-2 border border-amber-100">
                      <div className="text-2xl font-bold text-amber-600" style={{ fontFamily: fonts.poppins }}>+{matchedCount} XP</div>
                      <div className="text-[11px] text-amber-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Pikë Fituar</div>
                    </div>
                    <div className="flex-1 text-center bg-blue-50 rounded-xl py-3 px-2 border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: fonts.poppins }}>{totalCount}</div>
                      <div className="text-[11px] text-blue-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Gjithsej</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={startQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-md shadow-teal-500/20 active:scale-95 transition-transform text-sm" style={{ fontFamily: fonts.poppins }}>
                      <RotateCcw className="w-3.5 h-3.5" /> Fillo Përsëri
                    </button>
                    <button onClick={exitQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all text-sm" style={{ fontFamily: fonts.poppins }}>
                      <X className="w-3.5 h-3.5" /> Dil
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Compact header */}
                <div className="bg-gradient-to-r from-[#0F766E] to-[#0891B2] px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={exitQuiz} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-white font-bold text-xs flex-shrink-0" style={{ fontFamily: fonts.poppins }}>{matchedCount}/{totalCount}</span>
                  </div>
                  <p className="text-white/70 text-[11px] text-center" style={{ fontFamily: fonts.inter }}>
                    Lidh frazën gjermane me shqipen e saj
                  </p>
                </div>

                {/* Column labels */}
                <div className="grid grid-cols-2 gap-2 px-3 pt-3 pb-1">
                  <div className="flex items-center justify-center gap-1.5 bg-blue-50 rounded-lg py-1.5 border border-blue-100">
                    <span style={{ fontSize: 14 }}>🇩🇪</span>
                    <span className="font-semibold text-blue-700 text-[11px]" style={{ fontFamily: fonts.poppins }}>Gjermanisht</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-red-50 rounded-lg py-1.5 border border-red-100">
                    <span style={{ fontSize: 14 }}>🇦🇱</span>
                    <span className="font-semibold text-red-700 text-[11px]" style={{ fontFamily: fonts.poppins }}>Shqip</span>
                  </div>
                </div>

                {/* Phrase pairs */}
                <div className="px-3 pb-3 pt-1 space-y-1.5">
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
                    const maxLen = Math.max(germanPhrase.german.length, albanianPhrase?.albanian?.length ?? 0)
                    const textSize = maxLen > 50 ? "text-[11px] sm:text-xs" : maxLen > 32 ? "text-xs sm:text-sm" : "text-sm sm:text-sm"
                    return (
                      <div key={gId} className="grid grid-cols-2 gap-2 sm:gap-2">
                        <button
                          onClick={() => {
                            if (gMatched) return
                            if (gSelected) { setSelectedGerman(null); return }
                            setSelectedGerman(gId)
                            if (selectedAlbanian) handleMatchClick(gId, selectedAlbanian)
                          }}
                          disabled={gMatched}
                          className={[
                            "w-full px-3 py-2.5 sm:px-3 sm:py-2.5 rounded-xl border-2 font-medium text-left transition-all duration-150 leading-tight min-h-[2.75rem]",
                            textSize,
                            gMatched
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default match-pop"
                              : gWrong
                              ? "bg-red-50 border-red-400 text-red-700 quiz-shake"
                              : gSelected
                              ? "bg-blue-50 border-blue-400 text-blue-800 shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.97]"
                          ].join(" ")}
                          style={{ fontFamily: fonts.inter }}
                        >
                          <span className="flex items-start gap-1.5">
                            {gMatched && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-emerald-500 flex-shrink-0 mt-0.5" />}
                            <span>{germanPhrase.german}</span>
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (!albanianPhrase || aMatched) return
                            if (aSelected) { setSelectedAlbanian(null); return }
                            if (selectedGerman) { handleMatchClick(selectedGerman, aId) } else { setSelectedAlbanian(aId) }
                          }}
                          disabled={!albanianPhrase || aMatched}
                          className={[
                            "w-full px-3 py-2.5 sm:px-3 sm:py-2.5 rounded-xl border-2 font-medium text-left transition-all duration-150 leading-tight min-h-[2.75rem]",
                            textSize,
                            aMatched
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default match-pop"
                              : aWrong
                              ? "bg-red-50 border-red-400 text-red-700 quiz-shake"
                              : aSelected
                              ? "bg-purple-50 border-purple-400 text-purple-800 shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/40 active:scale-[0.97]"
                          ].join(" ")}
                          style={{ fontFamily: fonts.inter }}
                        >
                          <span className="flex items-start gap-1.5">
                            {aMatched && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-emerald-500 flex-shrink-0 mt-0.5" />}
                            <span>{albanianPhrase?.albanian}</span>
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {showXpAnimation && (
              <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)", fontFamily: fonts.poppins, animation: "floatUp 1.8s ease-out forwards" }}>
                <Sparkles className="w-6 h-6 text-amber-500" />
                <span className="text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ─── LISTEN QUIZ MODE ─────────────────────────────────────────────────────
  if (listenQuizMode) {
    const currentPhrase = listenPhrases[listenIdx]
    const correctId = currentPhrase?._id || currentPhrase?.id
    const progressPct = listenPhrases.length > 0 ? (listenIdx / listenPhrases.length) * 100 : 0

    return (
      <>
        <style>{`
          @keyframes floatUp { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-80px) scale(1.2); } }
          @keyframes popIn { 0% { transform:scale(0.9); opacity:0; } 60% { transform:scale(1.03); } 100% { transform:scale(1); opacity:1; } }
          @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.5); opacity:0; } }
        `}</style>

        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] flex items-start justify-center p-3 sm:p-5 pt-4">
          <div className="w-full max-w-[580px]">
            {listenComplete ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ animation: "popIn 0.25s ease" }}>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-2 bg-white/30 rounded-full flex items-center justify-center">
                    <Headphones className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: fonts.poppins }}>Kuizi i Dëgjimit Përfundoi!</h2>
                  <p className="text-white/80 text-xs" style={{ fontFamily: fonts.inter }}>Punë e shkëlqyer!</p>
                </div>
                <div className="p-5">
                  <div className="flex gap-3 justify-center mb-5">
                    <div className="flex-1 text-center bg-teal-50 rounded-xl py-3 px-2 border border-teal-100">
                      <div className="text-2xl font-bold text-teal-600" style={{ fontFamily: fonts.poppins }}>{listenScore}/{listenPhrases.length}</div>
                      <div className="text-[11px] text-teal-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Saktë</div>
                    </div>
                    <div className="flex-1 text-center bg-amber-50 rounded-xl py-3 px-2 border border-amber-100">
                      <div className="text-2xl font-bold text-amber-600" style={{ fontFamily: fonts.poppins }}>+{listenScore} XP</div>
                      <div className="text-[11px] text-amber-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Pikë Fituar</div>
                    </div>
                    <div className="flex-1 text-center bg-blue-50 rounded-xl py-3 px-2 border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: fonts.poppins }}>{Math.round((listenScore / listenPhrases.length) * 100)}%</div>
                      <div className="text-[11px] text-blue-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Saktësi</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={startListenQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold shadow-md shadow-teal-500/20 active:scale-95 transition-transform text-sm" style={{ fontFamily: fonts.poppins }}>
                      <RotateCcw className="w-3.5 h-3.5" /> Fillo Përsëri
                    </button>
                    <button onClick={exitListenQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all text-sm" style={{ fontFamily: fonts.poppins }}>
                      <X className="w-3.5 h-3.5" /> Dil
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={exitListenQuiz} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1 bg-white/25 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-white font-bold text-sm flex-shrink-0" style={{ fontFamily: fonts.poppins }}>{listenIdx + 1}/{listenPhrases.length}</span>
                  </div>
                  <p className="text-white/80 text-xs text-center font-medium" style={{ fontFamily: fonts.inter }}>
                    Dëgjo dhe gjej frazën e saktë
                  </p>
                </div>

                <div className="p-5">
                  {/* Audio play button */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-3">
                      {listenPlaying && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-teal-400 opacity-30" style={{ animation: "pulse-ring 1s ease-out infinite" }} />
                          <span className="absolute inset-0 rounded-full bg-teal-400 opacity-20" style={{ animation: "pulse-ring 1s ease-out infinite", animationDelay: "0.3s" }} />
                        </>
                      )}
                      <button
                        onClick={() => playListenAudio(currentPhrase)}
                        disabled={listenPlaying}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-teal-500/40 active:scale-95 transition-transform disabled:opacity-70"
                      >
                        {listenPlaying
                          ? <Volume2 className="w-10 h-10 animate-pulse" />
                          : <Play className="w-10 h-10 ml-1" />
                        }
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-500" style={{ fontFamily: fonts.inter }}>
                      {listenPlaying ? "Duke luajtur..." : "Kliko për të dëgjuar"}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {listenOptions.map((option) => {
                      const optId = option._id || option.id
                      const isCorrect = optId === correctId
                      const isSelected = listenSelected === optId
                      const answered = listenSelected !== null

                      let btnClass = "w-full text-left px-5 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200 active:scale-[0.98] "
                      if (!answered) {
                        btnClass += "bg-gray-50 border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50 hover:shadow-md"
                      } else if (isCorrect) {
                        btnClass += "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      } else if (isSelected) {
                        btnClass += "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30"
                      } else {
                        btnClass += "bg-gray-100 border-gray-200 text-gray-400 opacity-60"
                      }

                      return (
                        <button key={optId} onClick={() => handleListenAnswer(option)} disabled={answered} className={btnClass} style={{ fontFamily: fonts.inter }}>
                          <div className="flex items-center gap-3">
                            {answered && isCorrect && (
                              <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {answered && isSelected && !isCorrect && (
                              <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                                <X className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {(!answered || (!isCorrect && !isSelected)) && (
                              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                                {listenOptions.indexOf(option) + 1}
                              </div>
                            )}
                            <div className="flex-1">
                              <div>{option.albanian}</div>
                              {answered && isCorrect && (
                                <div className="text-sm text-white/80 mt-0.5 font-normal">{option.german}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                </div>
              </div>
            )}

            {showXpAnimation && (
              <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)", fontFamily: fonts.poppins, animation: "floatUp 1.8s ease-out forwards" }}>
                <Sparkles className="w-6 h-6 text-amber-500" />
                <span className="text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
              </div>
            )}
          </div>
        </div>
      </>
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
            /* ── LIMIT REACHED — upgrade CTA ── */
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
                  {/* dot indicators */}
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
            /* ── NORMAL — daily counter ── */
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
                    {/* dot indicators */}
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