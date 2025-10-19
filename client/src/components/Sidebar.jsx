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
  MessageCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapIcon,
  TestTube2Icon,
  LightbulbIcon,
  FileQuestionMark,
  Dumbbell,
} from "lucide-react"
import { MicrophoneIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline"

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
    { icon: Dumbbell, label: "Ushtro", path: "/practice", requireAuth: true },
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
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
          style={{ touchAction: "none" }}
        />
      )}

      <div
        className={`fixed left-0 top-16 bottom-0 bg-slate-900 border-r border-slate-800 z-40 lg:z-10 flex flex-col ${isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}`}
        style={{
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-10 hidden rounded-full border border-slate-700 bg-slate-800 p-1 shadow-md transition-shadow hover:shadow-lg md:block"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-300" />
          )}
        </button>

        <nav
          className="mt-8 px-3 pb-6 flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-green-400/20 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"} ${isCollapsed ? "justify-center" : "justify-start"}`}
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

        {/* Footer Section */}
        <div className="mt-auto px-3 py-4 border-t border-slate-800">
          <ul className="space-y-2">
            {filteredFooterMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={item.action || handleLinkClick}
                    className={`flex items-center text-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-green-400/20 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"} ${isCollapsed ? "justify-center" : "justify-start"}`}
                    title={isCollapsed ? item.label : ""}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                  {!isCollapsed && item.description && (
                    <p className="mt-1 ml-8 text-xs text-slate-400">{item.description}</p>
                  )}
                </li>
              )
            })}
          </ul>
          {!isCollapsed && (
            <div className="mt-4 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} German Tutor.
              <br />
              Të gjitha të drejtat e rezervuara.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
