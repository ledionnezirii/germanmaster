"use client"

import { useState, useEffect } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  Check,
  Star,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen,
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

  const itemsPerPage = isMobile ? 8 : 12

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
        setFeedback("Error with speech recognition. Please try again.")
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const checkPronunciation = async (spokenText) => {
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
        setFeedback("Already completed! No additional XP.")
      } else if (correct) {
        setFeedback(`Excellent! +${xpAdded} XP`)
      } else {
        setFeedback("Try again! Listen to the pronunciation.")
      }
    } catch (error) {
      console.error("Error checking pronunciation:", error)
      setFeedback("Error checking pronunciation. Please try again.")
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
    if (currentWordIndex < selectedPackage.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setFeedback("")
    } else {
      const passThreshold = Math.ceil(selectedPackage.words.length * 0.7)
      if (sessionStats.completedWords.length >= passThreshold) {
        setCompletedPackages((prev) => new Set([...prev, selectedPackage._id.toString()]))
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

  const uniqueLevels = [...new Set(packages.map((pkg) => pkg.level))].sort()
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPackages = filteredPackages.slice(startIndex, startIndex + itemsPerPage)

  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center gap-1 mt-6">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
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
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
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
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              🎯 Pronunciation Practice
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Choose a package to start practicing German pronunciation
            </p>
          </div>

          {/* Level Filter */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter size={14} />
              <span className="text-xs font-medium">Level:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedLevel("all")}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedLevel === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                All
              </button>
              {uniqueLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedLevel === level
                      ? "bg-blue-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Package Grid */}
          {!Array.isArray(filteredPackages) || filteredPackages.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-slate-200">
              <p className="text-slate-600 text-sm">
                {!Array.isArray(filteredPackages)
                  ? "Error loading packages. Please refresh the page."
                  : selectedLevel === "all"
                  ? "No pronunciation packages available."
                  : `No packages found for level "${selectedLevel}".`}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {currentPackages.map((pkg) => {
                  const isCompleted = completedPackages.has(pkg._id.toString())
                  return (
                    <div
                      key={pkg._id}
                      onClick={() => selectPackage(pkg)}
                      className={`group cursor-pointer rounded-lg p-3 transition-all duration-200 hover:scale-[1.02] ${
                        isCompleted
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg"
                          : "bg-white hover:bg-slate-50 shadow-sm hover:shadow-md border border-slate-200"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className={`font-semibold text-sm leading-tight flex-1 mr-2 ${
                            isCompleted ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {pkg.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              isCompleted
                                ? "bg-white/20 text-white"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {pkg.level}
                          </span>
                          {isCompleted && (
                            <div className="bg-white/20 rounded-full p-0.5">
                              <Check size={10} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={12} className={isCompleted ? "text-white/80" : "text-slate-500"} />
                          <span className={`text-xs ${isCompleted ? "text-white/90" : "text-slate-600"}`}>
                            {pkg.words?.length || 0} words
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className={isCompleted ? "text-white/80" : "text-amber-500"} />
                          <span className={`text-xs font-medium ${isCompleted ? "text-white/90" : "text-slate-600"}`}>
                            {pkg.words?.reduce((sum, word) => sum + (word.xp || 5), 0) || 0} XP
                          </span>
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-white/90">
                          <Check size={8} />
                          Completed
                        </div>
                      )}
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

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                hasPassed
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : "bg-gradient-to-br from-amber-500 to-amber-600"
              }`}
            >
              {hasPassed ? <Check size={24} color="white" /> : <Star size={24} color="white" />}
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {hasPassed ? "🎉 Congratulations!" : "💪 Keep practicing!"}
            </h2>

            <p className="text-slate-600 text-sm mb-4">
              {hasPassed
                ? `You passed with ${sessionStats.correctAnswers}/${selectedPackage.words.length} correct!`
                : `You got ${sessionStats.correctAnswers}/${selectedPackage.words.length} correct. Need ${passThreshold} to pass.`}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{sessionStats.totalXP}</div>
                <div className="text-xs text-slate-600 font-medium">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {Math.round((sessionStats.correctAnswers / selectedPackage.words.length) * 100)}%
                </div>
                <div className="text-xs text-slate-600 font-medium">Accuracy</div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={resetSession}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Packages
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentWord = selectedPackage.words[currentWordIndex]
  const isWordCompleted = sessionStats.completedWords.includes(currentWordIndex)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedPackage(null)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 text-center flex-1 mx-4">
            {selectedPackage.title}
          </h1>
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-slate-200">
            <Star size={14} className="text-amber-500" />
            <span className="font-bold text-slate-800 text-sm">{sessionStats.totalXP} XP</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Progress: {sessionStats.completedWords.length}/{selectedPackage.words.length}</span>
            <span>Need {passThreshold} to pass</span>
          </div>
          <div className="w-full bg-white rounded-full h-2 border border-slate-200">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Word Grid */}
        <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1 mb-4">
          {selectedPackage.words.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentWordIndex(index)}
              className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                sessionStats.completedWords.includes(index)
                  ? "bg-green-500 text-white shadow-md"
                  : currentWordIndex === index
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {sessionStats.completedWords.includes(index) ? <Check size={12} /> : index + 1}
            </button>
          ))}
        </div>

        {/* Main Practice Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200">
          {/* Word Display */}
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
              {currentWord.word}
            </h2>
            <p className="text-lg text-slate-600 mb-1 font-medium">
              [{currentWord.pronunciation}]
            </p>
            <p className="text-base text-slate-600">
              {currentWord.translation}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => playPronunciation(currentWord.word)}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md"
            >
              <Volume2 size={20} />
            </button>

            <button
              onClick={startListening}
              disabled={isListening || isWordCompleted}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : isWordCompleted
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {isWordCompleted ? (
                <Check size={24} />
              ) : isListening ? (
                <MicOff size={24} />
              ) : (
                <Mic size={24} />
              )}
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-lg mb-6 text-center text-sm font-medium ${
                feedback.includes("Excellent") || feedback.includes("Shkëlqyeshëm")
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : feedback.includes("Already completed")
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {feedback}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevWord}
              disabled={currentWordIndex === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentWordIndex === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-500 hover:bg-slate-600 text-white"
              }`}
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
              {currentWordIndex + 1} of {selectedPackage.words.length}
            </span>

            <button
              onClick={nextWord}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {currentWordIndex === selectedPackage.words.length - 1 ? "Finish" : "Next"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PronunciationPractice