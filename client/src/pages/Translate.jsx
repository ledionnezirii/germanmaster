"use client"

import { useState, useEffect } from "react"
import { translateService } from "../services/api"
import { Languages, Check, X, Filter, ArrowLeft, CheckCircle, Trophy, Book } from "lucide-react"

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

  const fetchTexts = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 50 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await translateService.getAllTexts(params)
      setTexts(response.data.texts || response.data || [])
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
        message: "Error submitting answers. Please try again.",
      })
    }
  }

  const resetQuiz = () => {
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
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "A2":
        return "bg-teal-200 text-teal-800 border-teal-300"
      case "B1":
        return "bg-teal-300 text-teal-800 border-teal-400"
      case "B2":
        return "bg-teal-400 text-teal-800 border-teal-500"
      case "C1":
        return "bg-teal-500 text-white border-teal-600"
      case "C2":
        return "bg-teal-600 text-white border-teal-700"
      default:
        return "bg-gray-200 text-gray-800 border-gray-300"
    }
  }

  if (selectedText) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">{selectedText.title}</h1>
            <button onClick={resetQuiz} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              Kthehu te Tekstet
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Text Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Teksti</h2>
              <p className="text-gray-700 leading-relaxed">{selectedText.text}</p>
            </div>

            {/* Quiz Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              {!quizComplete ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Pyetja {currentQuestion + 1} nga {selectedText.questions.length}
                    </h2>
                    <span className="text-sm text-gray-600">
                      Progresi: {userAnswers.length}/{selectedText.questions.length}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-900 font-medium mb-4">{selectedText.questions[currentQuestion].question}</p>

                    <div className="space-y-3">
                      {selectedText.questions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={selectedAnswer !== ""}
                          className={`w-full p-3 text-left rounded-lg border transition-colors ${
                            selectedAnswer === option
                              ? "bg-teal-100 border-teal-300 text-teal-800"
                              : "bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          }`}
                        >
                          {option}
                          {selectedAnswer === option && <Check className="h-5 w-5 text-teal-600 float-right" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Kuizi u Përfundua!</h2>
                  {quizResults ? (
                    <>
                      <p className="text-lg text-gray-700 mb-4">
                        Fitove {quizResults.correctAnswers} nga {quizResults.totalQuestions} pikë
                      </p>

                      <div className="mb-6">
                        <div className="text-3xl mb-2">
                          {quizResults.passed ? "🎉" : quizResults.score >= 60 ? "👍" : "📚"}
                        </div>
                        <p className="text-gray-600">{quizResults.message}</p>
                        {quizResults.xpAwarded > 0 && (
                          <p className="text-green-600 font-medium mt-2">+{quizResults.xpAwarded} XP fituar!</p>
                        )}
                        {quizResults.passed && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-green-700 font-medium">Teksti u përfundua me sukses!</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show detailed results */}
                      <div className="bg-white rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-gray-900 mb-3">Rezultatet:</h3>
                        <div className="space-y-2">
                          {quizResults.results &&
                            quizResults.results.map((result, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {result.isCorrect ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                                <span className={result.isCorrect ? "text-green-700" : "text-red-700"}>
                                  Pyetja {index + 1}: {result.isCorrect ? "E saktë" : "E gabuar"}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  )}

                  <button
                    onClick={resetQuiz}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Provo Tekst Tjetër
                  </button>
                </div>
              )}
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
                selectedLevel === level ? "bg-teal-700/90 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
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
                    : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-md"
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
                        : "text-gray-800 group-hover:text-teal-700"
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
                        isCompleted ? "bg-orange-400 text-yellow-100" : "bg-teal-100 text-teal-800"
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
            <Languages className="h-10 w-10 text-teal-600 mx-auto mb-3" />
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
