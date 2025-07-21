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
      title: "Listening Practice",
      description: "Improve your German listening skills with audio exercises",
      path: "/listen",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: Languages,
      title: "Translation",
      description: "Practice reading comprehension with translation exercises",
      path: "/translate",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      icon: BookOpen,
      title: "Dictionary",
      description: "Explore German vocabulary organized by difficulty levels",
      path: "/dictionary",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "Grammar Chat",
      description: "Interactive grammar practice with AI assistance",
      path: "/chat",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ]

  const quickStats = [
    { icon: Star, label: "XP Points", value: stats.xp, color: "text-yellow-600" },
    { icon: TrendingUp, label: "Day Streak", value: stats.streak, color: "text-green-600" },
    { icon: Clock, label: "Lessons", value: stats.completedLessons, color: "text-blue-600" },
    { icon: BookOpen, label: "Words", value: stats.wordsLearned, color: "text-purple-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Learn German
              <span className="block text-teal-600">Effectively</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Master German through interactive lessons, listening exercises, and personalized practice. Start your
              journey to fluency today.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/listen"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-10 px-8 py-3"
                >
                  <Play className="h-5 w-5" />
                  Continue Learning
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-teal-50 hover:text-teal-700 h-10 px-8 py-3"
                >
                  View Progress
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-10 px-8 py-3"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-teal-50 hover:text-teal-700 h-10 px-8 py-3"
                >
                  Sign In
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
            <div className="mb-4 text-xl font-bold text-gray-900">Welcome back, {user?.firstName || "Learner"}!</div>
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
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Everything You Need to Learn German</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Our comprehensive platform offers multiple learning methods to help you master German at your own pace.
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
                    Start Learning
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
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Your German Journey?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-teal-100">
            Join thousands of learners who are already improving their German skills with our platform.
          </p>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-teal-600 hover:bg-gray-100 h-10 px-8 py-3"
            >
              Get Started Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
