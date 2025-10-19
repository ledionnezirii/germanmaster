"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import logo from "../../public/wortii.png"
import {
  ArrowLeft,
  Clock,
  BookOpen,
  RotateCcw,
  FileText,
  Lightbulb,
  Award,
  Lock,
  CheckCircle,
  AlertCircle,
  X,
  Check,
} from "lucide-react"
import { testService } from "../services/api"

const Tests = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [takingTest, setTakingTest] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [levelTests, setLevelTests] = useState([])
  const [testAvailability, setTestAvailability] = useState({})
  const [showXPReward, setShowXPReward] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [testStartTime, setTestStartTime] = useState(null)
  const timerIntervalRef = useRef(null)
  const isSubmittingRef = useRef(false)

  const { user } = useAuth()
  const userId = user?.id

  const germanLevels = [
    {
      code: "A1",
      name: "Fillestar A1",
      description: "Gjermanishte bazike për fillestarë",
      color: "bg-blue-50 border-blue-200 text-blue-900",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      code: "A2",
      name: "Elementar A2",
      description: "Aftësi elementare në gjermanishte",
      color: "bg-green-50 border-green-200 text-green-900",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    {
      code: "B1",
      name: "Mesatar B1",
      description: "Nivel mesatar i gjermanishtes",
      color: "bg-amber-50 border-amber-200 text-amber-900",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
    },
    {
      code: "B2",
      name: "Mesatar i Lartë B2",
      description: "Aftësi mesatare të larta",
      color: "bg-orange-50 border-orange-200 text-orange-900",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
    },
    {
      code: "C1",
      name: "I Avancuar C1",
      description: "Njohuri të avancuara të gjermanishtes",
      color: "bg-purple-50 border-purple-200 text-purple-900",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    },
    {
      code: "C2",
      name: "Përsosmëri C2",
      description: "Njohuri në nivel gjuhëtari",
      color: "bg-rose-50 border-rose-200 text-rose-900",
      buttonColor: "bg-rose-600 hover:bg-rose-700",
    },
  ]

  const clearTestState = () => {
    localStorage.removeItem("activeTest")
    localStorage.removeItem("testAnswers")
    localStorage.removeItem("testStartTime")
  }

  const saveTestState = (testId, answers, startTime) => {
    localStorage.setItem("activeTest", testId)
    localStorage.setItem("testAnswers", JSON.stringify(answers))
    localStorage.setItem("testStartTime", startTime.toString())
  }

  useEffect(() => {
    const activeTestId = localStorage.getItem("activeTest")
    const savedAnswers = localStorage.getItem("testAnswers")
    const savedStartTime = localStorage.getItem("testStartTime")

    if (activeTestId && savedAnswers && savedStartTime) {
      // Test was in progress, restore it
      const loadTestAndRestore = async () => {
        try {
          const response = await testService.getTestById(activeTestId)
          const test = response.data

          setSelectedTest(test)
          setUserAnswers(JSON.parse(savedAnswers))
          setTestStartTime(Number.parseInt(savedStartTime))
          setTakingTest(true)

          // Calculate remaining time
          const elapsed = Math.floor((Date.now() - Number.parseInt(savedStartTime)) / 1000)
          const totalTime = 30 * 60 // 30 minutes in seconds
          const remaining = Math.max(0, totalTime - elapsed)
          setTimeRemaining(remaining)

          // If time already expired, auto-submit
          if (remaining === 0) {
            setTimeout(() => {
              handleAutoSubmit(test, JSON.parse(savedAnswers))
            }, 100)
          }
        } catch (error) {
          console.error("Error restoring test:", error)
          clearTestState()
        }
      }

      loadTestAndRestore()
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (takingTest && !isSubmittingRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [takingTest])

  useEffect(() => {
    if (takingTest && timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            // Auto-submit when time runs out
            handleAutoSubmit(selectedTest, userAnswers)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [takingTest, timeRemaining])

  useEffect(() => {
    if (takingTest && selectedTest && testStartTime) {
      saveTestState(selectedTest._id, userAnswers, testStartTime)
    }
  }, [userAnswers, takingTest, selectedTest, testStartTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAutoSubmit = async (test, answers) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      await submitTestAnswers(test, answers, true)
    } finally {
      isSubmittingRef.current = false
    }
  }

  const submitTestAnswers = async (test, answers, isAutoSubmit = false) => {
    if (!userId) {
      alert("Ju lutemi kyçuni për të dorëzuar testin")
      return
    }

    try {
      console.log("[v0] Starting test submission...")
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      console.log("[v0] Submitting answers:", answersArray)
      console.log("[v0] Test ID:", test._id)
      console.log("[v0] User ID:", userId)

      const response = await testService.submitTest(test._id, answersArray, 30, userId)
      console.log("[v0] Submit response:", response)

      if (response && (response.success === true || response.data)) {
        const result = response.data || response
        console.log("[v0] Test result:", result)

        // Clear test state from localStorage
        clearTestState()

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }

        setTestResult(result)
        setShowXPReward(true)
        setTakingTest(false)
        setUserAnswers({})
        setTimeRemaining(null)
        setTestStartTime(null)
        fetchTestAvailability()
      } else {
        console.log("[v0] Response indicates failure:", response)
        alert(response?.message || "Gabim në dorëzimin e testit")
      }
    } catch (error) {
      console.log("[v0] Caught error:", error)

      if (error.response) {
        const status = error.response.status
        const data = error.response.data

        console.log("[v0] Error response status:", status)
        console.log("[v0] Error response data:", data)

        if (status === 500) {
          const errorMsg = data?.error || data?.message || "Gabim i brendshëm në server"
          console.log("[v0] Server error details:", errorMsg)

          if (errorMsg.includes("getNextLevel")) {
            alert("Gabim në server: Problem me llogaritjen e nivelit të ardhshëm. Ju lutemi kontaktoni mbështetjen.")
          } else {
            alert(`Gabim në server: ${errorMsg}. Ju lutemi provoni përsëri më vonë.`)
          }
        } else if (status === 400) {
          alert(data?.message || "Të dhënat e dërguara janë të pavlefshme")
        } else if (status === 401) {
          alert("Ju nuk jeni të autorizuar. Ju lutemi kyçuni përsëri.")
        } else if (status === 403) {
          alert("Nuk keni leje për të kryer këtë veprim")
        } else if (data && data.message) {
          alert(data.message)
        } else {
          alert(`Gabim në dorëzimin e testit (Kodi: ${status})`)
        }
      } else if (error.request) {
        console.log("[v0] Network error:", error.request)
        alert("Gabim në lidhjen me serverin. Kontrolloni internetin tuaj dhe provoni përsëri.")
      } else {
        console.log("[v0] Other error:", error.message)
        alert(`Gabim i papritur: ${error.message}`)
      }
    }
  }

  const XPRewardModal = ({ result, onClose }) => {
    const isPassed = result.passed
    const xpEarned = result.xpEarned

    const handleClose = () => {
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 text-center space-y-4">
            {isPassed ? (
              <>
                <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-green-600">Urime!</h2>
                  <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    <Award className="w-3.5 h-3.5" />
                    <span>+{xpEarned} XP</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-gray-600 text-xs leading-relaxed">
                  <p>
                    Ju morët {result.percentage}% dhe kaluat testin e nivelit {result.level}!
                  </p>
                  {result.nextLevel && (
                    <p className="text-green-600 font-medium">
                      Tani mund të merrni testet e nivelit {result.nextLevel}!
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-red-600">Akoma jo aty</h2>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Ju morët {result.percentage}% por nevojitet 85% për të kaluar.
                  </p>
                  <p className="text-xs text-gray-500">Mos u shqetësoni! Mund të provoni përsëri pas një muaji.</p>
                </div>
              </>
            )}

            <button
              onClick={handleClose}
              className={`w-full px-3 py-2 rounded-md font-medium transition-colors text-xs ${
                isPassed ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {isPassed ? "Vazhdo" : "Kthehu te Nivelet"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CloseButton = ({ onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`group flex items-center justify-center w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors ${className}`}
      aria-label="Close modal"
    >
      <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
    </button>
  )

  const TestInstructionsModal = ({ test, onClose, onStartTest }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Udhëzime për Testin</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {test.title} - Niveli {test.level}
                </p>
              </div>
              <CloseButton onClick={onClose} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 text-xs">Koha e Testit: 30 Minuta</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Testi do të dorëzohet automatikisht kur të mbarojë koha.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Udhëzime të Përgjithshme:
              </h3>
              <div className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-800 shrink-0">1.</span>
                  <p>
                    Ju keni <strong>30 minuta</strong> për të përfunduar testin.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-800 shrink-0">2.</span>
                  <p>
                    Çdo pyetje ka <strong>vetëm një përgjigje të saktë</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-800 shrink-0">3.</span>
                  <p>Ju mund të ndryshoni përgjigjet tuaja përpara se të dorëzoni testin.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-800 shrink-0">4.</span>
                  <p>
                    Nevojitet <strong>85% ose më shumë</strong> për të kaluar testin.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <h3 className="font-medium text-blue-800 text-xs">Sistemi i Progresit</h3>
              </div>
              <div className="space-y-0.5 text-xs text-blue-700 leading-relaxed">
                <p>
                  • Duhet të kaloni <strong>A1</strong> për të hapur <strong>A2</strong>
                </p>
                <p>
                  • Duhet të kaloni <strong>A2</strong> për të hapur <strong>B1</strong>
                </p>
                <p>
                  • Duhet të kaloni <strong>B1</strong> për të hapur <strong>B2</strong>
                </p>
                <p>
                  • Duhet të kaloni <strong>B2</strong> për të hapur <strong>C1</strong>
                </p>
                <p>
                  • Duhet të kaloni <strong>C1</strong> për të hapur <strong>C2</strong>
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                <h3 className="font-medium text-orange-800 text-xs">Politika e Rimarrjes së Testit</h3>
              </div>
              <div className="space-y-0.5 text-xs text-orange-700 leading-relaxed">
                <p>
                  • Nëse <strong>dështoni</strong> testin, mund ta rimarrni pas <strong>një muaji</strong>.
                </p>
                <p>
                  • Nëse <strong>kaloni</strong> testin, mund të vazhdoni në nivelin tjetër.
                </p>
                <p>
                  • Çdo pyetje ka <strong>një mundësi</strong> për përgjigje të saktë.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
              <h3 className="font-medium text-gray-900 mb-2 text-xs">Detajet e Testit:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gjithsej Pyetje:</span>
                  <span className="font-medium text-gray-900">{test.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Koha Totale:</span>
                  <span className="font-medium text-gray-900">30 minuta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategoria:</span>
                  <span className="font-medium text-gray-900">{test.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pikët për Kalim:</span>
                  <span className="font-medium text-gray-900">85%</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-green-600" />
                <h3 className="font-medium text-green-800 text-xs">Këshilla për Sukses</h3>
              </div>
              <div className="space-y-0.5 text-xs text-green-700 leading-relaxed">
                <p>• Filloni me pyetjet që i dini më mirë</p>
                <p>• Mos kaloni shumë kohë në një pyetje të vetme</p>
                <p>• Përpiquni të eliminoni përgjigjet e gabuara</p>
                <p>• Besoni në përgjigjen e parë nëse jeni të pasigurt</p>
                <p>• Lini kohë për të kontrolluar përgjigjet në fund</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium text-xs border border-gray-200"
              >
                Anulo
              </button>
              <button
                onClick={onStartTest}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors text-xs"
              >
                Fillo Testin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const LockIcon = ({ className = "w-5 h-5" }) => <Lock className={className} />

  const GermanExamView = ({ test }) => {
    if (!test.questions || test.questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {test.title}
                </h2>
                <p className="text-red-600 mt-2 text-xs">
                  Nuk ka pyetje të disponueshme për këtë test. Ju lutemi kontaktoni mbështetjen.
                </p>
              </div>
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  className="px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 text-xs font-medium"
                  onClick={() => {
                    setTakingTest(false)
                    setUserAnswers({})
                    clearTestState()
                  }}
                >
                  Kthehu te Testet
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const handleAnswerSelect = (questionId, answer) => {
      setUserAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }))
    }

    const submitTest = async () => {
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true

      try {
        await submitTestAnswers(test, userAnswers, false)
      } finally {
        isSubmittingRef.current = false
      }
    }

    const handleCancelTest = () => {
      if (window.confirm("Jeni të sigurt që dëshironi të anuloni testin? Do të ktheheni te zgjedhja e nivelit.")) {
        clearTestState()
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        setTakingTest(false)
        setUserAnswers({})
        setTimeRemaining(null)
        setTestStartTime(null)
        setSelectedLevel(null)
        setLevelTests([])
      }
    }

    const answeredQuestions = Object.keys(userAnswers).length
    const totalQuestions = test.questions?.length || 0
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    const getTimerColor = () => {
      if (timeRemaining === null) return "text-gray-600"
      if (timeRemaining <= 300) return "text-red-600" // 5 minutes or less
      if (timeRemaining <= 900) return "text-orange-600" // 15 minutes or less
      return "text-green-600" // More than 15 minutes
    }

    return (
      <div
        className="min-h-screen bg-gray-50 p-4 select-none"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 text-center">
              <p
                className="text-xs font-semibold text-blue-600 uppercase tracking-wide"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                TEST YOUR GERMAN SKILLS
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                {test.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Niveli: {test.level} • Koha: 30 minuta • Pyetjet: {test.questions?.length}
              </p>

              {timeRemaining !== null && (
                <div className={`mt-4 flex items-center justify-center gap-1.5 ${getTimerColor()}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  <span>Progresi</span>
                  <span>
                    {answeredQuestions} nga {totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gray-800 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {test.questions?.map((question, index) => (
              <div key={question._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-2">
                    <span
                      className="shrink-0 inline-flex items-center px-2 py-1 rounded text-sm font-semibold bg-gray-100 text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {question.questionNumber || index + 1}
                    </span>
                    <h3
                      className="text-sm font-medium leading-relaxed text-gray-900"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {question.questionText}
                    </h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-start gap-2.5 p-3 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question_${question._id || index}`}
                        value={option.label}
                        checked={userAnswers[question._id || index] === option.label}
                        onChange={() => handleAnswerSelect(question._id || index, option.label)}
                        className="mt-0.5 text-gray-800 focus:ring-gray-500 focus:ring-1"
                      />
                      <span
                        className="text-sm leading-relaxed text-gray-700"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <strong className="text-gray-800">{option.label})</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 text-center space-y-2">
              <div className="text-xs text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                {answeredQuestions === totalQuestions
                  ? "Të gjitha pyetjet u përgjigjën! Gati për dorëzim."
                  : `${totalQuestions - answeredQuestions} pyetje të mbetura`}
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={submitTest}
                  disabled={answeredQuestions === 0 || isSubmittingRef.current}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors text-xs"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {isSubmittingRef.current ? "Duke dorëzuar..." : "Dorëzo Testin"}
                </button>
                <button
                  className="px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 font-medium text-xs"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  onClick={handleCancelTest}
                  disabled={isSubmittingRef.current}
                >
                  Anulo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fetchTestAvailability = async () => {
    if (!userId) {
      return
    }

    try {
      const response = await testService.getTestAvailability(userId)
      setTestAvailability(response.data.availability)
    } catch (error) {
      console.error("Error fetching test availability:", error)
    }
  }

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await testService.getAllTests()
      setTests(response.data)
    } catch (error) {
      console.error("Error fetching tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestsByLevel = async (level) => {
    setLoading(true)
    try {
      const response = await testService.getAllTests({ level })
      const testsWithQuestions = await Promise.all(
        response.data.map(async (test) => {
          try {
            const fullTestResponse = await testService.getTestById(test._id)
            return fullTestResponse.data
          } catch (error) {
            console.error(`Error fetching full test ${test._id}:`, error)
            return test
          }
        }),
      )
      setLevelTests(testsWithQuestions)
    } catch (error) {
      console.error("Error fetching tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelSelect = (level) => {
    setSelectedLevel(level)
    fetchTestsByLevel(level)
  }

  const getLevelAvailability = (levelCode) => {
    const availability = testAvailability[levelCode]
    if (!availability) return { available: true, reason: "not_taken", locked: false }
    return availability
  }

  const getAvailabilityMessage = (levelCode) => {
    const availability = getLevelAvailability(levelCode)

    if (availability.available) {
      if (availability.reason === "cooldown_expired") {
        return `I disponueshëm (Rezultati i fundit: ${availability.lastScore}%)`
      }
      return "I disponueshëm"
    }

    if (availability.reason === "passed") {
      return `I përfunduar (Rezultati: ${availability.lastScore}%)`
    }

    if (availability.reason === "cooldown") {
      const nextDate = new Date(availability.nextAvailableAt).toLocaleDateString()
      return `I disponueshëm ${nextDate} (Rezultati i fundit: ${availability.lastScore}%)`
    }

    if (availability.reason === "progression_locked") {
      return `Përfundoni ${availability.requiresLevel} së pari`
    }

    if (availability.reason === "blocked_by_cooldown") {
      return `I bllokuar deri sa të skadojë ${availability.blockedBy}`
    }

    return "I disponueshëm"
  }

  useEffect(() => {
    fetchTests()
    if (userId) {
      fetchTestAvailability()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-xs bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mx-auto mb-2"></div>
            <p className="text-gray-600 text-xs">Duke ngarkuar testet...</p>
          </div>
        </div>
      </div>
    )
  }

  if (takingTest && selectedTest) {
    return <GermanExamView test={selectedTest} />
  }

  if (showXPReward && testResult) {
    return (
      <XPRewardModal
        result={testResult}
        onClose={() => {
          setShowXPReward(false)
          setTestResult(null)
          setSelectedLevel(null)
          setLevelTests([])
        }}
      />
    )
  }

  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Testet e Gramatikës Gjermane
            </h1>
            <p className="text-base text-gray-600 mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
              Testoni njohuritë tuaja të gjermanishtes në të gjitha nivelet CEFR
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {germanLevels.map((level) => {
              const availability = getLevelAvailability(level.code)
              const isAvailable = availability.available
              const isLocked = availability.locked
              const availabilityMessage = getAvailabilityMessage(level.code)

              return (
                <div
                  key={level.code}
                  className={`relative overflow-hidden rounded-xl shadow-sm border-2 transition-all duration-200 ${level.color} ${
                    isAvailable && !isLocked ? "hover:shadow-lg cursor-pointer" : "opacity-70 cursor-not-allowed"
                  }`}
                  onClick={isAvailable && !isLocked ? () => handleLevelSelect(level.code) : undefined}
                >
                  <div className="absolute top-4 left-4">
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-base font-bold border-2 bg-white shadow-sm"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {level.code}
                    </span>
                  </div>

                  {isLocked && (
                    <div className="absolute top-4 right-4 p-2 bg-white/70 rounded-lg shadow-sm">
                      <LockIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  {availability.reason === "passed" && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 text-white stroke-[3]" />
                    </div>
                  )}

                  <div className="p-5 pt-16">
                    <div>
                      <h3 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {level.name}
                      </h3>
                      <p className="mt-1 text-sm opacity-90" style={{ fontFamily: "Inter, sans-serif" }}>
                        {level.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                        <span className="opacity-80">
                          {availability.reason === "passed" ? "Përfunduar" : "Progresi"}
                        </span>
                        <span className="font-semibold">{availability.reason === "passed" ? "100%" : "0%"}</span>
                      </div>
                      <div className="w-full bg-white/40 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            availability.reason === "passed" ? "bg-green-500 w-full" : "bg-gray-300 w-0"
                          }`}
                        ></div>
                      </div>
                    </div>

                    {availability.reason === "passed" && availability.lastScore && (
                      <div className="text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <span className="opacity-80">Rezultati: </span>
                        <span className="font-bold">{availability.lastScore}%</span>
                      </div>
                    )}

                    {availability.reason === "passed" && availability.lastAttemptDate && (
                      <div className="text-xs opacity-75" style={{ fontFamily: "Inter, sans-serif" }}>
                        Përfunduar më: {new Date(availability.lastAttemptDate).toLocaleDateString("sq-AL")}
                      </div>
                    )}

                    <button
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm flex items-center justify-center gap-2 ${
                        isAvailable && !isLocked
                          ? `${level.buttonColor} text-white shadow-md hover:shadow-lg`
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      disabled={!isAvailable || isLocked}
                    >
                      {isLocked ? (
                        <>
                          <LockIcon className="w-4 h-4" />
                          Njohuri në nivel gjuhëtari
                        </>
                      ) : isAvailable ? (
                        <>
                          <span>→</span> Merr Testin {level.code}
                        </>
                      ) : (
                        "I kyçur"
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-sm font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
          onClick={() => {
            setSelectedLevel(null)
            setLevelTests([])
          }}
        >
          <ArrowLeft size={16} /> Kthehu te Zgjedhja e Nivelit
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                Testet e Gramatikës Gjermane
              </h1>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Zgjidhni një test për të filluar vlerësimin tuaj për nivelin {selectedLevel}.
              </p>
            </div>
            <div className="text-4xl">
              <img src={logo || "/placeholder.svg"} className="rounded-full" width={48} height={48} alt="" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {levelTests.map((test) => {
            const levelInfo = germanLevels.find((l) => l.code === test.level)
            const badgeColor =
              test.level === "A1"
                ? "bg-blue-100 text-blue-700"
                : test.level === "A2"
                  ? "bg-green-100 text-green-700"
                  : test.level === "B1"
                    ? "bg-amber-100 text-amber-700"
                    : test.level === "B2"
                      ? "bg-orange-100 text-orange-700"
                      : test.level === "C1"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-rose-100 text-rose-700"

            return (
              <div
                key={test._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Level badge and question mark icon */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${badgeColor}`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {test.level}
                    </span>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <img
                        src={logo || "/placeholder.svg"}
                        className="rounded-full"
                        width={48}
                        height={48}
                        alt=""
                      />{" "}
                    </div>
                  </div>

                  {/* Question count and duration */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        {test.questions?.length || 1} Pyetje
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        30 Minuta
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedTest(test)
                        setShowInstructions(true)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Shiko
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTest(test)
                        const startTime = Date.now()
                        setTestStartTime(startTime)
                        setTimeRemaining(30 * 60)
                        setTakingTest(true)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-semibold"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Merr Testin
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {levelTests.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 text-center space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Nuk ka teste të disponueshme për nivelin {selectedLevel}
              </h3>
              <p className="text-gray-600 text-xs">Kontrolloni më vonë për teste të reja të gramatikës gjermane!</p>
            </div>
          </div>
        )}

        {showInstructions && selectedTest && (
          <TestInstructionsModal
            test={selectedTest}
            onClose={() => {
              setShowInstructions(false)
              setSelectedTest(null)
            }}
            onStartTest={() => {
              setShowInstructions(false)
              const startTime = Date.now()
              setTestStartTime(startTime)
              setTimeRemaining(30 * 60)
              setTakingTest(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Tests
