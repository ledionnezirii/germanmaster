"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { phraseService, ttsService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight, LockIcon, Plus, Eye, EyeOff, Clock, Sparkles } from "lucide-react"

const Phrase = () => {
  const fonts = {
    poppins: ["Poppins", "sans-serif"].join(", "),
    inter: ["Inter", "sans-serif"].join(", "),
  }

  const { user, isAuthenticated } = useAuth()
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
  const [playingPhraseId, setPlayingPhraseId] = useState(null)
  const audioRef = useRef(null)

  const itemsPerPage = 30

  const [dailyLimitInfo, setDailyLimitInfo] = useState({
    dailyLimit: 5,
    dailyUnlocksUsed: 0,
    remainingUnlocks: 10,
    dailyLimitReached: false,
    hoursUntilReset: 0,
    minutesUntilReset: 0,
  })
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.1 }
    }
  }

  const phraseCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      setLoading(false)
      setError("Ju lutem identifikohuni për të parë frazat")
    }
  }, [selectedLevel, isAuthenticated])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedLevel])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

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
      const response = await phraseService.getPhrasesByLevel(selectedLevel, { limit: 100 })
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
      setShowLimitWarning(true)
      setTimeout(() => setShowLimitWarning(false), 5000)
      return
    }

    const button = event.currentTarget
    const rect = button.getBoundingClientRect()

    setXpPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    try {
      const response = await phraseService.markPhraseAsFinished(phraseId)
      setFinishedPhraseIds((prev) => [...prev, phraseId])

      if (response.data) {
        setDailyLimitInfo((prev) => ({
          ...prev,
          dailyUnlocksUsed: response.data.dailyUnlocksUsed,
          remainingUnlocks: response.data.remainingUnlocks,
          dailyLimitReached: response.data.remainingUnlocks <= 0,
        }))
      }

      setAnimatedXp(xp)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)

      await fetchProgress()
    } catch (error) {
      console.error("Error marking phrase:", error)
      if (error.response?.status === 429 && error.response?.data?.dailyLimitReached) {
        setDailyLimitInfo({
          dailyLimit: 5,
          dailyUnlocksUsed: 5,
          remainingUnlocks: 0,
          dailyLimitReached: true,
          hoursUntilReset: error.response.data.hoursUntilReset,
          minutesUntilReset: error.response.data.minutesUntilReset,
        })
        setShowLimitWarning(true)
        setTimeout(() => setShowLimitWarning(false), 5000)
      } else {
        alert("Nuk mund të përditësohet statusi i frazës. Ju lutem provoni përsëri.")
      }
    }
  }

  const startQuiz = () => {
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
    setQuizComplete(false)
    setQuizScore(0)
    setQuizMode(true)
  }

  const handleMatchClick = (germanId, albanianId) => {
    const germanPhrase = quizPhrases.find((p) => (p._id || p.id) === germanId)
    const albanianPhrase = shuffledAlbanian.find((p) => (p._id || p.id) === albanianId)

    if (!germanPhrase || !albanianPhrase) return

    const isCorrectMatch = germanId === albanianId

    if (isCorrectMatch) {
      setMatches((prev) => ({
        ...prev,
        [germanId]: albanianId,
      }))
      if (Object.keys(matches).length + 1 === quizPhrases.length) {
        finishQuiz()
      } else {
        setQuizScore((prev) => prev + 1)
        setSelectedGerman(null)
        setSelectedAlbanian(null)
      }
    } else {
      setSelectedGerman(null)
      setSelectedAlbanian(null)
    }
  }

  const finishQuiz = async () => {
    setQuizComplete(true)
    const totalXp = (Object.keys(matches).length + 1) * 1

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
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }

    try {
      setPlayingPhraseId(phraseId)
      const response = await ttsService.getPhraseAudio(phraseId, phrase.german, selectedLevel)
      const audioBlob = response.data || response
      
      if (!audioBlob || !audioBlob.size) throw new Error("Invalid audio response")
      
      const audioUrl = URL.createObjectURL(audioBlob)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl
      audioRef.current.onended = () => {
        setPlayingPhraseId(null)
        URL.revokeObjectURL(audioUrl)
      }
      audioRef.current.onerror = () => {
        setPlayingPhraseId(null)
        URL.revokeObjectURL(audioUrl)
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center items-center gap-2 mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-xl border-2 transition-all ${currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white"
            }`}
        >
          <ChevronLeft size={20} />
        </motion.button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
          if (pageNum > totalPages) return null

          return (
            <motion.button
              key={pageNum}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${currentPage === pageNum
                  ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-[#14B8A6]/30"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#14B8A6]"
                }`}
              style={{ fontFamily: fonts.poppins }}
            >
              {pageNum}
            </motion.button>
          )
        })}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-xl border-2 transition-all ${currentPage === totalPages
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white"
            }`}
        >
          <ChevronRight size={20} />
        </motion.button>
      </motion.div>
    )
  }

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[1200px] mx-auto p-6"
      >
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>
            Kërkohet Autentifikimi
          </h2>
          <p className="text-gray-600" style={{ fontFamily: fonts.inter }}>
            Ju lutem identifikohuni për të hyrë në fraza.
          </p>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-200 border-t-[#14B8A6] rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium" style={{ fontFamily: fonts.inter }}>
            Duke u ngarkuar frazat...
          </p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1200px] mx-auto p-6"
      >
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>
            Gabim
          </h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: fonts.inter }}>
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="px-6 py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-lg"
            style={{ fontFamily: fonts.poppins }}
          >
            Provo Përsëri
          </motion.button>
        </div>
      </motion.div>
    )
  }

  if (quizMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] p-4 md:p-6"
        >
          <div className="max-w-[900px] mx-auto">
            {quizComplete ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-2xl"
              >
                <motion.h2
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-3xl md:text-4xl font-bold text-[#14B8A6] mb-4"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Kuizi Përfundoi! 🎉
                </motion.h2>
                <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: fonts.inter }}>
                  Përshtatjet e saktë: {Object.keys(matches).length + 1} / {quizPhrases.length}
                </p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-3xl font-bold text-amber-600 mb-8"
                  style={{ fontFamily: fonts.poppins }}
                >
                  +{(Object.keys(matches).length + 1) * 1} XP
                </motion.p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-lg"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    Fillo Kuizin Përsëri
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exitQuiz}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    Dil nga Kuizi
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl"
              >
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 text-center" style={{ fontFamily: fonts.inter }}>
                    Përshtat Frazat Gjermane me Përkthimet Shqipe
                  </p>
                  <p className="text-xl font-bold text-center text-[#14B8A6] mb-4" style={{ fontFamily: fonts.poppins }}>
                    {Object.keys(matches).length} / {quizPhrases.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Object.keys(matches).length / quizPhrases.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] h-3 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase" style={{ fontFamily: fonts.poppins }}>
                      Gjermane
                    </h3>
                    <div className="space-y-2">
                      {quizPhrases.map((phrase) => {
                        const phraseId = phrase._id || phrase.id
                        const isMatched = matches[phraseId]
                        const isSelected = selectedGerman === phraseId

                        return (
                          <motion.button
                            key={phraseId}
                            whileHover={{ scale: isMatched ? 1 : 1.02 }}
                            whileTap={{ scale: isMatched ? 1 : 0.98 }}
                            onClick={() => {
                              if (!isMatched) {
                                setSelectedGerman(isSelected ? null : phraseId)
                              }
                            }}
                            disabled={isMatched}
                            className={`w-full px-4 py-3 text-left rounded-xl border-2 transition-all font-semibold ${isMatched
                                ? "bg-green-100 border-green-500 text-green-700"
                                : isSelected
                                  ? "bg-blue-100 border-blue-500 text-blue-700 shadow-lg"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                              }`}
                            style={{ fontFamily: fonts.inter }}
                          >
                            {phrase.german}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase" style={{ fontFamily: fonts.poppins }}>
                      Shqipe
                    </h3>
                    <div className="space-y-2">
                      {shuffledAlbanian.map((phrase) => {
                        const phraseId = phrase._id || phrase.id
                        const isMatched = Object.values(matches).includes(phraseId)
                        const isSelected = selectedAlbanian === phraseId

                        return (
                          <motion.button
                            key={phraseId}
                            whileHover={{ scale: isMatched ? 1 : 1.02 }}
                            whileTap={{ scale: isMatched ? 1 : 0.98 }}
                            onClick={() => {
                              if (selectedGerman && !isMatched) {
                                handleMatchClick(selectedGerman, phraseId)
                              } else if (!isMatched) {
                                setSelectedAlbanian(isSelected ? null : phraseId)
                              }
                            }}
                            disabled={isMatched}
                            className={`w-full px-4 py-3 text-left rounded-xl border-2 transition-all font-semibold ${isMatched
                                ? "bg-green-100 border-green-500 text-green-700"
                                : isSelected
                                  ? "bg-purple-100 border-purple-500 text-purple-700 shadow-lg"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                              }`}
                            style={{ fontFamily: fonts.inter }}
                          >
                            {phrase.albanian}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exitQuiz}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Dil nga Kuizi
                </motion.button>
              </motion.div>
            )}

            <AnimatePresence>
              {showXpAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -100, scale: 1.2 }}
                  exit={{ opacity: 0, y: -150, scale: 0.8 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="fixed z-50 pointer-events-none flex items-center gap-2"
                  style={{
                    left: `${xpPosition.x}px`,
                    top: `${xpPosition.y}px`,
                    fontFamily: fonts.poppins,
                    textShadow: "0 0 30px rgba(245, 158, 11, 0.8)",
                  }}
                >
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span className="text-4xl font-bold text-amber-500">+{animatedXp} XP</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1]">
      <AnimatePresence>
        {showLimitWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold" style={{ fontFamily: fonts.poppins }}>
                Keni arritur limitin ditor! Provoni përsëri pas {dailyLimitInfo.hoursUntilReset}h{" "}
                {dailyLimitInfo.minutesUntilReset}min
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showXpAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -100, scale: 1.2 }}
            exit={{ opacity: 0, y: -150, scale: 0.8 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none flex items-center gap-2"
            style={{
              left: `${xpPosition.x}px`,
              top: `${xpPosition.y}px`,
              fontFamily: fonts.poppins,
              textShadow: "0 0 30px rgba(245, 158, 11, 0.8)",
            }}
          >
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="text-4xl font-bold text-amber-500">+{animatedXp} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-6 md:mb-8 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl p-6 md:p-10"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-amber-400/15 to-orange-400/15 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="flex-shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#14B8A6]/30">
                <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </motion.div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#14B8A6] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent mb-2" style={{ fontFamily: fonts.poppins }}>
                Fraza Gjermane
              </h1>
              <p className="text-gray-600" style={{ fontFamily: fonts.inter }}>
                Mëso fraza të zakonshme gjermane me përkthime në shqip
              </p>
            </div>

            <div className="flex gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center px-4 py-2 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-lg"
              >
                <div className="text-2xl font-bold text-amber-600" style={{ fontFamily: fonts.poppins }}>{progress.finishedPhrases || 0}</div>
                <div className="text-xs text-amber-600/70">Përfunduar</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center px-4 py-2 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/50 shadow-lg"
              >
                <div className="text-2xl font-bold text-teal-600" style={{ fontFamily: fonts.poppins }}>{progress.totalPhrases || 0}</div>
                <div className="text-xs text-teal-600/70">Totali</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Daily Limit Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 p-4 rounded-2xl border-2 ${
            dailyLimitInfo.dailyLimitReached
              ? "bg-red-50/80 border-red-300"
              : "bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: dailyLimitInfo.dailyLimitReached ? 360 : 0 }}
                transition={{ duration: 0.5 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  dailyLimitInfo.dailyLimitReached ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                <Clock className={`w-6 h-6 ${
                  dailyLimitInfo.dailyLimitReached ? "text-red-500" : "text-blue-500"
                }`} />
              </motion.div>
              <div>
                <p className="font-bold text-slate-800 text-lg" style={{ fontFamily: fonts.poppins }}>
                  {dailyLimitInfo.dailyLimitReached
                    ? "Limiti ditor i arritur!"
                    : `Fraza të mbetura: ${dailyLimitInfo.remainingUnlocks}/${dailyLimitInfo.dailyLimit}`}
                </p>
                {!dailyLimitInfo.dailyLimitReached && (
                  <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((dailyLimitInfo.dailyLimit - dailyLimitInfo.remainingUnlocks) / dailyLimitInfo.dailyLimit) * 100}%` }}
                      className="bg-blue-500 h-2 rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>
            {dailyLimitInfo.dailyLimitReached && (
              <span className="text-sm text-red-600 font-medium" style={{ fontFamily: fonts.inter }}>
                Rifreskimi pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min
              </span>
            )}
          </div>
        </motion.div>

        {/* Level Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-4 flex-wrap"
        >
          {levels.map((level) => (
            <motion.button
              key={level}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLevel(level)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedLevel === level
                  ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-xl shadow-[#14B8A6]/30"
                  : "bg-white text-gray-600 border-2 border-gray-200 hover:border-[#14B8A6]"
                }`}
              style={{ fontFamily: fonts.poppins }}
            >
              {level}
            </motion.button>
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-6 flex-wrap"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGerman(!showGerman)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold transition-all ${
              showGerman
                ? "bg-blue-50 border-blue-400 text-blue-700"
                : "bg-white border-gray-300 text-gray-500"
            }`}
            style={{ fontFamily: fonts.poppins }}
          >
            {showGerman ? <Eye size={18} /> : <EyeOff size={18} />}
            Gjermane
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAlbanian(!showAlbanian)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold transition-all ${
              showAlbanian
                ? "bg-purple-50 border-purple-400 text-purple-700"
                : "bg-white border-gray-300 text-gray-500"
            }`}
            style={{ fontFamily: fonts.poppins }}
          >
            {showAlbanian ? <Eye size={18} /> : <EyeOff size={18} />}
            Shqipe
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startQuiz}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/30"
            style={{ fontFamily: fonts.poppins }}
          >
            📝 Fillo Kuizin
          </motion.button>
        </motion.div>

        {/* Phrases Grid */}
        {currentPhrases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-xl"
          >
            <p className="text-gray-600" style={{ fontFamily: fonts.inter }}>
              Nuk ka fraza të disponueshme për nivelin {selectedLevel}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6"
            >
              {currentPhrases.map((phrase, index) => {
                const isFinished = finishedPhraseIds.includes(phrase._id || phrase.id)
                const phraseId = phrase._id || phrase.id
                const previousPhraseFinished =
                  index === 0 ||
                  finishedPhraseIds.includes(currentPhrases[index - 1]._id || currentPhrases[index - 1].id)
                const isLocked = !isFinished && !previousPhraseFinished
                const canUnlock = !isLocked && !isFinished && !dailyLimitInfo.dailyLimitReached
                const isPlaying = playingPhraseId === phraseId

                return (
                  <motion.div
                    key={phraseId}
                    variants={phraseCardVariants}
                    whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
                    className={`rounded-2xl p-4 shadow-lg transition-all ${isFinished
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                        : isLocked
                          ? "bg-gray-100/60 blur-[2px] border-2 border-gray-200"
                          : "bg-white border-2 border-gray-200 hover:border-[#14B8A6] hover:shadow-xl"
                      }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                          {showGerman && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 mb-1"
                            >
                              <p className="font-bold text-gray-900 text-base" style={{ fontFamily: fonts.poppins }}>
                                {phrase.german}
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => !isLocked && speakGerman(phrase)}
                                disabled={isLocked}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isLocked
                                    ? "border-gray-400 text-gray-400"
                                    : isPlaying
                                      ? "border-[#14B8A6] bg-[#14B8A6] text-white"
                                      : "border-[#14B8A6] text-[#14B8A6] bg-white hover:bg-[#14B8A6] hover:text-white"
                                  }`}
                              >
                                <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                          {showAlbanian && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-gray-600 text-sm"
                              style={{ fontFamily: fonts.inter }}
                            >
                              {phrase.albanian}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold text-amber-700 whitespace-nowrap" style={{ fontFamily: fonts.inter }}>
                          +{phrase.xp} XP
                        </span>

                        {!isFinished && !isLocked && canUnlock && (
                          <motion.button
                            whileHover={{ scale: 1.15, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleMarkAsFinished(phraseId, phrase.xp, e)}
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-green-500/40 hover:shadow-green-500/60 transition-all"
                          >
                            <Plus className="w-6 h-6" />
                          </motion.button>
                        )}

                        {!isFinished && !isLocked && !canUnlock && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setShowLimitWarning(true)
                              setTimeout(() => setShowLimitWarning(false), 5000)
                            }}
                            className="w-10 h-10 rounded-full border-2 border-red-300 bg-red-50 text-red-500 flex items-center justify-center"
                          >
                            <Clock className="w-5 h-5" />
                          </motion.button>
                        )}

                        {!isFinished && isLocked && (
                          <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center">
                            <LockIcon className="w-5 h-5" />
                          </div>
                        )}

                        {isFinished && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-lg"
                          >
                            ✓
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            <Pagination />
          </>
        )}
      </div>
    </div>
  )
}

export default Phrase