"use client"

import { useState, useEffect, useRef } from "react"
import { questionsService } from "../services/api"
import { MessageCircle, Send, Bot, User, Filter, Lightbulb } from "lucide-react"

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)

  // Ref për scroll automatik
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Funksioni për scroll automatik
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll automatik kur ndryshojnë mesazhet
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
    fetchQuestion()
  }, [selectedLevel])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const response = await questionsService.getRandomQuestion({ level: selectedLevel })

      if (response.data) {
        setCurrentQuestion(response.data)
        setShowHint(false)
        setHintIndex(0)

        // Shtojmë pyetjen e re
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: response.data.question,
            timestamp: new Date(),
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: "Na vjen keq, nuk ka pyetje të disponueshme për këtë nivel. Provo një nivel tjetër!",
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching question:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "Na vjen keq, kam probleme me ngarkimin e pyetjeve. Ju lutem provoni më vonë.",
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

    // Shtojmë mesazhin e përdoruesit
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Pastroj input-in menjëherë
    const submittedAnswer = currentInput
    setCurrentInput("")

    try {
      // Dërgojmë përgjigjen në backend
      const response = await questionsService.answerQuestion(currentQuestion._id, submittedAnswer)
      const result = response.data

      if (result.correct || result.score >= 80) {
        setScore((prev) => prev + (result.xpAwarded || 5))
      }

      // Krijojmë përgjigjen e bot-it me feedback të detajuar
      let botContent = result.message || "Faleminderit për përgjigjen!"

      if (!result.correct) {
        botContent += `\n\n✅ Përgjigja e saktë është: ${result.correctAnswer}`
        if (result.explanation) {
          botContent += `\n\n📚 Shpjegimi: ${result.explanation}`
        }
      } else {
        botContent += ` 🎉`
        if (result.xpAwarded) {
          botContent += `\n\n⭐ +${result.xpAwarded} XP fituar!`
        }
      }

      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: botContent,
        timestamp: new Date(),
        isCorrect: result.correct,
        score: result.score,
      }

      setMessages((prev) => [...prev, botResponse])

      // Ngarkojmë pyetjen e ardhshme pas një vonesë
      setTimeout(() => {
        const nextQuestionMessage = {
          id: Date.now() + 2,
          type: "bot",
          content: "Le të vazhdojmë me pyetjen e ardhshme! 📝",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, nextQuestionMessage])

        // Ngarkojmë pyetjen e re pas një vonesë të shkurtër
        setTimeout(() => {
          fetchQuestion()
        }, 1000)
      }, 2000)
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
          content: `💡 Ndihmë: ${hint}`,
          timestamp: new Date(),
          isHint: true,
        },
      ])
      setHintIndex(hintIndex + 1)
      setShowHint(true)
    }
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
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
                className={`flex items-start gap-2 max-w-xs lg:max-w-md ${
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
                  className={`px-4 py-2 rounded-lg ${
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
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  {message.score && <p className="text-xs mt-1 opacity-75">Pikët: {message.score}%</p>}
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

          {/* Element i fshehur për scroll automatik */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2 mb-2">
            {currentQuestion && currentQuestion.hints && hintIndex < currentQuestion.hints.length && (
              <button
                onClick={showNextHint}
                className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center gap-1"
              >
                <Lightbulb className="h-4 w-4" />
                Ndihmë
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
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
