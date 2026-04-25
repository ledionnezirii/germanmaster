"use client"

import { useState, useEffect, useRef } from "react"
import { dictionaryService, favoritesService, ttsService, wordsService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import SEO from "../components/SEO"
import { BookOpen, Volume2, Heart, ChevronLeft, ChevronRight, Play, Pause, X, CheckCircle, XCircle, Trophy, Lock, Unlock, ArrowLeft, Crown, Headphones, Check, RotateCcw, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

const FREE_DAILY_LIMIT = 5
const PAID_DAILY_LIMIT = 25

function DictPaywallModal({ onClose, isPaid, dailyLimit }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top banner */}
          <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 px-8 pt-8 pb-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Crown className="h-10 w-10 text-white drop-shadow" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
                {isPaid ? "Limiti Ditor u Arrit!" : "Zhblloko më shumë!"}
              </h2>
              <p className="text-white/80 text-sm font-medium">
                {isPaid
                  ? `Keni arritur limitin ditor prej ${dailyLimit} fjalësh`
                  : `Versioni falas — ${dailyLimit} fjalë/ditë`}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 pt-6 pb-8">
            <p className="text-gray-700 text-sm leading-relaxed mb-1 font-medium">
              {isPaid
                ? "Keni zhbllokuar të gjitha fjalët e sotme. Kthehuni nesër!"
                : "Keni shfrytëzuar të gjitha zhbllokimet falas për sot."}
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              {isPaid
                ? "Limiti ditor rivendoset çdo mesnatë."
                : "Kaloni në Premium dhe zhbllokoni deri në " + PAID_DAILY_LIMIT + " fjalë çdo ditë, pa kufizime."}
            </p>

            {!isPaid && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 mb-6 text-left space-y-2">
                {[
                  `Deri në ${PAID_DAILY_LIMIT} fjalë të reja çdo ditë`,
                  "Të gjitha nivelet A1 → C2",
                  "Audio shqiptim për çdo fjalë",
                  "Pa reklama",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{perk}</span>
                  </div>
                ))}
              </div>
            )}

            {!isPaid ? (
              <button
                onClick={() => { window.location.href = "/payments" }}
                className="w-full py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-purple-300/40 hover:shadow-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer mb-3"
              >
                Zhblloko Premium Tani
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-purple-300/40 hover:shadow-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer mb-3"
              >
                Kuptova, Faleminderit!
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-400 text-sm font-medium cursor-pointer border-none bg-transparent hover:text-gray-600 transition-colors"
            >
              Jo tani, mbyll
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const Dictionary = () => {
  const { language } = useLanguage()
  const fonts = {
    poppins: ["Poppins", "sans-serif"].join(", "),
    inter: ["Inter", "sans-serif"].join(", "),
  }
  const [words, setWords] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [showFavorites, setShowFavorites] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [playingWordId, setPlayingWordId] = useState(null)
  const [showDictPaywall, setShowDictPaywall] = useState(false)
  const audioRef = useRef(null)
  const listenAudioRef = useRef(null)
  const wordsPerPage = 32

  // Unlock state
  const [unlockStats, setUnlockStats] = useState({
    todayUnlocks: 0,
    remainingUnlocks: FREE_DAILY_LIMIT,
    dailyLimit: FREE_DAILY_LIMIT,
    canUnlock: true,
    nextResetTime: null,
    isPaid: false,
  })
  const [unlocking, setUnlocking] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Listen Quiz state
  const [showListenQuiz, setShowListenQuiz] = useState(false)
  const [listenWords, setListenWords] = useState([])
  const [listenIdx, setListenIdx] = useState(0)
  const [listenOptions, setListenOptions] = useState([])
  const [listenSelected, setListenSelected] = useState(null)
  const [listenScore, setListenScore] = useState(0)
  const [listenComplete, setListenComplete] = useState(false)
  const [listenPlaying, setListenPlaying] = useState(false)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [animatedXp, setAnimatedXp] = useState(0)

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizWords, setQuizWords] = useState([])
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)

  useEffect(() => {
    fetchWords()
    fetchFavorites()
    fetchUnlockStats()
  }, [selectedLevel, currentPage, language])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!unlockStats.canUnlock && unlockStats.nextResetTime) {
      const calculateTimeLeft = () => {
        const now = new Date().getTime()
        const resetTime = new Date(unlockStats.nextResetTime).getTime()
        const diff = resetTime - now

        if (diff <= 0) {
          setTimeUntilReset(null)
          fetchUnlockStats()
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
      }

      calculateTimeLeft()
      const interval = setInterval(calculateTimeLeft, 60000)

      return () => clearInterval(interval)
    } else {
      setTimeUntilReset(null)
    }
  }, [unlockStats.canUnlock, unlockStats.nextResetTime])

  const fetchWords = async () => {
    try {
      setLoading(true)
      const params = { page: currentPage, limit: wordsPerPage, language }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await dictionaryService.getAllWords(params)

      setWords(response.data.words || response.data || [])

      const paginationData = response.data.pagination || {}
      const totalCount = paginationData.totalWords || paginationData.total || response.data.total || response.total || 0
      setTotalWords(totalCount)
      const calculatedPages = Math.ceil(totalCount / wordsPerPage)
      setTotalPages(calculatedPages)
    } catch (error) {
      setWords([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await favoritesService.getFavorites()
      const favoriteWords = response.data.favorites || response.data || []
      setFavorites(favoriteWords.map((fav) => fav.wordId || fav))
    } catch (error) {
      setFavorites([])
    }
  }

  const fetchUnlockStats = async () => {
    try {
      const response = await dictionaryService.getUnlockStats()
      setUnlockStats(response.data || response)
    } catch (error) {
      // silently fail
    }
  }

  const handleUnlockWord = async (wordId) => {
    if (!unlockStats.canUnlock) {
      setShowDictPaywall(true)
      return
    }

    setUnlocking(wordId)
    try {
      const response = await dictionaryService.unlockWord(wordId, language)

      setWords(prevWords =>
        prevWords.map(w =>
          w._id === wordId ? { ...w, isUnlocked: true } : w
        )
      )

      await fetchUnlockStats()
    } catch (error) {
      alert(error.response?.data?.message || "Gabim gjatë zhbllokimit të fjalës")
    } finally {
      setUnlocking(null)
    }
  }

  const toggleFavorite = async (wordId) => {
    try {
      const isFavorite = favorites.some((fav) => (fav._id || fav) === wordId)
      if (isFavorite) {
        await favoritesService.removeFavorite(wordId)
        setFavorites(favorites.filter((fav) => (fav._id || fav) !== wordId))
      } else {
        await favoritesService.addFavorite(wordId)
        const word = words.find((w) => w._id === wordId)
        setFavorites([...favorites, word])
      }
    } catch (error) {
      // silently fail
    }
  }

  const playPronunciation = async (word) => {
    if (playingWordId === word._id && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingWordId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    try {
      setPlayingWordId(word._id)
      const audioUrl = await ttsService.getDictionaryAudio(word._id, word.word, word.level, language)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl
      audioRef.current.onended = () => setPlayingWordId(null)
      audioRef.current.onerror = () => setPlayingWordId(null)

      await audioRef.current.play()
    } catch (error) {
      setPlayingWordId(null)
      alert("Nuk mund të luhet audioja. Ju lutemi provoni përsëri.")
    }
  }

  const startQuiz = async () => {
    if (!unlockStats.isPaid) {
      setShowDictPaywall(true)
      return
    }
    if (selectedLevel === "all") {
      alert("Ju lutemi zgjidhni një nivel (A1, A2, B1, B2, C1, C2) për të filluar kuizin.")
      return
    }

    setQuizLoading(true)
    try {
      const response = await dictionaryService.getAllWords({ level: selectedLevel, limit: 100, language })
      const levelWords = response.data.words || response.data || []

      const unlockedWords = levelWords.filter(w => w.isUnlocked)

      if (unlockedWords.length < 15) {
        alert(`Nevojiten të paktën 15 fjalë të zhbllokkuara për nivelin ${selectedLevel}. Ju keni ${unlockedWords.length} fjalë të zhbllokkuara.`)
        setQuizLoading(false)
        return
      }

      const shuffled = [...unlockedWords].sort(() => Math.random() - 0.5)
      const selectedWords = shuffled.slice(0, 15)
      setQuizWords(unlockedWords)

      const questions = selectedWords.map((word) => {
        const otherWords = unlockedWords.filter(w => w._id !== word._id)
        const wrongOptions = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.translation)

        const options = [...wrongOptions, word.translation].sort(() => Math.random() - 0.5)

        return {
          word: word.word,
          correctAnswer: word.translation,
          options: options
        }
      })

      setQuizQuestions(questions)
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setCorrectAnswers(0)
      setShowResult(false)
      setAnswerSubmitted(false)
      setXpAwarded(false)
      setShowQuiz(true)
    } catch (error) {
      alert("Ndodhi një gabim gjatë fillimit të kuizit. Ju lutemi provoni përsëri.")
    } finally {
      setQuizLoading(false)
    }
  }

  const handleAnswerSelect = (answer) => {
    if (answerSubmitted) return

    setSelectedAnswer(answer)
    setAnswerSubmitted(true)

    const currentQuestion = quizQuestions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setAnswerSubmitted(false)
      } else {
        finishQuiz()
      }
    }, 1200)
  }

  const finishQuiz = async () => {
    setShowResult(true)

    const passed = correctAnswers >= 9

    if (passed && !xpAwarded) {
      try {
        await wordsService.addQuizXp(5)
        setXpAwarded(true)
      } catch (error) {
        // silently fail
      }
    }
  }

  const closeQuiz = () => {
    setShowQuiz(false)
    setQuizQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setCorrectAnswers(0)
    setShowResult(false)
    setAnswerSubmitted(false)
    setXpAwarded(false)
  }

  // ── Listen Quiz ───────────────────────────────────────────────────────────
  const buildListenOptions = (correct, pool) => {
    const others = pool.filter((w) => w._id !== correct._id)
    const wrong = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
    return [...wrong, correct].sort(() => Math.random() - 0.5)
  }

  const playListenAudio = async (word) => {
    if (!word) return
    try {
      setListenPlaying(true)
      const audioUrl = await ttsService.getDictionaryAudio(word._id, word.word, word.level, language)
      if (!listenAudioRef.current) listenAudioRef.current = new Audio()
      listenAudioRef.current.src = audioUrl
      listenAudioRef.current.onended = () => setListenPlaying(false)
      listenAudioRef.current.onerror = () => setListenPlaying(false)
      await listenAudioRef.current.play()
    } catch {
      setListenPlaying(false)
    }
  }

  const startListenQuiz = async () => {
    if (selectedLevel === "all") {
      alert("Ju lutemi zgjidhni një nivel për të filluar kuizin e dëgjimit.")
      return
    }
    try {
      const response = await dictionaryService.getAllWords({ level: selectedLevel, limit: 100, language })
      const allWords = response.data.words || response.data || []
      const unlocked = allWords.filter((w) => w.isUnlocked)
      if (unlocked.length < 4) {
        alert(`Nevojiten të paktën 4 fjalë të zhbllokkuara. Ju keni ${unlocked.length}.`)
        return
      }
      const quizSize = Math.min(15, unlocked.length)
      const selected = [...unlocked].sort(() => Math.random() - 0.5).slice(0, quizSize)
      setListenWords(selected)
      setListenIdx(0)
      setListenOptions(buildListenOptions(selected[0], unlocked))
      setListenSelected(null)
      setListenScore(0)
      setListenComplete(false)
      setListenPlaying(false)
      setShowListenQuiz(true)
    } catch {
      alert("Gabim gjatë ngarkimit të fjalëve. Provoni përsëri.")
    }
  }

  const handleListenAnswer = (option) => {
    if (listenSelected !== null) return
    const correctId = listenWords[listenIdx]?._id
    const isCorrect = option._id === correctId
    setListenSelected(option._id)
    if (isCorrect) setListenScore((s) => s + 1)
    setTimeout(() => nextListenQuestion(isCorrect ? 1 : 0), 800)
  }

  const nextListenQuestion = async (scoreToAdd = 0) => {
    const next = listenIdx + 1
    const newScore = listenScore + scoreToAdd
    if (next >= listenWords.length) {
      setListenComplete(true)
      setListenScore(newScore)
      setAnimatedXp(newScore)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)
      try { await wordsService.addQuizXp(newScore) } catch {}
      return
    }
    const response = await dictionaryService.getAllWords({ level: selectedLevel, limit: 100, language })
    const allWords = response.data.words || response.data || []
    const unlocked = allWords.filter((w) => w.isUnlocked)
    setListenIdx(next)
    setListenOptions(buildListenOptions(listenWords[next], unlocked))
    setListenSelected(null)
  }

  const closeListenQuiz = () => {
    if (listenAudioRef.current) listenAudioRef.current.pause()
    setShowListenQuiz(false)
    setListenComplete(false)
    setListenIdx(0)
    setListenScore(0)
    setListenSelected(null)
    setListenPlaying(false)
  }

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFavorites = !showFavorites || favorites.some((fav) => fav._id === word._id)
    return matchesSearch && matchesFavorites
  })

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1)
  }

  const handleLevelChange = (level) => {
    setSelectedLevel(level)
    setCurrentPage(1)
  }

  const handleFavoritesToggle = () => {
    setShowFavorites(!showFavorites)
    setCurrentPage(1)
  }

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const getLevelColor = (level) => {
    switch (level) {
      case "A1": return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50"
      case "A2": return "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300/50"
      case "B1": return "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-800 border-teal-300/50"
      case "B2": return "bg-gradient-to-br from-teal-200 to-cyan-200 text-teal-900 border-teal-400/50"
      case "C1": return "bg-gradient-to-br from-cyan-500 to-teal-600 text-white border-cyan-400/30"
      case "C2": return "bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-teal-500/30"
      default:   return "bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 border-gray-200/50"
    }
  }

  const getPartOfSpeechColor = (partOfSpeech) => {
    switch (partOfSpeech?.toLowerCase()) {
      case "noun":
      case "emër":       return "bg-blue-50 text-blue-700 border border-blue-200/50"
      case "verb":
      case "folje":      return "bg-green-50 text-green-700 border border-green-200/50"
      case "adjective":
      case "mbiemër":    return "bg-purple-50 text-purple-700 border border-purple-200/50"
      case "adverb":
      case "ndajfolje":  return "bg-orange-50 text-orange-700 border border-orange-200/50"
      default:           return "bg-gray-50 text-gray-700 border border-gray-200/50"
    }
  }

  // ── Full-screen quiz view ─────────────────────────────────────────────────
  if (showQuiz) {
    const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
        <style>{`@keyframes popIn { 0%{transform:scale(0.92);opacity:0} 60%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }`}</style>

        {/* Top bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-4">
          <button onClick={closeQuiz} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Fjalori
          </button>
          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-purple-600 w-12 text-right">{currentQuestionIndex + 1}/{quizQuestions.length}</span>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
          <div className="w-full max-w-lg">
            {!showResult ? (
              <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                {/* Score badge */}
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-2 bg-white border border-purple-100 rounded-full px-4 py-1.5 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700">{correctAnswers} saktë</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">{selectedLevel}</span>
                  </div>
                </div>

                {/* Word card */}
                <div className="bg-white rounded-3xl shadow-xl border border-purple-100/50 p-6 mb-4 text-center">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Çfarë do të thotë</p>
                  <h2 className="text-4xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {quizQuestions[currentQuestionIndex]?.word}
                  </h2>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {quizQuestions[currentQuestionIndex]?.options.map((option, index) => {
                    const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer
                    const isSelected = selectedAnswer === option
                    let cls = "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700"
                    if (answerSubmitted) {
                      if (isCorrect) cls = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      else if (isSelected) cls = "bg-red-400 border-red-400 text-white"
                      else cls = "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                    }
                    return (
                      <motion.button key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={answerSubmitted}
                        className={`w-full px-5 py-4 rounded-2xl border-2 text-left font-semibold transition-all duration-200 flex items-center justify-between ${cls} ${answerSubmitted ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
                      >
                        <span>{option}</span>
                        {answerSubmitted && isCorrect && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                        {answerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 flex-shrink-0" />}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className={`px-8 py-10 text-center ${correctAnswers >= 9 ? "bg-gradient-to-br from-purple-600 to-indigo-600" : "bg-gradient-to-br from-amber-500 to-orange-500"}`}>
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                    {correctAnswers >= 9 ? <Trophy className="w-10 h-10 text-white" /> : <RotateCcw className="w-10 h-10 text-white" />}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">{correctAnswers >= 9 ? "Urime! 🎉" : "Provo Përsëri!"}</h3>
                  <p className="text-white/80 text-sm">{correctAnswers >= 9 ? "Punë e shkëlqyer!" : "Nevojiten të paktën 9 të sakta."}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "Saktë", value: `${correctAnswers}/${quizQuestions.length}`, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                      { label: "Saktësi", value: `${Math.round((correctAnswers / quizQuestions.length) * 100)}%`, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                      { label: "XP Fituar", value: `+${correctAnswers >= 9 && xpAwarded ? 5 : 0}`, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                    ].map(s => (
                      <div key={s.label} className={`text-center py-4 rounded-2xl border ${s.bg}`}>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={closeQuiz} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition-all">
                      <X className="w-4 h-4" /> Dil
                    </button>
                    <button onClick={() => { closeQuiz(); startQuiz() }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-purple-500/20 transition-all">
                      <RotateCcw className="w-4 h-4" /> Provo Përsëri
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Listen Quiz full-screen ───────────────────────────────────────────────
  if (showListenQuiz) {
    const currentWord = listenWords[listenIdx]
    const correctId = currentWord?._id
    const progressPct = listenWords.length > 0 ? (listenIdx / listenWords.length) * 100 : 0
    const LETTERS = ["A", "B", "C", "D"]
    const WAVE_HEIGHTS = [5, 10, 18, 13, 22, 14, 24, 9, 20, 12, 17, 7, 21, 11, 9]

    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
        <style>{`
          @keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(1.2)} }
        `}</style>

        {/* Top bar */}
        <div style={{ background: "white", borderBottom: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={closeListenQuiz} style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
            <ArrowLeft size={16} /> Fjalori
          </button>
          <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: 99, transition: "width 0.5s ease", width: `${progressPct}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", minWidth: 36, textAlign: "right" }}>{listenIdx + 1}/{listenWords.length}</span>
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
                    {listenScore >= Math.ceil(listenWords.length * 0.6) ? "Urime! 🎉" : "Provo Përsëri!"}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                    {listenScore >= Math.ceil(listenWords.length * 0.6) ? "Kuizi i dëgjimit u krye!" : "Vazhdo të praktikosh dëgjimin."}
                  </p>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Saktë", value: `${listenScore}/${listenWords.length}`, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
                      { label: "Saktësi", value: `${Math.round((listenScore / listenWords.length) * 100)}%`, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
                      { label: "XP Fituar", value: `+${listenScore}`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", padding: "16px 8px", borderRadius: 16, background: s.bg, border: `1px solid ${s.border}` }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={closeListenQuiz} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
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
                <p style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "#94a3b8", textTransform: "uppercase", marginBottom: 20, margin: "0 0 20px" }}>
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
                    onClick={() => playListenAudio(currentWord)}
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
                    onMouseEnter={e => { if (!listenPlaying) e.currentTarget.style.transform = "scale(1.04)" }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "" }}
                  >
                    {listenPlaying
                      ? <Pause size={18} />
                      : <Play size={18} style={{ marginLeft: 2 }} />}
                    {listenPlaying ? "Duke luajtur..." : "Dëgjo"}
                  </button>
                </div>

                {/* Answer options — 2×2 grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {listenOptions.map((option, idx) => {
                    const isCorrect = option._id === correctId
                    const isSelected = listenSelected === option._id
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
                        key={option._id}
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
                        onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)" } }}
                        onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "" } }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: letterColor }}>{LETTERS[idx]}</span>
                          {icon}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{option.translation}</span>
                        {answered && isCorrect && (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{option.word}</span>
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

  return (
    <>
      <SEO
        title="Fjalor Gjermanisht-Shqip | Mësoni Fjalë Gjermane"
        description="Fjalor i plotë gjermanisht-shqip me audio, shqipime dhe ushtrime. Mësoni fjalë gjermane me shqipime dhe shembuj."
        keywords="fjalor gjermanisht, fjale gjermane, german dictionary, learn german words, fjalor gjermanisht shqip"
        ogImage="/images/dictionary-og.jpg"
        canonicalUrl="https://gjuhagjermane.com/dictionary"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto p-2 md:p-4 space-y-4">

          {/* Header */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 75%, #fcd34d 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <BookOpen size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Fjalor Gjermanisht
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Zhbllokoni dhe mësoni fjalë të reja
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 130 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                  <BookOpen size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1, marginBottom: 2 }}>{unlockStats.todayUnlocks}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Zhbllokuar Sot</div>
                </div>
              </div>
            </div>
          </div>

          {/* Unlock Stats Banner */}
          {!unlockStats.canUnlock && !unlockStats.isPaid ? (
            /* ── LIMIT REACHED (free user) — upgrade CTA ── */
            <div className="rounded-2xl overflow-hidden shadow-lg border border-purple-200">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                <Crown className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white font-bold text-sm">Limiti ditor i arritur</span>
                {timeUntilReset && (
                  <span className="ml-auto text-white/80 text-xs flex items-center gap-1">
                    🕐 Hapet pas: {timeUntilReset}
                  </span>
                )}
              </div>
              <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold text-sm mb-1">
                    Keni hapur të gjitha <span className="text-purple-500">{FREE_DAILY_LIMIT} fjalët falas</span> të sotit.
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Me Premium hap deri në <span className="font-bold text-indigo-600">{PAID_DAILY_LIMIT} fjalë çdo ditë</span> — {PAID_DAILY_LIMIT / FREE_DAILY_LIMIT}× më shumë akses.
                  </p>
                  {/* dot comparison */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">Sot:</span>
                    {Array.from({ length: FREE_DAILY_LIMIT }).map((_, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    ))}
                    <span className="text-xs text-gray-300 mx-1">|</span>
                    <span className="text-xs text-gray-400">Premium:</span>
                    {Array.from({ length: Math.min(PAID_DAILY_LIMIT, 10) }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < FREE_DAILY_LIMIT ? "border-purple-300 bg-purple-50" : "border-indigo-300 bg-indigo-50"}`} />
                    ))}
                    <span className="text-xs text-indigo-500 font-bold">+{PAID_DAILY_LIMIT - 10}</span>
                  </div>
                </div>
                <button
                  onClick={() => { window.location.href = "/payments" }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-95 border-none cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  Shiko Premium
                </button>
              </div>
            </div>
          ) : !unlockStats.canUnlock && unlockStats.isPaid ? (
            /* ── LIMIT REACHED (paid user) ── */
            <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-200">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center gap-3">
                <Crown className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white font-bold text-sm">Limiti ditor i arritur</span>
                {timeUntilReset && (
                  <span className="ml-auto text-white/80 text-xs">🕐 Hapet pas: {timeUntilReset}</span>
                )}
              </div>
              <div className="bg-white px-4 py-3">
                <p className="text-gray-600 text-sm">Keni zhbllokuar të gjitha <span className="font-bold text-amber-600">{PAID_DAILY_LIMIT} fjalët</span> Premium të sotit. Kthehuni nesër!</p>
              </div>
            </div>
          ) : (
            /* ── NORMAL — daily counter with dots ── */
            <div className={`border rounded-2xl p-3 md:p-4 ${unlockStats.isPaid ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlockStats.isPaid ? "bg-amber-100" : "bg-gradient-to-br from-purple-500 to-indigo-600"}`}>
                    {unlockStats.isPaid
                      ? <Crown className="w-5 h-5 text-amber-500" />
                      : <Unlock className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {unlockStats.isPaid ? "Premium" : "Plan Falas"} · {unlockStats.remainingUnlocks}/{unlockStats.dailyLimit} fjalë sot
                    </p>
                    {/* dot indicators */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {Array.from({ length: Math.min(unlockStats.dailyLimit, 15) }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all ${
                            i < unlockStats.todayUnlocks
                              ? unlockStats.isPaid ? "w-4 h-4 bg-amber-400" : "w-4 h-4 bg-purple-500"
                              : "w-4 h-4 border-2 border-gray-300 bg-white"
                          }`}
                        />
                      ))}
                      {unlockStats.dailyLimit > 15 && (
                        <span className="text-xs text-gray-400 font-medium">+{unlockStats.dailyLimit - 15}</span>
                      )}
                    </div>
                  </div>
                </div>
                {!unlockStats.isPaid && (
                  <a
                    href="/payments"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" /> Premium →{PAID_DAILY_LIMIT}/ditë
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Level Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
            <div className="text-xs md:text-sm font-semibold text-gray-700 mb-2">Niveli i gjuhës</div>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-all border ${
                    selectedLevel === level
                      ? level === "all"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/25"
                        : `${getLevelColor(level)} shadow-md`
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Cards */}
          <div className="flex flex-col sm:flex-row gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={startQuiz}
              disabled={selectedLevel === "all"}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedLevel === "all"
                  ? "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200"
                  : unlockStats.isPaid
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-md shadow-purple-500/20 hover:shadow-lg"
                    : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${unlockStats.isPaid ? "bg-white/20" : "bg-slate-200"}`}>
                {quizLoading ? <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current" /> : unlockStats.isPaid ? <Play className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  Kuiz Rregullt
                  {!unlockStats.isPaid && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className={`text-xs truncate ${unlockStats.isPaid ? "text-white/70" : "text-slate-400"}`}>
                  {unlockStats.isPaid ? `15 pyetje · ${selectedLevel}` : "Premium"}
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => unlockStats.isPaid ? startListenQuiz() : setShowDictPaywall(true)}
              disabled={selectedLevel === "all"}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedLevel === "all"
                  ? "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200"
                  : unlockStats.isPaid
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 border-transparent text-white shadow-md shadow-teal-500/20 hover:shadow-lg"
                    : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${unlockStats.isPaid ? "bg-white/20" : "bg-slate-200"}`}>
                {unlockStats.isPaid ? <Headphones className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  Kuiz Dëgjimi
                  {!unlockStats.isPaid && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className={`text-xs truncate ${unlockStats.isPaid ? "text-white/70" : "text-slate-400"}`}>
                  {unlockStats.isPaid ? `15 pyetje · ${selectedLevel}` : "Premium"}
                </div>
              </div>
            </motion.button>
          </div>

          {/* Favorites Toggle */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
            <button
              onClick={handleFavoritesToggle}
              className={`w-full md:w-auto flex items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                showFavorites
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Heart className={`h-3 w-3 md:h-3.5 md:w-3.5 ${showFavorites ? "fill-current" : ""}`} />
              <span>Të Preferuarat</span>
              {favorites.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${showFavorites ? "bg-white/20" : "bg-rose-50 text-rose-600"}`}>
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Words Grid */}
          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredWords.map((word) => {
                const isFavorite = favorites.some((fav) => fav._id === word._id)
                const firstExample = word.examples && word.examples.length > 0 ? word.examples[0] : null
                const isPlaying = playingWordId === word._id
                const isLocked = !word.isUnlocked

                return (
                  <div
                    key={word._id}
                    className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-300 p-3 flex flex-col h-full ${
                      isLocked
                        ? "border-gray-300 opacity-75"
                        : "border-gray-200/50 hover:shadow-lg hover:border-emerald-200/50"
                    }`}
                  >
                    {!isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    <div className="relative flex flex-col h-full">
                      {/* Lock Overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-slate-50/95 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4">
                          <Lock className="w-8 h-8 text-gray-400 mb-2" />
                          <button
                            onClick={() => handleUnlockWord(word._id)}
                            disabled={unlocking === word._id || !unlockStats.canUnlock}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                              unlocking === word._id
                                ? "bg-gray-200 text-gray-500 cursor-wait"
                                : !unlockStats.canUnlock
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl"
                            }`}
                          >
                            {unlocking === word._id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"></div>
                                <span>Duke Hapur...</span>
                              </div>
                            ) : (
                              "Hap Fjalën"
                            )}
                          </button>
                          {!unlockStats.canUnlock && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Limiti ditor u arrit
                            </p>
                          )}
                        </div>
                      )}

                      {/* Word Content */}
                      <div className={`${isLocked ? "blur-sm" : ""}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{word.word}</h3>
                            <p className="text-gray-600 text-xs font-medium leading-tight">{word.translation}</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => playPronunciation(word)}
                              disabled={isLocked}
                              className={`p-1.5 rounded-lg transition-all ${
                                isLocked
                                  ? "opacity-50 cursor-not-allowed"
                                  : isPlaying
                                  ? "text-emerald-600 bg-emerald-100"
                                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title="Luaj shqiptimin"
                            >
                              <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
                            </button>
                            <button
                              onClick={() => toggleFavorite(word._id)}
                              disabled={isLocked}
                              className={`p-1.5 rounded-lg transition-all ${
                                isLocked
                                  ? "opacity-50 cursor-not-allowed"
                                  : isFavorite
                                  ? "text-rose-500 bg-rose-50"
                                  : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                              }`}
                              title={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
                            >
                              <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getLevelColor(word.level)}`}>
                            {word.level}
                          </span>
                          {word.partOfSpeech && (
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getPartOfSpeechColor(word.partOfSpeech)}`}>
                              {word.partOfSpeech}
                            </span>
                          )}
                        </div>

                        {firstExample && firstExample.german && (
                          <div className="mt-auto bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg p-2 border border-emerald-200/30">
                            <p className="text-gray-700 text-xs italic leading-tight line-clamp-3">
                              "{firstExample.german}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-600 font-medium">
                  Faqja <span className="font-bold text-gray-900">{currentPage}</span> nga{" "}
                  <span className="font-bold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === 1
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                        : "bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 shadow-sm"
                    }`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">E mëparshme</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === totalPages
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                        : "bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 shadow-sm"
                    }`}
                  >
                    <span className="hidden sm:inline">E ardhshme</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredWords.length === 0 && !loading && (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center max-w-md">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Nuk u gjetën fjalë</h3>
                <p className="text-gray-600 leading-tight text-xs">
                  {showFavorites
                    ? "Ende nuk ka fjalë të preferuara"
                    : "Nuk ka fjalë të disponueshme për nivelin e zgjedhur"}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}

export default Dictionary