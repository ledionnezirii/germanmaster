"use client"
import { useState, useEffect } from "react"
import { listenService } from "../services/api"
import { Volume2, Play, Pause, Check, X, Filter, LogOut, Star, Zap, TrendingUp } from "lucide-react"

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
        return "bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4] text-[#0D9488] border-[#5EEAD4]"
      case "A2":
        return "bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4] text-[#0D9488] border-[#2DD4BF]"
      case "B1":
        return "bg-gradient-to-br from-[#5EEAD4] to-[#2DD4BF] text-[#0F766E] border-[#14B8A6]"
      case "B2":
        return "bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] text-white border-[#0D9488]"
      case "C1":
        return "bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white border-[#0F766E]"
      case "C2":
        return "bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white border-[#115E59]"
      default:
        return "bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] text-[#14B8A6] border-[#99F6E4]"
    }
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  if (selectedTest) {
    return (
      <div className="h-[750px] bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] p-2 sm:p-4 rounded-xl shadow-lg border-2 border-[#99F6E4] overflow-hidden">
        {showXpAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#D97706] px-8 py-6 rounded-2xl shadow-2xl border-2 border-[#F59E0B] animate-[xpBounce_0.6s_ease-out]">
              <div className="flex items-center gap-3">
                <Star className="h-10 w-10 text-[#F59E0B] animate-[starSpin_1s_ease-in-out]" />
                <div>
                  <div className="text-3xl font-bold">+{xpGained} XP</div>
                  <div className="text-sm font-medium">Urime!</div>
                </div>
                <Zap className="h-10 w-10 text-[#F59E0B] animate-[pulse_0.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 h-full">
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#99F6E4] p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{selectedTest.title}</h1>
              </div>
              <button
                onClick={resetTest}
                className="text-[#14B8A6] hover:text-[#0D9488] p-1 transition-colors"
                aria-label="Kthehu te Testet"
              >
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-[#14B8A6] via-[#0D9488] to-[#06B6D4] rounded-lg p-4 sm:p-6 text-center shadow-lg shadow-teal-500/30">
                <button
                  onClick={() => playAudio(selectedTest.text)}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 sm:p-4 rounded-full hover:bg-white/30 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  aria-label={isPlaying ? "Pauzë" : "Luaj"}
                >
                  {isPlaying ? <Pause className="h-6 w-6 sm:h-8 sm:w-8" /> : <Play className="h-6 w-6 sm:h-8 sm:w-8" />}
                </button>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/90 font-medium">
                  Klikoni për të dëgjuar tekstin gjermanisht
                </p>
              </div>

              {!showResult && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="user-answer"
                      className="block text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Shkruani atë që dëgjuat:
                    </label>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] px-3 py-1 rounded-full border border-[#F59E0B]">
                      <Star className="h-3 w-3 text-[#F59E0B]" />
                      <span className="text-xs font-bold text-[#D97706]">
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
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] hover:from-[#CCFBF1] hover:to-[#99F6E4] border border-[#99F6E4] rounded text-xs sm:text-sm font-medium text-[#0D9488] transition-all shadow-sm hover:shadow-md"
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
                    className="w-full p-3 border-2 border-[#99F6E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] text-gray-800 placeholder-gray-500 text-sm sm:text-base shadow-sm"
                    rows="10"
                    placeholder="Shkruani tekstin gjermanisht që dëgjuat..."
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white py-2.5 sm:py-3 rounded-lg hover:from-[#0D9488] hover:to-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm sm:text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Kontrollo Përgjigjen
                  </button>
                </div>
              )}

              {showResult && (
                <div
                  className={`p-3 sm:p-4 rounded-lg border-2 shadow-lg ${
                    result.correct
                      ? "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#F59E0B]"
                      : "bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] border-[#EF4444]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.correct ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#D97706]" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#DC2626]" />
                    )}
                    <p
                      className={`font-medium text-sm sm:text-base ${
                        result.correct ? "text-[#D97706]" : "text-[#DC2626]"
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                  {result.correct && (
                    <div className="mt-2 flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                      <span className="font-bold text-[#D97706]">+{xpGained} XP fituar!</span>
                    </div>
                  )}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={resetTest}
                      className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-3 sm:px-4 py-2 rounded-lg hover:from-[#0D9488] hover:to-[#0891B2] transition-all font-semibold text-sm sm:text-base shadow-lg shadow-teal-500/30"
                    >
                      Kthehu te Testet
                    </button>
                    {!result.correct && (
                      <button
                        onClick={() => {
                          setShowResult(false)
                          setUserAnswer("")
                        }}
                        className="bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4] text-[#0D9488] px-3 sm:px-4 py-2 rounded-lg hover:from-[#5EEAD4] hover:to-[#2DD4BF] transition-all font-semibold text-sm sm:text-base shadow-md"
                      >
                        Provoni Përsëri
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showResult && !result.correct && failedAttempts >= 4 && (
                <div className="mt-3 sm:mt-4 text-center">
                  {!showFullText ? (
                    <button
                      onClick={() => setShowFullText(true)}
                      className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white px-3 sm:px-4 py-2 rounded-lg hover:from-[#0F766E] hover:to-[#115E59] transition-all font-semibold text-sm sm:text-base shadow-lg"
                    >
                      Shfaq Tekstin e Plotë ({failedAttempts} tentativa)
                    </button>
                  ) : (
                    <div className="bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] p-3 sm:p-4 rounded-lg border-2 border-[#99F6E4] text-gray-800 text-left shadow-md">
                      <p className="font-semibold mb-2 text-sm sm:text-base text-[#0D9488]">Teksti Origjinal:</p>
                      <p className="text-sm sm:text-base">{selectedTest.text}</p>
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Mund ta kopjoni tekstin, por do të merrni{" "}
                        {selectedTest.xpReward || getBaseXP(selectedTest.level)} XP kur të kaloni testin.
                      </p>
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
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#99F6E4] p-6">
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
        </header>

        <div className="bg-white border-2 border-[#99F6E4] p-3 rounded-lg mb-4 shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-[#14B8A6]" />
            <h2 className="text-sm font-medium text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 shadow-sm hover:shadow-md ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-gradient-to-r from-[#14B8A6] to-[#a0dae4] text-[#000c0bfb] border-[#0D9488] shadow-teal-500/30"
                      : getLevelColor(level)
                    : "bg-gradient-to-br from-[#F0FDFA] to-[#b3e4d9] text-[#000c0bfb] hover:from-[#CCFBF1] hover:to-[#99F6E4] border-[#99F6E4]"
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

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto">
            {tests.length > 0 ? (
              tests.map((test) => {
                const isCompleted = userProgress.completedTests && userProgress.completedTests.has(test._id)
                const potentialXP = test.xpReward || getBaseXP(test.level)
                return (
                  <div
                    key={test._id}
                    className={`p-3 rounded-lg shadow-md border-2 transition-all cursor-pointer overflow-hidden relative group h-fit hover:shadow-xl ${
                      isCompleted
                        ? "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#F59E0B] hover:border-[#D97706]"
                        : "bg-white border-[#99F6E4] hover:border-[#5EEAD4]"
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div
                      className={`absolute top-2 right-2 ${getLevelColor(test.level)} px-1.5 py-0.5 rounded text-xs font-medium shadow-sm`}
                    >
                      {test.level}
                    </div>
                    <Volume2
                      className={`absolute -bottom-4 -right-4 w-16 h-16 ${
                        isCompleted ? "text-[#FDE68A]" : "text-[#CCFBF1]"
                      }`}
                    />
                    <div className="relative z-10">
                      <h3
                        className={`text-sm font-semibold mb-1 pr-12 truncate ${
                          isCompleted
                            ? "text-[#D97706] group-hover:text-[#92400E]"
                            : "text-gray-800 group-hover:text-[#0D9488]"
                        }`}
                      >
                        {test.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-[#92400E]" : "text-gray-600"}`}>
                        {test.text ? test.text.substring(0, 80) + "..." : "Ushtrim Audio"}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-[#92400E]" : "text-gray-500"}`}>
                          Gjermanisht • Audio
                        </span>
                        <div className="flex items-center gap-1">
                          {!isCompleted && (
                            <span className="text-xs bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#D97706] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                              <Star className="h-3 w-3" />
                              {potentialXP}
                            </span>
                          )}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium shadow-sm ${
                              isCompleted
                                ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
                                : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white"
                            }`}
                          >
                            {isCompleted ? "Përfunduar" : "Dëgjo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="bg-white rounded-lg p-6 inline-block border-2 border-[#99F6E4] shadow-lg">
                  <Volume2 className="text-[#14B8A6] w-10 h-10 mx-auto mb-3" />
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

      <style>{`
        @keyframes xpBounce {
          0% { 
            transform: scale(0) translateY(50px);
            opacity: 0;
          }
          50% { 
            transform: scale(1.1) translateY(-10px);
            opacity: 1;
          }
          100% { 
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes starSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes starShine {
          0%, 100% { 
            transform: rotate(0deg) scale(1);
            filter: drop-shadow(0 0 2px currentColor);
          }
          50% { 
            transform: rotate(180deg) scale(1.15);
            filter: drop-shadow(0 0 6px currentColor);
          }
        }
      `}</style>
    </div>
  )
}

export default Listen
