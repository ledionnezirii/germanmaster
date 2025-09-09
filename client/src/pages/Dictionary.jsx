"use client"

import { useState, useEffect } from "react"
import { dictionaryService, favoritesService } from "../services/api"
import { BookOpen, Volume2, Heart, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"

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
  const wordsPerPage = 30

  useEffect(() => {
    fetchWords()
    fetchFavorites()
  }, [selectedLevel, currentPage])

  const fetchWords = async () => {
    try {
      setLoading(true)
      const params = { page: currentPage, limit: wordsPerPage }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      console.log("[v0] Fetching words with params:", params)
      const response = await dictionaryService.getAllWords(params)
      console.log("[v0] API response:", response)
      console.log("[v0] Response data structure:", response.data)

      setWords(response.data.words || response.data || [])

      const paginationData = response.data.pagination || {}
      const totalCount = paginationData.totalWords || paginationData.total || response.data.total || response.total || 0
      setTotalWords(totalCount)
      const calculatedPages = Math.ceil(totalCount / wordsPerPage)
      setTotalPages(calculatedPages)

      console.log("[v0] Pagination data:", paginationData)
      console.log("[v0] Total words:", totalCount)
      console.log("[v0] Words per page:", wordsPerPage)
      console.log("[v0] Calculated total pages:", calculatedPages)
      console.log("[v0] Current page:", currentPage)
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

  const playPronunciation = (word) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "de-DE"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
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

  const getPartOfSpeechColor = (partOfSpeech) => {
    switch (partOfSpeech?.toLowerCase()) {
      case "noun":
        return "bg-blue-100 text-blue-800"
      case "verb":
        return "bg-green-100 text-green-800"
      case "adjective":
        return "bg-purple-100 text-purple-800"
      case "adverb":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fjalor Gjermanisht</h1>
        <p className="text-gray-600">Eksploroni fjalorin gjermanisht të organizuar sipas niveleve</p>
        <div className="mt-3 text-sm text-gray-500">
          {totalWords > 0 && (
            <span>
              Shfaqen {Math.min(wordsPerPage, filteredWords.length)} nga {totalWords} fjalë totale
              {totalPages > 1 && ` • Faqja ${currentPage} nga ${totalPages}`}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Kërkoni fjalë ose përkthime..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Niveli:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-teal-600 text-white border-teal-700"
                      : getLevelColor(level)
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
          <button
            onClick={handleFavoritesToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFavorites ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Heart className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`} />
            Të Preferuarat
          </button>
        </div>
      </div>

      {/* Words Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredWords.map((word) => {
            const isFavorite = favorites.some((fav) => fav._id === word._id)
            const firstExample = word.examples && word.examples.length > 0 ? word.examples[0] : null

            return (
              <div
                key={word._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-48 flex flex-col"
              >
                {/* Word Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{word.word}</h3>
                    <p className="text-gray-700 text-sm truncate">{word.translation}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => playPronunciation(word.word)}
                      className="text-gray-400 hover:text-teal-600 transition-colors p-1"
                      title="Luaj shqiptimin"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(word._id)}
                      className={`transition-colors p-1 ${
                        isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
                      }`}
                      title={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
                    >
                      <Heart className={`h-3 w-3 ${isFavorite ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(word.level)}`}>
                    {word.level}
                  </span>
                  {word.partOfSpeech && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPartOfSpeechColor(word.partOfSpeech)}`}
                    >
                      {word.partOfSpeech}
                    </span>
                  )}
                </div>

                {/* German Example */}
                {firstExample && firstExample.german && (
                  <div className="bg-teal-50 rounded-lg p-2 border border-teal-200 flex-1 overflow-hidden">
                    <p className="text-gray-800 text-xs italic line-clamp-3">"{firstExample.german}"</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {console.log(
        "[v0] Pagination check - totalPages:",
        totalPages,
        "loading:",
        loading,
        "should show:",
        totalPages > 1 && !loading,
      )}
      {totalPages > 1 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 hidden md:block">
              Faqja {currentPage} nga {totalPages}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">E mëparshme</span>
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="hidden md:inline">E ardhshme</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredWords.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 inline-block">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk u gjetën fjalë</h3>
            <p className="text-gray-600">
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
  )
}

export default Dictionary
