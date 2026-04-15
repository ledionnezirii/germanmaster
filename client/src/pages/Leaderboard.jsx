"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Crown, Zap, Medal, Flame, Clock } from "lucide-react"
import { io } from "socket.io-client"
import { motion } from "framer-motion"
import api, { SOCKET_URL, generateDicebearUrl } from "../services/api"
import { useAuth } from "../context/AuthContext"
import SEO from "../components/SEO"

const VISIBLE_ROWS = 19

const TIME_FRAMES = [
  { key: "all-time", label: "Gjithë kohës" },
  // { key: "weekly",   label: "Javore" }, // commented out — re-enable when weekly XP is ready
  { key: "monthly",  label: "Mujore" },
]

const getPeriodEnd = (type) => {
  const now = new Date()
  if (type === "weekly") {
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7
    const end = new Date(now)
    end.setDate(now.getDate() + daysUntilMonday)
    end.setHours(0, 0, 0, 0)
    return end
  }
  if (type === "monthly") {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  }
  return null
}

const useCountdown = (type) => {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    if (type !== "weekly" && type !== "monthly") { setTimeLeft(""); return }

    const update = () => {
      const end = getPeriodEnd(type)
      const diff = end - Date.now()
      if (diff <= 0) { setTimeLeft("0d 0h 0m 0s"); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [type])

  return timeLeft
}

const UserRow = ({ user, isCurrentUser, index }) => (
  <motion.div
    key={user.rank}
    initial={{ x: -50, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className={`px-4 sm:px-6 py-3 sm:py-4 transition-colors ${
      isCurrentUser
        ? "bg-teal-50 border-l-4 border-teal-400"
        : "hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center justify-between gap-2 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-6 sm:w-8 text-center flex-shrink-0">
          <span
            className={`text-base sm:text-lg font-semibold ${
              isCurrentUser ? "text-teal-600" : "text-gray-700"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {user.rank}
          </span>
        </div>
        <img
          src={generateDicebearUrl(user._id, user.avatarStyle || "adventurer")}
          alt={user.name}
          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0 bg-gray-100 border-2 ${
            isCurrentUser ? "border-teal-300" : "border-gray-200"
          }`}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=48&width=48"
          }}
        />
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-sm sm:text-base truncate flex items-center gap-1.5 ${
              isCurrentUser ? "text-teal-700" : "text-gray-900"
            }`}
          >
            {user.name}
            {isCurrentUser && (
              <span className="text-xs bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-full font-normal flex-shrink-0">
                Ju
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400 flex-shrink-0" />
            <span className="truncate">{user.streak} ditë streak</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
        <span
          className={`font-semibold text-xs sm:text-base ${
            isCurrentUser ? "text-teal-700" : "text-gray-900"
          }`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {user.xp?.toLocaleString()}
        </span>
      </div>
    </div>
  </motion.div>
)

const Leaderboard = () => {
  const { user: authUser } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState("all-time")
  const countdown = useCountdown(timeFrame)

  const fetchLeaderboard = useCallback(async (period) => {
    setLoading(true)
    try {
      const response = await api.get(`/leaderboard/${period}`)
      const data = Array.isArray(response.data) ? response.data : response.data?.data ?? []
      setLeaderboardData(data)
    } catch (error) {
      console.error(`Gabim gjatë marrjes së leaderboard (${period}):`, error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyRank = useCallback(async (period) => {
    try {
      const response = await api.get(`/leaderboard/my-rank?timeFrame=${period}`)
      setMyRank(response.data?.data ?? response.data)
    } catch (error) {
      console.error("Gabim gjatë marrjes së renditjes personale:", error)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard(timeFrame)
    fetchMyRank(timeFrame)

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("authToken") },
    })

    socket.on("connect", () => {
      socket.emit("requestLeaderboard", { timeFrame, limit: 20 })
    })

    socket.on("leaderboardUpdate", (update) => {
      if (update.type === timeFrame) {
        const data = Array.isArray(update.data) ? update.data : update.data?.data ?? []
        setLeaderboardData(data)
      }
    })

    return () => socket.disconnect()
  }, [timeFrame, fetchLeaderboard, fetchMyRank])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    )
  }

  const topThree = leaderboardData.slice(0, 3)
  const listRows = leaderboardData.slice(3, 3 + VISIBLE_ROWS)
  const currentUserId = authUser?.id?.toString()

  const isUserVisible =
    topThree.some((u) => u._id?.toString() === currentUserId) ||
    listRows.some((u) => u._id?.toString() === currentUserId)

  const myRankRow = myRank ? { ...myRank, _id: myRank._id?.toString() } : null

  return (
    <>
      <SEO
        title="Tabela e Renditjes - Gjuha Gjermane"
        description="Shiko renditjen më të mirë të nxënësve të gjuhës gjermane. Konkurroni me të tjerët dhe ngjitni në renditje."
        keywords="tabela e renditjes, konkurrim, pikë xp, gjuha gjermane, mësimi gjermanishtes, renditja"
        ogImage="/og-leaderboard.jpg"
        type="website"
      />

      <div className="w-full space-y-4 p-3 sm:p-6 md:space-y-6">

        {/* Header */}
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
              <p
                className="text-xs sm:text-sm text-gray-500 mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Shiko si renditesh krahas përdoruesve të tjerë.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                {TIME_FRAMES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTimeFrame(key)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      timeFrame === key
                        ? "bg-teal-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {countdown && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full" style={{ fontFamily: "Inter, sans-serif" }}>
                  <Clock className="h-3 w-3 text-teal-500" />
                  <span>Riset në <span className="font-semibold text-teal-600">{countdown}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Podium */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2
            className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 text-center"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Performuesit Kryesorë
          </h2>

          {topThree.length >= 3 && (
            <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-4">

              {/* 2nd place */}
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
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-gray-300 object-cover bg-gray-100"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=64&width=64" }}
                  />
                </div>
                <div className="bg-gray-200 w-16 sm:w-20 h-20 sm:h-24 rounded-t-xl flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>2</span>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 text-center">{topThree[1]?.name}</p>
                <p className="text-xs text-gray-500">{topThree[1]?.xp?.toLocaleString()} XP</p>
              </motion.div>

              {/* 1st place */}
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
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 object-cover shadow-lg bg-gray-100"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=96&width=96" }}
                  />
                </div>
                <div className="bg-gradient-to-b from-yellow-300 to-yellow-400 w-16 sm:w-24 h-24 sm:h-32 rounded-t-xl flex items-center justify-center shadow-md">
                  <span className="text-4xl sm:text-5xl font-bold text-yellow-700" style={{ fontFamily: "Poppins, sans-serif" }}>1</span>
                </div>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base font-bold text-gray-900 line-clamp-2 text-center">{topThree[0]?.name}</p>
                <p className="text-xs sm:text-sm text-teal-600 font-semibold">{topThree[0]?.xp?.toLocaleString()} XP</p>
              </motion.div>

              {/* 3rd place */}
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
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-pink-300 object-cover bg-gray-100"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=64&width=64" }}
                  />
                </div>
                <div className="bg-pink-200 w-16 sm:w-20 h-16 sm:h-20 rounded-t-xl flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-pink-600" style={{ fontFamily: "Poppins, sans-serif" }}>3</span>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 text-center">{topThree[2]?.name}</p>
                <p className="text-xs text-gray-500">{topThree[2]?.xp?.toLocaleString()} XP</p>
              </motion.div>

            </div>
          )}
        </div>

        {/* Full Rankings List */}
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

            {listRows.map((user, index) => (
              <UserRow
                key={user.rank}
                user={user}
                isCurrentUser={user._id?.toString() === currentUserId}
                index={index}
              />
            ))}

            {!isUserVisible && myRankRow && (
              <>
                <div className="px-4 sm:px-6 py-2 flex items-center gap-3 bg-white">
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                  <span className="text-gray-300 text-xs tracking-widest select-none">• • •</span>
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>
                <UserRow user={myRankRow} isCurrentUser={true} index={0} />
              </>
            )}
          </div>
        </div>

      </div>
    </>
  )
}

export default Leaderboard