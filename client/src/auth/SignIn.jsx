"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import webLogo from "../../public/gjuhagjermanelogo.png"

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
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
      await login(formData)
      navigate("/")
    } catch (err) {
      const errorMessage = err.response?.data?.message || ""

      if (
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("wrong")
      ) {
        setError("Fjalëkalimi është i pasaktë. Ju lutemi provoni përsëri.")
      } else if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("user not found")
      ) {
        setError("Email-i nuk u gjet. Ju lutemi kontrolloni email-in tuaj.")
      } else if (errorMessage.toLowerCase().includes("verify")) {
        setError("Ju lutemi verifikoni email-in tuaj para se të hyni.")
      } else {
        setError("Hyrja dështoi. Ju lutemi provoni përsëri.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-5 mt-5">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={webLogo}
              alt="Logo"
              className="w-20 h-20 rounded-full shadow-lg object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hyr në llogari</h1>
          <p className="text-gray-600 text-base">Mirë se erdhe përsëri!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresa e email-it</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Shkruani email-in tuaj"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fjalëkalimi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Shkruani fjalëkalimin tuaj"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgotpassword"
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium transition-colors duration-200"
            >
              Keni harruar fjalëkalimin?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-lg text-base font-semibold transition-all duration-200 flex items-center justify-center ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
            } text-white shadow-lg hover:shadow-xl`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Duke u kyçur...
              </>
            ) : (
              "Hyni"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignIn
