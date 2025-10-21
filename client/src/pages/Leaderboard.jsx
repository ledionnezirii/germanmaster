import { useState, useEffect } from "react"
import axios from "axios"
import { Trophy, Medal, Award, Flame, Star, Crown, ChevronLeft, ChevronRight, Calendar, Clock, Zap } from 'lucide-react'

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

  const getRankStyles = (rank) => {
    if (rank === 1) return {
      border: "border-yellow-400",
      bg: "bg-yellow-50",
      icon: <Crown className="w-5 h-5 text-yellow-600" />,
      iconBg: "bg-yellow-400"
    }
    if (rank === 2) return {
      border: "border-gray-400",
      bg: "bg-gray-50",
      icon: <Medal className="w-5 h-5 text-gray-600" />,
      iconBg: "bg-gray-400"
    }
    if (rank === 3) return {
      border: "border-orange-400",
      bg: "bg-orange-50",
      icon: <Award className="w-5 h-5 text-orange-600" />,
      iconBg: "bg-orange-400"
    }
    return {
      border: "border-gray-200",
      bg: "bg-white",
      icon: null,
      iconBg: ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">
            Renditja
          </h1>
          <p className="text-gray-600">
            Shiko se si renditet kundrejt nxënësve të tjerë
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {[
            { key: "all-time", label: "Të Gjitha Kohërat", icon: Trophy },
            { key: "weekly", label: "Javore", icon: Calendar },
            { key: "monthly", label: "Mujore", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin">
              <Trophy className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Podium - Top 3 */}
        {!loading && !error && topThreeUsers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-end justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
              {getPodiumOrder().map((user) => {
                const actualRank = user.rank
                const styles = getRankStyles(actualRank)
                const isWinner = actualRank === 1

                return (
                  <div
                    key={user.rank}
                    className={`flex flex-col items-center ${
                      actualRank === 1 ? "order-2" : actualRank === 2 ? "order-1" : "order-3"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative mb-3">
                      <img
                        src={user.avatar || "/placeholder.svg?height=96&width=96"}
                        alt={user.name}
                        className={`rounded-full object-cover border-4 ${styles.border} ${
                          isWinner ? "w-24 h-24 md:w-28 md:h-28" : "w-20 h-20 md:w-24 md:h-24"
                        }`}
                      />
                      {/* Rank Badge */}
                      <div className={`absolute -top-1 -right-1 w-8 h-8 ${styles.iconBg} rounded-full flex items-center justify-center shadow-md`}>
                        {styles.icon}
                      </div>
                    </div>

                    {/* User Card */}
                    <div className={`${styles.bg} border-2 ${styles.border} rounded-xl p-3 mb-3 w-full max-w-[140px] md:max-w-[160px]`}>
                      <h3 className={`font-bold text-center mb-2 text-gray-900 truncate ${
                        isWinner ? "text-lg" : "text-base"
                      }`}>
                        {user.name}
                      </h3>

                      <div className="flex flex-col gap-1.5 mb-2">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                          <Zap className="w-3 h-3 mr-1" />
                          Niveli {user.level}
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700">
                          <Flame className="w-3 h-3 mr-1" />
                          {user.streak} ditë
                        </span>
                      </div>

                      <div className="text-center">
                        <div className={`font-black ${
                          isWinner ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
                        } text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600`}>
                          {user.xp.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                          <Star className="w-3 h-3" />
                          XP
                        </div>
                      </div>
                    </div>

                    {/* Podium Base */}
                    <div className={`w-full max-w-[140px] md:max-w-[160px] rounded-t-xl ${
                      actualRank === 1
                        ? "h-24 bg-gradient-to-b from-yellow-400 to-yellow-500"
                        : actualRank === 2
                          ? "h-20 bg-gradient-to-b from-gray-400 to-gray-500"
                          : "h-16 bg-gradient-to-b from-orange-400 to-orange-500"
                    }`} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* User List */}
        {!loading && !error && (
          <>
            <div className="space-y-2 max-w-4xl mx-auto">
              {currentUsers.length === 0 && topThreeUsers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Nuk u gjetën përdorues për këtë renditje</p>
                </div>
              ) : (
                currentUsers.map((user) => (
                  <div
                    key={user.rank}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg font-bold text-purple-700">
                        {user.rank}
                      </div>

                      {/* Avatar */}
                      <img
                        src={user.avatar || "/placeholder.svg?height=48&width=48"}
                        alt={user.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate mb-1">{user.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                            <Zap className="w-3 h-3 mr-1" />
                            Niveli {user.level}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-700">
                            <Flame className="w-3 h-3 mr-1" />
                            {user.streak} ditë
                          </span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {user.xp.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center justify-end gap-1 font-medium">
                          <Star className="w-3 h-3" />
                          XP
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 max-w-4xl mx-auto">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Mbrapa
                </button>

                <div className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 font-semibold text-sm">
                  Faqja {currentPage} / {totalPages}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md"
                  }`}
                >
                  Përpara
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Leaderboard