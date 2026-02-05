"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../services/api"
import webLogo from "../../public/logo.png"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(
        err.response?.data?.message || "Ndodhi një gabim. Ju lutemi provoni përsëri."
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-2xl border border-white/20 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 text-xl sm:text-2xl">
            ✉️
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-3 sm:mb-4 leading-tight">
            Kontrolloni email-in tuaj
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            Ne kemi dërguar një kod rivendosjeje 6-shifror në{" "}
            <strong className="break-all">{email}</strong>. Ju lutemi shkruani kodin për të
            rivendosur fjalëkalimin tuaj.
          </p>
          <button
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
            className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:from-[#0F9D8E] hover:to-[#0891B2] text-white border-none rounded-lg py-3 sm:py-3.5 px-4 text-sm sm:text-base font-medium cursor-pointer transition-all duration-200 mb-4"
          >
            Shkruani Kodin
          </button>
          <p className="text-gray-600 text-xs sm:text-sm m-0">
            Nuk keni marrë email-in?{" "}
            <button
              onClick={() => setSuccess(false)}
              className="bg-none border-none text-cyan-600 underline cursor-pointer text-xs sm:text-sm hover:text-cyan-700"
            >
              Provoni përsëri
            </button>
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
            Keni harruar fjalëkalimin?
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Shkruani email-in tuaj për të marrë një kod rivendosjeje
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
              <span className="text-red-500 text-lg sm:text-xl shrink-0">⚠️</span>
              <p className="text-red-600 text-xs sm:text-sm m-0 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mb-6 sm:mb-8">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Adresa e email-it
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Shkruani email-in tuaj"
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
                Duke dërguar...
              </>
            ) : (
              "Dërgo kodin"
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

export default ForgotPassword