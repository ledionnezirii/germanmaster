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
  ListChecks as ListCheck,
  Clock,
  Lock,
  X,
} from "lucide-react"

// Helper function to parse **text** and render in yellow
const parseHighlightedText = (text) => {
  if (!text || typeof text !== "string") return text

  // Split by **text** pattern
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Remove the ** markers and render in yellow
      const highlightedWord = part.slice(2, -2)
      return (
        <span key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold">
          {highlightedWord}
        </span>
      )
    }
    return part
  })
}

// Helper function to parse table content
const parseTableContent = (text) => {
  if (!text || typeof text !== "string") return null

  // Check if text contains table markers (pipe characters with multiple columns)
  if (!text.includes("|")) return null

  const lines = text.trim().split("\n")
  const tableRows = []

  for (const line of lines) {
    if (line.includes("|")) {
      // Skip separator lines (like |---|---|)
      if (line.replace(/[\s\-|]/g, "").length === 0) continue

      const cells = line.split("|").filter((cell) => cell.trim() !== "")
      if (cells.length > 1) {
        tableRows.push(cells.map((cell) => cell.trim()))
      }
    }
  }

  if (tableRows.length < 2) return null // Need at least header + 1 row

  return tableRows
}

const ContentWithTable = ({ content, className = "" }) => {
  if (!content || typeof content !== "string") return null

  const tableData = parseTableContent(content)

  if (tableData && tableData.length > 0) {
    const headers = tableData[0]
    const rows = tableData.slice(1)

    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-blue-100 to-teal-100">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap"
                  >
                    {parseHighlightedText(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="border border-gray-300 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700"
                    >
                      {parseHighlightedText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Return regular text with highlighting if no table
  return (
    <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line break-words">
      {parseHighlightedText(content)}
    </p>
  )
}

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

const MoreInfoModal = ({ topic, isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            <span className="break-words">{topic?.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {topic?.moreInfo ? (
            <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200">
              <ContentWithTable content={topic.moreInfo} />
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Nuk ka informacion shtesë të disponueshëm për këtë temë</p>
            </div>
          )}
          {topic?.content && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2 text-sm">Përmbajtja e plotë:</h3>
              <ContentWithTable
                content={
                  typeof topic.content === "string" ? topic.content : topic.content?.german || topic.content?.english
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
  const [dailyLimit, setDailyLimit] = useState(null)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  useEffect(() => {
    fetchTopics()
    fetchFinishedTopics()
    fetchDailyLimit()
  }, [selectedLevel])

  const fetchDailyLimit = async () => {
    try {
      const response = await grammarService.getDailyLimitStatus()
      console.log("[v0] Daily limit response:", response)

      const data = response.data || response

      console.log("[v0] Daily limit data:", data)

      setDailyLimit({
        topicsAccessedToday: data.topicsAccessedToday,
        canAccessMore: data.canAccessMore,
        remainingTopics: data.remainingTopics,
        limit: data.limit,
        accessedTopicIds: data.accessedTopicIds || [],
      })
    } catch (error) {
      console.error("[v0] Error fetching daily limit:", error)
      setDailyLimit({
        topicsAccessedToday: 0,
        canAccessMore: true,
        remainingTopics: 2,
        limit: 2,
        accessedTopicIds: [],
      })
    }
  }

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

      await fetchDailyLimit()
      await fetchFinishedTopics()

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

  const canAccessTopic = (topic) => {
    if (!dailyLimit) return true

    if (isTopicFinished(topic._id)) return true

    const topicIdString = String(topic._id)
    const accessedToday = dailyLimit.accessedTopicIds || []
    if (accessedToday.includes(topicIdString)) return true

    return dailyLimit.remainingTopics > 0
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
      console.log("[v0] Topic details response:", response)
      setSelectedTopic(response.data || response)
      setActiveTab("content")
      setSelectedAnswers({})
      setShowResults({})

      await fetchDailyLimit()
    } catch (error) {
      console.error("Error fetching topic details:", error)
      setError("Dështoi ngarkimi i detajeve të temës. Ju lutemi provoni përsëri.")
    } finally {
      setTopicLoading(false)
    }
  }

  const filteredTopics = useMemo(() => {
    const topicsArray = Array.isArray(topics) ? topics : []

    return topicsArray.sort((a, b) => {
      // Try to sort by createdAt if available
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }

      // Fallback to _id (MongoDB _id contains timestamp)
      if (a._id && b._id) {
        return a._id.localeCompare(b._id)
      }

      return 0
    })
  }, [topics])

  const handleTopicClick = useCallback(
    (topic) => {
      if (!canAccessTopic(topic)) {
        alert(`Keni arritur limitin ditor (2 tema). Provoni përsëri nesër në 00:01.`)
        return
      }
      fetchTopicDetails(topic._id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [dailyLimit, finishedTopics],
  )

  const handleBackToTopics = useCallback(() => {
    setSelectedTopic(null)
    setActiveTab("content")
    setSelectedAnswers({})
    setShowResults({})
    setShowDetailedContent(false)
    setCurrentQuestionIndex(0)

    fetchDailyLimit()
    fetchFinishedTopics()

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

  const hasExamples = (topic) => {
    return topic && topic.examples && Array.isArray(topic.examples) && topic.examples.length > 0
  }

  const hasExercises = (topic) => {
    return topic && topic.exercises && Array.isArray(topic.exercises) && topic.exercises.length > 0
  }

  const hasRules = (topic) => {
    return topic && topic.rules && Array.isArray(topic.rules) && topic.rules.length > 0
  }

  const renderTopicGrid = useMemo(() => {
    return filteredTopics.map((topic) => (
      <TopicCard
        key={topic._id}
        topic={topic}
        onClick={handleTopicClick}
        isFinished={isTopicFinished(topic._id)}
        canAccess={canAccessTopic(topic)}
      />
    ))
  }, [filteredTopics, handleTopicClick, finishedTopics, dailyLimit])

  if (selectedTopic) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <button
            onClick={handleBackToTopics}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors text-xs sm:text-sm font-medium"
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
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 break-words">{selectedTopic.name}</h1>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed break-words">
                    {parseHighlightedText(selectedTopic.description)}
                  </p>
                </div>
                {selectedTopic.moreInfo && (
                  <button
                    onClick={() => setShowMoreInfo(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 w-full sm:w-auto justify-center"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Më Shumë Info
                  </button>
                )}
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

        <MoreInfoModal topic={selectedTopic} isOpen={showMoreInfo} onClose={() => setShowMoreInfo(false)} />

        {!topicLoading && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50">
              <button
                onClick={() => {
                  setActiveTab("content")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
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
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
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
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
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
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 font-medium transition-colors whitespace-nowrap text-xs ${
                  activeTab === "exercises"
                    ? "text-purple-600 bg-white border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Ushtrime ({selectedTopic.exercises?.length || 0})
              </button>
            </div>

            <div className="p-3 sm:p-4">
              {/* PËRMBAJTJA TAB */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Shpjegimi i Gramatikës</h3>
                  </div>

                  {typeof selectedTopic.content === "string" ? (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <ContentWithTable content={selectedTopic.content} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTopic.content?.english && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-3.5 w-3.5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800 text-xs">Shqip</h4>
                          </div>
                          <ContentWithTable content={selectedTopic.content.english} />
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
                          <ContentWithTable content={selectedTopic.content.german} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* RULES SECTION */}
                  {hasRules(selectedTopic) && (
                    <div className="space-y-3 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <ListCheck className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">Rregullat e Gramatikës</h3>
                      </div>

                      {selectedTopic.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-indigo-900 text-xs sm:text-sm mb-2 break-words">
                                {rule.title}
                              </h4>
                              <div className="text-gray-800 text-xs sm:text-sm leading-relaxed break-words">
                                <ContentWithTable content={rule.description} />
                              </div>
                              {rule.example && (
                                <div className="mt-2 p-2 bg-white rounded border border-indigo-100">
                                  <span className="text-xs font-semibold text-indigo-600">Shembull: </span>
                                  <span className="text-xs sm:text-sm text-gray-700">
                                    {parseHighlightedText(rule.example)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NUMBERS TAB */}
              {activeTab === "numbers" && hasNumbers(selectedTopic) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🔢</span>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Numrat Gjermanë</h3>
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
                            className={`text-sm sm:text-base font-bold w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 ${
                              currentPlayingNumber === numberItem.number
                                ? "bg-teal-200 text-teal-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {numberItem.number}
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                              {numberItem.german}
                            </p>
                            <button
                              onClick={() => speakNumber(numberItem)}
                              disabled={isPlaying}
                              className="p-1 rounded hover:bg-teal-100 text-teal-600 transition-colors disabled:opacity-50 flex-shrink-0"
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
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Praktiko</h4>
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

              {/* EXAMPLES TAB */}
              {activeTab === "examples" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Shembuj Praktikë</h3>
                  </div>

                  {hasExamples(selectedTopic) ? (
                    <div className="space-y-3">
                      {selectedTopic.examples.map((example, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                              {example.type || `Shembulli ${index + 1}`}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Show type as category if exists */}
                            {example.type && !example.english && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-semibold text-blue-700">Tipi</span>
                                </div>
                                <p className="text-blue-900 text-xs sm:text-sm leading-relaxed break-words">
                                  {parseHighlightedText(example.type)}
                                </p>
                              </div>
                            )}

                            {/* Show english/albanian text */}
                            {example.english && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-semibold text-blue-700">Shqip</span>
                                </div>
                                <p className="text-blue-900 text-xs sm:text-sm leading-relaxed break-words">
                                  {parseHighlightedText(example.english)}
                                </p>
                              </div>
                            )}

                            {/* German text */}
                            {example.german && (
                              <div className="bg-teal-50 p-2 rounded border border-teal-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <Globe className="h-3 w-3 text-teal-600" />
                                    <span className="text-xs font-semibold text-teal-700">Gjermanisht</span>
                                  </div>
                                  <button
                                    onClick={() => speakGerman(example.german)}
                                    className="p-1 text-teal-600 hover:bg-teal-100 rounded transition-colors flex-shrink-0"
                                    title="Dëgjo"
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-teal-900 font-semibold text-xs sm:text-sm leading-relaxed break-words">
                                  {parseHighlightedText(example.german)}
                                </p>
                              </div>
                            )}

                            {/* Explanation or Analysis */}
                            {(example.explanation || example.analysis) && (
                              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Lightbulb className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs font-semibold text-gray-600">Analiza</span>
                                </div>
                                <p className="text-gray-700 text-xs leading-relaxed break-words">
                                  {parseHighlightedText(example.explanation || example.analysis)}
                                </p>
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

              {/* EXERCISES TAB */}
              {activeTab === "exercises" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Ushtrime Praktike</h3>
                  </div>

                  {hasExercises(selectedTopic) ? (
                    <div className="space-y-3">
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-800 text-xs sm:text-sm">
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
                                <p className="text-gray-900 font-medium text-xs sm:text-sm leading-relaxed break-words">
                                  {parseHighlightedText(exercise.question)}
                                </p>
                              </div>
                            )}

                            {exercise.options && exercise.options.length > 0 && (
                              <div className="mb-3 space-y-2">
                                {exercise.options.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => handleAnswerSelect(index, option)}
                                    disabled={showResults[index]}
                                    className={`w-full p-2.5 text-left rounded-lg border-2 transition-all text-xs sm:text-sm font-medium ${
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
                                      <span className="break-words flex-1">{parseHighlightedText(option)}</span>
                                      {showResults[index] && (
                                        <>
                                          {option === exercise.correctAnswer && (
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                                          )}
                                          {selectedAnswers[index] === option && option !== exercise.correctAnswer && (
                                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 ml-2" />
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
                                    <p className="text-blue-800 text-xs mt-0.5 break-words">
                                      {parseHighlightedText(exercise.english)}
                                    </p>
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
                                    <p className="text-teal-800 font-medium text-xs mt-0.5 break-words">
                                      {parseHighlightedText(exercise.german)}
                                    </p>
                                  </div>
                                )}

                                {exercise.explanation && (
                                  <div className="bg-gray-100 p-2 rounded border border-gray-200">
                                    <p className="text-gray-700 text-xs italic break-words">
                                      {parseHighlightedText(exercise.explanation)}
                                    </p>
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
                              <CheckCircle className="h-8 sm:h-10 w-8 sm:w-10 text-orange-500 mx-auto mb-2" />
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                                Të gjitha ushtrimet u përfunduan!
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm mb-3">
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
                              <Award className="h-10 sm:h-12 w-10 sm:w-12 text-green-500 mx-auto mb-2" />
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                                Urime! Punë e shkëlqyer!
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm mb-3">
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
    <div className="max-w-7xl mx-auto space-y-4 p-4">
      {dailyLimit && (
        <div
          className={`rounded-lg p-3 sm:p-4 border ${
            dailyLimit.remainingTopics > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {dailyLimit.remainingTopics > 0 ? (
              <>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-green-900 text-sm sm:text-base break-words">
                    {dailyLimit.remainingTopics} nga 2 tema të disponueshme sot
                  </p>
                  <p className="text-xs sm:text-sm text-green-700">
                    Përdorni pjesën tjetër ose provoni deri nesër në 00:01
                  </p>
                </div>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-red-900 text-sm sm:text-base">Keni arritur limitin ditor</p>
                  <p className="text-xs sm:text-sm text-red-700">Provoni përsëri nesër në 00:01</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-teal-600 flex-shrink-0" />
          <span>Gramatika Gjermane</span>
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
          Zotëroni gramatikën gjermane me mësime të strukturuara dhe ushtrime interaktive.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <h2 className="text-xs sm:text-sm font-semibold text-gray-900">Filtro sipas Nivelit</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {renderTopicGrid}
        </div>
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

const TopicCard = React.memo(({ topic, onClick, isFinished, canAccess }) => (
  <div
    onClick={() => onClick(topic)}
    className={`rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all ${
      !canAccess ? "cursor-not-allowed opacity-60" : "cursor-pointer"
    } relative overflow-hidden group ${
      isFinished
        ? "bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 shadow-md"
        : canAccess
          ? "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-teal-400 shadow-sm hover:shadow-teal-200/50"
          : "bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-300 shadow-sm"
    }`}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3 gap-2">
        {isFinished && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Përfunduar</span>
          </div>
        )}
        {!canAccess && !isFinished && (
          <div className="flex items-center gap-1 bg-red-500 text-white px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold shadow-md ml-auto">
            <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">E Bllokuar</span>
          </div>
        )}
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            !canAccess ? "text-gray-500" : isFinished ? "text-orange-600 ml-auto" : "ml-auto text-gray-600"
          }`}
        >
          <ListCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className={`px-2 py-0.5 rounded ${!canAccess ? "bg-gray-300" : "bg-gray-200"}`}>
            {topic.exercises?.length || 0}
          </span>
        </div>
      </div>

      <h3
        className={`font-bold text-sm sm:text-base mb-2 line-clamp-2 break-words ${
          !canAccess ? "text-gray-600" : isFinished ? "text-orange-900" : "text-gray-900"
        }`}
      >
        {topic.name || "Temë pa titull"}
      </h3>

      {topic.description && (
        <p
          className={`text-xs mb-3 line-clamp-2 leading-relaxed break-words ${
            !canAccess ? "text-gray-500" : isFinished ? "text-orange-700" : "text-gray-600"
          }`}
        >
          {topic.description}
        </p>
      )}

      <div
        className={`flex items-center justify-between text-xs font-medium gap-2 ${
          !canAccess ? "text-gray-500" : isFinished ? "text-orange-600" : "text-gray-600"
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{topic.examples?.length || 0} shembuj</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Target className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{topic.exercises?.length || 0} ushtrime</span>
        </div>
      </div>
    </div>
  </div>
))

export default Grammar
