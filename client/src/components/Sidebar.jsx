"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useSidebar } from "../context/SidebarContext"
import { useAuth } from "../context/AuthContext"
import {
  Home,
  Headphones,
  Languages,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TestTube2Icon,
  LightbulbIcon,
  Dumbbell,
  Pen,
  NotebookPenIcon,
  BarChart,
  Calendar,
  InfinityIcon,
  BookUser,
  UniversityIcon,
  ChevronDown,
  FileTerminal,
} from "lucide-react"
import { MicrophoneIcon } from "@heroicons/react/24/outline"

const fonts = {
  poppins: ["Poppins", "sans-serif"].join(", "),
  inter: ["Inter", "sans-serif"].join(", "),
}

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // State for expanded submenus
  const [expandedMenus, setExpandedMenus] = useState({
    Mëso: true,
    Ushtro: true,
  })

  const toggleMenu = (label) => {
    if (isCollapsed) {
      toggleSidebar()
      // Allow sidebar animation to start before expanding menu
      setTimeout(() => {
        setExpandedMenus((prev) => ({ ...prev, [label]: true }))
      }, 50)
    } else {
      setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
    }
  }

  const menuItems = [
    { icon: Home, label: "Kryefaqja", path: "/", requireAuth: false },
    { icon: BookUser, label: "Fjalor", path: "/dictionary" },
    { icon: Languages, label: "Përkthe", path: "/translate" },
    { icon: Headphones, label: "Dëgjo", path: "/listen" },

    {
      icon: FileTerminal,
      label: "Gramatika",
      path: "#",
      requireAuth: true,
      subItems: [
        { icon: UniversityIcon, label: "Mëso Gramatiken", path: "/grammar" },
        { icon: Dumbbell, label: "Ushtro Gramatiken", path: "/practice" },
      ],
    },
    { icon: InfinityIcon, label: "Baza Gjuhësore", path: "/category" },
    { icon: LightbulbIcon, label: "Kuizet", path: "/quizes" },
    { icon: MicrophoneIcon, label: "Shqiptimi", path: "/pronunciation" },
    { icon: NotebookPenIcon, label: "Fraza te ndryshme", path: "/phrases" },
    { icon: Pen, label: "Fjalori Personal", path: "/words" },
    { icon: TestTube2Icon, label: "Tests", path: "/tests" },
    { icon: BarChart, label: "Renditja", path: "/leaderboard", requireAuth: false },
    { icon: Calendar, label: "PlanProgrami", path: "/plan", requireAuth: true },
    /*{ icon: User, label: "Menaxho", path: "/academies", requireAuth: true },*/
    { icon: User, label: "Llogaria", path: "/account", requireAuth: true },
  ]

  const footerMenuItems = [
    {
      icon: Sparkles,
      label: "Kaloni në Premium",
      path: "/payments",
      requireAuth: false,
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => !item.requireAuth || isAuthenticated)
  const filteredFooterMenuItems = footerMenuItems.filter((item) => !item.requireAuth || isAuthenticated)

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })

    if (window.innerWidth < 1024 && !isCollapsed) {
      toggleSidebar()
    }
  }

  const getTransitionStyle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "transform 0.3s ease-out, width 0.3s ease-out"
    }
    return "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  }

  // Auto-expand menus if child is active
  useEffect(() => {
    if (isCollapsed) return

    menuItems.forEach((item) => {
      if (item.subItems && item.subItems.some((sub) => location.pathname === sub.path)) {
        setExpandedMenus((prev) => ({ ...prev, [item.label]: true }))
      }
    })
  }, [location.pathname, isCollapsed])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {!isCollapsed && (
        <div
          className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity duration-300 ease-out ${
            !isCollapsed ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backdropFilter: window.innerWidth < 768 ? "blur(4px)" : "blur(12px)",
            touchAction: "none",
          }}
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed left-0 top-16 bottom-0 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950/95 border-r border-white/5 z-40 lg:z-10 flex flex-col shadow-2xl ${isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}`}
        style={{
          fontFamily: fonts.poppins,
          transition: getTransitionStyle(),
          willChange: "transform, width",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-10 hidden rounded-full border-2 border-white/10 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-xl transition-all duration-200 hover:shadow-2xl hover:border-emerald-500/30 hover:bg-slate-800/95 hover:scale-110 md:block group"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          )}
        </button>

        <nav
          className="relative mt-6 px-3 pb-6 flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(148, 163, 184, 0.3) transparent",
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              width: 6px;
            }
            nav::-webkit-scrollbar-track {
              background: transparent;
            }
            nav::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.3);
              border-radius: 3px;
            }
            nav::-webkit-scrollbar-thumb:hover {
              background: rgba(148, 163, 184, 0.5);
            }
          `}</style>
          <ul className="space-y-1.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expandedMenus[item.label]

              // Check if item or any subitem is active
              const isChildActive = hasSubItems && item.subItems.some((sub) => location.pathname === sub.path)
              const isActive = location.pathname === item.path || isChildActive

              if (hasSubItems) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full relative group flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 overflow-hidden ${
                        isActive || isExpanded ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                      } ${isCollapsed ? "justify-center" : "justify-between"}`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <div className="flex items-center">
                        <div className={`relative flex items-center ${isCollapsed ? "" : "mr-3"}`}>
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                              isActive
                                ? "text-emerald-400"
                                : "text-slate-400 group-hover:text-emerald-400 group-hover:scale-110"
                            }`}
                          />
                          {isActive && <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"></div>}
                        </div>
                        {!isCollapsed && <span className="truncate relative z-10">{item.label}</span>}
                      </div>

                      {!isCollapsed && (
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded && !isCollapsed ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <ul className="mt-1 space-y-1 pl-4 relative">
                        {/* Vertical line for tree structure */}
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10"></div>

                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = location.pathname === subItem.path
                          return (
                            <li key={subItem.path}>
                              <Link
                                to={subItem.path}
                                onClick={handleLinkClick}
                                className={`relative group flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                                  isSubActive
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                }`}
                              >
                                <SubIcon
                                  className={`h-4 w-4 mr-3 ${isSubActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}`}
                                />
                                <span className="truncate">{subItem.label}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </li>
                )
              }

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`relative group flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-white shadow-lg shadow-emerald-500/10"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    } ${isCollapsed ? "justify-center" : "justify-start"}`}
                    title={isCollapsed ? item.label : ""}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"></div>
                    )}
                    <div className={`relative flex items-center ${isCollapsed ? "" : "mr-3"}`}>
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                          isActive
                            ? "text-emerald-400"
                            : "text-slate-400 group-hover:text-emerald-400 group-hover:scale-110"
                        }`}
                      />
                      {isActive && <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"></div>}
                    </div>
                    {!isCollapsed && <span className="truncate relative z-10">{item.label}</span>}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="relative mt-auto px-3 py-4 border-t border-white/5 bg-gradient-to-b from-transparent to-slate-950/50">
          <ul className="space-y-1.5">
            {filteredFooterMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={item.action || handleLinkClick}
                    className={`relative group flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-white shadow-lg shadow-amber-500/10"
                        : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/30"
                    } ${isCollapsed ? "justify-center" : "justify-start"}`}
                    title={isCollapsed ? item.label : ""}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5"></div>
                    <div className={`relative flex items-center ${isCollapsed ? "" : "mr-3"}`}>
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                          isActive ? "text-amber-400" : "group-hover:scale-110"
                        }`}
                      />
                      {isActive && <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md"></div>}
                    </div>
                    {!isCollapsed && <span className="truncate relative z-10">{item.label}</span>}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </Link>
                </li>
              )
            })}
          </ul>
          {!isCollapsed && (
            <div className="mt-6 px-2 text-center">
              <div
                className="text-[10px] text-slate-500 font-medium leading-relaxed"
                style={{ fontFamily: fonts.inter }}
              >
                <p className="mb-0.5">© {new Date().getFullYear()} gjuhagjermane</p>
                <p className="text-slate-600">Të gjitha të drejtat e rezervuara.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
