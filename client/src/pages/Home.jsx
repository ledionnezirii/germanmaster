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
      const favoriteWords = Array.isArray(response.data) ? response.data : response.data.favorites || []
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
      value: user?.level || "C1",
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
      <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-white to-[#F0FDFA] border-b border-[#99F6E4] relative overflow-hidden">
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
                className="absolute inset-0 bg-gradient-to-b from-[#34D399] to-[#10B981] rounded-full animate-[sway_3.5s_ease-in-out_infinite] shadow-lg"
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

            {/* Floating hearts */}
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
              <span className="block bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] bg-clip-text text-transparent mt-2">
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
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white hover:from-[#0D9488] hover:to-[#0891B2] h-12 px-8 font-medium shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl hover:shadow-teal-500/40"
                >
                  <Play className="h-5 w-5" />
                  Vazhdo Mësimin
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#14B8A6] bg-white hover:bg-[#F0FDFA] text-[#0D9488] h-12 px-8 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <TrendingUp className="h-5 w-5" />
                  Shiko Progresin
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white hover:from-[#0D9488] hover:to-[#0891B2] h-12 px-8 font-medium shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl hover:shadow-teal-500/40"
                >
                  Fillo Falas
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-full border-2 border-[#14B8A6] bg-white hover:bg-[#F0FDFA] text-[#0D9488] h-12 px-8 font-medium transition-all shadow-md hover:shadow-lg"
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
          <div className="rounded-2xl bg-white border-2 border-[#99F6E4] p-6 shadow-xl shadow-teal-100/50">
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

      {/* Favorite Words Section */}
      {isAuthenticated && user && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border-2 border-[#FBCFE8] p-6 shadow-xl shadow-pink-100/50">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] shadow-lg">
                <Heart className="h-6 w-6 text-[#EC4899]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fjalët e Mësuara</h2>
                <p className="text-sm text-gray-600">Fjalët që keni shënuar si të mësuara</p>
              </div>
            </div>

            {loadingFavorites ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC4899]"></div>
              </div>
            ) : favoriteWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteWords.slice(0, 6).map((favorite, index) => {
                  const word = favorite.wordId || favorite
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] rounded-xl p-4 border-2 border-[#EC4899] border-opacity-30 hover:shadow-lg hover:border-opacity-50 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                        <Heart className="h-5 w-5 text-[#EC4899] fill-current drop-shadow-sm" />
                      </div>
                      <p className="text-gray-800 mb-2 font-medium">{word.translation}</p>
                      {word.level && (
                        <span className="inline-block px-2 py-1 bg-white/80 text-[#14B8A6] text-xs font-medium rounded-full shadow-sm">
                          {word.level}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-[#EC4899] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Asnjë fjalë e mësuara</h3>
                <p className="text-gray-600 mb-4">Filloni të shtoni fjalë në listën tuaj</p>
                <Link
                  to="/dictionary"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white rounded-full hover:from-[#0D9488] hover:to-[#0891B2] transition-all shadow-lg shadow-teal-500/30"
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-[#14B8A6] hover:text-[#0D9488] font-medium transition-colors"
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
                className="group block rounded-xl border-2 border-[#99F6E4] bg-white p-6 shadow-lg shadow-teal-100/50 transition-all duration-200 hover:border-[#5EEAD4] hover:shadow-xl hover:shadow-teal-200/50"
              >
                <div className="mb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4] transition-transform group-hover:scale-110 shadow-md">
                    <Icon className="h-6 w-6 text-[#0D9488]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <div>
                  <p className="mb-4 text-sm text-gray-700">{feature.description}</p>
                  <div className="flex items-center text-sm font-medium text-[#14B8A6]">
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
        <div className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] py-16 text-white shadow-2xl">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold drop-shadow-lg">Gati për të Filluar Udhëtimin Tuaj Gjerman?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg opacity-95 drop-shadow-md">
              Bashkohuni me mijëra nxënës që tashmë po përmirësojnë aftësitë e tyre në gjermanisht me platformën tonë.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0D9488] hover:bg-[#F0FDFA] h-12 px-8 font-medium shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Fillo Sot
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(8px) rotate(2deg); }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-60px) translateX(10px);
            opacity: 1;
          }
          90% {
            opacity: 0.3;
          }
        }
        
        @keyframes floatHeart {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-80px) scale(1.2);
            opacity: 0.9;
          }
          90% {
            opacity: 0.2;
          }
        }
        
        @keyframes fireFlicker {
          0%, 100% { 
            transform: scale(1) translateY(0);
            filter: brightness(1) drop-shadow(0 0 4px currentColor);
          }
          25% { 
            transform: scale(1.15) translateY(-2px);
            filter: brightness(1.4) drop-shadow(0 0 8px currentColor);
          }
          50% { 
            transform: scale(0.95) translateY(1px);
            filter: brightness(0.9) drop-shadow(0 0 2px currentColor);
          }
          75% { 
            transform: scale(1.1) translateY(-1px);
            filter: brightness(1.3) drop-shadow(0 0 6px currentColor);
          }
        }
        
        @keyframes fireGlow {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1.2);
            filter: blur(4px);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.5);
            filter: blur(6px);
          }
        }
        
        @keyframes spark {
          0%, 100% { 
            opacity: 0;
            transform: scale(0);
          }
          50% { 
            opacity: 1;
            transform: scale(2);
          }
        }
        
        @keyframes starShine {
          0%, 100% { 
            transform: rotate(0deg) scale(1);
            filter: drop-shadow(0 0 2px currentColor);
          }
          50% { 
            transform: rotate(180deg) scale(1.15);
            filter: drop-shadow(0 0 6px currentColor);
          }
        }
        
        @keyframes starPulse {
          0%, 100% { 
            transform: scale(1.2);
            opacity: 0.5;
          }
          50% { 
            transform: scale(1.6);
            opacity: 0;
          }
        }
        
        @keyframes awardBounce {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
          }
          25% { 
            transform: translateY(-5px) rotate(-8deg);
          }
          75% { 
            transform: translateY(-3px) rotate(8deg);
          }
        }
        
        @keyframes awardGlow {
          0%, 100% { 
            transform: scale(1.2);
            opacity: 0.2;
          }
          50% { 
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        @keyframes heartBeat {
          0%, 100% { 
            transform: scale(1);
          }
          10% { 
            transform: scale(1.25);
          }
          20% { 
            transform: scale(1);
          }
          30% { 
            transform: scale(1.2);
          }
          40% { 
            transform: scale(1);
          }
        }
        
        @keyframes heartPulse {
          0%, 100% { 
            transform: scale(1.2);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
