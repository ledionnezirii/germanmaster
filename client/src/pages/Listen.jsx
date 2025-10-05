"use client"
import { useState, useEffect } from "react"
import { listenService } from "../services/api" // Assuming this service is available
import { Volume2, Play, Pause, Check, X, Filter } from "lucide-react"

const Listen = () => {
  const [tests, setTests] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [userProgress, setUserProgress] = useState({ completedTests: new Set() })
  const [failedAttempts, setFailedAttempts] = useState(0) // State for failed attempts
  const [showFullText, setShowFullText] = useState(false) // State to show full text

  useEffect(() => {
    fetchTests()
    fetchUserProgress()
  }, [selectedLevel])

  useEffect(() => {
    if (selectedTest) {
      setFailedAttempts(0)
      setShowFullText(false)
    }
  }, [selectedTest])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedTest])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 100 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      console.log("[v0] Fetching tests with params:", params)
      const response = await listenService.getAllTests(params)
      console.log("[v0] Raw API response:", response)
      console.log("Fetched tests:", response.data)
      console.log("Total tests received:", response.data?.tests?.length || response.data?.length || 0)

      if (response.data) {
        console.log("[v0] Response data structure:", Object.keys(response.data))
      }

      setTests(response.data.tests || response.data || [])
    } catch (error) {
      console.error("Error fetching tests:", error)
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await listenService.getUserProgress()
      const progressData = response.data
      console.log("Full progress data from backend:", progressData)
      const completedTests = new Set()
      if (progressData.recentTests && Array.isArray(progressData.recentTests)) {
        console.log("Recent tests:", progressData.recentTests)
        progressData.recentTests.forEach((test) => {
          completedTests.add(test._id)
        })
      }
      if (progressData.completedTestIds && Array.isArray(progressData.completedTestIds)) {
        console.log("Completed test IDs:", progressData.completedTestIds)
        progressData.completedTestIds.forEach((testId) => {
          completedTests.add(testId)
        })
      }
      if (progressData.allCompletedTests && Array.isArray(progressData.allCompletedTests)) {
        console.log("All completed tests:", progressData.allCompletedTests)
        progressData.allCompletedTests.forEach((test) => {
          completedTests.add(test._id)
        })
      }
      if (progressData.completedFromTests && Array.isArray(progressData.completedFromTests)) {
        console.log("Completed from tests:", progressData.completedFromTests)
        progressData.completedFromTests.forEach((testId) => {
          completedTests.add(testId)
        })
      }
      console.log("Final completed tests set:", Array.from(completedTests))
      setUserProgress({ completedTests })
    } catch (error) {
      console.error("Error fetching user progress:", error)
      console.log("Setting empty completed tests due to error")
      setUserProgress({ completedTests: new Set() })
    }
  }

  const fetchCompletionStatusFromTests = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token")
      if (!token) return
      let userId
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.userId || payload.id || payload.sub
      } catch (e) {
        console.error("Could not decode token:", e)
        return
      }
      console.log("Current user ID:", userId)
      const completedTests = new Set()
      tests.forEach((test) => {
        if (
          test.listenTestsPassed &&
          test.listenTestsPassed.some(
            (completion) => completion.user === userId || completion.user.toString() === userId,
          )
        ) {
          completedTests.add(test._id)
        }
      })
      console.log("Completed tests from test data:", Array.from(completedTests))
      if (completedTests.size > 0) {
        setUserProgress((prev) => ({
          ...prev,
          completedTests: new Set([...(prev.completedTests || []), ...completedTests]),
        }))
      }
    } catch (error) {
      console.error("Error checking completion status from tests:", error)
    }
  }

  useEffect(() => {
    if (tests.length > 0) {
      fetchCompletionStatusFromTests()
    }
  }, [tests])

  const playAudio = (text) => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "de-DE"
    utterance.rate = 0.8
    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return
    try {
      const response = await listenService.checkAnswer(selectedTest._id, userAnswer)
      console.log("Check answer response:", response.data)
      setResult(response.data)
      setShowResult(true)

      if (response.data.correct || response.data.score >= 80) {
        console.log("Test completed successfully, updating local state")
        setUserProgress((prev) => ({
          ...prev,
          completedTests: new Set([...(prev.completedTests || []), selectedTest._id]),
        }))
        setTimeout(() => {
          console.log("Refreshing progress data after completion")
          fetchUserProgress()
          fetchTests()
        }, 1000)
        setFailedAttempts(0) // Reset attempts on success
        setShowFullText(false) // Hide full text on success
      } else {
        setFailedAttempts((prev) => prev + 1) // Increment attempts on failure
      }
    } catch (error) {
      console.error("Error checking answer:", error)
      setResult({
        message: "Jo krejt saktë, por vazhdoni të praktikoni!", // Corrected Albanian message
        correct: false,
      })
      setShowResult(true)
      setFailedAttempts((prev) => prev + 1) // Increment attempts on error
    }
  }

  const resetTest = () => {
    setUserAnswer("")
    setShowResult(false)
    setResult(null)
    setSelectedTest(null)
    setFailedAttempts(0) // Reset attempts when going back to test list
    setShowFullText(false) // Hide full text when going back to test list
    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchUserProgress()
    fetchTests()
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

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  if (selectedTest) {
    return (
      <div className="h-[700px] bg-white p-2 sm:p-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{selectedTest.title}</h1>
              <button
                onClick={resetTest}
                className="text-gray-600 hover:text-gray-900 p-1"
                aria-label="Kthehu te Testet"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {/* Audio Controls */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
                <button
                  onClick={() => playAudio(selectedTest.text)}
                  className="bg-teal-600 text-white p-3 sm:p-4 rounded-full hover:bg-teal-700 transition-colors"
                  aria-label={isPlaying ? "Pauzë" : "Luaj"}
                >
                  {isPlaying ? <Pause className="h-6 w-6 sm:h-8 sm:w-8" /> : <Play className="h-6 w-6 sm:h-8 sm:w-8" />}
                </button>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                  Klikoni për të dëgjuar tekstin gjermanisht
                </p>
              </div>

              {/* Answer Input */}
              {!showResult && (
                <div className="space-y-3 sm:space-y-4">
                  <label htmlFor="user-answer" className="block text-sm font-medium text-gray-700">
                    Shkruani atë që dëgjuat:
                  </label>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2">Karaktere gjermane:</span>
                    {["ä", "ö", "ü", "Ä", "Ö", "Ü", "ß"].map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById("user-answer")
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const newValue = userAnswer.substring(0, start) + char + userAnswer.substring(end)
                          setUserAnswer(newValue)
                          setTimeout(() => {
                            textarea.focus()
                            textarea.setSelectionRange(start + 1, start + 1)
                          }, 0)
                        }}
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-700 transition-colors"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="user-answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                    rows="10"
                    placeholder="Shkruani tekstin gjermanisht që dëgjuat..."
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="w-full bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm sm:text-base"
                  >
                    Kontrollo Përgjigjen
                  </button>
                </div>
              )}

              {/* Result */}
              {showResult && (
                <div
                  className={`p-3 sm:p-4 rounded-lg ${result.correct ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.correct ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                    <p
                      className={`font-medium text-sm sm:text-base ${result.correct ? "text-orange-800" : "text-red-800"}`}
                    >
                      {result.message}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={resetTest}
                      className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm sm:text-base"
                    >
                      Kthehu te Testet
                    </button>
                    {!result.correct && (
                      <button
                        onClick={() => {
                          setShowResult(false)
                          setUserAnswer("")
                        }}
                        className="bg-teal-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm sm:text-base"
                      >
                        Provoni Përsëri
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Show Full Text after 4 failed attempts */}
              {showResult && !result.correct && failedAttempts >= 4 && (
                <div className="mt-3 sm:mt-4 text-center">
                  {!showFullText ? (
                    <button
                      onClick={() => setShowFullText(true)}
                      className="bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm sm:text-base"
                    >
                      Shfaq Tekstin e Plotë ({failedAttempts} tentativa)
                    </button>
                  ) : (
                    <div className="bg-gray-100 p-3 sm:p-4 rounded-lg border border-gray-200 text-gray-800 text-left">
                      <p className="font-semibold mb-2 text-sm sm:text-base">Teksti Origjinal:</p>
                      <p className="text-sm sm:text-base">{selectedTest.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-min-screen p-4 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktikë Dëgjimi</h1>
            <p className="text-gray-600">Përmirësoni aftësitë tuaja të dëgjimit në gjermanisht me ushtrime audio</p>
            {/* Debug info */}
            <p className="text-xs text-gray-400 mt-2">
              Teste të përfunduara: {userProgress.completedTests ? userProgress.completedTests.size : 0}
            </p>
          </div>
        </header>

        {/* Level Filter */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-teal-600" />
            <h2 className="text-sm font-medium text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-teal-600 text-white border-teal-700"
                      : getLevelColor(level)
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha Nivelet" : level}
                {selectedLevel === level && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-white/50 rounded-full text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {tests.length > 0 ? (
              tests.map((test) => {
                const isCompleted = userProgress.completedTests && userProgress.completedTests.has(test._id)
                return (
                  <div
                    key={test._id}
                    className={`p-3 rounded-lg shadow-sm border transition-all cursor-pointer overflow-hidden relative group h-fit ${
                      isCompleted
                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 hover:border-orange-400 hover:shadow-lg"
                        : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    {/* Level Badge */}
                    <div
                      className={`absolute top-2 right-2 ${getLevelColor(test.level)} px-1.5 py-0.5 rounded text-xs font-medium`}
                    >
                      {test.level}
                    </div>
                    {/* Background Icon */}
                    <Volume2
                      className={`absolute -bottom-4 -right-4 w-16 h-16 ${
                        isCompleted ? "text-orange-200" : "text-gray-200"
                      }`}
                    />
                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-semibold mb-1 pr-12 truncate ${
                          isCompleted
                            ? "text-orange-800 group-hover:text-orange-900"
                            : "text-gray-800 group-hover:text-teal-700"
                        }`}
                      >
                        {test.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-orange-700" : "text-gray-600"}`}>
                        {test.text ? test.text.substring(0, 80) + "..." : "Ushtrim Audio"}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-orange-600" : "text-gray-500"}`}>
                          Gjermanisht • Ushtrim Audio
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isCompleted ? "bg-orange-200 text-orange-800" : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {isCompleted ? "Përfunduar" : "Dëgjo"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="bg-gray-50 rounded-lg p-6 inline-block">
                  <Volume2 className="text-teal-600 w-10 h-10 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Nuk u gjetën teste</h3>
                  <p className="text-gray-500 text-xs">
                    Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Listen
