"use client"

import { useState, useEffect, useRef } from "react"
import { translateService } from "../services/api"
import { Languages, Check, X, Filter, ArrowLeft, CheckCircle, Book, Play, Pause, Volume2 } from "lucide-react"

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
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "A2":
        return "bg-emerald-200 text-emerald-800 border-emerald-300"
      case "B1":
        return "bg-blue-200 text-blue-800 border-blue-300"
      case "B2":
        return "bg-blue-300 text-blue-800 border-blue-400"
      case "C1":
        return "bg-purple-400 text-white border-purple-500"
      case "C2":
        return "bg-purple-600 text-white border-purple-700"
      default:
        return "bg-gray-200 text-gray-800 border-gray-300"
    }
  }

  if (selectedText) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{selectedText.title}</h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(selectedText.level)} bg-white/20 text-white border-white/30`}
                  >
                    Niveli {selectedText.level}
                  </span>
                  <span className="text-blue-100 text-sm">{selectedText.questions?.length || 0} pyetje</span>
                </div>
              </div>
              <button
                onClick={resetQuiz}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Kthehu te Tekstet
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 p-8">
            {/* Enhanced Text Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Book className="h-6 w-6 text-blue-600" />
                    Teksti për Lexim
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
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                      title={!isPlaying ? "Dëgjo tekstin" : isPaused ? "Vazhdo" : "Ndalo përkohësisht"}
                    >
                      {!isPlaying || isPaused ? (
                        <>
                          <Play className="h-4 w-4" />
                          <span className="hidden sm:inline">{!isPlaying ? "Dëgjo" : "Vazhdo"}</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          <span className="hidden sm:inline">Ndalo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enhanced Text Display */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
                  <div className="relative bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <p className="text-gray-800 leading-relaxed text-lg font-medium tracking-wide">
                      {selectedText.text}
                    </p>
                  </div>
                </div>

                {/* Reading Tips */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Këshilla për Lexim
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Lexoni tekstin me kujdes dhe përqendrohuni në detajet</li>
                    <li>• Përdorni butonin "Dëgjo" për të dëgjuar shqiptimin e saktë</li>
                    <li>• Mund të lexoni tekstin disa herë para se të filloni pyetjet</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enhanced Quiz Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-lg">
                {!quizComplete ? (
                  <>
                    {/* Progress Header */}
                    <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h2 className="text-xl font-bold text-gray-800">
                        Pyetja {currentQuestion + 1} nga {selectedText.questions.length}
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                          <span className="text-sm font-medium text-gray-600">
                            Progresi: {userAnswers.length}/{selectedText.questions.length}
                          </span>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                            style={{ width: `${(userAnswers.length / selectedText.questions.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-8">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <p className="text-gray-900 font-semibold text-lg leading-relaxed">
                          {selectedText.questions[currentQuestion].question}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-4">
                        {selectedText.questions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== ""}
                            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 font-medium ${
                              selectedAnswer === option
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-md transform scale-[1.02]"
                                : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex-1">{option}</span>
                              {selectedAnswer === option && (
                                <div className="flex items-center gap-2">
                                  <Check className="h-5 w-5 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Zgjedhur</span>
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
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">Kuizi u Përfundua!</h2>
                      {quizResults ? (
                        <>
                          <div className="text-6xl mb-4">
                            {quizResults.passed ? "🎉" : quizResults.score >= 60 ? "👍" : "📚"}
                          </div>

                          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                            <p className="text-2xl font-bold text-gray-800 mb-2">
                              {quizResults.correctAnswers} nga {quizResults.totalQuestions} të sakta
                            </p>
                            <p className="text-lg text-gray-600 mb-4">{quizResults.message}</p>

                            {quizResults.xpAwarded > 0 && (
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                                <p className="text-yellow-800 font-bold text-lg">
                                  🏆 +{quizResults.xpAwarded} XP fituar!
                                </p>
                              </div>
                            )}
                          </div>

                          {quizResults.passed && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-6">
                              <div className="flex items-center justify-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <span className="text-green-800 font-bold text-lg">Teksti u përfundua me sukses!</span>
                              </div>
                            </div>
                          )}

                          {/* Detailed Results */}
                          <div className="bg-white rounded-xl p-6 shadow-sm text-left">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Rezultatet e Detajuara:</h3>
                            <div className="space-y-3">
                              {quizResults.results &&
                                quizResults.results.map((result, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                      result.isCorrect
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-red-50 border border-red-200"
                                    }`}
                                  >
                                    {result.isCorrect ? (
                                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                      <X className="h-5 w-5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span
                                      className={`font-medium ${result.isCorrect ? "text-green-800" : "text-red-800"}`}
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
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={resetQuiz}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Praktika e Përkthimit</h1>
        <p className="text-gray-600">Praktiko kuptimin e leximit me tekste gjermane dhe pyetje</p>
      </div>

      {/* Level Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtro sipas Nivelit</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {level === "all" ? "Të Gjitha Nivelet" : level}
            </button>
          ))}
        </div>
      </div>

      {/* Texts Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {texts.map((text) => {
            const progress = userProgress[text._id]
            const isCompleted = progress && progress.completed
            return (
              <div
                key={text._id}
                className={`p-3 rounded-lg shadow-sm border transition-all cursor-pointer overflow-hidden relative group h-fit ${
                  isCompleted
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400 hover:shadow-lg"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedText(text)}
              >
                {/* Level Badge */}
                <div
                  className={`absolute top-2 right-2 ${getLevelColor(text.level)} px-1.5 py-0.5 rounded text-xs font-medium`}
                >
                  {text.level}
                </div>
                {/* Background Icon */}
                <Book
                  className={`absolute -bottom-4 -right-4 w-16 h-16 ${
                    isCompleted ? "text-yellow-200" : "text-gray-200"
                  }`}
                />
                <div className="relative z-10">
                  <h3
                    className={`text-sm font-semibold mb-1 pr-12 ${
                      isCompleted
                        ? "text-yellow-800 group-hover:text-yellow-900"
                        : "text-gray-800 group-hover:text-blue-700"
                    }`}
                  >
                    {text.title}
                  </h3>
                  <p className={`text-xs line-clamp-2 ${isCompleted ? "text-yellow-700" : "text-gray-600"}`}>
                    {text.text.substring(0, 80)}...
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className={`text-xs ${isCompleted ? "text-yellow-600" : "text-gray-500"}`}>
                      {text.questions?.length || 0} pyetje
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        isCompleted ? "bg-orange-400 text-yellow-100" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isCompleted ? "Përfunduar" : "Fillo"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {texts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-6 inline-block">
            <Languages className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-800 mb-1">Nuk ka tekste të disponueshme</h3>
            <p className="text-gray-500 text-xs">
              {selectedLevel === "all"
                ? "Nuk u gjetën tekste përkthimi."
                : `Nuk ka tekste për nivelin ${selectedLevel}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Translate
