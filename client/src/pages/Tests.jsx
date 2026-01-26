"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import logo from "../../public/logo.png"
import { ArrowLeft, Clock, BookOpen, RotateCcw, FileText, Lightbulb, Award, Lock, CheckCircle, AlertCircle, X, Check, ShieldAlert, Eye } from 'lucide-react'
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
  const [testSessionId, setTestSessionId] = useState(null)
  const [securityViolation, setSecurityViolation] = useState(null)
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  const [showUnansweredModal, setShowUnansweredModal] = useState(false)
  const [unansweredInfo, setUnansweredInfo] = useState({ count: 0, numbers: '' })
  const timerIntervalRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const testActiveRef = useRef(false)
  const visibilityViolationRef = useRef(false)

  const { user } = useAuth()
  const userId = user?.id

  // SEO Effect
  useEffect(() => {
    // Update page title
    document.title = "Teste Gjermanisht - Vlerëso Nivelin Tuaj | Teste A1-C2 me Siguri"
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = "Bëni teste gjermanisht për të vlerësuar nivelin tuaj nga A1 deri C2. Teste të sigurta me 85% për kalim. Fillo testin tuaj sot!"
    
    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.name = 'keywords'
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.content = "teste gjermanisht, test gjermane, german test, prüfung deutsch, vlerësim nivel, A1 A2 B1 B2 C1 C2, test certifikim"
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = `${window.location.origin}/tests`
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', 'Teste Gjermanisht - Vlerëso Nivelin Tuaj')
    updateMetaTag('og:description', 'Bëni teste gjermanisht për të vlerësuar nivelin tuaj nga A1 deri C2. Teste të sigurta dhe të vlerësuara.')
    updateMetaTag('og:url', `${window.location.origin}/tests`)
    updateMetaTag('og:type', 'website')
    
    // Update Twitter meta tags
    updateMetaTag('twitter:title', 'Teste Gjermanisht - Vlerëso Nivelin Tuaj')
    updateMetaTag('twitter:description', 'Bëni teste gjermanisht për të vlerësuar nivelin tuaj nga A1 deri C2. Teste të sigurta.')
    
    // Add structured data for tests page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Teste Gjermanisht",
      "description": "Vlerësoni nivelin tuaj të gjuhës gjermane me teste nga A1 deri C2",
      "url": `${window.location.origin}/tests`,
      "educationalLevel": ["Beginner", "Intermediate", "Advanced"],
      "inLanguage": ["de", "sq"],
      "learningResourceType": "Assessment",
      "offers": {
        "@type": "Offer",
        "category": "Educational Services"
      }
    }
    
    let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-tests]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.type = 'application/ld+json'
      structuredDataScript.setAttribute('data-tests', 'true')
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)
    
    // Cleanup function
    return () => {
      // Remove the structured data script when component unmounts
      const script = document.querySelector('script[type="application/ld+json"][data-tests]')
      if (script) script.remove()
    }
  }, [])
  
  // Helper function to update meta tags
  const updateMetaTag = (property, content) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(property.startsWith('og:') ? 'property' : 'name', property)
      document.head.appendChild(metaTag)
    }
    metaTag.content = content
  }

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

  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000 // 2 weeks in milliseconds

  const clearTestState = () => {
    localStorage.removeItem("activeTest")
    localStorage.removeItem("testAnswers")
    localStorage.removeItem("testStartTime")
    localStorage.removeItem("testSessionId")
    testActiveRef.current = false
    visibilityViolationRef.current = false
  }

  const saveTestState = (testId, answers, startTime, sessionId) => {
    localStorage.setItem("activeTest", testId)
    localStorage.setItem("testAnswers", JSON.stringify(answers))
    localStorage.setItem("testStartTime", startTime.toString())
    localStorage.setItem("testSessionId", sessionId)
  }

  // Generate unique session ID for test
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Handle security violation - fail test and lock for 2 weeks
  const handleSecurityViolation = useCallback(async (violationType, test, answers) => {
    if (isSubmittingRef.current || visibilityViolationRef.current) return
    visibilityViolationRef.current = true
    isSubmittingRef.current = true

    console.log("[Security] Violation detected:", violationType)
    setSecurityViolation(violationType)

    try {
      // Submit as failed due to security violation
      await testService.submitTestViolation(test._id, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        userId,
        violationType,
        forceFailure: true,
      })
    } catch (error) {
      console.error("[Security] Error submitting violation:", error)
    }

    // Clear test state
    clearTestState()
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    setTakingTest(false)
    setUserAnswers({})
    setTimeRemaining(null)
    setTestStartTime(null)
    setShowSecurityWarning(true)

    // Refresh availability after violation
    fetchTestAvailability()

    isSubmittingRef.current = false
  }, [userId])

  // Visibility change detection - STRICT MODE
  useEffect(() => {
    if (!takingTest || !selectedTest) return

    const handleVisibilityChange = () => {
      if (document.hidden && testActiveRef.current && !visibilityViolationRef.current) {
        console.log("[Security] Tab switched or window hidden - VIOLATION")
        handleSecurityViolation("tab_switch", selectedTest, userAnswers)
      }
    }

    const handleWindowBlur = () => {
      if (testActiveRef.current && !visibilityViolationRef.current) {
        console.log("[Security] Window lost focus - VIOLATION")
        handleSecurityViolation("window_blur", selectedTest, userAnswers)
      }
    }

    const handleWindowFocus = () => {
      // If we're back but already violated, don't do anything
    }

    // Prevent context menu
    const handleContextMenu = (e) => {
      if (testActiveRef.current) {
        e.preventDefault()
        return false
      }
    }

    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      if (!testActiveRef.current) return

      // Prevent common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a' ||
          e.key === 'p' || e.key === 's' || e.key === 'f' || e.key === 'u')
      ) {
        e.preventDefault()
        return false
      }

      // Prevent F12, F5
      if (e.key === 'F12' || e.key === 'F5') {
        e.preventDefault()
        return false
      }

      // Prevent Alt+Tab indicator (can't fully prevent but can detect)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        return false
      }
    }

    // Prevent selection
    const handleSelectStart = (e) => {
      if (testActiveRef.current) {
        e.preventDefault()
        return false
      }
    }

    // Prevent drag
    const handleDragStart = (e) => {
      if (testActiveRef.current) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("selectstart", handleSelectStart)
    document.addEventListener("dragstart", handleDragStart)

    // Set test as active
    testActiveRef.current = true

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      testActiveRef.current = false
    }
  }, [takingTest, selectedTest, userAnswers, handleSecurityViolation])

  // Restore test state on mount - but check if it was abandoned
  useEffect(() => {
    const activeTestId = localStorage.getItem("activeTest")
    const savedAnswers = localStorage.getItem("testAnswers")
    const savedStartTime = localStorage.getItem("testStartTime")
    const savedSessionId = localStorage.getItem("testSessionId")

    if (activeTestId && savedAnswers && savedStartTime) {
      // Check if test time has expired (30 minutes)
      const elapsed = Math.floor((Date.now() - Number.parseInt(savedStartTime)) / 1000)
      const totalTime = 30 * 60

      if (elapsed >= totalTime) {
        // Test expired while away - this is a violation (left the test)
        console.log("[Security] Test was abandoned - time expired while away")

        const handleAbandonedTest = async () => {
          try {
            const response = await testService.getTestById(activeTestId)
            const test = response.data

            await testService.submitTestViolation(test._id, {
              answers: Object.entries(JSON.parse(savedAnswers)).map(([questionId, answer]) => ({
                questionId,
                answer,
              })),
              userId,
              violationType: "test_abandoned",
              forceFailure: true,
            })
          } catch (error) {
            console.error("[Security] Error handling abandoned test:", error)
          }

          clearTestState()
          fetchTestAvailability()
          setShowSecurityWarning(true)
          setSecurityViolation("test_abandoned")
        }

        if (userId) {
          handleAbandonedTest()
        } else {
          clearTestState()
        }
        return
      }

      // Test still valid - restore it
      const loadTestAndRestore = async () => {
        try {
          const response = await testService.getTestById(activeTestId)
          const test = response.data

          setSelectedTest(test)
          setUserAnswers(JSON.parse(savedAnswers))
          setTestStartTime(Number.parseInt(savedStartTime))
          setTestSessionId(savedSessionId)
          setTakingTest(true)

          const remaining = Math.max(0, totalTime - elapsed)
          setTimeRemaining(remaining)

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
  }, [userId])

  // Before unload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (takingTest && !isSubmittingRef.current) {
        e.preventDefault()
        e.returnValue = "Nëse largoheni, testi do të konsiderohet i dështuar dhe do të kyçeni për 2 javë!"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [takingTest])

  // Timer countdown
  useEffect(() => {
    if (takingTest && timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
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

  // Save test state on answer changes
  useEffect(() => {
    if (takingTest && selectedTest && testStartTime && testSessionId) {
      saveTestState(selectedTest._id, userAnswers, testStartTime, testSessionId)
    }
  }, [userAnswers, takingTest, selectedTest, testStartTime, testSessionId])

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

      const response = await testService.submitTest(test._id, answersArray, 30, userId)

      if (response && (response.success === true || response.data)) {
        const result = response.data || response

        clearTestState()
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }

        setTestResult(result)
        setShowXPReward(true)
        setTakingTest(false)
        setUserAnswers({})
        setTimeRemaining(null)
        setTestStartTime(null)
        setTestSessionId(null)
        fetchTestAvailability()
      } else {
        alert(response?.message || "Gabim në dorëzimin e testit")
      }
    } catch (error) {
      console.log("[v0] Caught error:", error)

      if (error.response) {
        const status = error.response.status
        const data = error.response.data

        if (status === 500) {
          const errorMsg = data?.error || data?.message || "Gabim i brendshëm në server"
          alert(`Gabim në server: ${errorMsg}. Ju lutemi provoni përsëri më vonë.`)
        } else if (data && data.message) {
          alert(data.message)
        } else {
          alert(`Gabim në dorëzimin e testit (Kodi: ${status})`)
        }
      } else if (error.request) {
        alert("Gabim në lidhjen me serverin. Kontrolloni internetin tuaj dhe provoni përsëri.")
      } else {
        alert(`Gabim i papritur: ${error.message}`)
      }
    }
  }

  // Unanswered Questions Modal
  const UnansweredQuestionsModal = ({ unansweredCount, unansweredNumbers, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-xl border-2 border-orange-200">
          <div className="p-5 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-orange-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-orange-600">Pyetje të Papërgjigjura!</h2>
              <p className="text-gray-700 text-sm">
                Ju lutemi përgjigjuni të gjitha pyetjeve para se të dorëzoni testin.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
              <p className="text-orange-800 font-semibold text-sm">
                Pyetje të papërgjigjura: {unansweredCount}
              </p>
              <p className="text-orange-700 text-xs">
                Numrat e pyetjeve: <strong>{unansweredNumbers}</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Kthehu te Testi
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Security Warning Modal
  const SecurityWarningModal = ({ violation, onClose }) => {
    const getViolationMessage = () => {
      switch (violation) {
        case "tab_switch":
          return "Ju ndërruat tab-in ose dritaren gjatë testit."
        case "window_blur":
          return "Ju larguat nga dritarja e testit."
        case "test_abandoned":
          return "Ju e braktisët testin dhe koha skadoi."
        case "test_cancelled":
          return "Ju e anuluat testin."
        default:
          return "Shkelje e rregullave të testit."
      }
    }

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-xl border-2 border-red-200">
          <div className="p-5 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-red-600">Shkelje e Sigurisë!</h2>
              <p className="text-gray-700 text-sm">{getViolationMessage()}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <p className="text-red-800 font-semibold text-sm">Pasojat:</p>
              <ul className="text-red-700 text-xs space-y-1 text-left">
                <li>• Testi konsiderohet i DËSHTUAR</li>
                <li>• Ju jeni të KYÇUR për 2 javë</li>
                <li>• Nuk mund të merrni këtë test deri më: <strong>{new Date(Date.now() + TWO_WEEKS_MS).toLocaleDateString('sq-AL')}</strong></li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              E kuptova
            </button>
          </div>
        </div>
      </div>
    )
  }

  const XPRewardModal = ({ result, onClose }) => {
    const isPassed = result.passed
    const xpEarned = result.xpEarned

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="w-full max-w-xs mx-auto bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 text-center space-y-3">
            {isPassed ? (
              <>
                <div className="mx-auto w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-green-600">Urime!</h2>
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Award className="w-3 h-3" />
                    <span>+{xpEarned} XP</span>
                  </div>
                </div>
                <div className="space-y-1 text-gray-600 text-xs leading-relaxed">
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
                <div className="mx-auto w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-red-600">Akoma jo aty</h2>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Ju morët {result.percentage}% por nevojitet 85% për të kaluar.
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-orange-700 font-medium">
                      Mund të provoni përsëri pas 2 javësh.
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Data e ardhshme: {new Date(Date.now() + TWO_WEEKS_MS).toLocaleDateString('sq-AL')}
                    </p>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className={`w-full px-2.5 py-1.5 rounded-md font-medium transition-colors text-xs ${isPassed ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
      className={`group flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors ${className}`}
      aria-label="Close modal"
    >
      <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 transition-colors" />
    </button>
  )

  const TestInstructionsModal = ({ test, onClose, onStartTest }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="flex-shrink-0 p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Udhëzime për Testin</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {test.title} - Niveli {test.level}
                </p>
              </div>
              <CloseButton onClick={onClose} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* Security Warning */}
            <div className="bg-red-50 border-2 border-red-300 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-red-800 text-sm">PARALAJMËRIM I RËNDËSISHËM!</h3>
              </div>
              <div className="space-y-1.5 text-xs text-red-700 leading-relaxed">
                <p className="font-semibold">Ky test ka rregulla të RREPTA sigurie:</p>
                <ul className="space-y-1 ml-3">
                  <li>• <strong>NUK LEJOHET</strong> ndërrimi i tab-it ose dritares</li>
                  <li>• <strong>NUK LEJOHET</strong> kopjimi, ngjitja, ose selektimi i tekstit</li>
                  <li>• <strong>NUK LEJOHET</strong> largimi nga faqja e testit</li>
                  <li>• <strong>NUK LEJOHET</strong> anulimi i testit pasi të fillojë</li>
                </ul>
                <p className="font-bold text-red-800 mt-2">
                  Çdo shkelje = DËSHTIM + KYÇJE PËR 2 JAVË!
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 text-xs">Koha e Testit: 30 Minuta</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Testi do të dorëzohet automatikisht kur të mbarojë koha.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Udhëzime të Përgjithshme:
              </h3>
              <div className="space-y-1 text-xs text-gray-700 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-800 shrink-0">1.</span>
                  <p>
                    Ju keni <strong>30 minuta</strong> për të përfunduar testin.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-800 shrink-0">2.</span>
                  <p>
                    Çdo pyetje ka <strong>vetëm një përgjigje të saktë</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-800 shrink-0">3.</span>
                  <p>Ju mund të ndryshoni përgjigjet tuaja përpara se të dorëzoni testin.</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-800 shrink-0">4.</span>
                  <p>
                    Nevojitet <strong>85% ose më shumë</strong> për të kaluar testin.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-800 shrink-0">5.</span>
                  <p>
                    <strong>DUHET</strong> t'i përgjigjeni të gjitha pyetjeve para dorëzimit.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
              <div className="flex items-center gap-1 mb-1">
                <RotateCcw className="w-3 h-3 text-orange-600" />
                <h3 className="font-medium text-orange-800 text-xs">Politika e Rimarrjes së Testit</h3>
              </div>
              <div className="space-y-0.5 text-xs text-orange-700 leading-relaxed">
                <p>
                  • Nëse <strong>dështoni</strong> testin, mund ta rimarrni pas <strong>2 javësh</strong>.
                </p>
                <p>
                  • Nëse <strong>anuloni</strong> ose <strong>largoheni</strong>, prisni <strong>2 javë</strong>.
                </p>
                <p>
                  • Nëse <strong>kaloni</strong> testin, mund të vazhdoni në nivelin tjetër.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
              <h3 className="font-medium text-gray-900 mb-1.5 text-xs">Detajet e Testit:</h3>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
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
          </div>

          <div className="flex-shrink-0 p-2.5 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium text-xs border border-gray-200"
              >
                Anulo
              </button>
              <button
                onClick={onStartTest}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors text-xs"
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
        <div className="min-h-screen bg-gray-50 p-3">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 text-center">
                <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {test.title}
                </h2>
                <p className="text-red-600 mt-1.5 text-xs">
                  Nuk ka pyetje të disponueshme për këtë test. Ju lutemi kontaktoni mbështetjen.
                </p>
              </div>
              <div className="p-3 text-center border-t border-gray-200">
                <button
                  className="px-2.5 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 text-xs font-medium"
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

      // Check if all questions are answered
      const totalQuestions = test.questions?.length || 0
      const answeredQuestions = Object.keys(userAnswers).length
      const unansweredCount = totalQuestions - answeredQuestions

      if (unansweredCount > 0) {
        // Find unanswered question numbers
        const unansweredNumbers = test.questions
          .filter(q => !userAnswers[q._id])
          .map(q => q.questionNumber)
          .join(', ')

        // Show custom modal instead of alert
        setUnansweredInfo({ count: unansweredCount, numbers: unansweredNumbers })
        setShowUnansweredModal(true)
        return
      }

      isSubmittingRef.current = true

      try {
        await submitTestAnswers(test, userAnswers, false)
      } finally {
        isSubmittingRef.current = false
      }
    }

    const handleCancelTest = async () => {
      const confirmed = window.confirm(
        "KUJDES! Nëse anuloni testin:\n\n" +
        "• Testi do të konsiderohet i DËSHTUAR\n" +
        "• Do të jeni të KYÇUR për 2 JAVË\n\n" +
        "Jeni absolutisht të sigurt?"
      )

      if (confirmed) {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        try {
          await testService.submitTestViolation(test._id, {
            answers: Object.entries(userAnswers).map(([questionId, answer]) => ({
              questionId,
              answer,
            })),
            userId,
            violationType: "test_cancelled",
            forceFailure: true,
          })
        } catch (error) {
          console.error("[Security] Error submitting cancellation:", error)
        }

        clearTestState()
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        setTakingTest(false)
        setUserAnswers({})
        setTimeRemaining(null)
        setTestStartTime(null)
        setTestSessionId(null)
        setSelectedLevel(null)
        setLevelTests([])
        setSecurityViolation("test_cancelled")
        setShowSecurityWarning(true)
        fetchTestAvailability()

        isSubmittingRef.current = false
      }
    }

    const answeredQuestions = Object.keys(userAnswers).length
    const totalQuestions = test.questions?.length || 0
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    const getTimerColor = () => {
      if (timeRemaining === null) return "text-gray-600"
      if (timeRemaining <= 300) return "text-red-600"
      if (timeRemaining <= 900) return "text-orange-600"
      return "text-green-600"
    }

    return (
      <div
        className="min-h-screen bg-gray-50 p-3 select-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onSelectStart={(e) => e.preventDefault()}
      >
        {/* Unanswered Questions Modal */}
        {showUnansweredModal && (
          <UnansweredQuestionsModal
            unansweredCount={unansweredInfo.count}
            unansweredNumbers={unansweredInfo.numbers}
            onClose={() => setShowUnansweredModal(false)}
          />
        )}

        {/* Security indicator */}
        <div className="fixed top-2 right-2 z-50 bg-green-100 border border-green-300 rounded-lg px-2 py-1 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-medium text-green-700">Mbrojtje Aktive</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-2.5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 text-center">
              <p
                className="text-xs font-semibold text-blue-600 uppercase tracking-wide"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Testoni Njohurite tuaja
              </p>
              <h1 className="text-xl font-bold text-gray-900 mt-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                {test.title}
              </h1>
              <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Niveli: {test.level} • Koha: 30 minuta • Pyetjet: {test.questions?.length}
              </p>

              {timeRemaining !== null && (
                <div className={`mt-3 flex items-center justify-center gap-1 ${getTimerColor()}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="mt-2.5 space-y-1">
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

          {/* Warning banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700">
              <strong>Kujdes:</strong> Mos largohuni nga kjo dritare! Çdo shkelje e sigurisë do të rezultojë në dështim dhe kyçje për 2 javë.
            </p>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {test.questions?.map((question, index) => (
              <div key={question._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <span
                      className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {question.questionNumber || index + 1}
                    </span>
                    <h3
                      className="text-xs font-medium leading-relaxed text-gray-900"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {question.questionText}
                    </h3>
                  </div>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-start gap-2 p-2 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
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
                        className="text-xs leading-relaxed text-gray-700"
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
            <div className="p-3 text-center space-y-1.5">
              <div className={`text-xs ${answeredQuestions === totalQuestions ? "text-green-600 font-medium" : "text-orange-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {answeredQuestions === totalQuestions
                  ? "✓ Të gjitha pyetjet u përgjigjën! Gati për dorëzim."
                  : `⚠ ${totalQuestions - answeredQuestions} pyetje të mbetura - Ju duhet t'i përgjigjeni të gjitha para dorëzimit`}
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={submitTest}
                  disabled={isSubmittingRef.current}
                  className={`px-2.5 py-1.5 text-white rounded-md font-medium transition-colors text-xs ${answeredQuestions === totalQuestions
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-800 hover:bg-gray-900"
                    } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {isSubmittingRef.current
                    ? "Duke dorëzuar..."
                    : answeredQuestions === totalQuestions
                      ? "Dorëzo Testin ✓"
                      : `Dorëzo Testin (${answeredQuestions}/${totalQuestions})`}
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200 font-medium text-xs"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  onClick={handleCancelTest}
                  disabled={isSubmittingRef.current}
                >
                  Anulo (2 javë kyçje)
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
    // Always lock C1 and C2 levels
    if (levelCode === "C1" || levelCode === "C2") {
      return {
        available: false,
        reason: "progression_locked",
        locked: true,
        requiresLevel: "B2",
        message: "Nivelet C1 dhe C2 janë të kyçura për momentin"
      }
    }
    
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
      const nextDate = new Date(availability.nextAvailableAt).toLocaleDateString('sq-AL')
      return `I disponueshëm ${nextDate} (Rezultati i fundit: ${availability.lastScore}%)`
    }

    if (availability.reason === "violation_cooldown") {
      const nextDate = new Date(availability.nextAvailableAt).toLocaleDateString('sq-AL')
      return `I kyçur deri më ${nextDate} (Shkelje sigurie)`
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
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mx-auto mb-1.5"></div>
            <p className="text-gray-600 text-xs">Duke ngarkuar testet...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showSecurityWarning && securityViolation) {
    return (
      <SecurityWarningModal
        violation={securityViolation}
        onClose={() => {
          setShowSecurityWarning(false)
          setSecurityViolation(null)
          setSelectedLevel(null)
          setLevelTests([])
        }}
      />
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
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-center">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Testet e Gramatikës Gjermane
            </h1>
            <p className="text-sm text-gray-600 mt-1.5" style={{ fontFamily: "Inter, sans-serif" }}>
              Testoni njohuritë tuaja të gjermanishtes në të gjitha nivelet CEFR
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {germanLevels.map((level) => {
              const availability = getLevelAvailability(level.code)
              const isAvailable = availability.available
              const isLocked = availability.locked
              const isViolationLocked = availability.reason === "violation_cooldown"
              const availabilityMessage = getAvailabilityMessage(level.code)

              return (
                <div
                  key={level.code}
                  className={`relative overflow-hidden rounded-xl shadow-sm border-2 transition-all duration-200 ${level.color} ${isAvailable && !isLocked ? "hover:shadow-lg cursor-pointer" : "opacity-70 cursor-not-allowed"
                    }`}
                  onClick={isAvailable && !isLocked ? () => handleLevelSelect(level.code) : undefined}
                >
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border-2 bg-white shadow-sm"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {level.code}
                    </span>
                  </div>

                  {isLocked && (
                    <div className="absolute top-3 right-3 p-1.5 bg-white/70 rounded-lg shadow-sm">
                      {isViolationLocked ? (
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                      ) : (
                        <LockIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  )}

                  {availability.reason === "passed" && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}

                  <div className="p-4 pt-12">
                    <div>
                      <h3 className="text-base font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {level.name}
                      </h3>
                      <p className="mt-1 text-xs opacity-90" style={{ fontFamily: "Inter, sans-serif" }}>
                        {level.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                        <span className="opacity-80">
                          {availability.reason === "passed" ? "Përfunduar" : "Progresi"}
                        </span>
                        <span className="font-semibold">{availability.reason === "passed" ? "100%" : "0%"}</span>
                      </div>
                      <div className="w-full bg-white/40 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${availability.reason === "passed" ? "bg-green-500 w-full" : "bg-gray-300 w-0"
                            }`}
                        ></div>
                      </div>
                    </div>

                    {availability.reason === "passed" && availability.lastScore && (
                      <div className="text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <span className="opacity-80">Rezultati: </span>
                        <span className="font-bold">{availability.lastScore}%</span>
                      </div>
                    )}

                    {(availability.reason === "cooldown" || availability.reason === "violation_cooldown") && availability.nextAvailableAt && (
                      <div className="text-xs text-red-600 font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        I kyçur deri: {new Date(availability.nextAvailableAt).toLocaleDateString('sq-AL')}
                      </div>
                    )}

                    <button
                      className={`w-full py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-xs flex items-center justify-center gap-1.5 ${isAvailable && !isLocked
                          ? `${level.buttonColor} text-white shadow-md hover:shadow-lg`
                          : isViolationLocked
                            ? "bg-red-100 text-red-600 cursor-not-allowed"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      disabled={!isAvailable || isLocked}
                    >
                      {isViolationLocked ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          I kyçur (Shkelje)
                        </>
                      ) : isLocked ? (
                        <>
                          <LockIcon className="w-3.5 h-3.5" />
                          I kyçur
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
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
          onClick={() => {
            setSelectedLevel(null)
            setLevelTests([])
          }}
        >
          <ArrowLeft size={14} /> Kthehu te Zgjedhja e Nivelit
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                Testet e Gramatikës Gjermane
              </h1>
              <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Zgjidhni një test për të filluar vlerësimin tuaj për nivelin {selectedLevel}.
              </p>
            </div>
            <div className="text-4xl">
              <img src={logo || "/placeholder.svg"} className="rounded-full" width={40} height={40} alt="" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${badgeColor}`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {test.level}
                    </span>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <img
                        src={logo || "/placeholder.svg"}
                        className="rounded-full"
                        width={40}
                        height={40}
                        alt=""
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        {test.questions?.length || 1} Pyetje
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                        30 Minuta
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedTest(test)
                        setShowInstructions(true)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-xs font-semibold"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Shiko
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTest(test)
                        const startTime = Date.now()
                        const sessionId = generateSessionId()
                        setTestStartTime(startTime)
                        setTestSessionId(sessionId)
                        setTimeRemaining(30 * 60)
                        setTakingTest(true)
                        visibilityViolationRef.current = false
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-xs font-semibold"
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
            <div className="p-4 text-center space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-900">
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
              const sessionId = generateSessionId()
              setTestStartTime(startTime)
              setTestSessionId(sessionId)
              setTimeRemaining(30 * 60)
              setTakingTest(true)
              visibilityViolationRef.current = false
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Tests