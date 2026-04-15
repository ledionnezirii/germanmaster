"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import logo from "../../public/logo.png"
import {
  ArrowLeft, Clock, BookOpen, RotateCcw, FileText,
  Award, Lock, CheckCircle, AlertCircle, X, Check, ShieldAlert, Eye, Crown,
} from "lucide-react"
import { testService } from "../services/api"

const Tests = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
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
  const [unansweredInfo, setUnansweredInfo] = useState({ count: 0, numbers: "" })
  const [isPaid, setIsPaid] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const timerIntervalRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const testActiveRef = useRef(false)
  const visibilityViolationRef = useRef(false)

  const { user, updateUser } = useAuth()
  const { language } = useLanguage()
  const userId = user?.id

  const TWO_WEEKS_MS = 5 * 24 * 60 * 60 * 1000

  // ─── SEO ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    document.title = "Teste - Vlerëso Nivelin Tuaj | Teste A1-C2"

    const setMeta = (name, content, isProp = false) => {
      let el = document.querySelector(`meta[${isProp ? "property" : "name"}="${name}"]`)
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(isProp ? "property" : "name", name)
        document.head.appendChild(el)
      }
      el.content = content
    }

    setMeta("description", "Bëni teste për të vlerësuar nivelin tuaj nga A1 deri C2. Teste të sigurta me 85% për kalim.")
    setMeta("og:title", "Teste - Vlerëso Nivelin Tuaj", true)
    setMeta("og:type", "website", true)

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: "Teste Gjuhe",
      description: "Vlerësoni nivelin tuaj të gjuhës me teste nga A1 deri C2",
      url: `${window.location.origin}/tests`,
      educationalLevel: ["Beginner", "Intermediate", "Advanced"],
      learningResourceType: "Assessment",
    }

    let script = document.querySelector('script[type="application/ld+json"][data-tests]')
    if (!script) {
      script = document.createElement("script")
      script.type = "application/ld+json"
      script.setAttribute("data-tests", "true")
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(structuredData)

    return () => {
      const s = document.querySelector('script[type="application/ld+json"][data-tests]')
      if (s) s.remove()
    }
  }, [])

  // ─── LEVELS CONFIG ──────────────────────────────────────────────────────────

  const germanLevels = [
    { code: "A1", name: "Fillestar A1", description: "Gjuha bazike për fillestarë", color: "bg-blue-50 border-blue-200 text-blue-900", buttonColor: "bg-blue-600 hover:bg-blue-700" },
    { code: "A2", name: "Elementar A2", description: "Aftësi elementare", color: "bg-green-50 border-green-200 text-green-900", buttonColor: "bg-green-600 hover:bg-green-700" },
    { code: "B1", name: "Mesatar B1", description: "Nivel mesatar", color: "bg-amber-50 border-amber-200 text-amber-900", buttonColor: "bg-amber-600 hover:bg-amber-700" },
    { code: "B2", name: "Mesatar i Lartë B2", description: "Aftësi mesatare të larta", color: "bg-orange-50 border-orange-200 text-orange-900", buttonColor: "bg-orange-600 hover:bg-orange-700" },
    { code: "C1", name: "I Avancuar C1", description: "Njohuri të avancuara", color: "bg-purple-50 border-purple-200 text-purple-900", buttonColor: "bg-purple-600 hover:bg-purple-700" },
    { code: "C2", name: "Përsosmëri C2", description: "Njohuri në nivel gjuhëtari", color: "bg-rose-50 border-rose-200 text-rose-900", buttonColor: "bg-rose-600 hover:bg-rose-700" },
  ]

  // ─── LOCAL STORAGE HELPERS ──────────────────────────────────────────────────

  const clearTestState = () => {
    localStorage.removeItem("activeTest")
    localStorage.removeItem("testAnswers")
    localStorage.removeItem("testStartTime")
    localStorage.removeItem("testSessionId")
    localStorage.removeItem("activeTestLanguage")
    testActiveRef.current = false
    visibilityViolationRef.current = false
  }

  const saveTestState = (testId, answers, startTime, sessionId, lang) => {
    localStorage.setItem("activeTest", testId)
    localStorage.setItem("testAnswers", JSON.stringify(answers))
    localStorage.setItem("testStartTime", startTime.toString())
    localStorage.setItem("testSessionId", sessionId)
    localStorage.setItem("activeTestLanguage", lang || "de")
  }

  const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // ─── RESTORE ABANDONED TEST ─────────────────────────────────────────────────

  useEffect(() => {
    const activeTestId = localStorage.getItem("activeTest")
    const savedAnswers = localStorage.getItem("testAnswers")
    const savedStartTime = localStorage.getItem("testStartTime")
    const savedSessionId = localStorage.getItem("testSessionId")
    const savedLang = localStorage.getItem("activeTestLanguage") || "de"

    if (activeTestId && savedAnswers && savedStartTime) {
      const elapsed = Math.floor((Date.now() - Number.parseInt(savedStartTime)) / 1000)
      const totalTime = 30 * 60

      if (elapsed >= totalTime) {
        const handleAbandonedTest = async () => {
          try {
            const response = await testService.getTestById(activeTestId)
            const test = response.data
            await testService.submitTestViolation(test._id, {
              answers: Object.entries(JSON.parse(savedAnswers)).map(([questionId, answer]) => ({ questionId, answer })),
              userId,
              violationType: "test_abandoned",
              forceFailure: true,
            })
          } catch (error) {
            // silent
          }
          clearTestState()
          fetchTestAvailability()
          setShowSecurityWarning(true)
          setSecurityViolation("test_abandoned")
        }
        if (userId) handleAbandonedTest()
        else clearTestState()
        return
      }

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
          if (remaining === 0) setTimeout(() => handleAutoSubmit(test, JSON.parse(savedAnswers)), 100)
        } catch (error) {
          clearTestState()
        }
      }
      loadTestAndRestore()
    }
  }, [userId])

  // ─── SECURITY: visibility / focus ──────────────────────────────────────────

  const handleSecurityViolation = useCallback(
    async (violationType, test, answers) => {
      if (isSubmittingRef.current || visibilityViolationRef.current) return
      visibilityViolationRef.current = true
      isSubmittingRef.current = true
      setSecurityViolation(violationType)

      try {
        await testService.submitTestViolation(test._id, {
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
          userId,
          violationType,
          forceFailure: true,
        })
      } catch (error) {
        // silent
      }

      clearTestState()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      setTakingTest(false)
      setUserAnswers({})
      setTimeRemaining(null)
      setTestStartTime(null)
      setShowSecurityWarning(true)
      fetchTestAvailability()
      isSubmittingRef.current = false
    },
    [userId],
  )

  useEffect(() => {
    if (!takingTest || !selectedTest) return

    const handleVisibilityChange = () => {
      if (document.hidden && testActiveRef.current && !visibilityViolationRef.current) {
        handleSecurityViolation("tab_switch", selectedTest, userAnswers)
      }
    }
    const handleWindowBlur = () => {
      if (testActiveRef.current && !visibilityViolationRef.current) {
        handleSecurityViolation("window_blur", selectedTest, userAnswers)
      }
    }
    const handleContextMenu = (e) => { if (testActiveRef.current) e.preventDefault() }
    const handleKeyDown = (e) => {
      if (!testActiveRef.current) return
      if ((e.ctrlKey || e.metaKey) && ["c","v","x","a","p","s","f","u"].includes(e.key)) e.preventDefault()
      if (e.key === "F12" || e.key === "F5") e.preventDefault()
      if (e.altKey && e.key === "Tab") e.preventDefault()
    }
    const handleSelectStart = (e) => { if (testActiveRef.current) e.preventDefault() }
    const handleDragStart = (e) => { if (testActiveRef.current) e.preventDefault() }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("selectstart", handleSelectStart)
    document.addEventListener("dragstart", handleDragStart)
    testActiveRef.current = true

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      testActiveRef.current = false
    }
  }, [takingTest, selectedTest, userAnswers, handleSecurityViolation])

  // ─── BEFORE UNLOAD ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (takingTest && !isSubmittingRef.current) {
        e.preventDefault()
        e.returnValue = "Nëse largoheni, testi do të konsiderohet i dështuar!"
        return e.returnValue
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [takingTest])

  // ─── TIMER ──────────────────────────────────────────────────────────────────

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
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
    }
  }, [takingTest, timeRemaining])

  // Save state on answer change
  useEffect(() => {
    if (takingTest && selectedTest && testStartTime && testSessionId) {
      saveTestState(selectedTest._id, userAnswers, testStartTime, testSessionId, selectedTest.language || language)
    }
  }, [userAnswers, takingTest, selectedTest, testStartTime, testSessionId, language])

  // Re-fetch availability when language changes
  useEffect(() => {
    if (userId) fetchTestAvailability()
    // If user switches language while on level view, go back to level selector
    setSelectedLevel(null)
    setLevelTests([])
  }, [language])

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchTestAvailability = async () => {
    if (!userId) return
    try {
      const response = await testService.getTestAvailability(userId, "de")
      setTestAvailability(response.data.availability || response.data?.data?.availability || {})
    } catch (error) {
      console.error("Error fetching test availability:", error)
    }
  }

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await testService.getAllTests({ language: "de" })
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
      const response = await testService.getAllTests({ level, language: "de" })
      const testsWithQuestions = await Promise.all(
        response.data.map(async (test) => {
          try {
            const full = await testService.getTestById(test._id)
            return full.data
          } catch {
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

  useEffect(() => {
    fetchTests()
    if (userId) {
      fetchTestAvailability()
      checkSubscription()
    }
  }, [userId])

  const checkSubscription = async () => {
    try {
      const { subscriptionService } = await import("../services/api")
      const status = await subscriptionService.checkStatus()
      setIsPaid(status.active || false)
    } catch (e) {
      console.error("Error checking subscription:", e)
    }
  }

  // ─── SUBMIT HELPERS ─────────────────────────────────────────────────────────

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAutoSubmit = async (test, answers) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    try { await submitTestAnswers(test, answers, true) } finally { isSubmittingRef.current = false }
  }

  const submitTestAnswers = async (test, answers) => {
    if (!userId) { alert("Ju lutemi kyçuni për të dorëzuar testin"); return }
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
      const response = await testService.submitTest(test._id, answersArray, 30, userId)

      if (response && (response.success === true || response.data)) {
        const result = response.data || response
        clearTestState()
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        setTestResult(result)
        // Update languageProgress in AuthContext if test was passed
        if (result.passed && result.level && result.language) {
          const existingProgress = (user?.languageProgress || []).filter(p => p.language !== result.language)
          updateUser({ languageProgress: [...existingProgress, { language: result.language, level: result.level }] })
        }
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
      if (error.response) {
        alert(error.response.data?.message || `Gabim (Kodi: ${error.response.status})`)
      } else {
        alert(`Gabim i papritur: ${error.message}`)
      }
    }
  }

  // ─── AVAILABILITY HELPERS ───────────────────────────────────────────────────

  const getLevelAvailability = (levelCode) => {
    if (levelCode === "C1" || levelCode === "C2") {
      return { available: false, reason: "progression_locked", locked: true, requiresLevel: "B2", message: "Nivelet C1 dhe C2 janë të kyçura për momentin" }
    }
    const a = testAvailability[levelCode]
    if (!a) return { available: true, reason: "not_taken", locked: false }
    return a
  }

  const getAvailabilityMessage = (levelCode) => {
    const a = getLevelAvailability(levelCode)
    if (a.available) return a.reason === "cooldown_expired" ? `I disponueshëm (Rezultati i fundit: ${a.lastScore}%)` : "I disponueshëm"
    if (a.reason === "passed") return `I përfunduar (Rezultati: ${a.lastScore}%)`
    if (a.reason === "cooldown" || a.reason === "violation_cooldown") {
      return `I disponueshëm ${new Date(a.nextAvailableAt).toLocaleDateString("sq-AL")}`
    }
    if (a.reason === "progression_locked") return `Përfundoni ${a.requiresLevel} së pari`
    if (a.reason === "blocked_by_cooldown") return `I bllokuar deri sa të skadojë ${a.blockedBy}`
    return "I disponueshëm"
  }

  // ─── MODALS ─────────────────────────────────────────────────────────────────

  const CloseButton = ({ onClick }) => (
    <button onClick={onClick} className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
      <X className="w-3.5 h-3.5 text-gray-500" />
    </button>
  )

  const UnansweredQuestionsModal = ({ unansweredCount, unansweredNumbers, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border-2 border-orange-200">
        <div className="p-5 text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-orange-600" />
          </div>
          <h2 className="text-lg font-bold text-orange-600">Pyetje të Papërgjigjura!</h2>
          <p className="text-gray-700 text-sm">Ju lutemi përgjigjuni të gjitha pyetjeve para se të dorëzoni.</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 font-semibold text-sm">Pyetje të papërgjigjura: {unansweredCount}</p>
            <p className="text-orange-700 text-xs">Numrat: <strong>{unansweredNumbers}</strong></p>
          </div>
          <button onClick={onClose} className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm">
            Kthehu te Testi
          </button>
        </div>
      </div>
    </div>
  )

  const SecurityWarningModal = ({ violation, onClose }) => {
    const msg = {
      tab_switch: "Ju ndërruat tab-in ose dritaren gjatë testit.",
      window_blur: "Ju larguat nga dritarja e testit.",
      test_abandoned: "Ju e braktisët testin dhe koha skadoi.",
      test_cancelled: "Ju e anuluat testin.",
    }[violation] || "Shkelje e rregullave të testit."

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border-2 border-red-200">
          <div className="p-5 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-red-600">Shkelje e Sigurisë!</h2>
            <p className="text-gray-700 text-sm">{msg}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left space-y-1">
              <p className="text-red-800 font-semibold text-sm">Pasojat:</p>
              <ul className="text-red-700 text-xs space-y-1">
                <li>• Testi konsiderohet i DËSHTUAR</li>
                <li>• Jeni të KYÇUR për 5 ditë</li>
                <li>• Data e ardhshme: <strong>{new Date(Date.now() + TWO_WEEKS_MS).toLocaleDateString("sq-AL")}</strong></li>
              </ul>
            </div>
            <button onClick={onClose} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm">
              E kuptova
            </button>
          </div>
        </div>
      </div>
    )
  }

  const XPRewardModal = ({ result, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 text-center space-y-3">
          {result.passed ? (
            <>
              <div className="mx-auto w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-green-600">Urime!</h2>
              <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                <Award className="w-3 h-3" />
                <span>+{result.xpEarned} XP</span>
              </div>
              <p className="text-gray-600 text-xs">Ju morët {result.percentage}% dhe kaluat nivelin {result.level}!</p>
              {result.nextLevel && (
                <p className="text-green-600 font-medium text-xs">Tani mund të merrni testet e nivelit {result.nextLevel}!</p>
              )}
            </>
          ) : (
            <>
              <div className="mx-auto w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-red-600">Akoma jo aty</h2>
              <p className="text-gray-600 text-xs">Ju morët {result.percentage}% por nevojitet 85%.</p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                <p className="text-xs text-orange-700 font-medium">Mund të provoni përsëri pas 5 ditësh.</p>
                <p className="text-xs text-orange-600 mt-1">
                  Data e ardhshme: {new Date(Date.now() + TWO_WEEKS_MS).toLocaleDateString("sq-AL")}
                </p>
              </div>
            </>
          )}
          <button
            onClick={onClose}
            className={`w-full px-2.5 py-1.5 rounded-md font-medium text-xs ${result.passed ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            {result.passed ? "Vazhdo" : "Kthehu te Nivelet"}
          </button>
        </div>
      </div>
    </div>
  )

  const TestInstructionsModal = ({ test, onClose, onStartTest }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="flex-shrink-0 p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Udhëzime për Testin</h2>
              <p className="text-xs text-gray-600 mt-0.5">{test.title} - Niveli {test.level}</p>
            </div>
            <CloseButton onClick={onClose} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="bg-red-50 border-2 border-red-300 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="font-bold text-red-800 text-sm">PARALAJMËRIM I RËNDËSISHËM!</h3>
            </div>
            <ul className="space-y-1 ml-3 text-xs text-red-700">
              <li>• <strong>NUK LEJOHET</strong> ndërrimi i tab-it ose dritares</li>
              <li>• <strong>NUK LEJOHET</strong> kopjimi ose selektimi i tekstit</li>
              <li>• <strong>NUK LEJOHET</strong> largimi nga faqja e testit</li>
              <li>• <strong>Çdo shkelje = DËSHTIM + KYÇJE PËR 2 JAVË!</strong></li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">Koha e Testit: <strong>30 Minuta</strong>. Dorëzohet automatikisht kur të mbarojë.</p>
          </div>
          <div className="space-y-1 text-xs text-gray-700">
            {[
              "Keni 30 minuta për të përfunduar testin.",
              "Çdo pyetje ka vetëm një përgjigje të saktë.",
              "Nevojitet 85% ose më shumë për të kaluar.",
              "DUHET t'i përgjigjeni të gjitha pyetjeve para dorëzimit.",
              "Nëse dështoni, mund ta rimarrni pas 5 ditësh.",
            ].map((txt, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="font-semibold text-gray-800 shrink-0">{i + 1}.</span>
                <p>{txt}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-600">Pyetje:</span><span className="font-medium">{test.questions?.length || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Koha:</span><span className="font-medium">30 min</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Kategoria:</span><span className="font-medium">{test.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pikët:</span><span className="font-medium">85%</span></div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 p-2.5 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-2.5 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium border border-gray-200">Anulo</button>
          <button onClick={onStartTest} className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-medium">Fillo Testin</button>
        </div>
      </div>
    </div>
  )

  // ─── EXAM VIEW ───────────────────────────────────────────────────────────────

  const GermanExamView = ({ test }) => {
    if (!test.questions || test.questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 p-3 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center max-w-sm">
            <p className="text-red-600 text-xs">Nuk ka pyetje të disponueshme. Kontaktoni mbështetjen.</p>
            <button className="mt-3 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs" onClick={() => { setTakingTest(false); setUserAnswers({}); clearTestState() }}>Kthehu</button>
          </div>
        </div>
      )
    }

    const handleAnswerSelect = (questionId, answer) => {
      setUserAnswers((prev) => ({ ...prev, [questionId]: answer }))
    }

    const submitTest = async () => {
      if (isSubmittingRef.current) return
      const total = test.questions?.length || 0
      const answered = Object.keys(userAnswers).length
      const unansweredCount = total - answered

      if (unansweredCount > 0) {
        const unansweredNumbers = test.questions.filter((q) => !userAnswers[q._id]).map((q) => q.questionNumber).join(", ")
        setUnansweredInfo({ count: unansweredCount, numbers: unansweredNumbers })
        setShowUnansweredModal(true)
        return
      }

      isSubmittingRef.current = true
      try { await submitTestAnswers(test, userAnswers, false) } finally { isSubmittingRef.current = false }
    }

    const handleCancelTest = async () => {
      const confirmed = window.confirm(
        "KUJDES! Nëse anuloni testin:\n\n• Testi do të konsiderohet i DËSHTUAR\n• Do të jeni të KYÇUR për 2 JAVË\n\nJeni absolutisht të sigurt?"
      )
      if (!confirmed) return
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true

      try {
        await testService.submitTestViolation(test._id, {
          answers: Object.entries(userAnswers).map(([questionId, answer]) => ({ questionId, answer })),
          userId,
          violationType: "test_cancelled",
          forceFailure: true,
        })
      } catch (error) {
        console.error("Error submitting cancellation:", error)
      }

      clearTestState()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
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

    const answeredCount = Object.keys(userAnswers).length
    const totalCount = test.questions?.length || 0
    const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0
    const getTimerColor = () => {
      if (timeRemaining === null) return "text-gray-600"
      if (timeRemaining <= 300) return "text-red-600"
      if (timeRemaining <= 900) return "text-orange-600"
      return "text-green-600"
    }

    return (
      <div
        className="min-h-screen bg-gray-50 p-3 select-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onSelectStart={(e) => e.preventDefault()}
      >
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
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Testoni Njohuritë Tuaja</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1.5">{test.title}</h1>
            <p className="text-xs text-gray-600 mt-1">Niveli: {test.level} • Koha: 30 min • Pyetjet: {test.questions?.length}</p>
            {timeRemaining !== null && (
              <div className={`mt-3 flex items-center justify-center gap-1 ${getTimerColor()}`}>
                <Clock className="w-4 h-4" />
                <span className="text-lg font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progresi</span>
                <span>{answeredCount} nga {totalCount}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-800 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Security warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700"><strong>Kujdes:</strong> Mos largoheni nga kjo dritare! Çdo shkelje sigurie = dështim + kyçje 5 ditë.</p>
          </div>

          {/* Questions */}
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {test.questions?.map((question, index) => (
              <div key={question._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                      {question.questionNumber || index + 1}
                    </span>
                    <h3 className="text-xs font-medium leading-relaxed text-gray-900">{question.questionText}</h3>
                  </div>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {question.options?.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-start gap-2 p-2 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="radio"
                        name={`question_${question._id || index}`}
                        value={option.label}
                        checked={userAnswers[question._id || index] === option.label}
                        onChange={() => handleAnswerSelect(question._id || index, option.label)}
                        className="mt-0.5 text-gray-800 focus:ring-gray-500 focus:ring-1"
                      />
                      <span className="text-xs leading-relaxed text-gray-700">
                        <strong className="text-gray-800">{option.label})</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center space-y-1.5">
            <div className={`text-xs ${answeredCount === totalCount ? "text-green-600 font-medium" : "text-orange-600"}`}>
              {answeredCount === totalCount
                ? "✓ Të gjitha pyetjet u përgjigjën! Gati për dorëzim."
                : `⚠ ${totalCount - answeredCount} pyetje të mbetura`}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={submitTest}
                disabled={isSubmittingRef.current}
                className={`px-2.5 py-1.5 text-white rounded-md font-medium text-xs disabled:bg-gray-300 disabled:cursor-not-allowed ${answeredCount === totalCount ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900"}`}
              >
                {isSubmittingRef.current ? "Duke dorëzuar..." : answeredCount === totalCount ? "Dorëzo Testin ✓" : `Dorëzo (${answeredCount}/${totalCount})`}
              </button>
              <button
                onClick={handleCancelTest}
                disabled={isSubmittingRef.current}
                className="px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium text-xs"
              >
                Anulo (5 ditë kyçje)
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER GUARDS ───────────────────────────────────────────────────────────

  if (loading && !selectedLevel) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
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

  if (takingTest && selectedTest) return <GermanExamView test={selectedTest} />

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

  // ─── LEVEL SELECTOR ──────────────────────────────────────────────────────────

  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Testet e Gramatikës</h1>
            <p className="text-sm text-gray-600 mt-1.5">Testoni njohuritë tuaja në të gjitha nivelet CEFR</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {germanLevels.map((level) => {
              const availability = getLevelAvailability(level.code)
              const isAvailable = availability.available
              const isLocked = availability.locked
              const isViolationLocked = availability.reason === "violation_cooldown"

              return (
                <div
                  key={level.code}
                  className={`relative overflow-hidden rounded-xl shadow-sm border-2 transition-all duration-200 ${level.color} ${isAvailable && !isLocked ? "hover:shadow-lg cursor-pointer" : "opacity-70 cursor-not-allowed"}`}
                  onClick={isAvailable && !isLocked ? () => { setSelectedLevel(level.code); fetchTestsByLevel(level.code) } : undefined}
                >
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border-2 bg-white shadow-sm">{level.code}</span>
                  </div>

                  {isLocked && (
                    <div className="absolute top-3 right-3 p-1.5 bg-white/70 rounded-lg shadow-sm">
                      {isViolationLocked ? <ShieldAlert className="w-4 h-4 text-red-600" /> : <Lock className="w-4 h-4 text-gray-600" />}
                    </div>
                  )}

                  {availability.reason === "passed" && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}

                  <div className="p-4 pt-12">
                    <h3 className="text-base font-bold">{level.name}</h3>
                    <p className="mt-1 text-xs opacity-90">{level.description}</p>
                  </div>

                  <div className="px-4 pb-4 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-80">{availability.reason === "passed" ? "Përfunduar" : "Progresi"}</span>
                        <span className="font-semibold">{availability.reason === "passed" ? "100%" : "0%"}</span>
                      </div>
                      <div className="w-full bg-white/40 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${availability.reason === "passed" ? "bg-green-500 w-full" : "bg-gray-300 w-0"}`} />
                      </div>
                    </div>

                    {availability.reason === "passed" && availability.lastScore && (
                      <p className="text-xs"><span className="opacity-80">Rezultati: </span><span className="font-bold">{availability.lastScore}%</span></p>
                    )}

                    {(availability.reason === "cooldown" || availability.reason === "violation_cooldown") && availability.nextAvailableAt && (
                      <p className="text-xs text-red-600 font-medium">
                        I kyçur deri: {new Date(availability.nextAvailableAt).toLocaleDateString("sq-AL")}
                      </p>
                    )}

                    <button
                      disabled={!isAvailable || isLocked}
                      className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isAvailable && !isLocked
                          ? `${level.buttonColor} text-white shadow-md hover:shadow-lg`
                          : isViolationLocked
                          ? "bg-red-100 text-red-600 cursor-not-allowed"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isViolationLocked ? (
                        <><ShieldAlert className="w-3.5 h-3.5" /> I kyçur (Shkelje)</>
                      ) : isLocked ? (
                        <><Lock className="w-3.5 h-3.5" /> I kyçur</>
                      ) : (
                        <>→ Merr Testin {level.code}</>
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

  // ─── LEVEL TESTS LIST ────────────────────────────────────────────────────────

  // ─── PREMIUM MODAL ───────────────────────────────────────────────────────────
  const PremiumModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPremiumModal(false)}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-8 pt-8 pb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="h-10 w-10 text-white drop-shadow" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Funksion Premium</h2>
            <p className="text-white/80 text-sm font-medium">Testet e nivelit janë ekskluzive për abonentët Premium</p>
          </div>
        </div>
        <div className="px-8 pt-6 pb-8">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left space-y-2">
            {["Qasje në të gjitha testet A1–C2", "Certifikim i nivelit tuaj", "Rezultate dhe historik i detajuar", "Pa kufizime"].map(perk => (
              <div key={perk} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{perk}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { window.location.href = "/payments" }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-amber-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer mb-3">
            Shiko Planet Premium
          </button>
          <button onClick={() => setShowPremiumModal(false)} className="w-full py-2.5 text-gray-400 text-sm font-medium cursor-pointer border-none bg-transparent hover:text-gray-600 transition-colors">
            Jo tani, mbyll
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {showPremiumModal && <PremiumModal />}
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-medium"
          onClick={() => { setSelectedLevel(null); setLevelTests([]) }}
        >
          <ArrowLeft size={14} /> Kthehu te Zgjedhja e Nivelit
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900">Testet e Nivelit {selectedLevel}</h1>
          <p className="text-xs text-gray-600 mt-1">Zgjidhni një test për të filluar vlerësimin tuaj.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {levelTests.map((test) => {
              const badgeColors = { A1: "bg-blue-100 text-blue-700", A2: "bg-green-100 text-green-700", B1: "bg-amber-100 text-amber-700", B2: "bg-orange-100 text-orange-700", C1: "bg-purple-100 text-purple-700", C2: "bg-rose-100 text-rose-700" }
              return (
                <div key={test._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${badgeColors[test.level] || "bg-gray-100 text-gray-700"}`}>{test.level}</span>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <img src={logo || "/placeholder.svg"} className="rounded-full" width={40} height={40} alt="" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{test.questions?.length || 1} Pyetje</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">30 Minuta</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          if (!isPaid) { setShowPremiumModal(true); return }
                          setSelectedTest(test); setShowInstructions(true)
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        {!isPaid && <Crown size={11} className="text-amber-500" />}
                        Shiko
                      </button>
                      <button
                        onClick={() => {
                          if (!isPaid) { setShowPremiumModal(true); return }
                          setSelectedTest(test)
                          const startTime = Date.now()
                          const sessionId = generateSessionId()
                          setTestStartTime(startTime)
                          setTestSessionId(sessionId)
                          setTimeRemaining(30 * 60)
                          setTakingTest(true)
                          visibilityViolationRef.current = false
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        {!isPaid && <Crown size={11} className="text-white" />}
                        Merr Testin
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {levelTests.length === 0 && (
              <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p className="text-xs font-semibold text-gray-900">Nuk ka teste për nivelin {selectedLevel} në këtë gjuhë</p>
                <p className="text-gray-500 text-xs mt-1">Kontrolloni më vonë!</p>
              </div>
            )}
          </div>
        )}

        {showInstructions && selectedTest && (
          <TestInstructionsModal
            test={selectedTest}
            onClose={() => { setShowInstructions(false); setSelectedTest(null) }}
            onStartTest={() => {
              if (!isPaid) { setShowInstructions(false); setShowPremiumModal(true); return }
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