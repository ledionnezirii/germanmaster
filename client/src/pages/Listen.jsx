"use client"
import { useState, useEffect, useRef } from "react"
// Import your API services here
import { listenService, ttsService } from "../services/api"
import { Volume2, Play, Pause, Check, X, LogOut, Star, Zap, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showFullText, setShowFullText] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [totalXp, setTotalXp] = useState(0)

  const audioRef = useRef(null)

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [])

  const getBaseXP = (level) => {
    const baseXP = {
      A1: 10,
      A2: 20,
      B1: 30,
      B2: 40,
      C1: 50,
      C2: 60,
    }
    return baseXP[level] || 20
  }

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
      setTotalXp(progressData.xp || 0)
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

  const playAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      return
    }

    try {
      setIsPlaying(true)

      console.log("[TTS] Requesting audio for test:", selectedTest._id)

      // Get the signed URL from GCS (no longer a blob)
      const audioUrl = await ttsService.getAudio(selectedTest._id, selectedTest.text, selectedTest.level)

      console.log("[TTS] Audio URL received:", audioUrl)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      // Use the signed URL directly (no createObjectURL needed)
      audioRef.current.src = audioUrl

      audioRef.current.onended = () => {
        console.log("[TTS] Audio playback ended")
        setIsPlaying(false)
      }

      audioRef.current.onerror = (e) => {
        console.error("[TTS] Audio element error:", e)
        setIsPlaying(false)
      }

      await audioRef.current.play()
      console.log("[TTS] Audio playback started")
    } catch (error) {
      console.error("[TTS] Error:", error)
      setIsPlaying(false)
      alert("Gabim në luajtjen e audios. Provoni përsëri.")
    }
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
        const earnedXP = response.data.xpAwarded || 0
        setXpGained(earnedXP)
        setTotalXp((prev) => prev + earnedXP)
        setShowXpAnimation(true)
        setTimeout(() => setShowXpAnimation(false), 3000)

        setUserProgress((prev) => ({
          ...prev,
          completedTests: new Set([...(prev.completedTests || []), selectedTest._id]),
        }))
        setTimeout(() => {
          console.log("Refreshing progress data after completion")
          fetchUserProgress()
          fetchTests()
        }, 1000)
        setFailedAttempts(0)
        setShowFullText(false)
      } else {
        setFailedAttempts((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error checking answer:", error)
      setResult({
        message: "Jo krejt saktë, por vazhdoni të praktikoni!",
        correct: false,
      })
      setShowResult(true)
      setFailedAttempts((prev) => prev + 1)
    }
  }

  const resetTest = () => {
    setUserAnswer("")
    setShowResult(false)
    setResult(null)
    setSelectedTest(null)
    setFailedAttempts(0)
    setShowFullText(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchUserProgress()
    fetchTests()
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
      case "A2":
        return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200"
      case "B1":
        return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200"
      case "B2":
        return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200"
      case "C1":
        return "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200"
      case "C2":
        return "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200"
      default:
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
    }
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  if (selectedTest) {
    return (
      <div className="h-[750px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-2 sm:p-4 rounded-xl shadow-lg border-2 border-emerald-200 overflow-hidden">
        <AnimatePresence>
          {showXpAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-8 py-6 rounded-2xl shadow-2xl border-2 border-emerald-500"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                    "0 0 40px rgba(16, 185, 129, 0.5)",
                    "0 0 20px rgba(16, 185, 129, 0.3)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    <Star className="h-10 w-10 text-emerald-600" />
                  </motion.div>
                  <div>
                    <div className="text-3xl font-bold">+{xpGained} XP</div>
                    <div className="text-sm font-medium">Urime!</div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Zap className="h-10 w-10 text-emerald-600" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-lg border-2 border-emerald-200 p-3 sm:p-6"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{selectedTest.title}</h1>
              </div>
              <button
                onClick={resetTest}
                className="text-emerald-600 hover:text-emerald-700 p-1 transition-colors"
                aria-label="Kthehu te Testet"
              >
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {/* Audio Player with Enhanced Design */}
              <motion.div
                className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-center shadow-xl overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Background animated circles when playing */}
                <AnimatePresence>
                  {isPlaying && (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-32 h-32 rounded-full bg-white/20" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.05, 0.2] }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-48 h-48 rounded-full bg-white/15" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 2.2, 1], opacity: [0.15, 0.02, 0.15] }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-64 h-64 rounded-full bg-white/10" />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Sound wave bars when playing */}
                <AnimatePresence>
                  {isPlaying && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-1">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 8 }}
                          animate={{ height: [8, 24 + Math.random() * 16, 8] }}
                          transition={{
                            duration: 0.5 + Math.random() * 0.3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                          }}
                          className="w-1.5 bg-white/60 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={playAudio}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative z-10 bg-white/25 backdrop-blur-sm text-white p-4 sm:p-5 rounded-full transition-all shadow-lg ${isPlaying ? 'ring-4 ring-white/40' : 'hover:bg-white/35'
                    }`}
                  aria-label={isPlaying ? "Pauzë" : "Luaj"}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Pause className="h-7 w-7 sm:h-9 sm:w-9" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play className="h-7 w-7 sm:h-9 sm:w-9" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
                <motion.p
                  className="relative z-10 mt-4 sm:mt-5 text-sm sm:text-base text-white/95 font-medium"
                  animate={isPlaying ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
                  transition={isPlaying ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  {isPlaying ? "Duke dëgjuar..." : "Klikoni për të dëgjuar tekstin gjermanisht"}
                </motion.p>
              </motion.div>

              {!showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="user-answer"
                      className="block text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Shkruani atë që dëgjuat:
                    </label>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 rounded-full border border-emerald-500">
                      <Star className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">
                        {selectedTest.xpReward || getBaseXP(selectedTest.level)} XP
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <span
                      className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Karaktere gjermane:
                    </span>
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
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded text-xs sm:text-sm font-medium text-emerald-700 transition-all shadow-sm hover:shadow-md"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="user-answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder-gray-500 text-sm sm:text-base shadow-sm"
                    rows="10"
                    placeholder="Shkruani tekstin gjermanisht që dëgjuat..."
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 sm:py-3 rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Kontrollo Përgjigjen
                  </motion.button>
                </motion.div>
              )}

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl ${result.correct
                        ? "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-400"
                        : "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-400"
                      }`}
                  >
                    <motion.div
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      className="flex items-center gap-3 mb-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                      >
                        {result.correct ? (
                          <div className="p-2 bg-emerald-100 rounded-full">
                            <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-100 rounded-full">
                            <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                          </div>
                        )}
                      </motion.div>
                      <p
                        className={`font-semibold text-base sm:text-lg ${result.correct ? "text-emerald-700" : "text-red-700"
                          }`}
                      >
                        {result.message}
                      </p>
                    </motion.div>
                    {result.correct && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 flex items-center gap-2 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald-200"
                      >
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="font-bold text-emerald-700">+{xpGained} XP fituar!</span>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3"
                    >
                      <motion.button
                        onClick={resetTest}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 sm:px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/30"
                      >
                        Kthehu te Testet
                      </motion.button>
                      {!result.correct && (
                        <motion.button
                          onClick={() => {
                            setShowResult(false)
                            setUserAnswer("")
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="bg-gradient-to-br from-teal-50 to-emerald-100 text-emerald-700 px-4 sm:px-5 py-2.5 rounded-xl hover:from-teal-100 hover:to-emerald-200 transition-all font-semibold text-sm sm:text-base shadow-md border border-emerald-200"
                        >
                          Provoni Përsëri
                        </motion.button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showResult && !result.correct && failedAttempts >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 sm:mt-4 text-center"
                >
                  {!showFullText ? (
                    <motion.button
                      onClick={() => setShowFullText(true)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-slate-800 hover:to-slate-900 transition-all font-semibold text-sm sm:text-base shadow-lg"
                    >
                      Shfaq Tekstin e Plotë ({failedAttempts} tentativa)
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-gradient-to-br from-slate-50 to-gray-100 p-3 sm:p-4 rounded-lg border-2 border-gray-300 text-gray-800 text-left shadow-md"
                    >
                      <p className="font-semibold mb-2 text-sm sm:text-base text-slate-700">Teksti Origjinal:</p>
                      <p className="text-sm sm:text-base">{selectedTest.text}</p>
                      <p className="text-xs text-gray-600 mt-2 italic">
                      
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktikë Dëgjimi</h1>
                  <p className="text-gray-600">Përmirësoni aftësitë tuaja të dëgjimit në gjermanisht me ushtrime audio</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Teste të përfunduara: {userProgress.completedTests ? userProgress.completedTests.size : 0}
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${selectedLevel === level
                    ? level === "all"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-emerald-500/30"
                      : getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto">
            {tests.length > 0 ? (
              tests.map((test) => {
                const isCompleted = userProgress.completedTests && userProgress.completedTests.has(test._id)
                const potentialXP = test.xpReward || getBaseXP(test.level)
                return (
                  <div
                    key={test._id}
                    className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${isCompleted
                        ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                        : "bg-white border-gray-100 hover:border-emerald-300"
                      }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div
                      className={`absolute top-3 right-3 ${getLevelColor(test.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}
                    >
                      {test.level}
                    </div>
                    <Volume2
                      className={`absolute -bottom-4 -right-4 w-20 h-20 ${isCompleted ? "text-amber-100" : "text-gray-100"
                        } transition-transform group-hover:scale-110`}
                    />
                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-bold mb-2 pr-14 truncate ${isCompleted
                            ? "text-amber-700 group-hover:text-amber-800"
                            : "text-gray-800 group-hover:text-emerald-700"
                          }`}
                      >
                        {test.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isCompleted ? "text-amber-600" : "text-gray-500"}`}>
                        {test.text ? test.text.substring(0, 80) + "..." : "Ushtrim Audio"}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs font-medium ${isCompleted ? "text-amber-500" : "text-gray-400"}`}>
                          Gjermanisht • Audio
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                            <Star className="h-3 w-3" />
                            {isCompleted ? "2" : potentialXP}
                          </span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${isCompleted
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                              }`}
                          >
                            {isCompleted ? "✓ Kryer" : "Dëgjo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white rounded-2xl p-8 inline-block border border-gray-100 shadow-xl">
                  <Volume2 className="text-emerald-400 w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-gray-800 mb-2">Nuk u gjetën teste</h3>
                  <p className="text-gray-500 text-sm">
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