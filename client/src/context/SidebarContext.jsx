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
  const [isCollapsed, setIsCollapsed] = useState(true) // Start collapsed on mobile

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop - can be expanded
        setIsCollapsed(false)
      } else {
        // Mobile - start collapsed
        setIsCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const value = {
    isCollapsed,
    toggleSidebar,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}
