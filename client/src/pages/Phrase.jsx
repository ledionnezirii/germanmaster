"use client"
import { useState, useEffect } from "react"
import { phraseService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight, LockIcon, Plus, Eye, EyeOff, Clock } from "lucide-react"

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

  const itemsPerPage = 30

  // Daily limit state
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
    if (finishedPhraseIds.includes(phraseId)) {
      return
    }

    if (dailyLimitInfo.dailyLimitReached) {
      setShowLimitWarning(true)
      setTimeout(() => setShowLimitWarning(false), 5000)
      return
    }

    const button = event.currentTarget
    const rect = button.getBoundingClientRect()

    // Position XP animation at button center
    setXpPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    // Add visual feedback to button
    button.style.transform = "scale(0.85)"
    setTimeout(() => {
      button.style.transform = ""
    }, 150)

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

      // Trigger XP animation
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
      console.log("[v0] Quiz XP added successfully:", totalXp)
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

  const speakGerman = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    } else {
      alert("Shfletuesi juaj nuk mbështet leximin e tekstit.")
    }
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPhrases = phrases.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(phrases.length / itemsPerPage)

  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          data-testid="pagination-prev"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
          if (pageNum > totalPages) return null

          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                currentPage === pageNum
                  ? "bg-[#14B8A6] text-white border-[#0D9488] shadow-sm"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
              }`}
              data-testid={`pagination-page-${pageNum}`}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === totalPages
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          data-testid="pagination-next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const DailyLimitBanner = () => (
    <div
      className={`mb-4 p-3 md:p-4 rounded-xl border-2 ${
        dailyLimitInfo.dailyLimitReached
          ? "bg-red-50 border-red-200"
          : dailyLimitInfo.remainingUnlocks <= 3
            ? "bg-amber-50 border-amber-200"
            : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock
            className={`w-5 h-5 ${
              dailyLimitInfo.dailyLimitReached
                ? "text-red-500"
                : dailyLimitInfo.remainingUnlocks <= 3
                  ? "text-amber-500"
                  : "text-blue-500"
            }`}
          />
          <span className="text-sm md:text-base font-semibold" style={{ fontFamily: fonts.poppins }}>
            {dailyLimitInfo.dailyLimitReached
              ? "Limiti ditor i arritur!"
              : `Fraza të mbetura sot: ${dailyLimitInfo.remainingUnlocks}/${dailyLimitInfo.dailyLimit}`}
          </span>
        </div>
        {dailyLimitInfo.dailyLimitReached && (
          <span className="text-xs md:text-sm text-red-600" style={{ fontFamily: fonts.inter }}>
            Rifreskimi pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min
          </span>
        )}
      </div>
      {!dailyLimitInfo.dailyLimitReached && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                dailyLimitInfo.remainingUnlocks <= 3 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{
                width: `${((dailyLimitInfo.dailyLimit - dailyLimitInfo.remainingUnlocks) / dailyLimitInfo.dailyLimit) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )

  const LimitWarningPopup = () =>
    showLimitWarning && (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold" style={{ fontFamily: fonts.poppins }}>
            Keni arritur limitin ditor! Provoni përsëri pas {dailyLimitInfo.hoursUntilReset}h{" "}
            {dailyLimitInfo.minutesUntilReset}min
          </span>
        </div>
      </div>
    )

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto font-sans">
        <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg md:text-2xl font-bold text-red-700 mb-2 md:mb-3" style={{ fontFamily: fonts.poppins }}>
            Kërkohet Autentifikimi
          </h2>
          <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: fonts.inter }}>
            Ju lutem identifikohuni për të hyrë në fraza.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto font-sans">
        <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: fonts.inter }}>
            Duke u ngarkuar frazat...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto font-sans">
        <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg md:text-2xl font-bold text-red-700 mb-2 md:mb-3" style={{ fontFamily: fonts.poppins }}>
            Gabim
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6" style={{ fontFamily: fonts.inter }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] border-none rounded-lg text-white text-sm md:text-base font-semibold cursor-pointer transition-colors hover:from-[#0D9488] hover:to-[#0891B2]"
            style={{ fontFamily: fonts.poppins }}
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  if (quizMode) {
    return (
      <>
        <style jsx>{`
          @keyframes xp-float {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) translateY(0) scale(0.5);
              filter: blur(0px);
            }
            10% {
              opacity: 1;
              transform: translate(-50%, -50%) translateY(-10px) scale(1.2);
              filter: blur(0px);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) translateY(-60px) scale(1);
              filter: blur(0px);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) translateY(-120px) scale(0.8);
              filter: blur(2px);
            }
          }
          .animate-xp-float {
            animation: xp-float 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 0.6;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
        `}</style>

        <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] p-3 md:p-6">
          <div className="max-w-[900px] mx-auto font-sans">
            {quizComplete ? (
              <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                <h2
                  className="text-2xl md:text-4xl font-bold text-[#14B8A6] mb-4"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Kuizi Përfundoi!
                </h2>
                <p className="text-lg md:text-2xl text-gray-600 mb-2" style={{ fontFamily: fonts.inter }}>
                  Përshtatjet e saktë: {Object.keys(matches).length + 1} / {quizPhrases.length}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-amber-600 mb-8" style={{ fontFamily: fonts.poppins }}>
                  +{(Object.keys(matches).length + 1) * 1} XP
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] border-none rounded-lg text-white text-base font-semibold cursor-pointer transition-colors hover:from-[#0D9488] hover:to-[#0891B2]"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    Fillo Kuizin Përsëri
                  </button>
                  <button
                    onClick={exitQuiz}
                    className="px-6 py-3 bg-gray-200 border-none rounded-lg text-gray-700 text-base font-semibold cursor-pointer transition-colors hover:bg-gray-300"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    Dil nga Kuizi
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2 text-center" style={{ fontFamily: fonts.inter }}>
                    Përshtat Frazat Gjermane me Përkthimet Shqipe
                  </p>
                  <p
                    className="text-lg font-semibold text-center text-[#14B8A6] mb-4"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    {Object.keys(matches).length} / {quizPhrases.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#14B8A6] h-2 rounded-full transition-all"
                      style={{ width: `${(Object.keys(matches).length / quizPhrases.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                  <div>
                    <h3
                      className="text-sm font-bold text-gray-600 mb-3 uppercase"
                      style={{ fontFamily: fonts.poppins }}
                    >
                      Gjermane
                    </h3>
                    <div className="space-y-2">
                      {quizPhrases.map((phrase) => {
                        const phraseId = phrase._id || phrase.id
                        const isMatched = matches[phraseId]
                        const isSelected = selectedGerman === phraseId

                        return (
                          <button
                            key={phraseId}
                            onClick={() => {
                              if (!isMatched) {
                                setSelectedGerman(isSelected ? null : phraseId)
                              }
                            }}
                            disabled={isMatched}
                            className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all font-semibold text-sm md:text-base ${
                              isMatched
                                ? "bg-green-100 border-green-500 text-green-700 cursor-not-allowed"
                                : isSelected
                                  ? "bg-blue-100 border-blue-500 text-blue-700"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 cursor-pointer"
                            }`}
                            style={{ fontFamily: fonts.inter }}
                          >
                            {phrase.german}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-sm font-bold text-gray-600 mb-3 uppercase"
                      style={{ fontFamily: fonts.poppins }}
                    >
                      Shqipe
                    </h3>
                    <div className="space-y-2">
                      {shuffledAlbanian.map((phrase) => {
                        const phraseId = phrase._id || phrase.id
                        const isMatched = Object.values(matches).includes(phraseId)
                        const isSelected = selectedAlbanian === phraseId

                        return (
                          <button
                            key={phraseId}
                            onClick={() => {
                              if (selectedGerman && !isMatched) {
                                handleMatchClick(selectedGerman, phraseId)
                              } else if (!isMatched) {
                                setSelectedAlbanian(isSelected ? null : phraseId)
                              }
                            }}
                            disabled={isMatched}
                            className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all font-semibold text-sm md:text-base ${
                              isMatched
                                ? "bg-green-100 border-green-500 text-green-700 cursor-not-allowed"
                                : isSelected
                                  ? "bg-purple-100 border-purple-500 text-purple-700"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-purple-300 cursor-pointer"
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
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: fonts.poppins }}
                >
                  Dil nga Kuizi
                </button>
              </div>
            )}

            {showXpAnimation && (
              <div
                className="fixed text-3xl md:text-4xl font-bold text-amber-500 animate-xp-float z-[9999] pointer-events-none"
                style={{
                  left: `${xpPosition.x}px`,
                  top: `${xpPosition.y}px`,
                  fontFamily: fonts.poppins,
                  textShadow: "0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4)",
                }}
              >
                +{animatedXp} XP
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes xp-float {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(0) scale(0.5);
            filter: blur(0px);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-10px) scale(1.2);
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-60px) scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-120px) scale(0.8);
            filter: blur(2px);
          }
        }
        
        .animate-xp-float {
          animation: xp-float 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        .plus-button {
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .plus-button:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        
        .plus-button:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        .plus-button::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
        }
        
        .plus-button::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.3);
          transform: scale(0);
          opacity: 0;
        }
        
        .plus-button:active:not(:disabled)::after {
          animation: ripple 0.6s ease-out;
        }
      `}</style>

      <LimitWarningPopup />

      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#CCFBF1] p-3 md:p-6">
        <div className="max-w-[1200px] mx-auto font-sans">
          <div className="relative mb-6 md:mb-8 overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-4 md:p-8 shadow-xl backdrop-blur-md">
            <div className="absolute -top-[50px] -right-[50px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(20,184,166,0.15),transparent_70%)] rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute -bottom-[30px] -left-[30px] w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(6,182,212,0.15),transparent_70%)] rounded-full blur-[40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 text-center md:flex-row md:text-left">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] shadow-lg">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="mb-1 md:mb-2 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] bg-clip-text text-2xl md:text-4xl font-bold text-transparent">
                  Fraza Gjermane
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Mëso fraza të zakonshme gjermane me përkthime në shqip
                </p>
              </div>
            </div>
          </div>

          <DailyLimitBanner />

          {showXpAnimation && (
            <div
              className="fixed text-3xl md:text-4xl font-bold text-amber-500 animate-xp-float z-[9999] pointer-events-none"
              style={{
                left: `${xpPosition.x}px`,
                top: `${xpPosition.y}px`,
                fontFamily: fonts.poppins,
                textShadow: "0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4)",
              }}
            >
              +{animatedXp} XP
            </div>
          )}

          <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 md:px-5 md:py-2.5 border-2 rounded-lg text-sm md:text-base font-semibold cursor-pointer transition-all ${
                  selectedLevel === level
                    ? "bg-[#14B8A6] text-white border-[#0D9488]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
                style={{ fontFamily: fonts.poppins }}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
            <button
              onClick={() => setShowGerman(!showGerman)}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-sm md:text-base font-semibold text-blue-700 cursor-pointer hover:bg-blue-100 transition-all"
              style={{ fontFamily: fonts.poppins }}
            >
              {showGerman ? <Eye size={18} /> : <EyeOff size={18} />}
              Gjermane
            </button>
            <button
              onClick={() => setShowAlbanian(!showAlbanian)}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-50 border-2 border-purple-300 rounded-lg text-sm md:text-base font-semibold text-purple-700 cursor-pointer hover:bg-purple-100 transition-all"
              style={{ fontFamily: fonts.poppins }}
            >
              {showAlbanian ? <Eye size={18} /> : <EyeOff size={18} />}
              Shqipe
            </button>
            <button
              onClick={startQuiz}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-amber-50 border-2 border-amber-300 rounded-lg text-sm md:text-base font-semibold text-amber-700 cursor-pointer hover:bg-amber-100 transition-all"
              style={{ fontFamily: fonts.poppins }}
            >
              📝 Fillo Kuizin
            </button>
          </div>

          {currentPhrases.length === 0 ? (
            <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: fonts.inter }}>
                Nuk ka fraza të disponueshme për nivelin {selectedLevel}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                {currentPhrases.map((phrase, index) => {
                  const isFinished = finishedPhraseIds.includes(phrase._id || phrase.id)
                  const phraseId = phrase._id || phrase.id
                  const previousPhraseFinished =
                    index === 0 ||
                    finishedPhraseIds.includes(currentPhrases[index - 1]._id || currentPhrases[index - 1].id)
                  const isLocked = !isFinished && !previousPhraseFinished
                  const canUnlock = !isLocked && !isFinished && !dailyLimitInfo.dailyLimitReached

                  return (
                    <div
                      key={phraseId}
                      className={`rounded-lg p-2 md:p-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all ${
                        isFinished ? "bg-green-50" : isLocked ? "bg-gray-100 opacity-60 blur-sm" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2 md:gap-4">
                        <div className="flex-1 min-w-0">
                          {showGerman && (
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                              <p
                                className="text-sm md:text-base font-semibold text-gray-900 m-0 leading-snug"
                                style={{ fontFamily: fonts.poppins }}
                              >
                                {phrase.german}
                              </p>
                              <button
                                onClick={() => !isLocked && speakGerman(phrase.german)}
                                disabled={isLocked}
                                className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                                  isLocked
                                    ? "border-gray-400 text-gray-400 cursor-not-allowed"
                                    : "border-[#14B8A6] text-[#14B8A6] hover:bg-[#F0FDFA]"
                                } bg-white cursor-pointer flex items-center justify-center transition-all p-0 flex-shrink-0`}
                                title={isLocked ? "Locked" : "Dëgjo frazën gjermane"}
                              >
                                <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
                              </button>
                            </div>
                          )}
                          {showAlbanian && (
                            <p
                              className="text-xs md:text-sm text-gray-600 m-0 leading-snug"
                              style={{ fontFamily: fonts.inter }}
                            >
                              {phrase.albanian}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                          <span
                            className="text-xs md:text-sm font-semibold text-amber-700 whitespace-nowrap"
                            style={{ fontFamily: fonts.inter }}
                          >
                            +{phrase.xp} XP
                          </span>

                          {!isFinished && !isLocked && canUnlock && (
                            <button
                              onClick={(e) => handleMarkAsFinished(phraseId, phrase.xp, e)}
                              className="plus-button w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-green-500 bg-white text-green-500 text-xl md:text-2xl font-bold cursor-pointer flex items-center justify-center p-0 flex-shrink-0 hover:bg-green-50"
                              title="Përfundo frazën"
                            >
                              <Plus className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                          )}

                          {!isFinished && !isLocked && !canUnlock && (
                            <button
                              onClick={() => {
                                setShowLimitWarning(true)
                                setTimeout(() => setShowLimitWarning(false), 5000)
                              }}
                              className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-red-300 bg-red-50 text-red-400 text-lg md:text-xl flex items-center justify-center cursor-pointer"
                              title="Limiti ditor i arritur"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}

                          {!isFinished && isLocked && (
                            <span className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-300 text-gray-500 text-lg md:text-xl flex items-center justify-center">
                              <LockIcon />
                            </span>
                          )}

                          {isFinished && (
                            <span className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-green-500 text-white text-lg md:text-xl flex items-center justify-center">
                              ✓
                            </span>
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
