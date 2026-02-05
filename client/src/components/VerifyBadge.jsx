import React, { useState } from "react"
import { authService } from "../services/api"

const VerifiedBadge = ({ isVerified, onVerificationRequested }) => {
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequestVerification = async () => {
    setLoading(true)
    try {
      await authService.requestVerification()
      setRequested(true)
      if (onVerificationRequested) {
        onVerificationRequested()
      }
    } catch (error) {
      console.error("Error requesting verification:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Verified Icon */}
      <div className="flex items-center gap-1">
        <svg
          className={`w-5 h-5 ${isVerified ? "text-orange-500" : "text-gray-400"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className={`text-sm font-medium ${isVerified ? "text-orange-500" : "text-gray-400"}`}>
          {isVerified ? "I verifikuar" : "I pa verifikuar"}
        </span>
      </div>

      {/* Verify Email Button - only show if not verified */}
      {!isVerified && !requested && (
        <button
          onClick={handleRequestVerification}
          disabled={loading}
          className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
            loading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-teal-100 text-teal-700 hover:bg-teal-200 cursor-pointer"
          }`}
        >
          {loading ? "Duke dërguar..." : "Verifiko Email"}
        </button>
      )}

      {/* Success message after request */}
      {!isVerified && requested && (
        <span className="ml-2 text-xs text-green-600">
          Kërkesa u dërgua!
        </span>
      )}
    </div>
  )
}

export default VerifiedBadge