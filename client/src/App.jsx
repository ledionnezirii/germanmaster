"use client"

import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./context/SidebarContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import SubscriptionGate from "./components/SubscriptionGate"
import NoAuth from "./components/NoAuth"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Notification from "./components/Notification"
import { LanguageProvider, useLanguage } from "./context/LanguageContext"

// Lazy-loaded pages — each page is only downloaded when first visited
const Home = lazy(() => import("./pages/Home"))
const Leaderboard = lazy(() => import("./pages/Leaderboard"))
const Listen = lazy(() => import("./pages/Listen"))
const Translate = lazy(() => import("./pages/Translate"))
const Account = lazy(() => import("./pages/Account"))
const Dictionary = lazy(() => import("./pages/Dictionary"))
const Category = lazy(() => import("./pages/Category"))
const Grammar = lazy(() => import("./pages/Grammar"))
const SignIn = lazy(() => import("./auth/SignIn"))
const SignUp = lazy(() => import("./auth/SignUp"))
const Plan = lazy(() => import("./pages/Plan"))
const Tests = lazy(() => import("./pages/Tests"))
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"))
const ResetPassword = lazy(() => import("./auth/ResetPassword"))
const VerifyEmail = lazy(() => import("./auth/VerifyEmail"))
const Pronunciation = lazy(() => import("./pages/Pronunciation"))
const Quizes = lazy(() => import("./pages/Quizes"))
const Payments = lazy(() => import("./pages/Payments"))
const Terms = lazy(() => import("./pages/Terms"))
const Puzzle = lazy(() => import("./pages/Puzzle"))
const Practice = lazy(() => import("./pages/Practice"))
const Words = lazy(() => import("./pages/Words"))
const Phrase = lazy(() => import("./pages/Phrase"))
const Academy = lazy(() => import("./pages/Academy"))
const Race = lazy(() => import("./pages/Race"))
const Sentence = lazy(() => import("./pages/Sentence"))
const Structure = lazy(() => import("./pages/Structure"))
const FlashCard = lazy(() => import("./pages/FlashCard"))
const Chat = lazy(() => import("./pages/Chat"))
const Community = lazy(() => import("./pages/Community"))
const Createword = lazy(() => import("./pages/Createword"))
const Exam = lazy(() => import("./pages/Exam"))
const Admin = lazy(() => import("./components/Admin"))
const Videos = lazy(() => import("./pages/Videos"))
const Stories = lazy(() => import("./pages/Story"))
const WordAudio = lazy(() => import("./pages/WordAudio"))
const Giveaway = lazy(() => import("./components/Giveaway"))
const Poll = lazy(() => import("./components/Poll"))
const PathPage = lazy(() => import("./pages/Path"))

const LANG_NAMES_AL = {
  de: "Gjermanisht",
  en: "Anglisht",
  fr: "Frëngjisht",
  tr: "Turqisht",
  it: "Italisht",
}

const LANG_FLAGS = {
  de: "https://flagcdn.com/w40/de.png",
  en: "https://flagcdn.com/w40/gb.png",
  fr: "https://flagcdn.com/w40/fr.png",
  tr: "https://flagcdn.com/w40/tr.png",
  it: "https://flagcdn.com/w40/it.png",
}

