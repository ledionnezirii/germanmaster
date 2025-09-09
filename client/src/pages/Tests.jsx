"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { ArrowLeft } from "lucide-react"

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

  const API_BASE = "http://192.168.100.159:5000/api"

  const germanLevels = [
    {
      code: "A1",
      name: "Fillestar A1",
      description: "Gjermanishte bazike për fillestarë",
      gradient: "from-emerald-400 to-emerald-600",
    },
    {
      code: "A2",
      name: "Elementar A2",
      description: "Aftësi elementare në gjermanishte",
      gradient: "from-emerald-500 to-emerald-700",
    },
    {
      code: "B1",
      name: "Mesatar B1",
      description: "Nivel mesatar i gjermanishtes",
      gradient: "from-green-500 to-green-700",
    },
    {
      code: "B2",
      name: "Mesatar i Lartë B2",
      description: "Aftësi mesatare të larta",
      gradient: "from-green-600 to-green-800",
    },
    {
      code: "C1",
      name: "I Avancuar C1",
      description: "Njohuri të avancuara të gjermanishtes",
      gradient: "from-green-700 to-green-900",
    },
    {
      code: "C2",
      name: "Përsosmëri C2",
      description: "Njohuri në nivel gjuhëtari",
      gradient: "from-green-800 to-slate-900",
    },
  ]

  const XPRewardModal = ({ result, onClose }) => {
    const isPassed = result.passed
    const xpEarned = result.xpEarned

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg animate-in zoom-in-95 duration-300">
          <div className="p-8 text-center space-y-6">
            {isPassed ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-green-600">Urime!</h2>
                  <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full">
                    <span className="text-2xl">⭐</span>
                    <span className="text-xl font-bold">+{xpEarned} XP</span>
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>
                    Ju morët {result.percentage}% dhe kaluat testin e nivelit {result.level}!
                  </p>
                  {result.nextLevel && (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      Tani mund të merrni testet e nivelit {result.nextLevel}!
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😔</div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-red-600">Akoma jo aty</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ju morët {result.percentage}% por nevojitet 85% për të kaluar.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Mos u shqetësoni! Mund të provoni përsëri pas një muaji.
                  </p>
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                isPassed
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isPassed ? "Vazhdo" : "Kthehu te Nivelet"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Custom Close Button Component
  const CloseButton = ({ onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 ${className}`}
      aria-label="Close modal"
    >
      <svg 
        className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.5" 
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-red-500/10 scale-0 group-hover:scale-100 transition-transform duration-200"></div>
    </button>
  )

  const TestInstructionsModal = ({ test, onClose, onStartTest }) => {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Udhëzime për Testin
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {test.title} - Niveli {test.level}
                </p>
              </div>
              <CloseButton onClick={onClose} />
            </div>
          </div>
          
          {/* Scrollable Content with Custom Scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-custom" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="p-6 space-y-6">
              {/* Time Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      Koha e Testit: 30 Minuta
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Testi do të dorëzohet automatikisht kur të mbarojë koha.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Udhëzime të Përgjithshme:
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-green-600">1.</span>
                    <p>Ju keni <strong>30 minuta</strong> për të përfunduar testin.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-green-600">2.</span>
                    <p>Çdo pyetje ka <strong>vetëm një përgjigje të saktë</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-green-600">3.</span>
                    <p>Ju mund të ndryshoni përgjigjet tuaja përpara se të dorëzoni testin.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-green-600">4.</span>
                    <p>Nevojitet <strong>85% ose më shumë</strong> për të kaluar testin.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-green-600">5.</span>
                    <p>Nëse koha mbaron, testi do të dorëzohet <strong>automatikisht</strong>.</p>
                  </div>
                </div>
              </div>

              {/* Progression System */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📚</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                    Sistemi i Progresit
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>• Duhet të kaloni <strong>A1</strong> për të hapur <strong>A2</strong></p>
                  <p>• Duhet të kaloni <strong>A2</strong> për të hapur <strong>B1</strong></p>
                  <p>• Duhet të kaloni <strong>B1</strong> për të hapur <strong>B2</strong></p>
                  <p>• Duhet të kaloni <strong>B2</strong> për të hapur <strong>C1</strong></p>
                  <p>• Duhet të kaloni <strong>C1</strong> për të hapur <strong>C2</strong></p>
                </div>
              </div>

              {/* Retake Policy */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🔄</span>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    Politika e Rimarrjes së Testit
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                  <p>• Nëse <strong>dështoni</strong> testin, mund ta rimarrni pas <strong>një muaji</strong>.</p>
                  <p>• Nëse <strong>kaloni</strong> testin, mund të vazhdoni në nivelin tjetër.</p>
                  <p>• Çdo pyetje ka <strong>një mundësi</strong> për përgjigje të saktë.</p>
                </div>
              </div>

              {/* Test Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Detajet e Testit:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Gjithsej Pyetje:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {test.questions?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Koha Totale:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      30 minuta
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Kategoria:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {test.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Pikët për Kalim:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      85%
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Important Notes */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📝</span>
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                    Shënime të Rëndësishme
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                  <p>• Sigurohuni që keni një lidhje të qëndrueshme interneti</p>
                  <p>• Rekomandohet një mjedis i qetë pa shpërqendrime</p>
                  <p>• Lexoni me kujdes çdo pyetje përpara se të përgjigjeni</p>
                  <p>• Kontrolloni përgjigjet tuaja përpara dorëzimit</p>
                  <p>• Mos mbyllni skedën e shfletuesit gjatë testit</p>
                </div>
              </div>

              {/* Success Tips */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Këshilla për Sukses
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p>• Filloni me pyetjet që i dini më mirë</p>
                  <p>• Mos kaloni shumë kohë në një pyetje të vetme</p>
                  <p>• Përpiquni të eliminoni përgjigjet e gabuara</p>
                  <p>• Besoni në përgjigjen e parë nëse jeni të pasigurt</p>
                  <p>• Lini kohë për të kontrolluar përgjigjet në fund</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Anulo
              </button>
              <button
                onClick={onStartTest}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                Fillo Testin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const LockIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const GermanExamView = ({ test }) => {
    if (!test.questions || test.questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="p-6 text-center border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{test.title}</h2>
                <p className="text-red-600 dark:text-red-400 mt-2">
                  Nuk ka pyetje të disponueshme për këtë test. Ju lutemi kontaktoni mbështetjen.
                </p>
              </div>
              <div className="p-6 text-center">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
        const answers = Object.entries(userAnswers).map(([questionId, answer]) => ({
          questionId,
          answer,
        }))

        const response = await fetch(`${API_BASE}/tests/${test._id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers, userId }),
        })

        const data = await response.json()

        if (data.success) {
          const result = data.data
          setTestResult(result)
          setShowXPReward(true)
          setTakingTest(false)
          setUserAnswers({})
          fetchTestAvailability()
        } else {
          alert(data.message || "Gabim në dorëzimin e testit")
        }
      } catch (error) {
        console.error("Error submitting test:", error)
        alert("Gabim në dorëzimin e testit")
      }
    }

    const answeredQuestions = Object.keys(userAnswers).length
    const totalQuestions = test.questions?.length || 0
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Exam Header */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{test.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Niveli: {test.level} • Koha: 30 minuta • Pyetjet: {test.questions?.length}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progresi</span>
                  <span>
                    {answeredQuestions} nga {totalQuestions} të përgjigjura
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {test.questions?.map((question, index) => (
              <div
                key={question._id || index}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm h-fit"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      {question.questionNumber || index + 1}
                    </span>
                    <h3 className="text-base font-semibold leading-relaxed text-gray-900 dark:text-gray-100">
                      {question.questionText}
                    </h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question_${question._id || index}`}
                        value={option.label}
                        checked={userAnswers[question._id || index] === option.label}
                        onChange={() => handleAnswerSelect(question._id || index, option.label)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        <strong className="text-green-600">{option.label})</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 text-center space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {answeredQuestions === totalQuestions
                  ? "Të gjitha pyetjet u përgjigjën! Gati për dorëzim."
                  : `${totalQuestions - answeredQuestions} pyetje të mbetura`}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={submitTest}
                  disabled={answeredQuestions === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                >
                  Dorëzo Testin
                </button>
                <button
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      const response = await fetch(`${API_BASE}/tests/availability?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setTestAvailability(data.data.availability)
      }
    } catch (error) {
      console.error("Error fetching test availability:", error)
    }
  }

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/tests`)
      const data = await response.json()
      if (data.success) {
        setTests(data.data)
      }
    } catch (error) {
      console.error("Error fetching tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestsByLevel = async (level) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/tests?level=${level}`)
      const data = await response.json()
      if (data.success) {
        const testsWithQuestions = await Promise.all(
          data.data.map(async (test) => {
            try {
              const fullTestResponse = await fetch(`${API_BASE}/tests/${test._id}`)
              const fullTestData = await fullTestResponse.json()
              return fullTestData.success ? fullTestData.data : test
            } catch (error) {
              console.error(`Error fetching full test ${test._id}:`, error)
              return test
            }
          }),
        )
        setLevelTests(testsWithQuestions)
      }
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
      return `I përfunduar ✓ (Rezultati: ${availability.lastScore}%)`
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Duke ngarkuar testet...</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/90 rounded-3xl p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-balance text-gray-900 dark:text-gray-100">
              Testet e Gramatikës Gjermane
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-balance">
              Testoni njohuritë tuaja të gjermanishtes në të gjitha nivelet CEFR
            </p>
          </div>

          {/* Level Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {germanLevels.map((level) => {
              const availability = getLevelAvailability(level.code)
              const isAvailable = availability.available
              const isLocked = availability.locked
              const availabilityMessage = getAvailabilityMessage(level.code)

              return (
                <div
                  key={level.code}
                  className={`relative overflow-hidden bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300 ${
                    isAvailable && !isLocked
                      ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={isAvailable && !isLocked ? () => handleLevelSelect(level.code) : undefined}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} opacity-5`} />

                  {isLocked && (
                    <div className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <LockIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}

                  <div className="relative p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        {level.code}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{level.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{level.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative p-6 space-y-4">
                    <span
                      className={`inline-flex items-center justify-center w-full py-2 px-3 rounded-md text-sm font-medium ${
                        availability.reason === "passed"
                          ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {availabilityMessage}
                    </span>

                    <button
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        isAvailable && !isLocked
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          className="mb-4 flex items-center gap-3 cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
            setSelectedLevel(null)
            setLevelTests([])
          }}
        >
          <ArrowLeft size={20}/> Kthehu te Zgjedhja e Nivelit
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Testet e Gramatikës Gjermane - Niveli {selectedLevel}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Zgjidhni një test për të filluar vlerësimin tuaj</p>
        </div>

        {/* Tests Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {levelTests.map((test) => (
            <div
              key={test._id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{test.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Niveli: {test.level} • Kategoria: {test.category}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">Pyetjet</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {test.questions?.length || "Duke ngarkuar..."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">Koha</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">30min</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Vështirësia:</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < (test.difficulty || 1) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTest(test)
                      setTakingTest(true)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                  >
                    Merr Testin
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-12 text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Nuk ka teste të disponueshme për nivelin {selectedLevel}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Kontrolloni më vonë për teste të reja të gramatikës gjermane!
              </p>
            </div>
          </div>
        )}

        {/* Test Instructions Modal */}
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