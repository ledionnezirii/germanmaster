"use client"

import { createContext, useContext, useState, useEffect } from "react"

const SidebarContext = createContext()

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false)
      } else {
        setIsCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (!isCollapsed) {
        // Sidebar is open on mobile - prevent background scroll
        document.body.style.overflow = "hidden"
        document.body.style.position = "fixed"
        document.body.style.width = "100%"
      } else {
        // Sidebar is closed - restore scroll
        document.body.style.overflow = ""
        document.body.style.position = ""
        document.body.style.width = ""
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
    }
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const value = {
    isCollapsed,
    toggleSidebar,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}
