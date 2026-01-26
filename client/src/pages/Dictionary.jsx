"use client"

import { useState, useEffect, useRef } from "react"
import { dictionaryService, favoritesService, ttsService, wordsService } from "../services/api"
import SEO from "../components/SEO"
import { BookOpen, Volume2, Heart, ChevronLeft, ChevronRight, Play, X, CheckCircle, XCircle, Trophy, Lock, Unlock } from 'lucide-react'

const Dictionary = () => {
  const [words, setWords] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [showFavorites, setShowFavorites] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [playingWordId, setPlayingWordId] = useState(null)
  const audioRef = useRef(null)
  const wordsPerPage = 32

  // Unlock state
  const [unlockStats, setUnlockStats] = useState({
    todayUnlocks: 0,
    remainingUnlocks: 20,
    canUnlock: true,
    nextResetTime: null
  })
  const [unlocking, setUnlocking] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState(null)

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizWords, setQuizWords] = useState([])
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)

  useEffect(() => {
    fetchWords()
    fetchFavorites()
    fetchUnlockStats()
  }, [selectedLevel, currentPage])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!unlockStats.canUnlock && unlockStats.nextResetTime) {
      const calculateTimeLeft = () => {
        const now = new Date().getTime()
        const resetTime = new Date(unlockStats.nextResetTime).getTime()
        const diff = resetTime - now

        if (diff <= 0) {
          setTimeUntilReset(null)
          fetchUnlockStats() // Refresh stats when time is up
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
      }

      calculateTimeLeft()
      const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

      return () => clearInterval(interval)
    } else {
      setTimeUntilReset(null)
    }
  }, [unlockStats.canUnlock, unlockStats.nextResetTime])

  const fetchWords = async () => {
    try {
      setLoading(true)
      const params = { page: currentPage, limit: wordsPerPage }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await dictionaryService.getAllWords(params)

      setWords(response.data.words || response.data || [])

      const paginationData = response.data.pagination || {}
      const totalCount = paginationData.totalWords || paginationData.total || response.data.total || response.total || 0
      setTotalWords(totalCount)
      const calculatedPages = Math.ceil(totalCount / wordsPerPage)
      setTotalPages(calculatedPages)
    } catch (error) {
      // console.error("Error fetching words:", error)
      setWords([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await favoritesService.getFavorites()
      const favoriteWords = response.data.favorites || response.data || []
      setFavorites(favoriteWords.map((fav) => fav.wordId || fav))
    } catch (error) {
      // console.error("Error fetching favorites:", error)
      setFavorites([])
    }
  }

  const fetchUnlockStats = async () => {
    try {
      const response = await dictionaryService.getUnlockStats()
      setUnlockStats(response.data || response)
    } catch (error) {
      // console.error("Error fetching unlock stats:", error)
    }
  }

  const handleUnlockWord = async (wordId) => {
    if (!unlockStats.canUnlock) {
      alert(`Keni arritur limitin ditor prej 20 fjalëve. Provoni sërish më vonë.`)
      return
    }

    setUnlocking(wordId)
    try {
      const response = await dictionaryService.unlockWord(wordId)
      
      // Update the word in the list
      setWords(prevWords => 
        prevWords.map(w => 
          w._id === wordId ? { ...w, isUnlocked: true } : w
        )
      )

      // Refresh unlock stats
      await fetchUnlockStats()

    } catch (error) {
      // console.error("Error unlocking word:", error)
      alert(error.response?.data?.message || "Gabim gjatë zhbllokimit të fjalës")
    } finally {
      setUnlocking(null)
    }
  }

  const toggleFavorite = async (wordId) => {
    try {
      const isFavorite = favorites.some((fav) => (fav._id || fav) === wordId)
      if (isFavorite) {
        await favoritesService.removeFavorite(wordId)
        setFavorites(favorites.filter((fav) => (fav._id || fav) !== wordId))
      } else {
        await favoritesService.addFavorite(wordId)
        const word = words.find((w) => w._id === wordId)
        setFavorites([...favorites, word])
      }
    } catch (error) {
      // console.error("Error toggling favorite:", error)
    }
  }

  const playPronunciation = async (word) => {
    if (playingWordId === word._id && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingWordId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    try {
      setPlayingWordId(word._id)
      const audioUrl = await ttsService.getDictionaryAudio(word._id, word.word, word.level)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl
      audioRef.current.onended = () => {
        setPlayingWordId(null)
      }
      audioRef.current.onerror = (e) => {
        console.error("Audio error:", e)
        setPlayingWordId(null)
      }

      await audioRef.current.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingWordId(null)
      alert("Nuk mund të luhet audioja. Ju lutemi provoni përsëri.")
    }
  }

  const startQuiz = async () => {
    if (selectedLevel === "all") {
      alert("Ju lutemi zgjidhni një nivel (A1, A2, B1, B2, C1, C2) për të filluar kuizin.")
      return
    }

    setQuizLoading(true)
    try {
      const response = await dictionaryService.getAllWords({ level: selectedLevel, limit: 100 })
      const levelWords = response.data.words || response.data || []

      // Filter only unlocked words for quiz
      const unlockedWords = levelWords.filter(w => w.isUnlocked)

      if (unlockedWords.length < 15) {
        alert(`Nevojiten të paktën 15 fjalë të zhbllokkuara për nivelin ${selectedLevel}. Ju keni ${unlockedWords.length} fjalë të zhbllokkuara.`)
        setQuizLoading(false)
        return
      }

      const shuffled = [...unlockedWords].sort(() => Math.random() - 0.5)
      const selectedWords = shuffled.slice(0, 15)
      setQuizWords(unlockedWords)

      const questions = selectedWords.map((word) => {
        const otherWords = unlockedWords.filter(w => w._id !== word._id)
        const wrongOptions = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.translation)

        const options = [...wrongOptions, word.translation].sort(() => Math.random() - 0.5)

        return {
          word: word.word,
          correctAnswer: word.translation,
          options: options
        }
      })

      setQuizQuestions(questions)
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setCorrectAnswers(0)
      setShowResult(false)
      setAnswerSubmitted(false)
      setXpAwarded(false)
      setShowQuiz(true)
    } catch (error) {
      console.error("Error starting quiz:", error)
      alert("Ndodhi një gabim gjatë fillimit të kuizit. Ju lutemi provoni përsëri.")
    } finally {
      setQuizLoading(false)
    }
  }

  const handleAnswerSelect = (answer) => {
    if (answerSubmitted) return

    setSelectedAnswer(answer)
    setAnswerSubmitted(true)

    const currentQuestion = quizQuestions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setAnswerSubmitted(false)
      } else {
        finishQuiz()
      }
    }, 1500)
  }

  const finishQuiz = async () => {
    setShowResult(true)

    const passed = correctAnswers >= 9

    if (passed && !xpAwarded) {
      try {
        await wordsService.addQuizXp(5)
        setXpAwarded(true)
      } catch (error) {
        console.error("Error awarding XP:", error)
      }
    }
  }

  const closeQuiz = () => {
    setShowQuiz(false)
    setQuizQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setCorrectAnswers(0)
    setShowResult(false)
    setAnswerSubmitted(false)
    setXpAwarded(false)
  }

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFavorites = !showFavorites || favorites.some((fav) => fav._id === word._id)
    return matchesSearch && matchesFavorites
  })

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleLevelChange = (level) => {
    setSelectedLevel(level)
    setCurrentPage(1)
  }

  const handleFavoritesToggle = () => {
    setShowFavorites(!showFavorites)
    setCurrentPage(1)
  }

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50"
      case "A2":
        return "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300/50"
      case "B1":
        return "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-800 border-teal-300/50"
      case "B2":
        return "bg-gradient-to-br from-teal-200 to-cyan-200 text-teal-900 border-teal-400/50"
      case "C1":
        return "bg-gradient-to-br from-cyan-500 to-teal-600 text-white border-cyan-400/30"
      case "C2":
        return "bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-teal-500/30"
      default:
        return "bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 border-gray-200/50"
    }
  }

  const getPartOfSpeechColor = (partOfSpeech) => {
    switch (partOfSpeech?.toLowerCase()) {
      case "noun":
      case "emër":
        return "bg-blue-50 text-blue-700 border border-blue-200/50"
      case "verb":
      case "folje":
        return "bg-green-50 text-green-700 border border-green-200/50"
      case "adjective":
      case "mbiemër":
        return "bg-purple-50 text-purple-700 border border-purple-200/50"
      case "adverb":
      case "ndajfolje":
        return "bg-orange-50 text-orange-700 border border-orange-200/50"
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200/50"
    }
  }

  return (
    <>
      <SEO 
        title="Fjalor Gjermanisht-Shqip | Mësoni Fjalë Gjermane"
        description="Fjalor i plotë gjermanisht-shqip me audio, shqipime dhe ushtrime. Mësoni fjalë gjermane me shqipime dhe shembuj."
        keywords="fjalor gjermanisht, fjale gjermane, german dictionary, learn german words, fjalor gjermanisht shqip"
        ogImage="/images/dictionary-og.jpg"
        canonicalUrl="https://gjuhagjermane.com/dictionary"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto p-2 md:p-4 space-y-4">
          {/* Header */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl -z-10" />

          <div className="flex items-start gap-2 md:gap-3">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-900 bg-clip-text text-transparent mb-0.5 leading-tight">
                Fjalor Gjermanisht
              </h1>
              <p className="text-gray-600 text-xs md:text-sm lg:text-base leading-tight">
                Zhbllokoni dhe mësoni fjalë të reja - 20 fjalë në ditë
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Stats Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 rounded-xl shadow-sm p-3 md:p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Unlock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm md:text-base font-bold text-gray-900">
                  Zhbllokimet e sotme: {unlockStats.todayUnlocks} / 20
                </p>
                <p className="text-xs text-gray-600">
                  {unlockStats.remainingUnlocks} fjalë të mbetura për sot
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-bold text-purple-600">
                {unlockStats.remainingUnlocks}
              </p>
              <p className="text-xs text-gray-600">të mbetura</p>
            </div>
          </div>
          {!unlockStats.canUnlock && (
            <div className="mt-3 text-xs text-orange-700 bg-orange-50 rounded-lg p-2 border border-orange-200 flex items-center justify-between">
              <span>⚠️ Keni arritur limitin ditor.</span>
              {timeUntilReset && (
                <span className="font-bold text-orange-800 bg-orange-100 px-2 py-1 rounded ml-2">
                  Hapet pas: {timeUntilReset}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Level Selection & Quiz Button */}
        <div className="bg-white/80 backdrop-blur-sm flex flex-col md:flex-row md:items-center gap-3 rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
          <div className="space-y-2 md:space-y-3 flex-1">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Niveli i gjuhës
            </div>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-all border ${selectedLevel === level
                      ? level === "all"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/25"
                        : `${getLevelColor(level)} shadow-md`
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {level === "all" ? "Të gjitha" : level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={quizLoading || selectedLevel === "all"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedLevel === "all"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
              }`}
          >
            {quizLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>Fillo Kuizin</span>
          </button>
        </div>

        {/* Favorites Toggle */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4">
          <button
            onClick={handleFavoritesToggle}
            className={`w-full md:w-auto flex items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${showFavorites
                ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
              }`}
          >
            <Heart className={`h-3 w-3 md:h-3.5 md:w-3.5 ${showFavorites ? "fill-current" : ""}`} />
            <span>Të Preferuarat</span>
            {favorites.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${showFavorites ? "bg-white/20" : "bg-rose-50 text-rose-600"}`}>
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* Words Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </div>
              <p className="text-gray-500 font-medium text-sm">Po ngarkohet...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredWords.map((word) => {
              const isFavorite = favorites.some((fav) => fav._id === word._id)
              const firstExample = word.examples && word.examples.length > 0 ? word.examples[0] : null
              const isPlaying = playingWordId === word._id
              const isLocked = !word.isUnlocked

              return (
                <div
                  key={word._id}
                  className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-300 p-3 flex flex-col h-full ${
                    isLocked 
                      ? "border-gray-300 opacity-75" 
                      : "border-gray-200/50 hover:shadow-lg hover:border-emerald-200/50"
                  }`}
                >
                  {!isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  <div className="relative flex flex-col h-full">
                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-slate-50/95 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4">
                        <Lock className="w-8 h-8 text-gray-400 mb-2" />
                        <button
                          onClick={() => handleUnlockWord(word._id)}
                          disabled={unlocking === word._id || !unlockStats.canUnlock}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            unlocking === word._id
                              ? "bg-gray-200 text-gray-500 cursor-wait"
                              : !unlockStats.canUnlock
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl"
                          }`}
                        >
                          {unlocking === word._id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"></div>
                              <span>Duke Hapur...</span>
                            </div>
                          ) : (
                            "Hap Fjalën"
                          )}
                        </button>
                        {!unlockStats.canUnlock && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Limiti ditor u arrit
                          </p>
                        )}
                      </div>
                    )}

                    {/* Word Content */}
                    <div className={`${isLocked ? "blur-sm" : ""}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{word.word}</h3>
                          <p className="text-gray-600 text-xs font-medium leading-tight">{word.translation}</p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => playPronunciation(word)}
                            disabled={isLocked}
                            className={`p-1.5 rounded-lg transition-all ${
                              isLocked
                                ? "opacity-50 cursor-not-allowed"
                                : isPlaying
                                ? "text-emerald-600 bg-emerald-100"
                                : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title="Luaj shqiptimin"
                          >
                            <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
                          </button>
                          <button
                            onClick={() => toggleFavorite(word._id)}
                            disabled={isLocked}
                            className={`p-1.5 rounded-lg transition-all ${
                              isLocked
                                ? "opacity-50 cursor-not-allowed"
                                : isFavorite
                                ? "text-rose-500 bg-rose-50"
                                : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                            }`}
                            title={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getLevelColor(word.level)}`}>
                          {word.level}
                        </span>
                        {word.partOfSpeech && (
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getPartOfSpeechColor(word.partOfSpeech)}`}>
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>

                      {firstExample && firstExample.german && (
                        <div className="mt-auto bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg p-2 border border-emerald-200/30">
                          <p className="text-gray-700 text-xs italic leading-tight line-clamp-3">
                            "{firstExample.german}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600 font-medium">
                Faqja <span className="font-bold text-gray-900">{currentPage}</span> nga{" "}
                <span className="font-bold text-gray-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                      : "bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 shadow-sm"
                    }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">E mëparshme</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                      : "bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 shadow-sm"
                    }`}
                >
                  <span className="hidden sm:inline">E ardhshme</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredWords.length === 0 && !loading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center max-w-md">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Nuk u gjetën fjalë</h3>
              <p className="text-gray-600 leading-tight text-xs">
                {showFavorites
                  ? "Ende nuk ka fjalë të preferuara"
                  : "Nuk ka fjalë të disponueshme për nivelin e zgjedhur"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Kuiz - Niveli {selectedLevel}</h2>
                  <p className="text-xs text-gray-500">
                    {showResult ? "Rezultati" : `Pyetja ${currentQuestionIndex + 1} nga ${quizQuestions.length}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeQuiz}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {!showResult ? (
                <>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-2">Çfarë do të thotë:</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {quizQuestions[currentQuestionIndex]?.word}
                    </h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    {quizQuestions[currentQuestionIndex]?.options.map((option, index) => {
                      const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer
                      const isSelected = selectedAnswer === option

                      let optionClass = "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50"

                      if (answerSubmitted) {
                        if (isCorrect) {
                          optionClass = "bg-green-50 border-green-500 text-green-800"
                        } else if (isSelected && !isCorrect) {
                          optionClass = "bg-red-50 border-red-500 text-red-800"
                        }
                      } else if (isSelected) {
                        optionClass = "bg-purple-50 border-purple-500"
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={answerSubmitted}
                          className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${optionClass}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {answerSubmitted && isCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {answerSubmitted && isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    Përgjigje të sakta: <span className="font-bold text-emerald-600">{correctAnswers}</span> / {currentQuestionIndex + (answerSubmitted ? 1 : 0)}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${correctAnswers >= 9
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                      : "bg-gradient-to-br from-orange-400 to-red-500"
                    }`}>
                    {correctAnswers >= 9 ? (
                      <Trophy className="w-10 h-10 text-white" />
                    ) : (
                      <XCircle className="w-10 h-10 text-white" />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {correctAnswers >= 9 ? "Urime! 🎉" : "Provoni përsëri!"}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Rezultati juaj: <span className="font-bold text-xl">{correctAnswers}</span> / {quizQuestions.length}
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="text-sm text-gray-500 mb-1">Përqindja</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round((correctAnswers / quizQuestions.length) * 100)}%
                    </div>
                  </div>

                  {correctAnswers >= 9 && xpAwarded && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-200">
                      <div className="flex items-center justify-center gap-2 text-emerald-700">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">+5 XP fituar!</span>
                      </div>
                    </div>
                  )}

                  {correctAnswers < 9 && (
                    <p className="text-sm text-gray-500 mb-6">
                      Ju nevojiten të paktën 9 përgjigje të sakta (60%) për të fituar XP.
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={closeQuiz}
                      className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                    >
                      Mbyll
                    </button>
                    <button
                      onClick={() => {
                        closeQuiz()
                        startQuiz()
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
                    >
                      Provo Përsëri
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>

)
}
export default Dictionary