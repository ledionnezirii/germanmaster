"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import React from "react"

import { grammarService, authService } from "../services/api"
import {
  GraduationCap,
  BookOpen,
  Filter,
  Star,
  Tag,
  Target,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Globe,
  Lightbulb,
  Volume2,
  RefreshCw,
  AlertCircle,
  Headphones,
  Play,
  RotateCcw,
  Award,
  Brain,
  Clock,
  MessageCircle,
  Users,
  Hash,
} from "lucide-react"

const getLevelColor = (level) => {
  switch (level) {
    case "A1":
      return "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 shadow-emerald-100"
    case "A2":
      return "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border-teal-300 shadow-teal-100"
    case "B1":
      return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-blue-100"
    case "B2":
      return "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-300 shadow-indigo-100"
    case "C1":
      return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300 shadow-purple-100"
    case "C2":
      return "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-300 shadow-pink-100"
    default:
      return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-gray-100"
  }
}

const getLevelDescription = (level) => {
  switch (level) {
    case "A1":
      return "Fillestar - Bazat e gjuhës"
    case "A2":
      return "Fillestar i avancuar - Komunikim i thjeshtë"
    case "B1":
      return "I mesëm - Komunikim i pavarur"
    case "B2":
      return "I mesëm i avancuar - Komunikim i lirë"
    case "C1":
      return "I avancuar - Komunikim efikas"
    case "C2":
      return "Mjeshtëri - Komunikim i përsosur"
    default:
      return "Të gjitha nivelet"
  }
}

