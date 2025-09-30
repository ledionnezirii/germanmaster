"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import { authService } from "../services/api"

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const { token } = useParams()

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
    } catch (err) {
      setError(err.response?.data?.message || "Ndodhi një gabim.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4 min-h-screen">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl text-white">
            ✅
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-4">
            Fjalëkalimi u verifikua me sukses!
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Fjalëkalimi juaj është rivendosur me sukses mbylleni kete faqe dhe vazdhoni ne faqen kryesore
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4 min-h-screen">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          Rivendosni fjalëkalimin
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Fjalëkalimi i ri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Konfirmoni fjalëkalimin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"
            } text-white py-3 rounded-lg`}
          >
            {loading ? "Duke ruajtur..." : "Rivendosni fjalëkalimin"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
