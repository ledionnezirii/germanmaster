"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
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
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: Languages,
      title: "Translation",
      description: "Practice reading comprehension with translation exercises",
      path: "/translate",
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      icon: BookOpen,
      title: "Dictionary",
      description: "Explore German vocabulary organized by difficulty levels",
      path: "/dictionary",
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: MessageCircle,
      title: "Grammar Chat",
      description: "Interactive grammar practice with AI assistance",
      path: "/chat",
      color: "bg-orange-500",
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Learn German
              <span className="text-teal-600 block">Effectively</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master German through interactive lessons, listening exercises, and personalized practice. Start your
              journey to fluency today.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/listen"
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Continue Learning
                </Link>
                <Link
                  to="/account"
                  className="border border-teal-600 text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                >
                  View Progress
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/signup"
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/signin"
                  className="border border-teal-600 text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome back, {user?.firstName || "Learner"}!</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Learn German</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive platform offers multiple learning methods to help you master German at your own pace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Link
                key={index}
                to={isAuthenticated ? feature.path : "/signin"}
                className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-teal-300"
              >
                <div
                  className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`h-6 w-6 ${feature.textColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <div className="flex items-center text-teal-600 text-sm font-medium">
                  Start Learning
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your German Journey?</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already improving their German skills with our platform.
          </p>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
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
