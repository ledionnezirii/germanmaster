import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { subscriptionService } from "../services/api"
import { AlertCircle } from "lucide-react"

const SubscriptionGate = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSubscription = async () => {
      const status = await subscriptionService.checkStatus()
      setSubscriptionStatus(status)
      setLoading(false)

      // If subscription expired, redirect to payment
      if (status.expired) {
        setTimeout(() => {
          navigate("/payments")
        }, 5000)
      }
    }

    checkSubscription()

    // Check every minute
    const interval = setInterval(checkSubscription, 60000)

    return () => clearInterval(interval)
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show expiry warning if less than 1 day remaining
  if (subscriptionStatus?.active && subscriptionStatus?.daysRemaining <= 1) {
    return (
      <div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your free trial expires in {subscriptionStatus.daysRemaining} day(s).{" "}
                <button
                  onClick={() => navigate("/payment")}
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  Subscribe now
                </button>{" "}
                to continue using all features.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    )
  }

  // Show expired message
  if (subscriptionStatus?.expired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Free Trial Expired</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your 2-day free trial has ended. Subscribe now to continue learning German!
            </p>
            <button
              onClick={() => navigate("/payment")}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              View Subscription Plans
            </button>
            <p className="text-xs text-gray-400 mt-4">Redirecting to payment page in 3 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default SubscriptionGate