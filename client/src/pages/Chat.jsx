"use client"

import { useState, useEffect, useRef } from "react"
import { questionsService } from "../services/api"
import { MessageCircle, Send, Bot, User, Filter, Lightbulb, RefreshCw, CheckCircle, XCircle, Star } from "lucide-react"

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [askedQuestionIds, setAskedQuestionIds] = useState([])

  // Refs
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  // German special characters
  const germanChars = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"]

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
    // Add welcome message and fetch first question
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        content:
          "Mirë se vini në German Grammar Chat! Do t'ju bëj pyetje për të praktikuar gjermanishten. Le të fillojmë!",
        timestamp: new Date(),
      },
    ])

    // Reset asked questions when level changes
    setAskedQuestionIds([])
    // Clear any existing question to prevent duplicates
    setCurrentQuestion(null)

    // Add a small delay to ensure state is properly reset
    const timer = setTimeout(() => {
      fetchQuestion()
    }, 500)

    return () => clearTimeout(timer)
  }, [selectedLevel])

  const fetchQuestion = async () => {
    // Prevent multiple simultaneous calls
    if (loading) return

    try {
      setLoading(true)

      // Build query parameters for better randomization
      const queryParams = {
        level: selectedLevel,
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
              content: "Ke përfunduar të gjitha pyetjet për këtë nivel! Le të fillojmë përsëri me pyetje të reja.",
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
          content: "Na vjen keq, nuk ka pyetje të disponueshme për këtë nivel. Provo një nivel tjetër!",
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

      if (result.correct || result.score >= 80) {
        setScore((prev) => prev + (result.xpAwarded || 5))
      }

      // Create detailed bot response
      let botContent = ""
      let responseIcon = null

      if (result.correct) {
        botContent = `${result.message}\n\n`
        botContent += `Përgjigja juaj "${result.userAnswer}" është e saktë!`
        if (result.reasonWhy) {
          botContent += `\n\nPse është e saktë: ${result.reasonWhy}`
        }
        if (result.grammarRule) {
          botContent += `\n\nRregulli gramatikor: ${result.grammarRule}`
        }
        if (result.xpAwarded) {
          botContent += `\n\n+${result.xpAwarded} XP fituar!`
        }
        responseIcon = "success"
      } else {
        botContent = `${result.message}\n\n`
        botContent += `Përgjigja juaj: "${result.userAnswer}"`
        botContent += `\nPërgjigja e saktë: "${result.correctAnswer}"`
        if (result.reasonWhy) {
          botContent += `\n\nPse nuk është e saktë: ${result.reasonWhy}`
        }
        if (result.detailedFeedback) {
          botContent += `\n\nShpjegim i detajuar: ${result.detailedFeedback}`
        }
        if (result.score > 0 && result.score < 80) {
          botContent += `\n\nPikët: ${result.score}% - Disa pjesë të përgjigjes ishin të sakta!`
        }
        responseIcon = "error"
      }

      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: botContent,
        timestamp: new Date(),
        isCorrect: result.correct,
        score: result.score,
        detailedResponse: true,
        responseIcon: responseIcon,
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-teal-600" />
              Grammar Chat
            </h1>
            <p className="text-gray-600">Praktiko gramatikën gjermane me pyetje interaktive</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-teal-100 px-3 py-1 rounded-lg">
              <span className="text-teal-800 font-medium">Pikët: {score}</span>
            </div>
            <div className="text-sm text-gray-600">Pyetje të bëra: {askedQuestionIds.length}</div>
            <button
              onClick={resetQuestions}
              className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-1"
              title="Rifillo pyetjet"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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

      {/* Chat Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Fillo të praktikosh gramatikën gjermane!</p>
              <p className="text-sm">Pyetjet do të shfaqen këtu bazuar në nivelin që ke zgjedhur.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start gap-2 max-w-xs lg:max-w-2xl ${
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user" ? "bg-teal-600" : "bg-gray-600"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-teal-600 text-white"
                      : message.isHint
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : message.isCorrect === true
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : message.isCorrect === false
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.responseIcon === "success" && (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.responseIcon === "error" && (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.isHint && <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />}

                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                      {message.score && (
                        <div className="text-xs mt-2 opacity-75 font-medium flex items-center gap-1">
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden element for auto scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-gray-200 p-4">
          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            {currentQuestion && currentQuestion.hints && hintIndex < currentQuestion.hints.length && (
              <button
                onClick={showNextHint}
                className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center gap-1"
              >
                <Lightbulb className="h-4 w-4" />
                Ndihmë ({hintIndex + 1}/{currentQuestion.hints.length})
              </button>
            )}
          </div>

          {/* German Characters Helper */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-2">Shkronja gjermane:</div>
            <div className="flex flex-wrap gap-1">
              {germanChars.map((char) => (
                <button
                  key={char}
                  onClick={() => insertCharacter(char)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
                  type="button"
                  title={`Shto shkronjën ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Shkruaj përgjigjen tënde në gjermanisht..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={loading || !currentQuestion}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!currentInput.trim() || loading || !currentQuestion}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat
