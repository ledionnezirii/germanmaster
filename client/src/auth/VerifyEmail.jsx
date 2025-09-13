"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { authService } from "../services/api"

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(3)
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token)
        setStatus("success")
        setMessage("Email-i juaj u verifikua me sukses!")

        // Start countdown and redirect to login
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              navigate("/signin")
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(timer)
      } catch (error) {
        setStatus("error")
        setMessage(error.response?.data?.message || "Gabim gjatë verifikimit të email-it")
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token, navigate])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-5">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-15 text-center max-w-lg shadow-2xl">
          <img
            src="/albanian-language-learning-app-logo.jpg"
            alt="Logo"
            className="w-20 h-20 mx-auto mb-6 rounded-full shadow-lg"
          />

          <div className="w-15 h-15 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Duke verifikuar email-in...</h2>
          <p className="text-gray-600 text-base">Ju lutemi prisni ndërsa verifikojmë llogarinë tuaj</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-5">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-15 text-center max-w-lg shadow-2xl">
        <img
          src="/albanian-language-learning-app-logo.jpg"
          alt="Logo"
          className="w-20 h-20 mx-auto mb-5 rounded-full shadow-lg"
        />

        {status === "success" ? (
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl">
            ✓
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl">
            ✗
          </div>
        )}

        <h1 className={`text-3xl font-bold mb-4 ${status === "success" ? "text-green-500" : "text-red-500"}`}>
          {status === "success" ? "Email i Verifikuar!" : "Gabim në Verifikim"}
        </h1>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">{message}</p>

        {status === "success" && (
          <div className="bg-teal-50 border border-teal-300 rounded-xl p-5 mb-8">
            <p className="text-teal-800 text-base mb-2.5 font-medium">
              Do të ridrejtoheni automatikisht në faqen e hyrjes në {countdown} sekonda
            </p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-1000 ease-in-out"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/signin")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-xl px-8 py-4 text-base font-semibold cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Vazhdo në Hyrje
        </button>
      </div>
    </div>
  )
}

export default VerifyEmail
