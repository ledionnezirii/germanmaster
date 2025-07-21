"use client"
import { useState } from "react"
import { Link } from "react-router-dom" // Reverted to react-router-dom
import { useAuth } from "../context/AuthContext" // Assuming this path is correct for your project
import { BookOpen, Headphones, Languages, MessageCircle, Star, TrendingUp, Clock, ArrowRight, Play } from "lucide-react"

const Home = () => {
  const { isAuthenticated, user } = useAuth()
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    completedLessons: 0,
    wordsLearned: 0,
  })

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
    { icon: Star, label: "Pikë XP", value: stats.xp, color: "text-yellow-600" },
    { icon: TrendingUp, label: "Ditë Rresht", value: stats.streak, color: "text-green-600" },
    { icon: Clock, label: "Mësime", value: stats.completedLessons, color: "text-blue-600" },
    { icon: BookOpen, label: "Fjalë", value: stats.wordsLearned, color: "text-purple-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Mësoni Gjermanisht
              <span className="block text-teal-600">Në Mënyrë Efektive</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Zotëroni gjermanishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar.
              Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/listen"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-10 px-8 py-3"
                >
                  <Play className="h-5 w-7" />
                  Vazhdo Mësimin
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-teal-50 hover:text-teal-700 h-10 px-8 py-3"
                >
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
      {isAuthenticated && (
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-xl font-bold text-gray-900">
              Mirë se vini përsëri, {user?.firstName || "Nxënës"}!
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="mb-2 flex justify-center">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {/* Features Section */}
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Gjithçka që Ju Duhet për të Mësuar Gjermanisht</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
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
