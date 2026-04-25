"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
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

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    termsAccepted: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.termsAccepted) {
      setError("Ju duhet të pranoni kushtet dhe afatet për të vazhduar.")
      return
    }
    setLoading(true)
    setError("")
    try {
      await register(formData)
      navigate("/signin")
    } catch (err) {
      const msg = err.response?.data?.message || ""
      if (msg.toLowerCase().includes("ekziston") || msg.toLowerCase().includes("exists")) {
        setError("Ky email është tashmë i regjistruar. Klikoni 'Hyni këtu' për të hyrë.")
      } else if (msg.toLowerCase().includes("password")) {
        setError("Fjalëkalimi nuk është i vlefshëm. Duhet të jetë të paktën 6 karaktere.")
      } else {
        setError("Ky email është tashmë i regjistruar. Klikoni 'Hyni këtu' për të hyrë.")
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
      setError(err.response?.data?.message || "Regjistrimi me Google dështoi. Provoni përsëri.")
    } finally {
      setGoogleLoading(false)
    }
  }

  const googleLoginHandler = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Regjistrimi me Google dështoi. Provoni përsëri."),
  })

  return (
    <div className="flex items-center justify-center sm:p-6 py-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-white/20">

        <div className="text-center mb-5">
          <img src={webLogo || "/placeholder.svg"} alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 mb-3 rounded-full shadow-lg mx-auto object-cover" />
          <h1 className="text-2xl font-bold text-gray-700 mb-1">Regjistrohu</h1>
          <p className="text-gray-500 text-sm">Krijo llogarinë tënde falas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <span className="text-red-500 text-lg shrink-0">⚠️</span>
            <p className="text-red-600 text-xs leading-relaxed">{error}</p>
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
            {googleLoading ? "Duke u regjistruar..." : "Regjistrohu me Google"}
          </span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">ose regjistrohu me email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Emri</label>
              <input
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Emri"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Mbiemri</label>
              <input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Mbiemri"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Adresa e email-it</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Shkruani email-in tuaj"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Fjalëkalimi</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Të paktën 6 karaktere"
                className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
              className="mt-0.5 w-4 h-4 shrink-0 accent-teal-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              Unë pranoj{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-600 underline font-medium" onClick={(e) => e.stopPropagation()}>
                Kushtet dhe Afatet
              </a>{" "}
              dhe jam dakord me rregullat e platformës.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:from-[#0F9D8E] hover:to-[#0891B2] hover:shadow-lg cursor-pointer"
            } text-white rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center shadow-md`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-b-2 border-current rounded-full animate-spin mr-2" />
                Duke u regjistruar...
              </>
            ) : "Krijoni llogarinë"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Keni tashmë një llogari?{" "}
          <button onClick={() => navigate("/signin")} className="text-teal-500 hover:text-teal-600 underline font-medium cursor-pointer bg-transparent border-none">
            Hyni këtu
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignUp
