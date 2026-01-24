"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { activityService } from "../services/api"

const useActivityTracking = () => {
  const { user } = useAuth()
  const intervalRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    if (!user) return

    // Track time every minute (60 seconds)
    intervalRef.current = setInterval(async () => {
      try {
        const now = Date.now()
        const timeSinceLastActivity = now - lastActivityRef.current

        // Only track if user has been active (less than 5 minutes since last activity)
        if (timeSinceLastActivity < 5 * 60 * 1000) {
          await activityService.addTime(1) // Add 1 minute
          // console.log("✅ Tracked 1 minute of learning time")
        }

        lastActivityRef.current = now
      } catch (error) {
        // console.error("Failed to track time:", error)
      }
    }, 60000) // Every 60 seconds = 1 minute

    // Track user activity (mouse movement, keyboard, clicks)
    const updateLastActivity = () => {
      lastActivityRef.current = Date.now()
    }

    window.addEventListener("mousemove", updateLastActivity)
    window.addEventListener("keydown", updateLastActivity)
    window.addEventListener("click", updateLastActivity)
    window.addEventListener("scroll", updateLastActivity)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener("mousemove", updateLastActivity)
      window.removeEventListener("keydown", updateLastActivity)
      window.removeEventListener("click", updateLastActivity)
      window.removeEventListener("scroll", updateLastActivity)
    }
  }, [user])
}

export default useActivityTracking
