"use client"

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./context/SidebarContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import SubscriptionGate from "./components/SubscriptionGate"
import NoAuth from "./components/NoAuth"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
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
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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
                      {/* <Route path="/chat" element={<Chat />} /> */}
                      <Route path="/grammar" element={<Grammar />} />
                      {/* <Route path="/challenge" element={<Challenge />} /> */}
                      <Route path="/plan" element={<Plan />} />
                      <Route path="/tests" element={<Tests />} />
                      <Route path="/pronunciation" element={<Pronunciation />} />
                      <Route path="/quizes" element={<Quizes />} />
                      <Route path="/puzzle" element={<Puzzle />} />
                      <Route path="/practice" element={<Practice />} />
                      <Route path="/words" element={<Words />} />
                      <Route path="/phrases" element={<Phrase />} />
                      <Route path="/academies" element={<Academy />} />
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
