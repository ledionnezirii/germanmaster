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
  Sparkles,
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
      const limit = 100

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

  const topThreeUsers = leaderboardData.slice(0, 3)
  const remainingUsers = leaderboardData.slice(3)

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = remainingUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(remainingUsers.length / usersPerPage)

  const getPodiumOrder = () => {
    if (topThreeUsers.length < 3) return topThreeUsers
    return [topThreeUsers[1], topThreeUsers[0], topThreeUsers[2]]
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
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-yellow-200/40 to-orange-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-br from-pink-200/40 to-purple-300/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-cyan-300/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-lg" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Renditja
          </h1>
          <p className="text-lg text-gray-700 flex items-center justify-center gap-2 font-medium">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Shiko se si renditet kundrejt nxënësve të tjerë
            <Sparkles className="w-5 h-5 text-purple-500" />
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex gap-3 mb-10 justify-center flex-wrap"
        >
          {[
            { key: "all-time", label: "Të Gjitha Kohërat", icon: Trophy },
            { key: "weekly", label: "Javore", icon: Calendar },
            { key: "monthly", label: "Mujore", icon: Clock },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange(tab.key)}
              className={`relative px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
              }`}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Trophy className="w-12 h-12 text-purple-500" />
            </motion.div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-center max-w-md mx-auto shadow-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Podium */}
        {!loading && !error && topThreeUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {getPodiumOrder().map((user, index) => {
                const actualRank = user.rank
                const isWinner = actualRank === 1

                return (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className={`flex flex-col items-center ${
                      actualRank === 1 ? "order-2" : actualRank === 2 ? "order-1" : "order-3"
                    }`}
                  >
                    {/* Avatar */}
                    <motion.div whileHover={{ scale: 1.08 }} className="relative mb-4">
                      <div className="relative">
                        <img
                          src={user.avatar || "/placeholder.svg?height=128&width=128"}
                          alt={user.name}
                          className={`relative rounded-full object-cover border-4 shadow-xl ${
                            actualRank === 1
                              ? "w-28 h-28 md:w-32 md:h-32 border-yellow-400"
                              : actualRank === 2
                                ? "w-24 h-24 md:w-28 md:h-28 border-gray-400"
                                : "w-24 h-24 md:w-28 md:h-28 border-orange-400"
                          }`}
                        />

                        {/* Crown/Medal Icon */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.1, type: "spring", bounce: 0.5 }}
                          className={`absolute -top-2 -right-2 rounded-full p-2 shadow-lg ${
                            actualRank === 1
                              ? "bg-yellow-400"
                              : actualRank === 2
                                ? "bg-gray-300"
                                : "bg-orange-400"
                          }`}
                        >
                          {actualRank === 1 ? (
                            <Crown className="w-6 h-6 text-yellow-900" />
                          ) : actualRank === 2 ? (
                            <Medal className="w-6 h-6 text-gray-700" />
                          ) : (
                            <Award className="w-6 h-6 text-orange-900" />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* User info card */}
                    <div className={`bg-white rounded-2xl p-4 mb-4 shadow-lg ${
                      isWinner ? "border-2 border-yellow-400" : "border border-gray-200"
                    }`}>
                      <h3 className={`font-bold text-center mb-2 text-gray-900 ${
                        isWinner ? "text-xl md:text-2xl" : "text-lg md:text-xl"
                      }`}>
                        {user.name}
                      </h3>

                      <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <Zap className="w-3 h-3 mr-1" />
                          Niveli {user.level}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          <Flame className="w-3 h-3 mr-1" />
                          {user.streak} ditë
                        </span>
                      </div>

                      <div className="text-center">
                        <div className={`font-black ${
                          isWinner ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
                        } bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent`}>
                          {user.xp.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 font-medium mt-1 flex items-center justify-center gap-1">
                          <Star className="w-3 h-3" />
                          XP
                        </div>
                      </div>
                    </div>

                    {/* Podium - no numbers */}
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                      className={`w-24 md:w-32 rounded-t-2xl shadow-xl ${
                        actualRank === 1
                          ? "h-40 bg-gradient-to-b from-yellow-400 to-yellow-500"
                          : actualRank === 2
                            ? "h-32 bg-gradient-to-b from-gray-400 to-gray-500"
                            : "h-28 bg-gradient-to-b from-orange-400 to-orange-500"
                      }`}
                      style={{ transformOrigin: "bottom" }}
                    />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* User List */}
        {!loading && !error && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 max-w-4xl mx-auto"
              >
                {currentUsers.length === 0 && topThreeUsers.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-lg">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nuk u gjetën përdorues për këtë renditje</p>
                  </div>
                ) : (
                  currentUsers.map((user, index) => (
                    <motion.div
                      key={user.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-md hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank - removed # */}
                        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl font-black text-lg text-purple-700">
                          {user.rank}
                        </div>

                        {/* Avatar */}
                        <img
                          src={user.avatar || "/placeholder.svg?height=56&width=56"}
                          alt={user.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{user.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                              <Zap className="w-3 h-3 mr-1" />
                              Niveli {user.level}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700">
                              <Flame className="w-3 h-3 mr-1" />
                              {user.streak} ditë
                            </span>
                          </div>
                        </div>

                        {/* XP */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                            {user.xp.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center justify-end gap-1 font-medium">
                            <Star className="w-3 h-3" />
                            XP
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 max-w-4xl mx-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Mbrapa
                </motion.button>

                <div className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 font-semibold shadow-md">
                  Faqja {currentPage} / {totalPages}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                  }`}
                >
                  Përpara
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Leaderboard