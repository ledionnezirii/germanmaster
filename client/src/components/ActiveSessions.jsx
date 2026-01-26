"use client"

import { useState, useEffect } from "react"
import { sessionService } from "../services/api"
import { DevicePhoneMobileIcon, ComputerDesktopIcon, TrashIcon } from "@heroicons/react/24/outline"

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await sessionService.getSessions()
      console.log("[v0] Sessions API response:", response)
      const sessionsData = response.data?.sessions || response.data || []
      console.log("[v0] Parsed sessions data:", sessionsData)
      setSessions(Array.isArray(sessionsData) ? sessionsData : [])
    } catch (err) {
      console.error("[v0] Error fetching sessions:", err)
      setError("Dështoi në ngarkimin e sesioneve")
      setSessions([]) // Ensure sessions is always an array on error
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async (sessionId) => {
    if (!window.confirm("Jeni të sigurt që dëshironi të dilni nga kjo pajisje?")) {
      return
    }

    try {
      await sessionService.logoutSession(sessionId)
      setSessions(sessions.filter((s) => s._id !== sessionId))
    } catch (err) {
      console.error("[v0] Error logging out session:", err)
      setError("Dështoi në dalje nga sesioni")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Pajisjet e kyçura</h2>
      <p className="text-gray-600 mb-6">Ju mund të kyçeni në maksimum 2 pajisje</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {Array.isArray(sessions) && sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {session.deviceType === "mobile" ? (
                  <DevicePhoneMobileIcon className="h-8 w-8 text-teal-500" />
                ) : (
                  <ComputerDesktopIcon className="h-8 w-8 text-teal-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {session.browser} në {session.os}
                  </h3>
                  <p className="text-sm text-gray-500">{session.deviceType === "mobile" ? "Telefon" : "Desktop"}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Aktiviteti i fundit: {new Date(session.lastActivity).toLocaleString("sq-AL")}
                  </p>
                  {session.isCurrent && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Sesioni aktual
                    </span>
                  )}
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => handleLogout(session._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Dil nga kjo pajisje"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">Nuk ka sesione aktive</p>
        )}
      </div>
    </div>
  )
}

export default ActiveSessions
