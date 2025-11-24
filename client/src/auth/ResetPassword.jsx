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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-sans">Fjalëkalimi u ndryshua me sukses!</h2>
          <p className="text-gray-600 text-base mb-4 font-sans leading-relaxed">
            Fjalëkalimi juaj është rivendosur me sukses.
          </p>
          <p className="text-gray-500 text-sm font-sans leading-relaxed">
            Mbylleni këtë faqe dhe vazhdoni në faqen kryesore.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF7EC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center font-sans">Set a New Password</h2>
        <p className="text-gray-600 text-sm mb-6 text-center font-sans">
          Please create a new password for your account.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600 text-sm text-center font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 font-sans"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 font-sans"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
          >
            {loading ? "Duke ruajtur..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
