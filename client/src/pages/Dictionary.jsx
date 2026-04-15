"use client"

import { useState, useEffect, useRef } from "react"
import { dictionaryService, favoritesService, ttsService, wordsService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import SEO from "../components/SEO"
import { BookOpen, Volume2, Heart, ChevronLeft, ChevronRight, Play, X, CheckCircle, XCircle, Trophy, Lock, Unlock, ArrowLeft, Crown, Headphones, Check, RotateCcw, Sparkles } from 'lucide-react'
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={closeQuiz}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Kthehu te Fjalori</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">Niveli {selectedLevel}</span>
              <button
                onClick={finishQuiz}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm border border-red-200 transition-all"
              >
                Përfundo Kuizin
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              {!showResult ? (
                <>
                  {/* Progress */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-500 font-medium">Pyetja {currentQuestionIndex + 1} nga {quizQuestions.length}</span>
                    <span className="text-purple-600 font-bold">{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <div className="text-center mb-8">
                    <p className="text-sm text-slate-500 mb-2">Çfarë do të thotë:</p>
                    <h2 className="text-3xl font-bold text-slate-800">
                      {quizQuestions[currentQuestionIndex]?.word}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {quizQuestions[currentQuestionIndex]?.options.map((option, index) => {
                      const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer
                      const isSelected = selectedAnswer === option
                      let cls = "bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200"
                      if (answerSubmitted) {
                        if (isCorrect) cls = "bg-emerald-50 border-emerald-500"
                        else if (isSelected && !isCorrect) cls = "bg-red-50 border-red-400"
                      }
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={answerSubmitted}
                          className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all duration-300 flex items-center justify-between ${cls} ${answerSubmitted ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <span className={isCorrect && answerSubmitted ? "text-emerald-700" : isSelected && !isCorrect && answerSubmitted ? "text-red-600" : "text-slate-700"}>{option}</span>
                          {answerSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                          {answerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-center text-sm text-slate-500 mt-4">
                    Përgjigje të sakta: <span className="font-bold text-emerald-600">{correctAnswers}</span> / {currentQuestionIndex + (answerSubmitted ? 1 : 0)}
                  </div>
                </>
              ) : (
                /* Result screen */
                <div className="text-center py-6">
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${correctAnswers >= 9 ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30" : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"}`}>
                    {correctAnswers >= 9 ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-2">{correctAnswers >= 9 ? "Urime! 🎉" : "Provoni përsëri!"}</h3>
                  <p className="text-slate-500 mb-6">{correctAnswers >= 9 ? "E kaluat kuizin me sukses!" : "Ju nevojiten të paktën 9 përgjigje të sakta."}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-5">
                      <div className={`text-4xl font-bold mb-1 ${correctAnswers >= 9 ? "text-emerald-500" : "text-amber-500"}`}>{Math.round((correctAnswers / quizQuestions.length) * 100)}%</div>
                      <div className="text-sm text-slate-500 font-medium">Rezultati</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5">
                      <div className={`text-4xl font-bold mb-1 ${correctAnswers >= 9 ? "text-emerald-500" : "text-amber-500"}`}>{correctAnswers}/{quizQuestions.length}</div>
                      <div className="text-sm text-slate-500 font-medium">Sakta</div>
                    </div>
                  </div>

                  {correctAnswers >= 9 && xpAwarded && (
                    <div className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl mb-6">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-amber-700">+5 XP të fituara!</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={closeQuiz} className="flex-1 py-4 rounded-2xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                      Kthehu
                    </button>
                    <button onClick={() => { closeQuiz(); startQuiz() }} className="flex-1 py-4 rounded-2xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all">
                      Provo Përsëri
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    <div className="text-2xl font-bold text-teal-600" style={{ fontFamily: fonts.poppins }}>{listenScore}/{listenWords.length}</div>
                    <div className="text-[11px] text-teal-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Saktë</div>
                  </div>
                  <div className="flex-1 text-center bg-amber-50 rounded-xl py-3 px-2 border border-amber-100">
                    <div className="text-2xl font-bold text-amber-600" style={{ fontFamily: fonts.poppins }}>+{listenScore} XP</div>
                    <div className="text-[11px] text-amber-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Pikë Fituar</div>
                  </div>
                  <div className="flex-1 text-center bg-blue-50 rounded-xl py-3 px-2 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: fonts.poppins }}>{Math.round((listenScore / listenWords.length) * 100)}%</div>
                    <div className="text-[11px] text-blue-600/70 mt-0.5" style={{ fontFamily: fonts.inter }}>Saktësi</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={startListenQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold shadow-md shadow-teal-500/20 active:scale-95 transition-transform text-sm" style={{ fontFamily: fonts.poppins }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Fillo Përsëri
                  </button>
                  <button onClick={closeListenQuiz} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all text-sm" style={{ fontFamily: fonts.poppins }}>
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
                  <button onClick={closeListenQuiz} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex-1 bg-white/25 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-white font-bold text-sm flex-shrink-0" style={{ fontFamily: fonts.poppins }}>{listenIdx + 1}/{listenWords.length}</span>
                </div>
                <p className="text-white/80 text-xs text-center font-medium" style={{ fontFamily: fonts.inter }}>Dëgjo dhe gjej fjalën e saktë</p>
              </div>

              <div className="p-5">
                {/* Play button */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-3">
                    {listenPlaying && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-teal-400 opacity-30" style={{ animation: "pulse-ring 1s ease-out infinite" }} />
                        <span className="absolute inset-0 rounded-full bg-teal-400 opacity-20" style={{ animation: "pulse-ring 1s ease-out infinite", animationDelay: "0.3s" }} />
                      </>
                    )}
                    <button
                      onClick={() => playListenAudio(currentWord)}
                      disabled={listenPlaying}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-teal-500/40 active:scale-95 transition-transform disabled:opacity-70"
                    >
                      {listenPlaying ? <Volume2 className="w-10 h-10 animate-pulse" /> : <Play className="w-10 h-10 ml-1" />}
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-500" style={{ fontFamily: fonts.inter }}>
                    {listenPlaying ? "Duke luajtur..." : "Kliko për të dëgjuar"}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {listenOptions.map((option, idx) => {
                    const isCorrect = option._id === correctId
                    const isSelected = listenSelected === option._id
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
                      <button key={option._id} onClick={() => handleListenAnswer(option)} disabled={answered} className={btnClass} style={{ fontFamily: fonts.inter }}>
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
                              {idx + 1}
                            </div>
                          )}
                          <div className="flex-1">
                            <div>{option.translation}</div>
                            {answered && isCorrect && (
                              <div className="text-sm text-white/80 mt-0.5 font-normal">{option.word}</div>
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
        </div>

        {showXpAnimation && (
          <div className="fixed z-50 pointer-events-none flex items-center gap-2" style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)", fontFamily: fonts.poppins, animation: "floatUp 1.8s ease-out forwards" }}>
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
          </div>
        )}
      </div>
      </>
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

          {/* Level Selection & Quiz Button */}
          <div className="bg-white/80 backdrop-blur-sm flex flex-col md:flex-row md:items-center gap-3 rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
            <div className="space-y-2 md:space-y-3 flex-1">
              <div className="text-xs md:text-sm font-semibold text-gray-700">Niveli i gjuhës</div>
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

            <button
              onClick={startQuiz}
              disabled={quizLoading || selectedLevel === "all"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedLevel === "all"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
              }`}
            >
              {quizLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"></div>
              ) : unlockStats.isPaid ? (
                <Play className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4 text-amber-300" />
              )}
              <span>Fillo Kuizin</span>
            </button>

            <button
              onClick={startListenQuiz}
              disabled={selectedLevel === "all"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedLevel === "all"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30"
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Kuizi i Dëgjimit</span>
            </button>
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