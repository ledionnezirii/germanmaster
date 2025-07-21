"use client"
import { useState, useEffect } from "react"
import { dictionaryService, favoritesService } from "../services/api" // Assuming these services are available
import { BookOpen, Volume2, Heart, Search, Filter } from "lucide-react"

const Dictionary = () => {
  const [words, setWords] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [showFavorites, setShowFavorites] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWords()
    fetchFavorites()
  }, [selectedLevel])

  const fetchWords = async () => {
    try {
      setLoading(true)
      const params = { page: 1, limit: 100 }
      if (selectedLevel !== "all") {
        params.level = selectedLevel
      }
      const response = await dictionaryService.getAllWords(params)
      setWords(response.data.words || response.data || [])
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
    utterance.lang = "de-DE" // Assuming German pronunciation
    window.speechSynthesis.speak(utterance)
  }

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFavorites = !showFavorites || favorites.some((fav) => fav._id === word._id)
    return matchesSearch && matchesFavorites
  })

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  // Consistent color scheme with Listen.jsx
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

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fjalor Gjermanisht</h1>
        <p className="text-gray-600">Eksploroni fjalorin gjermanisht të organizuar sipas niveleve të vështirësisë</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800 placeholder-gray-500"
            aria-label="Kërkoni fjalë ose përkthime"
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
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-teal-600 text-white border-teal-700"
                      : getLevelColor(level)
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
                aria-pressed={selectedLevel === level}
                aria-label={`Filtro sipas nivelit ${level === "all" ? "Të gjitha Nivelet" : level}`}
              >
                {level === "all" ? "Të gjitha Nivelet" : level}
                {selectedLevel === level && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-white/50 rounded-full text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFavorites
                ? "bg-gray-700 text-white hover:bg-gray-800" // Consistent with "Show Full Text" button
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-pressed={showFavorites}
            aria-label={showFavorites ? "Shfaq të gjitha fjalët" : "Shfaq vetëm fjalët e preferuara"}
          >
            <Heart className={`h-4 w-4 ${showFavorites ? "fill-current text-red-400" : ""}`} />{" "}
            {/* Heart color when active */}
            Vetëm të Preferuarat
          </button>
        </div>
      </div>

      {/* Words Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>{" "}
          {/* Consistent spinner color */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((word) => {
            const isFavorite = favorites.some((fav) => fav._id === word._id)
            return (
              <div
                key={word._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playPronunciation(word.word)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label={`Luaj shqiptimin për ${word.word}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(word._id)}
                      className={`transition-colors p-1 ${
                        isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
                      }`}
                      aria-label={
                        isFavorite ? `Hiq ${word.word} nga të preferuarat` : `Shto ${word.word} te të preferuarat`
                      }
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{word.translation}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(word.level)}`}>
                    {word.level}
                  </span>
                </div>
              </div>
            )
          })}
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
