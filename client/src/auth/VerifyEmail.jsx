"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { authService } from "../services/api"

const VerifyEmail = () => {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useParams()
  
  const email = searchParams.get("email")

  // If there's a token in URL, use old method (auto-verify)
  useEffect(() => {
    if (token) {
      verifyWithToken(token)
    } else {
      setStatus("idle") // Show code input form
    }
  }, [token])

  const verifyWithToken = async (token) => {
    try {
      const response = await authService.verifyEmailToken(token)
      setStatus("success")
      setMessage("Email-i juaj u verifikua me sukses!")
      setTimeout(() => navigate("/signin"), 2000)
    } catch (error) {
      setStatus("error")
      setMessage(error.response?.data?.message || "Token i pavlefshëm ose ka skaduar")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    
    try {
      const response = await authService.verifyEmail(code)
      setStatus("success")
      setMessage("Email-i juaj u verifikua me sukses!")
      setTimeout(() => navigate("/signin"), 2000)
    } catch (error) {
      setStatus("error")
      setMessage(error.response?.data?.message || "Kodi i pavlefshëm")
    }
  }

  if (status === "loading" && token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Duke verifikuar email-in...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Verifikoni Email-in</h1>
        
        {email && (
          <p className="text-gray-600 text-center mb-6">
            Kodi u dërgua në: <strong>{email}</strong>
          </p>
        )}

        {status === "success" ? (
          <div className="text-center">
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
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-gray-500 text-sm">Duke ju drejtuar faqes së hyrjes...</p>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{message}</p>
            <button
              onClick={() => navigate("/signin")}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Kthehu te hyrja
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kodi i Verifikimit
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Shkruani kodin 6-shifror"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {status === "loading" ? "Duke verifikuar..." : "Verifiko"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
