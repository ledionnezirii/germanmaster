"use client"

import { useState, useEffect, useCallback } from "react"
import { activityService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import useActivityTracking from "../hooks/useActivityTracking"

const Activity = () => {
  const { user, isAuthenticated } = useAuth()
  useActivityTracking()

  const [activityData, setActivityData] = useState({})
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivityData()
    }
  }, [isAuthenticated])

  const fetchActivityData = async () => {
    try {
      setLoading(true)
      const [heatmapRes, statsRes] = await Promise.all([activityService.getHeatmap(12), activityService.getStats()])

      console.log("[v0] Heatmap data received:", heatmapRes.data)

      setActivityData(heatmapRes.data || {})
      setStats(statsRes.data || null)
    } catch (error) {
      console.error("Error fetching activity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIntensityLevel = (hours) => {
    if (!hours || hours === 0) return 0
    const minutes = hours * 60
    if (minutes < 5) return 1
    if (minutes < 15) return 2
    if (minutes < 30) return 3
    if (minutes < 60) return 4
    if (minutes < 120) return 5
    return 6
  }

  const getIntensityColor = (level) => {
    const colors = [
      "bg-gray-700 border-gray-600",
      "bg-green-900/40 border-green-800/50",
      "bg-green-700/60 border-green-600/70",
      "bg-green-600 border-green-500",
      "bg-green-500 border-green-400",
      "bg-green-400 border-green-300",
      "bg-green-300 border-green-200",
    ]
    return colors[level] || colors[0]
  }

  const generateCalendarData = useCallback(() => {
    const weeks = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start exactly 12 months ago (1 year = 365 days)
    const startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() - 1)
    startDate.setDate(startDate.getDate() + 1) // Move forward 1 day so we get exactly 12 months

    // Go back to the Sunday of that week
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const currentDate = new Date(startDate)
    const endDate = new Date(today)

    // Generate weeks until we reach today
    while (currentDate <= endDate) {
      const week = []
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        if (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0]
          const hours = activityData[dateStr] || 0

          if (hours > 0) {
            console.log(`[v0] Date ${dateStr} has ${hours} hours, level: ${getIntensityLevel(hours)}`)
          }

          week.push({
            date: new Date(currentDate),
            dateStr,
            hours: hours,
            level: getIntensityLevel(hours),
          })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      if (week.length > 0) {
        weeks.push(week)
      }
    }

    return weeks
  }, [activityData])

  const getMonthLabels = useCallback(() => {
    const labels = []
    const calendarData = generateCalendarData()

    if (calendarData.length === 0) return labels

    let lastMonth = -1
    let monthCount = 0

    for (let weekIndex = 0; weekIndex < calendarData.length && monthCount < 12; weekIndex++) {
      const firstDayOfWeek = calendarData[weekIndex][0].date
      const month = firstDayOfWeek.getMonth()

      // Only add label if this is a new month
      if (month !== lastMonth) {
        labels.push({ month: months[month], weekIndex })
        lastMonth = month
        monthCount++
      }
    }

    return labels
  }, [generateCalendarData, months])

  const formatHours = (hours) => {
    if (hours === 0) return "0 orë"
    const totalMinutes = Math.round(hours * 60)
    if (totalMinutes < 60) {
      return `${totalMinutes} min`
    }
    const wholeHours = Math.floor(hours)
    const mins = Math.round((hours - wholeHours) * 60)
    if (mins === 0) return `${wholeHours}h`
    return `${wholeHours}h ${mins}m`
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("sq-AL", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleMouseEnter = (day, e) => {
    setHoveredDay(day)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="text-center text-gray-400 py-8">Ju lutem kyçuni për të parë aktivitetin tuaj</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-800 rounded w-40 mb-3"></div>
          <div className="h-24 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  const calendarData = generateCalendarData()
  const monthLabels = getMonthLabels()

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Aktiviteti i Mësimit</h2>
        {stats && (
          <div className="flex items-center gap-3 text-xs">
            <div className="text-gray-400">
              <span className="text-white font-medium">{stats.totalDays}</span> ditë aktive
            </div>
            <div className="text-gray-400">
              <span className="text-white font-medium">{stats.totalHours}h</span> total
            </div>
            <div className="text-gray-400">
              <span className="text-green-400 font-medium">{stats.currentStreak}</span> ditë rresht
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Container */}
      <div className="w-full overflow-x-auto">
        <div className="relative inline-block min-w-full">
          {/* Month Labels */}
          <div className="relative h-4 mb-1">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="absolute text-[10px] text-gray-500 font-medium"
                style={{
                  left: `${label.weekIndex * 10.5}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {calendarData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-[9px] h-[9px] rounded-[2px] border cursor-pointer transition-all hover:scale-125 hover:z-10 ${getIntensityColor(
                      day.level,
                    )}`}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg border border-gray-700 pointer-events-none whitespace-nowrap"
          style={{
            top: tooltipPos.y - 45,
            left: tooltipPos.x,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium">
            {formatHours(hoveredDay.hours)} më {formatDate(hoveredDay.date)}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-gray-500">Më pak</span>
        {[0, 1, 2, 3, 4, 5, 6].map((level) => (
          <div key={level} className={`w-[9px] h-[9px] rounded-[2px] border ${getIntensityColor(level)}`} />
        ))}
        <span className="text-[10px] text-gray-500">Më shumë</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{stats.totalHours}h</div>
            <div className="text-[10px] text-gray-400">Totali Kohës</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xl font-bold text-green-400">{stats.currentStreak}</div>
            <div className="text-[10px] text-gray-400">Ditë Rresht</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-400">{stats.longestStreak}</div>
            <div className="text-[10px] text-gray-400">Rresht Më i Gjatë</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-400">{formatHours(stats.averagePerDay)}</div>
            <div className="text-[10px] text-gray-400">Mesatarja/Ditë</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Activity
