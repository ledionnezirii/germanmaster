"use client"
import { useState, useEffect } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  Check,
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Target,
  X,
} from "lucide-react"
import { pronunciationService } from "../services/api"

const PronunciationPractice = () => {
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [synthesis, setSynthesis] = useState(null)
  const [sessionStats, setSessionStats] = useState({
    correctAnswers: 0,
    totalAttempts: 0,
    completedWords: [],
    totalXP: 0,
  })
  const [feedback, setFeedback] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [completedPackages, setCompletedPackages] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const itemsPerPage = isMobile ? 8 : 20

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognitionInstance = new window.webkitSpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "de-DE"
      setRecognition(recognitionInstance)
    }

    if ("speechSynthesis" in window) {
      setSynthesis(window.speechSynthesis)
    }

    loadPackages()
    loadCompletedPackages()
  }, [])

  useEffect(() => {
    if (selectedLevel === "all") {
      setFilteredPackages(packages)
    } else {
      setFilteredPackages(packages.filter((pkg) => pkg.level === selectedLevel))
    }
    setCurrentPage(1)
  }, [packages, selectedLevel])

  const loadCompletedPackages = async () => {
    try {
      const response = await pronunciationService.getUserCompletedPackages()
      const completedIds = response.data?.completedPronunciationPackages || []
      const completedIdStrings = completedIds.map((pkg) => {
        if (typeof pkg === "object" && pkg._id) {
          return pkg._id.toString()
        } else if (typeof pkg === "string") {
          return pkg
        } else {
          return pkg.toString()
        }
      })
      setCompletedPackages(new Set(completedIdStrings))
    } catch (error) {
      console.error("Error loading completed packages:", error)
      setCompletedPackages(new Set())
    }
  }

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await pronunciationService.getWords()
      const packagesData = response.data

      if (packagesData && typeof packagesData === "object") {
        if (Array.isArray(packagesData)) {
          setPackages(packagesData)
        } else if (packagesData.packages && Array.isArray(packagesData.packages)) {
          setPackages(packagesData.packages)
        } else if (packagesData.data && Array.isArray(packagesData.data)) {
          setPackages(packagesData.data)
        } else {
          setPackages([])
        }
      } else {
        setPackages([])
      }
    } catch (error) {
      console.error("Error loading packages:", error)
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    if (recognition && !sessionStats.completedWords.includes(currentWordIndex)) {
      setIsListening(true)
      setFeedback("")

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase()
        checkPronunciation(transcript)
      }

      recognition.onerror = () => {
        setIsListening(false)
        setFeedback("Gabim me njohjen e zërit. Ju lutem provoni përsëri.")
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const checkPronunciation = async (spokenText) => {
    if (!selectedPackage) return
    const currentWord = selectedPackage.words[currentWordIndex]

    try {
      const response = await pronunciationService.checkPronunciation(selectedPackage._id, currentWordIndex, spokenText)
      const { correct, xpAdded, alreadyCompleted } = response.data

      setSessionStats((prev) => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
        completedWords:
          correct && !prev.completedWords.includes(currentWordIndex)
            ? [...prev.completedWords, currentWordIndex]
            : prev.completedWords,
        totalXP: prev.totalXP + xpAdded,
      }))

      if (alreadyCompleted) {
        setFeedback("Tashmë e përfunduar! Nuk ka XP shtesë.")
      } else if (correct) {
        setFeedback(`Shkëlqyeshëm! +${xpAdded} XP`)
      } else {
        setFeedback("Provoni përsëri! Dëgjoni shqiptimin.")
      }
    } catch (error) {
      console.error("Error checking pronunciation:", error)
      setFeedback("Gabim në kontrollimin e shqiptimit. Ju lutem provoni përsëri.")
    }
  }

  const playPronunciation = (word) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      synthesis.speak(utterance)
    }
  }

  const nextWord = () => {
    if (!selectedPackage) return
    if (currentWordIndex < selectedPackage.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setFeedback("")
    } else {
      const passThreshold = Math.ceil(selectedPackage.words.length * 0.7)
      if (sessionStats.completedWords.length >= passThreshold) {
        setCompletedPackages((prev) => new Set([...Array.from(prev), selectedPackage._id.toString()]))
      }
      setShowResults(true)
    }
  }

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setFeedback("")
    }
  }

  const resetSession = () => {
    setCurrentWordIndex(0)
    setSessionStats({
      correctAnswers: 0,
      totalAttempts: 0,
      completedWords: [],
      totalXP: 0,
    })
    setFeedback("")
    setShowResults(false)
  }

  const selectPackage = (pkg) => {
    setSelectedPackage(pkg)
    resetSession()
  }

  const resetTest = () => {
    setSelectedPackage(null)
    resetSession()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "A2":
        return "bg-teal-200 text-teal-800 border-teal-300"
      case "B1":
        return "bg-teal-300 text-teal-800 border-teal-400"
      case "B2":
        return "bg-teal-400 text-teal-800 border-teal-500"
      case "C1":
        return "bg-teal-500 text-white border-teal-600"
      case "C2":
        return "bg-teal-600 text-white border-teal-700"
      default:
        return "bg-gray-200 text-gray-800 border-gray-300"
    }
  }

  const uniqueLevels = Array.from(new Set(packages.map((pkg) => pkg.level))).sort()
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPackages = filteredPackages.slice(startIndex, startIndex + itemsPerPage)

  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? "border-slate-200 text-slate-400 cursor-not-allowed"
              : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
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
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
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
              ? "border-slate-200 text-slate-400 cursor-not-allowed"
              : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
          }`}
          data-testid="pagination-next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const progressPercentage = selectedPackage
    ? (sessionStats.completedWords.length / selectedPackage.words.length) * 100
    : 0

  const passThreshold = selectedPackage ? Math.ceil(selectedPackage.words.length * 0.7) : 0
  const hasPassed = sessionStats.completedWords.length >= passThreshold

  // Practice Interface - Similar to Listen component structure
  if (selectedPackage) {
    return (
      <div className="h-[700px] bg-white p-2 sm:p-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{selectedPackage.title}</h1>
              <button
                onClick={resetTest}
                className="text-gray-600 hover:text-gray-900 p-1"
                aria-label="Kthehu te Paketat"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {/* Progress Section */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Progresi: {sessionStats.completedWords.length}/{selectedPackage.words.length}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-600 font-medium text-sm sm:text-base">
                    {Math.round(progressPercentage)}% E përfunduar
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Current Word Display */}
              {selectedPackage.words[currentWordIndex] && (
                <div className="text-center space-y-4">
                  <h2 className="text-3xl sm:text-5xl font-bold text-gray-900">
                    {selectedPackage.words[currentWordIndex].word}
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600 font-medium">
                    [{selectedPackage.words[currentWordIndex].pronunciation}]
                  </p>
                  <p className="text-base sm:text-lg text-gray-600">
                    {selectedPackage.words[currentWordIndex].translation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 sm:gap-6">
                <button
                  onClick={() => playPronunciation(selectedPackage.words[currentWordIndex]?.word)}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:w-6" />
                </button>

                <button
                  onClick={startListening}
                  disabled={isListening || sessionStats.completedWords.includes(currentWordIndex)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : sessionStats.completedWords.includes(currentWordIndex)
                        ? "bg-green-500 text-white cursor-default"
                        : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {sessionStats.completedWords.includes(currentWordIndex) ? (
                    <Check className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : isListening ? (
                    <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </button>
              </div>

              {/* Feedback */}
              {feedback && (
                <div
                  className={`p-3 sm:p-4 rounded-lg text-center font-medium ${
                    feedback.includes("Shkëlqyeshëm") || feedback.includes("correct")
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : feedback.includes("Tashmë")
                        ? "bg-amber-50 border border-amber-200 text-amber-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  <p className="text-sm sm:text-base">{feedback}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={prevWord}
                  disabled={currentWordIndex === 0}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    currentWordIndex === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />E mëparshme
                </button>

                <button
                  onClick={nextWord}
                  className="flex items-center gap-2 bg-teal-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm sm:text-base"
                >
                  {currentWordIndex === selectedPackage.words.length - 1 ? "Përfundo" : "Tjetër"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="h-min-screen p-4 flex flex-col">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Duke ngarkuar paketat e shqiptimit...</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Package Selection Screen - Similar to Listen component structure
  return (
    <div className="h-min-screen p-4 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktikë Shqiptimi</h1>
            <p className="text-gray-600">Përmirësoni aftësitë tuaja të shqiptimit në gjermanisht me ushtrime audio</p>
            {/* Debug info */}
            <p className="text-xs text-gray-400 mt-2">Paketa të përfunduara: {completedPackages.size}</p>
          </div>
        </header>

        {/* Level Filter */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-teal-600" />
            <h2 className="text-sm font-medium text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLevel("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedLevel === "all"
                  ? "bg-teal-600 text-white border-teal-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
              }`}
            >
              Të gjitha Nivelet
              {selectedLevel === "all" && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-white/50 rounded-full text-xs">
                  ✓
                </span>
              )}
            </button>
            {uniqueLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  selectedLevel === level
                    ? getLevelColor(level)
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
              >
                {level}
                {selectedLevel === level && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-white/50 rounded-full text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {currentPackages.length > 0 ? (
              currentPackages.map((pkg) => {
                const isCompleted = completedPackages.has(pkg._id.toString())
                const wordCount = pkg.words?.length || 0
                return (
                  <div
                    key={pkg._id}
                    className={`p-3 rounded-lg shadow-sm border transition-all cursor-pointer overflow-hidden relative group h-fit ${
                      isCompleted
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400 hover:shadow-lg"
                        : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-md"
                    }`}
                    onClick={() => selectPackage(pkg)}
                  >
                    {/* Level Badge */}
                    <div
                      className={`absolute top-2 right-2 ${getLevelColor(pkg.level)} px-1.5 py-0.5 rounded text-xs font-medium`}
                    >
                      {pkg.level}
                    </div>
                    {/* Background Icon */}
                    <Mic
                      className={`absolute -bottom-4 -right-4 w-16 h-16 ${
                        isCompleted ? "text-green-200" : "text-gray-200"
                      }`}
                    />
                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-semibold mb-1 pr-12 truncate ${
                          isCompleted
                            ? "text-green-800 group-hover:text-green-900"
                            : "text-gray-800 group-hover:text-teal-700"
                        }`}
                      >
                        {pkg.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-green-700" : "text-gray-600"}`}>
                        {wordCount} fjalë për praktikë shqiptimi
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-green-600" : "text-gray-500"}`}>
                          Gjermanisht • Ushtrim Shqiptimi
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isCompleted ? "bg-green-200 text-green-800" : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {isCompleted ? "Përfunduar" : "Praktiko"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="bg-gray-50 rounded-lg p-6 inline-block">
                  <Mic className="text-teal-600 w-10 h-10 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Nuk u gjetën paketa</h3>
                  <p className="text-gray-500 text-xs">
                    Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <Pagination />
      </div>
    </div>
  )
}

export default PronunciationPractice
