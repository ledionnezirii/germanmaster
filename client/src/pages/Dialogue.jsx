"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { dialogueService, authService } from "../services/api"
import SEO from "../components/SEO"
import {
  Play,
  Check,
  X,
  ArrowLeft,
  Trophy,
  Star,
  Volume2,
  BookOpen,
  Sparkles,
  Users,
  RefreshCw,
  MessageCircle,
} from "lucide-react"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

const DIFFICULTY_COLORS = {
  easy: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  hard: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
}

const LEVEL_COLORS = {
  A1: { gradient: "from-emerald-400 to-teal-500", light: "bg-emerald-50", text: "text-emerald-600" },
  A2: { gradient: "from-teal-400 to-cyan-500", light: "bg-teal-50", text: "text-teal-600" },
  B1: { gradient: "from-blue-400 to-indigo-500", light: "bg-blue-50", text: "text-blue-600" },
  B2: { gradient: "from-indigo-400 to-purple-500", light: "bg-indigo-50", text: "text-indigo-600" },
  C1: { gradient: "from-purple-400 to-pink-500", light: "bg-purple-50", text: "text-purple-600" },
  C2: { gradient: "from-pink-400 to-rose-500", light: "bg-pink-50", text: "text-pink-600" },
}

// Progress Ring Component
const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Dialogue Card Component
const DialogueCard = ({ dialogue, isCompleted, onClick }) => {
  const levelColor = LEVEL_COLORS[dialogue.level] || LEVEL_COLORS.A1
  const difficultyColor = DIFFICULTY_COLORS[dialogue.difficulty] || DIFFICULTY_COLORS.medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-6 shadow-sm border cursor-pointer overflow-hidden group
        ${isCompleted ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-gray-100 hover:border-gray-200"}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${levelColor.gradient}`} />

      {isCompleted && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-10 group-hover:text-gray-700 transition-colors">
        {dialogue.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Users className="w-4 h-4" />
        <span>{dialogue.dialogue?.length || 0} lines</span>
        <span className="text-gray-300">•</span>
        <BookOpen className="w-4 h-4" />
        <span>{dialogue.questions?.length || 0} questions</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColor.light} ${levelColor.text}`}>
          {dialogue.level}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor.bg} ${difficultyColor.text} ${difficultyColor.border} border`}
        >
          {dialogue.difficulty}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">+{dialogue.xp} XP</span>
      </div>

      <button
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
        ${
          isCompleted
            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : `bg-gradient-to-r ${levelColor.gradient} text-white hover:shadow-lg`
        }`}
      >
        {isCompleted ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isCompleted ? "Practice Again" : "Start Dialogue"}
      </button>
    </motion.div>
  )
}

// Dialogue Viewer Component
const DialogueViewer = ({ dialogue, onContinue, onBack }) => {
  const [currentLine, setCurrentLine] = useState(0)
  const [showText, setShowText] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const dialogueRef = useRef(null)

  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight
    }
  }, [currentLine])

  useEffect(() => {
    return () => {
      // Cancel any ongoing speech when component unmounts
      window.speechSynthesis.cancel()
    }
  }, [])

  const playDialogueLine = async (index) => {
    if (index >= dialogue.dialogue.length) {
      setIsPlaying(false)
      return
    }

    setIsLoading(true)
    const line = dialogue.dialogue[index]

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(line.text)
      utterance.lang = 'de-DE' // German language
      utterance.rate = 0.9 // Slightly slower for learning
      utterance.pitch = 1

      utterance.onstart = () => {
        setIsLoading(false)
        setIsPlaying(true)
        setCurrentLine(index)
      }

      utterance.onend = () => {
        setTimeout(() => {
          if (index < dialogue.dialogue.length - 1) {
            playDialogueLine(index + 1)
          } else {
            setIsPlaying(false)
            setTimeout(() => {
              onContinue()
            }, 1000)
          }
        }, 800)
      }

      utterance.onerror = (error) => {
        console.error("Speech synthesis error:", error)
        setIsLoading(false)
        setIsPlaying(false)
        
        if (index < dialogue.dialogue.length - 1) {
          setTimeout(() => playDialogueLine(index + 1), 1000)
        } else {
          setTimeout(() => {
            onContinue()
          }, 1000)
        }
      }

      // Speak the text
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Error with speech synthesis:", error)
      setIsLoading(false)
      setIsPlaying(false)
      
      if (index < dialogue.dialogue.length - 1) {
        setTimeout(() => playDialogueLine(index + 1), 1500)
      } else {
        setTimeout(() => {
          onContinue()
        }, 1000)
      }
    }
  }

  const startDialogue = () => {
    setHasStarted(true)
    playDialogueLine(0)
  }

  const toggleText = () => {
    setShowText(!showText)
  }

  const isComplete = currentLine === dialogue.dialogue.length - 1 && !isPlaying
  const levelColor = LEVEL_COLORS[dialogue.level] || LEVEL_COLORS.A1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-3xl mx-auto"
    >
      <div className={`bg-gradient-to-r ${levelColor.gradient} p-6 text-white`}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to list</span>
        </button>
        <h2 className="text-2xl font-bold">{dialogue.title}</h2>
        <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
          <span>{dialogue.level}</span>
          <span>•</span>
          <span>{dialogue.dialogue.length} lines</span>
          <span>•</span>
          <span>+{dialogue.xp} XP</span>
        </div>
      </div>

      <div className="h-1 bg-gray-100">
        <motion.div
          className={`h-full bg-gradient-to-r ${levelColor.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${((currentLine + 1) / dialogue.dialogue.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div ref__={dialogueRef} className="p-6 space-y-4 max-h-[400px] overflow-y-auto scroll-smooth">
        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white animate-pulse">
              <Volume2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Listen & Learn</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Click start to begin the dialogue. Listen carefully to each line. The dialogue will play automatically.
            </p>
            <button
              onClick={startDialogue}
              disabled={isLoading}
              className={`px-8 py-4 rounded-xl font-medium text-white bg-gradient-to-r ${levelColor.gradient} 
                hover:shadow-lg transition-all duration-200 flex items-center gap-2`}
            >
              <Play className="w-5 h-5" />
              Start Dialogue
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isLoading && <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-purple-600"></div>}
                {isPlaying && !isLoading && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Volume2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
                <span className="text-sm font-medium text-gray-600">
                  {isLoading ? "Loading audio..." : isPlaying ? "Playing..." : "Dialogue complete"}
                </span>
              </div>
              <button
                onClick={toggleText}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showText ? "Hide Text" : "Show Text"}
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {dialogue.dialogue.slice(0, currentLine + 1).map((line, index) => {
                const isEven = index % 2 === 0
                const isCurrentLine = index === currentLine
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: index === currentLine ? 0.1 : 0 }}
                    className={`flex flex-col ${isEven ? "items-start" : "items-end"}`}
                  >
                    <span className="text-xs font-medium text-gray-500 mb-1 px-1">{line.speaker}</span>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl transition-all duration-200 relative
                        ${
                          isEven
                            ? "bg-gray-100 text-gray-900 rounded-tl-md"
                            : `bg-gradient-to-r ${levelColor.gradient} text-white rounded-tr-md`
                        }
                        ${isCurrentLine ? "ring-2 ring-purple-400 shadow-lg" : ""}`}
                    >
                      {showText ? (
                        <>
                          <p className="text-sm leading-relaxed">{line.text}</p>
                          {line.translation && (
                            <p
                              className={`text-xs mt-2 pt-2 border-t ${isEven ? "text-gray-500 border-gray-200" : "text-white/80 border-white/20"}`}
                            >
                              {line.translation}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-current opacity-50" />
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                className={`w-1 h-3 rounded-full ${isEven ? "bg-gray-400" : "bg-white/50"}`}
                                animate={
                                  isCurrentLine
                                    ? {
                                        height: [12, 20, 12],
                                        opacity: [0.5, 1, 0.5],
                                      }
                                    : {}
                                }
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.8,
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{currentLine + 1}</span> of {dialogue.dialogue.length} lines
          </p>
          {hasStarted && isComplete && (
            <button
              onClick={onContinue}
              className={`px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${levelColor.gradient} 
                hover:shadow-lg transition-all duration-200 flex items-center gap-2`}
            >
              Continue to Quiz
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
        {hasStarted && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            {showText ? "Hide text to focus on listening" : "Show text if you need help"}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// Quiz Component
const DialogueQuiz = ({ dialogue, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const question = dialogue.questions[currentQuestion]
  const levelColor = LEVEL_COLORS[dialogue.level] || LEVEL_COLORS.A1

  const handleSelectAnswer = (index) => {
    if (showFeedback) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return

    setShowFeedback(true)
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentQuestion < dialogue.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer(null)
        setShowFeedback(false)
      } else {
        handleQuizComplete(newAnswers)
      }
    }, 1500)
  }

  const handleQuizComplete = async (finalAnswers) => {
    setIsSubmitting(true)

    try {
      const response = await dialogueService.submitDialogueQuiz(dialogue._id, finalAnswers)
      const result = response.data || response
      
      console.log("Quiz submission result:", result)
      
      setIsSubmitting(false)
      onComplete(result)
    } catch (error) {
      console.error("Error submitting dialogue quiz:", error)
      
      let correct = 0
      dialogue.questions.forEach((q, i) => {
        if (finalAnswers[i] === q.correctAnswer) correct++
      })

      const percentage = Math.round((correct / dialogue.questions.length) * 100)
      const passed = percentage >= 80

      const result = {
        success: false,
        passed,
        score: {
          correct,
          total: dialogue.questions.length,
          percentage,
        },
        xpAwarded: 0,
      }

      setIsSubmitting(false)
      onComplete(result)
    }
  }

  const isCorrect = selectedAnswer === question.correctAnswer

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl mx-auto"
    >
      <div className={`bg-gradient-to-r ${levelColor.gradient} p-6 text-white`}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to dialogue</span>
        </button>
        <h2 className="text-xl font-bold">Quiz: {dialogue.title}</h2>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestion + 1} of {dialogue.questions.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentQuestion + 1) / dialogue.questions.length) * 100)}% complete
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${levelColor.gradient}`}
            animate={{ width: `${((currentQuestion + 1) / dialogue.questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"

            if (showFeedback) {
              if (index === question.correctAnswer) {
                buttonClass = "bg-emerald-50 border-emerald-500 text-emerald-700"
              } else if (index === selectedAnswer && !isCorrect) {
                buttonClass = "bg-rose-50 border-rose-500 text-rose-700"
              }
            } else if (selectedAnswer === index) {
              buttonClass = `bg-gradient-to-r ${levelColor.gradient} border-transparent text-white`
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                whileHover={!showFeedback ? { scale: 1.01 } : {}}
                whileTap={!showFeedback ? { scale: 0.99 } : {}}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${buttonClass}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${selectedAnswer === index && !showFeedback ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{option}</span>
                {showFeedback && index === question.correctAnswer && <Check className="w-6 h-6 text-emerald-600" />}
                {showFeedback && index === selectedAnswer && !isCorrect && <X className="w-6 h-6 text-rose-600" />}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 p-4 rounded-xl flex items-center gap-3
                ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            >
              {isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
              <span className="font-medium">
                {isCorrect ? "Correct! Great job!" : "Not quite right. Keep learning!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleSubmitAnswer}
          disabled={selectedAnswer === null || showFeedback || isSubmitting}
          className={`w-full py-4 rounded-xl font-medium text-white transition-all duration-200
            ${
              selectedAnswer === null || showFeedback || isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : `bg-gradient-to-r ${levelColor.gradient} hover:shadow-lg`
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-current"></div>
              Submitting...
            </span>
          ) : (
            "Submit Answer"
          )}
        </button>
      </div>
    </motion.div>
  )
}

// Results Component
const QuizResults = ({ result, dialogue, onRetry, onBack }) => {
  const levelColor = LEVEL_COLORS[dialogue.level] || LEVEL_COLORS.A1
  
  if (!result || !result.score) {
    console.error("Invalid result object:", result)
    return (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-lg mx-auto text-center p-8">
        <p className="text-red-600">Error loading results. Please try again.</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-gray-400 to-gray-500"
        >
          Back to Dialogues
        </button>
      </div>
    )
  }

  const { passed, score, xpAwarded } = result

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-lg mx-auto text-center"
    >
      <div
        className={`p-8 ${passed ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-rose-400 to-pink-500"} text-white`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
        >
          {passed ? <Trophy className="w-12 h-12" /> : <RefreshCw className="w-12 h-12" />}
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{passed ? "Congratulations!" : "Keep Practicing!"}</h2>
        <p className="text-white/80">{passed ? "You passed the quiz!" : "You need 80% to pass. Try again!"}</p>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="relative">
            <ProgressRing progress={score.percentage} size={100} strokeWidth={8} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{score.percentage}%</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-3xl font-bold text-gray-900">
              {score.correct}/{score.total}
            </p>
            <p className="text-gray-500">Correct answers</p>
          </div>
        </div>

        {xpAwarded > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-amber-50 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3"
          >
            <Star className="w-6 h-6 text-amber-500" />
            <span className="text-amber-700 font-semibold">+{xpAwarded} XP earned!</span>
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          {!passed && (
            <button
              onClick={onRetry}
              className={`w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r ${levelColor.gradient} hover:shadow-lg transition-all duration-200`}
            >
              Try Again
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full py-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
          >
            Back to Dialogues
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Main Dialogue Component
export default function Dialogue() {
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [dialogues, setDialogues] = useState([])
  const [finishedDialogues, setFinishedDialogues] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("list")
  const [selectedDialogue, setSelectedDialogue] = useState(null)
  const [quizResult, setQuizResult] = useState(null)

  useEffect(() => {
    loadDialogues()
    loadProgress()
  }, [selectedLevel])

  const loadDialogues = async () => {
    try {
      setLoading(true)
      const response = await dialogueService.getAllDialogues({ level: selectedLevel })
      const data = response.data || response
      setDialogues(data || [])
    } catch (error) {
      console.error("Error loading dialogues:", error)
      setDialogues([])
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const userResponse = await authService.getProfile()
      const user = userResponse.data || userResponse
      
      // CRITICAL FIX: Convert ObjectIds to strings for proper comparison
      const finishedIds = (user.finishedDialogues || []).map(id => {
        // Handle MongoDB's ObjectId format: { "$oid": "..." }
        if (typeof id === 'object' && id.$oid) {
          return id.$oid
        }
        // Handle when it's already a string or convert to string
        return typeof id === 'string' ? id : String(id)
      })
      
      console.log("✅ Loaded finished dialogues:", finishedIds)
      setFinishedDialogues(finishedIds)
      
      const progressResponse = await dialogueService.getUserProgress()
      const progressData = progressResponse.data || progressResponse
      setProgress(progressData || { total: 0, finished: 0, percentage: 0 })
    } catch (error) {
      console.error("Error loading progress:", error)
    }
  }

  const filteredDialogues = dialogues.filter((d) => d.level === selectedLevel)

  const handleSelectDialogue = (dialogue) => {
    setSelectedDialogue(dialogue)
    setView("dialogue")
  }

  const handleStartQuiz = () => {
    setView("quiz")
  }

  const handleQuizComplete = (result) => {
    console.log("Quiz completed with result:", result)
    setQuizResult(result)
    setView("results")
    if (result.passed) {
      // Add the dialogue ID to finished list immediately
      setFinishedDialogues((prev) => [...prev, selectedDialogue._id])
      // Reload progress from backend to get updated data
      loadProgress()
    }
  }

  const handleRetry = () => {
    setView("quiz")
    setQuizResult(null)
  }

  const handleBackToList = () => {
    setView("list")
    setSelectedDialogue(null)
    setQuizResult(null)
  }

  const handleBackToDialogue = () => {
    setView("dialogue")
  }

  const LevelTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
      {LEVELS.map((level) => {
        const levelColor = LEVEL_COLORS[level]
        const isSelected = selectedLevel === level
        return (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
              ${
                isSelected
                  ? `bg-gradient-to-r ${levelColor.gradient} text-white shadow-lg`
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            {level}
          </button>
        )
      })}
    </div>
  )

  const ProgressSummary = () => {
    const levelDialogues = filteredDialogues.length
    const levelCompleted = filteredDialogues.filter((d) => {
      const isCompleted = finishedDialogues.includes(d._id)
      console.log(`Checking dialogue ${d._id}: ${isCompleted ? 'COMPLETED ✅' : 'NOT completed ❌'}`)
      return isCompleted
    }).length
    const percentage = levelDialogues > 0 ? Math.round((levelCompleted / levelDialogues) * 100) : 0

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Level {selectedLevel} Progress</h3>
            <p className="text-sm text-gray-500">
              {levelCompleted} of {levelDialogues} dialogues completed
            </p>
          </div>
          <div className="relative">
            <ProgressRing progress={percentage} size={70} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Dialogje Gjermane | Praktikë Bisedash në Gjuhën Gjermane"
        description="Praktikoni biseda në gjuhën gjermane me dialogje interaktive. Përshtat për të gjitha nivelet nga A1 deri C2 me audio dhe përkthime."
        keywords="dialogje gjermane, biseda gjermanisht, german dialogues, practice german speaking, gjermanisht bisedim"
        ogImage="/images/dialogue-og.jpg"
        canonicalUrl="https://gjuhagjermane.com/dialogue"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dialogues</h1>
                <p className="text-gray-500">Practice conversations in German</p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {view === "list" && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LevelTabs />
                <ProgressSummary />

                {loading ? (
                  <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  </div>
                ) : filteredDialogues.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDialogues.map((dialogue) => {
                      const isCompleted = finishedDialogues.includes(dialogue._id)
                      console.log(`Rendering dialogue ${dialogue.title} (${dialogue._id}): ${isCompleted ? 'COMPLETED ✅' : 'NOT completed ❌'}`)
                      return (
                        <DialogueCard
                          key={dialogue._id}
                          dialogue={dialogue}
                          isCompleted={isCompleted}
                          onClick={() => handleSelectDialogue(dialogue)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No dialogues yet</h3>
                    <p className="text-gray-500">Check back later for new dialogues at this level.</p>
                  </div>
                )}
              </motion.div>
            )}

            {view === "dialogue" && selectedDialogue && (
              <motion.div
                key="dialogue"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <DialogueViewer dialogue={selectedDialogue} onContinue={handleStartQuiz} onBack={handleBackToList} />
              </motion.div>
            )}

            {view === "quiz" && selectedDialogue && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <DialogueQuiz dialogue={selectedDialogue} onComplete={handleQuizComplete} onBack={handleBackToDialogue} />
              </motion.div>
            )}

            {view === "results" && selectedDialogue && quizResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <QuizResults
                  result={quizResult}
                  dialogue={selectedDialogue}
                  onRetry={handleRetry}
                  onBack={handleBackToList}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </> // Added closing JSX fragment tag
  )
}