"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { authService } from "../services/api"

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const { token } = useParams()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token)
        setStatus("success")
        setMessage("Email-i juaj u verifikua me sukses! Ju lutemi kthehuni në faqen kryesore.")
      } catch (error) {
        setStatus("error")
        setMessage(error.response?.data?.message || "Gabim gjatë verifikimit të email-it")
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h2 className="text-xl font-semibold text-gray-700 font-sans">Duke verifikuar email-in...</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full text-center">
        {status === "success" ? (
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
        ) : (
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
        )}

        <h1 className={`text-3xl font-bold mb-3 font-sans ${status === "success" ? "text-gray-900" : "text-red-600"}`}>
          {status === "success" ? "Email-i u verifikua!" : "Gabim në Verifikim"}
        </h1>

        <p className="text-gray-600 text-base mb-4 font-sans">
          {status === "success" ? "Email-i juaj u verifikua me sukses!" : message}
        </p>

        {status === "success" && (
          <p className="text-gray-500 text-sm font-sans leading-relaxed">
            Mund ta mbyllni këtë skedë. Faleminderit për konfirmimin e adresës tuaj të email-it.
          </p>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
