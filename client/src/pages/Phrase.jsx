"use client"

import { useState, useEffect } from "react"
import { phraseService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Volume2, BookOpen, ChevronLeft, ChevronRight } from "lucide-react"

const Phrase = () => {
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
  const itemsPerPage = 30

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
      setProgress(response.data || { totalPhrases: 0, finishedPhrases: 0, percentage: 0 })
    } catch (error) {
      console.error("Error fetching progress:", error)
      setProgress({ totalPhrases: 0, finishedPhrases: 0, percentage: 0 })
    }
  }

  const handleMarkAsFinished = async (phraseId, xp, event) => {
    if (finishedPhraseIds.includes(phraseId)) {
      return
    }

    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    setXpPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    try {
      await phraseService.markPhraseAsFinished(phraseId)
      setFinishedPhraseIds((prev) => [...prev, phraseId])

      setAnimatedXp(xp)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)

      await fetchProgress()
    } catch (error) {
      console.error("Error marking phrase:", error)
      alert("Nuk mund të përditësohet statusi i frazës. Ju lutem provoni përsëri.")
    }
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
                  ? "bg-orange-500 text-white border-orange-600 shadow-sm"
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto font-sans">
        <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg md:text-2xl font-bold text-red-700 mb-2 md:mb-3 font-[Poppins,sans-serif]">
            Kërkohet Autentifikimi
          </h2>
          <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif]">
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
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif]">Duke u ngarkuar frazat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto font-sans">
        <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg md:text-2xl font-bold text-red-700 mb-2 md:mb-3 font-[Poppins,sans-serif]">Gabim</h2>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 font-[Inter,sans-serif]">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 border-none rounded-lg text-white text-sm md:text-base font-semibold cursor-pointer transition-colors hover:bg-blue-700 font-[Poppins,sans-serif]"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes xp-float {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 0.9;
            transform: translateY(-20px) scale(1);
          }
          40% {
            opacity: 1;
            transform: translateY(-40px) scale(1.1);
          }
          60% {
            opacity: 1;
            transform: translateY(-60px) scale(1.05);
          }
          80% {
            opacity: 0.6;
            transform: translateY(-80px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.9);
          }
        }

        .animate-xp-float {
          animation: xp-float 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 md:p-6">
        <div className="max-w-[1200px] mx-auto font-sans">
          <div className="relative mb-6 md:mb-8 overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-4 md:p-8 shadow-xl backdrop-blur-md">
            <div className="absolute -top-[50px] -right-[50px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(59,130,246,0.15),transparent_70%)] rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute -bottom-[30px] -left-[30px] w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_70%)] rounded-full blur-[40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 text-center md:flex-row md:text-left">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="mb-1 md:mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl md:text-4xl font-bold text-transparent">
                  Fraza Gjermane
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Mëso fraza të zakonshme gjermane me përkthime në shqip
                </p>
              </div>
            </div>
          </div>

          {showXpAnimation && (
            <div
              className="fixed text-xl md:text-3xl font-bold text-amber-600 animate-xp-float z-[9999] [text-shadow:0_4px_20px_rgba(217,119,6,0.6)] font-[Poppins,sans-serif] pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${xpPosition.x}px`,
                top: `${xpPosition.y}px`,
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
                className={`px-3 py-1.5 md:px-5 md:py-2.5 border-2 rounded-lg text-sm md:text-base font-semibold cursor-pointer transition-all font-[Poppins,sans-serif] ${
                  selectedLevel === level
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

       

          {currentPhrases.length === 0 ? (
            <div className="bg-white rounded-xl p-6 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif]">
                Nuk ka fraza të disponueshme për nivelin {selectedLevel}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                {currentPhrases.map((phrase) => {
                  const isFinished = finishedPhraseIds.includes(phrase._id || phrase.id)
                  const phraseId = phrase._id || phrase.id

                  return (
                    <div
                      key={phraseId}
                      className={`rounded-lg p-3 md:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all border ${
                        isFinished ? "bg-green-50 border-green-500" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                            <p className="text-sm md:text-base font-semibold text-gray-900 m-0 leading-snug font-[Poppins,sans-serif]">
                              {phrase.german}
                            </p>
                            <button
                              onClick={() => speakGerman(phrase.german)}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-blue-600 bg-white text-blue-600 cursor-pointer flex items-center justify-center transition-all p-0 hover:bg-blue-50 flex-shrink-0"
                              title="Dëgjo frazën gjermane"
                            >
                              <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 m-0 leading-snug font-[Inter,sans-serif]">
                            {phrase.albanian}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                          <span className="text-xs md:text-sm font-semibold text-amber-700 whitespace-nowrap font-[Inter,sans-serif]">
                            +{phrase.xp} XP
                          </span>
                          {!isFinished && (
                            <button
                              onClick={(e) => handleMarkAsFinished(phraseId, phrase.xp, e)}
                              className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-green-500 bg-white text-green-500 text-xl md:text-2xl font-bold cursor-pointer flex items-center justify-center transition-all p-0 leading-none hover:bg-green-50"
                            >
                              +
                            </button>
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
