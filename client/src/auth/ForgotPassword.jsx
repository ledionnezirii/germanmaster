"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { authService } from "../services/api"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await authService.forgotPassword(email)

      if (response.status === 200) {
        setMessage("Email i dërguar me sukses! Kontrollo email-in tënd për udhëzimet.")
        setEmail("")
        setSuccess(true)
      } else {
        setError("Ndodhi një gabim. Provo përsëri.")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Ndodhi një gabim. Provo përsëri.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl">
            📧
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-4 leading-tight">Email-i u dërgua</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Ne kemi dërguar një link për rivendosjen e fjalëkalimit në <strong>{email}</strong>. Ju lutemi kontrolloni
            email-in tuaj dhe ndiqni udhëzimet.
          </p>
          <div className="bg-green-50 border border-green-400 rounded-lg p-4 mb-8">
            <p className="text-green-600 text-sm m-0">
              💡 Link-u do të jetë i vlefshëm për 1 orë. Nuk e gjeni email-in? Kontrolloni dosjen "Spam".
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/signin"
              className="bg-amber-600 text-white no-underline rounded-lg px-4 py-3 text-base font-medium text-center transition-all hover:bg-amber-700"
            >
              Kthehuni te Hyrja
            </Link>
            <button
              onClick={() => setSuccess(false)}
              className="bg-transparent text-gray-500 border-none text-sm cursor-pointer underline hover:text-gray-700"
            >
              Dërgoni email-in përsëri
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-xl">
            🔑
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-2">Keni harruar fjalëkalimin?</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Shkruani email-in tuaj dhe ne do t'ju dërgojmë një link për të rivendosur fjalëkalimin.
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

            {message && (
              <div className="bg-green-50 border border-green-400 rounded-lg p-4 mb-6 flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <p className="text-green-600 text-sm m-0">{message}</p>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresa e email-it</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">📧</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Shkruani email-in tuaj"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 outline-none transition-all focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-700"
              } text-white border-none rounded-lg py-3.5 px-4 text-base font-semibold transition-all flex items-center justify-center mb-4`}
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Duke dërguar...
                </>
              ) : (
                "Dërgo email-in"
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

export default ForgotPassword
