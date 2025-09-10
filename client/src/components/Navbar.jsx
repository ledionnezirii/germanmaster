"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSidebar } from "../context/SidebarContext"
import { Menu, User, LogOut, ChevronDown } from "lucide-react"

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { toggleSidebar } = useSidebar()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsDropdownOpen(false)
  }

  const navLinks = [
    { to: "/", label: "Kryefaqja" }, // Home
    { to: "/leaderboard", label: "Renditja" }, // Leaderboard
    { to: "/listen", label: "Dëgjo" }, // Listen
    { to: "/translate", label: "Përkthe" }, // Translate
    { to: "/chat", label: "Bisedo" }, // Chat
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Custom Button Component
  const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
    const variants = {
      default: "bg-green-600 text-white hover:bg-green-700", // Primary action button
      ghost: "text-slate-200 hover:bg-slate-700 hover:text-white", // Softer ghost button for dark background
      outline: "border border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white", // Softer outline button for dark background
    }
    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    )
  }

  // Custom Avatar Component
  const Avatar = ({ src, alt, fallback, className = "" }) => {
    const [imageError, setImageError] = useState(false)
    return (
      <div className={`relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ${className}`}>
        {src && !imageError ? (
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-orange-500 text-white text-sm font-medium">
            {fallback}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-5 w-5 text-slate-200" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                  deutschshqip
                </span>
                <span className="text-xs text-orange-200 hidden sm:block">Gjermanisht për Shqiptarët</span>
              </div>
            </Link>
          </div>
          {/* Center - Navigation links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-slate-200 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-slate-200 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Avatar
                    src={user?.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    fallback={user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                  />
                  <span className="hidden sm:block">{user?.firstName || "Profili"}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-200 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-700 rounded-md shadow-lg ring-1 ring-slate-600 ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-slate-600">
                        <div className="flex flex-col space-y-1">
                          {user?.firstName && <p className="text-white font-medium">{user.firstName}</p>}
                          {user?.email && <p className="text-slate-300 truncate">{user.email}</p>}
                        </div>
                      </div>
                      {/* Account Link */}
                      <Link
                        to="/account"
                        className="flex items-center px-4 py-2 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Cilësimet e Llogarisë
                      </Link>
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-300 hover:bg-red-900/20 hover:text-red-200 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Dilni
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/signin"
                  className="text-slate-200 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Hyni
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Regjistrohuni
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
