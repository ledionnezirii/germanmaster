"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSidebar } from "../context/SidebarContext"
import { Menu, User, LogOut, ChevronDown, Star, Flame } from 'lucide-react'
import { generateDicebearUrl } from "../services/api"
import mainLogo from "../../public/logo.png"

const fonts = {
  poppins: ["Poppins", "sans-serif"].join(", "),
  inter: ["Inter", "sans-serif"].join(", "),
}

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
    { to: "/", label: "Kryefaqja" },
    { to: "/listen", label: "Dëgjo" },
    { to: "/translate", label: "Përkthe" },
    { to: "/terms", label: "Politika e Privatesise" },
  ]

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

  const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
    const variants = {
      default:
        "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30",
      ghost: "text-slate-300 hover:bg-white/5 hover:text-white backdrop-blur-sm",
      outline:
        "border-2 border-slate-700 text-slate-200 hover:bg-white/5 hover:border-slate-600 hover:text-white backdrop-blur-sm",
      primary:
        "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98]",
      secondary:
        "bg-transparent backdrop-blur-sm text-white border border-white/30 hover:bg-white/10 hover:border-white/40 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
    }
    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-2 rounded-lg",
      lg: "h-11 px-8 rounded-xl",
      icon: "h-9 w-9",
      auth: "h-8 px-3 md:h-10 md:px-6",
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

  const Avatar = ({ src, alt, fallback, className = "" }) => {
    const [imageError, setImageError] = useState(false)
    return (
      <div
        className={`relative flex h-7 w-7 md:h-8 md:w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/5 opacity-80 hover:opacity-100 transition-opacity ${className}`}
      >
        {src && !imageError ? (
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs md:text-sm font-bold shadow-inner">
            {fallback}
          </div>
        )}
      </div>
    )
  }

 const avatarUrl = user && user.id && user.avatarStyle 
    ? generateDicebearUrl(user.id, user.avatarStyle)
    : null


  return (
    <nav
      className="bg-gradient-to-r from-slate-900/95 via-slate-850/95 to-slate-900/95 backdrop-blur-xl border-b-2 border-white/10 sticky top-0 z-50 shadow-2xl shadow-black/20"
      style={{ fontFamily: fonts.poppins }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="relative flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 rounded-full blur-md group-hover:from-emerald-400/30 group-hover:to-teal-300/30 transition-all duration-300"></div>
                <img
                  src={mainLogo || "/placeholder.svg"}
                  width={40}
                  height={40}
                  className="md:w-[50px] md:h-[50px] rounded-full relative z-10 ring-2 ring-emerald-400/30 group-hover:ring-emerald-300/50 shadow-lg shadow-emerald-500/20 group-hover:shadow-2xl group-hover:shadow-emerald-400/40 transition-all duration-300"
                  alt="logo"
                />
              </div>
              <div className="flex flex-col items-start">
                <span
                  className="text-base md:text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-teal-300 transition-all duration-300"
                  style={{ fontFamily: fonts.poppins }}
                >
                  gjuhagjermane
                </span>
                <span
                  className="text-[10px] md:text-xs text-slate-400 font-medium block"
                  style={{ fontFamily: fonts.inter }}
                >
                  Gjermanisht për Shqiptarët
                </span>
              </div>
            </Link>
          </div>

          {/* Center - Navigation links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group overflow-hidden"
                style={{ fontFamily: fonts.poppins }}
              >
                <span className="relative z-10">{link.label}</span>
                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-3/4 transition-all duration-300"></div>
              </Link>
            ))}
          </div>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.streakCount !== undefined && (
                  <div
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500/15 to-red-500/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-400/20 shadow-sm"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400/20" />
                    <span className="text-orange-300">{user.streakCount}</span>
                    <span className="text-orange-400/70 hidden sm:inline">Ditë</span>
                  </div>
                )}

                {user?.xp !== undefined && (
                  <div
                    className="hidden md:flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-400/20 shadow-sm"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                    <span className="text-amber-300">{user.xp}</span>
                    <span className="text-amber-400/70">XP</span>
                  </div>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1.5 md:space-x-2 cursor-pointer hover:bg-white/5 px-2 md:px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 group"
                    style={{ fontFamily: fonts.poppins }}
                  >
                    <Avatar
                      src={avatarUrl}
                      alt="Profile"
                      fallback={user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                    />
                    <span className="hidden sm:block text-slate-200 group-hover:text-white transition-colors">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase()}`
                        : user?.firstName
                          ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()
                          : "Profili"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400 group-hover:text-slate-200 transition-all duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 md:w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 focus:outline-none z-50 overflow-hidden"
                      style={{ fontFamily: fonts.poppins }}
                    >
                      <div className="py-1">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                          <div className="flex flex-col space-y-1">
                            {user?.firstName && (
                              <p className="font-bold text-white">
                                {user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()}{" "}
                                {user?.lastName
                                  ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase()
                                  : ""}
                              </p>
                            )}
                            {user?.email && (
                              <p
                                className="text-slate-400 truncate text-xs font-medium"
                                style={{ fontFamily: fonts.inter }}
                              >
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Account Link */}
                        <Link
                          to="/account"
                          className="flex items-center px-4 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="mr-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors cursor-pointer">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-sm">Cilësimet e Llogarisë</span>
                        </Link>

                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all duration-200 group"
                        >
                          <div className="mr-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors cursor-pointer">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span className="text-sm">Dil</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 md:space-x-2.5">
                <Button
                  variant="secondary"
                  size="auth"
                  className="text-xs md:text-sm font-bold tracking-wide cursor-pointer"
                  onClick={() => navigate("/signin")}
                >
                  Kyçu
                </Button>
                <Button
                  variant="primary"
                  size="auth"
                  className="text-xs md:text-sm font-bold tracking-wide cursor-pointer"
                  onClick={() => navigate("/signup")}
                >
                  Regjistrohu
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
