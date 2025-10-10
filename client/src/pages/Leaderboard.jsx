"use client"

import { useState, useEffect } from "react"
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react"
import { io } from "socket.io-client"
import api, { SOCKET_URL, getAbsoluteImageUrl } from "../services/api"

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekPeriod, setWeekPeriod] = useState("current")
  const [currentUser, setCurrentUser] = useState(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me")
        setCurrentUser(response.data?.user || response.data)
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const response = await api.get("/league/weekPeriod")
        const { timeLeft } = response.data
        setCountdown(timeLeft)
      } catch (error) {
        console.error("Error fetching countdown:", error)
      }
    }
    fetchCountdown()
    const interval = setInterval(fetchCountdown, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/leaderboard/weekly`)
        setLeaderboardData(response.data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()

    const socket = io(SOCKET_URL)
    socket.on("connect", () => {
      socket.emit("requestLeaderboard", { timeFrame: "weekly", limit: 30 })
    })
    socket.on("leaderboardUpdate", (update) => {
      if (update.type === "weekly") {
        setLeaderboardData(update.data)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [weekPeriod])

  const getLeagueInfo = (leagueName) => {
    const leagues = {
      Fillestar: { name: "Liga Fillestar", color: "text-amber-700", bgColor: "bg-amber-50", nextLeague: "Punëtor" },
      Punëtor: { name: "Liga Punëtor", color: "text-gray-600", bgColor: "bg-gray-50", nextLeague: "Kokëfortë" },
      Kokëfortë: { name: "Liga Kokëfortë", color: "text-orange-600", bgColor: "bg-orange-50", nextLeague: "Ngjitës" },
      Ngjitës: { name: "Liga Ngjitës", color: "text-green-600", bgColor: "bg-green-50", nextLeague: "Këmbëngulës" },
      Këmbëngulës: { name: "Liga Këmbëngulës", color: "text-blue-600", bgColor: "bg-blue-50", nextLeague: "Luftëtar" },
      Luftëtar: { name: "Liga Luftëtar", color: "text-red-600", bgColor: "bg-red-50", nextLeague: "Mjeshtër" },
      Mjeshtër: { name: "Liga Mjeshtër", color: "text-purple-600", bgColor: "bg-purple-50", nextLeague: "Kampion" },
      Kampion: { name: "Liga Kampion", color: "text-yellow-600", bgColor: "bg-yellow-50", nextLeague: "Kampion" },
    }
    return leagues[leagueName] || leagues.Fillestar
  }

  const getTrendIndicator = (rank) => {
    if (rank <= 10) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (rank >= 25) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const topThree = leaderboardData.slice(0, 3)
  const userLeague = currentUser?.currentLeague || "Fillestar"
  const leagueInfo = getLeagueInfo(userLeague)
  const nextLeagueInfo = getLeagueInfo(leagueInfo.nextLeague)

  return (
    <div className="mx-auto space-y-4 max-w-7xl p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Renditja
            </h1>
            <p className="text-gray-600 mt-1">
              Ju jeni në {leagueInfo.name}! Renditu në Top 10 për të avancuar në {nextLeagueInfo.name}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekPeriod("current")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                weekPeriod === "current" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Java Aktuale
            </button>
            <button
              onClick={() => setWeekPeriod("last")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                weekPeriod === "last" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Java e Kaluar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${leagueInfo.color}`} />
              {leagueInfo.name}
            </h2>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Top 10 Avancojnë
            </span>
          </div>

          <div className="bg-green-50 border-b-2 border-green-200 p-3">
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm">
              <ArrowUp className="h-4 w-4" />
              ZONA E PROMOVIMIT
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {leaderboardData.slice(0, 10).map((user, index) => (
              <div
                key={user._id}
                className={`p-4 ${index === 0 ? "bg-yellow-50" : "hover:bg-gray-50"} transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-lg font-bold text-gray-900 w-6">{index + 1}</span>
                    <img
                      src={getAbsoluteImageUrl(user.profilePicture) || "/placeholder.svg"}
                      alt={`${user.emri} ${user.mbiemri}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {user.emri} {user.mbiemri}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.achievements && user.achievements.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">{user.achievements.length}</span>
                          </div>
                        )}
                        {user.streakCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-orange-600">🔥</span>
                            <span className="text-xs text-gray-600">{user.streakCount}</span>
                          </div>
                        )}
                        <span className={`font-semibold ${index === 0 ? "text-yellow-600" : "text-blue-600"}`}>
                          {user.xp} XP
                        </span>
                        <span className="text-xs text-gray-500">Niveli {user.level}</span>
                      </div>
                    </div>
                  </div>
                  {getTrendIndicator(index + 1)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-gray-50 text-center">
            <span className="text-gray-400 text-sm">...</span>
          </div>

          <div className="bg-red-50 border-t-2 border-red-200 p-3">
            <div className="flex items-center justify-center gap-2 text-red-700 font-medium text-sm">
              <ArrowDown className="h-4 w-4" />
              ZONA E DEGRADIMIT
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {leaderboardData.slice(-3).map((user, index) => {
              const actualRank = leaderboardData.length - 2 + index
              return (
                <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-lg font-bold text-gray-900 w-6">{actualRank}</span>
                      <img
                        src={getAbsoluteImageUrl(user.profilePicture) || "/placeholder.svg"}
                        alt={`${user.emri} ${user.mbiemri}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.emri} {user.mbiemri}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.achievements && user.achievements.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-gray-600">{user.achievements.length}</span>
                            </div>
                          )}
                          {user.streakCount > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-orange-600">🔥</span>
                              <span className="text-xs text-gray-600">{user.streakCount}</span>
                            </div>
                          )}
                          <span className="font-semibold text-gray-600">{user.xp} XP</span>
                          <span className="text-xs text-gray-500">Niveli {user.level}</span>
                        </div>
                      </div>
                    </div>
                    {getTrendIndicator(actualRank)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Performuesit Kryesorë</h3>
            <div className="flex justify-center items-end gap-4">
              {topThree.length >= 2 && (
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-sm mb-2">2</span>
                  <div className="relative">
                    <img
                      src={getAbsoluteImageUrl(topThree[1].profilePicture) || "/placeholder.svg"}
                      alt={topThree[1].emri}
                      className="w-16 h-16 rounded-full border-4 border-gray-300 object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium mt-2 text-center">
                    {topThree[1].emri} {topThree[1].mbiemri}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold">{topThree[1].xp} XP</p>
                </div>
              )}
              {topThree.length >= 1 && (
                <div className="flex flex-col items-center -mt-4">
                  <span className="text-yellow-500 text-sm mb-2">1</span>
                  <div className="relative">
                    <img
                      src={getAbsoluteImageUrl(topThree[0].profilePicture) || "/placeholder.svg"}
                      alt={topThree[0].emri}
                      className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium mt-2 text-center">
                    {topThree[0].emri} {topThree[0].mbiemri}
                  </p>
                  <p className="text-xs text-yellow-600 font-semibold">{topThree[0].xp} XP</p>
                </div>
              )}
              {topThree.length >= 3 && (
                <div className="flex flex-col items-center">
                  <span className="text-orange-500 text-sm mb-2">3</span>
                  <div className="relative">
                    <img
                      src={getAbsoluteImageUrl(topThree[2].profilePicture) || "/placeholder.svg"}
                      alt={topThree[2].emri}
                      className="w-16 h-16 rounded-full border-4 border-orange-300 object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium mt-2 text-center">
                    {topThree[2].emri} {topThree[2].mbiemri}
                  </p>
                  <p className="text-xs text-orange-600 font-semibold">{topThree[2].xp} XP</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Java mbaron në</h3>
            <div className="flex justify-center items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{countdown.days}</div>
                <div className="text-xs text-gray-500 uppercase">Ditë</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{countdown.hours}</div>
                <div className="text-xs text-gray-500 uppercase">Orë</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{countdown.minutes}</div>
                <div className="text-xs text-gray-500 uppercase">Minuta</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rregullat e Ligës</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ArrowUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Promovim:</p>
                  <p className="text-xs text-gray-600">Përfundo në top 10 për të kaluar në ligën tjetër.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Minus className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Qëndrim:</p>
                  <p className="text-xs text-gray-600">
                    Përfundo midis vendit të 11-të dhe të 25-të për të qëndruar në ligën aktuale.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Degradim:</p>
                  <p className="text-xs text-gray-600">
                    Përfundo në 5 të fundit për t'u degraduar në ligën e mëparshme.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
