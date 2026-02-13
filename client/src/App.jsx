"use client"

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./context/SidebarContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import SubscriptionGate from "./components/SubscriptionGate"
import NoAuth from "./components/NoAuth"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Notification from "./components/Notification"
import Home from "./pages/Home"
import Leaderboard from "./pages/Leaderboard"
import Listen from "./pages/Listen"
import Translate from "./pages/Translate"
import Account from "./pages/Account"
import Dictionary from "./pages/Dictionary"
import Category from "./pages/Category"
import Grammar from "./pages/Grammar"
import SignIn from "./auth/SignIn"
import SignUp from "./auth/SignUp"
import Plan from "./pages/Plan"
import Tests from "./pages/Tests"
import ForgotPassword from "./auth/ForgotPassword"
import ResetPassword from "./auth/ResetPassword"
import VerifyEmail from "./auth/VerifyEmail"
import Pronunciation from "./pages/Pronunciation"
import Quizes from "./pages/Quizes"
import Payments from "./pages/Payments"
import Terms from "./pages/Terms"
import Puzzle from "./pages/Puzzle"
import Practice from "./pages/Practice"
import Words from "./pages/Words"
import Phrase from "./pages/Phrase"
import Academy from "./pages/Academy"
import Race from "./pages/Race"
import Dialogue from "./pages/Dialogue"
import Sentence from "./pages/Sentence"
import Structure from "./pages/Structure"
import FlashCard from "./pages/FlashCard"
import Chat from "./pages/Chat"
import Community from "./pages/Community"


const AppContent = () => {
  const { isCollapsed } = useSidebar()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

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
          {!hideLayout && isAuthenticated && (
            <Notification 
              message="🎉 50% zbritje për 100 përdoruesit e parë! Na kontaktoni në Instagram @gjuhagjermanee për të përfituar ofertën."
              type="promo"
              storageKey="promo_50_discount_v1"
            />
          )}
          
          <div className="p-4 max-w-7xl mx-auto">
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/terms" element={<Terms />} />

              <Route path="/payments" element={<Payments />} />
              <Route path="/billing" element={<Payments />} />

              <Route
                path="/*"
                element={
                  <SubscriptionGate>
                    <Routes>
                      <Route path="/" element={isAuthenticated ? <Home /> : <NoAuth />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/listen" element={<Listen />} />
                      <Route path="/translate" element={<Translate />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/dictionary" element={<Dictionary />} />
                      <Route path="/category" element={<Category />} />
                      <Route path="/grammar" element={<Grammar />} />
                      <Route path="/question" element={<Chat />} />
                      <Route path="/plan" element={<Plan />} />
                      <Route path="/tests" element={<Tests />} />
                      <Route path="/pronunciation" element={<Pronunciation />} />
                      <Route path="/quizes" element={<Quizes />} />
                      <Route path="/puzzle" element={<Puzzle />} />
                      <Route path="/practice" element={<Practice />} />
                      <Route path="/words" element={<Words />} />
                      <Route path="/phrases" element={<Phrase />} />
                      <Route path="/race" element={<Race />} />
                      <Route path="/academies" element={<Academy />} />
                      <Route path="/dialogue" element={<Dialogue />} />
                      <Route path="/sentences" element={<Sentence />} />
                      <Route path="/structure" element={<Structure />} />
                      <Route path="/flashcards" element={<FlashCard />} />
                      <Route path="/community" element={<Community />} />
                    </Routes>
                  </SubscriptionGate>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <AppContent />
        </Router>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App