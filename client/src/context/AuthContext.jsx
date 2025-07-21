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
      localStorage.removeItem("user") // Clear corrupted data
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

          // Access the nested 'user' object from response.data
          const userDataFromResponse = response.data?.user

          if (!userDataFromResponse || Object.keys(userDataFromResponse).length === 0) {
            console.warn("AuthContext: getProfile returned no user data or empty object. Clearing auth.")
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
            return // Exit early if no data
          }

          // Ensure ALL relevant user data is captured from the profile response
          const fetchedUser = {
            id: userDataFromResponse.id,
            firstName: userDataFromResponse.firstName || userDataFromResponse.emri,
            lastName: userDataFromResponse.lastName || userDataFromResponse.mbiemri,
            email: userDataFromResponse.email,
            profilePicture: userDataFromResponse.profilePicture,
            xp: userDataFromResponse.xp,
            level: userDataFromResponse.level,
            studyHours: userDataFromResponse.studyHours,
            completedTests: userDataFromResponse.completedTests,
            achievements: userDataFromResponse.achievements,
            streakCount: userDataFromResponse.streakCount, // Ensure streakCount is always included
            // Add any other fields you expect from your profile response here
          }
          console.log("AuthContext: Fetched user data (before setting state):", JSON.stringify(fetchedUser, null, 2))
          setUser(fetchedUser)
          // Store the fetched user data in localStorage
          localStorage.setItem("user", JSON.stringify(fetchedUser))
          setToken(savedToken)
        } catch (error) {
          console.error("AuthContext: Auth initialization error during getProfile:", error)
          // If profile fetch fails, clear both token and user from storage
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
        }
      } else {
        // If no token, ensure no user data is lingering in localStorage
        console.log("AuthContext: No saved token found. Clearing user from localStorage.")
        localStorage.removeItem("user")
        setUser(null)
      }
      setLoading(false)
      console.log("AuthContext: initAuth finished. Loading set to false.")
    }
    initAuth()
  }, []) // Runs only once on mount

  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials)
      // The login response already destructures 'user' correctly, so this part is fine.
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
      // Ensure ALL user data is included when storing after login
      const userToStore = {
        id: userData.id,
        firstName: userData.emri,
        lastName: userData.mbiemri,
        email: userData.email,
        profilePicture: userData.profilePicture,
        xp: userData.xp,
        level: userData.level,
        studyHours: userData.studyHours,
        completedTests: userData.completedTests,
        achievements: userData.achievements,
        streakCount: userData.streakCount, // Ensure streakCount is always included
        // Add any other fields you expect from your login response here
      }
      console.log("AuthContext: User data to store after login:", JSON.stringify(userToStore, null, 2))
      // Store the full user data in localStorage upon login
      localStorage.setItem("user", JSON.stringify(userToStore))
      setToken(newToken)
      setUser(userToStore)
      return response
    } catch (error) {
      console.error("AuthContext: Login error:", error)
      throw error
    }
  }, [])

  const register = useCallback(async (userData) => {
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
  }, [])

  const logout = useCallback(() => {
    console.log("AuthContext: Logging out. Clearing localStorage.")
    localStorage.removeItem("authToken")
    localStorage.removeItem("user") // Clear user data from localStorage on logout
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      if (!prev) {
        console.warn("AuthContext: updateUser called but no previous user state exists.")
        return null
      }
      const newUser = { ...prev, ...updatedData }
      console.log("AuthContext: setUser called in updateUser with:", JSON.stringify(newUser, null, 2))
      // Persist updated user data to localStorage
      localStorage.setItem("user", JSON.stringify(newUser))
      return newUser
    })
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
