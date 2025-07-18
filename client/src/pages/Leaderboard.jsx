"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Crown, Star } from "lucide-react"

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState("weekly")

  // Mock data - replace with actual API call
  const mockData = [
    {
      rank: 1,
      name: "Maria Schmidt",
      xp: 2450,
      level: "B2",
      avatar: "/placeholder.svg?height=40&width=40",
      streak: 15,
    },
    {
      rank: 2,
      name: "John Doe",
      xp: 2120,
      level: "B1",
      avatar: "/placeholder.svg?height=40&width=40",
      streak: 12,
    },
    {
      rank: 3,
      name: "Anna Mueller",
      xp: 1890,
      level: "B1",
      avatar: "/placeholder.svg?height=40&width=40",
      streak: 8,
    },
    {
      rank: 4,
      name: "David Wilson",
      xp: 1650,
      level: "A2",
      avatar: "/placeholder.svg?height=40&width=40",
      streak: 6,
    },
    {
      rank: 5,
      name: "Sarah Johnson",
      xp: 1420,
      level: "A2",
      avatar: "/placeholder.svg?height=40&width=40",
      streak: 4,
    },
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLeaderboardData(mockData)
      setLoading(false)
    }, 1000)
  }, [timeFrame])

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

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-gray-600">See how you rank against other learners</p>
          </div>

          <div className="flex gap-2">
            {["weekly", "monthly", "all-time"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFrame === period ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Top Performers</h2>
        <div className="flex justify-center items-end space-x-4">
          {leaderboardData.slice(0, 3).map((user, index) => {
            const heights = ["h-24", "h-32", "h-20"]
            const positions = [1, 0, 2] // Second place in middle
            const actualIndex = positions[index]
            const actualUser = leaderboardData[actualIndex]

            return (
              <div key={actualUser.rank} className="flex flex-col items-center">
                <div className="mb-2">
                  <img
                    src={actualUser.avatar || "/placeholder.svg"}
                    alt={actualUser.name}
                    className="w-12 h-12 rounded-full border-2 border-gray-200"
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 text-center mb-1">{actualUser.name.split(" ")[0]}</p>
                <p className="text-xs text-gray-600 mb-2">{actualUser.xp} XP</p>
                <div
                  className={`${heights[index]} w-16 bg-gradient-to-t ${
                    actualUser.rank === 1
                      ? "from-yellow-400 to-yellow-500"
                      : actualUser.rank === 2
                        ? "from-gray-300 to-gray-400"
                        : "from-amber-500 to-amber-600"
                  } rounded-t-lg flex items-center justify-center`}
                >
                  <span className="text-white font-bold">{actualUser.rank}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Full Rankings</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {leaderboardData.map((user) => (
            <div key={user.rank} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>

                  <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-10 h-10 rounded-full" />

                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(user.level)}`}>
                        {user.level}
                      </span>
                      <span className="text-xs text-gray-500">{user.streak} day streak</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">{user.xp}</span>
                  </div>
                  <p className="text-xs text-gray-500">XP</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
