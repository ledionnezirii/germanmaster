"use client"

import { createContext, useContext, useState, useEffect } from "react"
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("authToken"))

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken")
      if (savedToken) {
        try {
          const response = await authService.getProfile()
          setUser({
            id: response.data.id,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            profilePicture: response.data.profilePicture,
            xp: response.data.xp,
            level: response.data.level,
            studyHours: response.data.studyHours,
            completedTests: response.data.completedTests,
          })
          setToken(savedToken)
        } catch (error) {
          console.error("Auth initialization error:", error)
          localStorage.removeItem("authToken")
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials)
      const { token: newToken, user: userData } = response.data

      localStorage.setItem("authToken", newToken)
      setToken(newToken)
      setUser({
        id: userData.id,
        firstName: userData.emri,
        lastName: userData.mbiemri,
        email: userData.email,
        profilePicture: userData.profilePicture,
        xp: userData.xp,
        level: userData.level,
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }))
  }

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