const AppContent = () => {
  const { isCollapsed } = useSidebar()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { language, switching, pendingLanguage } = useLanguage()

  useEffect(() => {
    if (switching) navigate("/")
  }, [switching])

  // Routes where Navbar/Sidebar should be hidden
  const hiddenLayoutPaths = ["/signin", "/signup", "/forgotpassword", "/verify/", "/reset-password/"]
  const hideLayout = hiddenLayoutPaths.some((path) => location.pathname.startsWith(path))

  // Show loading state while checking auth
  if (loading && location.pathname === "/") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-gray-600 text-sm font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Language switch overlay */}
      {switching && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 28,
        }}>
          <style>{`
            @keyframes langPulse {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.12); opacity: 1; }
            }
            @keyframes langSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes langFadeIn {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <img
            src={LANG_FLAGS[pendingLanguage]}
            alt={LANG_NAMES_AL[pendingLanguage]}
            style={{
              width: 96, height: 64, objectFit: "cover",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              animation: "langPulse 1.2s ease-in-out infinite",
            }}
          />

          <div style={{
            width: 56, height: 56,
            border: "4px solid rgba(139,92,246,0.25)",
            borderTop: "4px solid #8b5cf6",
            borderRadius: "50%",
            animation: "langSpin 0.9s linear infinite",
          }} />

          <div style={{
            textAlign: "center", animation: "langFadeIn 0.5s ease both",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Duke ndërruar gjuhën
            </p>
            <p style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {LANG_NAMES_AL[pendingLanguage] || pendingLanguage}
            </p>
          </div>
        </div>
      )}

      {/* Navbar */}
      {!hideLayout && <Navbar />}

      <div className="flex flex-1 relative">
        {!hideLayout && isAuthenticated && <Sidebar />}

        {/* Main content with proper margin */}
        <main
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!hideLayout && isAuthenticated ? (isCollapsed ? "lg:ml-16" : "lg:ml-64") : ""}
            min-h-[calc(100vh-4rem)] overflow-y-auto
          `}
        >
          {/* Notification Banner - now inside main content */}
          {/* {!hideLayout && isAuthenticated && (
            <Notification
              message="🎁 GIVEAWAY — 5 fitues marrin 1 Muaj Premium Falas! Po bëjmë giveaway. Regjistrohu tani tek ikona e dhurates me larte dhe fito akses premium në gjuhagjermane!"
              type="info"
              storageKey="giveaway_monthly"
            />
          )} */}

          {/* {!hideLayout && isAuthenticated && <Poll />} */}

          <div className="p-4 max-w-7xl mx-auto">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={isAuthenticated ? <Home /> : <NoAuth />} />

              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/terms" element={<Terms />} />

              <Route path="/payments" element={<Payments />} />
              <Route path="/billing" element={<Payments />} />
              <Route path="/giveaways" element={<Giveaway />} />
              <Route path="/translate" element={<Translate />} />
              <Route path="/sentences" element={<Sentence />} />
              <Route path="/createword" element={<Createword />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/phrases" element={<Phrase />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/quizes" element={<Quizes />} />
              <Route path="/listen" element={<Listen />} />
              <Route path="/account" element={<Account />} />
                      <Route path="/wordaudio" element={<WordAudio />} />
                      <Route path="/quizes" element={<Quizes />} />

                      <Route path="/dictionary" element={<Dictionary />} />
                      <Route path="/category" element={<Category />} />
                      <Route path="/question" element={<Chat />} />
                      <Route path="/pronunciation" element={<Pronunciation />} />
                      <Route path="/grammar" element={<Grammar />} />
                      <Route path="/phrases" element={<Phrase />} />
                      <Route path="/tests" element={<Tests />} />
                      <Route path="/question" element={<Chat />} />
                      <Route path="/question" element={<Chat />} />
                      <Route path="/exam" element={<Exam />} />
                      <Route path="/videos" element={<Videos />} />
                      <Route path="/admin" element={<Admin />} />
<Route path="/words" element={<Words selectedLanguage={language} />} />


              <Route
                path="/*"
                element={
                  <SubscriptionGate>
                    <Routes>
                     
                      <Route path="/plan" element={<Plan />} />
                      <Route path="/puzzle" element={<Puzzle />} />
                      <Route path="/practice" element={<Practice />} />
                      <Route path="/race" element={<Race />} />
                      <Route path="/academies" element={<Academy />} />
                      <Route path="/structure" element={<Structure />} />
                      <Route path="/flashcards" element={<FlashCard />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/stories" element={<Stories />} />
                      <Route path="/path" element={<PathPage />} />

                    </Routes>
                  </SubscriptionGate>
                }
              />
            </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <AppContent />
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App