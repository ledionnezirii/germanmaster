"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Medal, Crown, Star, Flame, Users } from "lucide-react"
import { io } from "socket.io-client"
import { motion } from "framer-motion"
import api, { SOCKET_URL } from "../services/api"

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState("weekly")

  const fetchLeaderboard = useCallback(async (period) => {
    setLoading(true)
    try {
      const response = await api.get(`/leaderboard/${period}`)
      setLeaderboardData(response.data)
    } catch (error) {
      console.error(`Gabim gjatë marrjes së leaderboard (${period}):`, error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard(timeFrame)

    const socket = io(SOCKET_URL)

    socket.on("connect", () => {
      console.log("Lidhur me serverin WebSocket:", socket.id)
      socket.emit("requestLeaderboard", { timeFrame, limit: 10 })
    })

    socket.on("leaderboardUpdate", (update) => {
      if (update.type === timeFrame) {
        setLeaderboardData(update.data)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [timeFrame, fetchLeaderboard])

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getLevelColor = (level) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-orange-100 text-orange-800",
      C1: "bg-red-100 text-red-800",
      C2: "bg-purple-100 text-purple-800",
    }
    return colors[level] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const topThree = leaderboardData.slice(0, 3)
  const podiumUsers = [topThree[1], topThree[0], topThree[2]].filter(Boolean)

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Tabela e Renditjes
            </h1>
            <p className="text-gray-600">Shiko si renditesh krahas përdoruesve të tjerë</p>
          </div>
          <div className="flex gap-2">
            {[
              { key: "weekly", label: "Javore" },
              { key: "monthly", label: "Mujore" },
              { key: "all-time", label: "Gjithë kohës" },
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setTimeFrame(period.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFrame === period.key
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podium */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Performuesit Kryesorë</h2>
        <div className="flex justify-center items-end gap-8">
          {podiumUsers.map((user, index) => {
            const heights = ["h-24", "h-32", "h-20"]
            const podiumHeightIndex = user.rank === 1 ? 1 : user.rank === 2 ? 0 : 2

            return (
              <motion.div
                key={user.rank}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, type: "spring", stiffness: 120 }}
                className="flex flex-col items-center"
              >
                <div className="mb-1">
                  {user.rank === 1 ? <Crown className="h-8 w-8 text-yellow-400" /> : user.rank === 2 ? <Medal className="h-8 w-8 text-gray-400" /> : <Trophy className="h-8 w-8 text-amber-600" />}
                </div>
                <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className={`${
                    user.rank === 1 ? "w-20 h-20" : "w-16 h-16"
                  } rounded-full border-4 shadow-lg ${
                    user.rank === 1 ? "border-yellow-400" : "border-gray-300"
                  }`}
                />
                <div
                  className={`${heights[podiumHeightIndex]} w-16 mt-2 rounded-t-xl flex items-center justify-center text-white font-bold bg-gradient-to-t ${
                    user.rank === 1
                      ? "from-yellow-400 to-yellow-500"
                      : user.rank === 2
                      ? "from-gray-300 to-gray-400"
                      : "from-amber-500 to-amber-600"
                  }`}
                >
                  {user.rank}
                </div>
                <p className="mt-2 text-sm font-semibold">{user.name.split(" ")[0]}</p>
                <p className="text-xs text-gray-600">{user.xp} XP</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Full Rankings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Renditja e Plotë
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {leaderboardData.map((user, index) => (
            <motion.div
              key={user.rank}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          user.level
                        )}`}
                      >
                        Niveli {user.level}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-500">{user.streak} ditë</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">{user.xp}</span>
                  </div>
                  <p className="text-xs text-gray-500">Pikë XP</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
