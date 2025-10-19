"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Flame,
  Star,
  Crown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Zap,
} from "lucide-react"

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("all-time")
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null)

  const usersPerPage = 10

  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab, currentPage])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("authToken")
      const limit = 100 // Fetch more users for pagination

      let endpoint = ""
      switch (activeTab) {
        case "weekly":
          endpoint = `/api/leaderboard/weekly?limit=${limit}`
          break
        case "monthly":
          endpoint = `/api/leaderboard/monthly?limit=${limit}`
          break
        default:
          endpoint = `/api/leaderboard/all-time?limit=${limit}`
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setLeaderboardData(response.data.data || [])
    } catch (err) {
      console.error("Error fetching leaderboard:", err)
      setError("Dështoi ngarkimi i të dhënave të renditjes")
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-yellow-500" />
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-500" />
    if (rank === 3) return <Award className="w-8 h-8 text-orange-500" />
    return null
  }

  const getRankBgColor = (rank) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200"
    if (rank === 2) return "bg-gray-50 border-gray-200"
    if (rank === 3) return "bg-orange-50 border-orange-200"
    return "bg-white border-gray-100"
  }

  const topThreeUsers = leaderboardData.slice(0, 3)
  const remainingUsers = leaderboardData.slice(3)

  // Pagination logic for remaining users (after top 3)
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = remainingUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(remainingUsers.length / usersPerPage)

  const getPodiumOrder = () => {
    if (topThreeUsers.length < 3) return topThreeUsers
    return [topThreeUsers[1], topThreeUsers[0], topThreeUsers[2]]
  }

  const getPodiumHeight = (rank) => {
    if (rank === 1) return "h-48"
    if (rank === 2) return "h-40"
    if (rank === 3) return "h-32"
    return "h-32"
  }

  const getPodiumColor = (rank) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600"
    if (rank === 2) return "from-gray-300 to-gray-500"
    if (rank === 3) return "from-orange-400 to-orange-600"
    return "from-gray-200 to-gray-400"
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Icon placeholder - user will add their own icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span style={{ fontFamily: "Poppins, sans-serif" }} className="text-white text-2xl font-bold">
              {/* User's icon goes here */}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1
            style={{ fontFamily: "Poppins, sans-serif" }}
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent"
          >
            Renditja
          </h1>
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>
        <p
          style={{ fontFamily: "Inter, sans-serif" }}
          className="text-gray-600 flex items-center justify-center gap-2 text-lg"
        >
          <TrendingUp className="w-5 h-5" />
          Shiko se si renditet kundrejt nxënësve të tjerë
          <Star className="w-5 h-5" />
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8 border-b border-gray-200 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChange("all-time")}
          style={{ fontFamily: "Inter, sans-serif" }}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            activeTab === "all-time" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Të Gjitha Kohërat
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChange("weekly")}
          style={{ fontFamily: "Inter, sans-serif" }}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            activeTab === "weekly" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Javore
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChange("monthly")}
          style={{ fontFamily: "Inter, sans-serif" }}
          className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
            activeTab === "monthly" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Mujore
        </motion.button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-blue-600"
          />
        </div>
      )}

      {error && !loading && (
        <div
          style={{ fontFamily: "Inter, sans-serif" }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && topThreeUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-end justify-center gap-4 md:gap-8 mb-8">
            {getPodiumOrder().map((user, index) => {
              const actualRank = user.rank
              const podiumPosition = actualRank === 1 ? "center" : actualRank === 2 ? "left" : "right"

              return (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className={`flex flex-col items-center ${actualRank === 1 ? "order-2" : actualRank === 2 ? "order-1" : "order-3"}`}
                >
                  <motion.div whileHover={{ scale: 1.1 }} className="relative mb-4">
                    <div className="relative">
                      <img
                        src={user.avatar || "/placeholder.svg?height=96&width=96"}
                        alt={user.name}
                        className={`rounded-full object-cover border-4 ${
                          actualRank === 1
                            ? "w-24 h-24 md:w-32 md:h-32 border-yellow-400"
                            : actualRank === 2
                              ? "w-20 h-20 md:w-24 md:h-24 border-gray-400"
                              : "w-20 h-20 md:w-24 md:h-24 border-orange-400"
                        }`}
                      />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2, type: "spring" }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg"
                      >
                        {getRankIcon(actualRank)}
                      </motion.div>
                    </div>
                  </motion.div>

                  <h3
                    style={{ fontFamily: "Poppins, sans-serif" }}
                    className={`font-bold text-center mb-1 ${actualRank === 1 ? "text-lg md:text-xl" : "text-base md:text-lg"}`}
                  >
                    {user.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      style={{ fontFamily: "Inter, sans-serif" }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Niveli {user.level}
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif" }}
                      className="text-sm text-gray-600 flex items-center gap-1"
                    >
                      <Flame className="w-4 h-4 text-orange-500" />
                      {user.streak}
                    </span>
                  </div>
                  <div className="text-center mb-3">
                    <div
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      className={`font-bold ${actualRank === 1 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} text-gray-900`}
                    >
                      {user.xp.toLocaleString()}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500">
                      XP
                    </div>
                  </div>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    transition={{ delay: 0.3 + index * 0.2, duration: 0.5 }}
                    className={`w-24 md:w-32 ${getPodiumHeight(actualRank)} bg-gradient-to-b ${getPodiumColor(actualRank)} rounded-t-lg flex items-center justify-center shadow-lg`}
                  >
                    <span
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      className="text-4xl md:text-6xl font-bold text-white opacity-50"
                    >
                      #{actualRank}
                    </span>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {!loading && !error && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {currentUsers.length === 0 && topThreeUsers.length === 0 ? (
                <div style={{ fontFamily: "Inter, sans-serif" }} className="text-center py-12 text-gray-500">
                  Nuk u gjetën përdorues për këtë renditje
                </div>
              ) : (
                currentUsers.map((user, index) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-white border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 flex-shrink-0 bg-gray-100 rounded-full">
                      <span style={{ fontFamily: "Poppins, sans-serif" }} className="text-lg font-bold text-gray-700">
                        #{user.rank}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      <img
                        src={user.avatar || "/placeholder.svg?height=48&width=48"}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        style={{ fontFamily: "Poppins, sans-serif" }}
                        className="font-semibold text-gray-900 truncate"
                      >
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          style={{ fontFamily: "Inter, sans-serif" }}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Niveli {user.level}
                        </span>
                        <span
                          style={{ fontFamily: "Inter, sans-serif" }}
                          className="text-sm text-gray-600 flex items-center gap-1"
                        >
                          <Flame className="w-4 h-4 text-orange-500" />
                          {user.streak} ditë
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div style={{ fontFamily: "Poppins, sans-serif" }} className="text-2xl font-bold text-gray-900">
                        {user.xp.toLocaleString()}
                      </div>
                      <div
                        style={{ fontFamily: "Inter, sans-serif" }}
                        className="text-xs text-gray-500 flex items-center justify-end gap-1"
                      >
                        <Star className="w-3 h-3" />
                        XP
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Mbrapa
              </motion.button>

              <div style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-600 font-medium">
                Faqja {currentPage} nga {totalPages}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Përpara
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default Leaderboard
