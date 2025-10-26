"use client"

import { Link, useLocation } from "react-router-dom"
import { useSidebar } from "../context/SidebarContext"
import { useAuth } from "../context/AuthContext"
import {
  Home,
  Trophy,
  Headphones,
  Languages,
  User,
  BookOpen,
  FolderOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapIcon,
  TestTube2Icon,
  LightbulbIcon,
  Dumbbell,
  Notebook,
  Pen,
  NotebookPenIcon,
} from "lucide-react"
import { MicrophoneIcon } from "@heroicons/react/24/outline"

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: "Kryefaqja", path: "/", requireAuth: false },
    { icon: Languages, label: "Përkthe", path: "/translate", requireAuth: true },
    { icon: Headphones, label: "Dëgjo", path: "/listen", requireAuth: true },
    { icon: BookOpen, label: "Fjalor", path: "/dictionary", requireAuth: true },
    { icon: FolderOpen, label: "Kategori", path: "/category", requireAuth: true },
    { icon: GraduationCap, label: "Gramatikë", path: "/grammar", requireAuth: true },
    { icon: Trophy, label: "Renditja", path: "/leaderboard", requireAuth: false },
    { icon: MapIcon, label: "PlanProgrami", path: "/plan", requireAuth: true },
    { icon: TestTube2Icon, label: "Tests", path: "/tests", requireAuth: true },
    { icon: MicrophoneIcon, label: "Shqiptimi", path: "/pronunciation", requireAuth: true },
    { icon: LightbulbIcon, label: "Kuizet", path: "/quizes", requireAuth: true },
    { icon: Pen, label: "Fjalori Personal", path: "/words", requireAuth: true },
    { icon: Dumbbell, label: "Ushtro", path: "/practice", requireAuth: true },
    { icon: NotebookPenIcon, label: "Fraza te ndryshme", path: "/phrases", requireAuth: true },
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

  return (
    <>
      {!isCollapsed && (
        <div
          className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-out ${!isCollapsed ? "opacity-100" : "opacity-0"
            }`}
          onClick={toggleSidebar}
          aria-hidden="true"
          style={{ touchAction: "none" }}
        />
      )}

      <div
        className={`fixed left-0 top-16 bottom-0 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950/95 backdrop-blur-xl border-r border-white/5 z-40 lg:z-10 flex flex-col shadow-2xl ${isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}`}
        style={{
          transition:
            "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform, width",
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>

        {/* Toggle button */}
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
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`relative group flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 overflow-hidden ${isActive
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
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${isActive
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

        {/* Footer Section */}
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
                    className={`relative group flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 overflow-hidden ${isActive
                        ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-white shadow-lg shadow-amber-500/10"
                        : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/30"
                      } ${isCollapsed ? "justify-center" : "justify-start"}`}
                    title={isCollapsed ? item.label : ""}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5"></div>
                    <div className={`relative flex items-center ${isCollapsed ? "" : "mr-3"}`}>
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${isActive ? "text-amber-400" : "group-hover:scale-110"
                          }`}
                      />
                      {isActive && <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md"></div>}
                    </div>
                    {!isCollapsed && <span className="truncate relative z-10">{item.label}</span>}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </Link>
                  {!isCollapsed && item.description && (
                    <p className="mt-1.5 ml-8 text-xs text-slate-500 font-medium">{item.description}</p>
                  )}
                </li>
              )
            })}
          </ul>
          {!isCollapsed && (
            <div className="mt-6 px-2 text-center">
              <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                <p className="mb-0.5">© {new Date().getFullYear()} German Tutor</p>
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
