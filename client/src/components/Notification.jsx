"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

const Notification = ({
  message,
  type = "info",
  storageKey = "notification_last_seen"
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkNotification = () => {
      const lastSeen = localStorage.getItem(storageKey)
      const now = Date.now()
      
      // Show if never seen or 10 minutes have passed
      if (!lastSeen || now - parseInt(lastSeen) > 10 * 60 * 1000) {
        setIsVisible(true)
      }
    }

    checkNotification() // Check immediately on mount/login
    const interval = setInterval(checkNotification, 10 * 60 * 1000) // Every 10 minutes

    return () => clearInterval(interval)
  }, [storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, Date.now().toString())
  }

  if (!isVisible) return null

  const typeStyles = {
    info: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-500 text-black",
    error: "bg-red-600 text-white",
    promo: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
  }

  return (
    <div className={`w-full px-4 py-3 ${typeStyles[type]} relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <p className="text-sm font-medium text-center pr-8">{message}</p>
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Notification