const getDifficultyStars = (difficulty) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 transition-all ${
        i < difficulty ? "text-amber-500 fill-amber-400 drop-shadow-sm" : "text-gray-300"
      }`}
    />
  ))
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

  useEffect(() => {
    fetchTopics()
    fetchFinishedTopics()
  }, [selectedLevel])

  const fetchFinishedTopics = async () => {
    try {
      const response = await authService.getProfile()
      setFinishedTopics(response.data?.grammarFinished || [])
    } catch (error) {
      console.error("Error fetching finished topics:", error)
    }
  }

  const handleMarkAsFinished = async () => {
    if (!selectedTopic) return

    try {
      await grammarService.markTopicAsFinished(selectedTopic._id)
      setFinishedTopics([...finishedTopics, selectedTopic._id])
      alert("Urime! Keni përfunduar këtë temë të gramatikës!")
    } catch (error) {
      console.error("Error marking topic as finished:", error)
      alert("Dështoi shënimi i temës si e përfunduar. Ju lutemi provoni përsëri.")
    }
  }

  const isTopicFinished = (topicId) => {
    return finishedTopics.includes(topicId)
  }

  const fetchTopics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response =
        selectedLevel === "all"
          ? await grammarService.getAllTopics()
          : await grammarService.getTopicsByLevel(selectedLevel)

      // Handle different response structures
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

  const levelStats = useMemo(() => {
    return filteredTopics.reduce((acc, topic) => {
      const level = topic.level || "unknown"
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {})
  }, [filteredTopics])

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
    const allCompleted = selectedTopic.exercises.every((_, index) => showResults[index])
    console.log("[v0] Total exercises:", selectedTopic.exercises.length)
    console.log("[v0] Completed exercises:", Object.keys(showResults).length)
    console.log("[v0] All exercises completed:", allCompleted)
    console.log("[v0] Is topic finished:", isTopicFinished(selectedTopic._id))
    return allCompleted
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

  // If a topic is selected, show the detailed view
  if (selectedTopic) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 rounded-xl shadow-md border border-blue-200/50 p-6 backdrop-blur-sm">
          <button
            onClick={handleBackToTopics}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-700 mb-6 transition-all group bg-white/80 px-3 py-2 rounded-full shadow-sm hover:shadow-md text-sm"
            aria-label="Kthehu te lista e temave"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Kthehu te Lista e Temave</span>
          </button>

          {topicLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
              <span className="ml-4 text-gray-700 text-lg font-medium">Duke ngarkuar detajet e temës...</span>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1 text-balance leading-tight">
                        {selectedTopic.name}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Gramatikë Gjermane
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600 font-medium text-sm">Mësim Interaktiv</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed text-pretty bg-white/60 p-4 rounded-lg border border-gray-200/50">
                    {selectedTopic.description}
                  </p>
                </div>
              </div>

              {selectedTopic.tags && selectedTopic.tags.length > 0 && (
                <div className="bg-white/60 p-4 rounded-lg border border-gray-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-700 text-sm">Tema kryesore:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 text-xs font-medium rounded-full border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:shadow-sm transition-all cursor-default"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!topicLoading && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
              <button
                onClick={() => {
                  setActiveTab("content")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative text-sm ${
                  activeTab === "content"
                    ? "text-blue-700 bg-white border-b-2 border-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                }`}
                aria-label="Shiko përmbajtjen e mësimit"
              >
                <BookOpen className="h-4 w-4" />
                <div className="text-left">
                  <div>Përmbajtja e Mësimit</div>
                  <div className="text-xs opacity-75">Teoria dhe shpjegimi</div>
                </div>
              </button>

              {hasNumbers(selectedTopic) && (
                <button
                  onClick={() => {
                    setActiveTab("numbers")
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative text-sm ${
                    activeTab === "numbers"
                      ? "text-teal-700 bg-white border-b-2 border-teal-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                  }`}
                  aria-label={`Mëso numrat (${selectedTopic.numbers?.length || 0})`}
                >
                  <span className="text-lg font-bold">🔢</span>
                  <div className="text-left">
                    <div>Numrat Gjermanë</div>
                    <div className="text-xs opacity-75">{selectedTopic.numbers?.length || 0} numra</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab("examples")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative text-sm ${
                  activeTab === "examples"
                    ? "text-amber-700 bg-white border-b-2 border-amber-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                }`}
                aria-label={`Shiko shembujt (${selectedTopic.examples?.length || 0})`}
              >
                <Lightbulb className="h-4 w-4" />
                <div className="text-left">
                  <div>Shembuj Praktikë</div>
                  <div className="text-xs opacity-75">{selectedTopic.examples?.length || 0} shembuj</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("exercises")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative text-sm ${
                  activeTab === "exercises"
                    ? "text-purple-700 bg-white border-b-2 border-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                }`}
                aria-label={`Fillo ushtrimet (${selectedTopic.exercises?.length || 0})`}
              >
                <Target className="h-4 w-4" />
                <div className="text-left">
                  <div>Ushtrime Praktike</div>
                  <div className="text-xs opacity-75">{selectedTopic.exercises?.length || 0} ushtrime</div>
                </div>
              </button>
            </div>

            <div className="p-6">
              {activeTab === "content" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-md">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Shpjegimi i Gramatikës</h3>
                      <p className="text-gray-600 text-sm">Teoria dhe rregullat kryesore</p>
                    </div>
                  </div>

                  {typeof selectedTopic.content === "string" ? (
                    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 rounded-xl border-2 border-blue-200/50 shadow-md">
                      <div className="prose prose-blue max-w-none">
                        <div className="bg-blue-100 p-2 rounded-lg w-fit mb-4">
                          <MessageCircle className="h-4 w-4 text-blue-600 inline mr-2" />
                          <span className="font-bold text-blue-800 text-sm">Shpjegimi kryesor:</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed text-base whitespace-pre-line font-medium">
                          {selectedTopic.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedTopic.content?.english && (
                        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 rounded-xl border-2 border-blue-300/50 shadow-md">
                          <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-3 text-lg">
                            <div className="bg-blue-200 p-2 rounded-lg">
                              <Globe className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <div>Shpjegimi në Gjuhën Angleze</div>
                              <div className="text-xs font-normal text-blue-600 mt-1">English Explanation</div>
                            </div>
                          </h4>
                          <div className="prose prose-blue max-w-none">
                            <p className="text-blue-800 leading-relaxed text-base whitespace-pre-line font-medium bg-white/60 p-4 rounded-lg">
                              {selectedTopic.content.english}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedTopic.content?.german && (
                        <div className="bg-gradient-to-br from-teal-50 via-white to-teal-100 p-6 rounded-xl border-2 border-teal-300/50 shadow-md">
                          <h4 className="font-bold text-teal-800 mb-4 flex items-center gap-3 text-lg">
                            <div className="bg-teal-200 p-2 rounded-lg">
                              <Globe className="h-4 w-4 text-teal-700" />
                            </div>
                            <div className="flex-1">
                              <div>Shpjegimi në Gjuhën Gjermane</div>
                              <div className="text-xs font-normal text-teal-600 mt-1">Deutsche Erklärung</div>
                            </div>
                            <button
                              onClick={() => speakGerman(selectedTopic.content.german)}
                              className="p-3 text-teal-600 hover:text-teal-800 hover:bg-teal-200 rounded-xl transition-all shadow-sm hover:shadow-md bg-white/80"
                              title="Dëgjo shqiptimin gjerman"
                              aria-label="Dëgjo shqiptimin gjerman"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </h4>
                          <div className="prose prose-teal max-w-none">
                            <p className="text-teal-800 leading-relaxed text-base whitespace-pre-line font-medium bg-white/60 p-4 rounded-lg">
                              {selectedTopic.content.german}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "numbers" && hasNumbers(selectedTopic) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-gradient-to-br from-teal-100 to-blue-100 p-2 rounded-lg">
                      <span className="text-lg font-bold text-teal-600">🔢</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Numrat Gjermanë</h3>
                      <p className="text-gray-600 text-sm">Mëso dhe praktiko numrat gjermanë me shqiptim të saktë</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Headphones className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1 text-sm">Këshillë për Mësim</h4>
                        <p className="text-blue-700 text-xs leading-relaxed">
                          Kliko butonin e zërit për të dëgjuar shqiptimin e saktë të çdo numri në gjermanisht. Përsërite
                          disa herë për të përmirësuar shqiptimin tuaj.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedTopic.numbers.map((numberItem, index) => (
                      <div
                        key={index}
                        className={`bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border-2 transition-all hover:shadow-md hover:scale-105 ${
                          currentPlayingNumber === numberItem.number
                            ? "border-teal-300 bg-gradient-to-br from-teal-50 to-teal-100 shadow-md scale-105"
                            : "border-gray-200 hover:border-teal-200"
                        }`}
                      >
                        <div className="text-center">
                          {/* Enhanced number display */}
                          <div
                            className={`text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${
                              currentPlayingNumber === numberItem.number
                                ? "bg-teal-200 text-teal-800 animate-pulse"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {numberItem.number}
                          </div>

                          {/* German word with enhanced pronunciation button */}
                          <div className="mb-3">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Gjermanisht:
                              </span>
                              <button
                                onClick={() => speakNumber(numberItem)}
                                disabled={isPlaying}
                                className={`p-2 rounded-full transition-all shadow-sm ${
                                  currentPlayingNumber === numberItem.number
                                    ? "bg-teal-200 text-teal-800 animate-pulse"
                                    : "text-teal-600 hover:text-teal-800 hover:bg-teal-100"
                                } ${isPlaying ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:shadow-md"}`}
                                title={`Dëgjo shqiptimin e numrit ${numberItem.number}`}
                                aria-label={`Dëgjo shqiptimin e numrit ${numberItem.number}`}
                              >
                                {currentPlayingNumber === numberItem.number ? (
                                  <Volume2 className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-lg font-bold text-gray-900 mb-1">{numberItem.german}</p>
                          </div>

                          {/* Albanian number name if available */}
                          {numberItem.albanian && (
                            <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded-lg">
                              <span className="font-semibold">Shqip:</span> {numberItem.albanian}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced practice section */}
                  <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 p-6 rounded-lg border border-teal-200 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="bg-teal-100 p-2 rounded-lg">
                        <Target className="h-5 w-5 text-teal-600" />
                      </div>
                      Praktiko Numrat
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <button
                        onClick={() => {
                          const randomNumber =
                            selectedTopic.numbers[Math.floor(Math.random() * selectedTopic.numbers.length)]
                          speakNumber(randomNumber)
                        }}
                        disabled={isPlaying}
                        className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-teal-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label="Dëgjo një numër të rastësishëm"
                      >
                        <RotateCcw className="h-4 w-4 text-teal-600" />
                        <span className="font-medium">Numër i Rastësishëm</span>
                      </button>

                      <button
                        onClick={() => {
                          selectedTopic.numbers.slice(0, 10).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label="Dëgjo numrat 0-9"
                      >
                        <span className="text-xl">🔊</span>
                        <span className="font-medium">0-9</span>
                      </button>

                      <button
                        onClick={() => {
                          selectedTopic.numbers.slice(10, 20).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label="Dëgjo numrat 10-19"
                      >
                        <span className="text-xl">🔊</span>
                        <span className="font-medium">10-19</span>
                      </button>

                      <button
                        onClick={() => {
                          const twentyPlus = selectedTopic.numbers.filter((n) => n.number >= 20)
                          twentyPlus.slice(0, 10).forEach((numberItem, index) => {
                            setTimeout(() => speakNumber(numberItem), index * 2000)
                          })
                        }}
                        disabled={isPlaying}
                        className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label="Dëgjo numrat 20+"
                      >
                        <span className="text-xl">🔊</span>
                        <span className="font-medium">20+</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "examples" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl shadow-md">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Shembuj Praktikë</h3>
                      <p className="text-gray-600 text-sm">Shembuj të detajuar për të kuptuar përdorimin praktik</p>
                    </div>
                  </div>

                  {selectedTopic.examples && selectedTopic.examples.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTopic.examples.map((example, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 p-6 rounded-xl border-2 border-amber-200/50 shadow-md hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-base shadow-md">
                              Shembulli {index + 1}
                            </div>
                            <div className="flex items-center gap-2 text-amber-700">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-medium">Shiko me kujdes</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {example.english && (
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 shadow-md">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-blue-200 p-2 rounded-lg">
                                    <Globe className="h-4 w-4 text-blue-700" />
                                  </div>
                                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Shqip</span>
                                </div>
                                <p className="text-blue-900 text-base leading-relaxed font-medium bg-white/60 p-4 rounded-lg">
                                  {example.english}
                                </p>
                              </div>
                            )}

                            {example.german && (
                              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border-2 border-teal-200 shadow-md">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-teal-200 p-2 rounded-lg">
                                      <Globe className="h-4 w-4 text-teal-700" />
                                    </div>
                                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                                      Gjermanisht
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => speakGerman(example.german)}
                                    className="p-3 text-teal-600 hover:text-teal-800 hover:bg-teal-200 rounded-xl transition-all shadow-sm hover:shadow-md bg-white/80"
                                    title="Dëgjo shqiptimin gjerman"
                                    aria-label="Dëgjo shqiptimin gjerman"
                                  >
                                    <Volume2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <p className="text-teal-900 font-bold text-base leading-relaxed bg-white/60 p-4 rounded-lg">
                                  {example.german}
                                </p>
                              </div>
                            )}
                          </div>

                          {example.explanation && (
                            <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border-2 border-gray-200 shadow-md">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-gray-200 p-2 rounded-lg">
                                  <Brain className="h-4 w-4 text-gray-700" />
                                </div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                  Shpjegimi i detajuar:
                                </span>
                              </div>
                              <p className="text-gray-800 italic leading-relaxed text-base bg-white/60 p-4 rounded-lg font-medium">
                                {example.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                      <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Nuk ka shembuj të disponueshëm</h4>
                      <p className="text-gray-600 max-w-md mx-auto text-sm">
                        Shembujt për këtë temë do të shtohen së shpejti.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Exercises Tab */}
              {activeTab === "exercises" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl shadow-md">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Ushtrime Praktike</h3>
                      <p className="text-gray-600 text-sm">Testo njohuritë tuaja me ushtrime interaktive</p>
                    </div>
                  </div>

                  {selectedTopic.exercises && selectedTopic.exercises.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTopic.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 p-6 rounded-xl border-2 border-purple-200/50 shadow-md hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-base shadow-md">
                                Ushtrimi {index + 1}
                              </div>
                            </div>
                            {showResults[index] && (
                              <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-md ${
                                  showResults[index].isCorrect
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                {showResults[index].isCorrect ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                {showResults[index].isCorrect ? "E saktë!" : "E gabuar"}
                              </div>
                            )}
                          </div>

                          {exercise.question && (
                            <div className="mb-6 bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border-2 border-gray-200 shadow-md">
                              <p className="text-gray-900 font-semibold text-base leading-relaxed">
                                {exercise.question}
                              </p>
                            </div>
                          )}

                          {exercise.options && exercise.options.length > 0 && (
                            <div className="mb-6">
                              <div className="grid grid-cols-1 gap-4">
                                {exercise.options.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => handleAnswerSelect(index, option)}
                                    disabled={showResults[index]}
                                    className={`p-4 text-left rounded-xl border-3 transition-all text-base font-medium shadow-sm hover:shadow-lg ${
                                      selectedAnswers[index] === option
                                        ? showResults[index]
                                          ? option === exercise.correctAnswer
                                            ? "bg-green-50 border-green-300 text-green-800 shadow-lg"
                                            : "bg-red-50 border-red-300 text-red-800 shadow-lg"
                                          : "bg-purple-50 border-purple-300 text-purple-800 shadow-lg"
                                        : showResults[index] && option === exercise.correctAnswer
                                          ? "bg-green-50 border-green-300 text-green-800 shadow-lg"
                                          : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                    } ${showResults[index] ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
                                    aria-label={`Zgjidh përgjigjen: ${option}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{option}</span>
                                      {showResults[index] && (
                                        <>
                                          {option === exercise.correctAnswer && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          )}
                                          {selectedAnswers[index] === option && option !== exercise.correctAnswer && (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {showDetailedContent && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border-2 border-gray-200 shadow-md">
                              {exercise.english && (
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border-2 border-blue-200 shadow-md">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-blue-200 p-2 rounded-lg">
                                      <Globe className="h-4 w-4 text-blue-700" />
                                    </div>
                                    <span className="font-bold text-blue-700 text-xs uppercase tracking-wide">
                                      Në Shqip:
                                    </span>
                                  </div>
                                  <p className="text-blue-800 leading-relaxed font-medium text-sm">
                                    {exercise.english}
                                  </p>
                                </div>
                              )}
                              {exercise.german && (
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-xl border-2 border-teal-200 shadow-md">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-teal-200 p-2 rounded-lg">
                                        <Globe className="h-4 w-4 text-teal-700" />
                                      </div>
                                      <span className="font-bold text-teal-700 text-xs uppercase tracking-wide">
                                        Në Gjermanisht:
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => speakGerman(exercise.german)}
                                      className="p-3 text-teal-600 hover:text-teal-800 hover:bg-teal-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                                      title="Dëgjo shqiptimin gjerman"
                                      aria-label="Dëgjo shqiptimin gjerman"
                                    >
                                      <Volume2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <p className="text-teal-800 font-medium leading-relaxed text-sm">{exercise.german}</p>
                                </div>
                              )}
                              {exercise.explanation && (
                                <div className="bg-gradient-to-br from-gray-100 to-slate-100 p-3 rounded-xl border-2 border-gray-200 shadow-md">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-gray-200 p-2 rounded-lg">
                                      <Brain className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <span className="font-bold text-gray-700 text-xs uppercase tracking-wide">
                                      Shpjegimi:
                                    </span>
                                  </div>
                                  <p className="text-gray-700 italic leading-relaxed font-medium text-sm">
                                    {exercise.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isAllExercisesCompleted() && !isTopicFinished(selectedTopic._id) && (
                        <div className="text-center pt-6 border-t-2 border-gray-200">
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200 shadow-xl">
                            <CheckCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Të gjitha ushtrimet u përfunduan!</h3>
                            <p className="text-gray-600 text-base mb-6 max-w-2xl mx-auto leading-relaxed">
                              Keni përfunduar me sukses të gjitha ushtrimet. Kliko butonin më poshtë për të shënuar këtë
                              temë si të përfunduar.
                            </p>
                            <button
                              onClick={handleMarkAsFinished}
                              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl hover:from-orange-700 hover:to-amber-700 transition-all font-bold shadow-lg hover:shadow-xl text-base"
                              aria-label="Shëno si të përfunduar"
                            >
                              Përfundo Temën
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Enhanced completion message */}
                      {isAllExercisesCompleted() && isTopicFinished(selectedTopic._id) && (
                        <div className="text-center pt-12 border-t-2 border-gray-200">
                          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl border-2 border-green-200 shadow-xl">
                            <Award className="h-20 w-20 text-green-500 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Urime! Punë e shkëlqyer!</h3>
                            <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto leading-relaxed">
                              Keni përfunduar me sukses të gjitha ushtrimet për këtë temë të gramatikës. Vazhdoni me
                              tema të tjera për të përmirësuar njohuritë tuaja.
                            </p>
                            <button
                              onClick={handleBackToTopics}
                              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl hover:from-teal-700 hover:to-blue-700 transition-all font-bold shadow-lg hover:shadow-xl text-base"
                              aria-label="Kthehu te lista e temave"
                            >
                              Vazhdo me Tema të Tjera
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border-2 border-gray-200">
                      <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Nuk ka ushtrime të disponueshme</h4>
                      <p className="text-gray-600 max-w-md mx-auto text-sm">
                        Ushtrimet për këtë temë do të shtohen së shpejti.
                      </p>
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div className="bg-teal-100 p-3 rounded-full">
            <GraduationCap className="h-8 w-8 text-teal-600" />
          </div>
          Gramatika Gjermane
        </h1>
        <p className="text-gray-700 text-lg leading-relaxed">
          Zotëroni gramatikën gjermane me mësime të strukturuara, shembuj praktikë dhe ushtrime interaktive. Përparoni
          nga niveli fillestar deri në mjeshtëri të plotë.
        </p>
      </div>

      {/* Level Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Filtro sipas Nivelit të Gjuhës</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`p-3 rounded-lg text-xs font-medium transition-all border-2 ${
                selectedLevel === level
                  ? level === "all"
                    ? "bg-teal-600 text-white border-teal-700 shadow-md"
                    : `${getLevelColor(level)} shadow-md`
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300"
              }`}
              aria-label={`Filtro sipas nivelit ${level === "all" ? "Të gjitha nivelet" : level}`}
            >
              <div className="text-center">
                <div className="font-bold text-base">{level === "all" ? "Të Gjitha" : level}</div>
                <div className="text-xs mt-1 opacity-75">{getLevelDescription(level)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800 text-base">Gabim gjatë ngarkimit</h3>
          </div>
          <p className="text-red-700 mb-3 text-sm">{error}</p>
          <button
            onClick={fetchTopics}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            aria-label="Provo përsëri"
          >
            <RefreshCw className="h-4 w-4" />
            Provo Përsëri
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-80 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3"></div>
          <p className="text-gray-600 text-base">Duke ngarkuar temat e gramatikës...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{renderTopicGrid}</div>
      )}

      {topics.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nuk ka tema të disponueshme</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto text-sm">
            {selectedLevel === "all"
              ? "Temat e gramatikës gjermane do të shfaqen këtu kur të shtohen në sistem."
              : `Aktualisht nuk ka tema të disponueshme për nivelin ${selectedLevel}. Provoni një nivel tjetër ose kontrolloni përsëri më vonë.`}
          </p>
          <button
            onClick={fetchTopics}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium mx-auto text-sm"
            aria-label="Rifresko listën e temave"
          >
            <RefreshCw className="h-4 w-4" />
            Rifresko Listën
          </button>
        </div>
      )}
    </div>
  )
}

const TopicCard = React.memo(({ topic, onClick, isFinished }) => (
  <div
    onClick={() => onClick(topic)}
    className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all cursor-pointer hover:scale-105 ${
      isFinished
        ? "border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50"
        : "border border-gray-200 hover:border-teal-200"
    }`}
    aria-label={`Mëso për temën: ${topic.name || "Temë pa titull"}`}
  >
    <div className="flex items-center justify-between mb-3">
      {isFinished && (
        <div className="flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <CheckCircle className="h-3 w-3" />
          <span>Përfunduar</span>
        </div>
      )}
      <div className={`flex items-center gap-1 text-gray-500 ${isFinished ? "" : "ml-auto"}`}>
        <BookOpen className="h-4 w-4" />
        <span className="text-xs">{topic.exercises?.length || 0} ushtr.</span>
      </div>
    </div>

    <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">{topic.name || "Temë pa titull"}</h3>

    {topic.description && <p className="text-gray-600 text-xs mb-3 line-clamp-2">{topic.description}</p>}

    <div className="flex items-center justify-between text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        <span>{topic.examples?.length || 0} shembuj</span>
      </div>
      <div className="flex items-center gap-1">
        <Hash className="h-3 w-3" />
        <span>ID: {topic._id?.slice(-4) || "N/A"}</span>
      </div>
    </div>
  </div>
))

export default Grammar
