"use client"

import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
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

const AppContent = () => {
  const { isCollapsed } = useSidebar()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const { language } = useLanguage()

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