
"use client"
import { useState, useEffect } from "react"
import { listenService } from "../services/api"
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
  const [userProgress, setUserProgress] = useState({})

  useEffect(() => {
    fetchTests()
    fetchUserProgress()
  }, [selectedLevel])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 50 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await listenService.getAllTests(params)
      console.log("Fetched tests:", response.data)
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

      // Create a set of completed test IDs for easy lookup
      const completedTests = new Set()

      // Check all possible sources of completed tests
      if (progressData.recentTests && Array.isArray(progressData.recentTests)) {
        console.log("Recent tests:", progressData.recentTests)
        progressData.recentTests.forEach((test) => {
          completedTests.add(test._id)
        })
      }

      // Also check if there's a completedTestIds array
      if (progressData.completedTestIds && Array.isArray(progressData.completedTestIds)) {
        console.log("Completed test IDs:", progressData.completedTestIds)
        progressData.completedTestIds.forEach((testId) => {
          completedTests.add(testId)
        })
      }

      // Check allCompletedTests array
      if (progressData.allCompletedTests && Array.isArray(progressData.allCompletedTests)) {
        console.log("All completed tests:", progressData.allCompletedTests)
        progressData.allCompletedTests.forEach((test) => {
          completedTests.add(test._id)
        })
      }

      // Check completedFromTests array
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

  // Alternative method to check completion status by looking at the tests themselves
  const fetchCompletionStatusFromTests = async () => {
    try {
      // Get the current user ID (you might need to adjust this based on how you store user info)
      const token = localStorage.getItem("authToken") || localStorage.getItem("token")
      if (!token) return

      // Decode token to get user ID (adjust this based on your token structure)
      let userId
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.userId || payload.id || payload.sub
      } catch (e) {
        console.error("Could not decode token:", e)
        return
      }

      console.log("Current user ID:", userId)

      // Check each test to see if the current user has completed it
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
        setUserProgress({ completedTests })
      }
    } catch (error) {
      console.error("Error checking completion status from tests:", error)
    }
  }

  // Call this after tests are loaded
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

      // If the answer was correct or good enough, mark as completed immediately
      if (response.data.correct || response.data.score >= 80) {
        console.log("Test completed successfully, updating local state")
        // Update local state immediately
        setUserProgress((prev) => ({
          ...prev,
          completedTests: new Set([...prev.completedTests, selectedTest._id]),
        }))

        // Also refresh the full progress data after a delay
        setTimeout(() => {
          console.log("Refreshing progress data after completion")
          fetchUserProgress()
          fetchTests() // Refresh tests to get updated completion data
        }, 1000)
      }
    } catch (error) {
      console.error("Error checking answer:", error)
      setResult({
        message: "Incorrect answer. Try again!",
        correct: false,
      })
      setShowResult(true)
    }
  }

  const resetTest = () => {
    setUserAnswer("")
    setShowResult(false)
    setResult(null)
    setSelectedTest(null)
    // Refresh progress when going back to ensure latest completion status
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
      <div className="h-[700px] bg-white p-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{selectedTest.title}</h1>
              <button onClick={resetTest} className="text-gray-600 hover:text-gray-900">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Audio Controls */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <button
                  onClick={() => playAudio(selectedTest.text)}
                  className="bg-teal-600 text-white p-4 rounded-full hover:bg-teal-700 transition-colors"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </button>
                <p className="mt-4 text-gray-600">Click to listen to the German text</p>
              </div>

              {/* Answer Input */}
              {!showResult && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Type what you heard:</label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows="4"
                    placeholder="Type the German text you heard..."
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Check Answer
                  </button>
                </div>
              )}

              {/* Result */}
              {showResult && (
                <div
                  className={`p-4 rounded-lg ${result.correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.correct ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <p className={`font-medium ${result.correct ? "text-green-800" : "text-red-800"}`}>
                      {result.message}
                    </p>
                  </div>
                  {!result.correct && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">Correct answer:</p>
                      <p className="font-medium text-gray-900">{result.correctAnswer}</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={resetTest}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Back to Tests
                    </button>
                    {!result.correct && (
                      <button
                        onClick={() => {
                          setShowResult(false)
                          setUserAnswer("")
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Listening Practice</h1>
            <p className="text-gray-600">Improve your German listening skills with audio exercises</p>
            {/* Debug info */}
            <p className="text-xs text-gray-400 mt-2">
              Completed tests: {userProgress.completedTests ? userProgress.completedTests.size : 0}
            </p>
          </div>
        </header>

        {/* Level Filter */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-teal-600" />
            <h2 className="text-sm font-medium text-gray-800">Filter by Level</h2>
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
                {level === "all" ? "All Levels" : level}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
            ))}
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
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400 hover:shadow-lg"
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
                        isCompleted ? "text-green-200" : "text-gray-200"
                      }`}
                    />

                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-semibold mb-1 pr-12 ${
                          isCompleted
                            ? "text-green-800 group-hover:text-green-900"
                            : "text-gray-800 group-hover:text-teal-700"
                        }`}
                      >
                        {test.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-green-700" : "text-gray-600"}`}>
                        {test.text ? test.text.substring(0, 80) + "..." : "Audio exercise"}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-green-600" : "text-gray-500"}`}>
                          German • Audio Exercise
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isCompleted ? "bg-green-200 text-green-800" : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Listen"}
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
                  <h3 className="text-sm font-medium text-gray-800 mb-1">No tests found</h3>
                  <p className="text-gray-500 text-xs">Try selecting different levels or check back later</p>
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

