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

const buildSubscriptionObject = (userData) => {
  const now = new Date()
  const expiresAt = userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null
  const daysRemaining = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0

  return {
    active: userData.isPaid || (userData.subscriptionType === "free_trial" && expiresAt && expiresAt > now),
    type: userData.subscriptionType || "free_trial",
    expiresAt: userData.subscriptionExpiresAt,
    trialStartedAt: userData.trialStartedAt,
    daysRemaining: Math.max(0, daysRemaining),
  }
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

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken")
      console.log("AuthContext: initAuth called. Saved token:", savedToken ? "Exists" : "Does not exist")

      if (savedToken) {
        try {
          const response = await authService.getProfile()
          console.log(
            "AuthContext: getProfile response data:",
            response.data ? JSON.stringify(response.data, null, 2) : null,
          )

          const userDataFromResponse = response.data?.user

          if (!userDataFromResponse || Object.keys(userDataFromResponse).length === 0) {
            console.warn("AuthContext: getProfile returned no user data or empty object. Clearing auth.")
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
            return
          }

          const fetchedUser = {
            id: userDataFromResponse.id,
            firstName: userDataFromResponse.firstName || userDataFromResponse.emri,
            lastName: userDataFromResponse.lastName || userDataFromResponse.mbiemri,
            email: userDataFromResponse.email,
            role: userDataFromResponse.role,
            profilePicture: userDataFromResponse.profilePicture,
            xp: userDataFromResponse.xp,
            level: userDataFromResponse.level,
            studyHours: userDataFromResponse.studyHours,
            completedTests: userDataFromResponse.completedTests,
            achievements: userDataFromResponse.achievements,
            streakCount: userDataFromResponse.streakCount,
            avatarStyle: userDataFromResponse.avatarStyle || "adventurer",
            subscription: buildSubscriptionObject(userDataFromResponse),
          }
          console.log("AuthContext: Fetched user data (before setting state):", JSON.stringify(fetchedUser, null, 2))
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
      console.log(
        "AuthContext: Login successful. Response data:",
        response.data ? JSON.stringify(response.data, null, 2) : null,
      )

      if (!userData || Object.keys(userData).length === 0) {
        console.error("AuthContext: Login response did not contain user data or was empty.")
        throw new Error("Login failed: No user data received.")
      }

      localStorage.setItem("authToken", newToken)

      const userToStore = {
        id: userData.id,
        firstName: userData.emri,
        lastName: userData.mbiemri,
        email: userData.email,
        role: userData.role,
        profilePicture: userData.profilePicture,
        xp: userData.xp,
        level: userData.level,
        studyHours: userData.studyHours,
        completedTests: userData.completedTests,
        achievements: userData.achievements,
        streakCount: userData.streakCount,
        avatarStyle: userData.avatarStyle || "adventurer",
        subscription: buildSubscriptionObject(userData),
      }
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

  const refreshUser = useCallback(async () => {
    try {
      console.log("AuthContext: Refreshing user data from backend...")
      const response = await authService.getProfile()
      const userDataFromResponse = response.data?.user

      if (userDataFromResponse) {
        const updatedUser = {
          id: userDataFromResponse.id,
          firstName: userDataFromResponse.firstName || userDataFromResponse.emri,
          lastName: userDataFromResponse.lastName || userDataFromResponse.mbiemri,
          email: userDataFromResponse.email,
          role: userDataFromResponse.role,
          profilePicture: userDataFromResponse.profilePicture,
          xp: userDataFromResponse.xp,
          level: userDataFromResponse.level,
          studyHours: userDataFromResponse.studyHours,
          completedTests: userDataFromResponse.completedTests,
          achievements: userDataFromResponse.achievements,
          streakCount: userDataFromResponse.streakCount,
          avatarStyle: userDataFromResponse.avatarStyle || "adventurer",
          subscription: buildSubscriptionObject(userDataFromResponse),
        }

        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        console.log("AuthContext: User data refreshed successfully")
        return updatedUser
      }
    } catch (error) {
      console.error("AuthContext: Failed to refresh user data:", error)
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
        console.log(
          "AuthContext: Register successful. Response data:",
          response.data ? JSON.stringify(response.data, null, 2) : null,
        )
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
    refreshUser, // Expose refreshUser function
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
