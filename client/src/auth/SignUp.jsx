"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import webLogo from "../../public/logo.png"

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
  const [error, setError] = useState("")

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.termsAccepted) {
      setError("Ju duhet të pranoni kushtet dhe afatet për të vazhduar.")
      setLoading(false)
      return
    }

    try {
      await register(formData)
      // Redirect directly to login page after successful registration
      navigate("/signin")
    } catch (err) {
      const errorMessage = err.response?.data?.message || ""
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exists")) {
        setError("Ky email është tashmë i regjistruar. Ju lutemi përdorni një email tjetër.")
      } else if (errorMessage.toLowerCase().includes("password")) {
        setError("Fjalëkalimi nuk është i vlefshëm. Ju lutemi provoni një fjalëkalim tjetër.")
      } else if (errorMessage.toLowerCase().includes("terms")) {
        setError("Ju duhet të pranoni kushtet dhe afatet për të vazhduar.")
      } else {
        setError("Regjistrimi dështoi. Ju lutemi provoni përsëri.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center sm:p-6">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src={webLogo || "/placeholder.svg"}
            alt="Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full shadow-lg mx-auto object-cover"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">Regjistrohu</h1>
          <p className="text-gray-600 text-sm sm:text-base">Krijo llogarinë tënde për të mësuar shqip</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
              <span className="text-red-500 text-lg sm:text-xl shrink-0">⚠️</span>
              <p className="text-red-600 text-xs sm:text-sm m-0 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Emri</label>
              <input
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Emri"
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Mbiemri</label>
              <input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Mbiemri"
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Adresa e email-it
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Shkruani email-in tuaj"
              className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Fjalëkalimi</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Krijoni një fjalëkalim"
                className="w-full p-2.5 sm:p-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer text-lg sm:text-xl hover:opacity-70 p-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
                className="mt-0.5 sm:mt-1 w-4 h-4 shrink-0 text-teal-500 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer accent-teal-500"
              />
              <span className="ml-2.5 sm:ml-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                Unë pranoj{" "}
                <a
                  href__="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-500 hover:text-teal-600 underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Kushtet dhe Afatet
                </a>{" "}
                dhe jam dakord me rregullat e përdorimit të platformës.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:from-[#0F9D8E] hover:to-[#0891B2] cursor-pointer"
            } text-white border-none rounded-lg py-3 sm:py-4 px-4 text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-center`}
          >
            {loading ? (
              <>
                <div className="inline-block w-4 h-4 border-b-2 border-current rounded-full animate-spin mr-2"></div>
                Duke u regjistruar...
              </>
            ) : (
              "Krijoni llogarinë"
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Keni tashmë një llogari?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="bg-none border-none text-teal-500 hover:text-teal-600 underline cursor-pointer text-sm sm:text-base font-medium"
              >
                Hyni këtu
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp