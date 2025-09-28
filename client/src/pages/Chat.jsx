"use client"
import { useState, useEffect, useRef } from "react"
import { questionsService, authService } from "../services/api"
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Filter,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
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

  // Refs
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  // German special characters
  const germanChars = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"]

  const categories = [
    { value: "grammar", label: "Gramatikë" },
    { value: "vocabulary", label: "Fjalor" },
    { value: "pronunciation", label: "Shqiptim" },
    { value: "culture", label: "Kulturë" },
    { value: "articles", label: "Artikuj" },
    { value: "translation", label: "Përkthim" },
    { value: "Begginers", label: "Fillestarë" },
    { value: "Präpositionen", label: "Parafjalë" },
    { value: "Adjectives", label: "Mbiemra" },
    { value: "Perfekt", label: "Perfekt(koha e kryer)" },
    { value: "mixed", label: "Të përziera (të gjitha)" },
  ]

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile()
      setUserProfile(response.data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  // Auto-focus input when a new question is loaded
  useEffect(() => {
    if (currentQuestion && inputRef.current && !loading) {
      // Small delay to ensure the question message is rendered first
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [currentQuestion, loading])

  // Function to insert character at cursor position
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
    // Set cursor position after the inserted character
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 1, start + 1)
    }, 0)
  }

  // Scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchUserProfile()

    // Add welcome message and fetch first question
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        content:
          "Mirë se vini në Bisedën Gramatikore Gjermane! Do t'ju bëj pyetje për të praktikuar gjermanishten. Le të fillojmë!",
        timestamp: new Date(),
      },
    ])
    // Reset asked questions when level or category changes
    setAskedQuestionIds([])
    // Clear any existing question to prevent duplicates
    setCurrentQuestion(null)
    // Add a small delay to ensure state is properly reset
    const timer = setTimeout(() => {
      fetchQuestion()
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedLevel, selectedCategory])

  const fetchQuestion = async () => {
    // Prevent multiple simultaneous calls
    if (loading) return
    try {
      setLoading(true)
      const queryParams = {
        level: selectedLevel,
        category: selectedCategory === "mixed" ? undefined : selectedCategory,
        // Pass excluded IDs to ensure variety
        excludeIds: askedQuestionIds.join(","),
      }
      const response = await questionsService.getRandomQuestion(queryParams)
      if (response.data) {
        setCurrentQuestion(response.data)
        setShowHint(false)
        setHintIndex(0)
        // Add question ID to asked questions list
        setAskedQuestionIds((prev) => [...prev, response.data._id])
        // Add new question
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
        // If no more questions available, reset the asked questions list
        if (askedQuestionIds.length > 0) {
          setAskedQuestionIds([])
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content:
                "Ke përfunduar të gjitha pyetjet për këtë nivel dhe kategori! Le të fillojmë përsëri me pyetje të reja.",
              timestamp: new Date(),
            },
          ])
        }
        // Try fetching again with reset list
        setTimeout(() => fetchQuestion(), 1000)
      }
    } catch (error) {
      console.error("Error fetching question:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "Na vjen keq, nuk ka pyetje të disponueshme për këtë nivel dhe kategori. Provo një kombinim tjetër!",
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

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Clear input immediately
    const submittedAnswer = currentInput
    setCurrentInput("")

    try {
      // Send answer to backend
      const response = await questionsService.answerQuestion(currentQuestion._id, submittedAnswer)
      const result = response.data

      if (result.correct || result.score >= 70) {
        setScore((prev) => prev + (result.xpAwarded || Math.max(1, Math.floor(result.score / 20))))
      }

      let botContent = ""
      let responseIcon = null
      let answerComparison = null

      // Create colored answer comparison for visual feedback
      if (result.userAnswer && result.correctAnswer && result.userAnswer !== result.correctAnswer) {
        answerComparison = {
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          score: result.score,
        }
      }

      if (result.correct || result.score >= 90) {
        botContent = `${result.message}\n\n✅ Përgjigja juaj është shumë e mirë!`
        if (result.reasonWhy) {
          botContent += `\n\n${result.reasonWhy}`
        }
        if (result.grammarRule) {
          botContent += `\n\nRregulli gramatikor: ${result.grammarRule}`
        }
        if (result.xpAwarded) {
          botContent += `\n\n+${result.xpAwarded} XP fituar!`
        }
        responseIcon = "success"
      } else if (result.score >= 70) {
        botContent = `${result.message}\n\n📝 Përgjigja juaj është në rrugën e duhur!`
        if (result.reasonWhy) {
          botContent += `\n\n${result.reasonWhy}`
        }
        if (result.detailedFeedback) {
          botContent += `\n\n${result.detailedFeedback}`
        }
        botContent += `\n\nPikët: ${result.score}% - Punë e mirë!`
        if (result.xpAwarded) {
          botContent += ` +${result.xpAwarded} XP!`
        }
        responseIcon = "success"
      } else {
        botContent = `${result.message}`
        if (result.reasonWhy) {
          botContent += `\n\n${result.reasonWhy}`
        }
        if (result.detailedFeedback) {
          botContent += `\n\n${result.detailedFeedback}`
        }
        if (result.score > 0) {
          botContent += `\n\nPikët: ${result.score}% - Vazhdo të provosh!`
        }
        responseIcon = "error"
      }

      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: botContent,
        timestamp: new Date(),
        isCorrect: result.correct || result.score >= 70,
        score: result.score,
        detailedResponse: true,
        responseIcon: responseIcon,
        answerComparison: answerComparison,
      }
      setMessages((prev) => [...prev, botResponse])

      // Load next question after delay
      setTimeout(() => {
        const nextQuestionMessage = {
          id: Date.now() + 2,
          type: "bot",
          content: "Le të vazhdojmë me pyetjen e ardhshme!",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, nextQuestionMessage])
        // Load new question after short delay
        setTimeout(() => {
          fetchQuestion()
        }, 1000)
      }, 3000)
    } catch (error) {
      console.error("Error submitting answer:", error)
      const errorResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: "Na vjen keq, pati një gabim gjatë procesimit të përgjigjes. Ju lutem provoni përsëri.",
        timestamp: new Date(),
        isCorrect: false,
      }
      setMessages((prev) => [...prev, errorResponse])
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
          content: `Ndihmë ${hintIndex + 1}: ${hint}`,
          timestamp: new Date(),
          isHint: true,
        },
      ])
      setHintIndex(hintIndex + 1)
      setShowHint(true)
      // Refocus input after showing hint
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const resetQuestions = () => {
    setAskedQuestionIds([])
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "bot",
        content: "Pyetjet u rivendosën! Tani mund të praktikosh përsëri të gjitha pyetjet.",
        timestamp: new Date(),
      },
    ])
    setTimeout(() => {
      fetchQuestion()
    }, 1000)
  }

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl"></div>

          <div className="relative z-10 flex flex-col space-y-6 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center justify-center lg:justify-start gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                Bisedë Gramatikore
              </h1>
              <p className="text-slate-600 mt-2 font-medium">Praktiko gramatikën gjermane me pyetje interaktive</p>
            </div>

            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex items-center justify-center gap-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-bold">{score} XP</span>
                  </div>
                </div>
                <div className="text-sm text-slate-600 bg-white/60 px-3 py-2 rounded-lg border border-slate-200">
                  Pyetje: {askedQuestionIds.length}
                </div>
              </div>

              <button
                onClick={resetQuestions}
                className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 text-sm flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                title="Rifillo pyetjet"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Rivendos</span>
              </button>

              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3">
                <div className="flex items-center gap-2 bg-white/60 rounded-xl p-2 border border-slate-200">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white/60 rounded-xl p-2 border border-slate-200">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 flex flex-col h-[500px] relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth relative z-10">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-12">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2">Fillo të praktikosh gramatikën gjermane!</p>
                <p className="text-slate-500">Pyetjet do të shfaqen këtu bazuar në nivelin që ke zgjedhur.</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                        : "bg-gradient-to-r from-slate-600 to-slate-700"
                    }`}
                  >
                    {message.type === "user" ? (
                      userProfile?.profilePicture ? (
                        <img
                          src={userProfile.profilePicture || "/placeholder.svg"}
                          alt="User profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                      ) : null
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                    {message.type === "user" && (
                      <User
                        className="h-5 w-5 text-white"
                        style={{ display: userProfile?.profilePicture ? "none" : "block" }}
                      />
                    )}
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-200"
                        : message.isHint
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-200"
                          : message.isCorrect === true
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200"
                            : message.isCorrect === false
                              ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200"
                              : "bg-white/90 text-slate-800 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.responseIcon === "success" && (
                        <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      )}
                      {message.responseIcon === "error" && (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      {message.isHint && <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed whitespace-pre-line break-words font-medium">
                          {message.content}
                        </p>

                        {message.answerComparison && (
                          <div className="mt-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-600">Përgjigja juaj:</span>
                                <span
                                  className={`px-2 py-1 rounded-lg text-xs font-medium shadow-sm ${
                                    message.answerComparison.score >= 90
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : message.answerComparison.score >= 70
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-red-100 text-red-800 border border-red-200"
                                  }`}
                                >
                                  "{message.answerComparison.userAnswer}"
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-600">Përgjigja e saktë:</span>
                                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                  "{message.answerComparison.correctAnswer}"
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {message.score && (
                          <div className="text-xs mt-2 opacity-80 font-semibold flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Pikët: {message.score}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/20 bg-white/50 backdrop-blur-sm p-6 relative z-10">
            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              {currentQuestion && currentQuestion.hints && hintIndex < currentQuestion.hints.length && (
                <button
                  onClick={showNextHint}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 text-sm flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    Ndihmë ({hintIndex + 1}/{currentQuestion.hints.length})
                  </span>
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">Shkronja gjermane:</div>
              <div className="flex flex-wrap gap-2">
                {germanChars.map((char) => (
                  <button
                    key={char}
                    onClick={() => insertCharacter(char)}
                    className="bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 backdrop-blur-sm"
                    type="button"
                    title={`Shto shkronjën ${char}`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Shkruaj përgjigjen tënde në gjermanisht..."
                className="flex-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 text-sm shadow-sm transition-all duration-200"
                disabled={loading || !currentQuestion}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!currentInput.trim() || loading || !currentQuestion}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat