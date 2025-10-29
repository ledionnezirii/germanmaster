"use client"

import { useState, useEffect, useRef } from "react"
import { translateService } from "../services/api"
import { Check, X, Filter, ArrowLeft, Book, Play, Pause } from "lucide-react"

const Translate = () => {
  const [texts, setTexts] = useState([])
  const [selectedText, setSelectedText] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [userAnswers, setUserAnswers] = useState([])
  const [userProgress, setUserProgress] = useState({})
  const [quizResults, setQuizResults] = useState(null)

  // Text-to-Speech states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const speechRef = useRef(null)

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  useEffect(() => {
    fetchTexts()
    fetchUserProgress()
  }, [selectedLevel])

  useEffect(() => {
    if (selectedText && quizComplete) {
      setTimeout(() => {
        fetchUserProgress()
      }, 2000)
    }
  }, [quizComplete, selectedText])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedText])

  // Text-to-Speech functions
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set language to German (since the texts are in German)
      utterance.lang = "de-DE"
      utterance.rate = 0.8 // Slightly slower for learning
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsPlaying(true)
        setIsPaused(false)
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }

      utterance.onerror = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }

      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } else {
      alert("Shfletuesi juaj nuk mbështet leximin e tekstit. Ju lutem përdorni një shfletues më të ri.")
    }
  }

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const fetchTexts = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 50 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await translateService.getAllTexts(params)
      const textsData = response.data.texts || response.data || []

      // Sort by oldest first (ascending order by creation date)
      const sortedTexts = textsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0)
        const dateB = new Date(b.createdAt || b.updatedAt || 0)
        return dateA - dateB // Oldest first
      })

      setTexts(sortedTexts)
    } catch (error) {
      console.error("Error fetching texts:", error)
      setTexts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await translateService.getUserProgress()
      const progressData = response.data.progress || response.data || []
      const progressMap = {}
      progressData.forEach((progress) => {
        if (progress.textId) {
          const textId = typeof progress.textId === "object" ? progress.textId._id : progress.textId
          progressMap[textId] = progress
        }
      })
      setUserProgress(progressMap)
    } catch (error) {
      console.error("Error fetching user progress:", error)
    }
  }

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer)
    const updatedUserAnswers = [...userAnswers]
    updatedUserAnswers[currentQuestion] = answer
    setUserAnswers(updatedUserAnswers)
    setTimeout(() => {
      if (currentQuestion + 1 < selectedText.questions.length) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer("")
      } else {
        setQuizComplete(true)
        submitQuizAnswers(updatedUserAnswers)
      }
    }, 1000)
  }

  const submitQuizAnswers = async (answers) => {
    try {
      const formattedAnswers = selectedText.questions.map((question, index) => ({
        questionId: question._id,
        answer: answers[index] || "",
      }))
      const response = await translateService.submitAnswers(selectedText._id, formattedAnswers)
      setQuizResults(response.data)
      setScore(response.data.correctAnswers || 0)
      if (response.data.passed) {
        setUserProgress((prev) => ({
          ...prev,
          [selectedText._id]: {
            ...prev[selectedText._id],
            completed: true,
            textId: selectedText._id,
          },
        }))
      }
    } catch (error) {
      console.error("Error submitting answers:", error)
      setQuizResults({
        score: 0,
        correctAnswers: 0,
        totalQuestions: selectedText.questions.length,
        passed: false,
        message: "Gabim në dërgimin e përgjigjeve. Ju lutem provoni përsëri.",
      })
    }
  }

  const resetQuiz = () => {
    // Stop any playing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
    }

    setSelectedText(null)
    setCurrentQuestion(0)
    setSelectedAnswer("")
    setScore(0)
    setShowResult(false)
    setQuizComplete(false)
    setUserAnswers([])
    setQuizResults(null)
    fetchUserProgress()

    window.scrollTo({ top: 0, behavior: "smooth" })
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

  if (selectedText) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-3 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{selectedText.title}</h1>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getLevelColor(selectedText.level)} bg-white/20 text-white border-white/30`}
                  >
                    Niveli {selectedText.level}
                  </span>
                  <span className="text-teal-100 text-xs sm:text-sm">{selectedText.questions?.length || 0} pyetje</span>
                </div>
              </div>
              <button
                onClick={resetQuiz}
                className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Kthehu te Tekstet</span>
                <span className="sm:hidden">Kthehu</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8 p-3 sm:p-8">
            {/* Enhanced Text Section */}
            <div className="space-y-4 sm:space-y-6 w-full">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200 shadow-inner">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Book className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                    <span className="hidden sm:inline">Teksti për Lexim</span>
                    <span className="sm:hidden">Teksti</span>
                  </h2>

                  {/* Audio Controls - Single Play/Pause Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!isPlaying) {
                          speakText(selectedText.text)
                        } else if (isPaused) {
                          resumeSpeech()
                        } else {
                          pauseSpeech()
                        }
                      }}
                      className="flex items-center gap-1 sm:gap-2 bg-teal-600 hover:bg-teal-700 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors shadow-md text-xs sm:text-sm"
                      title={!isPlaying ? "Dëgjo tekstin" : isPaused ? "Vazhdo" : "Ndalo përkohësisht"}
                    >
                      {!isPlaying || isPaused ? (
                        <>
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{!isPlaying ? "Dëgjo" : "Vazhdo"}</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Ndalo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enhanced Text Display */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-teal-500/5 rounded-xl"></div>
                  <div className="relative bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200 w-full">
                    <p className="text-gray-800 leading-relaxed text-xs sm:text-sm font-medium tracking-wide break-words w-full">
                      {selectedText.text}
                    </p>
                  </div>
                </div>

                {/* Reading Tips Removed*/}
              </div>
            </div>

            {/* Enhanced Quiz Section */}
            <div className="space-y-4 sm:space-y-6 w-full">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200 shadow-lg">
                {!quizComplete ? (
                  <>
                    {/* Progress Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-teal-50 to-teal-50 rounded-xl border border-teal-200 gap-2 sm:gap-0">
                      <h2 className="text-base sm:text-xl font-bold text-gray-800">
                        Pyetja {currentQuestion + 1} nga {selectedText.questions.length}
                      </h2>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm">
                          <span className="text-xs sm:text-sm font-medium text-gray-600">
                            {userAnswers.length}/{selectedText.questions.length}
                          </span>
                        </div>
                        <div className="flex-1 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                            style={{ width: `${(userAnswers.length / selectedText.questions.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-6 sm:mb-8">
                      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
                        <p className="text-gray-900 font-semibold text-xs sm:text-base leading-relaxed break-words">
                          {selectedText.questions[currentQuestion].question}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2 sm:space-y-4">
                        {selectedText.questions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== ""}
                            className={`w-full p-2 sm:p-4 text-left rounded-xl border-2 transition-all duration-200 font-medium ${
                              selectedAnswer === option
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-md transform scale-[1.02]"
                                : "bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50 disabled:opacity-50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex-1 text-xs sm:text-base break-words pr-2">{option}</span>
                              {selectedAnswer === option && (
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                  <Check className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium hidden sm:inline">Zgjedhur</span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Results Section */
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-50 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-teal-200">
                      <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
                        Testi u përfundua me sukses!
                      </h2>
                      {quizResults ? (
                        <>
                          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">
                            {quizResults.passed ? "🎉" : quizResults.score >= 60 ? "👍" : "📚"}
                          </div>

                          {quizResults.xpAwarded > 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 sm:p-4 rounded-lg border border-yellow-200 mb-4 sm:mb-6">
                              <p className="text-yellow-800 font-bold text-base sm:text-lg">
                                🏆 +{quizResults.xpAwarded} XP fituar!
                              </p>
                            </div>
                          )}

                          {/* Detailed Results - Smaller and more compact */}
                          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm text-left">
                            <h3 className="font-bold text-gray-900 mb-2 sm:mb-4 text-sm sm:text-lg">Rezultatet:</h3>
                            <div className="space-y-1 sm:space-y-3">
                              {quizResults.results &&
                                quizResults.results.map((result, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${
                                      result.isCorrect
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-red-50 border border-red-200"
                                    }`}
                                  >
                                    {result.isCorrect ? (
                                      <Check className="h-3 w-3 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                      <X className="h-3 w-3 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span
                                      className={`font-medium text-xs sm:text-base ${result.isCorrect ? "text-green-800" : "text-red-800"}`}
                                    >
                                      Pyetja {index + 1}: {result.isCorrect ? "E saktë" : "E gabuar"}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-teal-600"></div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={resetQuiz}
                      className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                    >
                      Provo Tekst Tjetër
                    </button>
                  </div>
                )}
              </div>
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktika e Përkthimit</h1>
                <p className="text-gray-600">Praktiko kuptimin e leximit me tekste gjermane dhe pyetje</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Teste të përfunduara: {Object.values(userProgress).filter((p) => p.completed).length}
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
            {texts.length > 0 ? (
              texts.map((text) => {
                const progress = userProgress[text._id]
                const isCompleted = progress && progress.completed
                return (
                  <div
                    key={text._id}
                    className={`p-3 rounded-lg shadow-md border-2 transition-all cursor-pointer overflow-hidden relative group h-fit hover:shadow-xl ${
                      isCompleted
                        ? "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#F59E0B] hover:border-[#D97706]"
                        : "bg-white border-[#99F6E4] hover:border-[#5EEAD4]"
                    }`}
                    onClick={() => setSelectedText(text)}
                  >
                    <div
                      className={`absolute top-2 right-2 ${getLevelColor(text.level)} px-1.5 py-0.5 rounded text-xs font-medium shadow-sm`}
                    >
                      {text.level}
                    </div>
                    <Book
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
                        {text.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${isCompleted ? "text-[#92400E]" : "text-gray-600"}`}>
                        {text.text ? text.text.substring(0, 80) + "..." : "Tekst për lexim"}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-xs ${isCompleted ? "text-[#92400E]" : "text-gray-500"}`}>
                          {text.questions?.length || 0} pyetje
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium shadow-sm ${
                            isCompleted
                              ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
                              : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white"
                          }`}
                        >
                          {isCompleted ? "Përfunduar" : "Fillo"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="bg-white rounded-lg p-6 inline-block border-2 border-[#99F6E4] shadow-lg">
                  <Book className="text-[#14B8A6] w-10 h-10 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Nuk u gjetën tekste</h3>
                  <p className="text-gray-500 text-xs">
                    Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Translate
