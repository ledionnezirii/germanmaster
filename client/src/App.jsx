import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./context/SidebarContext"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Home from "./pages/Home"
import Leaderboard from "./pages/Leaderboard"
import Listen from "./pages/Listen"
import Translate from "./pages/Translate"
import Account from "./pages/Account"
import Dictionary from "./pages/Dictionary"
import Category from "./pages/Category"
import Chat from "./pages/Chat"
import Grammar from "./pages/Grammar"
import SignIn from "./auth/SignIn"
import SignUp from "./auth/SignUp"
import Challenge from "./pages/Challenge"
import Plan from "./pages/Plan"
import Tests from "./pages/Tests"
import ForgotPassword from "./auth/ForgotPassword"
import ResetPassword from "./auth/ResetPassword"
import VerifyEmail from "./auth/VerifyEmail"
import Pronunciation from "./pages/Pronunciation"

const AppContent = () => {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        {/* Main content with proper margin to account for fixed sidebar */}
        <main
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}
            min-h-[calc(100vh-4rem)] overflow-y-auto
          `}
        >
          <div className="p-4 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/listen" element={<Listen />} />
              <Route path="/translate" element={<Translate />} />
              <Route path="/account" element={<Account />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/category" element={<Category />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/grammar" element={<Grammar />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verifyemail/:token" element={<VerifyEmail />} />
              {/* <Route path="/challenge" element={<Challenge />} /> */}
              <Route path="/plan" element={<Plan />} />
              <Route path="tests" element={<Tests />} />
              <Route path="/pronunciation" element={<Pronunciation />} />
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
