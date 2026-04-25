"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useGoogleLogin } from "@react-oauth/google"
import webLogo from "../../public/logo.png"

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await login(formData)
      navigate("/")
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || ""
      if (msg.toLowerCase().includes("device") || err.response?.status === 403) {
        setError("Jeni të kyçur në 2 pajisje. Ju lutemi dilni nga një pajisje për të vazhduar.")
      } else if (msg.toLowerCase().includes("google")) {
        setError("Ky llogari përdor Google Sign-In. Ju lutemi hyni me Google.")
      } else {
        setError("Email ose fjalëkalimi i pasaktë. Ju lutemi provoni përsëri.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async ({ access_token }) => {
    setGoogleLoading(true)
    setError("")
    try {
      await googleLogin(access_token)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.message || "Hyrja me Google dështoi. Provoni përsëri.")
    } finally {
      setGoogleLoading(false)
    }
  }

  const googleLoginHandler = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Hyrja me Google dështoi. Provoni përsëri."),
  })

  return (
    <div className="flex items-center justify-center p-5 mt-5">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src={webLogo || "/placeholder.svg"} alt="Logo" className="w-16 h-16 rounded-full shadow-lg object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Hyr në llogari</h1>
          <p className="text-gray-500 text-sm">Mirë se erdhe përsëri!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={() => googleLoginHandler()}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="text-gray-700 font-semibold text-sm">
            {googleLoading ? "Duke u kyçur..." : "Vazhdo me Google"}
          </span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">ose vazhdo me email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresa e email-it</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Shkruani email-in tuaj"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fjalëkalimi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Shkruani fjalëkalimin tuaj"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {showPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" /> : <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgotpassword" className="text-cyan-600 hover:text-cyan-700 text-xs font-medium transition-colors duration-200">
              Keni harruar fjalëkalimin?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:from-teal-600 hover:to-cyan-600 hover:shadow-lg"
            } text-white shadow-md`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Duke u kyçur...
              </>
            ) : "Hyni"}
          </button>
        </form>

        <p className="mt-5 text-center text-gray-600 text-sm">
          Nuk keni llogari?{" "}
          <Link to="/signup" className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors duration-200">
            Regjistrohuni këtu
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn
