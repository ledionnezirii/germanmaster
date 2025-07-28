"use client"

import { useState, useEffect } from "react"
import { dictionaryService, favoritesService } from "../services/api"
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

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "A2":
        return "bg-emerald-200 text-emerald-800 border-emerald-300"
      case "B1":
        return "bg-blue-200 text-blue-800 border-blue-300"
      case "B2":
        return "bg-blue-300 text-blue-800 border-blue-400"
      case "C1":
        return "bg-purple-400 text-white border-purple-500"
      case "C2":
        return "bg-purple-600 text-white border-purple-700"
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      ? "bg-blue-600 text-white border-blue-700"
                      : getLevelColor(level)
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word) => {
            const isFavorite = favorites.some((fav) => fav._id === word._id)
            const firstExample = word.examples && word.examples.length > 0 ? word.examples[0] : null

            return (
              <div
                key={word._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Word Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{word.word}</h3>
                    <p className="text-gray-700 text-lg">{word.translation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playPronunciation(word.word)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Luaj shqiptimin"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(word._id)}
                      className={`transition-colors p-1 ${
                        isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
                      }`}
                      title={isFavorite ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(word.level)}`}>
                    {word.level}
                  </span>
                  {word.partOfSpeech && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPartOfSpeechColor(word.partOfSpeech)}`}
                    >
                      {word.partOfSpeech}
                    </span>
                  )}
                </div>

                {/* German Example */}
                {firstExample && firstExample.german && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-800 text-sm italic">"{firstExample.german}"</p>
                  </div>
                )}
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
