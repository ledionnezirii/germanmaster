"use client"

import { useState, useEffect } from "react"
import { grammarService } from "../services/api"
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
} from "lucide-react"

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

  useEffect(() => {
    fetchTopics()
  }, [selectedLevel])

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
      setError(error.message)
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
      setError("Failed to load topic details")
    } finally {
      setTopicLoading(false)
    }
  }

  const handleTopicClick = (topic) => {
    fetchTopicDetails(topic._id)
  }

  const handleBackToTopics = () => {
    setSelectedTopic(null)
    setActiveTab("content")
    setSelectedAnswers({})
    setShowResults({})
  }

  const handleAnswerSelect = (exerciseIndex, answer) => {
    const exercise = selectedTopic.exercises[exerciseIndex]
    const isCorrect = answer === exercise.correctAnswer

    setSelectedAnswers({
      ...selectedAnswers,
      [exerciseIndex]: answer,
    })

    // Immediately show result
    setShowResults({
      ...showResults,
      [exerciseIndex]: {
        isCorrect,
        userAnswer: answer,
        correctAnswer: exercise.correctAnswer,
      },
    })
  }

  const speakGerman = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "de-DE" // German language
      utterance.rate = 0.8 // Slightly slower for learning
      utterance.pitch = 1
      utterance.volume = 1

      window.speechSynthesis.speak(utterance)
    } else {
      alert("Speech synthesis not supported in your browser")
    }
  }

  const isAllExercisesCompleted = () => {
    if (!selectedTopic?.exercises) return false
    return selectedTopic.exercises.every((_, index) => showResults[index])
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  const getLevelColor = (level) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-orange-100 text-orange-800",
      C1: "bg-red-100 text-red-800",
      C2: "bg-purple-100 text-purple-800",
    }
    return colors[level] || "bg-gray-100 text-gray-800"
  }

  const getDifficultyStars = (difficulty) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < difficulty ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  // If a topic is selected, show the detailed view
  if (selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Topic Detail Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button
            onClick={handleBackToTopics}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Grammar Topics
          </button>

          {topicLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTopic.name}</h1>
                  <p className="text-gray-600">{selectedTopic.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTopic.difficulty && (
                    <div className="flex items-center gap-1">{getDifficultyStars(selectedTopic.difficulty)}</div>
                  )}
                  {selectedTopic.level && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(selectedTopic.level)}`}
                    >
                      {selectedTopic.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedTopic.tags && selectedTopic.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTopic.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        {!topicLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("content")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "content"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Content
              </button>
              <button
                onClick={() => setActiveTab("examples")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "examples"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                Examples ({selectedTopic.examples?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("exercises")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "exercises"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Target className="h-4 w-4" />
                Exercises ({selectedTopic.exercises?.length || 0})
              </button>
            </div>

            <div className="p-6">
              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Grammar Explanation</h3>
                  {typeof selectedTopic.content === "string" ? (
                    <p className="text-gray-700 leading-relaxed">{selectedTopic.content}</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedTopic.content?.english && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            English Explanation
                          </h4>
                          <p className="text-blue-700">{selectedTopic.content.english}</p>
                        </div>
                      )}
                      {selectedTopic.content?.german && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            German Explanation
                            <button
                              onClick={() => speakGerman(selectedTopic.content.german)}
                              className="ml-2 p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                              title="Listen to pronunciation"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </h4>
                          <p className="text-green-700">{selectedTopic.content.german}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Examples Tab */}
              {activeTab === "examples" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Examples</h3>
                  {selectedTopic.examples && selectedTopic.examples.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTopic.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          {example.english && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-blue-600 uppercase">English:</span>
                              <p className="text-gray-800 mt-1">{example.english}</p>
                            </div>
                          )}
                          {example.german && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-green-600 uppercase">German:</span>
                                <button
                                  onClick={() => speakGerman(example.german)}
                                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                  title="Listen to pronunciation"
                                >
                                  <Volume2 className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-gray-800 font-medium">{example.german}</p>
                            </div>
                          )}
                          {example.explanation && (
                            <div>
                              <span className="text-sm font-medium text-gray-500 uppercase">Explanation:</span>
                              <p className="text-gray-600 italic mt-1">{example.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No examples available for this topic.</p>
                  )}
                </div>
              )}

              {/* Exercises Tab */}
              {activeTab === "exercises" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Practice Exercises</h3>
                  {selectedTopic.exercises && selectedTopic.exercises.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTopic.exercises.map((exercise, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-teal-600" />
                            <h4 className="font-semibold text-gray-900">Exercise {index + 1}</h4>
                          </div>

                          {exercise.question && (
                            <div className="mb-4">
                              <p className="text-gray-800 font-medium">{exercise.question}</p>
                            </div>
                          )}

                          {exercise.options && exercise.options.length > 0 && (
                            <div className="mb-4">
                              <div className="grid grid-cols-2 gap-2">
                                {exercise.options.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => handleAnswerSelect(index, option)}
                                    disabled={showResults[index]}
                                    className={`p-3 text-left rounded-lg border transition-colors ${
                                      selectedAnswers[index] === option
                                        ? showResults[index]
                                          ? option === exercise.correctAnswer
                                            ? "bg-green-100 border-green-300 text-green-800"
                                            : "bg-red-100 border-red-300 text-red-800"
                                          : "bg-teal-100 border-teal-300 text-teal-800"
                                        : showResults[index] && option === exercise.correctAnswer
                                          ? "bg-green-100 border-green-300 text-green-800"
                                          : "bg-white border-gray-300 hover:bg-gray-50"
                                    } ${showResults[index] ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                            </div>
                          )}

                          {/* Additional exercise content */}
                          <div className="space-y-3 text-sm">
                            {exercise.english && (
                              <div>
                                <span className="font-medium text-blue-600">English:</span>
                                <p className="text-gray-700">{exercise.english}</p>
                              </div>
                            )}
                            {exercise.german && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-green-600">German:</span>
                                  <button
                                    onClick={() => speakGerman(exercise.german)}
                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                    title="Listen to pronunciation"
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-gray-700">{exercise.german}</p>
                              </div>
                            )}
                            {exercise.explanation && (
                              <div>
                                <span className="font-medium text-gray-600">Explanation:</span>
                                <p className="text-gray-600 italic">{exercise.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Back to Topics button when all exercises are completed */}
                      {isAllExercisesCompleted() && (
                        <div className="text-center pt-6 border-t border-gray-200">
                          <div className="mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Great job!</h3>
                            <p className="text-gray-600">You've completed all exercises for this topic.</p>
                          </div>
                          <button
                            onClick={handleBackToTopics}
                            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                          >
                            Back to Grammar Topics
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No exercises available for this topic.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default view - show topics list
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-teal-600" />
          German Grammar
        </h1>
        <p className="text-gray-600">Master German grammar with structured lessons and exercises</p>
      </div>

      {/* Level Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter by Level</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {level === "all" ? "All Levels" : level}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Topics:</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTopics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic._id}
              onClick={() => handleTopicClick(topic)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                </div>
                <div className="flex items-center gap-2">
                  {topic.difficulty && (
                    <div className="flex items-center gap-1">{getDifficultyStars(topic.difficulty)}</div>
                  )}
                  {topic.level && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(topic.level)}`}>
                      {topic.level}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.name || "Untitled Topic"}</h3>

              {topic.description && <p className="text-gray-600 text-sm mb-4 line-clamp-3">{topic.description}</p>}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{topic.exercises?.length || 0} exercises</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{topic.examples?.length || 0} examples</span>
                </div>
              </div>

              {/* Tags */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {topic.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                  {topic.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{topic.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Click to learn</span>
                <span className="text-teal-600 hover:text-teal-700 font-medium text-sm">Start Learning →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {topics.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No grammar topics available</h3>
          <p className="text-gray-600">
            {selectedLevel === "all"
              ? "Grammar topics will appear here when they are added."
              : `No topics available for level ${selectedLevel}.`}
          </p>
          <button
            onClick={fetchTopics}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

export default Grammar
