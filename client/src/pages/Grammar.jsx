"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import React from "react"

import { grammarService } from "../services/api"
import {
  GraduationCap,
  BookOpen,
  Filter,
  Target,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Globe,
  Lightbulb,
  Volume2,
  RefreshCw,
  AlertCircle,
  Play,
  RotateCcw,
  Award,
  Brain,
  ListCheck,
} from "lucide-react"

const getLevelColor = (level) => {
  switch (level) {
    case "A1":
      return "bg-emerald-50 text-emerald-700 border-emerald-300"
    case "A2":
      return "bg-teal-50 text-teal-700 border-teal-300"
    case "B1":
      return "bg-blue-50 text-blue-700 border-blue-300"
    case "B2":
      return "bg-indigo-50 text-indigo-700 border-indigo-300"
    case "C1":
      return "bg-purple-50 text-purple-700 border-purple-300"
    case "C2":
      return "bg-pink-50 text-pink-700 border-pink-300"
    default:
      return "bg-gray-50 text-gray-700 border-gray-300"
  }
}

const getLevelDescription = (level) => {
  switch (level) {
    case "A1":
      return "Fillestar - Bazat e gjuhës"
    case "A2":
      return "Fillestar i avancuar"
    case "B1":
      return "I mesëm"
    case "B2":
      return "I mesëm i avancuar"
    case "C1":
      return "I avancuar"
    case "C2":
      return "Mjeshtëri"
    default:
      return "Të gjitha nivelet"
  }
}

