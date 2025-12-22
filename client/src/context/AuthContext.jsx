"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authService } from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user")
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      console.log("AuthContext: useState init - Stored user:", parsedUser ? JSON.stringify(parsedUser, null, 2) : null)
      return parsedUser
    } catch (error) {
      console.error("AuthContext: useState init - Failed to parse user from localStorage:", error)
      localStorage.removeItem("user")
      return null
    }
  })

  const setUser = useCallback((newValue) => {
    console.log("AuthContext: setUser called with:", newValue ? JSON.stringify(newValue, null, 2) : null)
    setUserState(newValue)
  }, [])

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("authToken"))

  // Helper function to map user data with subscription
  const mapUserData = (userData) => {
    if (!userData) return null

    // Calculate subscription status
    const now = new Date()
    const expiresAt = userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null
    const daysRemaining = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0
    const isExpired = expiresAt ? expiresAt <= now : true
    const isActive = userData.isPaid && !isExpired
    
    // Determine subscription type
    let subscriptionType = userData.subscriptionType || "free_trial"
    
    // If user has no subscription type but has an expiry date in future, it's free trial
    if (!userData.subscriptionType && expiresAt && expiresAt > now) {
      subscriptionType = "free_trial"
    }

    return {
      id: userData.id || userData._id,
      firstName: userData.firstName || userData.emri,
      lastName: userData.lastName || userData.mbiemri,
      email: userData.email,
      profilePicture: userData.profilePicture,
      xp: userData.xp,
      level: userData.level,
      studyHours: userData.studyHours,
      completedTests: userData.completedTests,
      achievements: userData.achievements,
      streakCount: userData.streakCount,
      avatarStyle: userData.avatarStyle || "adventurer",
      isPaid: userData.isPaid || false,
      subscriptionCancelled: userData.subscriptionCancelled || false,
      subscription: {
        active: isActive,
        type: subscriptionType,
        expiresAt: userData.subscriptionExpiresAt,
        trialStartedAt: userData.trialStartedAt,
        daysRemaining: Math.max(0, daysRemaining),
        cancelled: userData.subscriptionCancelled || false,
      },
    }
  }

  useEffect(() => {
    const checkSessionValidity = async () => {
      const savedToken = localStorage.getItem("authToken")
      if (savedToken && user) {
        try {
          await authService.getProfile()
        } catch (error) {
          if (error.response?.status === 401) {
            console.log("AuthContext: Session invalidated by server. Logging out.")
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
          }
        }
      }
    }

    const interval = setInterval(checkSessionValidity, 30000)
    return () => clearInterval(interval)
  }, [user, setUser])

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken")
      console.log("AuthContext: initAuth called. Saved token:", savedToken ? "Exists" : "Does not exist")

      if (savedToken) {
        try {
          const response = await authService.getProfile()
          console.log("AuthContext: getProfile response data:", response.data ? JSON.stringify(response.data, null, 2) : null)

          const userDataFromResponse = response.data?.user || response.data

          if (!userDataFromResponse || Object.keys(userDataFromResponse).length === 0) {
            console.warn("AuthContext: getProfile returned no user data or empty object. Clearing auth.")
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
            return
          }

          const fetchedUser = mapUserData(userDataFromResponse)
          console.log("AuthContext: Fetched user data (after mapping):", JSON.stringify(fetchedUser, null, 2))
          
          setUser(fetchedUser)
          localStorage.setItem("user", JSON.stringify(fetchedUser))
          setToken(savedToken)
        } catch (error) {
          console.error("AuthContext: Auth initialization error during getProfile:", error)
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
        }
      } else {
        console.log("AuthContext: No saved token found. Clearing user from localStorage.")
        localStorage.removeItem("user")
        setUser(null)
      }
      setLoading(false)
      console.log("AuthContext: initAuth finished. Loading set to false.")
    }
    initAuth()
  }, [])

  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials)
      const { token: newToken, user: userData } = response.data
      console.log("AuthContext: Login successful. Response data:", response.data ? JSON.stringify(response.data, null, 2) : null)

      if (!userData || Object.keys(userData).length === 0) {
        console.error("AuthContext: Login response did not contain user data or was empty.")
        throw new Error("Login failed: No user data received.")
      }

      localStorage.setItem("authToken", newToken)
      const userToStore = mapUserData(userData)
      console.log("AuthContext: User data to store after login:", JSON.stringify(userToStore, null, 2))
      
      localStorage.setItem("user", JSON.stringify(userToStore))
      setToken(newToken)
      setUser(userToStore)
      return response
    } catch (error) {
      console.error("AuthContext: Login error:", error)
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      if (!prev) {
        console.warn("AuthContext: updateUser called but no previous user state exists.")
        return null
      }
      const newUser = { ...prev, ...updatedData }
      
      // If subscription-related fields are updated, recalculate subscription object
      if (updatedData.isPaid !== undefined || 
          updatedData.subscriptionExpiresAt !== undefined || 
          updatedData.subscriptionType !== undefined ||
          updatedData.subscriptionCancelled !== undefined) {
        const remappedUser = mapUserData({
          ...prev,
          ...updatedData,
          emri: prev.firstName,
          mbiemri: prev.lastName,
        })
        console.log("AuthContext: Remapped user with updated subscription:", JSON.stringify(remappedUser, null, 2))
        localStorage.setItem("user", JSON.stringify(remappedUser))
        return remappedUser
      }
      
      console.log("AuthContext: setUser called in updateUser with:", JSON.stringify(newUser, null, 2))
      localStorage.setItem("user", JSON.stringify(newUser))
      return newUser
    })
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    register: useCallback(async (userData) => {
      try {
        const response = await authService.register(userData)
        console.log("AuthContext: Register successful. Response data:", response.data ? JSON.stringify(response.data, null, 2) : null)
        return response
      } catch (error) {
        console.error("AuthContext: Register error:", error)
        throw error
      }
    }, []),
    logout: useCallback(() => {
      console.log("AuthContext: Logging out. Clearing localStorage.")
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
      setToken(null)
      setUser(null)
    }, []),
    updateUser,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}