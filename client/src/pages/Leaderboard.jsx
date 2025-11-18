"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Crown, Zap, Medal } from 'lucide-react'
import { io } from "socket.io-client"
import { motion } from "framer-motion"
import api, { SOCKET_URL, generateDicebearUrl } from "../services/api"
import { Flame } from 'lucide-react'

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFrame] = useState("all-time")

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  const topThree = leaderboardData.slice(0, 3)
  const remainingUsers = leaderboardData.slice(3)

  return (
    <div className="w-full space-y-4 p-3 sm:p-6 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
              <span>Tabela e Renditjes</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Shiko si renditesh krahas përdoruesve të tjerë.
            </p>
          </div>
          <div className="flex gap-2">
            {/* <button
              onClick={() => setTimeFrame("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFrame === "weekly"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Javore
            </button> */}
            {/* <button
              onClick={() => setTimeFrame("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFrame === "monthly"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Mujore
            </button> */}
            <button
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all bg-teal-500 text-white shadow-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Gjithë kohës
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2
          className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 text-center"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Performuesit Kryesorë
        </h2>

        {topThree.length >= 3 && (
          <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0, type: "spring", stiffness: 120 }}
              className="flex flex-col items-center"
            >
              <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mb-2" />
              <div className="relative mb-3">
                <img
                  src={generateDicebearUrl(topThree[1]?._id, topThree[1]?.avatarStyle || "adventurer")}
                  alt={topThree[1]?.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-gray-300 object-cover"
                />
              </div>
              <div className="bg-gray-200 w-16 sm:w-20 h-20 sm:h-24 rounded-t-xl flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                  2
                </span>
              </div>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[1]?.name}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[1]?.xp?.toLocaleString()} XP
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
              className="flex flex-col items-center -mt-2 sm:-mt-4"
            >
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500 mb-2" />
              <div className="relative mb-3">
                <img
                  src={generateDicebearUrl(topThree[0]?._id, topThree[0]?.avatarStyle || "adventurer")}
                  alt={topThree[0]?.name}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 object-cover shadow-lg"
                />
              </div>
              <div className="bg-gradient-to-b from-yellow-300 to-yellow-400 w-16 sm:w-24 h-24 sm:h-32 rounded-t-xl flex items-center justify-center shadow-md">
                <span className="text-4xl sm:text-5xl font-bold text-yellow-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                  1
                </span>
              </div>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base font-bold text-gray-900 line-clamp-2" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[0]?.name}
              </p>
              <p className="text-xs sm:text-sm text-teal-600 font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[0]?.xp?.toLocaleString()} XP
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
              className="flex flex-col items-center"
            >
              <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400 mb-2" />
              <div className="relative mb-3">
                <img
                  src={generateDicebearUrl(topThree[2]?._id, topThree[2]?.avatarStyle || "adventurer")}
                  alt={topThree[2]?.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-pink-300 object-cover"
                />
              </div>
              <div className="bg-pink-200 w-16 sm:w-20 h-16 sm:h-20 rounded-t-xl flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-pink-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                  3
                </span>
              </div>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[2]?.name}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                {topThree[2]?.xp?.toLocaleString()} XP
              </p>
            </motion.div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2
            className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
            Renditja e Plotë
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="px-4 sm:px-6 py-3 bg-gray-50">
            <div
              className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="w-6 sm:w-8">Vendi</span>
                <span>Përdoruesi</span>
              </div>
              <span>XP</span>
            </div>
          </div>

          {remainingUsers.map((user, index) => (
            <motion.div
              key={user.rank}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <div className="w-6 sm:w-8 text-center flex-shrink-0">
                    <span className="text-base sm:text-lg font-semibold text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {user.rank}
                    </span>
                  </div>
                  <img
                    src={generateDicebearUrl(user._id, user.avatarStyle || "adventurer")}
                    alt={user.name}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{user.streak} ditë streak</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-xs sm:text-base text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
                    {user.xp?.toLocaleString()}
                  </span>
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
