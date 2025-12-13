"use client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Crown, Clock, Sparkles } from "lucide-react"

const SubscriptionGate = ({ children }) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [showGate, setShowGate] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setShowGate(false)
      return
    }

    // User is logged in, now check subscription
    const subscription = user.subscription || {}
    const hasActiveSubscription = subscription.active === true
    const daysRemaining = subscription.daysRemaining || 0

    // Block only if logged in AND no active subscription AND no trial days
    if (!hasActiveSubscription && daysRemaining <= 0) {
      setShowGate(true)
    } else {
      setShowGate(false)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (showGate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="text-center p-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Subscription Required</h2>
            <p className="text-base mt-2 text-gray-600">
              Your free trial has ended. Upgrade to continue accessing all features.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Premium Features</h4>
                  <p className="text-sm text-gray-600">Access all learning tools and content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Unlimited Practice</h4>
                  <p className="text-sm text-gray-600">No restrictions on your learning</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/payments")}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Crown className="w-4 h-4 mr-2" />
                View Plans & Upgrade
              </button>
              <button
                onClick={() => navigate("/account")}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Manage Account
              </button>
            </div>

            <p className="text-xs text-center text-gray-500">Questions? Contact our support team for assistance.</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default SubscriptionGate
