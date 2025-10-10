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
  ArrowRight,
  Play,
  Heart,
  Flame,
  TrendingUp,
  Award,
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
      const favoriteWords = Array.isArray(response.data) 
        ? response.data 
        : response.data.favorites || []
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
    },
    {
      icon: Languages,
      title: "Përkthim",
      description: "Praktikoni kuptimin e leximit me ushtrime përkthimi",
      path: "/translate",
    },
    {
      icon: BookOpen,
      title: "Fjalor",
      description: "Eksploroni fjalorin gjermanisht të organizuar sipas niveleve të vështirësisë",
      path: "/dictionary",
    },
    {
      icon: MessageCircle,
      title: "Bisedë Gramatikore",
      description: "Praktikë interaktive e gramatikës me ndihmën e AI",
      path: "/chat",
    },
  ]

  const quickStats = [
    { 
      icon: Star, 
      label: "Pikë XP", 
      value: user?.xp || 0, 
      bgColor: "bg-[#FFF9E6]",
      textColor: "text-[#F59E0B]"
    },
    {
      icon: Flame,
      label: "Ditë Rresht",
      value: user?.streakCount || 0,
      bgColor: "bg-[#E6F9F5]",
      textColor: "text-[#16B9A5]"
    },
    { 
      icon: Award, 
      label: "Niveli", 
      value: user?.level || "C1",
      bgColor: "bg-[#EEF2FF]",
      textColor: "text-[#4F46E5]"
    },
    {
      icon: Heart,
      label: "Fjalë të Mësuara",
      value: favoriteCount,
      bgColor: "bg-[#FEE2E2]",
      textColor: "text-[#DC2626]"
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16B9A5]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold text-gray-900">
              Mësoni Gjermanisht
              <span className="block text-[#16B9A5] mt-2">Në Mënyrë Efektive</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Zotëroni gjermanishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar.
              Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/translate"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16B9A5] text-white hover:bg-[#13A594] h-12 px-8 font-medium shadow-sm transition-all"
                >
                  <Play className="h-5 w-5" />
                  Vazhdo Mësimin
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 h-12 px-8 font-medium transition-all"
                >
                  <TrendingUp className="h-5 w-5" />
                  Shiko Progresin
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#16B9A5] text-white hover:bg-[#13A594] h-12 px-8 font-medium shadow-sm transition-all"
                >
                  Fillo Falas
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 h-12 px-8 font-medium transition-all"
                >
                  Hyr
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Back Section - Only for authenticated users */}
      {isAuthenticated && user && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="text-4xl">👋</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Mirë se vini përsëri, {user.firstName || user.emri || "Ledion"}!
                </h2>
                <p className="text-sm text-gray-600">Vazhdoni progresin tuaj të shkëlqyer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className={`rounded-xl ${stat.bgColor} p-6 text-center transition-transform hover:scale-105 cursor-pointer`}
                  >
                    <div className="mb-3 flex justify-center">
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                    <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Favorite Words Section */}
      {isAuthenticated && user && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2]">
                <Heart className="h-6 w-6 text-[#DC2626]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fjalët e Mësuara</h2>
                <p className="text-sm text-gray-600">Fjalët që keni shënuar si të mësuara</p>
              </div>
            </div>

            {loadingFavorites ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16B9A5]"></div>
              </div>
            ) : favoriteWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteWords.slice(0, 6).map((favorite, index) => {
                  const word = favorite.wordId || favorite
                  return (
                    <div
                      key={index}
                      className="bg-[#FEE2E2] rounded-xl p-4 border border-[#DC2626] border-opacity-20 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                        <Heart className="h-5 w-5 text-[#DC2626] fill-current" />
                      </div>
                      <p className="text-gray-700 mb-2">{word.translation}</p>
                      {word.level && (
                        <span className="inline-block px-2 py-1 bg-[#16B9A5]/10 text-[#16B9A5] text-xs font-medium rounded-full">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Asnjë fjalë e mësuara</h3>
                <p className="text-gray-600 mb-4">Filloni të shtoni fjalë në listën tuaj</p>
                <Link
                  to="/dictionary"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#16B9A5] text-white rounded-full hover:bg-[#13A594] transition-all"
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-[#16B9A5] hover:underline font-medium"
                >
                  Shiko të gjitha fjalët e mësuara
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={index}
                to={isAuthenticated ? feature.path : "/signin"}
                className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#16B9A5]/50 hover:shadow-md"
              >
                <div className="mb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F9F5] transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6 text-[#16B9A5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <div>
                  <p className="mb-4 text-sm text-gray-600">{feature.description}</p>
                  <div className="flex items-center text-sm font-medium text-[#16B9A5]">
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
      {!isAuthenticated && (
        <div className="bg-[#16B9A5] py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold">Gati për të Filluar Udhëtimin Tuaj Gjerman?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
              Bashkohuni me mijëra nxënës që tashmë po përmirësojnë aftësitë e tyre në gjermanisht me platformën tonë.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#16B9A5] hover:bg-gray-50 h-12 px-8 font-medium shadow-sm transition-all"
            >
              Fillo Sot
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
