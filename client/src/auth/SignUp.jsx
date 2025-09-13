"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import webLogo from "../images/logoIMG.jpeg"

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await register(formData)
      setSuccess(true)
    } catch (err) {
      const errorMessage = err.response?.data?.message || ""
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exists")) {
        setError("Ky email është tashmë i regjistruar. Ju lutemi përdorni një email tjetër.")
      } else if (errorMessage.toLowerCase().includes("password")) {
        setError("Fjalëkalimi nuk është i vlefshëm. Ju lutemi provoni një fjalëkalim tjetër.")
      } else {
        setError("Regjistrimi dështoi. Ju lutemi provoni përsëri.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-5">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl">
            ✉️
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-4 leading-tight">Kontrolloni email-in tuaj</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ne kemi dërguar një link verifikimi në <strong>{formData.email}</strong>. Ju lutemi klikoni në link për të
            aktivizuar llogarinë tuaj.
          </p>
          <div className="bg-amber-50 border border-amber-600 rounded-lg p-4 mb-8">
            <p className="text-amber-600 text-sm m-0">💡 Nuk e gjeni email-in? Kontrolloni dosjen "Spam" ose "Junk".</p>
          </div>
          <button
            onClick={() => navigate("/signin")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none rounded-lg py-3 px-4 text-base font-medium cursor-pointer transition-all duration-200 mb-4"
          >
            Shkoni te Hyrja
          </button>
          <p className="text-gray-600 text-sm m-0">
            Nuk keni marrë email-in?{" "}
            <button
              onClick={() => setSuccess(false)}
              className="bg-none border-none text-cyan-600 underline cursor-pointer text-sm hover:text-cyan-700"
            >
              Provoni përsëri
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-5">
      <div className="bg-white/95  backdrop-blur-lg rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <img
            src={webLogo}
            alt="Logo"
            className="w-20 h-20 mb-4 rounded-full shadow-lg mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Regjistrohu</h1>
          <p className="text-gray-600 text-base">Krijo llogarinë tënde për të mësuar shqip</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <p className="text-red-600 text-sm m-0">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emri</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">👤</span>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Emri"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all duration-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mbiemri</label>
              <input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Mbiemri"
                className="w-full p-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all duration-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresa e email-it</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">📧</span>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Shkruani email-in tuaj"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all duration-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fjalëkalimi</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔒</span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Krijoni një fjalëkalim"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all duration-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer text-xl hover:opacity-70"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 cursor-pointer"
            } text-white border-none rounded-lg py-4 px-4 text-base font-semibold transition-all duration-200 flex items-center justify-center`}
          >
            {loading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Duke u regjistruar...
              </>
            ) : (
              "Krijoni llogarinë"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignUp
