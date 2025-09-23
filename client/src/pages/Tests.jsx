"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
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
  Star,
  Users,
  Target
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

  const { user } = useAuth()
  const userId = user?.id

  const germanLevels = [
    {
      code: "A1",
      name: "Fillestar A1",
      description: "Gjermanishte bazike për fillestarë",
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900",
      buttonColor: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
    },
    {
      code: "A2",
      name: "Elementar A2",
      description: "Aftësi elementare në gjermanishte",
      color: "bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-900",
      buttonColor: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
    },
    {
      code: "B1",
      name: "Mesatar B1",
      description: "Nivel mesatar i gjermanishtes",
      color: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900",
      buttonColor: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
    },
    {
      code: "B2",
      name: "Mesatar i Lartë B2",
      description: "Aftësi mesatare të larta",
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-900",
      buttonColor: "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800",
    },
    {
      code: "C1",
      name: "I Avancuar C1",
      description: "Njohuri të avancuara të gjermanishtes",
      color: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-900",
      buttonColor: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
    },
    {
      code: "C2",
      name: "Përsosmëri C2",
      description: "Njohuri në nivel gjuhëtari",
      color: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-900",
      buttonColor: "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800",
    },
  ]

  const XPRewardModal = ({ result, onClose }) => {
    const isPassed = result.passed
    const xpEarned = result.xpEarned

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-gray-200">
          <div className="p-8 text-center space-y-6">
            {isPassed ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-green-600">Urime!</h2>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm">
                    <Award className="w-4 h-4" />
                    <span className="font-medium">+{xpEarned} XP</span>
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 text-sm">
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
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-red-600">Akoma jo aty</h2>
                  <p className="text-gray-600 text-sm">Ju morët {result.percentage}% por nevojitet 85% për të kaluar.</p>
                  <p className="text-xs text-gray-500">Mos u shqetësoni! Mund të provoni përsëri pas një muaji.</p>
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isPassed ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
      className={`group flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 transition-colors ${className}`}
      aria-label="Close modal"
    >
      <X className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
    </button>
  )

  const TestInstructionsModal = ({ test, onClose, onStartTest }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Udhëzime për Testin</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {test.title} - Niveli {test.level}
                </p>
              </div>
              <CloseButton onClick={onClose} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800 text-sm">Koha e Testit: 30 Minuta</h3>
                  <p className="text-xs text-amber-700">Testi do të dorëzohet automatikisht kur të mbarojë koha.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Udhëzime të Përgjithshme:
              </h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600">1.</span>
                  <p>Ju keni <strong>30 minuta</strong> për të përfunduar testin.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600">2.</span>
                  <p>Çdo pyetje ka <strong>vetëm një përgjigje të saktë</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600">3.</span>
                  <p>Ju mund të ndryshoni përgjigjet tuaja përpara se të dorëzoni testin.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600">4.</span>
                  <p>Nevojitet <strong>85% ose më shumë</strong> për të kaluar testin.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-blue-800 text-sm">Sistemi i Progresit</h3>
              </div>
              <div className="space-y-1 text-xs text-blue-700">
                <p>• Duhet të kaloni <strong>A1</strong> për të hapur <strong>A2</strong></p>
                <p>• Duhet të kaloni <strong>A2</strong> për të hapur <strong>B1</strong></p>
                <p>• Duhet të kaloni <strong>B1</strong> për të hapur <strong>B2</strong></p>
                <p>• Duhet të kaloni <strong>B2</strong> për të hapur <strong>C1</strong></p>
                <p>• Duhet të kaloni <strong>C1</strong> për të hapur <strong>C2</strong></p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <h3 className="font-medium text-orange-800 text-sm">Politika e Rimarrjes së Testit</h3>
              </div>
              <div className="space-y-1 text-xs text-orange-700">
                <p>• Nëse <strong>dështoni</strong> testin, mund ta rimarrni pas <strong>një muaji</strong>.</p>
                <p>• Nëse <strong>kaloni</strong> testin, mund të vazhdoni në nivelin tjetër.</p>
                <p>• Çdo pyetje ka <strong>një mundësi</strong> për përgjigje të saktë.</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">Detajet e Testit:</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-green-800 text-sm">Këshilla për Sukses</h3>
              </div>
              <div className="space-y-1 text-xs text-green-700">
                <p>• Filloni me pyetjet që i dini më mirë</p>
                <p>• Mos kaloni shumë kohë në një pyetje të vetme</p>
                <p>• Përpiquni të eliminoni përgjigjet e gabuara</p>
                <p>• Besoni në përgjigjen e parë nëse jeni të pasigurt</p>
                <p>• Lini kohë për të kontrolluar përgjigjet në fund</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-4 bg-gray-50 border-t">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm border"
              >
                Anulo
              </button>
              <button
                onClick={onStartTest}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Fillo Testin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const LockIcon = ({ className = "w-5 h-5" }) => (
    <Lock className={className} />
  )

  const GermanExamView = ({ test }) => {
    if (!test.questions || test.questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
                <p className="text-red-600 mt-2 text-sm">
                  Nuk ka pyetje të disponueshme për këtë test. Ju lutemi kontaktoni mbështetjen.
                </p>
              </div>
              <div className="p-6 text-center border-t">
                <button
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors border text-sm"
                  onClick={() => {
                    setTakingTest(false)
                    setUserAnswers({})
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
      if (!userId) {
        alert("Ju lutemi kyçuni për të dorëzuar testin")
        return
      }

      try {
        console.log("[v0] Starting test submission...")
        const answers = Object.entries(userAnswers).map(([questionId, answer]) => ({
          questionId,
          answer,
        }))

        console.log("[v0] Submitting answers:", answers)
        console.log("[v0] Test ID:", test._id)
        console.log("[v0] User ID:", userId)

        const response = await testService.submitTest(test._id, answers, 30, userId)
        console.log("[v0] Submit response:", response)

        if (response && (response.success === true || response.data)) {
          const result = response.data || response
          console.log("[v0] Test result:", result)
          setTestResult(result)
          setShowXPReward(true)
          setTakingTest(false)
          setUserAnswers({})
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

    const answeredQuestions = Object.keys(userAnswers).length
    const totalQuestions = test.questions?.length || 0
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 text-center">
              <h1 className="text-xl font-semibold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Niveli: {test.level} • Koha: 30 minuta • Pyetjet: {test.questions?.length}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progresi</span>
                  <span>
                    {answeredQuestions} nga {totalQuestions} të përgjigjura
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {test.questions?.map((question, index) => (
              <div key={question._id || index} className="bg-white rounded-lg shadow-sm border h-fit">
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {question.questionNumber || index + 1}
                    </span>
                    <h3 className="text-sm font-medium leading-relaxed text-gray-900">{question.questionText}</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question_${question._id || index}`}
                        value={option.label}
                        checked={userAnswers[question._id || index] === option.label}
                        onChange={() => handleAnswerSelect(question._id || index, option.label)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs leading-relaxed text-gray-700">
                        <strong className="text-green-600">{option.label})</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 text-center space-y-3">
              <div className="text-xs text-gray-600">
                {answeredQuestions === totalQuestions
                  ? "Të gjitha pyetjet u përgjigjën! Gati për dorëzim."
                  : `${totalQuestions - answeredQuestions} pyetje të mbetura`}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={submitTest}
                  disabled={answeredQuestions === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Dorëzo Testin
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors border text-sm"
                  onClick={() => {
                    setTakingTest(false)
                    setUserAnswers({})
                  }}
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
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Duke ngarkuar testet...</p>
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
          if (!testResult.passed) {
            setSelectedLevel(null)
            setLevelTests([])
          }
        }}
      />
    )
  }

  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Testet e Gramatikës Gjermane
            </h1>
            <p className="text-lg text-gray-600 font-medium">
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
                  className={`relative overflow-hidden bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
                    isAvailable && !isLocked
                      ? "hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 cursor-pointer"
                      : "opacity-70 cursor-not-allowed"
                  }`}
                  onClick={isAvailable && !isLocked ? () => handleLevelSelect(level.code) : undefined}
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3 p-1.5 bg-gray-100 rounded-full">
                      <LockIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-base font-bold border-2 shadow-sm ${level.color}`}>
                        {level.code}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{level.name}</h3>
                        <p className="text-gray-600 mt-1 text-sm font-medium">{level.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-4">
                    <span
                      className={`inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-sm font-semibold border-2 shadow-sm ${
                        availability.reason === "passed" ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300" : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {availability.reason === "passed" && <CheckCircle className="w-4 h-4 mr-2" />}
                      {availabilityMessage}
                    </span>

                    <button
                      className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-sm shadow-md border-2 ${
                        isAvailable && !isLocked
                          ? `${level.buttonColor} text-white border-transparent hover:shadow-lg hover:scale-105`
                          : "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                      }`}
                      disabled={!isAvailable || isLocked}
                    >
                      {isLocked ? (
                        <>
                          <LockIcon className="w-4 h-4 mr-2 inline" />I kyçur
                        </>
                      ) : isAvailable ? (
                        `Merr Testin ${level.code}`
                      ) : (
                        "Jo i disponueshëm"
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
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          className="mb-4 flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors border text-sm"
          onClick={() => {
            setSelectedLevel(null)
            setLevelTests([])
          }}
        >
          <ArrowLeft size={16} /> Kthehu te Zgjedhja e Nivelit
        </button>

        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Testet e Gramatikës Gjermane - Niveli {selectedLevel}
          </h1>
          <p className="text-gray-600 text-base font-medium">Zgjidhni një test për të filluar vlerësimin tuaj</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {levelTests.map((test) => (
            <div key={test._id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                <p className="text-gray-600 mt-2 text-sm font-medium">
                  Niveli: {test.level} • Kategoria: {test.category}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">Pyetjet</p>
                    <p className="font-bold text-gray-900 text-lg">{test.questions?.length || "Duke ngarkuar..."}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">Koha</p>
                    <p className="font-bold text-gray-900 text-lg">30min</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Vështirësia:</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < (test.difficulty || 1) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedTest(test)
                      setTakingTest(true)
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:scale-105"
                  >
                    Merr Testin
                  </button>
                  <button
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border-2 border-gray-200 font-bold text-sm shadow-sm hover:shadow-md"
                    onClick={() => {
                      setSelectedTest(test)
                      setShowInstructions(true)
                    }}
                  >
                    Shiko
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {levelTests.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-8 text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Nuk ka teste të disponueshme për nivelin {selectedLevel}
              </h3>
              <p className="text-gray-600 text-sm">Kontrolloni më vonë për teste të reja të gramatikës gjermane!</p>
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
              setTakingTest(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Tests