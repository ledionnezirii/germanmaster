"use client"

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { authService } from "../services/api"

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const { token } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.")
      return
    }

    if (password.length < 6) {
      setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.")
      return
    }

    setLoading(true)
    setError("")

    try {
await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate("/signin"), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Ndodhi një gabim.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <img
            src="/albanian-language-learning-app-logo.jpg"
            alt="Logo"
            className="w-16 h-16 mx-auto mb-6 rounded-full shadow-lg"
          />

          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl text-white">
            ✅
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-4">Fjalëkalimi u ndryshua!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Fjalëkalimi juaj u rivendos me sukses. Tani mund të hyni me fjalëkalimin e ri.
          </p>
          <div className="bg-green-50 border border-green-400 rounded-lg p-4 mb-8">
            <p className="text-green-600 text-sm m-0">🎉 Do të ridrejtoheni automatikisht në faqen e hyrjes.</p>
          </div>
          <button
            onClick={() => navigate("/signin")}
            className="w-full bg-amber-600 text-white border-none rounded-lg px-4 py-3 text-base font-medium cursor-pointer transition-all hover:bg-amber-700"
          >
            Hyni tani
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/albanian-language-learning-app-logo.jpg"
            alt="Logo"
            className="w-16 h-16 mx-auto mb-6 rounded-full shadow-lg"
          />

          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-xl">
            🔒
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-2">Rivendosni fjalëkalimin</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Shkruani fjalëkalimin tuaj të ri. Sigurohuni që të jetë i fortë dhe i sigurt.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                <span className="text-red-500 mr-3 text-xl">⚠️</span>
                <p className="text-red-600 text-sm m-0">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fjalëkalimi i ri</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Shkruani fjalëkalimin e ri"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl hover:text-gray-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmoni fjalëkalimin</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔒</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmoni fjalëkalimin"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl hover:text-gray-600"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"
              } text-white border-none rounded-lg py-3.5 px-4 text-base font-semibold transition-all flex items-center justify-center mb-4`}
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Duke ruajtur...
                </>
              ) : (
                "Rivendosni fjalëkalimin"
              )}
            </button>

            <div className="text-center">
              <Link to="/signin" className="text-gray-500 no-underline text-sm hover:text-gray-700">
                ← Kthehuni te hyrja
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
