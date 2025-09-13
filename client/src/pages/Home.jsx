"use client"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { favoritesService } from "../services/api"
import {
  BookOpen,
  Headphones,
  Languages,
  MessageCircle,
  Star,
  TrendingUp,
  ArrowRight,
  Play,
  Award,
  Target,
  Zap,
  Heart,
} from "lucide-react"

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth()
  const [favoriteWords, setFavoriteWords] = useState([])
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavoriteWords()
    }
  }, [isAuthenticated, user])

  const fetchFavoriteWords = async () => {
    try {
      setLoadingFavorites(true)
      const response = await favoritesService.getFavorites({ limit: 10 })
      const favoriteWords = response.data.favorites || response.data || []
      setFavoriteWords(favoriteWords)
      setFavoriteCount(favoriteWords.length)
    } catch (error) {
      console.error("Error fetching favorite words:", error)
      setFavoriteWords([])
      setFavoriteCount(0)
    } finally {
      setLoadingFavorites(false)
    }
  }

  const features = [
    {
      icon: Headphones,
      title: "Praktikë Dëgjimi",
      description: "Përmirësoni aftësitë tuaja të dëgjimit në gjermanisht me ushtrime audio",
      path: "/listen",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: Languages,
      title: "Përkthim",
      description: "Praktikoni kuptimin e leximit me ushtrime përkthimi",
      path: "/translate",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      icon: BookOpen,
      title: "Fjalor",
      description: "Eksploroni fjalorin gjermanisht të organizuar sipas niveleve të vështirësisë",
      path: "/dictionary",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "Bisedë Gramatikore",
      description: "Praktikë interaktive e gramatikës me ndihmën e AI",
      path: "/chat",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ]

  const quickStats = [
    { icon: Star, label: "Pikë XP", value: user?.xp || 0, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    {
      icon: TrendingUp,
      label: "Ditë Rresht",
      value: user?.streakCount || 0,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    { icon: Award, label: "Niveli", value: user?.level || "Fillestar", color: "text-blue-600", bgColor: "bg-blue-50" },
    {
      icon: Heart,
      label: "Fjalë të Mësuara",
      value: favoriteCount,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Duke ngarkuar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl text-balance">
              Mësoni Gjermanisht
              <span className="block text-teal-600">Në Mënyrë Efektive</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600 text-pretty">
              Zotëroni gjermanishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar.
              Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/listen"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 h-12 px-8 py-3 shadow-lg hover:shadow-xl"
                >
                  <Play className="h-5 w-5" />
                  Vazhdo Mësimin
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-teal-200 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 h-12 px-8 py-3"
                >
                  <Target className="h-5 w-5" />
                  Shiko Progresin
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-10 px-8 py-3"
                >
                  Fillo Falas
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-teal-50 hover:text-teal-700 h-10 px-8 py-3"
                >
                  Hyr
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section - Only for authenticated users */}
      {isAuthenticated && user && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                <Zap className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mirë se vini përsëri, {user.firstName || user.emri || "Nxënës"}!
                </h2>
                <p className="text-gray-600">Vazhdoni progresin tuaj të shkëlqyer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className={`rounded-xl ${stat.bgColor} p-4 text-center transition-transform hover:scale-105`}
                  >
                    <div className="mb-3 flex justify-center">
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && user && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Fjalët e Mësuara</h2>
                <p className="text-gray-600">Fjalët që keni shënuar si të preferuara</p>
              </div>
            </div>

            {loadingFavorites ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : favoriteWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteWords.slice(0, 6).map((favorite, index) => {
                  const word = favorite.wordId || favorite
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                      </div>
                      <p className="text-gray-700 mb-2">{word.translation}</p>
                      {word.level && (
                        <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                          {word.level}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Asnjë fjalë e preferuar</h3>
                <p className="text-gray-600 mb-4">Filloni të shtoni fjalë në listën tuaj të preferuarve</p>
                <Link
                  to="/dictionary"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Shko te Fjalori
                </Link>
              </div>
            )}

            {favoriteWords.length > 6 && (
              <div className="mt-6 text-center">
                <Link
                  to="/dictionary"
                  className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 font-medium"
                >
                  Shiko të gjitha fjalët e preferuara
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 text-balance">
            Gjithçka që Ju Duhet për të Mësuar Gjermanisht
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 text-pretty">
            Platforma jonë gjithëpërfshirëse ofron metoda të shumta mësimi për t'ju ndihmuar të zotëroni gjermanishten
            me ritmin tuaj.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={index}
                to={isAuthenticated ? feature.path : "/signin"}
                className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md"
              >
                <div className="mb-4">
                  <div
                    className={`${feature.bgColor} mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110`}
                  >
                    <Icon className={`h-6 w-6 ${feature.textColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <div>
                  <p className="mb-4 text-sm text-gray-600">{feature.description}</p>
                  <div className="flex items-center text-sm font-medium text-teal-600">
                    Fillo Mësimin
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-teal-600 py-16 text-white">
        <div className="mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">Gati për të Filluar Udhëtimin Tuaj Gjerman?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-teal-100">
            Bashkohuni me mijëra nxënës që tashmë po përmirësojnë aftësitë e tyre në gjermanisht me platformën tonë.
          </p>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-teal-600 hover:bg-gray-100 h-10 px-8 py-3"
            >
              Fillo Sot
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
