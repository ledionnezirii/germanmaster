"use client"
import { useState, useEffect } from "react"
import { grammarService } from "../services/api" // Assuming this service is available
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
      setError("Dështoi ngarkimi i detajeve të temës") // Albanian: Failed to load topic details
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
      alert("Sinteza e të folurit nuk mbështetet në shfletuesin tuaj") // Albanian: Speech synthesis not supported in your browser
    }
  }

  const isAllExercisesCompleted = () => {
    if (!selectedTopic?.exercises) return false
    return selectedTopic.exercises.every((_, index) => showResults[index])
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  // Consistent color scheme with Listen.jsx and Dictionary.jsx
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
            aria-label="Kthehu te Temat e Gramatikës"
          >
            <ArrowLeft className="h-4 w-4" />
            Kthehu te Temat e Gramatikës
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
                aria-label="Përmbajtja e Gramatikës"
              >
                <BookOpen className="h-4 w-4" />
                Përmbajtja
              </button>
              <button
                onClick={() => setActiveTab("examples")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "examples"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                aria-label={`Shembuj (${selectedTopic.examples?.length || 0})`}
              >
                <Lightbulb className="h-4 w-4" />
                Shembuj ({selectedTopic.examples?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("exercises")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "exercises"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                aria-label={`Ushtrime (${selectedTopic.exercises?.length || 0})`}
              >
                <Target className="h-4 w-4" />
                Ushtrime ({selectedTopic.exercises?.length || 0})
              </button>
            </div>
            <div className="p-6">
              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Shpjegimi i Gramatikës</h3>
                  {typeof selectedTopic.content === "string" ? (
                    <p className="text-gray-700 leading-relaxed">{selectedTopic.content}</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedTopic.content?.english && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Shpjegimi në Anglisht
                          </h4>
                          <p className="text-blue-700">{selectedTopic.content.english}</p>
                        </div>
                      )}
                      {selectedTopic.content?.german && (
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                          <h4 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Shpjegimi në Gjermanisht
                            <button
                              onClick={() => speakGerman(selectedTopic.content.german)}
                              className="ml-2 p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
                              title="Dëgjo shqiptimin"
                              aria-label="Dëgjo shqiptimin"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </h4>
                          <p className="text-teal-700">{selectedTopic.content.german}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Examples Tab */}
              {activeTab === "examples" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Shembuj</h3>
                  {selectedTopic.examples && selectedTopic.examples.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTopic.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          {example.english && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-blue-600 uppercase">Anglisht:</span>
                              <p className="text-gray-800 mt-1">{example.english}</p>
                            </div>
                          )}
                          {example.german && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-teal-600 uppercase">Gjermanisht:</span>
                                <button
                                  onClick={() => speakGerman(example.german)}
                                  className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
                                  title="Dëgjo shqiptimin"
                                  aria-label="Dëgjo shqiptimin"
                                >
                                  <Volume2 className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-gray-800 font-medium">{example.german}</p>
                            </div>
                          )}
                          {example.explanation && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 uppercase">Shpjegim:</span>
                              <p className="text-gray-600 italic mt-1">{example.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nuk ka shembuj të disponueshëm për këtë temë.</p>
                  )}
                </div>
              )}
              {/* Exercises Tab */}
              {activeTab === "exercises" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Ushtrime Praktike</h3>
                  {selectedTopic.exercises && selectedTopic.exercises.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTopic.exercises.map((exercise, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-teal-600" />
                            <h4 className="font-semibold text-gray-900">Ushtrimi {index + 1}</h4>
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
                                    aria-label={`Zgjidh përgjigjen: ${option}`}
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
                                <span className="font-medium text-blue-600">Anglisht:</span>
                                <p className="text-gray-700">{exercise.english}</p>
                              </div>
                            )}
                            {exercise.german && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-teal-600">Gjermanisht:</span>
                                  <button
                                    onClick={() => speakGerman(exercise.german)}
                                    className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
                                    title="Dëgjo shqiptimin"
                                    aria-label="Dëgjo shqiptimin"
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-gray-700">{exercise.german}</p>
                              </div>
                            )}
                            {exercise.explanation && (
                              <div>
                                <span className="font-medium text-gray-600">Shpjegim:</span>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Punë e shkëlqyer!</h3>
                            <p className="text-gray-600">Keni përfunduar të gjitha ushtrimet për këtë temë.</p>
                          </div>
                          <button
                            onClick={handleBackToTopics}
                            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            aria-label="Kthehu te Temat e Gramatikës"
                          >
                            Kthehu te Temat e Gramatikës
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nuk ka ushtrime të disponueshme për këtë temë.</p>
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
          Gramatika Gjermane
        </h1>
        <p className="text-gray-600">Zotëroni gramatikën gjermane me mësime dhe ushtrime të strukturuara</p>
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedLevel === level
                  ? level === "all"
                    ? "bg-teal-600 text-white border-teal-700"
                    : getLevelColor(level)
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
              }`}
              aria-label={`Filtro sipas nivelit ${level === "all" ? "Të gjitha Nivelet" : level}`}
            >
              {level === "all" ? "Të gjitha Nivelet" : level}
            </button>
          ))}
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Gabim gjatë ngarkimit të temave:</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTopics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            aria-label="Provo përsëri"
          >
            Provo Përsëri
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
              aria-label={`Mëso për temën: ${topic.name || "Temë pa titull"}`}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.name || "Temë pa titull"}</h3>
              {topic.description && <p className="text-gray-600 text-sm mb-4 line-clamp-3">{topic.description}</p>}
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{topic.exercises?.length || 0} ushtrime</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{topic.examples?.length || 0} shembuj</span>
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
                    <span className="text-xs text-gray-500">+{topic.tags.length - 3} më shumë</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Kliko për të mësuar</span>
                <span className="text-teal-600 hover:text-teal-700 font-medium text-sm">Fillo Mësimin →</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {topics.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka tema gramatikore të disponueshme</h3>
          <p className="text-gray-600">
            {selectedLevel === "all"
              ? "Temat e gramatikës do të shfaqen këtu kur të shtohen."
              : `Nuk ka tema të disponueshme për nivelin ${selectedLevel}.`}
          </p>
          <button
            onClick={fetchTopics}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            aria-label="Rifresko"
          >
            Rifresko
          </button>
        </div>
      )}
    </div>
  )
}

export default Grammar
