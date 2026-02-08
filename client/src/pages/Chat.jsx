"use client"
import { useState, useEffect, useRef } from "react"
import { questionsService, authService } from "../services/api"
import {
  Send,
  Bot,
  User,
  Settings,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react"

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [selectedCategory, setSelectedCategory] = useState("grammar")
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [askedQuestionIds, setAskedQuestionIds] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showGermanChars, setShowGermanChars] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  const germanChars = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"]

  const categories = [
    { value: "grammar", label: "Gramatikë" },
    { value: "vocabulary", label: "Fjalor" },
    //{ value: "pronunciation", label: "Shqiptim" },
   //{ value: "culture", label: "Kulturë" },
    { value: "articles", label: "Artikuj" },
    //{ value: "translation", label: "Përkthim" },
    { value: "Begginers", label: "Fillestarë" },
    { value: "Präpositionen", label: "Parafjalë" },
    { value: "Adjectives", label: "Mbiemra" },
    { value: "Perfekt", label: "Perfekt(koha e kryer)" },
    { value: "mixed", label: "Të përziera (të gjitha)" },
  ]

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile()
      setUserProfile(response.data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  useEffect(() => {
    if (currentQuestion && inputRef.current && !loading) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [currentQuestion, loading])

  const insertCharacter = (char) => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const text = currentInput
    const before = text.substring(0, start)
    const after = text.substring(end)
    const newText = before + char + after
    setCurrentInput(newText)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 1, start + 1)
    }, 0)
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    setTimeout(scrollToBottom, 100)
  }, [messages])

  useEffect(() => {
    fetchUserProfile()
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        content: "Mirë se vini! Do t'ju bëj pyetje për të praktikuar gjermanishten. Le të fillojmë!",
        timestamp: new Date(),
      },
    ])
    setAskedQuestionIds([])
    setCurrentQuestion(null)
    const timer = setTimeout(() => {
      fetchQuestion()
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedLevel, selectedCategory])

  const fetchQuestion = async () => {
    if (loading) return
    try {
      setLoading(true)
      const queryParams = {
        level: selectedLevel,
        category: selectedCategory === "mixed" ? undefined : selectedCategory,
        excludeIds: askedQuestionIds.join(","),
      }
      const response = await questionsService.getRandomQuestion(queryParams)
      if (response.data) {
        setCurrentQuestion(response.data)
        setShowHint(false)
        setHintIndex(0)
        setAskedQuestionIds((prev) => [...prev, response.data._id])
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: response.data.question,
            timestamp: new Date(),
            questionData: response.data,
          },
        ])
      } else {
        if (askedQuestionIds.length > 0) {
          setAskedQuestionIds([])
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content: "Ke përfunduar të gjitha pyetjet! Le të fillojmë përsëri.",
              timestamp: new Date(),
            },
          ])
        }
        setTimeout(() => fetchQuestion(), 1000)
      }
    } catch (error) {
      console.error("Error fetching question:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "Nuk ka pyetje të disponueshme. Provo një kombinim tjetër!",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentInput.trim() || !currentQuestion) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    const submittedAnswer = currentInput
    setCurrentInput("")

    // Force scroll after user message
    setTimeout(scrollToBottom, 50)

    try {
      const response = await questionsService.answerQuestion(currentQuestion._id, submittedAnswer)
      const result = response.data

      if (result.correct || result.score >= 70) {
        setScore((prev) => prev + (result.xpAwarded || Math.max(1, Math.floor(result.score / 20))))
      }

      let botContent = ""
      let responseIcon = null
      let answerComparison = null

      if (result.userAnswer && result.correctAnswer && result.userAnswer !== result.correctAnswer) {
        answerComparison = {
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          score: result.score,
        }
      }

      if (result.correct || result.score >= 90) {
        botContent = `${result.message}`
        if (result.reasonWhy) botContent += `\n\n${result.reasonWhy}`
        if (result.grammarRule) botContent += `\n\n📚 ${result.grammarRule}`
        if (result.xpAwarded) botContent += `\n\n+${result.xpAwarded} XP`
        responseIcon = "success"
      } else if (result.score >= 70) {
        botContent = `${result.message}`
        if (result.reasonWhy) botContent += `\n\n${result.reasonWhy}`
        if (result.detailedFeedback) botContent += `\n\n${result.detailedFeedback}`
        if (result.xpAwarded) botContent += ` • +${result.xpAwarded} XP`
        responseIcon = "success"
      } else {
        botContent = `${result.message}`
        if (result.reasonWhy) botContent += `\n\n${result.reasonWhy}`
        if (result.detailedFeedback) botContent += `\n\n${result.detailedFeedback}`
        responseIcon = "error"
      }

      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: botContent,
        timestamp: new Date(),
        isCorrect: result.correct || result.score >= 70,
        score: result.score,
        responseIcon: responseIcon,
        answerComparison: answerComparison,
      }
      setMessages((prev) => [...prev, botResponse])

      setTimeout(() => {
        fetchQuestion()
      }, 2500)
    } catch (error) {
      console.error("Error submitting answer:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          content: "Pati një gabim. Ju lutem provoni përsëri.",
          timestamp: new Date(),
          isCorrect: false,
        },
      ])
    }
  }

  const showNextHint = () => {
    if (currentQuestion && currentQuestion.hints && hintIndex < currentQuestion.hints.length) {
      const hint = currentQuestion.hints[hintIndex]
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: hint,
          timestamp: new Date(),
          isHint: true,
        },
      ])
      setHintIndex(hintIndex + 1)
      setShowHint(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const resetQuestions = () => {
    setAskedQuestionIds([])
    setShowSettings(false)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "bot",
        content: "Pyetjet u rivendosën! Le të fillojmë.",
        timestamp: new Date(),
      },
    ])
    setTimeout(() => {
      fetchQuestion()
    }, 1000)
  }

  return (
    <div className="bg-[#f7f7f8]">
      <div className="max-w-4xl mx-auto">
        {/* Minimal Header */}
        <header className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">DE</span>
            </div>
            <div>
              <h1 className="text-xs font-semibold text-gray-900">gjuhagjermane</h1>
              <p className="text-[10px] text-gray-500">{selectedLevel} • {categories.find(c => c.value === selectedCategory)?.label}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              {score}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-4 top-12 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Cilësimet</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-1 block">Niveli</label>
                <div className="grid grid-cols-6 gap-1">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setSelectedLevel(level)
                        setShowSettings(false)
                      }}
                      className={`py-1 text-[10px] font-medium rounded-lg transition-all ${
                        selectedLevel === level
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-1 block">Kategoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setShowSettings(false)
                  }}
                  className="w-full bg-gray-100 border-0 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gray-900"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={resetQuestions}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Rivendos pyetjet
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="overflow-y-auto h-[calc(100vh-240px)] min-h-[400px]">
          <div className="px-3 py-3 space-y-2.5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                  {message.type === "bot" && (
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.isHint ? "bg-amber-100" : "bg-gradient-to-br from-orange-400 to-amber-500"
                    }`}>
                      {message.isHint ? (
                        <Lightbulb className="w-3 h-3 text-amber-600" />
                      ) : (
                        <Bot className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                      message.type === "user"
                        ? "bg-gray-900 text-white rounded-br-md"
                        : message.isHint
                          ? "bg-amber-50 text-amber-900 border border-amber-200"
                          : message.responseIcon === "success"
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                            : message.responseIcon === "error"
                              ? "bg-red-50 text-red-900 border border-red-200"
                              : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      {message.responseIcon === "success" && <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
                      {message.responseIcon === "error" && <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="whitespace-pre-line">{message.content}</p>
                        
                        {message.answerComparison && (
                          <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Ti:</span>
                              <span className="bg-white/50 px-1.5 py-0.5 rounded text-sm font-bold text-yellow-600">"{message.answerComparison.userAnswer}"</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Saktë:</span>
                              <span className="bg-emerald-100/50 px-1.5 py-0.5 rounded font-bold text-sm text-green-800">"{message.answerComparison.correctAnswer}"</span>
                            </div>
                          </div>
                        )}
                        
                        {message.score && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-70">
                            <Star className="w-2.5 h-2.5" />
                            {message.score}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {message.type === "user" && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {userProfile?.profilePicture ? (
                        <img src={userProfile.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="px-3 py-2">
            {/* German chars toggle */}
            <div className="mb-1.5">
              <button
                onClick={() => setShowGermanChars(!showGermanChars)}
                className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5"
              >
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showGermanChars ? "rotate-180" : ""}`} />
                Shkronja gjermane
              </button>
              {showGermanChars && (
                <div className="flex gap-1 mt-1.5">
                  {germanChars.map((char) => (
                    <button
                      key={char}
                      onClick={() => insertCharacter(char)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hint button */}
            {currentQuestion?.hints && hintIndex < currentQuestion.hints.length && (
              <button
                onClick={showNextHint}
                className="mb-1.5 text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
              >
                <Lightbulb className="w-2.5 h-2.5" />
                Ndihmë ({hintIndex + 1}/{currentQuestion.hints.length})
              </button>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
            <input
  ref={inputRef}
  type="text"
  value={currentInput}
  onChange={(e) => setCurrentInput(e.target.value)}
  placeholder="Shkruaj përgjigjen tënde..."
  className="flex-1 bg-gray-100 border-0 rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:text-gray-500"
  //         ↑ Ndryshoje nga text-xs në text-base
  disabled={loading || !currentQuestion}
  autoComplete="off"
/>
              <button
                type="submit"
                disabled={!currentInput.trim() || loading || !currentQuestion}
                className="bg-gray-900 text-white px-3 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat