"use client"

import { Link, useLocation } from "react-router-dom"
import { useSidebar } from "../context/SidebarContext" // Assuming this path is correct
import { useAuth } from "../context/AuthContext" // Assuming this path is correct
import {
  Home,
  Trophy,
  Headphones,
  Languages,
  User,
  BookOpen,
  FolderOpen,
  MessageCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Swords,
} from "lucide-react"

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: "Home", path: "/", requireAuth: false },
    { icon: Languages, label: "Translate", path: "/translate", requireAuth: true },
    { icon: Headphones, label: "Listen", path: "/listen", requireAuth: true },
    { icon: BookOpen, label: "Dictionary", path: "/dictionary", requireAuth: true },
    { icon: FolderOpen, label: "Category", path: "/category", requireAuth: true },
    { icon: MessageCircle, label: "Chat", path: "/chat", requireAuth: true },
    { icon: Swords, label: "Challenge", path: "/challenge", requireAuth: true },
    { icon: GraduationCap, label: "Grammar", path: "/grammar", requireAuth: true },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard", requireAuth: false },
    { icon: User, label: "Account", path: "/account", requireAuth: true },
  ]

  const filteredMenuItems = menuItems.filter((item) => !item.requireAuth || isAuthenticated)

  // Handle link click - close sidebar on mobile
  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 1024 && !isCollapsed) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile overlay - only show on mobile when sidebar is open */}
      {!isCollapsed && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-16 bottom-0 bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}
          z-40 lg:z-10
        `}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-10 hidden rounded-full border border-slate-700 bg-slate-800 p-1 shadow-md transition-shadow hover:shadow-lg lg:block"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-300" />
          )}
        </button>

        {/* Menu items */}
        <nav className="mt-8 px-3 pb-6">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${isActive ? "bg-green-400/20 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}
                      ${isCollapsed ? "justify-center" : "justify-start"}
                    `}
                    title={isCollapsed ? item.label : ""}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
