"use client"
import { useState, useEffect, useRef } from "react"
import { phraseService, ttsService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight, LockIcon, Plus, Eye, EyeOff, Clock, Sparkles, Check } from "lucide-react"

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

  // Text size mapping based on level - lower levels have shorter phrases so bigger text
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

      // Backend returns { url: "signed-url" } or { data: { url: "signed-url" } }
      let audioUrl = null

      if (typeof response === 'string') {
        audioUrl = response
      } else if (response?.url) {
        audioUrl = response.url
      } else if (response?.data?.url) {
        audioUrl = response.data.url
      }

      if (!audioUrl) {
        throw new Error("No audio URL in response")
      }

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl
      audioRef.current.onended = () => {
        setPlayingPhraseId(null)
      }
      audioRef.current.onerror = (e) => {
        console.error("[TTS] Audio playback error:", e)
        setPlayingPhraseId(null)
        // Fallback to browser TTS
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
      // Fallback to browser's built-in speech synthesis
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
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all ${currentPage === 1
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white active:scale-95"
            }`}
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
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 ${currentPage === pageNum
                ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-[#14B8A6]/30"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#14B8A6]"
                }`}
              style={{ fontFamily: fonts.poppins }}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all ${currentPage === totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6] hover:text-white active:scale-95"
            }`}
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
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>
            Kërkohet Autentifikimi
          </h2>
          <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>
            Ju lutem identifikohuni për të hyrë në fraza.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
          <p className="text-gray-600 font-medium text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>
            Duke u ngarkuar frazat...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: fonts.poppins }}>
            Gabim
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base" style={{ fontFamily: fonts.inter }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform text-sm sm:text-base"
            style={{ fontFamily: fonts.poppins }}
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  // Quiz Mode
  if (quizMode) {
    return (
<div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] p-3 sm:p-6">
        <div className="max-w-[700px] mx-auto">
          {quizComplete ? (
            <div className="bg-white rounded-2xl p-6 sm:p-10 text-center shadow-2xl">
              <h2
                className="text-2xl sm:text-3xl font-bold text-[#14B8A6] mb-4"
                style={{ fontFamily: fonts.poppins }}
              >
                Kuizi Përfundoi! 🎉
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-2" style={{ fontFamily: fonts.inter }}>
                Përshtatjet e saktë: {Object.keys(matches).length + 1} / {quizPhrases.length}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 mb-6 sm:mb-8" style={{ fontFamily: fonts.poppins }}>
                +5 XP
              </p>
              <div className="flex gap-3 justify-center flex-col sm:flex-row">
                <button
                  onClick={startQuiz}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform text-sm sm:text-base"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Fillo Kuizin Përsëri
                </button>
                <button
                  onClick={exitQuiz}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold active:scale-95 transition-transform text-sm sm:text-base"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Dil nga Kuizi
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-2 text-center" style={{ fontFamily: fonts.inter }}>
                  Përshtat Gjermanishten me Shqipen
                </p>
                <p className="text-lg sm:text-xl font-bold text-center text-[#14B8A6] mb-3" style={{ fontFamily: fonts.poppins }}>
                  {Object.keys(matches).length} / {quizPhrases.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] h-full rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(matches).length / quizPhrases.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Horizontal Layout - German Left, Albanian Right */}
              <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
                {/* German Section - Left */}
                <div>
                  <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase text-center" style={{ fontFamily: fonts.poppins }}>
                    🇩🇪 Gjermane
                  </h3>
                  <div className="space-y-1.5">
                    {quizPhrases.map((phrase) => {
                      const phraseId = phrase._id || phrase.id
                      const isMatched = matches[phraseId]
                      const isSelected = selectedGerman === phraseId
                      const textLength = phrase.german.length
                      const textSizeClass = textLength > 40 ? "text-[10px] sm:text-xs" : textLength > 25 ? "text-xs sm:text-sm" : "text-xs sm:text-sm"

                      return (
                        <button
                          key={phraseId}
                          onClick={() => {
                            if (!isMatched) {
                              if (isSelected) {
                                setSelectedGerman(null)
                              } else {
                                setSelectedGerman(phraseId)
                                if (selectedAlbanian) {
                                  handleMatchClick(phraseId, selectedAlbanian)
                                }
                              }
                            }
                          }}
                          disabled={isMatched}
                          className={`w-full px-2 py-1.5 sm:px-3 sm:py-2 text-left rounded-lg border-2 transition-all font-medium ${textSizeClass} leading-tight ${isMatched
                            ? "bg-green-100 border-green-500 text-green-700"
                            : isSelected
                              ? "bg-blue-100 border-blue-500 text-blue-700 shadow-md"
                              : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 active:bg-blue-50"
                            }`}
                          style={{ fontFamily: fonts.inter }}
                        >
                          {phrase.german}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Albanian Section - Right */}
                <div>
                  <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase text-center" style={{ fontFamily: fonts.poppins }}>
                    🇦🇱 Shqipe
                  </h3>
                  <div className="space-y-1.5">
                    {shuffledAlbanian.map((phrase) => {
                      const phraseId = phrase._id || phrase.id
                      const isMatched = Object.values(matches).includes(phraseId)
                      const isSelected = selectedAlbanian === phraseId
                      const textLength = phrase.albanian.length
                      const textSizeClass = textLength > 40 ? "text-[10px] sm:text-xs" : textLength > 25 ? "text-xs sm:text-sm" : "text-xs sm:text-sm"

                      return (
                        <button
                          key={phraseId}
                          onClick={() => {
                            if (!isMatched) {
                              if (selectedGerman) {
                                handleMatchClick(selectedGerman, phraseId)
                              } else {
                                setSelectedAlbanian(isSelected ? null : phraseId)
                              }
                            }
                          }}
                          disabled={isMatched}
                          className={`w-full px-2 py-1.5 sm:px-3 sm:py-2 text-left rounded-lg border-2 transition-all font-medium ${textSizeClass} leading-tight ${isMatched
                            ? "bg-green-100 border-green-500 text-green-700"
                            : isSelected
                              ? "bg-purple-100 border-purple-500 text-purple-700 shadow-md"
                              : "bg-white border-gray-300 text-gray-700 hover:border-purple-400 active:bg-purple-50"
                            }`}
                          style={{ fontFamily: fonts.inter }}
                        >
                          {phrase.albanian}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={exitQuiz}
                className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-[0.98] text-sm"
                style={{ fontFamily: fonts.poppins }}
              >
                Dil nga Kuizi
              </button>
            </div>
          )}

          {/* XP Animation */}
          {showXpAnimation && (
            <div
              className="fixed z-50 pointer-events-none flex items-center gap-2 animate-bounce"
              style={{
                left: '50%',
                top: '40%',
                transform: 'translate(-50%, -50%)',
                fontFamily: fonts.poppins,
              }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              <span className="text-3xl sm:text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Phrase List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1]">
      {/* Limit Warning */}
      {showLimitWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-2xl animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-xs sm:text-sm" style={{ fontFamily: fonts.poppins }}>
              Limiti ditor i arritur! Provoni pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min
            </span>
          </div>
        </div>
      )}

      {/* XP Animation */}
      {showXpAnimation && (
        <div
          className="fixed z-50 pointer-events-none flex items-center gap-2"
          style={{
            left: `${xpPosition.x}px`,
            top: `${xpPosition.y}px`,
            fontFamily: fonts.poppins,
            animation: 'floatUp 1.5s ease-out forwards',
          }}
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          <span className="text-3xl sm:text-4xl font-bold text-amber-500 drop-shadow-lg">+{animatedXp} XP</span>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="relative mb-4 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-xl sm:shadow-2xl p-4 sm:p-8">
          <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#14B8A6]/30">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#14B8A6] via-[#06B6D4] to-[#14B8A6] bg-clip-text text-transparent mb-1" style={{ fontFamily: fonts.poppins }}>
                Fraza Gjermane
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm" style={{ fontFamily: fonts.inter }}>
                Mëso fraza të zakonshme gjermane
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-md">
                <div className="text-lg sm:text-2xl font-bold text-amber-600" style={{ fontFamily: fonts.poppins }}>{progress.finishedPhrases || 0}</div>
                <div className="text-[10px] sm:text-xs text-amber-600/70">Përfunduar</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/50 shadow-md">
                <div className="text-lg sm:text-2xl font-bold text-teal-600" style={{ fontFamily: fonts.poppins }}>{progress.totalPhrases || 0}</div>
                <div className="text-[10px] sm:text-xs text-teal-600/70">Totali</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Limit Banner */}
        <div
          className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 ${dailyLimitInfo.dailyLimitReached
              ? "bg-red-50/80 border-red-300"
              : "bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-blue-300"
            }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${dailyLimitInfo.dailyLimitReached ? "bg-red-100" : "bg-blue-100"
                  }`}
              >
                <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${dailyLimitInfo.dailyLimitReached ? "text-red-500" : "text-blue-500"
                  }`} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm sm:text-lg" style={{ fontFamily: fonts.poppins }}>
                  {dailyLimitInfo.dailyLimitReached
                    ? "Limiti ditor!"
                    : `Fraza: ${dailyLimitInfo.remainingUnlocks}/${dailyLimitInfo.dailyLimit}`}
                </p>
                {!dailyLimitInfo.dailyLimitReached && (
                  <div className="w-24 sm:w-48 bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${((dailyLimitInfo.dailyLimit - dailyLimitInfo.remainingUnlocks) / dailyLimitInfo.dailyLimit) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            {dailyLimitInfo.dailyLimitReached && (
              <span className="text-xs sm:text-sm text-red-600 font-medium" style={{ fontFamily: fonts.inter }}>
                Pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min
              </span>
            )}
          </div>
        </div>

        {/* Level Selector */}
        <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${selectedLevel === level
                ? "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white shadow-lg shadow-[#14B8A6]/30"
                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-[#14B8A6]"
                }`}
              style={{ fontFamily: fonts.poppins }}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
          <button
            onClick={() => setShowGerman(!showGerman)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 font-semibold transition-all active:scale-95 text-xs sm:text-sm ${showGerman
                ? "bg-blue-50 border-blue-400 text-blue-700"
                : "bg-white border-gray-300 text-gray-500"
              }`}
            style={{ fontFamily: fonts.poppins }}
          >
            {showGerman ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden sm:inline">Gjermane</span>
            <span className="sm:hidden">DE</span>
          </button>

          <button
            onClick={() => setShowAlbanian(!showAlbanian)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 font-semibold transition-all active:scale-95 text-xs sm:text-sm ${showAlbanian
                ? "bg-purple-50 border-purple-400 text-purple-700"
                : "bg-white border-gray-300 text-gray-500"
              }`}
            style={{ fontFamily: fonts.poppins }}
          >
            {showAlbanian ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden sm:inline">Shqipe</span>
            <span className="sm:hidden">AL</span>
          </button>

          <button
            onClick={startQuiz}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-amber-500/30 active:scale-95 transition-transform text-xs sm:text-sm"
            style={{ fontFamily: fonts.poppins }}
          >
            📝 <span className="hidden sm:inline">Fillo</span> Kuizin
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
                const previousPhraseFinished =
                  index === 0 ||
                  finishedPhraseIds.includes(currentPhrases[index - 1]._id || currentPhrases[index - 1].id)
                const isLocked = !isFinished && !previousPhraseFinished
                const canUnlock = !isLocked && !isFinished && !dailyLimitInfo.dailyLimitReached
                const isPlaying = playingPhraseId === phraseId

                return (
                  <div
                    key={phraseId}
                    className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md transition-all ${isFinished
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                      : isLocked
                        ? "bg-gray-100/60 blur-[3px] border-2 border-gray-200 opacity-60"
                        : "bg-white border-2 border-gray-200 hover:border-[#14B8A6] hover:shadow-lg"
                      }`}
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
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isLocked
                                ? "border-gray-400 text-gray-400"
                                : isPlaying
                                  ? "border-[#14B8A6] bg-[#14B8A6] text-white"
                                  : "border-[#14B8A6] text-[#14B8A6] bg-white hover:bg-[#14B8A6] hover:text-white active:scale-90"
                                }`}
                            >
                              <Volume2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlaying ? "animate-pulse" : ""}`} />
                            </button>
                          </div>
                        )}

                        {showAlbanian && (
                          <p
                            className={`text-gray-600  ${levelTextSizes[selectedLevel].albanian}`}
                            style={{ fontFamily: fonts.inter }}
                          >
                            {phrase.albanian}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-amber-700 whitespace-nowrap" style={{ fontFamily: fonts.inter }}>
                          +{phrase.xp} XP
                        </span>

                        {!isFinished && !isLocked && canUnlock && (
                          <button
                            onClick={(e) => handleMarkAsFinished(phraseId, phrase.xp, e)}
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-green-500/40 hover:shadow-green-500/60 transition-all active:scale-90"
                          >
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        )}

                        {!isFinished && !isLocked && !canUnlock && (
                          <button
                            onClick={() => {
                              setShowLimitWarning(true)
                              setTimeout(() => setShowLimitWarning(false), 5000)
                            }}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red-300 bg-red-50 text-red-500 flex items-center justify-center"
                          >
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
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
  )
}

export default Phrase
