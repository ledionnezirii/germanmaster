"use client"

import { useState, useEffect, useRef } from "react"
import { dictionaryService, favoritesService, ttsService } from "../services/api"
import { BookOpen, Volume2, Heart, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

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

  useEffect(() => {
    fetchWords()
    fetchFavorites()
  }, [selectedLevel, currentPage])

  // Cleanup audio on unmount
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
      console.error("Error fetching words:", error)
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
      console.error("Error fetching favorites:", error)
      setFavorites([])
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
      console.error("Error toggling favorite:", error)
    }
  }

  const playPronunciation = async (word) => {
    // Stop if already playing this word
    if (playingWordId === word._id && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingWordId(null)
      return
    }

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }

    try {
      setPlayingWordId(word._id)
      console.log("[TTS] Requesting dictionary audio for:", word.word)

      const response = await ttsService.getDictionaryAudio(
        word._id,
        word.word,
        word.level
      )

      const audioBlob = response.data
      console.log("[TTS] Audio blob received:", audioBlob.size, "bytes")

      const audioUrl = URL.createObjectURL(audioBlob)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl

      audioRef.current.onended = () => {
        console.log("[TTS] Dictionary audio ended")
        setPlayingWordId(null)
        URL.revokeObjectURL(audioUrl)
      }

      audioRef.current.onerror = (e) => {
        console.error("[TTS] Audio error:", e)
        setPlayingWordId(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audioRef.current.play()
      console.log("[TTS] Dictionary audio playing")
    } catch (error) {
      console.error("[TTS] Error:", error)
      setPlayingWordId(null)
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
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
        return "bg-blue-50 text-blue-700 border border-blue-200/50"
      case "verb":
        return "bg-green-50 text-green-700 border border-green-200/50"
      case "adjective":
        return "bg-purple-50 text-purple-700 border border-purple-200/50"
      case "adverb":
        return "bg-orange-50 text-orange-700 border border-orange-200/50"
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200/50"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto p-2 md:p-4 space-y-4">
        {/* Hero Header */}
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
                Eksploroni fjalorin gjermanisht të organizuar sipas niveleve të gjuhës
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm flex items-center gap-2 rounded-xl shadow-sm border border-gray-200/50 p-3 md:p-4 space-y-3 md:space-y-4">
          {/* Level Filters */}
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 bg-yellow-400/40 rounded-4xl p-1 text-xs md:text-sm font-semibold text-gray-700">
                <Filter className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full text-emerald-600" />
                <span>Niveli i gjuhës</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-all border ${
                    selectedLevel === level
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

          {/* Favorites Toggle */}
          <div className="pt-2 md:pt-2 border-t mt-3.5 border-gray-100">
            <button
              onClick={handleFavoritesToggle}
              className={`w-full md:w-auto flex items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                showFavorites
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Heart className={`h-3 w-3 md:h-3.5 md:w-3.5 ${showFavorites ? "fill-current" : ""}`} />
              <span>Të Preferuarat</span>
              {favorites.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    showFavorites ? "bg-white/20" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Words Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-3">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
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

              return (
                <div
                  key={word._id}
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200/50 hover:shadow-lg hover:border-emerald-200/50 transition-all duration-300 p-3 flex flex-col h-full"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{word.word}</h3>
                        <p className="text-gray-600 text-xs font-medium leading-tight">{word.translation}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => playPronunciation(word)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isPlaying 
                              ? "text-emerald-600 bg-emerald-100" 
                              : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Luaj shqiptimin"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleFavorite(word._id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isFavorite
                              ? "text-rose-500 bg-rose-50"
                              : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                          }`}
                          title={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getLevelColor(word.level)}`}>
                        {word.level}
                      </span>
                      {word.partOfSpeech && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getPartOfSpeechColor(word.partOfSpeech)}`}
                        >
                          {word.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {/* Example */}
                    {firstExample && firstExample.german && (
                      <div className="mt-auto bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg p-2 border border-emerald-200/30">
                        <p className="text-gray-700 text-xs italic leading-tight line-clamp-3">
                          "{firstExample.german}"
                        </p>
                      </div>
                    )}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === 1
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
                        className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === totalPages
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
                {searchTerm
                  ? `Asnjë fjalë nuk përputhet me "${searchTerm}"`
                  : showFavorites
                    ? "Ende nuk ka fjalë të preferuara"
                    : "Nuk ka fjalë të disponueshme për nivelin e zgjedhur"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dictionary