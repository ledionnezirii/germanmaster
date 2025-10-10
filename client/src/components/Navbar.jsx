"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSidebar } from "../context/SidebarContext"
import { Menu, User, LogOut, ChevronDown, Star } from "lucide-react"
import mainLogo from "../../public/wortii.png"

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
    { to: "/terms", label: "Politika e Privatesise" }, // Chat
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
      default: "bg-emerald-600 text-white hover:bg-emerald-700", // Updated to emerald for better color
      ghost: "text-slate-100 hover:bg-slate-700/50 hover:text-white", // Softer ghost button
      outline: "border border-slate-500 text-slate-100 hover:bg-slate-700/50 hover:text-white", // Softer outline button
    }
    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-2 rounded-md", // Smaller size for mobile
      lg: "h-11 px-8 rounded-md",
      icon: "h-9 w-9", // Smaller icon size for mobile
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
      <div className={`relative flex h-7 w-7 md:h-8 md:w-8 shrink-0 overflow-hidden rounded-full ${className}`}>
        {" "}
        {/* Smaller avatar on mobile */}
        {src && !imageError ? (
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-500 text-white text-xs md:text-sm font-medium">
            {" "}
            {/* Updated color and smaller text on mobile */}
            {fallback}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600/50 sticky top-0 z-50 shadow-lg">
      {" "}
      {/* Better gradient background and shadow */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {" "}
        {/* Reduced mobile padding */}
        <div className="flex justify-between items-center h-16">
          {" "}
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {" "}
            {/* Reduced spacing on mobile */}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-4 w-4 text-slate-100" /> {/* Smaller icon and better color */}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center group-hover:bg-emerald-900/30 rounded-2xl transition-colors">
                {" "}
                {/* Updated hover color */}
                <img
                  src={mainLogo || "/placeholder.svg"}
                  width={40} // Smaller logo on mobile
                  height={40} // Smaller logo on mobile
                  className="md:w-[55px] md:h-[55px] rounded-full cursor-pointer p-0 m-0"
                  alt="logo"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base md:text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  {" "}
                  gjuhagjermane
                </span>
                <span className="text-xs text-orange-200 hidden sm:block">Gjermanisht për Shqiptarët</span>{" "}
                {/* Updated color */}
              </div>
            </Link>
          </div>
          {/* Center - Navigation links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-slate-100 hover:text-white hover:bg-slate-700/50 px-4 py-2 rounded-md text-sm font-medium transition-colors" // Better colors and hover effect
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {" "}
            {/* Reduced spacing on mobile */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {" "}
                {/* Added XP display container */}
                {user?.xp !== undefined && (
                  <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full text-xs font-medium">
                    <Star className="h-3 w-3" />
                    <span>{user.xp} XP</span>
                  </div>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 md:space-x-2 text-slate-100 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors" // Smaller text and spacing on mobile, better colors
                  >
                    <Avatar
                      src={user?.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      fallback={user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                    />
                    <span className="hidden sm:block text-orange-300 font-medium">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase()}`
                        : user?.firstName
                          ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()
                          : "Profili"}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 md:h-4 md:w-4 text-slate-100 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} // Smaller icon on mobile and better color
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 md:w-56 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl ring-1 ring-slate-600/50 ring-opacity-5 focus:outline-none z-50">
                      {" "}
                      {/* Better styling with backdrop blur and larger width on mobile */}
                      <div className="py-1">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-slate-600/50">
                          {" "}
                          {/* Softer border */}
                          <div className="flex flex-col space-y-1">
                            {user?.firstName && (
                              <p className="font-medium">
                                <span className="text-orange-300">
                                  {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()}{" "}
                                  {user?.lastName
                                    ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase()
                                    : ""}
                                </span>
                              </p>
                            )}
                            {user?.email && <p className="text-slate-300 truncate text-sm">{user.email}</p>}
                          </div>
                        </div>

                        {/* Account Link */}
                        <Link
                          to="/account"
                          className="flex items-center px-4 py-2 text-slate-100 hover:bg-slate-700/50 hover:text-white transition-colors" // Better colors
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="mr-3 h-4 w-4" />
                          Cilësimet e Llogarisë
                        </Link>

                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors" // Softer hover background
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Dilni
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/signin"
                  className="text-slate-100 hover:text-white hover:bg-slate-700/50 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors" // Better colors
                >
                  <span className="hidden xs:inline">Hyni</span>
                  <span className="xs:hidden">Hyr</span>
                </Link>
                <Link
                  to="/signup"
                  className="bg-emerald-500 text-white hover:bg-emerald-600 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shadow-md" // Updated to emerald color and added shadow
                >
                  <span className="hidden xs:inline">Regjistrohuni</span>
                  <span className="xs:hidden">Regjistro</span>
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
