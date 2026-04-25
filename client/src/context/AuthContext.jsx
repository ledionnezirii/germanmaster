"use client"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { authService, SOCKET_URL } from "../services/api"  // import SOCKET_URL
import { io } from "socket.io-client"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth muust be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user")
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      return parsedUser
    } catch (error) {
      localStorage.removeItem("user")
      return null
    }
  })

  const setUser = useCallback((newValue) => {
    setUserState(newValue)
  }, [])

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("authToken"))
  const socketRef = useRef(null)

  // Socket.io connection for online status tracking
  useEffect(() => {
    if (token && user) {
      // Connect to socket server
      socketRef.current = io(SOCKET_URL, {
  auth: { token: token },
  transports: ["websocket", "polling"],
})
      socketRef.current.on("connect", () => {
        console.log("Socket connected for online tracking")
      })

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message)
      })

      // Cleanup on unmount or when token/user changes
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    }
  }, [token, user])

  useEffect(() => {
    const checkSessionValidity = async () => {
      const savedToken = localStorage.getItem("authToken")
      if (savedToken && user) {
        try {
          await authService.getProfile()
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
          }
        }
      }
    }

    const interval = setInterval(checkSessionValidity, 300000) // every 5 min instead of every 30s

    return () => clearInterval(interval)
  }, [user, setUser])

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken")

      if (savedToken) {
        try {
          const response = await authService.getProfile()

          const userDataFromResponse = response.data?.user

          if (!userDataFromResponse || Object.keys(userDataFromResponse).length === 0) {
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
            languageProgress: userDataFromResponse.languageProgress || [],
            learnedWordsCounts: userDataFromResponse.learnedWordsCounts || {},
            dictionaryUnlockedCounts: userDataFromResponse.dictionaryUnlockedCounts || {},
            studyHours: userDataFromResponse.studyHours,
            completedTests: userDataFromResponse.completedTests,
            completedTranslations: userDataFromResponse.passedTranslatedTexts?.length || 0,
            achievements: userDataFromResponse.achievements,
            streakCount: userDataFromResponse.streakCount,
            avatarStyle: userDataFromResponse.avatarStyle || "adventurer",
            isVerified: userDataFromResponse.isVerified || false,
            subscription: userDataFromResponse.subscription || {
              active: false,
              type: "free_trial",
              expiresAt: null,
              trialStartedAt: null,
              daysRemaining: 0,
            },
          }
          setUser(fetchedUser)
          localStorage.setItem("user", JSON.stringify(fetchedUser))
          setToken(savedToken)
        } catch (error) {
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
        }
      } else {
        localStorage.removeItem("user")
        setUser(null)
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const googleLogin = useCallback(async (access_token) => {
    try {
      const response = await authService.googleLogin(access_token)
      const { token: newToken, user: userData } = response.data

      if (!userData || Object.keys(userData).length === 0) {
        throw new Error("Google login failed: No user data received.")
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
        languageProgress: userData.languageProgress || [],
        learnedWordsCounts: userData.learnedWordsCounts || {},
        dictionaryUnlockedCounts: userData.dictionaryUnlockedCounts || {},
        studyHours: userData.studyHours,
        completedTests: userData.completedTests,
        completedTranslations: userData.passedTranslatedTexts?.length || 0,
        achievements: userData.achievements,
        streakCount: userData.streakCount,
        avatarStyle: userData.avatarStyle || "adventurer",
        isVerified: userData.isVerified || false,
        subscription: userData.subscription || {
          active: false,
          type: "free_trial",
          expiresAt: null,
          trialStartedAt: null,
          daysRemaining: 0,
        },
      }
      localStorage.setItem("user", JSON.stringify(userToStore))
      setToken(newToken)
      setUser(userToStore)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials)
      const { token: newToken, user: userData } = response.data

      if (!userData || Object.keys(userData).length === 0) {
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
        languageProgress: userData.languageProgress || [],
        learnedWordsCounts: userData.learnedWordsCounts || {},
        dictionaryUnlockedCounts: userData.dictionaryUnlockedCounts || {},
        studyHours: userData.studyHours,
        completedTests: userData.completedTests,
        completedTranslations: userData.passedTranslatedTexts?.length || 0,
        achievements: userData.achievements,
        streakCount: userData.streakCount,
        avatarStyle: userData.avatarStyle || "adventurer",
        isVerified: userData.isVerified || false,
        subscription: userData.subscription || {
          active: false,
          type: "free_trial",
          expiresAt: null,
          trialStartedAt: null,
          daysRemaining: 0,
        },
      }
      localStorage.setItem("user", JSON.stringify(userToStore))
      setToken(newToken)
      setUser(userToStore)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      if (!prev) {
        return null
      }
      const newUser = { ...prev, ...updatedData }
      localStorage.setItem("user", JSON.stringify(newUser))
      return newUser
    })
  }, [])

  const logout = useCallback(() => {
    // Disconnect socket on logout
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    googleLogin,
    register: useCallback(async (userData) => {
      try {
        const response = await authService.register(userData)
        return response
      } catch (error) {
        throw error
      }
    }, []),
    logout,
    updateUser,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}