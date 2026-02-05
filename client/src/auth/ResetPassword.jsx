"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { authService } from "../services/api"
import webLogo from "../../public/logo.png"

const ResetPassword = () => {
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const email = searchParams.get("email")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("Fjalëkalimi duhet të jetë të paktën 6 karaktere")
      setLoading(false)
      return
    }

    try {
      await authService.resetPasswordWithCode(code, newPassword)
      setSuccess(true)
      setTimeout(() => navigate("/signin"), 2000)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Kodi i pavlefshëm ose ka skaduar. Ju lutemi provoni përsëri."
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-2xl border border-white/20 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 text-xl sm:text-2xl">
            ✓
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-3 sm:mb-4 leading-tight">
            Fjalëkalimi u rivendos!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            Fjalëkalimi juaj u rivendos me sukses. Ju mund të hyni tani me fjalëkalimin e ri.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm">
            Duke ju drejtuar në faqen e hyrjes...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src={webLogo || "/placeholder.svg"}
            alt="Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full shadow-lg mx-auto object-cover"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">
            Rivendosni Fjalëkalimin
          </h1>
          {email && (
            <p className="text-gray-600 text-sm sm:text-base">
              Kodi u dërgua në: <strong className="break-all">{email}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
              <span className="text-red-500 text-lg sm:text-xl shrink-0">⚠️</span>
              <p className="text-red-600 text-xs sm:text-sm m-0 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Kodi i Rivendosjes
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Shkruani kodin 6-shifror"
              maxLength={6}
              className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Fjalëkalimi i Ri
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Krijoni një fjalëkalim të ri"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Konfirmoni Fjalëkalimin
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Shkruani përsëri fjalëkalimin"
              className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
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
                Duke rivendosur...
              </>
            ) : (
              "Rivendos Fjalëkalimin"
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Kujtuat fjalëkalimin?{" "}
              <button
                type="button"
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

export default ResetPassword