const Grammar = () => {
  const [topics, setTopics] = useState([])
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [topicLoading, setTopicLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("content")
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayingNumber, setCurrentPlayingNumber] = useState(null)
  const [showDetailedContent, setShowDetailedContent] = useState(false)
  const [finishedTopics, setFinishedTopics] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    fetchTopics()
    fetchFinishedTopics()
  }, [selectedLevel])

  const fetchFinishedTopics = async () => {
    try {
      const response = await grammarService.getFinishedTopics()
      const finishedIds = response.data?.finishedTopics || response.data || []
      const finishedIdsAsStrings = finishedIds.map((id) => String(id))
      setFinishedTopics(finishedIdsAsStrings)
    } catch (error) {
      console.error("Error fetching finished topics:", error)
      setFinishedTopics([])
    }
  }

  const handleMarkAsFinished = async () => {
    if (!selectedTopic) return

    try {
      const response = await grammarService.markTopicAsFinished(selectedTopic._id)
      const topicIdString = String(selectedTopic._id)

      setFinishedTopics((prev) => {
        if (!prev.includes(topicIdString)) {
          return [...prev, topicIdString]
        }
        return prev
      })

      alert("Urime! Keni përfunduar këtë temë të gramatikës!")
    } catch (error) {
      console.error("Error marking topic as finished:", error)
      alert("Dështoi shënimi i temës si e përfunduar. Ju lutemi provoni përsëri.")
    }
  }

  const isTopicFinished = (topicId) => {
    const topicIdString = String(topicId)
    return finishedTopics.includes(topicIdString)
  }

  const fetchTopics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response =
        selectedLevel === "all"
          ? await grammarService.getAllTopics()
          : await grammarService.getTopicsByLevel(selectedLevel)

      let topicsData = []
      if (response.data?.topics) {
        topicsData = response.data.topics
      } else if (response.data?.data?.topics) {
        topicsData = response.data.data.topics
      } else if (Array.isArray(response.data)) {
        topicsData = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        topicsData = response.data.data
      }
      setTopics(Array.isArray(topicsData) ? topicsData : [])
    } catch (error) {
      console.error("Error fetching topics:", error)
      setError("Dështoi ngarkimi i temave të gramatikës. Ju lutemi provoni përsëri.")
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTopicDetails = async (topicId) => {
    try {
      setTopicLoading(true)
      const response = await grammarService.getTopicById(topicId)
      setSelectedTopic(response.data)
      setActiveTab("content")
      setSelectedAnswers({})
      setShowResults({})
    } catch (error) {
      console.error("Error fetching topic details:", error)
      setError("Dështoi ngarkimi i detajeve të temës. Ju lutemi provoni përsëri.")
    } finally {
      setTopicLoading(false)
    }
  }

  const filteredTopics = useMemo(() => {
    return Array.isArray(topics) ? topics : []
  }, [topics])

  const handleTopicClick = useCallback((topic) => {
    fetchTopicDetails(topic._id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleBackToTopics = useCallback(() => {
    setSelectedTopic(null)
    setActiveTab("content")
    setSelectedAnswers({})
    setShowResults({})
    setShowDetailedContent(false)
    setCurrentQuestionIndex(0)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleAnswerSelect = useCallback(
    (exerciseIndex, answer) => {
      const exercise = selectedTopic.exercises[exerciseIndex]
      const isCorrect = answer === exercise.correctAnswer

      setSelectedAnswers((prev) => ({
        ...prev,
        [exerciseIndex]: answer,
      }))

      setShowResults((prev) => ({
        ...prev,
        [exerciseIndex]: {
          isCorrect,
          userAnswer: answer,
          correctAnswer: exercise.correctAnswer,
        },
      }))

      if (isCorrect) {
        setShowDetailedContent(true)
      }

      if (exerciseIndex < selectedTopic.exercises.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(exerciseIndex + 1)
          setShowDetailedContent(false)
        }, 2000)
      }
    },
    [selectedTopic],
  )

  const speakGerman = useCallback(
    (text, callback = null) => {
      if ("speechSynthesis" in window && !isPlaying) {
        window.speechSynthesis.cancel()
        setIsPlaying(true)

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "de-DE"
        utterance.rate = 0.7
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onend = () => {
          setIsPlaying(false)
          setCurrentPlayingNumber(null)
          if (callback) callback()
        }

        utterance.onerror = () => {
          setIsPlaying(false)
          setCurrentPlayingNumber(null)
        }

        window.speechSynthesis.speak(utterance)
      }
    },
    [isPlaying],
  )

  const speakNumber = (numberItem) => {
    setCurrentPlayingNumber(numberItem.number)
    speakGerman(numberItem.german, () => {
      setCurrentPlayingNumber(null)
    })
  }

  const isAllExercisesCompleted = () => {
    if (!selectedTopic?.exercises) return false
    return selectedTopic.exercises.every((_, index) => showResults[index])
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  const hasNumbers = (topic) => {
    return topic && topic.numbers && Array.isArray(topic.numbers) && topic.numbers.length > 0
  }

  const renderTopicGrid = useMemo(() => {
    return filteredTopics.map((topic) => (
      <TopicCard key={topic._id} topic={topic} onClick={handleTopicClick} isFinished={isTopicFinished(topic._id)} />
    ))
  }, [filteredTopics, handleTopicClick, finishedTopics])

  if (selectedTopic) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={handleBackToTopics}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors text-sm font-medium"
            aria-label="Kthehu te lista e temave"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kthehu te Lista e Temave</span>
          </button>

          {topicLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
              <span className="ml-3 text-gray-600 text-sm">Duke ngarkuar...</span>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500 p-1.5 rounded-lg">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">{selectedTopic.name}</h1>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedTopic.description}</p>
                </div>
              </div>

              {selectedTopic.tags && selectedTopic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTopic.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {!topicLoading && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50">
              <button
                onClick={() => {
                  setActiveTab("content")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
                  activeTab === "content"
                    ? "text-blue-600 bg-white border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Përmbajtja
              </button>

              {hasNumbers(selectedTopic) && (
                <button
                  onClick={() => {
                    setActiveTab("numbers")
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
                    activeTab === "numbers"
                      ? "text-teal-600 bg-white border-b-2 border-teal-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span>🔢</span>
                  Numrat ({selectedTopic.numbers?.length || 0})
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab("examples")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
                  activeTab === "examples"
                    ? "text-amber-600 bg-white border-b-2 border-amber-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Shembuj ({selectedTopic.examples?.length || 0})
              </button>

              <button
                onClick={() => {
                  setActiveTab("exercises")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
                  activeTab === "exercises"
                    ? "text-purple-600 bg-white border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Ushtrime ({selectedTopic.exercises?.length || 0})
              </button>
            </div>

            <div className="p-4">
              {activeTab === "content" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">Shpjegimi i Gramatikës</h3>
                  </div>

                  {typeof selectedTopic.content === "string" ? (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">
                        {selectedTopic.content}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTopic.content?.english && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-3.5 w-3.5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800 text-xs">English Explanation</h4>
                          </div>
                          <p className="text-blue-900 leading-relaxed text-sm whitespace-pre-line">
                            {selectedTopic.content.english}
                          </p>
                        </div>
                      )}

                      {selectedTopic.content?.german && (
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-teal-600" />
                              <h4 className="font-semibold text-teal-800 text-xs">Deutsche Erklärung</h4>
                            </div>
                            <button
                              onClick={() => speakGerman(selectedTopic.content.german)}
                              className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
                              title="Dëgjo shqiptimin"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-teal-900 leading-relaxed text-sm whitespace-pre-line">
                            {selectedTopic.content.german}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTopic.rules && selectedTopic.rules.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <ListCheck className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-base font-bold text-gray-900">Rregullat e Gramatikës</h3>
                      </div>
                      {selectedTopic.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-indigo-900 text-sm mb-2">{rule.title}</h4>
                              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                                {rule.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "numbers" && hasNumbers(selectedTopic) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🔢</span>
                    <h3 className="text-base font-bold text-gray-900">Numrat Gjermanë</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {selectedTopic.numbers.map((numberItem, index) => (
                      <div
                        key={index}
                        className={`bg-white p-2 rounded border transition-all ${
                          currentPlayingNumber === numberItem.number
                            ? "border-teal-400 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`text-base font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 ${
                              currentPlayingNumber === numberItem.number
                                ? "bg-teal-200 text-teal-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {numberItem.number}
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <p className="text-sm font-semibold text-gray-900">{numberItem.german}</p>
                            <button
                              onClick={() => speakNumber(numberItem)}
                              disabled={isPlaying}
                              className="p-1 rounded hover:bg-teal-100 text-teal-600 transition-colors disabled:opacity-50"
                              title="Dëgjo"
                            >
                              <Play className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Praktiko</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          const randomNumber =
                            selectedTopic.numbers[Math.floor(Math.random() * selectedTopic.numbers.length)]
                          speakNumber(randomNumber)
                        }}
                        disabled={isPlaying}
                        className="flex items-center justify-center gap-1.5 p-2 bg-white border border-teal-200 rounded hover:bg-teal-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />I Rastësishëm
                      </button>
                      <button
                        onClick={() => {
                          selectedTopic.numbers.slice(0, 10).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        0-9
                      </button>
                      <button
                        onClick={() => {
                          selectedTopic.numbers.slice(10, 20).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="p-2 bg-white border border-purple-200 rounded hover:bg-purple-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        10-19
                      </button>
                      <button
                        onClick={() => {
                          const twentyPlus = selectedTopic.numbers.filter((n) => n.number >= 20)
                          twentyPlus.slice(0, 10).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="p-2 bg-white border border-orange-200 rounded hover:bg-orange-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        20+
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "examples" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h3 className="text-base font-bold text-gray-900">Shembuj Praktikë</h3>
                  </div>

                  {selectedTopic.examples && selectedTopic.examples.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTopic.examples.map((example, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                              Shembulli {index + 1}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {example.english && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-semibold text-blue-700">Shqip</span>
                                </div>
                                <p className="text-blue-900 text-sm leading-relaxed">{example.english}</p>
                              </div>
                            )}

                            {example.german && (
                              <div className="bg-teal-50 p-2 rounded border border-teal-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <Globe className="h-3 w-3 text-teal-600" />
                                    <span className="text-xs font-semibold text-teal-700">Gjermanisht</span>
                                  </div>
                                  <button
                                    onClick={() => speakGerman(example.german)}
                                    className="p-1 text-teal-600 hover:bg-teal-100 rounded transition-colors"
                                    title="Dëgjo"
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-teal-900 font-semibold text-sm leading-relaxed">{example.german}</p>
                              </div>
                            )}

                            {example.explanation && (
                              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                <p className="text-gray-700 text-xs leading-relaxed italic">{example.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <Lightbulb className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Nuk ka shembuj të disponueshëm</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "exercises" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-purple-600" />
                    <h3 className="text-base font-bold text-gray-900">Ushtrime Praktike</h3>
                  </div>

                  {selectedTopic.exercises && selectedTopic.exercises.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-800 text-sm">
                            Pyetja {currentQuestionIndex + 1} / {selectedTopic.exercises.length}
                          </span>
                          <span className="text-xs text-purple-600">
                            {Object.keys(showResults).length} të përfunduara
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-1.5">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${((currentQuestionIndex + 1) / selectedTopic.exercises.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {(() => {
                        const exercise = selectedTopic.exercises[currentQuestionIndex]
                        const index = currentQuestionIndex
                        return (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                                Ushtrimi {index + 1}
                              </span>
                              {showResults[index] && (
                                <div
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    showResults[index].isCorrect
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {showResults[index].isCorrect ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {showResults[index].isCorrect ? "E saktë" : "E gabuar"}
                                </div>
                              )}
                            </div>

                            {exercise.question && (
                              <div className="mb-3 bg-gray-50 p-2.5 rounded border border-gray-200">
                                <p className="text-gray-900 font-medium text-sm leading-relaxed">{exercise.question}</p>
                              </div>
                            )}

                            {exercise.options && exercise.options.length > 0 && (
                              <div className="mb-3 space-y-2">
                                {exercise.options.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => handleAnswerSelect(index, option)}
                                    disabled={showResults[index]}
                                    className={`w-full p-2.5 text-left rounded-lg border-2 transition-all text-sm font-medium ${
                                      selectedAnswers[index] === option
                                        ? showResults[index]
                                          ? option === exercise.correctAnswer
                                            ? "bg-green-50 border-green-400 text-green-800"
                                            : "bg-red-50 border-red-400 text-red-800"
                                          : "bg-purple-50 border-purple-400 text-purple-800"
                                        : showResults[index] && option === exercise.correctAnswer
                                          ? "bg-green-50 border-green-400 text-green-800"
                                          : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                    } ${showResults[index] ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{option}</span>
                                      {showResults[index] && (
                                        <>
                                          {option === exercise.correctAnswer && (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          )}
                                          {selectedAnswers[index] === option && option !== exercise.correctAnswer && (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {showDetailedContent && showResults[index] && (
                              <div className="space-y-2 bg-gray-50 p-2 rounded border border-gray-200">
                                {exercise.english && (
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <span className="font-semibold text-blue-700 text-xs">Shqip:</span>
                                    <p className="text-blue-800 text-xs mt-0.5">{exercise.english}</p>
                                  </div>
                                )}
                                {exercise.german && (
                                  <div className="bg-teal-50 p-2 rounded border border-teal-200">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-teal-700 text-xs">Gjermanisht:</span>
                                      <button
                                        onClick={() => speakGerman(exercise.german)}
                                        className="p-1 text-teal-600 hover:bg-teal-100 rounded"
                                      >
                                        <Volume2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-teal-800 font-medium text-xs mt-0.5">{exercise.german}</p>
                                  </div>
                                )}
                                {exercise.explanation && (
                                  <div className="bg-gray-100 p-2 rounded border border-gray-200">
                                    <p className="text-gray-700 text-xs italic">{exercise.explanation}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {isAllExercisesCompleted() &&
                        currentQuestionIndex === selectedTopic.exercises.length - 1 &&
                        !isTopicFinished(selectedTopic._id) && (
                          <div className="text-center pt-4 border-t border-gray-200">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <CheckCircle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                              <h3 className="text-base font-bold text-gray-900 mb-2">
                                Të gjitha ushtrimet u përfunduan!
                              </h3>
                              <p className="text-gray-600 text-sm mb-3">
                                Kliko për të shënuar këtë temë si të përfunduar.
                              </p>
                              <button
                                onClick={handleMarkAsFinished}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                              >
                                Përfundo Temën
                              </button>
                            </div>
                          </div>
                        )}

                      {isAllExercisesCompleted() &&
                        currentQuestionIndex === selectedTopic.exercises.length - 1 &&
                        isTopicFinished(selectedTopic._id) && (
                          <div className="text-center pt-4 border-t border-gray-200">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <Award className="h-12 w-12 text-green-500 mx-auto mb-2" />
                              <h3 className="text-lg font-bold text-gray-900 mb-2">Urime! Punë e shkëlqyer!</h3>
                              <p className="text-gray-600 text-sm mb-3">
                                Keni përfunduar me sukses këtë temë. Vazhdoni me tema të tjera.
                              </p>
                              <button
                                onClick={handleBackToTopics}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                              >
                                Vazhdo me Tema të Tjera
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <Target className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Nuk ka ushtrime të disponueshme</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-teal-600" />
          Gramatika Gjermane
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Zotëroni gramatikën gjermane me mësime të strukturuara dhe ushtrime interaktive.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Filtro sipas Nivelit</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                selectedLevel === level
                  ? level === "all"
                    ? "bg-teal-600 text-white border-teal-700"
                    : `${getLevelColor(level)} border-current`
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              }`}
            >
              <div className="text-center">
                <div className="font-bold">{level === "all" ? "Të Gjitha" : level}</div>
                <div className="text-[10px] mt-0.5 opacity-75 truncate">{getLevelDescription(level)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="font-semibold text-red-800 text-sm">Gabim gjatë ngarkimit</h3>
          </div>
          <p className="text-red-700 mb-2 text-xs">{error}</p>
          <button
            onClick={fetchTopics}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
          >
            <RefreshCw className="h-3 w-3" />
            Provo Përsëri
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-60 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-200 border-t-teal-600 mb-2"></div>
          <p className="text-gray-600 text-sm">Duke ngarkuar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{renderTopicGrid}</div>
      )}

      {topics.length === 0 && !loading && !error && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <GraduationCap className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Nuk ka tema të disponueshme</h3>
          <p className="text-gray-600 text-xs mb-3">
            {selectedLevel === "all"
              ? "Temat e gramatikës do të shfaqen këtu."
              : `Nuk ka tema për nivelin ${selectedLevel}.`}
          </p>
          <button
            onClick={fetchTopics}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors text-xs font-medium mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Rifresko
          </button>
        </div>
      )}
    </div>
  )
}

const TopicCard = React.memo(({ topic, onClick, isFinished }) => (
  <div
    onClick={() => onClick(topic)}
    className={`rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
      isFinished
        ? "border-1 border-orange-300 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 shadow-md"
        : "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-teal-400 shadow-sm hover:shadow-teal-200/50"
    }`}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        {isFinished && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
            <CheckCircle className="h-3.5 w-3.5" />
            Përfunduar
          </div>
        )}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${isFinished ? "text-orange-600 ml-auto" : "ml-auto text-gray-600"}`}
        >
          <ListCheck className="h-4 w-4" />
          <span className="bg-gray-200 px-2 py-0.5 rounded">{topic.exercises?.length || 0}</span>
        </div>
      </div>

      <h3 className={`font-bold text-base mb-2 line-clamp-2 ${isFinished ? "text-orange-900" : "text-gray-900"}`}>
        {topic.name || "Temë pa titull"}
      </h3>

      {topic.description && (
        <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${isFinished ? "text-orange-700" : "text-gray-600"}`}>
          {topic.description}
        </p>
      )}

      <div
        className={`flex items-center justify-between text-xs font-medium ${isFinished ? "text-orange-600" : "text-gray-600"}`}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          <span>{topic.examples?.length || 0} shembuj</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span>{topic.exercises?.length || 0} ushtrime</span>
        </div>
      </div>
    </div>
  </div>
))

export default Grammar