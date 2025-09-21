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
  Target,
  CheckCircle,
  Zap,
  Trophy,
  Languages,
  Play,
  Award,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Clock,
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
        setFeedback("Error with speech recognition. Please try again.")
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
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
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

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading pronunciation packages...</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                <div className="h-5 bg-slate-200 rounded w-12"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
              <div className="h-2 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Package Selection Screen
  if (!selectedPackage) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Languages className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Pronunciation Practice</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Master German pronunciation with interactive practice sessions. Choose a package to begin your learning journey.
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-slate-900">{packages.length}</p>
                <p className="text-slate-600 font-medium">Available Packages</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-slate-900">{completedPackages.size}</p>
                <p className="text-slate-600 font-medium">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-slate-900">1,240</p>
                <p className="text-slate-600 font-medium">Total XP Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level Filter */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-3 text-slate-700">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter by Level:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLevel("all")}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedLevel === "all"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
              }`}
              data-testid="filter-all"
            >
              All Levels
            </button>
            {uniqueLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedLevel === level
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
                }`}
                data-testid={`filter-${level.toLowerCase()}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Package Grid */}
        {!Array.isArray(filteredPackages) || filteredPackages.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-200">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-600 text-lg font-medium">
              {!Array.isArray(filteredPackages)
                ? "Error loading packages. Please refresh the page."
                : selectedLevel === "all"
                ? "No pronunciation packages available."
                : `No packages found for level "${selectedLevel}".`}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentPackages.map((pkg) => {
                const isCompleted = completedPackages.has(pkg._id.toString())
                const wordCount = pkg.words?.length || 0
                const totalXP = pkg.words?.reduce((sum, word) => sum + (word.xp || 5), 0) || 0
                
                return (
                  <div
                    key={pkg._id}
                    onClick={() => selectPackage(pkg)}
                    className="group cursor-pointer bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative"
                    data-testid={`package-card-${pkg._id}`}
                  >
                    {isCompleted && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {pkg.title}
                      </h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          pkg.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                          pkg.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {pkg.level}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-medium">{wordCount} words</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="font-medium">{isCompleted ? '100%' : '0%'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500 w-full' : 'bg-slate-400 w-0'
                        }`}></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        <span className="font-bold text-slate-700">{totalXP} XP</span>
                      </div>
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-medium">Complete</span>
                        </div>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}>
                      {isCompleted ? 'Review Package' : 'Start Practice'}
                    </button>
                  </div>
                )
              })}
            </div>

            <Pagination />
          </>
        )}
      </div>
    )
  }

  // Results Screen
  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {hasPassed ? <Trophy className="w-12 h-12 text-white" /> : <TrendingUp className="w-12 h-12 text-white" />}
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {hasPassed ? "Excellent Work!" : "Keep Practicing!"}
          </h2>
          <p className="text-xl text-slate-600">
            {hasPassed
              ? "Congratulations on completing this pronunciation practice session"
              : `You're making great progress. Need ${passThreshold} correct to pass this level.`}
          </p>
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-4xl font-bold text-emerald-600 mb-2">{sessionStats.correctAnswers}</p>
            <p className="text-slate-600 font-medium">Words Completed</p>
          </div>
          
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-blue-600 mb-2">{sessionStats.totalXP}</p>
            <p className="text-slate-600 font-medium">XP Earned</p>
          </div>
          
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-4xl font-bold text-amber-600 mb-2">
              {selectedPackage ? Math.round((sessionStats.correctAnswers / selectedPackage.words.length) * 100) : 0}%
            </p>
            <p className="text-slate-600 font-medium">Accuracy Rate</p>
          </div>
          
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-4xl font-bold text-purple-600 mb-2">
              {hasPassed ? "Passed" : "In Progress"}
            </p>
            <p className="text-slate-600 font-medium">Status</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetSession}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors"
            data-testid="button-try-again"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          
          <button
            onClick={() => setSelectedPackage(null)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
            data-testid="button-back-to-packages"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Packages
          </button>
        </div>
      </div>
    )
  }

  // Practice Interface
  if (!selectedPackage) return null
  const currentWord = selectedPackage.words[currentWordIndex]
  const isWordCompleted = sessionStats.completedWords.includes(currentWordIndex)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setSelectedPackage(null)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Packages</span>
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{selectedPackage.title}</h1>
          <p className="text-slate-600">Practice Session</p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          <Star className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-700">{sessionStats.totalXP} XP</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-700">
                Progress: {sessionStats.completedWords.length}/{selectedPackage.words.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-slate-700">Need {passThreshold} to pass</span>
            </div>
          </div>
          <div className="text-slate-600 font-medium">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Word Navigation */}
      <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-2 mb-8">
        {selectedPackage.words.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentWordIndex(index)}
            className={`aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
              sessionStats.completedWords.includes(index)
                ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
                : currentWordIndex === index
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
            data-testid={`word-${index}`}
          >
            {sessionStats.completedWords.includes(index) ? <Check size={14} /> : index + 1}
          </button>
        ))}
      </div>

      {/* Main Practice Card */}
      <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
        {/* Word Display */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            {currentWord.word}
          </h2>
          <p className="text-xl text-slate-600 mb-2 font-medium">
            [{currentWord.pronunciation}]
          </p>
          <p className="text-lg text-slate-600">
            {currentWord.translation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={() => playPronunciation(currentWord.word)}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
            data-testid="button-play-pronunciation"
          >
            <Volume2 size={24} />
          </button>

          <button
            onClick={startListening}
            disabled={isListening || isWordCompleted}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : isWordCompleted
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            data-testid="button-microphone"
          >
            {isWordCompleted ? (
              <Check size={28} />
            ) : isListening ? (
              <MicOff size={28} />
            ) : (
              <Mic size={28} />
            )}
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-lg text-center font-medium mb-6 ${
            feedback.includes("Excellent") || feedback.includes("correct")
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : feedback.includes("Already completed")
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {feedback}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevWord}
            disabled={currentWordIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentWordIndex === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            data-testid="button-prev-word"
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <button
            onClick={nextWord}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            data-testid="button-next-word"
          >
            {currentWordIndex === selectedPackage.words.length - 1 ? "Finish" : "Next"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PronunciationPractice