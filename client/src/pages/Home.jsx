"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect, useRef } from "react"
import { favoritesService } from "../services/api"
import {
  BookOpen,
  Headphones,
  Languages,
  Star,
  Play,
  Heart,
  Flame,
  TrendingUp,
  Award,
  Trophy,
  PenBox,
  LockIcon,
  BrainCircuit,
  Mountain,
} from "lucide-react"

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth()
  const [favoriteCount, setFavoriteCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavoriteCount()
    }
  }, [isAuthenticated, user])

  const fetchFavoriteCount = async () => {
    try {
      const response = await favoritesService.getFavorites({ limit: 10 })
      const favoriteWords = Array.isArray(response.data) ? response.data : response.data.favorites || []
      setFavoriteCount(favoriteWords.length)
    } catch (error) {
      // console.error("Error fetching favorite count:", error)
      setFavoriteCount(0)
    }
  }

  const features = [
  {
    icon: Headphones,
    title: "Praktikë Dëgjimi",
    path: "/listen",
    bgImage: "/images/listenCarousel.png",
  },
  {
    icon: PenBox,
    title: "Fraza",
    path: "/phrases",
    bgImage: "/images/phrasesCarousel.png",
  },
  {
    icon: LockIcon,
    title: "Teste te nivelit",
    path: "/dictionary",
    bgImage: "/images/testsCarousel.png",
  },
  {
    icon: BrainCircuit,
    title: "Kuize",
    path: "/quizes",
    bgImage: "/images/quizesCarousel.png",
  },
  {
    icon: Mountain,
    title: "Plani",
    path: "/plan",
    bgImage: "/images/planCarousel.png",
  },
  {
    icon: BookOpen,
    title: "Fjalor",
    path: "/dictionary",
    bgImage: "/images/dictionaryCarousel.png",
  },
  {
    icon: Trophy,
    title: "Renditja",
    path: "/leaderboard",
    bgImage: "/images/leaderboardCarousel.png",
  },
];

  const quickStats = [
    {
      icon: Star,
      label: "Pikë XP",
      value: user?.xp || 0,
      bgColor: "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]",
      textColor: "text-[#D97706]",
      iconColor: "text-[#F59E0B]",
    },
    {
      icon: Flame,
      label: "Ditë Rresht",
      value: user?.streakCount || 0,
      bgColor: "bg-gradient-to-br from-[#FED7AA] to-[#FDBA74]",
      textColor: "text-[#EA580C]",
      iconColor: "text-[#F97316]",
    },
    {
      icon: Award,
      label: "Niveli",
      value: user?.level || "0",
      bgColor: "bg-gradient-to-br from-[#DDD6FE] to-[#C4B5FD]",
      textColor: "text-[#7C3AED]",
      iconColor: "text-[#8B5CF6]",
    },
    {
      icon: Heart,
      label: "Fjalë të Mësuara",
      value: favoriteCount,
      bgColor: "bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4]",
      textColor: "text-[#DB2777]",
      iconColor: "text-[#EC4899]",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none opacity-30 hidden lg:block">
          <div className="relative h-full flex items-end justify-center pb-8">
            <div
              className="absolute bottom-0 w-12 h-32 bg-gradient-to-b from-[#92400E] to-[#78350F] rounded-t-lg shadow-lg"
              style={{ left: "50%", transform: "translateX(-50%)" }}
            ></div>

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-32 h-32">
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#10B981] to-[#059669] rounded-full animate-[sway_3s_ease-in-out_infinite] shadow-xl"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="absolute inset-2 bg-gradient-to-b from-[#34D399] to-[#10B981] rounded-full animate-[sway_3s_ease-in-out_infinite]"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>

            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-40 h-40">
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#10B981] to-[#059669] rounded-full animate-[sway_4s_ease-in-out_infinite] shadow-xl"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>

            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-28 h-28">
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#34D399] to-[#10B981] rounded-full animate-[sway_3.5s_ease-in-out_infinite] shadow-lg shadow-orange-500/50"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full">
              <div
                className="absolute bottom-12 left-8 w-3 h-3 bg-gradient-to-t from-[#F97316] to-[#FBBF24] rounded-full animate-[float_2s_ease-in-out_infinite] opacity-80 shadow-lg shadow-orange-500/50"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="absolute bottom-16 right-8 w-2 h-2 bg-gradient-to-t from-[#EF4444] to-[#F97316] rounded-full animate-[float_2.5s_ease-in-out_infinite] opacity-90 shadow-lg shadow-red-500/50"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute bottom-20 left-12 w-2.5 h-2.5 bg-gradient-to-t from-[#FB923C] to-[#FCD34D] rounded-full animate-[float_3s_ease-in-out_infinite] opacity-75 shadow-lg shadow-orange-400/50"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute bottom-24 right-12 w-2 h-2 bg-gradient-to-t from-[#DC2626] to-[#F97316] rounded-full animate-[float_2.2s_ease-in-out_infinite] opacity-85 shadow-lg shadow-red-600/50"
                style={{ animationDelay: "1.5s" }}
              ></div>
              <div
                className="absolute bottom-28 left-16 w-3 h-3 bg-gradient-to-t from-[#F59E0B] to-[#FDE047] rounded-full animate-[float_2.8s_ease-in-out_infinite] opacity-70 shadow-lg shadow-amber-500/50"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full">
              <div
                className="absolute bottom-16 left-4 text-2xl animate-[floatHeart_4s_ease-in-out_infinite] opacity-70 drop-shadow-lg"
                style={{ animationDelay: "0s" }}
              >
                💖
              </div>
              <div
                className="absolute bottom-32 right-4 text-xl animate-[floatHeart_5s_ease-in-out_infinite] opacity-60 drop-shadow-lg"
                style={{ animationDelay: "1s" }}
              >
                💖
              </div>
              <div
                className="absolute bottom-24 left-20 text-lg animate-[floatHeart_4.5s_ease-in-out_infinite] opacity-65 drop-shadow-lg"
                style={{ animationDelay: "2s" }}
              >
                💖
              </div>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-radial from-[#FB923C] via-[#F97316] to-transparent rounded-full animate-[pulse_2s_ease-in-out_infinite] opacity-50 blur-sm"></div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold text-gray-900">
              Mësoni Gjermanisht
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2">
                Në Mënyrë Efektive
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700">
              Zotëroni gjermanishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar.
              Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/translate"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-12 px-8 font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                >
                  <Play className="h-5 w-5" />
                  Vazhdo Mësimin
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-white hover:bg-gray-50 text-blue-600 h-12 px-8 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <TrendingUp className="h-5 w-5" />
                  Shiko Progresin
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-12 px-8 font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                >
                  Fillo Falas
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 bg-white hover:bg-gray-50 text-blue-600 h-12 px-8 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Hyr
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && user && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border-2 border-gray-200 p-6 shadow-xl shadow-gray-100/50">
            <div className="mb-6 flex items-center gap-3">
              <div className="text-4xl">👋</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Mirë se vini përsëri, {user.firstName || user.emri || "//"}!
                </h2>
                <p className="text-sm text-gray-600">Vazhdoni progresin tuaj të shkëlqyer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                const isStreak = stat.label === "Ditë Rresht"
                const isXP = stat.label === "Pikë XP"
                const isLevel = stat.label === "Niveli"
                const isHeart = stat.label === "Fjalë të Mësuara"

                return (
                  <div
                    key={index}
                    className={`rounded-xl ${stat.bgColor} p-6 text-center transition-transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl`}
                  >
                    <div className="mb-3 flex justify-center">
                      {isStreak && (
                        <div className="relative">
                          <div className="absolute inset-0 animate-[fireGlow_1.5s_ease-in-out_infinite]">
                            <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                          </div>
                          <Icon
                            className={`h-6 w-6 ${stat.iconColor} relative animate-[fireFlicker_0.8s_ease-in-out_infinite]`}
                          />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FBBF24] rounded-full animate-[spark_1.2s_ease-in-out_infinite] shadow-lg shadow-yellow-400/50"></div>
                          <div
                            className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-[spark_1.5s_ease-in-out_infinite] shadow-lg shadow-red-500/50"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      )}
                      {isXP && (
                        <div className="relative animate-[starShine_2s_ease-in-out_infinite]">
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                          <div className="absolute inset-0 animate-[starPulse_2s_ease-in-out_infinite]">
                            <Icon className={`h-6 w-6 ${stat.iconColor} opacity-50`} />
                          </div>
                        </div>
                      )}
                      {isLevel && (
                        <div className="relative animate-[awardBounce_2s_ease-in-out_infinite]">
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                          <div className="absolute -inset-1 bg-[#8B5CF6] rounded-full opacity-20 animate-[awardGlow_2s_ease-in-out_infinite]"></div>
                        </div>
                      )}
                      {isHeart && (
                        <div className="relative">
                          <Icon className={`h-6 w-6 ${stat.iconColor} animate-[heartBeat_1.5s_ease-in-out_infinite]`} />
                          <div className="absolute inset-0 animate-[heartPulse_1.5s_ease-in-out_infinite]">
                            <Icon className={`h-6 w-6 ${stat.iconColor} opacity-30`} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
                    <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feature Boxes - Small cards with background images */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={index}
                to={isAuthenticated ? feature.path : "/signin"}
                className="group relative overflow-hidden rounded-2xl h-32 sm:h-40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${feature.bgImage})`,
                  }}
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base text-center drop-shadow-lg">
                    {feature.title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-xl shadow-teal-100/30 border-2 border-[#99F6E4] transition-transform hover:scale-105">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4]">
              <Languages className="h-8 w-8 text-[#0D9488]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Mësim Interaktiv</h3>
            <p className="text-gray-700">Angazhohuni me përmbajtje dinamike dhe ushtrime praktike</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-xl shadow-teal-100/30 border-2 border-[#99F6E4] transition-transform hover:scale-105">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4]">
              <TrendingUp className="h-8 w-8 text-[#0D9488]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Gjurmoni Progresin</h3>
            <p className="text-gray-700">Monitoroni zhvillimin tuaj me statistika të detajuara</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-xl shadow-teal-100/30 border-2 border-[#99F6E4] transition-transform hover:scale-105 sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4]">
              <Star className="h-8 w-8 text-[#0D9488]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Mësim i Personalizuar</h3>
            <p className="text-gray-700">Përshtateni eksperiencën tuaj sipas nivelit dhe qëllimeve tuaja</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home