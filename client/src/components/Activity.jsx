import React, { useState, useEffect, useCallback } from "react";
import { activityService } from "../services/api";

const Activity = () => {
  const [activityData, setActivityData] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const [heatmapRes, statsRes] = await Promise.all([
        activityService.getHeatmap(12),
        activityService.getStats(),
      ]);
      setActivityData(heatmapRes.data || {});
      setStats(statsRes.data || null);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLevel = (minutes) => {
    if (!minutes || minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  };

  const getIntensityColor = (level) => {
    const colors = [
      "bg-gray-800 border-gray-700",
      "bg-green-900 border-green-800",
      "bg-green-700 border-green-600",
      "bg-green-500 border-green-400",
      "bg-green-400 border-green-300",
    ];
    return colors[level];
  };

  const generateCalendarData = useCallback(() => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (currentDate <= today) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const minutes = activityData[dateStr] || 0;
          week.push({
            date: new Date(currentDate),
            dateStr,
            minutes,
            level: getIntensityLevel(minutes),
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      if (week.length > 0) {
        weeks.push(week);
      }
    }

    return weeks;
  }, [activityData]);

  const getMonthLabels = useCallback(() => {
    const labels = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);

    let currentMonth = -1;
    let weekIndex = 0;
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    while (currentDate <= today) {
      const month = currentDate.getMonth();
      if (month !== currentMonth) {
        labels.push({ month: months[month], weekIndex });
        currentMonth = month;
      }
      currentDate.setDate(currentDate.getDate() + 7);
      weekIndex++;
    }

    return labels;
  }, [activityData]);

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-48 mb-4"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const calendarData = generateCalendarData();
  const monthLabels = getMonthLabels();

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Learning Activity</h2>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-400">
              <span className="text-white font-medium">{stats.totalDays}</span> active days
            </div>
            <div className="text-gray-400">
              <span className="text-white font-medium">{formatMinutes(stats.totalMinutes)}</span> total
            </div>
            <div className="text-gray-400">
              <span className="text-green-400 font-medium">{stats.currentStreak}</span> day streak
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Container */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month Labels */}
          <div className="flex mb-2 ml-8">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-xs text-gray-500"
                style={{
                  position: "relative",
                  left: `${label.weekIndex * 14}px`,
                  width: "fit-content",
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className="h-3 text-xs text-gray-500 flex items-center justify-end pr-1"
                  style={{ fontSize: "10px" }}
                >
                  {idx % 2 === 1 ? day : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-1">
              {calendarData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`w-3 h-3 rounded-sm border cursor-pointer transition-all hover:scale-125 hover:z-10 ${getIntensityColor(
                        day.level
                      )}`}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="fixed z-50 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-700 pointer-events-none"
          style={{
            top: "var(--mouse-y, 0)",
            left: "var(--mouse-x, 0)",
            transform: "translate(-50%, -100%) translateY(-10px)",
          }}
        >
          <div className="font-medium">{formatMinutes(hoveredDay.minutes)} on {formatDate(hoveredDay.date)}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-500">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-3 h-3 rounded-sm border ${getIntensityColor(level)}`}
          />
        ))}
        <span className="text-xs text-gray-500">More</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.totalHours}h</div>
            <div className="text-xs text-gray-400">Total Learning Time</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.currentStreak}</div>
            <div className="text-xs text-gray-400">Current Streak</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.longestStreak}</div>
            <div className="text-xs text-gray-400">Longest Streak</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{formatMinutes(stats.averagePerDay)}</div>
            <div className="text-xs text-gray-400">Avg per Day</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;