"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { authService } from "../services/api"

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading") // loading, success, error
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <h2 className="text-xl font-semibold">Duke verifikuar email-in...</h2>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        {status === "success" ? (
          <div className="text-green-600 text-3xl mb-4">✓</div>
        ) : (
          <div className="text-red-600 text-3xl mb-4">✗</div>
        )}

        <h1 className={`text-2xl font-bold mb-3 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
          {status === "success" ? "Email i Verifikuar!" : "Gabim në Verifikim"}
        </h1>

        <p className="text-gray-700">{message}</p>

        {status === "success" && (
          <p className="mt-4 text-gray-500 text-sm">
            Mund ta mbyllni këtë tab dhe të vazhdoni në faqen kryesore.
          </p>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
